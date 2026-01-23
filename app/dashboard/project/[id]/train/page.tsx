"use client";

import { useState, use } from "react";
import Link from "next/link";


export default function TrainPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const [text, setText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
    const [isTraining, setIsTraining] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: "" });

    const handleTrain = async (e: React.FormEvent) => {
        e.preventDefault();

        if (activeTab === 'text' && !text.trim()) return;
        if (activeTab === 'file' && !file) return;

        setIsTraining(true);
        setStatus({ type: null, message: "" });

        try {
            const formData = new FormData();

            if (activeTab === 'file' && file) {
                formData.append("file", file);
            } else {
                formData.append("text", text);
            }

            const res = await fetch(`/api/projects/${id}/train`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                setStatus({ type: 'success', message: `Successfully trained on ${data.chunksProcessed} chunks! The bot now knows this information.` });
                setText(""); // Clear input
                setFile(null); // Clear file
            } else {
                setStatus({ type: 'error', message: data.error || "Training failed" });
            }
        } catch (err: any) {
            setStatus({ type: 'error', message: "An error occurred during training: " + err.message });
        } finally {
            setIsTraining(false);
        }
    };

    return (
        <div className="dashboard-content">
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Train Your AI</h1>
                    <p className="dashboard-subtitle">Add knowledge to your bot so it can answer specific questions.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link href={`/dashboard/project/${id}`} className="btn btn-secondary">
                        <i className="fas fa-arrow-left"></i> Back to Project
                    </Link>
                </div>
            </div>

            <div className="snippets-section" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h3 className="snippets-title" style={{ marginBottom: '1.5rem' }}>
                    <i className="fas fa-brain" style={{ marginRight: '0.5rem' }}></i> Add Knowledge
                </h3>

                {status.message && (
                    <div style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        background: status.type === 'success' ? '#d1fae5' : '#fee2e2',
                        color: status.type === 'success' ? '#065f46' : '#b91c1c',
                        border: `1px solid ${status.type === 'success' ? '#34d399' : '#fca5a5'}`
                    }}>
                        <i className={`fas ${status.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} style={{ marginRight: '0.5rem' }}></i>
                        {status.message}
                    </div>
                )}

                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '1rem' }}>
                    <button
                        className={`btn ${activeTab === 'text' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('text')}
                        style={{ borderRadius: '8px 8px 0 0', borderBottom: activeTab === 'text' ? '2px solid var(--primary)' : 'none' }}
                    >
                        <i className="fas fa-keyboard" style={{ marginRight: '0.5rem' }}></i> Paste Text
                    </button>
                    <button
                        className={`btn ${activeTab === 'file' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('file')}
                        style={{ borderRadius: '8px 8px 0 0', borderBottom: activeTab === 'file' ? '2px solid var(--primary)' : 'none' }}
                    >
                        <i className="fas fa-file-upload" style={{ marginRight: '0.5rem' }}></i> Upload File
                    </button>
                </div>

                <form onSubmit={handleTrain}>
                    {activeTab === 'text' ? (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Paste Text Content
                            </label>
                            <p style={{ fontSize: '0.9rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
                                Copy and paste FAQs, product details, or any text you want your bot to learn.
                            </p>
                            <textarea
                                className="input-dark"
                                style={{
                                    width: '100%',
                                    minHeight: '300px',
                                    padding: '1rem',
                                    color: '#000',
                                    background: '#fff',
                                    border: '1px solid #e5e7eb',
                                    resize: 'vertical'
                                }}
                                placeholder="e.g., Shipping Policy: We ship within 24 hours. Returns are accepted within 30 days..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                required={activeTab === 'text'}
                            />
                        </div>
                    ) : (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Upload Documents
                            </label>
                            <p style={{ fontSize: '0.9rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
                                Upload PDF, DOCX, or TXT files. We'll automatically extract the text.
                            </p>

                            <div
                                style={{
                                    border: `2px dashed ${isTraining ? 'var(--primary)' : 'var(--gray-300)'}`,
                                    borderRadius: '12px',
                                    padding: '3rem 2rem',
                                    textAlign: 'center',
                                    background: isTraining ? '#eff6ff' : '#f9fafb',
                                    cursor: isTraining ? 'wait' : 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onClick={() => !isTraining && document.getElementById('fileInput')?.click()}
                            >
                                <input
                                    type="file"
                                    id="fileInput"
                                    accept=".pdf,.docx,.txt,.md"
                                    style={{ display: 'none' }}
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    disabled={isTraining}
                                />
                                {isTraining ? (
                                    <div style={{ color: 'var(--primary)' }}>
                                        <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
                                        <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Uploading & Processing...</p>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>Please wait while we analyze your document</p>
                                    </div>
                                ) : (
                                    <>
                                        <i className="fas fa-cloud-upload-alt" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1rem' }}></i>
                                        {file ? (
                                            <div>
                                                <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{file.name}</p>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--gray-500)' }}>{(file.size / 1024).toFixed(1)} KB</p>
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost"
                                                    style={{ color: '#ef4444', marginTop: '1rem' }}
                                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                >
                                                    Remove File
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Click to upload file</p>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--gray-500)' }}>PDF, DOCX, TXT</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isTraining || (activeTab === 'text' ? !text.trim() : !file)}
                            style={{ minWidth: '140px' }}
                        >
                            {isTraining ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> {activeTab === 'file' ? 'Uploading...' : 'Processing...'}
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save"></i> Train Bot
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
