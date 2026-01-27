'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AISettingsForm({ settings, projectId }: { settings: any, projectId: string }) {
    const router = useRouter();
    const [formData, setFormData] = useState(settings || {});
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error('Failed to save');
            router.refresh();
            alert('Settings saved!');
        } catch (error) {
            console.error(error);
            alert('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'general', label: 'Appearance', icon: '🎨' },
        { id: 'model', label: 'Model & Memory', icon: '🧠' },
        { id: 'personality', label: 'Personality', icon: '🎭' },
        { id: 'sales', label: 'Sales & Growth', icon: '📈' },
        { id: 'safety', label: 'Safety & Limits', icon: '🛡️' },
        { id: 'advanced', label: 'Advanced', icon: '⚙️' },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-5xl mx-auto flex flex-col md:flex-row min-h-[600px]">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 p-4">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">Configuration</h2>
                <div className="space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === tab.id
                                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                        >
                            <span className="text-lg">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-3xl">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{tabs.find(t => t.id === activeTab)?.label}</h1>
                            <p className="text-sm text-gray-500 mt-1">Manage your AI agent's behavior and settings</p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium shadow-sm transition-all active:scale-95 flex items-center gap-2"
                        >
                            {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* 🎨 APPEARANCE */}
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <Section title="Widget Style" description="Customize how the chat widget looks on your site.">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input
                                            label="Widget Color"
                                            type="color"
                                            value={formData.widgetColor || '#6366f1'}
                                            onChange={(e: any) => handleChange('widgetColor', e.target.value)}
                                            className="h-12 p-1 w-full cursor-pointer"
                                        />
                                        <Select
                                            label="Position"
                                            value={formData.widgetPosition || 'bottom-right'}
                                            onChange={(e: any) => handleChange('widgetPosition', e.target.value)}
                                            options={[
                                                { label: 'Bottom Right', value: 'bottom-right' },
                                                { label: 'Bottom Left', value: 'bottom-left' },
                                            ]}
                                        />
                                    </div>
                                    <Input
                                        label="Button Text"
                                        value={formData.widgetButtonText || 'Chat with us'}
                                        onChange={(e: any) => handleChange('widgetButtonText', e.target.value)}
                                    />
                                </Section>
                                <Section title="Messaging" description="Initial messages displayed to users.">
                                    <Input
                                        label="Welcome Message"
                                        value={formData.welcomeMessage || ''}
                                        onChange={(e: any) => handleChange('welcomeMessage', e.target.value)}
                                        placeholder="Hello! How can I help you today?"
                                    />
                                    <Input
                                        label="Offline Message"
                                        value={formData.offlineMessage || ''}
                                        onChange={(e: any) => handleChange('offlineMessage', e.target.value)}
                                    />
                                </Section>
                            </div>
                        )}

                        {/* 🧠 MODEL & MEMORY */}
                        {activeTab === 'model' && (
                            <div className="space-y-6">
                                <Section title="AI Engine" description="Configure the underlying AI model parameters.">
                                    <div className="flex items-center justify-between mb-4">
                                        <Label title="Enable AI Responses" subtitle="Turn off to use as a manual-only live chat." />
                                        <Switch checked={formData.aiEnabled ?? true} onChange={(v) => handleChange('aiEnabled', v)} />
                                    </div>
                                    <Select
                                        label="Model Version"
                                        value={formData.aiModel || 'gemini-1.5-flash'}
                                        onChange={(e: any) => handleChange('aiModel', e.target.value)}
                                        options={[
                                            { label: 'Gemini 1.5 Flash (Fastest)', value: 'gemini-1.5-flash' },
                                            { label: 'Gemini 1.5 Pro (Smarter)', value: 'gemini-1.5-pro' },
                                        ]}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Temperature (Creativity)" type="number" step="0.1" min="0" max="1" value={formData.aiTemperature ?? 0.7} onChange={(e: any) => handleChange('aiTemperature', parseFloat(e.target.value))} />
                                        <Input label="Max Tokens" type="number" value={formData.aiMaxTokens ?? 1024} onChange={(e: any) => handleChange('aiMaxTokens', parseInt(e.target.value))} />
                                    </div>
                                </Section>

                                <Section title="Memory & Context" description="How much conversation history the AI remembers.">
                                    <div className="flex items-center justify-between mb-4">
                                        <Label title="Enable Session Memory" subtitle="AI remembers previous messages in current chat." />
                                        <Switch checked={formData.memoryEnabled ?? true} onChange={(v) => handleChange('memoryEnabled', v)} />
                                    </div>
                                    {formData.memoryEnabled && (
                                        <>
                                            <div className="flex items-center justify-between mb-4 pl-4 border-l-2 border-gray-100">
                                                <Label title="Smart Summarization" subtitle="Compress older messages to save context window." />
                                                <Switch checked={formData.memorySummarizationEnabled ?? true} onChange={(v) => handleChange('memorySummarizationEnabled', v)} />
                                            </div>
                                            <div className="flex items-center justify-between mb-4 pl-4 border-l-2 border-gray-100">
                                                <Label title="Cross-Session Memory" subtitle="Remember users when they return (requires user ID)." />
                                                <Switch checked={formData.memoryCrossSessionEnabled ?? false} onChange={(v) => handleChange('memoryCrossSessionEnabled', v)} />
                                            </div>
                                            <Input
                                                label="Max Context Messages"
                                                type="number"
                                                value={formData.memoryMaxMessages ?? 20}
                                                onChange={(e: any) => handleChange('memoryMaxMessages', parseInt(e.target.value))}
                                            />
                                        </>
                                    )}
                                </Section>
                            </div>
                        )}

                        {/* 🎭 PERSONALITY */}
                        {activeTab === 'personality' && (
                            <div className="space-y-6">
                                <Section title="Tone of Voice" description="Define the personality of your AI assistant.">
                                    <Select
                                        label="Response Style"
                                        value={formData.responseStyle || 'friendly'}
                                        onChange={(e: any) => handleChange('responseStyle', e.target.value)}
                                        options={[
                                            { label: 'Friendly & Warm', value: 'friendly' },
                                            { label: 'Professional & Formal', value: 'professional' },
                                            { label: 'Casual & Relaxed', value: 'casual' },
                                            { label: 'Enthusiastic & Energetic', value: 'enthusiastic' },
                                            { label: 'Concise & Direct', value: 'concise' },
                                        ]}
                                    />
                                    <div className="flex items-center justify-between mt-4">
                                        <Label title="Use Emojis" subtitle="Add relevant emojis to responses." />
                                        <Switch checked={formData.useEmojis ?? true} onChange={(v) => handleChange('useEmojis', v)} />
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <Label title="Personalized Greetings" subtitle="Use visitor's name if known." />
                                        <Switch checked={formData.personalizedGreetings ?? true} onChange={(v) => handleChange('personalizedGreetings', v)} />
                                    </div>
                                </Section>

                                <Section title="Proactive Engagement" description="Have the bot initiate conversation automatically.">
                                    <div className="flex items-center justify-between mb-4">
                                        <Label title="Enable Proactive Chat" subtitle="Open chat automatically after delay." />
                                        <Switch checked={formData.proactiveEngagement ?? false} onChange={(v) => handleChange('proactiveEngagement', v)} />
                                    </div>
                                    {formData.proactiveEngagement && (
                                        <div className="pl-4 border-l-2 border-indigo-100 space-y-4">
                                            <Input
                                                label="Delay (Seconds)"
                                                type="number"
                                                value={formData.proactiveDelaySeconds ?? 30}
                                                onChange={(e: any) => handleChange('proactiveDelaySeconds', parseInt(e.target.value))}
                                            />
                                            <Input
                                                label="Initial Message"
                                                value={formData.proactiveMessage || "Hi there! Need any help?"}
                                                onChange={(e: any) => handleChange('proactiveMessage', e.target.value)}
                                            />
                                        </div>
                                    )}
                                </Section>
                            </div>
                        )}

                        {/* 📈 SALES & GROWTH */}
                        {activeTab === 'sales' && (
                            <div className="space-y-6">
                                <Section title="Sales Mode" description="Turn your support bot into a sales agent.">
                                    <div className="flex items-center justify-between mb-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                        <Label title="Enable Sales Mode" subtitle="AI will actively try to convert leads." />
                                        <Switch checked={formData.salesModeEnabled ?? false} onChange={(v) => handleChange('salesModeEnabled', v)} />
                                    </div>
                                    {formData.salesModeEnabled && (
                                        <div className="pl-4 space-y-4">
                                            <Select
                                                label="Aggressiveness"
                                                value={formData.salesAggressiveness || 'subtle'}
                                                onChange={(e: any) => handleChange('salesAggressiveness', e.target.value)}
                                                options={[
                                                    { label: 'Subtle (Helpful but suggestive)', value: 'subtle' },
                                                    { label: 'Moderate (Directly recommends)', value: 'moderate' },
                                                    { label: 'Aggressive (Pushes for close)', value: 'aggressive' },
                                                ]}
                                            />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                                    <Label title="Urgency Tactics" subtitle="Mention limited time/stock." />
                                                    <Switch checked={formData.urgencyTacticsEnabled ?? false} onChange={(v) => handleChange('urgencyTacticsEnabled', v)} />
                                                </div>
                                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                                    <Label title="Upsell Suggestions" subtitle="Suggest premium options." />
                                                    <Switch checked={formData.upsellEnabled ?? false} onChange={(v) => handleChange('upsellEnabled', v)} />
                                                </div>
                                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                                    <Label title="Cross-sell" subtitle="Suggest related products." />
                                                    <Switch checked={formData.crossSellEnabled ?? false} onChange={(v) => handleChange('crossSellEnabled', v)} />
                                                </div>
                                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                                    <Label title="Competitor Comparison" subtitle="Highlight advantages over rivals." />
                                                    <Switch checked={formData.competitorComparisonEnabled ?? false} onChange={(v) => handleChange('competitorComparisonEnabled', v)} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Section>

                                <Section title="Lead Capture" description="Collect visitor contact information.">
                                    <div className="flex items-center justify-between mb-4">
                                        <Label title="Capture Leads" subtitle="Ask for email or phone number." />
                                        <Switch checked={formData.leadCaptureEnabled ?? true} onChange={(v) => handleChange('leadCaptureEnabled', v)} />
                                    </div>
                                    {formData.leadCaptureEnabled && (
                                        <Select
                                            label="Timing"
                                            value={formData.leadCaptureTiming || 'natural'}
                                            onChange={(e: any) => handleChange('leadCaptureTiming', e.target.value)}
                                            options={[
                                                { label: 'Natural Break (Recommended)', value: 'natural' },
                                                { label: 'Start of Chat', value: 'start' },
                                                { label: 'Before Handoff', value: 'handoff' },
                                            ]}
                                        />
                                    )}
                                </Section>
                            </div>
                        )}

                        {/* 🛡️ SAFETY & LIMITS */}
                        {activeTab === 'safety' && (
                            <div className="space-y-6">
                                <Section title="Knowledge Boundaries" description="Control what the AI is allowed to talk about.">
                                    <div className="flex items-center justify-between mb-4">
                                        <Label title="Strict Knowledge Base" subtitle="Only answer questions found in your documents." />
                                        <Switch checked={formData.strictKnowledgeBase ?? true} onChange={(v) => handleChange('strictKnowledgeBase', v)} />
                                    </div>
                                    {!formData.strictKnowledgeBase && (
                                        <div className="flex items-center justify-between mb-4 pl-4 border-l-2 border-yellow-100">
                                            <Label title="Allow General Knowledge" subtitle="Use AI's training for off-topic queries." />
                                            <Switch checked={formData.allowGeneralKnowledge ?? false} onChange={(v) => handleChange('allowGeneralKnowledge', v)} />
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between mb-4">
                                        <Label title="Block Off-Topic Questions" subtitle="Refuse to answer irrelevant queries." />
                                        <Switch checked={formData.blockOffTopicQuestions ?? false} onChange={(v) => handleChange('blockOffTopicQuestions', v)} />
                                    </div>
                                    {formData.blockOffTopicQuestions && (
                                        <Input
                                            label="Refusal Message"
                                            value={formData.offTopicResponse || "I can only help with..."}
                                            onChange={(e: any) => handleChange('offTopicResponse', e.target.value)}
                                        />
                                    )}
                                </Section>

                                <Section title="Human Handoff" description="When to transfer to a real agent.">
                                    <div className="flex items-center justify-between mb-4">
                                        <Label title="Auto Handoff" subtitle="Transfer when AI is unsure." />
                                        <Switch checked={formData.autoHandoffEnabled ?? true} onChange={(v) => handleChange('autoHandoffEnabled', v)} />
                                    </div>
                                    {formData.autoHandoffEnabled && (
                                        <Input
                                            label="Confidence Threshold (0.0 - 1.0)"
                                            type="number"
                                            step="0.05"
                                            value={formData.autoHandoffThreshold ?? 0.5}
                                            onChange={(e: any) => handleChange('autoHandoffThreshold', parseFloat(e.target.value))}
                                        />
                                    )}
                                </Section>

                                <Section title="Sensitive Topics" description="Handling complaints and legal issues.">
                                    <div className="flex items-center justify-between">
                                        <Label title="Detect Sensitive Topics" subtitle="Identify angry users or legal threats." />
                                        <Switch checked={formData.sensitiveTopicDetection ?? true} onChange={(v) => handleChange('sensitiveTopicDetection', v)} />
                                    </div>
                                </Section>
                            </div>
                        )}

                        {/* ⚙️ ADVANCED */}
                        {activeTab === 'advanced' && (
                            <div className="space-y-6">
                                <Section title="System Prompts" description="Advanced overrides for AI behavior.">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt Override</label>
                                            <div className="text-xs text-gray-500 mb-2">⚠ Overwrites generated prompt logic. Use with caution.</div>
                                            <textarea
                                                value={formData.systemPrompt || ''}
                                                onChange={(e) => handleChange('systemPrompt', e.target.value)}
                                                className="w-full h-40 border rounded-lg p-3 text-sm font-mono bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                placeholder="You are a helpful assistant..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Sales Context</label>
                                            <textarea
                                                rows={4}
                                                value={formData.salesPromptAddition || ''}
                                                onChange={(e) => handleChange('salesPromptAddition', e.target.value)}
                                                className="w-full border rounded-lg p-3 text-sm"
                                                placeholder="Specific selling points or promotion details..."
                                            />
                                        </div>
                                    </div>
                                </Section>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// Reusable Components
// ----------------------------------------------------------------------

function Section({ title, description, children }: { title: string, description?: string, children: React.ReactNode }) {
    return (
        <div className="border-b border-gray-100 pb-8 last:border-0 last:pb-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
            {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
            <div className="space-y-4 pt-2">
                {children}
            </div>
        </div>
    );
}

function Label({ title, subtitle }: { title: string, subtitle: string }) {
    return (
        <div>
            <div className="text-sm font-medium text-gray-900">{title}</div>
            <div className="text-xs text-gray-500">{subtitle}</div>
        </div>
    );
}

function Input({ label, className, ...props }: any) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${className || ''}`}
                {...props}
            />
        </div>
    );
}

function Select({ label, options, ...props }: any) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="relative">
                <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm appearance-none bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                    {...props}
                >
                    {options.map((opt: any) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <i className="fas fa-chevron-down text-xs"></i>
                </div>
            </div>
        </div>
    );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (c: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${checked ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
        >
            <span
                className={`${checked ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
        </button>
    );
}

