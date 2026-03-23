import React, { useState, useEffect, useRef } from "react";
import "./UserDashboard.css";

const OWM_KEY = "3eb9f7833ab61f790ef56eabc77c80d8";

function AeroSenseLogo() {
  return (
    <div className="logo">
      <svg className="logo-svg" width="38" height="38" viewBox="0 0 38 38" fill="none">
        <circle cx="19" cy="19" r="17.5" stroke="url(#ringGrad)" strokeWidth="1.2" strokeDasharray="4 2.5" />
        <circle cx="19" cy="19" r="11" stroke="rgba(125,211,252,0.3)" strokeWidth="0.8" />
        <circle cx="19" cy="19" r="5.5" fill="url(#coreGrad)" />
        <circle cx="19" cy="19" r="2.8" fill="white" opacity="0.95" />
        <path d="M19 2.5 A16.5 16.5 0 0 1 35.5 19" stroke="url(#arcGrad)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        <path d="M2.5 19 A16.5 16.5 0 0 1 19 2.5" stroke="rgba(125,211,252,0.25)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        <line x1="19" y1="1" x2="19" y2="5" stroke="#7dd3fc" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="37" y1="19" x2="33" y2="19" stroke="#7dd3fc" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="1" y1="19" x2="5" y2="19" stroke="rgba(125,211,252,0.4)" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="19" y1="37" x2="19" y2="33" stroke="rgba(125,211,252,0.4)" strokeWidth="1.4" strokeLinecap="round"/>
        <defs>
          <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.95"/>
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.7"/>
          </radialGradient>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="38" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="1"/>
            <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.1"/>
          </linearGradient>
          <linearGradient id="arcGrad" x1="19" y1="2.5" x2="35.5" y2="19" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff"/>
            <stop offset="100%" stopColor="#7dd3fc"/>
          </linearGradient>
        </defs>
      </svg>
      <span className="logo-wordmark">
        <span className="logo-aero">Aero</span><span className="logo-sense">Sense</span>
      </span>
    </div>
  );
}

function AeroSenseAI({ weatherContext }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm **AeroSense AI** 🌤️\nI have live weather data for your city right now. Ask me anything — *\"Should I carry an umbrella?\"*, *\"Is it safe to travel?\"*, or *\"What's the AQI like today?\"*"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const GROQ_KEY = "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";

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const suggestions = [
    "Should I carry an umbrella today?",
    "Is the air quality safe right now?",
    "Best time to go outside today?",
    "Any weather warnings I should know?"
  ];

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText) return;
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    const systemPrompt = `You are AeroSense AI — a smart, friendly weather assistant. You have live weather data for the user's city.
LIVE WEATHER DATA: ${weatherContext || "Weather data loading..."}
Be conversational, give direct answers, use weather symbols naturally. Max 3 sentences for simple questions.`;
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}`, "Accept": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: systemPrompt }, ...newMessages.map(m => ({ role: m.role, content: m.content }))],
          max_tokens: 300, temperature: 0.7
        })
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `HTTP ${res.status}`); }
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.choices?.[0]?.message?.content || "Sorry, try again." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ Error: ${err.message}` }]);
    } finally { setLoading(false); }
  };

  const fmt = (text) => text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/\n/g, "<br/>");

  return (
    <div className="chat-wrapper">
      <div className="chat-left">
        <div className="chat-brand-icon">
          <svg width="52" height="52" viewBox="0 0 38 38" fill="none">
            <circle cx="19" cy="19" r="17.5" stroke="rgba(125,211,252,0.5)" strokeWidth="1.2" strokeDasharray="4 2.5"/>
            <circle cx="19" cy="19" r="5.5" fill="url(#cc)"/>
            <circle cx="19" cy="19" r="2.8" fill="white" opacity="0.95"/>
            <path d="M19 2.5 A16.5 16.5 0 0 1 35.5 19" stroke="#7dd3fc" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <defs><radialGradient id="cc" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#bae6fd"/><stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.7"/></radialGradient></defs>
          </svg>
        </div>
        <h2 className="chat-brand-title"><span className="chat-aero">Aero</span><span className="chat-sense">Sense</span> AI</h2>
        <p className="chat-brand-sub">Your intelligent weather companion</p>
        <div className="chat-features">
          {[["🌡️","Live weather context"],["🧠","AI-powered insights"],["⚡","Instant responses"],["🗺️","India-wide coverage"]].map(([icon,label],i) => (
            <div className="chat-feature-item" key={i}><span className="cf-icon">{icon}</span><span>{label}</span></div>
          ))}
        </div>
        <div className="chat-status"><span className="chat-status-dot" /><span>LLaMA 3 · Groq · Online</span></div>
      </div>
      <div className="chat-right">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.role}`}>
              {msg.role === "assistant" && <div className="chat-avatar-sm">AI</div>}
              <div className="chat-bubble" dangerouslySetInnerHTML={{ __html: fmt(msg.content) }} />
            </div>
          ))}
          {loading && <div className="chat-msg assistant"><div className="chat-avatar-sm">AI</div><div className="chat-bubble chat-typing"><span /><span /><span /></div></div>}
          <div ref={messagesEndRef} />
        </div>
        {messages.length <= 1 && (
          <div className="chat-suggestions">
            {suggestions.map((s, i) => <button key={i} className="chat-suggestion-btn" onClick={() => sendMessage(s)}>{s}</button>)}
          </div>
        )}
        <div className="chat-input-row">
          <input className="chat-input" placeholder="Ask about weather, safety, travel conditions..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}/>
          <button className="chat-send-btn" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN EXPORT ──
export default function UserDashboard({ onViewWeather, onLogout, onExplore, onProfile, onDisaster, onAdvisory }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const containerRef = useRef(null);
  const chatSectionRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  const [chatVisible, setChatVisible] = useState(false);
  const [weatherContext, setWeatherContext] = useState("");

  useEffect(() => {
    if (!user.city) return;
    const fetchData = async () => {
      try {
        const wRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(user.city)}&appid=${OWM_KEY}&units=metric`);
        const d = await wRes.json();
        const lat = d.coord.lat, lon = d.coord.lon;
        const aRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OWM_KEY}`);
        const a = await aRes.json();
        const aqi = a.list?.[0]?.main?.aqi;
        const aqiLabels = { 1:"Good 🟢", 2:"Fair 🟡", 3:"Moderate 🟠", 4:"Poor 🔴", 5:"Very Poor 🟣" };
        const pm25 = a.list?.[0]?.components?.pm2_5?.toFixed(1);
        const pm10 = a.list?.[0]?.components?.pm10?.toFixed(1);
        setWeatherContext(`City: ${d.name}, India\nTemperature: ${Math.round(d.main.temp)}°C (feels like ${Math.round(d.main.feels_like)}°C)\nCondition: ${d.weather[0].description}\nHumidity: ${d.main.humidity}%\nWind Speed: ${Math.round((d.wind.speed||0)*3.6)} km/h\nPressure: ${d.main.pressure} hPa\nVisibility: ${((d.visibility||10000)/1000).toFixed(1)} km\nHigh: ${Math.round(d.main.temp_max)}°C | Low: ${Math.round(d.main.temp_min)}°C\nAQI: ${aqiLabels[aqi]||"Unavailable"}\nPM2.5: ${pm25||"N/A"} μg/m³ | PM10: ${pm10||"N/A"} μg/m³`);
      } catch {}
    };
    fetchData();
  }, [user.city]);

  useEffect(() => { if (containerRef.current) containerRef.current.scrollTop = 0; }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      setScrollY(el.scrollTop);
      if (chatSectionRef.current) { const rect = chatSectionRef.current.getBoundingClientRect(); setChatVisible(rect.top < window.innerHeight * 0.88); }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const heroOpacity   = Math.max(0, 1 - scrollY / 380);
  const heroTranslate = scrollY * 0.3;
  const bgTranslate   = scrollY * 0.45;

  return (
    <div className="pageContainer" ref={containerRef}>

      {/* ── NAVBAR ── */}
      <nav className="topBar">
        <AeroSenseLogo />
        <div className="navRight">
          <button className="navProfile" onClick={onProfile}>
            <div className="navAvatar">{user.username?.[0]?.toUpperCase() || "U"}</div>
            <span className="navUsername">{user.username || "Profile"}</span>
          </button>
          <div className="navDivider" />
          <button className="logoutBtn" onClick={onLogout}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="heroSection">
        <div className="heroBg" style={{ transform: `translateY(${bgTranslate}px) scale(1.1)` }} />
        <div className="heroOverlay" />
        <div className="heroCenter" style={{ opacity: heroOpacity, transform: `translateY(${heroTranslate}px)` }}>
          <div className="badge-pill">🛰 Environmental Intelligence Platform</div>
          <h1 className="title"><span className="title-aero">Aero</span><span className="title-sense">Sense</span></h1>
          <p className="subtitle">Environmental Monitoring <span className="amp">&</span> Analytics</p>
          <p className="tagline">Real-time atmospheric data. Precision forecasting.<br/>Powered by stations across India.</p>
          <div className="hero-actions">
            <button className="btnPrimary" onClick={onViewWeather}>View Weather <span className="btn-arrow">→</span></button>
            <button className="btnSecondary" onClick={onExplore}>🗺 Explore Cities</button>
            <button className="btnDisaster" onClick={onDisaster}>⚠️ Disaster Risk</button>
            <button className="btnAdvisory" onClick={onAdvisory}>🤖 Advisory</button>
          </div>
          <div className="hero-meta"><span className="meta-dot" />2,400+ stations online</div>
        </div>
        <div className="scrollHint" style={{ opacity: Math.max(0, 1 - scrollY / 150) }} onClick={() => chatSectionRef.current?.scrollIntoView({ behavior: "smooth" })}>
          <div className="scroll-mouse"><div className="scroll-dot" /></div>
          <span className="scroll-label">Scroll to explore</span>
        </div>
      </section>

      {/* ── CHATBOT ── */}
      <section className="chatSection" ref={chatSectionRef}>
        <div className="chatBg" />
        <div className="orb orb1" /><div className="orb orb2" /><div className="orb orb3" />
        <div className={`chatSectionInner ${chatVisible ? "chat-animate-in" : ""}`}>
          <div className="chat-section-header">
            <div className="chat-header-badge">✦ AI ASSISTANT</div>
            <h2 className="chat-section-title">Meet <span className="chat-title-accent">AeroSense AI</span></h2>
            <p className="chat-section-subtitle">Powered by live weather data from your city. Ask anything about conditions, safety, or travel.</p>
          </div>
          <AeroSenseAI weatherContext={weatherContext} />
        </div>
      </section>

    </div>
  );
}
