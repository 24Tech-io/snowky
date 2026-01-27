
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
                    enabled: true
                })
            });
            if (res.ok) alert(`${type} Saved successfully!`);
            else alert('Failed to save');
        } catch (e) {
            alert('Error saving');
        }
        setSaving(false);
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return (
        <div className="dashboard-content">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Channel Integrations
                        </h1>
                        <p className="text-gray-500 mt-2">Connect your messaging accounts</p>
                    </div>
                    <Link href={`/dashboard/project/${projectId}`} className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1">
                        <i className="fas fa-arrow-left"></i> Back to Dashboard
                    </Link>
                </header>

                <div className="grid gap-8">
                    {/* WhatsApp Card */}
                    <div className="create-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-2xl">
                                    <i className="fab fa-whatsapp"></i>
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">WhatsApp Cloud API</h2>
                                    <p className="text-sm text-gray-500">Identify users by Phone Number</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-600">{enabled ? 'Active' : 'Disabled'}</span>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="form-label">Phone Number ID</label>
                                <input
                                    type="text"
                                    value={config.phoneNumberId || ''}
                                    onChange={e => setConfig({ ...config, phoneNumberId: e.target.value })}
                                    className="form-input"
                                    placeholder="e.g. 100000000000"
                                />
                            </div>

                            <div>
                                <label className="form-label">Access Token (Permanent)</label>
                                <input
                                    type="password"
                                    value={config.accessToken || ''}
                                    onChange={e => setConfig({ ...config, accessToken: e.target.value })}
                                    className="form-input"
                                    placeholder="EAAG..."
                                />
                                <p className="text-xs text-gray-500 mt-1">Get this from the Meta Developer Dashboard.</p>
                            </div>

                            {/* Webhook Info */}
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mt-6">
                                <h3 className="text-sm font-semibold text-blue-700 mb-2">Webhook Setup</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase tracking-wider">Callback URL</label>
                                        <div className="mt-1">
                                            <code className="bg-white border border-gray-200 px-2 py-1 rounded text-xs text-gray-700 block overflow-auto">
                                                {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/whatsapp` : '/api/webhooks/whatsapp'}
                                            </code>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase tracking-wider">Verify Token</label>
                                        <div className="mt-1">
                                            <code className="bg-white border border-gray-200 px-2 py-1 rounded text-xs text-gray-700 block">
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
                                    className="btn btn-primary"
                                >
                                    {saving ? 'Saving...' : 'Save WhatsApp'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Messenger Card */}
                    <div className="create-card p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl">
                                <i className="fab fa-facebook-messenger"></i>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Facebook Messenger</h2>
                                <p className="text-sm text-gray-500">Connect a Facebook Page</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="form-label">Page ID</label>
                                <input
                                    type="text"
                                    value={msgsConfig.pageId || ''}
                                    onChange={e => setMsgsConfig({ ...msgsConfig, pageId: e.target.value })}
                                    className="form-input"
                                    placeholder="Page ID"
                                />
                            </div>
                            <div>
                                <label className="form-label">Page Access Token</label>
                                <input
                                    type="password"
                                    value={msgsConfig.accessToken || ''}
                                    onChange={e => setMsgsConfig({ ...msgsConfig, accessToken: e.target.value })}
                                    className="form-input"
                                    placeholder="EAA..."
                                />
                            </div>
                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={() => handleSave('messenger')}
                                    disabled={saving}
                                    className="btn btn-primary"
                                >
                                    Save Messenger
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Instagram Card */}
                    <div className="create-card p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center text-2xl">
                                <i className="fab fa-instagram"></i>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Instagram</h2>
                                <p className="text-sm text-gray-500">Connect an Instagram Business Account</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="form-label">Instagram Account ID</label>
                                <input
                                    type="text"
                                    value={igConfig.instagramId || ''}
                                    onChange={e => setIgConfig({ ...igConfig, instagramId: e.target.value })}
                                    className="form-input"
                                    placeholder="IG Account ID"
                                />
                            </div>
                            <div>
                                <label className="form-label">Access Token</label>
                                <input
                                    type="password"
                                    value={igConfig.accessToken || ''}
                                    onChange={e => setIgConfig({ ...igConfig, accessToken: e.target.value })}
                                    className="form-input"
                                    placeholder="EAA..."
                                />
                            </div>
                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={() => handleSave('instagram')}
                                    disabled={saving}
                                    className="btn btn-primary"
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
