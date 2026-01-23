
import { ChannelAdapter, IncomingMessage } from './types';

export class WhatsAppAdapter implements ChannelAdapter {

    verifyWebhook(params: any, config: any): string | null {
        const mode = params['hub.mode'];
        const token = params['hub.verify_token'];
        const challenge = params['hub.challenge'];

        if (mode === 'subscribe' && token === config.verifyToken) {
            return challenge;
        }
        return null;
    }

    async handleWebhook(body: any, _config: any): Promise<IncomingMessage[]> {
        const messages: IncomingMessage[] = [];

        if (body.object === 'whatsapp_business_account') {
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    if (change.value.messages) {
                        for (const msg of change.value.messages) {
                            // Basic Text Message Support
                            if (msg.type === 'text') {
                                messages.push({
                                    externalId: msg.id,
                                    from: msg.from,
                                    content: msg.text.body,
                                    timestamp: new Date(Number(msg.timestamp) * 1000),
                                    metadata: msg
                                });
                            }
                            // TODO: Add support for images, audio etc.
                        }
                    }
                }
            }
        }

        return messages;
    }

    async sendMessage(to: string, content: string, config: any): Promise<void> {
        const url = `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: content }
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`WhatsApp API Error: ${response.status} - ${errorBody}`);
        }
    }
}
