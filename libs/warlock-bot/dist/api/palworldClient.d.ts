export declare class PalworldClient {
    private baseUrl;
    private authHeader;
    constructor(ip: string, port: number, adminPassword: string);
    private request;
    info(): Promise<any>;
    metrics(): Promise<any>;
    settings(): Promise<any>;
    announce(message: string): Promise<any>;
    kick(userid: string, message?: string): Promise<any>;
    ban(userid: string, message?: string): Promise<any>;
    unban(userid: string): Promise<any>;
    save(): Promise<any>;
    shutdown(waittime?: number, message?: string): Promise<any>;
    forceStop(): Promise<any>;
    getPlayers(): Promise<any>;
}
//# sourceMappingURL=palworldClient.d.ts.map