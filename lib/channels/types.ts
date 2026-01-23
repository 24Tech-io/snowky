
export interface ChannelAdapter {
    /**
     * Verify the webhook (e.g., for Meta's hub.challenge)
     */
    verifyWebhook(params: any, config: any): string | null;

    /**
     * Parse incoming webhook body into standard messages
     */
    handleWebhook(body: any, config: any): Promise<IncomingMessage[]>;

    /**
     * Send a message provided the config
     */
    sendMessage(to: string, content: string, config: any): Promise<void>;
}

export interface IncomingMessage {
    externalId: string;
    from: string; // The user's phone number or ID
    content: string;
    timestamp: Date;
    metadata?: any; // Raw payload or other details
}

export type ChannelType = 'whatsapp' | 'messenger' | 'email' | 'instagram';
