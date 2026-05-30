export declare class VeinClient {
    private ip;
    private port;
    constructor(ip: string, port?: number);
    private request;
    execute(command: string, args: string): Promise<any>;
}
//# sourceMappingURL=veinClient.d.ts.map