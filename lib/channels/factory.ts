import { ChannelAdapter, ChannelType } from './types';
import { WhatsAppAdapter } from './whatsapp';
import { MessengerAdapter } from './messenger';
import { InstagramAdapter } from './instagram';

export class ChannelFactory {
    static getAdapter(type: ChannelType): ChannelAdapter {
        switch (type) {
            case 'whatsapp':
                return new WhatsAppAdapter();
            case 'messenger':
                return new MessengerAdapter();
            case 'instagram':
                return new InstagramAdapter();
            default:
                throw new Error(`Unsupported channel type: ${type}`);
        }
    }
}
