import { WarlockClient } from '../api/warlockClient';
export interface ServiceInstance {
    guid: string;
    host: string;
    service: string;
    name: string;
}
export declare class StatusPoller {
    private postEmbedCallback;
    private history;
    private failures;
    private lastStatus;
    private lastPlayerCount;
    private overrideStatus;
    client: WarlockClient;
    private serviceCache;
    constructor(postEmbedCallback: (gameName: string, embedPayload: any) => Promise<void>);
    setOverrideStatus(gameName: string, status: string | null): void;
    getServiceByName(name: string): ServiceInstance | undefined;
    getAllKnownServices(): ServiceInstance[];
    pollAllServices(intervalMs?: number): Promise<void>;
    private processServiceStatus;
    startPolling(intervalMs?: number): void;
}
//# sourceMappingURL=statusPoller.d.ts.map