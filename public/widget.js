/**
 * Snowky Chat Widget
 * Embeddable chat widget that uses AI with customizable personality
 * 
 * Usage (modern with data attributes):
 * <script src="https://yoursite.com/widget.js" data-project-id="YOUR_PROJECT_ID" defer></script>
 * 
 * Usage (legacy with config object):
 * <script>window.SNOWKY_CONFIG = { projectId: "YOUR_PROJECT_ID" };</script>
 * <script src="https://yoursite.com/widget.js"></script>
 */

(function () {
    'use strict';

    // Get script element and its data attributes
    const currentScript = document.currentScript || document.querySelector('script[src*="widget.js"]');
    const scriptData = currentScript ? currentScript.dataset : {};

    // Configuration from window.SNOWKY_CONFIG (legacy) or script data attributes (modern)
    const legacyConfig = window.SNOWKY_CONFIG || {};

    // Merge configs: script data attributes take priority over legacy config
    const projectId = scriptData.projectId || legacyConfig.projectId || 'default';
    const apiBase = scriptData.apiBase || legacyConfig.apiBase || window.location.origin;

    // Default settings (will be overridden by project settings)
    let settings = {
        tone: scriptData.tone || legacyConfig.tone || 'friendly',
        emojiUsage: scriptData.emojiUsage || legacyConfig.emojiUsage || 'medium',
        botName: scriptData.botName || legacyConfig.botName || 'Snowky Assistant',
        welcomeMessage: scriptData.welcomeMessage || legacyConfig.welcomeMessage || '',
        theme: scriptData.theme || legacyConfig.theme || 'modern',
        color: scriptData.primaryColor || scriptData.color || legacyConfig.color || '#6366f1',
        launcherColor: scriptData.launcherColor || legacyConfig.launcherColor || '#6366f1',
        launcherShape: scriptData.launcherShape || legacyConfig.launcherShape || 'circle',
        chatIcon: scriptData.chatIcon || legacyConfig.chatIcon || 'comment-dots',
        showFloatingLauncher: scriptData.showFloatingLauncher !== 'false' && (legacyConfig.showFloatingLauncher !== false)
    };

    // Chat state
    let isOpen = false;
    let messages = [];


    // Load project settings from config and localStorage
    function loadSettings() {
        // Settings are already initialized from script data attributes and legacyConfig
        // Now check localStorage for any additional project-specific settings
        try {
            const projects = JSON.parse(localStorage.getItem('snowkyProjects') || '[]');
            const project = projects.find(p => p.id === projectId);
            if (project) {
                // Only apply localStorage settings if not already set by script data or legacyConfig
                if (!scriptData.tone && !legacyConfig.tone && project.tone) settings.tone = project.tone;
                if (!scriptData.emojiUsage && !legacyConfig.emojiUsage && project.emojiUsage) settings.emojiUsage = project.emojiUsage;
                if (!scriptData.botName && !legacyConfig.botName && project.botName) settings.botName = project.botName;
                if (!scriptData.welcomeMessage && !legacyConfig.welcomeMessage && project.welcomeMessage) settings.welcomeMessage = project.welcomeMessage;
                if (!scriptData.theme && !legacyConfig.theme && project.theme) settings.theme = project.theme;
                if (!scriptData.primaryColor && !scriptData.color && !legacyConfig.color && project.color) settings.color = project.color;
                if (!scriptData.launcherColor && !legacyConfig.launcherColor && project.launcherColor) settings.launcherColor = project.launcherColor;
                if (!scriptData.launcherShape && !legacyConfig.launcherShape && project.launcherShape) settings.launcherShape = project.launcherShape;
                if (!scriptData.chatIcon && !legacyConfig.chatIcon && project.chatIcon) settings.chatIcon = project.chatIcon;

                if (project.showFloatingLauncher !== undefined) {
                    settings.showFloatingLauncher = project.showFloatingLauncher;
                }
            }
        } catch (e) {
            console.warn('Snowky: Could not load project settings from localStorage', e);
        }

        console.log('Snowky settings loaded:', settings);
    }


    // Get welcome message based on settings
    function getWelcomeMessage() {
        if (settings.welcomeMessage) return settings.welcomeMessage;

        const greetings = {
            friendly: { medium: `Hi there! 😊 I'm ${settings.botName}. How can I help you today?` },
            professional: { medium: `Good day. 👔 I'm ${settings.botName}. How may I assist you?` },
            casual: { medium: `Hey! 😎 I'm ${settings.botName}. What's up?` },
            enthusiastic: { medium: `WOW, hi! 🎉 I'm ${settings.botName}! So excited to help you!` },
            empathetic: { medium: `Hello there. 💙 I'm ${settings.botName}. I'm here for you.` },
            witty: { medium: `Well, hello! 😏 I'm ${settings.botName}. How can I dazzle you?` },
            formal: { medium: `Greetings. 🎩 I am ${settings.botName}, at your service.` },
            playful: { medium: `Hiya! 🎮 I'm ${settings.botName}! Let's have fun!` },
            concise: { medium: `Hi! I'm ${settings.botName}. How can I help?` },
            storyteller: { medium: `Welcome, traveler! 📚 I'm ${settings.botName}. What tale brings you here?` }
        };

        return greetings[settings.tone]?.medium || `Hi! I'm ${settings.botName}. How can I help?`;
    }

    // Get theme styles
    function getThemeStyles() {
        const themes = {
            modern: { borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
            classic: { borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' },
            minimal: { borderRadius: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
            bubble: { borderRadius: '28px 28px 8px 28px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' },
            glassmorphism: { borderRadius: '24px', backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.8)' },
            neon: { borderRadius: '4px', background: '#0a0a0a', boxShadow: `0 0 30px ${settings.color}40` },
            retro: { borderRadius: '0', border: '4px solid #000', boxShadow: '8px 8px 0 #000' },
            nature: { borderRadius: '24px 24px 4px 24px', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' }
        };
        return themes[settings.theme] || themes.modern;
    }

    // Get launcher shape styles
    function getLauncherStyles() {
        const shapes = {
            circle: '50%',
            rounded: '12px',
            square: '0',
            pill: '24px 24px 6px 24px',
            leaf: '50% 50% 10% 50%'
        };
        return shapes[settings.launcherShape] || '50%';
    }

    // Create and inject styles
    function injectStyles() {
        const style = document.createElement('style');
        style.id = 'snowky-widget-styles';
        style.textContent = `
            #snowky-widget-container * {
                box-sizing: border-box;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            #snowky-launcher {
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 60px;
                height: 60px;
                border-radius: ${getLauncherStyles()};
                background: linear-gradient(135deg, ${settings.launcherColor}, ${settings.launcherColor}cc);
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 8px 25px ${settings.launcherColor}40;
                transition: all 0.3s ease;
                z-index: 999999;
                ${!settings.showFloatingLauncher ? 'display: none !important;' : ''}
            }
            #snowky-launcher:hover {
                transform: scale(1.1);
                box-shadow: 0 12px 35px ${settings.launcherColor}50;
            }
            #snowky-launcher svg {
                width: 28px;
                height: 28px;
                fill: white;
            }
            #snowky-chat-window {
                width: 380px;
                max-width: calc(100vw - 48px);
                background: white;
                display: none;
                flex-direction: column;
                overflow: hidden;
                z-index: 999998;
                animation: snowky-slide-up 0.3s ease;
                ${settings.showFloatingLauncher ?
                `position: fixed; bottom: 100px; right: 24px; height: 550px; max-height: calc(100vh - 140px);` :
                `position: relative; width: 100%; height: 100%; min-height: 500px; box-shadow: none; border: 1px solid #eee; right: auto; bottom: auto;`
            }
            }
            #snowky-chat-window.open {
                display: flex;
            }
            @keyframes snowky-slide-up {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            #snowky-header {
                background: linear-gradient(135deg, ${settings.color}, ${settings.color}dd);
                color: white;
                padding: 16px;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            #snowky-avatar {
                width: 40px;
                height: 40px;
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
            }
            #snowky-header-info h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }
            #snowky-header-info span {
                font-size: 12px;
                opacity: 0.8;
            }
            #snowky-close {
                margin-left: auto;
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 8px;
                opacity: 0.8;
            }
            #snowky-close:hover { opacity: 1; }
            #snowky-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .snowky-message {
                max-width: 85%;
                padding: 12px 16px;
                border-radius: 16px;
                font-size: 14px;
                line-height: 1.5;
                animation: snowky-fade-in 0.3s ease;
            }
            @keyframes snowky-fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .snowky-message.bot {
                background: linear-gradient(135deg, ${settings.color}15, ${settings.color}08);
                border: 1px solid ${settings.color}20;
                align-self: flex-start;
                border-radius: 16px 16px 16px 4px;
            }
            .snowky-message.user {
                background: ${settings.color};
                color: white;
                align-self: flex-end;
                border-radius: 16px 16px 4px 16px;
            }
            .snowky-typing {
                display: flex;
                gap: 4px;
                padding: 12px 16px;
            }
            .snowky-typing span {
                width: 8px;
                height: 8px;
                background: ${settings.color};
                border-radius: 50%;
                animation: snowky-bounce 1.4s infinite ease-in-out both;
            }
            .snowky-typing span:nth-child(1) { animation-delay: -0.32s; }
            .snowky-typing span:nth-child(2) { animation-delay: -0.16s; }
            @keyframes snowky-bounce {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1); }
            }
            #snowky-input-area {
                padding: 12px;
                border-top: 1px solid #eee;
                display: flex;
                gap: 8px;
            }
            #snowky-input {
                flex: 1;
                padding: 12px 16px;
                border: 1px solid #e5e7eb;
                border-radius: 24px;
                outline: none;
                font-size: 14px;
            }
            #snowky-input:focus {
                border-color: ${settings.color};
            }
            #snowky-send {
                width: 44px;
                height: 44px;
                background: ${settings.color};
                border: none;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            #snowky-send:hover { opacity: 0.9; }
            #snowky-send svg {
                width: 18px;
                height: 18px;
                fill: white;
            }
        `;
        document.head.appendChild(style);
    }

    // Create widget HTML
    function createWidget() {
        const themeStyles = getThemeStyles();
        const styleStr = Object.entries(themeStyles).map(([k, v]) => {
            const prop = k.replace(/([A-Z])/g, '-$1').toLowerCase();
            return `${prop}: ${v}`;
        }).join('; ');

        const container = document.createElement('div');
        container.id = 'snowky-widget-container';

        // Decide where to append
        if (settings.showFloatingLauncher) {
            document.body.appendChild(container);
        } else {
            // Try to find target or append to body (user will style container)
            const target = document.getElementById('snowky-embed') || document.body;
            target.appendChild(container);
            isOpen = true; // Auto open
        }

        container.innerHTML = `
            ${settings.showFloatingLauncher ? `
            <button id="snowky-launcher" aria-label="Open chat">
                <svg viewBox="0 0 24 24"><path d="M12 3c5.5 0 10 3.58 10 8s-4.5 8-10 8c-1.24 0-2.43-.18-3.53-.5C5.55 21 2 21 2 21c2.33-2.33 2.7-3.9 2.75-4.5C3.05 15.07 2 13.13 2 11c0-4.42 4.5-8 10-8z"/></svg>
            </button>` : ''}
            <div id="snowky-chat-window" style="${styleStr}">
                <div id="snowky-header">
                    <div id="snowky-avatar">🐻‍❄️</div>
                    <div id="snowky-header-info">
                        <h3>${settings.botName}</h3>
                        <span>● Online</span>
                    </div>
                    <button id="snowky-close" aria-label="Close chat">✕</button>
                </div>
                <div id="snowky-messages"></div>
                <div id="snowky-input-area">
                    <input type="text" id="snowky-input" placeholder="Type a message..." />
                    <button id="snowky-send" aria-label="Send message">
                        <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
                    </button>
                </div>
            </div>
        `;
        if (!settings.showFloatingLauncher) {
            // Auto open
            requestAnimationFrame(() => {
                document.getElementById('snowky-chat-window').classList.add('open');
                setTimeout(() => addMessage(getWelcomeMessage()), 500);
            });
        }
    }

    // Add message to chat
    function addMessage(content, isUser = false) {
        const messagesContainer = document.getElementById('snowky-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `snowky-message ${isUser ? 'user' : 'bot'}`;
        messageDiv.textContent = content;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        messages.push({ role: isUser ? 'user' : 'assistant', content });
    }

    // Show typing indicator
    function showTyping() {
        const messagesContainer = document.getElementById('snowky-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'snowky-typing-indicator';
        typingDiv.className = 'snowky-message bot snowky-typing';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Hide typing indicator
    function hideTyping() {
        const typing = document.getElementById('snowky-typing-indicator');
        if (typing) typing.remove();
    }

    async function sendMessage(userMessage) {
        addMessage(userMessage, true);
        showTyping();

        try {
            const vid = getVisitorId();
            // Store session ID in local storage to maintain session across reloads
            let sessionId = localStorage.getItem(`snowky_session_${projectId}`);

            const response = await fetch(`${apiBase}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    projectId: projectId,
                    visitorId: vid,
                    sessionId: sessionId
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            // Save new session ID if provided
            if (data.sessionId) {
                localStorage.setItem(`snowky_session_${projectId}`, data.sessionId);
            }

            hideTyping();

            // Add bot response
            addMessage(data.content);

        } catch (error) {
            console.error('Error sending message:', error);
            hideTyping();
            addMessage("Sorry, I'm having trouble connecting right now. Please try again later.");
        }
    }

    // --- Analytics Tracking ---

    // Generate simple visitor ID if not exists
    function getVisitorId() {
        let vid = localStorage.getItem('snowky_vid');
        if (!vid) {
            vid = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now();
            localStorage.setItem('snowky_vid', vid);
        }
        return vid;
    }

    async function trackEvent(type, data = {}) {
        try {
            await fetch(`${apiBase}/api/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    visitorId: getVisitorId(),
                    type,
                    data: {
                        url: window.location.href,
                        title: document.title,
                        referrer: document.referrer,
                        ...data
                    }
                })
            });
        } catch (e) {
            // Silently fail for analytics
        }
    }

    // Auto-track page view
    function initTracking() {
        // Initial load
        trackEvent('page_view');

        // History API support for SPA
        const pushState = history.pushState;
        history.pushState = function () {
            pushState.apply(history, arguments);
            trackEvent('page_view');
        };

        window.addEventListener('popstate', () => {
            trackEvent('page_view');
        });

        // Track Clicks (e.g., buttons, links)
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, a');
            if (target) {
                trackEvent('click', {
                    tagName: target.tagName,
                    id: target.id,
                    className: target.className,
                    text: target.innerText.substring(0, 50),
                    href: target.href
                });
            }
        });
    }

    // Toggle chat window
    function toggleChat() {
        const chatWindow = document.getElementById('snowky-chat-window');
        isOpen = !isOpen;
        chatWindow.classList.toggle('open', isOpen);

        if (isOpen && messages.length === 0) {
            // Show welcome message
            setTimeout(() => {
                addMessage(getWelcomeMessage());
            }, 500);
        }
    }

    // Initialize widget
    function init() {
        loadSettings();
        injectStyles();
        createWidget();
        initTracking();

        // Event listeners
        if (settings.showFloatingLauncher) {
            document.getElementById('snowky-launcher')?.addEventListener('click', toggleChat);
            document.getElementById('snowky-close')?.addEventListener('click', toggleChat);
        }

        document.getElementById('snowky-send').addEventListener('click', () => {
            const input = document.getElementById('snowky-input');
            const message = input.value.trim();
            if (message) {
                sendMessage(message);
                input.value = '';
            }
        });

        document.getElementById('snowky-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const input = e.target;
                const message = input.value.trim();
                if (message) {
                    sendMessage(message);
                    input.value = '';
                }
            }
        });

        console.log('Snowky Chat Widget initialized for project:', projectId);
    }

    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
