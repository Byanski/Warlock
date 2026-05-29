import { StatusPoller } from '../monitoring/statusPoller';
export interface CommandCallbacks {
    reply: (payload: any) => Promise<string | undefined>;
    editReply: (messageId: string, payload: any) => Promise<void>;
    deleteReply: (messageId: string) => Promise<void>;
}
export declare class CommandHandler {
    private client;
    constructor();
    handleMessage(messageContent: string, callbacks?: CommandCallbacks, poller?: StatusPoller): Promise<string | null>;
}
//# sourceMappingURL=commandHandler.d.ts.map