
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ChannelFactory } from '@/lib/channels/factory';
import { ChannelType } from '@/lib/channels/types';
import { processIncomingMessage } from '@/lib/incoming-handler';

// Force dynamic since we read params and body
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
    const { provider } = await params;
    const searchParams = req.nextUrl.searchParams;

    try {
        const _adapter = ChannelFactory.getAdapter(provider as ChannelType);
        // For verification, we ideally need the specific config.
        // But Meta validates the Webhook URL *once* generally, or per app.
        // We can use a global verify token from ENV for simple verification.

        // Simplification for MVP:
        // If we return the challenge based on a global secret, Meta is happy.
        // We don't necessarily need to look up the specific Project's config here if we trust the Verify Token.
        const mode = searchParams.get('hub.mode');
        const token = searchParams.get('hub.verify_token');
        const challenge = searchParams.get('hub.challenge');

        if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
            console.log('Webhook verified successfully!');
            return new NextResponse(challenge, { status: 200 });
        }

        return new NextResponse('Forbidden', { status: 403 });
    } catch (error) {
        console.error('Webhook GET validation error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
    const { provider } = await params;

    try {
        const body = await req.json();
        console.log(`Received webhook for ${provider}:`, JSON.stringify(body, null, 2));

        let projectId: string | null = null;
        let configFound: any = null;

        // 1. Identify Project based on Payload
        if (provider === 'whatsapp') {
            // Extract Phone Number ID from WhatsApp payload
            const phoneNumberId = body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;

            if (phoneNumberId) {
                const configs = await prisma.channelConfig.findMany({
                    where: { type: 'whatsapp', enabled: true }
                });
                const match = configs.find((c: any) => c.config && c.config.phoneNumberId === phoneNumberId);
                if (match) {
                    projectId = match.projectId;
                    configFound = match.config;
                }
            }
        } else if (provider === 'messenger' || provider === 'instagram') {
            // Extract Page ID / Account ID
            // For Messenger: entry[0].id is the Page ID
            const pageId = body.entry?.[0]?.id;

            if (pageId) {
                const configs = await prisma.channelConfig.findMany({
                    where: { type: provider, enabled: true }
                });
                // We assume config stores 'pageId' or 'instagramId'
                const match = configs.find((c: any) => c.config && (c.config.pageId === pageId || c.config.instagramId === pageId));
                if (match) {
                    projectId = match.projectId;
                    configFound = match.config;
                }
            }
        }

        if (!projectId || !configFound) {
            console.warn(`Could not identify project for ${provider} webhook.`);
            // Return 200 to prevent provider from retrying endlessly
            return new NextResponse('Project not found', { status: 200 });
        }

        // 2. Normalize Message
        const adapter = ChannelFactory.getAdapter(provider as ChannelType);
        const messages = await adapter.handleWebhook(body, configFound);

        // 3. Process Each Message
        for (const msg of messages) {
            await processIncomingMessage(projectId, msg, provider as ChannelType);
        }

        return new NextResponse('EVENT_RECEIVED', { status: 200 });

    } catch (error) {
        console.error(`Webhook processing error (${provider}):`, error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
