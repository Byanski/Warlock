"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusPoller = void 0;
const warlockClient_1 = require("../api/warlockClient");
const charts_1 = require("./charts");
class StatusPoller {
    postEmbedCallback;
    history = {};
    failures = {};
    lastStatus = {};
    lastPlayerCount = {};
    overrideStatus = {};
    client;
    // Cache of all discovered services (gameName -> identifiers)
    serviceCache = {};
    constructor(postEmbedCallback) {
        this.postEmbedCallback = postEmbedCallback;
        this.client = new warlockClient_1.WarlockClient();
    }
    setOverrideStatus(gameName, status) {
        this.overrideStatus[gameName] = status;
        this.lastStatus[gameName] = '';
    }
    getServiceByName(gameName) {
        return this.serviceCache[gameName.toLowerCase()];
    }
    async pollAllServices(intervalMs = 30000) {
        try {
            // console.log(`[StatusPoller] Fetching all services from Warlock API...`);
            const response = await this.client.getAllServices();
            if (!response || !response.success || !Array.isArray(response.services)) {
                throw new Error('Failed to fetch services or invalid response format.');
            }
            for (const serviceObj of response.services) {
                const gameName = serviceObj.service.toLowerCase();
                // Cache the identifiers for command handling
                this.serviceCache[gameName] = {
                    guid: serviceObj.guid,
                    host: serviceObj.host,
                    service: serviceObj.service,
                    name: gameName
                };
                await this.processServiceStatus(gameName, serviceObj);
            }
        }
        catch (err) {
            console.error('[StatusPoller] Error fetching services from Warlock API:', err.message);
        }
        finally {
            setTimeout(() => {
                this.pollAllServices(intervalMs);
            }, intervalMs);
        }
    }
    async processServiceStatus(gameName, serviceData) {
        try {
            let status = serviceData.status || 'UNKNOWN';
            let isRecovering = false;
            const prevFailures = this.failures[gameName] || 0;
            if (prevFailures > 0) {
                isRecovering = true;
                console.log(`[StatusPoller] Connection to Warlock restored for ${gameName}.`);
            }
            this.failures[gameName] = 0; // Reset failures
            if (this.overrideStatus[gameName]) {
                status = this.overrideStatus[gameName];
            }
            let playerCount = 0;
            if (status === 'running' || status === 'ONLINE') {
                if (serviceData.player_count !== undefined) {
                    playerCount = serviceData.player_count;
                }
                else if (serviceData.players && Array.isArray(serviceData.players)) {
                    playerCount = serviceData.players.length;
                }
            }
            if (!this.history[gameName]) {
                this.history[gameName] = [];
            }
            const now = new Date();
            const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
            const hist = this.history[gameName];
            if (hist) {
                hist.push({ time: timeStr, count: playerCount });
            }
            if (hist && hist.length > 15) {
                hist.shift();
            }
            const justFailed = prevFailures === 1;
            const labels = (hist || []).map(h => h.time);
            const dataPoints = (hist || []).map(h => h.count);
            const chartUrl = charts_1.ChartGenerator.generatePlayerChart(labels, dataPoints, serviceData.name || gameName);
            let titleStr = `🎮 ${(serviceData.name || gameName).toUpperCase()} Server Status`;
            if (justFailed)
                titleStr += ` [API DISCONNECTED]`;
            if (isRecovering)
                titleStr += ` [API RESTORED]`;
            let descriptionText = `**Status:** ${status === 'running' || status === 'ONLINE' ? '🟢 Online' : (status === 'OFFLINE' ? '🔴 Offline' : `🟡 ${status}`)}\n`;
            let embedFields = [];
            if (status === 'running' || status === 'ONLINE') {
                const ipPort = serviceData.ip ? `${serviceData.ip}:${serviceData.port || ''}` : 'Unknown';
                const players = serviceData.player_count !== undefined ? `${serviceData.player_count}/${serviceData.max_players || '?'}` : '0';
                const memory = serviceData.memory_usage ? (serviceData.memory_usage > 1024 ? `${(serviceData.memory_usage / 1024).toFixed(2)} GB` : `${serviceData.memory_usage} MB`) : 'N/A';
                const cpu = serviceData.cpu_usage !== undefined ? `${serviceData.cpu_usage}%` : 'N/A';
                const responseTime = serviceData.response_time || 'N/A';
                embedFields = [
                    { name: '🔌 Connection', value: `\`${ipPort}\``, inline: true },
                    { name: '👥 Players', value: `\`${players}\``, inline: true },
                    { name: '⏱️ Ping', value: `\`${responseTime}\``, inline: true },
                    { name: '🧠 Memory', value: `\`${memory}\``, inline: true },
                    { name: '⚙️ CPU', value: `\`${cpu}\``, inline: true },
                    { name: '🎮 Server', value: `\`${serviceData.name || gameName}\``, inline: true }
                ];
            }
            const embedPayload = {
                embeds: [{
                        title: titleStr,
                        description: descriptionText,
                        fields: embedFields.length > 0 ? embedFields : undefined,
                        color: status === 'ONLINE' || status === 'running' ? 0x57F287 : 0xED4245,
                        image: { url: chartUrl },
                        footer: { text: 'Warlock Monitor' },
                        timestamp: new Date().toISOString()
                    }]
            };
            await this.postEmbedCallback(gameName, embedPayload);
        }
        catch (err) {
            console.error(`[StatusPoller] Error processing status for ${gameName}:`, err);
        }
    }
    startPolling(intervalMs = 30000) {
        this.pollAllServices(intervalMs);
    }
}
exports.StatusPoller = StatusPoller;
//# sourceMappingURL=statusPoller.js.map