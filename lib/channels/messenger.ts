
import { ChannelAdapter, IncomingMessage } from './types';

export class MessengerAdapter implements ChannelAdapter {
    verifyWebhook(params: any, _config: any): string | null {
        // Meta webhooks use a shared verification logic usually
        // But here we can check the specific verify token if stored
        return params['hub.challenge'];
    }

    async handleWebhook(body: any, _config: any): Promise<IncomingMessage[]> {
        const messages: IncomingMessage[] = [];

        if (body.object === 'page') {
            for (const entry of body.entry) {
                for (const messagingEvent of entry.messaging) {
                    if (messagingEvent.message && messagingEvent.message.text) {
                        const senderId = messagingEvent.sender.id;
                        const messageText = messagingEvent.message.text;

                        // Messenger messages don't always have a timestamp in the top level object in the same way,
                        // usually it's messagingEvent.timestamp (unix ms)
                        const timestamp = new Date(messagingEvent.timestamp || Date.now());

                        messages.push({
                            externalId: messagingEvent.message.mid || `msg_${Date.now()}`,
                            from: senderId,
                            content: messageText,
                            timestamp: timestamp,
                            metadata: {
                                channel: 'messenger',
                                senderName: 'Messenger User', // We'd need another API call to get the name
                                pageId: entry.id
                            }
                        });
                    }
                }
            }
        }

        return messages;
    }

    async sendMessage(to: string, content: string, config: any): Promise<void> {
        if (!config?.accessToken) {
            throw new Error('Messenger: Missing Page Access Token');
        }

        const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${config.accessToken}`;

        const payload = {
            recipient: { id: to },
            message: { text: content },
            messaging_type: "RESPONSE"
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Messenger Send Error: ${err}`);
        }
    }
}
