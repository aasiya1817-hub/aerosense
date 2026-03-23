import React from "react";
import "./AdvisoryPage.css";

const OCCUPATIONS = [
  {
    id:       "farmer",
    title:    "Agriculture & Farming",
    subtitle: "Crop management, field operations & irrigation",
    icon:     "🌾",
    gradient: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.08))",
    border:   "rgba(34,197,94,0.25)",
    tag:      "Includes NPK Crop Advisor",
    tagColor: "#4ade80",
  },
  {
    id:       "civil",
    title:    "Civil Engineering",
    subtitle: "Construction safety, structural operations & worker management",
    icon:     "👷",
    gradient: "linear-gradient(135deg, rgba(251,146,60,0.15), rgba(245,158,11,0.08))",
    border:   "rgba(251,146,60,0.25)",
    tag:      "Site Safety Intelligence",
    tagColor: "#fb923c",
  },
  {
    id:       "event",
    title:    "Event Management",
    subtitle: "Outdoor events, crowd safety & contingency planning",
    icon:     "🎪",
    gradient: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(139,92,246,0.08))",
    border:   "rgba(168,85,247,0.25)",
    tag:      "Event Risk Assessment",
    tagColor: "#a855f7",
  },
  {
    id:       "scientist",
    title:    "Meteorology & Research",
    subtitle: "Synoptic analysis, atmospheric patterns & forecasting",
    icon:     "🔬",
    gradient: "linear-gradient(135deg, rgba(125,211,252,0.15), rgba(56,189,248,0.08))",
    border:   "rgba(125,211,252,0.25)",
    tag:      "Scientific Analysis",
    tagColor: "#7dd3fc",
  },
  {
    id:       "aviation",
    title:    "Aviation & Aerospace",
    subtitle: "Flight safety, meteorological minimums & ATC coordination",
    icon:     "✈️",
    gradient: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(79,70,229,0.08))",
    border:   "rgba(99,102,241,0.25)",
    tag:      "DGCA Compliance Advisory",
    tagColor: "#818cf8",
  },
  {
    id:       "fitness",
    title:    "Fitness & Outdoor Sports",
    subtitle: "Training safety, heat stress & performance optimization",
    icon:     "🏋️",
    gradient: "linear-gradient(135deg, rgba(244,63,94,0.15), rgba(239,68,68,0.08))",
    border:   "rgba(244,63,94,0.25)",
    tag:      "Athletic Performance Index",
    tagColor: "#f43f5e",
  },
  {
    id:       "logistics",
    title:    "Logistics & Transport",
    subtitle: "Route planning, cargo safety & supply chain management",
    icon:     "🚚",
    gradient: "linear-gradient(135deg, rgba(234,179,8,0.15), rgba(202,138,4,0.08))",
    border:   "rgba(234,179,8,0.25)",
    tag:      "Supply Chain Intelligence",
    tagColor: "#eab308",
  },
  {
    id:       "school",
    title:    "School Administration",
    subtitle: "Student safety, outdoor activities & campus management",
    icon:     "🏫",
    gradient: "linear-gradient(135deg, rgba(20,184,166,0.15), rgba(13,148,136,0.08))",
    border:   "rgba(20,184,166,0.25)",
    tag:      "Student Safety Protocol",
    tagColor: "#14b8a6",
  },
];

export default function AdvisoryPage({ user, onBack, onSelectOccupation }) {
  const city = user?.city || "Mumbai";

  return (
    <div className="ap-root">
      <div className="ap-bg-grid"/>
      <div className="ap-orb ap-orb1"/><div className="ap-orb ap-orb2"/>

      {/* NAV */}
      <nav className="ap-nav">
        <button className="ap-back" onClick={onBack}>← Back</button>
        <div className="ap-nav-center">
          <span className="ap-nav-logo"><span style={{color:"#fff"}}>Aero</span><span style={{color:"#7dd3fc"}}>Sense</span></span>
          <span className="ap-nav-sep"/>
          <span className="ap-nav-title">Intelligent Advisory System</span>
        </div>
        <div className="ap-nav-right">
          <div className="ap-city-pill">📍 {city}</div>
        </div>
      </nav>

      {/* HERO */}
      <div className="ap-hero">
        <div className="ap-hero-badge">🤖 ML-Powered · Real-Time Weather Intelligence</div>
        <h1 className="ap-hero-title">Weather Advisory<br/><span className="ap-hero-accent">Intelligence System</span></h1>
        <p className="ap-hero-sub">
          Select your professional domain to receive real-time, ML-generated advisory
          based on live atmospheric conditions in <strong style={{color:"#7dd3fc"}}>{city}</strong>.
          Trained on 771,456 real Indian weather data points.
        </p>
        <div className="ap-hero-stats">
          {[["771K+","Training Samples"],["8","Occupation Models"],["99%+","Model Accuracy"],["Live","Weather Data"]].map(([val,label])=>(
            <div className="ap-stat" key={label}>
              <div className="ap-stat-val">{val}</div>
              <div className="ap-stat-label">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CARDS */}
      <div className="ap-content">
        <div className="ap-section-label">Select Your Occupation</div>
        <div className="ap-grid">
          {OCCUPATIONS.map((occ, i) => (
            <button
              key={occ.id}
              className="ap-card"
              style={{background:occ.gradient, borderColor:occ.border, animationDelay:`${i*0.06}s`}}
              onClick={() => onSelectOccupation(occ)}
            >
              <div className="ap-card-top">
                <div className="ap-card-icon">{occ.icon}</div>
                <div className="ap-card-tag" style={{color:occ.tagColor, background:`${occ.tagColor}12`, border:`1px solid ${occ.tagColor}25`}}>
                  {occ.tag}
                </div>
              </div>
              <div className="ap-card-title">{occ.title}</div>
              <div className="ap-card-sub">{occ.subtitle}</div>
              <div className="ap-card-footer">
                <span className="ap-card-cta" style={{color:occ.tagColor}}>Get Advisory →</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
