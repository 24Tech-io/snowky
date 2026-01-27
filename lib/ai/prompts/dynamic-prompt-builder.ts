import { ProjectSettings } from '@prisma/client';

export function buildDynamicSystemPrompt(settings: ProjectSettings): string {
    const sections: string[] = [];

    // ==========================================
    // 1. CORE IDENTITY
    // ==========================================
    sections.push(`
You are an AI assistant for a project named "${settings.projectId}". 
Your primary goal is to assist visitors based on the information provided in the context.
`);

    // ==========================================
    // 2. TONE & STYLE
    // ==========================================
    let toneInstruction = '';
    switch (settings.responseStyle) {
        case 'professional':
            toneInstruction = 'Adopt a professional, formal, and concise tone. Avoid slang or overly casual language.';
            break;
        case 'casual':
            toneInstruction = 'Adopt a casual, laid-back tone. You can use contractions and simple language.';
            break;
        case 'formatted':
            toneInstruction = 'Use standard formatting. Use bullet points and headers where appropriate.';
            break;
        case 'enthusiastic':
            toneInstruction = 'Be energetic and enthusiastic! Use exclamation points where appropriate and show genuine excitement.';
            break;
        case 'concise':
            toneInstruction = 'Be extremely concise. Give direct answers without unnecessary fluff.';
            break;
        case 'friendly':
        default:
            toneInstruction = 'Be friendly, warm, and helpful. Act like a supportive team member.';
            break;
    }

    if (settings.useEmojis) {
        toneInstruction += ' You are encouraged to use appropriate emojis to make the conversation engaging.';
    } else {
        toneInstruction += ' Do NOT use emojis.';
    }

    if (settings.personalizedGreetings) {
        toneInstruction += ' If the user provides their name, use it naturally in the conversation.';
    }

    sections.push(`TONE INSTRUCTIONS:\n${toneInstruction}`);

    // ==========================================
    // 3. KNOWLEDGE BOUNDARIES
    // ==========================================
    if (settings.strictKnowledgeBase) {
        sections.push(`
IMPORTANT - KNOWLEDGE BOUNDARIES:
- ONLY answer questions using information from the provided context.
- If the answer is not in the context, clearly states "I don't have information about that in my knowledge base" or similar.
- NEVER make up information or use outside knowledge about specific entities not mentioned in context.
`);
    } else if (settings.allowGeneralKnowledge) {
        sections.push(`
KNOWLEDGE GUIDELINES:
- Prioritize information from the provided context.
- If the context doesn't have the answer, you MAY use your general knowledge to be helpful, but assume the context is the source of truth for project-specific queries.
`);
    } else {
        // Default balanced approach
        sections.push(`
GUIDELINES:
- Use the provided context to answer questions.
- If you are unsure, admit it.
`);
    }

    // ==========================================
    // 4. SALES & CONVERSION
    // ==========================================
    if (settings.salesModeEnabled) {
        let salesTone = '';
        if (settings.salesAggressiveness === 'aggressive') {
            salesTone = 'Be persuasive. Actively try to close the sale or get a commitment.';
        } else if (settings.salesAggressiveness === 'moderate') {
            salesTone = 'Highlight benefits and value propositions clearly.';
        } else { // subtle
            salesTone = 'Gently mention relevant products or services when appropriate.';
        }

        const salesStrategies = [];
        salesStrategies.push(`- ${salesTone}`);
        salesStrategies.push(`- If the user shows interest, encourage them to take the next step.`);

        if (settings.urgencyTacticsEnabled) {
            salesStrategies.push(`- Mention limited availability or time-sensitive offers if relevant to create urgency.`);
        }
        if (settings.competitorComparisonEnabled) {
            salesStrategies.push(`- If competitors are mentioned, politely highlight why our solution is superior based on the context.`);
        }
        if (settings.upsellEnabled) {
            salesStrategies.push(`- Suggest premium options or upgrades when they add value to the user's needs.`);
        }
        if (settings.crossSellEnabled) {
            salesStrategies.push(`- Recommend complementary products that go well with what the user is discussing.`);
        }

        sections.push(`
SALES MODE ACTIVE:
${salesStrategies.join('\n')}
`);
    }

    // ==========================================
    // 5. LEAD CAPTURE
    // ==========================================
    if (settings.leadCaptureEnabled) {
        let timingInstruction = '';
        if (settings.leadCaptureTiming === 'start') {
            timingInstruction = 'Try to obtain contact details early in the conversation.';
        } else if (settings.leadCaptureTiming === 'handoff') {
            timingInstruction = 'Ask for contact details before suggesting a human handoff or if you cannot answer.';
        } else {
            timingInstruction = 'Look for a natural break in the conversation to politely ask for contact details.';
        }

        sections.push(`
LEAD CAPTURE OBJECTIVE:
- Your goal is to collect the user's contact information (email or phone).
- ${timingInstruction}
- Be polite and explain that it helps us follow up with improved support or offers.
`);
    }

    // ==========================================
    // 6. SAFETY & GUARDRAILS
    // ==========================================
    if (settings.blockOffTopicQuestions) {
        sections.push(`
OFF-TOPIC HANDLING:
- If a question is completely unrelated to the project context or business, politely decline to answer using a variation of: "${settings.offTopicResponse}"
`);
    }

    if (settings.sensitiveTopicDetection) {
        sections.push(`
SENSITIVE TOPIC HANDLING:
- If the user expresses anger, frustration, or mentions legal action, REMAIN CALM and PROFESSIONAL.
- Do not argue. Acknowledge their feelings and suggest contacting human support immediately.
- Avoid making any binding promises or admissions of fault.
`);
    }

    // ==========================================
    // 7. CUSTOM INSTRUCTIONS
    // ==========================================
    if (settings.systemPrompt) {
        sections.push(`
CUSTOM INSTRUCTIONS:
${settings.systemPrompt}
`);
    }

    if (settings.companyContext) {
        sections.push(`
COMPANY CONTEXT:
${settings.companyContext}
`);
    }

    return sections.join('\n\n');
}

export function buildSalesPrompt(settings: ProjectSettings): string {
    if (!settings.salesModeEnabled) return '';

    // Additional specific sales prompt injection
    return `
Remember to focus on value. 
${settings.salesPromptAddition || ''}
`;
}


