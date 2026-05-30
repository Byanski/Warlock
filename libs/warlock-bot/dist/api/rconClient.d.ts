export declare class GenericRconClient {
    private rconParams;
    constructor(ip: string, port: number, password: string);
    executeCommand(command: string): Promise<string>;
}
//# sourceMappingURL=rconClient.d.ts.map