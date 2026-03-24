import React, { useState, useEffect } from "react";
import "./DisasterRisk.css";

const ML_API = "https://aerosense-ml-production.up.railway.app";

const DISASTER_CONFIG = {
  flood: {
    title: "Flood Risk", icon: "🌊",
    desc: "Risk of flooding based on rainfall, humidity and pressure",
    colors: { Low:"#4ade80", Medium:"#facc15", High:"#fb923c", Critical:"#f87171" },
    tips: {
      Low:      "No immediate flood threat. Normal conditions prevail.",
      Medium:   "Monitor rainfall. Avoid low-lying areas during heavy rain.",
      High:     "Stay away from rivers and drains. Keep emergency kit ready.",
      Critical: "Evacuate flood-prone areas immediately. Follow official advisories.",
    }
  },
  cyclone: {
    title: "Cyclone Risk", icon: "🌀",
    desc: "Risk of cyclonic activity based on wind speed and pressure",
    colors: { Low:"#4ade80", Medium:"#facc15", High:"#fb923c", Critical:"#f87171" },
    tips: {
      Low:      "Clear skies expected. Safe for all outdoor activities.",
      Medium:   "Watch for wind advisories. Secure loose outdoor items.",
      High:     "Strong winds expected. Avoid coastal areas and trees.",
      Critical: "Cyclone warning! Stay indoors. Follow evacuation orders.",
    }
  },
  heatwave: {
    title: "Heatwave Risk", icon: "🔥",
    desc: "Risk of extreme heat based on temperature and humidity",
    colors: { Low:"#4ade80", Medium:"#facc15", High:"#fb923c", Critical:"#f87171" },
    tips: {
      Low:      "Temperature is comfortable. Enjoy the outdoors!",
      Medium:   "Stay hydrated. Wear light clothing. Avoid peak sun hours.",
      High:     "Avoid outdoor activity between 12–4 PM. Drink plenty of water.",
      Critical: "Extreme heat alert! Stay indoors. Check on elderly neighbours.",
    }
  },
  air_quality: {
    title: "Air Quality Crisis", icon: "🌫",
    desc: "Risk of hazardous air quality based on AQI and conditions",
    colors: { Low:"#4ade80", Medium:"#facc15", High:"#fb923c", Critical:"#f87171" },
    tips: {
      Low:      "Air quality is good. Safe for all outdoor activities.",
      Medium:   "Sensitive groups should limit prolonged outdoor exposure.",
      High:     "Wear N95 mask outdoors. Keep windows closed indoors.",
      Critical: "Hazardous air quality! Stay indoors. Avoid all outdoor activity.",
    }
  },
};

const RISK_ORDER = { Low:1, Medium:2, High:3, Critical:4 };

function RiskGauge({ risk, confidence }) {
  const pct    = { Low:12, Medium:38, High:68, Critical:93 }[risk] || 0;
  const color  = { Low:"#4ade80", Medium:"#facc15", High:"#fb923c", Critical:"#f87171" }[risk] || "#94a3b8";
  const half   = Math.PI * 54;
  const offset = half - (pct / 100) * half;
  return (
    <div className="dr-gauge-wrap">
      <svg width="140" height="82" viewBox="0 0 140 82">
        <path d="M 13 78 A 57 57 0 0 1 127 78" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round"/>
        <path d="M 13 78 A 57 57 0 0 1 127 78" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={half} strokeDashoffset={offset}
          style={{transition:"stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)"}}/>
      </svg>
      <div className="dr-gauge-label">
        <div className="dr-gauge-risk" style={{color}}>{risk}</div>
        <div className="dr-gauge-conf">{confidence}% sure</div>
      </div>
    </div>
  );
}

function DisasterCard({ type, pred, index }) {
  const cfg    = DISASTER_CONFIG[type];
  const risk   = pred?.risk || "Low";
  const conf   = pred?.confidence || 0;
  const color  = cfg.colors[risk];
  return (
    <div className="dr-card" style={{"--c":color, animationDelay:`${index*0.08}s`}}>
      <div className="dr-card-header">
        <div className="dr-card-emoji">{cfg.icon}</div>
        <div className="dr-card-meta">
          <div className="dr-card-title">{cfg.title}</div>
          <div className="dr-card-desc">{cfg.desc}</div>
        </div>
        <div className="dr-badge" style={{color, background:`${color}18`, border:`1px solid ${color}35`}}>{risk}</div>
      </div>

      <RiskGauge risk={risk} confidence={conf}/>

      <div className="dr-tip">
        <span className="dr-tip-dot" style={{background:color}}/>
        <span className="dr-tip-text">{cfg.tips[risk]}</span>
      </div>

      <div className="dr-bar-row">
        <span className="dr-bar-label">Confidence</span>
        <div className="dr-bar-track"><div className="dr-bar-fill" style={{width:`${conf}%`, background:color}}/></div>
        <span className="dr-bar-val" style={{color}}>{conf}%</span>
      </div>
    </div>
  );
}

function WeatherStrip({ weather, city }) {
  const aqiLabel = ["","Good","Fair","Moderate","Poor","Very Poor"][weather.aqi] || "—";
  const aqiColor = ["","#4ade80","#a3e635","#facc15","#fb923c","#f87171"][weather.aqi] || "#94a3b8";
  const items = [
    { icon:"🌡", label:"Temperature", val:`${weather.temp}°C`           },
    { icon:"💧", label:"Humidity",    val:`${weather.humidity}%`         },
    { icon:"🌬", label:"Wind Speed",  val:`${weather.wind_speed} km/h`   },
    { icon:"📊", label:"Pressure",    val:`${weather.pressure} hPa`      },
    { icon:"🌧", label:"Rainfall",    val:`${weather.rainfall} mm`       },
    { icon:"🌿", label:"AQI",         val:aqiLabel, color:aqiColor        },
    { icon:"🗓", label:"Season",      val:weather.season?.replace("_"," ")},
  ];
  return (
    <div className="dr-strip">
      {items.map(({icon,label,val,color})=>(
        <div className="dr-strip-item" key={label}>
          <span className="dr-strip-icon">{icon}</span>
          <div className="dr-strip-label">{label}</div>
          <div className="dr-strip-val" style={color?{color}:{}}>{val}</div>
        </div>
      ))}
    </div>
  );
}

export default function DisasterRisk({ user, onBack }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const city = user?.city || "Mumbai";

  const fetchPrediction = async () => {
    try {
      setLoading(true); setError(null);
      const res  = await fetch(`${ML_API}/predict?city=${encodeURIComponent(city)}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e.message.includes("fetch") || e.message.includes("Failed")
        ? "ML server not running! Start Flask API: python app.py in aerosense-ml folder."
        : e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPrediction(); }, [city]);

  const overallRisk = data
    ? Object.values(data.predictions).reduce((max, d) =>
        RISK_ORDER[d.risk] > RISK_ORDER[max] ? d.risk : max, "Low")
    : null;
  const overallColor = { Low:"#4ade80", Medium:"#facc15", High:"#fb923c", Critical:"#f87171" };

  return (
    <div className="dr-root">

      {/* ── TOPBAR ── */}
      <div className="dr-topbar">
        <button className="dr-back" onClick={onBack}>← Back</button>
        <div className="dr-topbar-mid">
          <div className="dr-topbar-title">⚠️ Disaster Risk Assessment</div>
          <div className="dr-topbar-sub">AI-powered real-time predictions · <span style={{color:"#7dd3fc"}}>{city}</span></div>
        </div>
        {overallRisk && (
          <div className="dr-overall" style={{borderColor:`${overallColor[overallRisk]}35`, background:`${overallColor[overallRisk]}10`}}>
            <div className="dr-overall-label">Overall Risk</div>
            <div className="dr-overall-val" style={{color:overallColor[overallRisk]}}>{overallRisk}</div>
          </div>
        )}
      </div>

      {/* ── LOADING ── */}
      {loading && (
        <div className="dr-loading">
          <div className="dr-spinner"/>
          <p>Analysing live weather for <strong style={{color:"#7dd3fc"}}>{city}</strong></p>
          <small>Running predictions across 4 ML disaster models…</small>
        </div>
      )}

      {/* ── ERROR ── */}
      {!loading && error && (
        <div className="dr-error">
          <div style={{fontSize:"3rem",marginBottom:12}}>🔌</div>
          <div className="dr-error-title">Prediction Failed</div>
          <div className="dr-error-msg">{error}</div>
          <button className="dr-retry" onClick={fetchPrediction}>🔄 Retry</button>
        </div>
      )}

      {/* ── DATA ── */}
      {!loading && data && (
        <div className="dr-body">
          <div className="dr-section-title">📡 Live Weather · {data.city}</div>
          <WeatherStrip weather={data.weather} city={data.city}/>

          <div className="dr-section-title" style={{marginTop:28}}>🤖 ML Disaster Predictions</div>
          <div className="dr-grid">
            {Object.entries(data.predictions).map(([type, pred], i) => (
              <DisasterCard key={type} type={type} pred={pred} index={i}/>
            ))}
          </div>

          <div className="dr-footnote">
            🧠 Predictions generated by Random Forest classifier trained on 5,000 Indian weather scenarios · Accuracy: 99%+
          </div>
        </div>
      )}
    </div>
  );
}
