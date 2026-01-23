"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Document {
    id: string;
    name: string;
    type: string;
    contentPreview: string;
    contentLength: number;
    embeddingCount: number;
    embeddingStatus: "pending" | "complete" | "failed";
    createdAt: string;
}

interface QAPair {
    question: string;
    answer: string;
}

export default function DocumentsPage() {
    const params = useParams();
    const projectId = params.id as string;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<"list" | "upload" | "url" | "qa" | "text">("list");

    // Upload states
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [textContent, setTextContent] = useState("");
    const [uploading, setUploading] = useState(false);

    // URL scraping states
    const [urlInput, setUrlInput] = useState("");
    const [scrapingUrl, setScrapingUrl] = useState(false);

    // Q&A states
    const [qaPairs, setQaPairs] = useState<QAPair[]>([{ question: "", answer: "" }]);
    const [savingQA, setSavingQA] = useState(false);

    const fetchDocuments = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/projects/${projectId}/documents`);
            if (!res.ok) throw new Error("Failed to fetch documents");
            const data = await res.json();
            setDocuments(data.documents || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleDelete = async (docId: string) => {
        if (!confirm("Are you sure you want to delete this document? This cannot be undone.")) {
            return;
        }

        try {
            const res = await fetch(`/api/projects/${projectId}/documents?docId=${docId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete document");
            setDocuments(documents.filter(d => d.id !== docId));
        } catch (err: any) {
            alert("Error deleting document: " + err.message);
        }
    };

    const handleUpload = async () => {
        if (!uploadFile && !textContent.trim()) {
            alert("Please select a file or enter text content");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            if (uploadFile) formData.append("file", uploadFile);
            if (textContent.trim()) formData.append("text", textContent);

            const res = await fetch(`/api/projects/${projectId}/train`, {
                method: "POST",
                body: formData
            });

            if (!res.ok) throw new Error("Upload failed");

            alert("Document uploaded successfully!");
            setUploadFile(null);
            setTextContent("");
            setActiveTab("list");
            fetchDocuments();
        } catch (err: any) {
            alert("Error uploading: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleScrapeUrl = async () => {
        if (!urlInput.trim()) {
            alert("Please enter a URL");
            return;
        }

        setScrapingUrl(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/documents/url`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: urlInput })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to scrape URL");

            alert(`Successfully scraped ${data.contentLength} characters from URL!`);
            setUrlInput("");
            setActiveTab("list");
            fetchDocuments();
        } catch (err: any) {
            alert("Error scraping URL: " + err.message);
        } finally {
            setScrapingUrl(false);
        }
    };

    const addQAPair = () => {
        setQaPairs([...qaPairs, { question: "", answer: "" }]);
    };

    const removeQAPair = (index: number) => {
        setQaPairs(qaPairs.filter((_, i) => i !== index));
    };

    const updateQAPair = (index: number, field: "question" | "answer", value: string) => {
        const updated = [...qaPairs];
        updated[index][field] = value;
        setQaPairs(updated);
    };

    const handleSaveQA = async () => {
        const validPairs = qaPairs.filter(p => p.question.trim() && p.answer.trim());
        if (validPairs.length === 0) {
            alert("Please add at least one complete Q&A pair");
            return;
        }

        setSavingQA(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/documents/qa`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pairs: validPairs })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save Q&A pairs");

            alert(`Successfully saved ${data.pairsProcessed} Q&A pairs!`);
            setQaPairs([{ question: "", answer: "" }]);
            setActiveTab("list");
            fetchDocuments();
        } catch (err: any) {
            alert("Error saving Q&A pairs: " + err.message);
        } finally {
            setSavingQA(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "application/pdf": return "📄";
            case "url": return "🌐";
            case "qa": return "❓";
            case "text": return "📝";
            default: return "📁";
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "complete":
                return <span style={{ background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem" }}>✓ Synced</span>;
            case "pending":
                return <span style={{ background: "#fef3c7", color: "#d97706", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem" }}>⏳ Pending</span>;
            case "failed":
                return <span style={{ background: "#fecaca", color: "#dc2626", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem" }}>✗ Failed</span>;
            default:
                return null;
        }
    };

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "2rem" }}>
                <Link href={`/dashboard/project/${projectId}`} style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#64748b",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    marginBottom: "1rem"
                }}>
                    <i className="fas fa-arrow-left"></i> Back to Project
                </Link>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.5rem" }}>
                    📚 Training Documents
                </h1>
                <p style={{ color: "#64748b" }}>
                    Manage the knowledge base that powers your AI assistant
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
                {[
                    { id: "list", label: "📋 All Documents", count: documents.length },
                    { id: "upload", label: "📤 Upload File", count: documents.filter(d => d.type === 'file' || (d.type !== 'url' && d.type !== 'qa' && d.type !== 'text')).length },
                    { id: "text", label: "📝 Input Text", count: documents.filter(d => d.type === 'text').length },
                    { id: "url", label: "🌐 Add URL", count: documents.filter(d => d.type === 'url').length },
                    { id: "qa", label: "❓ Q&A Pairs", count: documents.filter(d => d.type === 'qa').length }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                            padding: "0.75rem 1.25rem",
                            borderRadius: "8px",
                            border: "none",
                            background: activeTab === tab.id ? "#6366f1" : "transparent",
                            color: activeTab === tab.id ? "white" : "#64748b",
                            cursor: "pointer",
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                        }}
                    >
                        {tab.label}
                        {tab.count !== undefined && (
                            <span style={{
                                background: activeTab === tab.id ? "rgba(255,255,255,0.2)" : "#e2e8f0",
                                padding: "2px 8px",
                                borderRadius: "12px",
                                fontSize: "0.75rem"
                            }}>{tab.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === "list" && (
                <div>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                            Loading documents...
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: "center", padding: "3rem", color: "#ef4444" }}>
                            Error: {error}
                        </div>
                    ) : documents.length === 0 ? (
                        <div style={{
                            textAlign: "center",
                            padding: "4rem",
                            background: "#f8fafc",
                            borderRadius: "12px",
                            border: "2px dashed #e2e8f0"
                        }}>
                            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
                            <h3 style={{ color: "#1e293b", marginBottom: "0.5rem" }}>No documents yet</h3>
                            <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
                                Add training data to teach your AI assistant about your business
                            </p>
                            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                                <button onClick={() => setActiveTab("upload")} style={btnStyle}>
                                    📤 Upload File
                                </button>
                                <button onClick={() => setActiveTab("text")} style={btnStyle}>
                                    📝 Input Text
                                </button>
                                <button onClick={() => setActiveTab("url")} style={btnStyle}>
                                    🌐 Add URL
                                </button>
                                <button onClick={() => setActiveTab("qa")} style={btnStyle}>
                                    ❓ Add Q&A
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {documents.map(doc => (
                                <div key={doc.id} style={{
                                    background: "white",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "12px",
                                    padding: "1.25rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "1rem"
                                }}>
                                    <div style={{ fontSize: "2rem" }}>{getTypeIcon(doc.type)}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                                            <strong style={{ color: "#1e293b" }}>{doc.name}</strong>
                                            {getStatusBadge(doc.embeddingStatus)}
                                        </div>
                                        <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>
                                            {doc.contentLength.toLocaleString()} chars • {doc.embeddingCount} embeddings • Added {new Date(doc.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        style={{
                                            background: "#fef2f2",
                                            border: "1px solid #fecaca",
                                            color: "#dc2626",
                                            padding: "0.5rem 1rem",
                                            borderRadius: "8px",
                                            cursor: "pointer"
                                        }}
                                    >
                                        <i className="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "upload" && (
                <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "2rem" }}>
                    <h3 style={{ marginBottom: "1.5rem", color: "#1e293b" }}>Upload a File</h3>

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: "2px dashed #e2e8f0",
                            borderRadius: "12px",
                            padding: "3rem",
                            textAlign: "center",
                            cursor: "pointer",
                            marginBottom: "1.5rem",
                            background: uploadFile ? "#f0fdf4" : "#f8fafc"
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,.txt,.csv,.json"
                            style={{ display: "none" }}
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        />
                        {uploadFile ? (
                            <>
                                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</div>
                                <p style={{ color: "#16a34a", fontWeight: 500 }}>{uploadFile.name}</p>
                                <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Click to change file</p>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📁</div>
                                <p style={{ color: "#1e293b", fontWeight: 500 }}>Click to select a file</p>
                                <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Supports PDF, DOCX, TXT, CSV, JSON</p>
                            </>
                        )}
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={uploading || !uploadFile}
                        style={{
                            ...btnPrimaryStyle,
                            opacity: uploading || !uploadFile ? 0.5 : 1
                        }}
                    >
                        {uploading ? "Uploading..." : "📤 Upload & Train"}
                    </button>
                </div>
            )}

            {activeTab === "text" && (
                <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "2rem" }}>
                    <h3 style={{ marginBottom: "1.5rem", color: "#1e293b" }}>Add Text Content</h3>
                    <div style={{ marginBottom: "1.5rem" }}>
                        <p style={{ color: "#64748b", marginBottom: "0.5rem" }}>
                            Paste your FAQ, documentation, or any text content here:
                        </p>
                        <textarea
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                            placeholder="Enter text to train your AI..."
                            style={{
                                width: "100%",
                                minHeight: "250px",
                                padding: "1rem",
                                borderRadius: "8px",
                                border: "1px solid #e2e8f0",
                                resize: "vertical",
                                fontFamily: "inherit"
                            }}
                        />
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={uploading || !textContent.trim()}
                        style={{
                            ...btnPrimaryStyle,
                            opacity: uploading || !textContent.trim() ? 0.5 : 1
                        }}
                    >
                        {uploading ? "Processing..." : "📝 Add Text Content"}
                    </button>
                </div>
            )}

            {activeTab === "url" && (
                <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "2rem" }}>
                    <h3 style={{ marginBottom: "0.5rem", color: "#1e293b" }}>Scrape Content from URL</h3>
                    <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
                        Enter a webpage URL and we'll extract the text content automatically
                    </p>

                    <div style={{ marginBottom: "1.5rem" }}>
                        <input
                            type="url"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="https://example.com/faq"
                            style={{
                                width: "100%",
                                padding: "1rem",
                                borderRadius: "8px",
                                border: "1px solid #e2e8f0",
                                fontSize: "1rem"
                            }}
                        />
                    </div>

                    <button
                        onClick={handleScrapeUrl}
                        disabled={scrapingUrl || !urlInput.trim()}
                        style={{
                            ...btnPrimaryStyle,
                            opacity: scrapingUrl || !urlInput.trim() ? 0.5 : 1
                        }}
                    >
                        {scrapingUrl ? "Scraping..." : "🌐 Scrape & Add"}
                    </button>
                </div>
            )}

            {activeTab === "qa" && (
                <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "2rem" }}>
                    <h3 style={{ marginBottom: "0.5rem", color: "#1e293b" }}>Add Q&A Pairs</h3>
                    <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
                        Structured Q&A pairs work great for FAQs and common questions
                    </p>

                    {qaPairs.map((pair, index) => (
                        <div key={index} style={{
                            background: "#f8fafc",
                            borderRadius: "8px",
                            padding: "1rem",
                            marginBottom: "1rem"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                                <span style={{ fontWeight: 600, color: "#1e293b" }}>Q&A #{index + 1}</span>
                                {qaPairs.length > 1 && (
                                    <button
                                        onClick={() => removeQAPair(index)}
                                        style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}
                                    >
                                        <i className="fas fa-times"></i> Remove
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                value={pair.question}
                                onChange={(e) => updateQAPair(index, "question", e.target.value)}
                                placeholder="Question: e.g., What are your business hours?"
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "6px",
                                    border: "1px solid #e2e8f0",
                                    marginBottom: "0.5rem"
                                }}
                            />
                            <textarea
                                value={pair.answer}
                                onChange={(e) => updateQAPair(index, "answer", e.target.value)}
                                placeholder="Answer: e.g., We're open Monday to Friday, 9 AM to 5 PM."
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "6px",
                                    border: "1px solid #e2e8f0",
                                    minHeight: "80px",
                                    resize: "vertical"
                                }}
                            />
                        </div>
                    ))}

                    <button
                        onClick={addQAPair}
                        style={{
                            background: "transparent",
                            border: "2px dashed #e2e8f0",
                            borderRadius: "8px",
                            padding: "1rem",
                            width: "100%",
                            cursor: "pointer",
                            color: "#64748b",
                            marginBottom: "1.5rem"
                        }}
                    >
                        <i className="fas fa-plus"></i> Add Another Q&A Pair
                    </button>

                    <button
                        onClick={handleSaveQA}
                        disabled={savingQA}
                        style={{
                            ...btnPrimaryStyle,
                            opacity: savingQA ? 0.5 : 1
                        }}
                    >
                        {savingQA ? "Saving..." : "💾 Save Q&A Pairs"}
                    </button>
                </div>
            )}
        </div>
    );
}

const btnStyle: React.CSSProperties = {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 500
};

const btnPrimaryStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "white",
    border: "none",
    padding: "1rem 2rem",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "1rem"
};
