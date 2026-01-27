'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProjectSettingsPage() {
    const params = useParams();
    const projectId = params.id as string;
    const router = useRouter();

    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [tone, setTone] = useState('');
    const [color, setColor] = useState('#6366f1');
    const [showLauncher, setShowLauncher] = useState(true);

    useEffect(() => {
        fetch(`/api/projects?id=${projectId}`) // Assuming api/projects returns list, we filter. Or better api/projects/${id}
            .then(res => res.json())
            .then(data => {
                // If the API returns an array, find the project. If it returns object, use it.
                // Based on previous code: fetch('/api/projects') returns all.
                // Let's assume we can fetch specific project or find it.
                const found = Array.isArray(data) ? data.find((p: any) => p.id === projectId) : data;
                if (found) {
                    setProject(found);
                    setName(found.name);
                    setTone(found.tone);
                    setColor(found.color || '#6366f1');
                    setShowLauncher(found.showFloatingLauncher ?? true);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [projectId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    tone,
                    color,
                    showFloatingLauncher: showLauncher
                })
            });

            if (res.ok) {
                alert('Settings saved!');
                router.refresh();
            } else {
                throw new Error('Failed to save');
            }
        } catch (e) {
            alert('Error saving settings');
        }
        setSaving(false);
    };

    if (loading) return <div className="dashboard-content text-center py-10">Loading...</div>;
    if (!project) return <div className="dashboard-content text-center py-10">Project not found</div>;

    return (
        <div className="dashboard-content">
            <div className="mb-8">
                <Link href={`/dashboard/project/${projectId}`} className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1 mb-4">
                    <i className="fas fa-arrow-left"></i> Back to Project
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">
                    ⚙️ Project Settings
                </h1>
            </div>

            <div className="custom-scrollbar" style={{ display: 'grid', gap: '2rem', maxWidth: '800px' }}>
                <div className="create-card p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">General Settings</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="form-label">Project Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="form-label">AI Personality / Tone</label>
                            <select
                                className="form-input"
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                            >
                                <option value="professional">Professional 👔</option>
                                <option value="friendly">Friendly 😊</option>
                                <option value="casual">Casual ✌️</option>
                                <option value="funny">Funny 😄</option>
                                <option value="formal">Formal 🎩</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label">Brand Color</label>
                            <div className="flex gap-3">
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="h-10 w-20 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    className="form-input flex-1"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-700">Show Floating Launcher</span>
                                <span className="text-sm text-gray-500">Show the chat bubble on your website</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showLauncher}
                                    onChange={(e) => setShowLauncher(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="pt-4 border-t border-gray-100 mt-4 text-right">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn btn-primary"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="create-card p-6 border border-red-100 bg-red-50">
                    <h2 className="text-xl font-semibold mb-2 text-red-700">Danger Zone</h2>
                    <p className="text-gray-600 mb-4 text-sm">Deleting your project is irreversible.</p>
                    <button className="btn bg-red-600 text-white hover:bg-red-700 border-none">
                        Delete Project
                    </button>
                </div>
            </div>
        </div>
    );
}
