"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VeinClient = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
class VeinClient {
    ip;
    port;
    constructor(ip, port = 4726) {
        this.ip = ip;
        this.port = port;
    }
    async request(endpoint) {
        const url = `http://${this.ip}:${this.port}${endpoint}`;
        try {
            const res = await (0, node_fetch_1.default)(url, { method: 'GET', timeout: 5000 });
            if (!res.ok) {
                throw new Error(`VEIN API Error: ${res.status} ${res.statusText}`);
            }
            const text = await res.text();
            return text ? JSON.parse(text) : { success: true };
        }
        catch (err) {
            throw new Error(`VEIN connection failed: ${err.message}`);
        }
    }
    async execute(command, args) {
        switch (command) {
            case 'status': return this.request('/status');
            case 'players': return this.request(args ? `/players/${args.trim()}` : '/players');
            case 'characters': return this.request(args ? `/characters/${args.trim()}` : '/characters');
            case 'time': return this.request('/time');
            case 'weather': return this.request('/weather');
            default:
                throw new Error(`Unknown VEIN command: ${command}`);
        }
    }
}
exports.VeinClient = VeinClient;
//# sourceMappingURL=veinClient.js.map