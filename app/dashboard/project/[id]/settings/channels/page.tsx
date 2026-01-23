
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ChannelSettingsPage() {
    const params = useParams();
    const projectId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<any>({});
    const [msgsConfig, setMsgsConfig] = useState<any>({});
    const [igConfig, setIgConfig] = useState<any>({});
    const [enabled, setEnabled] = useState(true);

    useEffect(() => {
        fetch(`/api/projects/${projectId}/channels`)
            .then(res => res.json())
            .then(data => {
                // Find configs
                const wa = data.find((c: any) => c.type === 'whatsapp');
                if (wa) {
                    setConfig(wa.config || {});
                    setEnabled(wa.enabled);
                }
                const ms = data.find((c: any) => c.type === 'messenger');
                if (ms) setMsgsConfig(ms.config || {});

                const ig = data.find((c: any) => c.type === 'instagram');
                if (ig) setIgConfig(ig.config || {});

                setLoading(false);
            });
    }, [projectId]);

    const handleSave = async (type: string) => {
        setSaving(true);
        let currentConfig = {};
        if (type === 'whatsapp') currentConfig = config;
        if (type === 'messenger') currentConfig = msgsConfig;
        if (type === 'instagram') currentConfig = igConfig;

        try {
            const res = await fetch(`/api/projects/${projectId}/channels`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    config: currentConfig,
                    enabled: true // Always enable on save for now
                })
            });
            if (res.ok) alert(`${type} Saved successfully!`);
            else alert('Failed to save');
        } catch (e) {
            alert('Error saving');
        }
        setSaving(false);
    };

    if (loading) return <div className="p-8 text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Channel Integrations
                        </h1>
                        <p className="text-slate-400 mt-2">Connect your messaging accounts</p>
                    </div>
                    <Link href={`/dashboard/project/${projectId}`} className="text-sm text-slate-400 hover:text-white transition-colors">
                        ← Back to Dashboard
                    </Link>
                </header>

                <div className="grid gap-8">
                    {/* WhatsApp Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                                    <span className="text-2xl">📱</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">WhatsApp Cloud API</h2>
                                    <p className="text-sm text-slate-400">Identify users by Phone Number</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                    <span className="ml-3 text-sm font-medium text-slate-300">{enabled ? 'Active' : 'Disabled'}</span>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* ... WhatsApp fields ... */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Phone Number ID</label>
                                <input
                                    type="text"
                                    value={config.phoneNumberId || ''}
                                    onChange={e => setConfig({ ...config, phoneNumberId: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="e.g. 100000000000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Access Token (Permanent)</label>
                                <input
                                    type="password"
                                    value={config.accessToken || ''}
                                    onChange={e => setConfig({ ...config, accessToken: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="EAAG..."
                                />
                                <p className="text-xs text-slate-500 mt-1">Get this from the Meta Developer Dashboard.</p>
                            </div>

                            {/* Webhook Info for WhatsApp */}
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mt-6">
                                <h3 className="text-sm font-semibold text-blue-400 mb-2">Webhook Setup</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 uppercase tracking-wider">Callback URL</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <code className="bg-slate-950 px-2 py-1 rounded text-xs text-slate-300 flex-1 overflow-auto">
                                                {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/whatsapp` : '/api/webhooks/whatsapp'}
                                            </code>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 uppercase tracking-wider">Verify Token</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <code className="bg-slate-950 px-2 py-1 rounded text-xs text-slate-300 flex-1">
                                                snowky_verify_token
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={() => handleSave('whatsapp')}
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save WhatsApp'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Messenger Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                <span className="text-2xl">💬</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">Facebook Messenger</h2>
                                <p className="text-sm text-slate-400">Connect a Facebook Page</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Page ID</label>
                                <input
                                    type="text"
                                    value={msgsConfig.pageId || ''}
                                    onChange={e => setMsgsConfig({ ...msgsConfig, pageId: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Page ID"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Page Access Token</label>
                                <input
                                    type="password"
                                    value={msgsConfig.accessToken || ''}
                                    onChange={e => setMsgsConfig({ ...msgsConfig, accessToken: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="EAA..."
                                />
                            </div>
                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={() => handleSave('messenger')}
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    Save Messenger
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Instagram Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center border border-pink-500/20">
                                <span className="text-2xl">📸</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">Instagram</h2>
                                <p className="text-sm text-slate-400">Connect an Instagram Business Account</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Instagram Account ID (or Page ID linked)</label>
                                <input
                                    type="text"
                                    value={igConfig.instagramId || ''}
                                    onChange={e => setIgConfig({ ...igConfig, instagramId: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="IG Account ID"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Access Token</label>
                                <input
                                    type="password"
                                    value={igConfig.accessToken || ''}
                                    onChange={e => setIgConfig({ ...igConfig, accessToken: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="EAA..."
                                />
                            </div>
                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={() => handleSave('instagram')}
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    Save Instagram
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
