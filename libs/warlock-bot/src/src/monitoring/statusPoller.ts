import { WarlockClient } from '../api/warlockClient';
import { ChartGenerator } from './charts';

export interface ServiceInstance {
  guid: string;
  host: string;
  service: string;
  name: string;
}

export class StatusPoller {
  private history: Record<string, { time: string, count: number }[]> = {};
  private failures: Record<string, number> = {};
  private lastStatus: Record<string, string> = {};
  private lastPlayerCount: Record<string, number> = {};
  private overrideStatus: Record<string, string | null> = {};
  public client: WarlockClient;
  
  // Cache of all discovered services (gameName -> identifiers)
  private serviceCache: Record<string, ServiceInstance> = {};

  constructor(private postEmbedCallback: (gameName: string, embedPayload: any) => Promise<void>) {
    this.client = new WarlockClient();
  }

  public setOverrideStatus(gameName: string, status: string | null) {
    this.overrideStatus[gameName] = status;
    this.lastStatus[gameName] = ''; 
  }

  public getServiceByName(gameName: string): ServiceInstance | undefined {
    return this.serviceCache[gameName.toLowerCase()];
  }

  public async pollAllServices(intervalMs: number = 30000) {
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

    } catch (err: any) {
      console.error('[StatusPoller] Error fetching services from Warlock API:', err.message);
    } finally {
      setTimeout(() => {
        this.pollAllServices(intervalMs);
      }, intervalMs);
    }
  }

  private async processServiceStatus(gameName: string, serviceData: any) {
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
        status = this.overrideStatus[gameName]!;
      }

      let playerCount = 0;
      if (status === 'running' || status === 'ONLINE') {
        if (serviceData.player_count !== undefined) {
          playerCount = serviceData.player_count;
        } else if (serviceData.players && Array.isArray(serviceData.players)) {
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
      const chartUrl = ChartGenerator.generatePlayerChart(labels, dataPoints, serviceData.name || gameName);

      let titleStr = `🎮 ${(serviceData.name || gameName).toUpperCase()} Server Status`;
      if (justFailed) titleStr += ` [API DISCONNECTED]`;
      if (isRecovering) titleStr += ` [API RESTORED]`;

      let descriptionText = `**Status:** ${status === 'running' || status === 'ONLINE' ? '🟢 Online' : (status === 'OFFLINE' ? '🔴 Offline' : `🟡 ${status}`)}\n`;
      let embedFields: any[] = [];

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

    } catch (err) {
      console.error(`[StatusPoller] Error processing status for ${gameName}:`, err);
    }
  }

  public startPolling(intervalMs: number = 30000) {
    this.pollAllServices(intervalMs);
  }
}
