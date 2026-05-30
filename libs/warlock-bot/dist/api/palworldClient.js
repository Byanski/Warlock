"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PalworldClient = void 0;
class PalworldClient {
    baseUrl;
    authHeader;
    constructor(ip, port, adminPassword) {
        this.baseUrl = `http://${ip}:${port}/v1/api`;
        const token = Buffer.from(`admin:${adminPassword}`).toString('base64');
        this.authHeader = `Basic ${token}`;
    }
    async request(endpoint, method = 'POST', body) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: {
                'Authorization': this.authHeader,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        try {
            const res = await fetch(url, options);
            if (!res.ok) {
                throw new Error(`Palworld REST API Error: ${res.status} ${res.statusText}`);
            }
            const text = await res.text();
            return text ? JSON.parse(text) : { success: true };
        }
        catch (err) {
            throw new Error(`Failed to contact Palworld REST API: ${err.message}`);
        }
    }
    async info() {
        return this.request('/info', 'GET');
    }
    async metrics() {
        return this.request('/metrics', 'GET');
    }
    async settings() {
        return this.request('/settings', 'GET');
    }
    async announce(message) {
        return this.request('/announce', 'POST', { message });
    }
    async kick(userid, message) {
        return this.request('/kick', 'POST', { userid, message });
    }
    async ban(userid, message) {
        return this.request('/ban', 'POST', { userid, message });
    }
    async unban(userid) {
        return this.request('/unban', 'POST', { userid });
    }
    async save() {
        return this.request('/save', 'POST');
    }
    async shutdown(waittime = 60, message) {
        return this.request('/shutdown', 'POST', { waittime, message });
    }
    async forceStop() {
        return this.request('/force_stop', 'POST');
    }
    async getPlayers() {
        return this.request('/players', 'GET');
    }
}
exports.PalworldClient = PalworldClient;
//# sourceMappingURL=palworldClient.js.map