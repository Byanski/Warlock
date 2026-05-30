"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericRconClient = void 0;
const rcon_client_1 = require("rcon-client");
class GenericRconClient {
    rconParams;
    constructor(ip, port, password) {
        this.rconParams = {
            host: ip,
            port: port,
            password: password,
            timeout: 5000
        };
    }
    async executeCommand(command) {
        let rcon = null;
        try {
            rcon = await rcon_client_1.Rcon.connect(this.rconParams);
            const response = await rcon.send(command);
            return response || 'Command executed successfully (no output).';
        }
        catch (err) {
            throw new Error(`RCON connection failed: ${err.message}`);
        }
        finally {
            if (rcon) {
                rcon.end();
            }
        }
    }
}
exports.GenericRconClient = GenericRconClient;
//# sourceMappingURL=rconClient.js.map