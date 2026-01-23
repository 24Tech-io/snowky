
import { ChannelAdapter, IncomingMessage } from './types';

export class InstagramAdapter implements ChannelAdapter {
    verifyWebhook(params: any, _config: any): string | null {
        // Shared Meta verification
        return params['hub.challenge'];
    }

    async handleWebhook(body: any, config: any): Promise<IncomingMessage[]> {
        const messages: IncomingMessage[] = [];

        if (body.object === 'instagram') {
            for (const entry of body.entry) {
                for (const messagingEvent of entry.messaging) {
                    if (messagingEvent.message && messagingEvent.message.text) {
                        const senderId = messagingEvent.sender.id;
                        const messageText = messagingEvent.message.text;
                        const timestamp = new Date(messagingEvent.timestamp || Date.now());

                        messages.push({
                            externalId: messagingEvent.message.mid || `msg_${Date.now()}`,
                            from: senderId,
                            content: messageText,
                            timestamp: timestamp,
                            metadata: {
                                channel: 'instagram',
                                senderName: 'Instagram User',
                                pageId: entry.id // IG Account ID
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
            throw new Error('Instagram: Missing Access Token');
        }

        // Note: For IG, we usually use the IG Business Account ID as the 'me' equivalent if using page token
        // But 'me/messages' on Graph API with Page Token often works for linked IG accounts if scoped correctly.
        // Better: Use specific endpoint if we had the IG Business ID stored.
        // For MVP: Assuming the access token is valid for the IG User.

        const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${config.accessToken}`;

        const payload = {
            recipient: { id: to },
            message: { text: content }
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Instagram Send Error: ${err}`);
        }
    }
}
