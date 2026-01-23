"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    tone: string;
    color: string;
    theme: string;
    messages: number;
    satisfaction: string;
    emojiUsage: string;
    botName: string;
    welcomeMessage: string;
    chatIcon: string;
    launcherColor: string;
    launcherShape: string;
    createdAt: string;
}

interface QAPair {
    question: string;
    answer: string;
}

export default function CreateProjectPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [isDragOver, setIsDragOver] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        manualContent: "",
        tone: "friendly",
        color: "#6366f1",
        theme: "modern",
        botName: "",
        welcomeMessage: "",
        chatIcon: "fas fa-comment-dots",
        launcherColor: "#6366f1",
        launcherShape: "circle",
        emojiUsage: "medium"
    });

    const [uploadedFiles, setUploadedFiles] = useState<{ name: string, size: string }[]>([]);
    const [activeTab, setActiveTab] = useState<"files" | "url" | "qa" | "text">("files");
    const [urlInput, setUrlInput] = useState("");
    const [qaPairs, setQaPairs] = useState<QAPair[]>([{ question: "", answer: "" }]);

    const [generatedProjectId, setGeneratedProjectId] = useState("");
    const [customColor, setCustomColor] = useState("#6366f1");

    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [_isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setGeneratedProjectId("SNOWKY_" + Math.random().toString(36).substring(7).toUpperCase());
    }, []);

    const steps = [
        { title: "Basic Info", step: 1 },
        { title: "Add Data", step: 2 },
        { title: "Customize", step: 3 },
        { title: "Get Code", step: 4 },
    ];

    // Extended themes with visual descriptions
    const themes = [
        { id: 'modern', name: 'Modern', icon: '✨', description: 'Clean lines, gradient header, rounded corners' },
        { id: 'classic', name: 'Classic', icon: '🏛️', description: 'Traditional style, solid colors, square edges' },
        { id: 'minimal', name: 'Minimal', icon: '⚪', description: 'Ultra clean, thin borders, subtle shadows' },
        { id: 'bubble', name: 'Bubble', icon: '💬', description: 'Playful bubbles, soft colors, floating effect' },
        { id: 'glassmorphism', name: 'Glass', icon: '🔮', description: 'Frosted glass, blur effect, transparency' },
        { id: 'neon', name: 'Neon', icon: '💜', description: 'Dark mode, glowing accents, vibrant colors' },
        { id: 'retro', name: 'Retro', icon: '📺', description: 'Vintage vibes, bold borders, pixel-perfect' },
        { id: 'nature', name: 'Nature', icon: '🌿', description: 'Earthy tones, organic shapes, calming' },
    ];

    // Extended AI personalities
    const tones = [
        { id: "friendly", emoji: "😊", name: "Friendly", description: "Warm and welcoming" },
        { id: "professional", emoji: "👔", name: "Professional", description: "Business-like and formal" },
        { id: "formal", emoji: "🎩", name: "Formal", description: "Very proper and courteous" },
        { id: "casual", emoji: "✌️", name: "Casual", description: "Relaxed and easygoing" },
        { id: "funny", emoji: "😄", name: "Funny", description: "Humorous and witty" },
        { id: "empathetic", emoji: "💝", name: "Empathetic", description: "Understanding and caring" },
        { id: "enthusiastic", emoji: "🎉", name: "Enthusiastic", description: "Excited and energetic" },
        { id: "concise", emoji: "⚡", name: "Concise", description: "Brief and to the point" },
        { id: "helpful", emoji: "🤝", name: "Helpful", description: "Eager to assist" },
        { id: "creative", emoji: "🎨", name: "Creative", description: "Imaginative solutions" },
    ];

    // Extended preset colors
    const colors = [
        "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444",
        "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
        "#06b6d4", "#a855f7", "#1e293b"
    ];

    const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
    const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            addFiles(e.target.files);
        }
    };

    const addFiles = (files: FileList) => {
        const newFiles = Array.from(files).map(file => ({
            name: file.name,
            size: (file.size / 1024).toFixed(2) + " KB"
        }));
        setUploadedFiles([...uploadedFiles, ...newFiles]);
        setPendingFiles([...pendingFiles, ...Array.from(files)]);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
        }
    };

    const removeFile = (index: number) => {
        setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
        setPendingFiles(pendingFiles.filter((_, i) => i !== index));
    };

    const handleFinish = async () => {
        setIsSubmitting(true);

        try {
            // 1. Create Project
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.details || 'Failed to create project');
            }

            const project = await res.json();

            // 2. Train with data (Files, URL, Q&A)
            try {
                // Upload files if any
                // Upload files and/or text content
                if (pendingFiles.length > 0 || formData.manualContent.trim()) {
                    const uploadFormData = new FormData();
                    pendingFiles.forEach(file => {
                        uploadFormData.append('file', file);
                    });
                    if (formData.manualContent.trim()) {
                        uploadFormData.append('text', formData.manualContent);
                    }

                    await fetch(`/api/projects/${project.id}/train`, {
                        method: 'POST',
                        body: uploadFormData
                    });
                }

                // Scrape URL if provided
                if (urlInput.trim()) {
                    await fetch(`/api/projects/${project.id}/documents/url`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: urlInput })
                    });
                }

                // Save Q&A pairs if any
                const validPairs = qaPairs.filter(p => p.question.trim() && p.answer.trim());
                if (validPairs.length > 0) {
                    await fetch(`/api/projects/${project.id}/documents/qa`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pairs: validPairs })
                    });
                }
            } catch (trainError) {
                console.error("Training failed partly or fully:", trainError);
                // We don't block navigation, just log it
            }

            router.push('/dashboard');
        } catch (error) {
            console.error("Error creating project:", error);
            alert("Failed to create project. Please try again.");
            setIsSubmitting(false);
        }
    };

    // Theme-specific preview styles with unique animations and effects
    const getThemeStyles = () => {
        const baseStyles: any = { transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden' };

        switch (formData.theme) {
            case 'classic':
                // Traditional corporate style with subtle elegance
                return {
                    ...baseStyles,
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
                    border: '1px solid #d1d5db',
                    background: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)'
                };
            case 'minimal':
                // Ultra-clean, barely-there design
                return {
                    ...baseStyles,
                    borderRadius: '16px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    border: '1px solid #f3f4f6',
                    background: '#ffffff'
                };
            case 'bubble':
                // Playful, bouncy, organic shape with floating animation
                return {
                    ...baseStyles,
                    borderRadius: '28px 28px 8px 28px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1)',
                    animation: 'float 5s ease-in-out infinite',
                    background: 'linear-gradient(135deg, #ffffff 0%, #fef3f2 100%)',
                    border: '2px solid rgba(255,255,255,0.8)'
                };
            case 'glassmorphism':
                // Frosted glass with rainbow shimmer
                return {
                    ...baseStyles,
                    borderRadius: '24px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.3) 100%)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.25), inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(0,0,0,0.05)'
                };
            case 'neon':
                // Cyberpunk dark mode with glowing edges
                return {
                    ...baseStyles,
                    borderRadius: '4px',
                    background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
                    border: `2px solid ${formData.color}`,
                    boxShadow: `0 0 30px ${formData.color}40, 0 0 60px ${formData.color}20, inset 0 1px 0 rgba(255,255,255,0.05)`,
                    animation: 'pulse-glow 3s ease-in-out infinite'
                };
            case 'retro':
                // 8-bit pixel art style with hard shadows
                return {
                    ...baseStyles,
                    borderRadius: '0',
                    border: '4px solid #000',
                    boxShadow: '8px 8px 0 #000',
                    transform: 'translate(-4px, -4px)',
                    background: 'linear-gradient(180deg, #fef08a 0%, #fde047 100%)'
                };
            case 'nature':
                // Organic, earthy feel with leaf-like shape
                return {
                    ...baseStyles,
                    borderRadius: '24px 24px 4px 24px',
                    background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)',
                    border: '2px solid #86efac',
                    boxShadow: '0 10px 30px rgba(34, 197, 94, 0.15), 0 4px 6px rgba(0,0,0,0.05)',
                    animation: 'float 8s ease-in-out infinite'
                };
            default: // modern
                // Sleek, premium gradient with depth
                return {
                    ...baseStyles,
                    borderRadius: '20px',
                    boxShadow: `0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1), 0 0 40px ${formData.color}15`,
                    background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
                    border: '1px solid rgba(0,0,0,0.05)'
                };
        }
    };

    const availableIcons = [
        "fas fa-comment-dots", "fas fa-comment-alt", "fas fa-comments",
        "fas fa-robot", "fas fa-headset", "fas fa-paper-plane",
        "fas fa-sparkles", "fas fa-bolt", "fas fa-heart", "fas fa-star"
    ];

    // Generate preview welcome message based on personality and emoji usage
    const getPreviewWelcomeMessage = () => {
        const personality = tones.find(t => t.id === formData.tone);
        const emoji = personality?.emoji || '😊';

        // Personality-specific base messages
        const personalityMessages: Record<string, { none: string, minimal: string, medium: string, expressive: string, maximum: string }> = {
            friendly: {
                none: "Hello. I'm here to help you. What can I do for you today?",
                minimal: "Hello! I'm your assistant. How can I help? 👋",
                medium: `Hi there! ${emoji} I'm your friendly helper and I'd love to assist you today! What's on your mind?`,
                expressive: `Hey there! ${emoji} So glad you're here! ${emoji} I'm excited to help you today! ✨ What can I do for you?`,
                maximum: `Hey hey! ${emoji}${emoji} Welcome welcome! 🎉✨ I'm SO thrilled you're here! 💬 What amazing thing can I help you with today? 🚀💫`
            },
            professional: {
                none: "Good day. I am your assistant. How may I assist you?",
                minimal: "Good day. I'm here to assist you. How may I help? 👔",
                medium: `Good day! ${emoji} I'm your professional assistant, ready to provide thorough and reliable support. How may I assist you?`,
                expressive: `Welcome! ${emoji} I'm delighted to be your professional assistant! ${emoji} I'm fully prepared to help you succeed. How may I assist? ✨`,
                maximum: `Wonderful to meet you! ${emoji}${emoji} I'm your dedicated professional assistant! 📊✨ Let's achieve great things together! 💼🎯 How may I serve you?`
            },
            casual: {
                none: "Hey. What's up? Need help with something?",
                minimal: "Hey there! Need a hand with anything? 👋",
                medium: `Hey hey! ${emoji} What's up? I'm here to help out - just ask me anything, no stress!`,
                expressive: `Yo! ${emoji} What's going on? ${emoji} Super chill vibes here - I'm totally here to help! ✨ What do you need?`,
                maximum: `Yooo! ${emoji}${emoji} What's good, friend? 🎉✨ I'm here and ready to help with whatever! 💬🔥 Hit me with your questions!`
            },
            enthusiastic: {
                none: "Welcome! I'm excited to help you today. What would you like to know?",
                minimal: "Hi there! Ready to help you out! 🌟",
                medium: `WOW, hello! ${emoji} I'm absolutely THRILLED to meet you! I can't wait to help - what can I do for you?`,
                expressive: `OMG HI! ${emoji} I'm SO incredibly EXCITED you're here! ${emoji} This is going to be great! ✨ What can I help you with?!`,
                maximum: `HELLO THERE! ${emoji}${emoji} OH WOW this is AMAZING! 🎉✨🚀 I literally CAN'T WAIT to help you! 💪🔥 Let's DO THIS! 💫`
            },
            empathetic: {
                none: "Hello. I'm here for you. Please feel free to share what's on your mind.",
                minimal: "Hello there. I'm here to help whenever you're ready. 💙",
                medium: `Hi there. ${emoji} I genuinely care about helping you. Take your time - I'm here to listen and support you however I can.`,
                expressive: `Hello, friend. ${emoji} I truly care about you and I'm here to help. ${emoji} Please know you can share anything with me. 💕 How can I support you?`,
                maximum: `Hi there, dear friend. ${emoji}${emoji} My heart goes out to you! 💕✨ I'm completely here for YOU! 🤗 Please tell me everything - how can I help? 💫🌈`
            },
            witty: {
                none: "Well, look who's here. How can I help you today?",
                minimal: "Ah, hello there! What brings you my way? 😏",
                medium: `Well, well! ${emoji} Someone interesting just arrived! I've been waiting for a clever person like you. What's on your mind?`,
                expressive: `Oh hello there! ${emoji} Plot twist: I'm actually here to help! ${emoji} Shocking, I know! ✨ So what puzzle shall we solve today?`,
                maximum: `Well, well, WELL! ${emoji}${emoji} The legend FINALLY arrives! 🎭✨ I've been practicing my wit just for you! 🎩💫 How may I dazzle you?`
            },
            formal: {
                none: "Greetings. I am at your service. How may I be of assistance?",
                minimal: "Good day. I am pleased to be of service. 🎩",
                medium: `Greetings and salutations! ${emoji} I am most honored to serve you today. How may I be of assistance to you?`,
                expressive: `Good day to you! ${emoji} I am most honored by your distinguished presence. ${emoji} It is my privilege to assist you. ✨ How may I serve?`,
                maximum: `Most distinguished greetings! ${emoji}${emoji} It is my profound honor and privilege to serve you! 👑✨ I am at your complete disposal! 🎩💎 How may I assist?`
            },
            playful: {
                none: "Hi there! Ready to have some fun while getting things done?",
                minimal: "Hiya! Let's do something fun! 🎮",
                medium: `Wheee! ${emoji} Hello hello! I'm SO ready to have fun with you! What kind of adventure are we going on today?`,
                expressive: `HIYA! ${emoji} Ooh ooh, pick me pick me! ${emoji} I wanna help SO badly! ✨ What exciting thing are we doing today?!`,
                maximum: `WHEEEEE! ${emoji}${emoji} YAY YOU'RE HERE! 🎈🎉 This is gonna be SO much fun! 🚀🌈 What awesome adventure awaits us?! 💫✨`
            },
            concise: {
                none: "Hello. How can I help?",
                minimal: "Hi. What do you need? 👍",
                medium: `Hey! ${emoji} I'm ready to help. What do you need?`,
                expressive: `Hey! ${emoji} Ready and waiting! ${emoji} What's up?`,
                maximum: `Hi! ${emoji}${emoji} Let's go! 🎯 Ready! 🚀`
            },
            storyteller: {
                none: "A new tale begins... What story shall we explore together?",
                minimal: "Ah, a new chapter awaits us. What shall we discover? 📖",
                medium: `Ah, welcome traveler! ${emoji} Every magnificent story starts with a single question. What tale shall we weave together today?`,
                expressive: `Once upon a time... ${emoji} A curious soul sought answers! ${emoji} And so our grand story begins! ✨ What quest brings you here, brave one?`,
                maximum: `*clears throat dramatically* ${emoji}${emoji} AND SO THE EPIC TALE BEGINS! 📖✨ Our legendary adventure awaits! 🏰⚔️ What glorious quest brings you here? 💫🐉`
            }
        };
        const messages = personalityMessages[formData.tone] || personalityMessages.friendly;
        return messages[formData.emojiUsage as keyof typeof messages] || messages.medium;
    };

    // Prevent body scroll to avoid double scrollbars
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    return (
        <div
            className={currentStep === 2 ? 'hide-scrollbar' : ''}
            style={{
                height: 'calc(100vh - 72px)',
                position: 'relative',
                overflow: currentStep === 1 ? 'hidden' : 'auto'
            }}>
            {/* Left Sidebar - Fixed */}
            <div style={{
                position: 'fixed',
                top: '60px',
                left: 0,
                width: '220px',
                height: 'calc(100vh - 60px)',
                background: 'white',
                borderRight: '1px solid #e2e8f0',
                padding: '1.5rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                zIndex: 100
            }}>
                <Link href="/dashboard" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#64748b',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    marginBottom: '1rem'
                }}>
                    <i className="fas fa-arrow-left"></i> Dashboard
                </Link>

                {
                    steps.map((s, i) => (
                        <div
                            key={s.step}
                            onClick={() => i < currentStep && setCurrentStep(s.step)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                cursor: i < currentStep ? 'pointer' : 'default',
                                background: currentStep === s.step ? '#f0f9ff' : 'transparent',
                                borderLeft: currentStep === s.step ? '3px solid #6366f1' : '3px solid transparent'
                            }}
                        >
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: currentStep > s.step ? '#10b981' : currentStep === s.step ? '#6366f1' : '#e2e8f0',
                                color: currentStep >= s.step ? 'white' : '#94a3b8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: 600
                            }}>
                                {currentStep > s.step ? <i className="fas fa-check"></i> : s.step}
                            </div>
                            <span style={{
                                fontSize: '0.9rem',
                                fontWeight: currentStep === s.step ? 600 : 400,
                                color: currentStep === s.step ? '#1e293b' : '#64748b'
                            }}>
                                {s.title}
                            </span>
                        </div>
                    ))
                }
            </div >

            {/* Main Content - With left margin and bottom padding for fixed elements */}
            < div style={{
                marginLeft: '220px',
                paddingBottom: '80px',
                background: 'white',
                minHeight: 'calc(100vh - 60px)',
                overflow: currentStep <= 2 ? 'hidden' : 'auto'
            }}>
                {/* Content Area */}
                < div style={{ padding: '1.5rem 2rem' }}>
                    {/* Step 1: Basic Info */}
                    {
                        currentStep === 1 && (
                            <div className="create-step">
                                <div className="create-step-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                    <div className="step-icon-wrapper" style={{
                                        width: '80px',
                                        height: '80px',
                                        fontSize: '2.5rem',
                                        margin: '0 auto 1rem',
                                        background: 'linear-gradient(135deg, #e0f2fe 0%, #ddd6fe 100%)',
                                        borderRadius: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <span>🚀</span>
                                    </div>
                                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
                                        Let&apos;s start with the basics
                                    </h2>
                                    <p style={{ color: '#64748b', fontSize: '1rem' }}>
                                        Give your new AI assistant an identity
                                    </p>
                                </div>

                                <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                            Project Name <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. My Support Bot"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            style={{ width: '100%' }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '0' }}>
                                        <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                            Description <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
                                        </label>
                                        <textarea
                                            className="form-textarea"
                                            placeholder="What is this bot for?"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            style={{ width: '100%', minHeight: '100px' }}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* Step 2: Add Data */}
                    {
                        currentStep === 2 && (
                            <div className="create-step">
                                <div className="create-step-header" style={{ marginBottom: '1.5rem' }}>
                                    <div className="step-icon-wrapper" style={{ width: '64px', height: '64px', fontSize: '2rem' }}>
                                        <span className="step-icon">🧠</span>
                                    </div>
                                    <h2 className="step-title" style={{ fontSize: '1.5rem' }}>Train your AI</h2>
                                    <p className="step-subtitle">Upload documents, scrape URLs, or add Q&A to teach your bot</p>
                                </div>

                                {/* Tabs */}
                                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
                                    {[
                                        { id: "files", label: "📤 Upload Files" },
                                        { id: "text", label: "📝 Input Text" },
                                        { id: "url", label: "🌐 Scrape URL" },
                                        { id: "qa", label: "❓ Q&A Pairs" }
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
                                                gap: "0.5rem",
                                                transition: "all 0.2s"
                                            }}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Files Tab */}
                                {activeTab === "files" && (
                                    <>
                                        <div
                                            className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            style={{ cursor: 'pointer', padding: '2rem 1.5rem' }}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                className="upload-input"
                                                onChange={handleFileUpload}
                                                accept=".pdf,.docx,.txt,.csv,.json"
                                                style={{ display: 'none' }}
                                            />
                                            <div style={{ pointerEvents: 'none' }}>
                                                <i className="fas fa-cloud-upload-alt upload-icon"></i>
                                                <h3 className="upload-title">Click or drag files here</h3>
                                                <p className="upload-subtitle">Support PDF, DOCX, TXT, CSV, JSON</p>
                                            </div>
                                        </div>

                                        {uploadedFiles.length > 0 && (
                                            <div className="uploaded-files" style={{ marginTop: '0.75rem' }}>
                                                {uploadedFiles.map((file, idx) => (
                                                    <div key={idx} className="uploaded-file">
                                                        <i className="far fa-file-alt"></i>
                                                        <span>{file.name} ({file.size})</span>
                                                        <button onClick={() => removeFile(idx)} className="btn-icon"><i className="fas fa-trash"></i></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Text Tab */}
                                {activeTab === "text" && (
                                    <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "2rem" }}>
                                        <h3 style={{ marginBottom: "0.5rem", color: "#1e293b", fontSize: "1.1rem" }}>Add Text Content</h3>
                                        <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                                            Paste your FAQ, documentation, or any text content here
                                        </p>
                                        <textarea
                                            value={formData.manualContent}
                                            onChange={(e) => setFormData({ ...formData, manualContent: e.target.value })}
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
                                )}

                                {/* URL Tab */}
                                {activeTab === "url" && (
                                    <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "2rem" }}>
                                        <h3 style={{ marginBottom: "0.5rem", color: "#1e293b", fontSize: "1.1rem" }}>Scrape Content from URL</h3>
                                        <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                                            Enter a webpage URL and we'll extract the text content automatically
                                        </p>
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
                                )}

                                {/* Q&A Tab */}
                                {activeTab === "qa" && (
                                    <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
                                        <h3 style={{ marginBottom: "0.5rem", color: "#1e293b", fontSize: "1.1rem" }}>Add Q&A Pairs</h3>
                                        <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                                            Structured Q&A pairs for FAQs
                                        </p>

                                        {qaPairs.map((pair, index) => (
                                            <div key={index} style={{
                                                background: "white",
                                                borderRadius: "8px",
                                                padding: "1rem",
                                                marginBottom: "1rem",
                                                border: "1px solid #e2e8f0"
                                            }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                                                    <span style={{ fontWeight: 600, color: "#1e293b" }}>Q&A #{index + 1}</span>
                                                    {qaPairs.length > 1 && (
                                                        <button
                                                            onClick={() => setQaPairs(qaPairs.filter((_, i) => i !== index))}
                                                            style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={pair.question}
                                                    onChange={(e) => {
                                                        const newPairs = [...qaPairs];
                                                        newPairs[index].question = e.target.value;
                                                        setQaPairs(newPairs);
                                                    }}
                                                    placeholder="Question..."
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
                                                    onChange={(e) => {
                                                        const newPairs = [...qaPairs];
                                                        newPairs[index].answer = e.target.value;
                                                        setQaPairs(newPairs);
                                                    }}
                                                    placeholder="Answer..."
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
                                            onClick={() => setQaPairs([...qaPairs, { question: "", answer: "" }])}
                                            style={{
                                                background: "transparent",
                                                border: "2px dashed #94a3b8",
                                                borderRadius: "8px",
                                                padding: "0.75rem",
                                                width: "100%",
                                                cursor: "pointer",
                                                color: "#64748b",
                                                fontWeight: 500
                                            }}
                                        >
                                            <i className="fas fa-plus"></i> Add Another Q&A Pair
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {/* Step 3: Customize */}
                    {
                        currentStep === 3 && (
                            <div className="create-step">
                                <div className="create-step-header" style={{ marginBottom: '1.5rem' }}>
                                    <div className="step-icon-wrapper" style={{ width: '64px', height: '64px', fontSize: '2rem' }}>
                                        <span className="step-icon">🎨</span>
                                    </div>
                                    <h2 className="step-title" style={{ fontSize: '1.5rem' }}>Make it yours</h2>
                                    <p className="step-subtitle">Customize the look and feel of your widget</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
                                    {/* Customization Options */}
                                    <div>
                                        {/* Bot Identity */}
                                        <h4 style={{ marginBottom: '1rem', fontWeight: 600 }}>Bot Identity</h4>
                                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                            <label className="form-label" style={{ fontSize: '0.9rem' }}>Bot Name (Displayed in Header)</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="e.g. Snowky Assistant"
                                                value={formData.botName}
                                                onChange={(e) => setFormData({ ...formData, botName: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                                            <label className="form-label" style={{ fontSize: '0.9rem' }}>Welcome Message</label>
                                            <textarea
                                                className="form-textarea"
                                                rows={3}
                                                placeholder="e.g. Hello! How can I help you today?"
                                                value={formData.welcomeMessage}
                                                onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                                            ></textarea>
                                        </div>

                                        {/* Widget Theme */}
                                        <h4 style={{ marginBottom: '1rem', fontWeight: 600 }}>Widget Theme</h4>
                                        <div className="tone-grid-create" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                                            {themes.map(theme => (
                                                <button
                                                    key={theme.id}
                                                    onClick={() => setFormData({ ...formData, theme: theme.id })}
                                                    className={`tone-option ${formData.theme === theme.id ? 'selected' : ''}`}
                                                    title={theme.description}
                                                >
                                                    <span className="tone-option-emoji">{theme.icon}</span>
                                                    <span className="tone-option-name">{theme.name}</span>
                                                    {formData.theme === theme.id && <div className="tone-option-check"><i className="fas fa-check"></i></div>}
                                                </button>
                                            ))}
                                        </div>

                                        {/* AI Personality */}
                                        <h4 style={{ marginBottom: '1rem', marginTop: '1.5rem', fontWeight: 600 }}>AI Personality</h4>
                                        <div className="tone-grid-create" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                                            {tones.map(tone => (
                                                <button
                                                    key={tone.id}
                                                    onClick={() => setFormData({ ...formData, tone: tone.id })}
                                                    className={`tone-option ${formData.tone === tone.id ? 'selected' : ''}`}
                                                    title={tone.description}
                                                >
                                                    <span className="tone-option-emoji">{tone.emoji}</span>
                                                    <span className="tone-option-name">{tone.name}</span>
                                                    {formData.tone === tone.id && <div className="tone-option-check"><i className="fas fa-check"></i></div>}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Emoji Usage */}
                                        <h4 style={{ marginBottom: '1rem', marginTop: '1.5rem', fontWeight: 600 }}>Emoji Usage</h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '0.75rem' }}>Control how often the AI uses emojis in responses</p>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {[
                                                { id: 'none', label: 'None', icon: '🚫', desc: 'No emojis at all' },
                                                { id: 'minimal', label: 'Minimal', icon: '😐', desc: 'Very few, only when necessary' },
                                                { id: 'medium', label: 'Medium', icon: '🙂', desc: 'Balanced emoji usage' },
                                                { id: 'expressive', label: 'Expressive', icon: '😊', desc: 'Frequent emojis' },
                                                { id: 'maximum', label: 'Maximum', icon: '🎉', desc: 'Lots of emojis!' },
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setFormData({ ...formData, emojiUsage: opt.id })}
                                                    title={opt.desc}
                                                    style={{
                                                        padding: '0.75rem 1rem',
                                                        borderRadius: '10px',
                                                        border: formData.emojiUsage === opt.id ? `2px solid ${formData.color}` : '2px solid var(--gray-200)',
                                                        background: formData.emojiUsage === opt.id ? `${formData.color}15` : 'white',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '1.2rem' }}>{opt.icon}</span>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: formData.emojiUsage === opt.id ? '600' : '400' }}>{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Brand Color */}
                                        <h4 style={{ marginBottom: '1rem', marginTop: '1.5rem', fontWeight: 600 }}>Brand Color</h4>
                                        <div className="color-grid" style={{ marginBottom: '0.75rem' }}>
                                            {colors.map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => setFormData({ ...formData, color })}
                                                    className={`color-swatch ${formData.color === color ? 'active' : ''}`}
                                                    style={{ background: color }}
                                                ></button>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>Custom:</label>
                                            <input
                                                type="color"
                                                value={customColor}
                                                onChange={(e) => {
                                                    setCustomColor(e.target.value);
                                                    setFormData({ ...formData, color: e.target.value });
                                                }}
                                                style={{ width: '44px', height: '44px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                            />
                                            <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontFamily: 'monospace' }}>{customColor}</span>
                                        </div>

                                        {/* Launcher Button */}
                                        <h4 style={{ marginBottom: '1rem', marginTop: '1.5rem', fontWeight: 600 }}>Launcher Button</h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>Customize the floating chat button</p>

                                        <div style={{ marginBottom: '1rem' }}>
                                            <label className="form-label" style={{ fontSize: '0.9rem', marginBottom: '0.75rem', display: 'block' }}>Button Icon</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                                                {availableIcons.map(icon => (
                                                    <button
                                                        key={icon}
                                                        onClick={() => setFormData({ ...formData, chatIcon: icon })}
                                                        style={{
                                                            padding: '0.75rem',
                                                            borderRadius: '10px',
                                                            border: formData.chatIcon === icon ? `2px solid ${formData.launcherColor}` : '2px solid var(--gray-200)',
                                                            background: formData.chatIcon === icon ? `${formData.launcherColor}15` : 'white',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        <i className={icon} style={{ fontSize: '1.25rem', color: formData.chatIcon === icon ? formData.launcherColor : 'var(--gray-500)' }}></i>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '1rem' }}>
                                            <label className="form-label" style={{ fontSize: '0.9rem', marginBottom: '0.75rem', display: 'block' }}>Button Color</label>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {colors.map(c => (
                                                    <button
                                                        key={c}
                                                        onClick={() => setFormData({ ...formData, launcherColor: c })}
                                                        style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '50%',
                                                            background: c,
                                                            border: formData.launcherColor === c ? '3px solid #000' : '2px solid transparent',
                                                            cursor: 'pointer',
                                                            transition: 'transform 0.2s',
                                                            transform: formData.launcherColor === c ? 'scale(1.1)' : 'scale(1)'
                                                        }}
                                                    ></button>
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                                                <label style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>Custom:</label>
                                                <input
                                                    type="color"
                                                    value={formData.launcherColor}
                                                    onChange={(e) => setFormData({ ...formData, launcherColor: e.target.value })}
                                                    style={{ width: '44px', height: '44px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                                />
                                                <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontFamily: 'monospace' }}>{formData.launcherColor}</span>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '1rem' }}>
                                            <label className="form-label" style={{ fontSize: '0.9rem', marginBottom: '0.75rem', display: 'block' }}>Button Shape</label>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {[
                                                    { id: 'circle', label: '●', style: { borderRadius: '50%' } },
                                                    { id: 'rounded', label: '■', style: { borderRadius: '12px' } },
                                                    { id: 'square', label: '◼', style: { borderRadius: '0' } },
                                                    { id: 'pill', label: '⬭', style: { borderRadius: '24px 24px 6px 24px' } },
                                                    { id: 'leaf', label: '🍃', style: { borderRadius: '50% 50% 10% 50%' } },
                                                ].map(shape => (
                                                    <button
                                                        key={shape.id}
                                                        onClick={() => setFormData({ ...formData, launcherShape: shape.id })}
                                                        style={{
                                                            width: '44px',
                                                            height: '44px',
                                                            ...shape.style,
                                                            background: formData.launcherShape === shape.id ? formData.launcherColor : 'var(--gray-200)',
                                                            border: formData.launcherShape === shape.id ? '2px solid #000' : '2px solid transparent',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '1rem',
                                                            color: formData.launcherShape === shape.id ? 'white' : 'var(--gray-500)',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        {shape.id === 'leaf' ? '🍃' : <i className="fas fa-comment-dots" style={{ fontSize: '0.9rem' }}></i>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Live Preview - Fixed */}
                                    <div className="widget-preview-container" style={{
                                        position: 'fixed',
                                        top: '80px',
                                        right: '40px',
                                        width: '380px'
                                    }}>
                                        <h4 style={{ marginBottom: '1rem', fontWeight: 600, textAlign: 'center' }}>Live Preview</h4>
                                        <div className="widget-preview-bg" style={{ minHeight: '320px' }}>
                                            <div className="widget-preview-chat" style={getThemeStyles()}>
                                                <div className="preview-chat-header" style={{
                                                    background: formData.theme === 'glassmorphism'
                                                        ? 'linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.2))'
                                                        : formData.theme === 'neon'
                                                            ? 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)'
                                                            : formData.theme === 'retro'
                                                                ? '#000'
                                                                : formData.theme === 'nature'
                                                                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                                                                    : formData.theme === 'bubble'
                                                                        ? `linear-gradient(135deg, ${formData.color} 0%, ${formData.color}dd 100%)`
                                                                        : formData.theme === 'minimal'
                                                                            ? '#f8fafc'
                                                                            : formData.theme === 'classic'
                                                                                ? `linear-gradient(180deg, ${formData.color} 0%, ${formData.color}ee 100%)`
                                                                                : `linear-gradient(135deg, ${formData.color} 0%, ${formData.color}cc 100%)`,
                                                    borderRadius: formData.theme === 'retro' ? '0'
                                                        : formData.theme === 'glassmorphism' ? '24px 24px 0 0'
                                                            : formData.theme === 'bubble' ? '28px 28px 0 0'
                                                                : formData.theme === 'minimal' ? '16px 16px 0 0'
                                                                    : formData.theme === 'modern' ? '20px 20px 0 0'
                                                                        : formData.theme === 'nature' ? '24px 24px 0 0'
                                                                            : undefined,
                                                    backdropFilter: formData.theme === 'glassmorphism' ? 'blur(10px)' : undefined,
                                                    borderBottom: formData.theme === 'minimal' ? '1px solid #e2e8f0'
                                                        : formData.theme === 'retro' ? '4px solid #fef08a'
                                                            : formData.theme === 'neon' ? `1px solid ${formData.color}50`
                                                                : undefined,
                                                    padding: '16px'
                                                }}>
                                                    <div className="preview-chat-avatar" style={{
                                                        background: formData.theme === 'neon' ? '#0f0f1a'
                                                            : formData.theme === 'retro' ? '#fef08a'
                                                                : formData.theme === 'minimal' ? formData.color
                                                                    : 'rgba(255,255,255,0.2)',
                                                        border: formData.theme === 'retro' ? '2px solid #000'
                                                            : formData.theme === 'neon' ? `2px solid ${formData.color}`
                                                                : 'none',
                                                        borderRadius: formData.theme === 'retro' ? '0' : '50%'
                                                    }}>🐻‍❄️</div>
                                                    <div>
                                                        <div className="preview-chat-name" style={{
                                                            color: formData.theme === 'neon' ? formData.color
                                                                : formData.theme === 'minimal' ? '#1e293b'
                                                                    : formData.theme === 'retro' ? '#fef08a'
                                                                        : 'white',
                                                            fontWeight: formData.theme === 'retro' ? '900' : '600',
                                                            textShadow: formData.theme === 'neon' ? `0 0 10px ${formData.color}` : undefined,
                                                            fontFamily: formData.theme === 'retro' ? 'monospace' : undefined
                                                        }}>
                                                            {formData.botName || 'Snowky Assistant'}
                                                        </div>
                                                        <div className="preview-chat-status" style={{
                                                            color: formData.theme === 'neon' ? '#4ade80'
                                                                : formData.theme === 'minimal' ? '#10b981'
                                                                    : formData.theme === 'retro' ? '#4ade80'
                                                                        : 'rgba(255,255,255,0.8)'
                                                        }}>● Online</div>
                                                    </div>
                                                </div>
                                                <div className="preview-chat-body" style={{
                                                    background: formData.theme === 'glassmorphism'
                                                        ? 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                                                        : formData.theme === 'neon' ? 'linear-gradient(180deg, #0a0a0f 0%, #0f0f1a 100%)'
                                                            : formData.theme === 'retro' ? '#fef08a'
                                                                : formData.theme === 'nature' ? 'linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%)'
                                                                    : formData.theme === 'bubble' ? 'linear-gradient(180deg, #fff5f5 0%, #ffffff 100%)'
                                                                        : formData.theme === 'minimal' ? '#ffffff'
                                                                            : formData.theme === 'classic' ? '#f9fafb'
                                                                                : '#ffffff',
                                                    backdropFilter: formData.theme === 'glassmorphism' ? 'blur(8px)' : undefined,
                                                    minHeight: '120px',
                                                    padding: '16px'
                                                }}>
                                                    <div className="preview-chat-message" style={{
                                                        background: formData.theme === 'glassmorphism'
                                                            ? 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.15))'
                                                            : formData.theme === 'neon' ? 'linear-gradient(135deg, #1a1a2e, #252545)'
                                                                : formData.theme === 'retro' ? '#fff'
                                                                    : formData.theme === 'nature' ? '#ffffff'
                                                                        : formData.theme === 'bubble' ? `linear-gradient(135deg, ${formData.color}15, ${formData.color}08)`
                                                                            : formData.theme === 'minimal' ? '#f1f5f9'
                                                                                : formData.theme === 'classic' ? '#e5e7eb'
                                                                                    : `linear-gradient(135deg, ${formData.color}10, ${formData.color}05)`,
                                                        color: formData.theme === 'neon' ? '#e0e0e0'
                                                            : formData.theme === 'glassmorphism' ? '#1e293b'
                                                                : '#374151',
                                                        borderRadius: formData.theme === 'bubble' ? '20px 20px 20px 4px'
                                                            : formData.theme === 'retro' ? '0'
                                                                : formData.theme === 'glassmorphism' ? '16px'
                                                                    : formData.theme === 'nature' ? '16px 16px 16px 4px'
                                                                        : formData.theme === 'minimal' ? '12px'
                                                                            : formData.theme === 'modern' ? '16px 16px 16px 4px'
                                                                                : '8px',
                                                        backdropFilter: formData.theme === 'glassmorphism' ? 'blur(6px)' : undefined,
                                                        border: formData.theme === 'glassmorphism' ? '1px solid rgba(255,255,255,0.3)'
                                                            : formData.theme === 'retro' ? '3px solid #000'
                                                                : formData.theme === 'neon' ? `1px solid ${formData.color}30`
                                                                    : formData.theme === 'nature' ? '1px solid #86efac'
                                                                        : formData.theme === 'bubble' ? `2px solid ${formData.color}20`
                                                                            : 'none',
                                                        boxShadow: formData.theme === 'glassmorphism' ? '0 4px 12px rgba(0,0,0,0.08)'
                                                            : formData.theme === 'retro' ? '4px 4px 0 #000'
                                                                : formData.theme === 'bubble' ? '0 4px 15px rgba(0,0,0,0.08)'
                                                                    : formData.theme === 'neon' ? `0 0 15px ${formData.color}20`
                                                                        : undefined,
                                                        padding: '12px 16px',
                                                        fontSize: '14px',
                                                        fontFamily: formData.theme === 'retro' ? 'monospace' : undefined,
                                                        maxWidth: '85%'
                                                    }}>
                                                        {formData.welcomeMessage || getPreviewWelcomeMessage()}
                                                    </div>
                                                </div>
                                                <div className="preview-chat-input" style={{
                                                    background: formData.theme === 'glassmorphism'
                                                        ? 'linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.1))'
                                                        : formData.theme === 'neon' ? '#16213e'
                                                            : formData.theme === 'retro' ? '#000'
                                                                : formData.theme === 'nature' ? '#d1fae5'
                                                                    : formData.theme === 'bubble' ? '#fff5f5'
                                                                        : formData.theme === 'minimal' ? '#f8fafc'
                                                                            : '#f9fafb',
                                                    backdropFilter: formData.theme === 'glassmorphism' ? 'blur(8px)' : undefined,
                                                    borderRadius: formData.theme === 'glassmorphism' ? '0 0 24px 24px'
                                                        : formData.theme === 'bubble' ? '0 0 28px 8px'
                                                            : formData.theme === 'modern' ? '0 0 20px 20px'
                                                                : formData.theme === 'nature' ? '0 0 24px 4px'
                                                                    : formData.theme === 'minimal' ? '0 0 16px 16px'
                                                                        : undefined,
                                                    borderTop: formData.theme === 'minimal' ? '1px solid #e2e8f0'
                                                        : formData.theme === 'neon' ? `1px solid ${formData.color}30`
                                                            : formData.theme === 'nature' ? '1px solid #86efac'
                                                                : undefined,
                                                    padding: '12px'
                                                }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Type a message..."
                                                        style={{
                                                            background: formData.theme === 'neon' ? '#0f0f1a'
                                                                : formData.theme === 'retro' ? '#fef08a'
                                                                    : formData.theme === 'glassmorphism' ? 'rgba(255,255,255,0.2)'
                                                                        : formData.theme === 'nature' ? '#ffffff'
                                                                            : formData.theme === 'bubble' ? '#ffffff'
                                                                                : '#ffffff',
                                                            color: formData.theme === 'neon' ? '#e0e0e0' : '#374151',
                                                            border: formData.theme === 'retro' ? '3px solid #000'
                                                                : formData.theme === 'neon' ? `1px solid ${formData.color}50`
                                                                    : formData.theme === 'glassmorphism' ? '1px solid rgba(255,255,255,0.3)'
                                                                        : '1px solid #e5e7eb',
                                                            borderRadius: formData.theme === 'retro' ? '0'
                                                                : formData.theme === 'bubble' ? '20px'
                                                                    : '12px',
                                                            fontFamily: formData.theme === 'retro' ? 'monospace' : undefined
                                                        }}
                                                    />
                                                    <button style={{
                                                        background: formData.theme === 'retro' ? '#000'
                                                            : formData.theme === 'neon' ? formData.color
                                                                : `linear-gradient(135deg, ${formData.color}, ${formData.color}dd)`,
                                                        borderRadius: formData.theme === 'retro' ? '0'
                                                            : formData.theme === 'bubble' ? '50%'
                                                                : '10px',
                                                        border: formData.theme === 'retro' ? '2px solid #fef08a' : 'none',
                                                        boxShadow: formData.theme === 'neon' ? `0 0 15px ${formData.color}50`
                                                            : formData.theme === 'bubble' ? '0 4px 12px rgba(0,0,0,0.15)'
                                                                : undefined
                                                    }}><i className="fas fa-paper-plane"></i></button>
                                                </div>
                                            </div>
                                            <button className="preview-chat-button" style={{
                                                // Theme-specific backgrounds - always uses launcherColor
                                                background: formData.theme === 'neon'
                                                    ? `linear-gradient(135deg, ${formData.launcherColor}, ${formData.launcherColor}aa)`
                                                    : formData.theme === 'glassmorphism'
                                                        ? `linear-gradient(135deg, ${formData.launcherColor}dd, ${formData.launcherColor}99)`
                                                        : formData.theme === 'nature'
                                                            ? `linear-gradient(135deg, ${formData.launcherColor}, ${formData.launcherColor}cc)`
                                                            : formData.theme === 'modern'
                                                                ? `linear-gradient(135deg, ${formData.launcherColor}, ${formData.launcherColor}cc)`
                                                                : formData.theme === 'bubble'
                                                                    ? `linear-gradient(135deg, ${formData.launcherColor}, ${formData.launcherColor}bb)`
                                                                    : formData.launcherColor,
                                                // Theme-specific shadows
                                                boxShadow: formData.theme === 'neon'
                                                    ? `0 0 30px ${formData.launcherColor}, 0 0 60px ${formData.launcherColor}50, inset 0 0 20px rgba(255,255,255,0.1)`
                                                    : formData.theme === 'bubble'
                                                        ? '0 15px 35px rgba(0,0,0,0.25), 0 5px 15px rgba(0,0,0,0.1)'
                                                        : formData.theme === 'glassmorphism'
                                                            ? '0 8px 32px rgba(31, 38, 135, 0.3), inset 0 0 20px rgba(255,255,255,0.2)'
                                                            : formData.theme === 'modern'
                                                                ? `0 10px 30px ${formData.launcherColor}40, 0 4px 10px rgba(0,0,0,0.1)`
                                                                : formData.theme === 'retro'
                                                                    ? '6px 6px 0 #000'
                                                                    : '0 8px 25px rgba(0,0,0,0.2)',
                                                // User-selected shape (overrides theme default)
                                                borderRadius: formData.launcherShape === 'circle'
                                                    ? '50%'
                                                    : formData.launcherShape === 'rounded'
                                                        ? '12px'
                                                        : formData.launcherShape === 'square'
                                                            ? '0'
                                                            : formData.launcherShape === 'pill'
                                                                ? '24px 24px 6px 24px'
                                                                : formData.launcherShape === 'leaf'
                                                                    ? '50% 50% 10% 50%'
                                                                    : '50%',
                                                // Theme-specific borders
                                                border: formData.theme === 'retro'
                                                    ? '3px solid #000'
                                                    : formData.theme === 'glassmorphism'
                                                        ? '1px solid rgba(255,255,255,0.4)'
                                                        : formData.theme === 'neon'
                                                            ? `2px solid ${formData.launcherColor}`
                                                            : 'none',
                                                // Theme-specific backdrop filter
                                                backdropFilter: formData.theme === 'glassmorphism' ? 'blur(10px)' : undefined,
                                                // Theme-specific animations
                                                animation: formData.theme === 'bubble'
                                                    ? 'float 4s ease-in-out infinite'
                                                    : formData.theme === 'neon'
                                                        ? 'pulse-glow 2s ease-in-out infinite'
                                                        : formData.theme === 'nature'
                                                            ? 'float 5s ease-in-out infinite'
                                                            : undefined,
                                                // Transform for retro theme
                                                transform: formData.theme === 'retro' ? 'translate(-3px, -3px)' : undefined,
                                                // Transition for smooth hover
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}>
                                                <i className={formData.chatIcon} style={{
                                                    fontSize: '1.3rem',
                                                    filter: formData.theme === 'neon' ? 'drop-shadow(0 0 8px currentColor)' : undefined
                                                }}></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* Step 4: Get Code */}
                    {
                        currentStep === 4 && (
                            <div className="create-step">
                                <div className="create-step-header" style={{ marginBottom: '1.5rem' }}>
                                    <div className="step-icon-wrapper success" style={{ width: '64px', height: '64px', fontSize: '2rem' }}>
                                        <span className="step-icon">✓</span>
                                    </div>
                                    <h2 className="step-title" style={{ fontSize: '1.5rem' }}>You&apos;re ready to go!</h2>
                                    <p className="step-subtitle">Copy this code and paste it before the closing &lt;/body&gt; tag</p>
                                </div>

                                <div className="snippet-code-container" style={{ marginBottom: '1rem' }}>
                                    <div className="snippet-code-header">
                                        <span>embed-script.js</span>
                                        <button className="copy-btn" onClick={() => {
                                            const snippet = `<!-- Snowky Chat Widget -->
<script>
  window.SNOWKY_CONFIG = {
    projectId: "${generatedProjectId}",
    theme: "${formData.theme}",
    color: "${formData.color}",
    tone: "${formData.tone}",
    emojiUsage: "${formData.emojiUsage}",
    botName: "${formData.botName || 'Snowky Assistant'}",
    welcomeMessage: "${formData.welcomeMessage || ''}",
    launcherColor: "${formData.launcherColor}",
    launcherShape: "${formData.launcherShape}",
    chatIcon: "${formData.chatIcon}"
  };
</script>
<script src="${window.location.origin}/widget.js" async></script>`;
                                            navigator.clipboard.writeText(snippet);
                                            alert('Copied to clipboard!');
                                        }}><i className="far fa-copy"></i> Copy Code</button>
                                    </div>
                                    <pre className="snippet-code">{`<!-- Snowky Chat Widget -->
<script>
  window.SNOWKY_CONFIG = {
    projectId: "${generatedProjectId}",
    theme: "${formData.theme}",
    color: "${formData.color}",
    tone: "${formData.tone}",
    emojiUsage: "${formData.emojiUsage}",
    botName: "${formData.botName || 'Snowky Assistant'}",
    welcomeMessage: "${formData.welcomeMessage || ''}",
    launcherColor: "${formData.launcherColor}",
    launcherShape: "${formData.launcherShape}",
    chatIcon: "${formData.chatIcon}"
  };
</script>
<script src="${window.location.origin}/widget.js" async></script>`}</pre>
                                </div>

                                <div className="installation-tips" style={{ padding: '1rem' }}>
                                    <h4><i className="fas fa-lightbulb"></i> Installation Tips</h4>
                                    <ul>
                                        <li>Paste this code right before the closing <code>&lt;/body&gt;</code> tag</li>
                                        <li>Works with WordPress, Shopify, Wix, and custom HTML/React sites</li>
                                        <li>Your widget will appear as a floating button on the bottom-right</li>
                                        <li>The AI will respond with <strong>{formData.tone}</strong> personality and <strong>{formData.emojiUsage}</strong> emoji usage</li>
                                    </ul>
                                </div>

                                <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#fef3c7', borderRadius: '12px', border: '1px solid #fcd34d' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}><i className="fas fa-flask"></i> Test Your Widget</h4>
                                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#92400e' }}>Create a simple HTML file to test your widget:</p>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        style={{ background: '#f59e0b', color: 'white', border: 'none' }}
                                        onClick={() => {
                                            const config = {
                                                projectId: generatedProjectId,
                                                theme: formData.theme,
                                                color: formData.color,
                                                tone: formData.tone,
                                                emojiUsage: formData.emojiUsage,
                                                botName: formData.botName || 'Snowky Assistant',
                                                welcomeMessage: formData.welcomeMessage || '',
                                                launcherColor: formData.launcherColor,
                                                launcherShape: formData.launcherShape,
                                                chatIcon: formData.chatIcon
                                            };

                                            const testHTML = `<!DOCTYPE html>
<html>
<head>
    <title>Test Snowky Widget</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
        code { background: #f3f4f6; padding: 0.2rem 0.4rem; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Test Your Widget</h1>
    <p>This is a local test page for your Snowky chat widget.</p>
    <p>If the server is running at <code>${window.location.origin}</code>, you should see the widget in the bottom right corner.</p>
    
    <!-- Snowky Chat Widget -->
    <script>
      window.SNOWKY_CONFIG = ${JSON.stringify(config, null, 2)};
    </script>
    <script src="${window.location.origin}/widget.js"></script>
</body>
</html>`;
                                            const blob = new Blob([testHTML], { type: 'text/html' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = 'test-widget.html';
                                            document.body.appendChild(a); // Required for Firefox and some Chrome versions
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                        }}
                                    >
                                        <i className="fas fa-download"></i> Download Test HTML
                                    </button>
                                </div>
                            </div>
                        )
                    }

                </div >

            </div >

            {/* Navigation Actions - Fixed at bottom */}
            < div style={{
                position: 'fixed',
                bottom: 0,
                left: '220px',
                right: 0,
                padding: '1rem 2rem',
                borderTop: '1px solid #e2e8f0',
                background: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 100,
                boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
            }}>
                <button
                    onClick={handlePrev}
                    disabled={currentStep === 1}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        background: 'white',
                        color: currentStep === 1 ? '#cbd5e1' : '#64748b',
                        cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <i className="fas fa-arrow-left"></i> Back
                </button>
                <button
                    onClick={currentStep === 4 ? handleFinish : handleNext}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
                    }}
                >
                    {currentStep === 4 ? "Finish & Deploy" : "Next Step"}
                    <i className={`fas ${currentStep === 4 ? 'fa-rocket' : 'fa-arrow-right'}`}></i>
                </button>
            </div >
        </div >
    );
}