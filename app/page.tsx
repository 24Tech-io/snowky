"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  // State for interactive elements
  const [activeTone, setActiveTone] = useState("friendly");
  const [activeColor, setActiveColor] = useState("#6366f1");
  const [activeTheme, setActiveTheme] = useState("modern");
  const [botName, setBotName] = useState("Snowky Assistant");
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Hi! I'm trained on your specific data. Ask me anything! 📚"
  );
  const [emojiFreq, setEmojiFreq] = useState("medium");

  // Extended themes from dashboard
  const themes = [
    { id: 'modern', name: 'Modern', icon: '✨', description: 'Clean lines, gradient header' },
    { id: 'classic', name: 'Classic', icon: '🏛️', description: 'Traditional style' },
    { id: 'minimal', name: 'Minimal', icon: '⚪', description: 'Ultra clean design' },
    { id: 'bubble', name: 'Bubble', icon: '💬', description: 'Playful floating effect' },
    { id: 'glassmorphism', name: 'Glass', icon: '🔮', description: 'Frosted blur effect' },
    { id: 'neon', name: 'Neon', icon: '💜', description: 'Glowing dark mode' },
    { id: 'retro', name: 'Retro', icon: '📺', description: 'Pixel-perfect vintage' },
    { id: 'nature', name: 'Nature', icon: '🌿', description: 'Organic & earthy' },
  ];

  // Theme styles logic
  const getThemeStyles = () => {
    const baseStyles: any = { transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden' };

    switch (activeTheme) {
      case 'classic':
        return {
          ...baseStyles,
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
          border: '1px solid #d1d5db',
          background: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)'
        };
      case 'minimal':
        return {
          ...baseStyles,
          borderRadius: '16px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          border: '1px solid #f3f4f6',
          background: '#ffffff'
        };
      case 'bubble':
        return {
          ...baseStyles,
          borderRadius: '28px 28px 8px 28px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1)',
          animation: 'float 5s ease-in-out infinite',
          background: 'linear-gradient(135deg, #ffffff 0%, #fef3f2 100%)',
          border: '2px solid rgba(255,255,255,0.8)'
        };
      case 'glassmorphism':
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
        return {
          ...baseStyles,
          borderRadius: '4px',
          background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
          border: `2px solid ${activeColor}`,
          boxShadow: `0 0 30px ${activeColor}40, 0 0 60px ${activeColor}20, inset 0 1px 0 rgba(255,255,255,0.05)`,
          animation: 'pulse-glow 3s ease-in-out infinite'
        };
      case 'retro':
        return {
          ...baseStyles,
          borderRadius: '0',
          border: '4px solid #000',
          boxShadow: '8px 8px 0 #000',
          transform: 'translate(-4px, -4px)',
          background: 'linear-gradient(180deg, #fef08a 0%, #fde047 100%)'
        };
      case 'nature':
        return {
          ...baseStyles,
          borderRadius: '24px 24px 4px 24px',
          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)',
          border: '2px solid #86efac',
          boxShadow: '0 10px 30px rgba(34, 197, 94, 0.15), 0 4px 6px rgba(0,0,0,0.05)',
          animation: 'float 8s ease-in-out infinite'
        };
      default: // modern
        return {
          ...baseStyles,
          borderRadius: '20px',
          boxShadow: `0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1), 0 0 40px ${activeColor}15`,
          background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
          border: '1px solid rgba(0,0,0,0.05)'
        };
    }
  };

  // Snowflakes effect
  useEffect(() => {
    const container = document.getElementById("snowflakes");
    if (!container) return;
    container.innerHTML = "";
    const snowflakeChars = ["❄", "❅", "❆", "✧", "✦"];
    for (let i = 0; i < 30; i++) {
      const snowflake = document.createElement("div");
      snowflake.className = "snowflake";
      snowflake.textContent = snowflakeChars[Math.floor(Math.random() * snowflakeChars.length)];
      snowflake.style.left = Math.random() * 100 + "%";
      snowflake.style.fontSize = Math.random() * 14 + 8 + "px";
      snowflake.style.animationDuration = Math.random() * 10 + 10 + "s";
      snowflake.style.animationDelay = Math.random() * 10 + "s";
      snowflake.style.opacity = (Math.random() * 0.5 + 0.3).toString();
      container.appendChild(snowflake);
    }
  }, []);

  // Navbar scroll effect
  useEffect(() => {
    const navbar = document.getElementById("navbar");
    const handleScroll = () => {
      if (navbar) {
        if (window.scrollY > 50) {
          navbar.classList.add("scrolled");
        } else {
          navbar.classList.remove("scrolled");
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer
  useEffect(() => {
    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).style.opacity = "1";
          (entry.target as HTMLElement).style.transform = "translateY(0)";
        }
      });
    }, observerOptions);

    document
      .querySelectorAll(".feature-card, .step-card, .tone-card")
      .forEach((el) => {
        (el as HTMLElement).style.opacity = "0";
        (el as HTMLElement).style.transform = "translateY(30px)";
        (el as HTMLElement).style.transition = "all 0.6s ease-out";
        observer.observe(el);
      });

    return () => observer.disconnect();
  }, []);

  const getGradient = (color: string) => {
    const colorMap: Record<string, string> = {
      "#6366f1": "linear-gradient(135deg, #6366f1, #4f46e5)",
      "#0ea5e9": "linear-gradient(135deg, #0ea5e9, #0284c7)",
      "#10b981": "linear-gradient(135deg, #10b981, #059669)",
      "#f59e0b": "linear-gradient(135deg, #f59e0b, #d97706)",
      "#ef4444": "linear-gradient(135deg, #ef4444, #dc2626)",
      "#8b5cf6": "linear-gradient(135deg, #8b5cf6, #7c3aed)",
      "#ec4899": "linear-gradient(135deg, #ec4899, #db2777)",
      "#1e293b": "linear-gradient(135deg, #1e293b, #0f172a)",
    };
    return colorMap[color] || colorMap["#6366f1"];
  };

  const currentGradient = getGradient(activeColor);

  return (
    <div className="page welcome-page">
      {/* Background Effects */}
      <div className="hero-bg">
        <div className="hero-blob hero-blob-1"></div>
        <div className="hero-blob hero-blob-2"></div>
        <div className="hero-blob hero-blob-3"></div>
        <div className="hero-grid"></div>
      </div>
      <div className="snowflakes-container" id="snowflakes"></div>

      {/* Navbar */}
      <nav className="navbar" id="navbar">
        <div className="navbar-container">
          <Link href="/" className="navbar-logo">
            <div className="navbar-logo-icon">🐻‍❄️</div>
            <span className="navbar-logo-text">Snowky</span>
          </Link>
          <ul className="navbar-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#preview">Live Demo</a></li>
          </ul>
          <div className="navbar-buttons">
            <Link href="/auth/login" className="btn btn-ghost">Sign In</Link>
            <Link href="/auth/register" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <i className="fas fa-bolt"></i>
              <span>Now with File Upload Support! 📄</span>
            </div>
            <h1 className="hero-title">
              Chat with Your Data using <span>Snowky</span> AI
            </h1>
            <p className="hero-subtitle">
              Upload PDFs, Docs, or Text. Create a custom AI assistant that knows everything about your business. Deploy in minutes.
            </p>
            <div className="hero-buttons">
              <Link href="/auth/login" className="btn btn-primary btn-lg">
                <i className="fas fa-rocket"></i>
                Start Free
              </Link>
              <a href="#preview" className="btn btn-secondary btn-lg">
                <i className="fas fa-magic"></i>
                Try Demo
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-floating">
              <span className="floating-emoji">📄</span>
              <span className="floating-emoji">🧠</span>
              <span className="floating-emoji">🤖</span>
            </div>

            {/* Widget Preview (Simple Hero Version) */}
            <div className="hero-widget-preview">
              <div className="preview-header">
                <div className="preview-avatar">🐻‍❄️</div>
                <div className="preview-info">
                  <h4>Snowky Assistant</h4>
                  <p>Online • Trained on your PDF</p>
                </div>
              </div>
              <div className="preview-messages">
                <div className="preview-message bot">
                  <div className="preview-bubble">
                    Hi! I've read your "Product Manual.pdf". Ask me anything about it! 📚
                  </div>
                </div>
                <div className="preview-message user">
                  <div className="preview-bubble">How do I reset the device?</div>
                </div>
                <div className="preview-message bot">
                  <div className="preview-bubble">
                    According to page 12 of the manual, hold the power button for 5 seconds until the light blinks blue. 🔵
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-container">
          <div className="section-header">
            <div className="section-badge"><i className="fas fa-sparkles"></i> Features</div>
            <h2 className="section-title">Everything You Need</h2>
            <p className="section-subtitle">Powerful features to create the perfect AI assistant</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📁</div>
              <h3 className="feature-title">File Uploads</h3>
              <p className="feature-description">Automatically reads PDF, DOCX, and TXT files.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h3 className="feature-title">Smart Context</h3>
              <p className="feature-description">Answers strictly based on your uploaded data.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3 className="feature-title">Premium Themes</h3>
              <p className="feature-description">Choose from Neon, Glass, Bubble, and more.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3 className="feature-title">Instant Deploy</h3>
              <p className="feature-description">Embed on any website with a single line of code.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Preview Section (Advanced) */}
      <section className="preview-section" id="preview">
        <div className="section-container">
          <div className="section-header">
            <div className="section-badge"><i className="fas fa-eye"></i> Live Demo</div>
            <h2 className="section-title">Design Your Experience</h2>
            <p className="section-subtitle">Try our new themes and see the RAG capabilities in action.</p>
          </div>

          <div className="preview-container">
            <div className="customizer-panel">
              {/* Theme Selector */}
              <div className="customizer-group">
                <label className="customizer-label">Visual Theme</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {themes.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTheme(t.id)}
                      className={`tone-card small ${activeTheme === t.id ? 'active' : ''}`}
                      style={{ padding: '0.5rem', margin: 0, justifyContent: 'flex-start' }}
                    >
                      <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>{t.icon}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="customizer-group">
                <label className="customizer-label">Primary Color</label>
                <div className="color-options">
                  {["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#1e293b"].map((color) => (
                    <div
                      key={color}
                      className={`color-option ${activeColor === color ? "active" : ""}`}
                      style={{ background: getGradient(color) }}
                      onClick={() => setActiveColor(color)}
                    ></div>
                  ))}
                </div>
              </div>

              <div className="customizer-group">
                <label className="customizer-label">Bot Personality</label>
                <div className="emoji-frequency" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  {["Friendly 😊", "Professional 👔", "Funny 😄", "Strict 👮"].map((t) => (
                    <button
                      key={t}
                      className={`emoji-btn ${activeTone === t.split(' ')[0].toLowerCase() ? "active" : ""}`}
                      onClick={() => setActiveTone(t.split(' ')[0].toLowerCase())}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="live-preview-wrapper">
              <div className="preview-website-mockup">
                {/* Mockup content */}
                <div className="mockup-nav">
                  <div className="mockup-dot red"></div><div className="mockup-dot yellow"></div><div className="mockup-dot green"></div>
                </div>
                <div className="mockup-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ height: '20px', width: '60%', background: '#e5e7eb', borderRadius: '4px' }}></div>
                  <div style={{ height: '20px', width: '80%', background: '#e5e7eb', borderRadius: '4px' }}></div>
                  <div style={{ height: '100px', width: '100%', background: '#f3f4f6', borderRadius: '8px', marginTop: '1rem' }}></div>
                </div>
              </div>

              {/* Dynamic Styled Widget */}
              <div className="live-chat-widget">
                <div className="live-chat-window" style={getThemeStyles()}>
                  <div className="preview-chat-header" style={{
                    background: activeTheme === 'glassmorphism' ? 'linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.2))' :
                      activeTheme === 'neon' ? 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)' :
                        activeTheme === 'retro' ? '#000' :
                          activeTheme === 'nature' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
                            activeTheme === 'minimal' ? '#f8fafc' :
                              currentGradient,
                    padding: '16px',
                    color: activeTheme === 'minimal' ? '#333' : 'white',
                    borderBottom: activeTheme === 'minimal' ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <div className="live-chat-avatar" style={{ background: activeTheme === 'minimal' ? activeColor : 'rgba(255,255,255,0.2)' }}>🐻‍❄️</div>
                    <div>
                      <div className="live-chat-name" style={{ color: activeTheme === 'minimal' ? '#111' : 'white' }}>{botName}</div>
                      <div className="live-chat-status" style={{ color: activeTheme === 'minimal' ? '#10b981' : 'rgba(255,255,255,0.9)' }}>Online • Trained on Data</div>
                    </div>
                  </div>

                  <div className="live-chat-messages" style={{
                    background: activeTheme === 'neon' ? '#0f0f1a' : activeTheme === 'retro' ? '#fef08a' : 'transparent',
                    padding: '16px'
                  }}>
                    <div className="live-chat-message" style={{
                      background: activeTheme === 'neon' ? '#1a1a2e' : activeTheme === 'minimal' ? '#f3f4f6' : activeTheme === 'retro' ? '#fff' : 'rgba(0,0,0,0.05)',
                      color: activeTheme === 'neon' ? '#fff' : '#333',
                      border: activeTheme === 'retro' ? '2px solid #000' : 'none'
                    }}>
                      {welcomeMessage}
                    </div>
                    <div className="live-chat-message user" style={{
                      alignSelf: 'flex-end',
                      background: activeTheme === 'retro' ? '#000' : activeTheme === 'minimal' ? '#000' : activeColor,
                      color: 'white',
                      marginTop: '10px',
                      padding: '10px 14px',
                      borderRadius: '12px 12px 0 12px',
                      maxWidth: '85%',
                      fontSize: '0.9rem'
                    }}>
                      What are your operating hours?
                    </div>
                    <div className="live-chat-message" style={{
                      background: activeTheme === 'neon' ? '#1a1a2e' : activeTheme === 'minimal' ? '#f3f4f6' : activeTheme === 'retro' ? '#fff' : 'rgba(0,0,0,0.05)',
                      color: activeTheme === 'neon' ? '#fff' : '#333',
                      border: activeTheme === 'retro' ? '2px solid #000' : 'none',
                      marginTop: '10px'
                    }}>
                      Based on your uploaded document "StorePolicy.pdf", we are open Mon-Fri 9AM-6PM. 🕰️
                    </div>
                  </div>

                  <div className="live-chat-input" style={{
                    background: activeTheme === 'neon' ? '#16213e' : activeTheme === 'retro' ? '#000' : 'white'
                  }}>
                    <input type="text" placeholder="Ask a question..." style={{ color: activeTheme === 'neon' ? 'white' : 'black' }} />
                    <button className="live-chat-send" style={{ background: activeTheme === 'retro' ? '#fef08a' : currentGradient, color: activeTheme === 'retro' ? 'black' : 'white' }}>
                      <i className="fas fa-paper-plane"></i>
                    </button>
                  </div>
                </div>

                <button className="live-chat-button" style={{
                  background: activeTheme === 'retro' ? '#000' : currentGradient,
                  borderRadius: activeTheme === 'retro' ? '0' : '50%'
                }}>
                  <i className="fas fa-comment-dots"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to build your Custom Bot?</h2>
          <p className="cta-subtitle">Start chatting with your data today.</p>
          <div className="cta-buttons">
            <Link href="/auth/login" className="btn btn-primary btn-lg" style={{ color: "var(--primary)" }}>Get Started Free</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
