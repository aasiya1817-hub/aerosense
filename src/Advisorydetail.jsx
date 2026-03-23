import React, { useState, useEffect, useRef } from "react";
import "./AdvisoryDetail.css";

const ML_API = "http://localhost:5000";

const OCC_THEME = {
  farmer:    { accent:"#86efac", glow:"rgba(134,239,172,0.12)", border:"rgba(134,239,172,0.18)" },
  civil:     { accent:"#fbbf24", glow:"rgba(251,191,36,0.12)",  border:"rgba(251,191,36,0.18)"  },
  event:     { accent:"#c084fc", glow:"rgba(192,132,252,0.12)", border:"rgba(192,132,252,0.18)" },
  aviation:  { accent:"#67e8f9", glow:"rgba(103,232,249,0.12)", border:"rgba(103,232,249,0.18)" },
  fitness:   { accent:"#fb7185", glow:"rgba(251,113,133,0.12)", border:"rgba(251,113,133,0.18)" },
  logistics: { accent:"#fde68a", glow:"rgba(253,230,138,0.12)", border:"rgba(253,230,138,0.18)" },
  school:    { accent:"#6ee7b7", glow:"rgba(110,231,183,0.12)", border:"rgba(110,231,183,0.18)" },
  scientist: { accent:"#93c5fd", glow:"rgba(147,197,253,0.12)", border:"rgba(147,197,253,0.18)" },
};

const SEV = {
  critical: { color:"#fca5a5", label:"CRITICAL" },
  high:     { color:"#fdba74", label:"HIGH ALERT" },
  medium:   { color:"#fde68a", label:"ADVISORY" },
  good:     { color:"#86efac", label:"FAVORABLE" },
};

// Typing hook
function useTyping(text, speed, go) {
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);
  const i = useRef(0);
  useEffect(() => {
    if (!text || !go) { setOut(""); setDone(false); i.current = 0; return; }
    i.current = 0; setOut(""); setDone(false);
    const t = setInterval(() => {
      i.current++;
      setOut(text.slice(0, i.current));
      if (i.current >= text.length) { clearInterval(t); setDone(true); }
    }, speed);
    return () => clearInterval(t);
  }, [text, go]);
  return { out, done };
}

// Crop section
function CropAdvisor({ city, weather, accent, border }) {
  const [form,    setForm]    = useState({ N:"", P:"", K:"", ph:"" });
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const predict = async () => {
    if (!form.N||!form.P||!form.K||!form.ph) { setError("All fields required"); return; }
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${ML_API}/crop`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ city, ...form, rainfall: weather?.rainfall||100 })
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setResult(d);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="crop-box" style={{borderColor:border}}>
      <div className="crop-header">
        <span className="crop-emoji">🌱</span>
        <div>
          <div className="crop-title">NPK Crop Intelligence Engine</div>
          <div className="crop-sub">ML model · 22 crop varieties · 99.3% accuracy · Kaggle dataset</div>
        </div>
      </div>
      <div className="crop-fields">
        {[
          {k:"N", l:"Nitrogen (N)",    p:"kg/ha"},
          {k:"P", l:"Phosphorus (P)",  p:"kg/ha"},
          {k:"K", l:"Potassium (K)",   p:"kg/ha"},
          {k:"ph",l:"Soil pH",         p:"3.5 – 9.5"},
        ].map(({k,l,p})=>(
          <div key={k} className="crop-field">
            <label className="crop-lbl">{l}</label>
            <input className="crop-inp" style={{"--a":accent}} type="number" placeholder={p}
              value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/>
          </div>
        ))}
      </div>
      {error && <div className="crop-err">{error}</div>}
      <button className="crop-btn" style={{"--a":accent, "--b":border}} onClick={predict} disabled={loading}>
        {loading ? "Analysing…" : "⚡  Predict Optimal Crop"}
      </button>
      {result && (
        <div className="crop-result" style={{borderColor:border}}>
          <div className="crop-res-row">
            <div>
              <div className="crop-res-lbl">Recommended Crop</div>
              <div className="crop-res-name" style={{color:accent}}>{result.recommended_crop?.toUpperCase()}</div>
            </div>
            <div className="crop-res-conf" style={{color:accent}}>{result.confidence}%<span>confidence</span></div>
          </div>
          <div className="crop-alts">
            {result.top_3?.map((c,i)=>(
              <div className="crop-alt" key={i}>
                <span className="crop-alt-rank">#{i+1}</span>
                <span className="crop-alt-name">{c.crop}</span>
                <span className="crop-alt-pct" style={{color:accent}}>{c.confidence}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdvisoryDetail({ user, occupation, onBack }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [phase,   setPhase]   = useState(0);

  const city  = user?.city || "Mumbai";
  const theme = OCC_THEME[occupation.id] || OCC_THEME.farmer;

  const fetch_ = async () => {
    setLoading(true); setError(null); setPhase(0); setData(null);
    try {
      const r = await fetch(`${ML_API}/advisory?city=${encodeURIComponent(city)}&occupation=${occupation.id}`);
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      setData(j);
      setTimeout(()=>setPhase(1), 100);
      setTimeout(()=>setPhase(2), 900);
      setTimeout(()=>setPhase(3), 1600);
      setTimeout(()=>setPhase(4), 2200);
    } catch(e) {
      setError(e.message.includes("fetch") ? "ML server offline — run: python app.py" : e.message);
    }
    setLoading(false);
  };

  useEffect(()=>{ fetch_(); }, [city, occupation.id]);

  const sev    = data ? SEV[data.advisory?.severity] || SEV.medium : null;
  const status = data?.advisory?.status   || "";
  const summ   = data?.advisory?.summary  || "";

  const { out:typedStatus, done:statusDone } = useTyping(status, 14, phase >= 1);
  const { out:typedSumm }                    = useTyping(summ,   7,  statusDone);

  return (
    <div className="adr-root" style={{"--acc":theme.accent,"--glow":theme.glow,"--bdr":theme.border}}>

      {/* glow blob */}
      <div className="adr-blob" style={{background:`radial-gradient(ellipse at 70% 10%, ${theme.glow}, transparent 55%)`}}/>

      {/* NAV */}
      <nav className="adr-nav">
        <button className="adr-back" onClick={onBack}>← All Advisories</button>
        <div className="adr-nav-mid">
          <span style={{fontSize:"1.2rem"}}>{occupation.icon}</span>
          <span className="adr-nav-title">{occupation.title}</span>
          <span className="adr-sep">·</span>
          <span className="adr-nav-city">📍 {city}</span>
        </div>
        <div className="adr-pill">
          <span className="adr-dot"/>Live ML
        </div>
      </nav>

      {/* LOADING */}
      {loading && (
        <div className="adr-loading">
          <div className="adr-ring" style={{borderTopColor:theme.accent}}/>
          <div className="adr-loading-title">Initialising Advisory Engine</div>
          <div className="adr-loading-steps">
            {["Fetching live atmospheric data from OpenWeather",
              "Running Random Forest classifier",
              "Generating intelligence report"].map((s,i)=>(
              <div key={i} className="adr-step" style={{animationDelay:`${i*0.35}s`}}>
                <span className="adr-step-dot" style={{background:theme.accent}}/>
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="adr-error">
          <div style={{fontSize:"2.5rem",marginBottom:12}}>⚡</div>
          <div className="adr-err-title">Connection Failed</div>
          <div className="adr-err-msg">{error}</div>
          <button className="adr-retry" onClick={fetch_}>Retry</button>
        </div>
      )}

      {/* MAIN */}
      {!loading && data && (
        <div className="adr-body">

          {/* ── STATUS HERO ── */}
          <div className="adr-hero" style={{opacity:phase>=1?1:0, transform:phase>=1?"none":"translateY(20px)", transition:"all 0.6s ease"}}>
            <div className="adr-hero-left">
              <div className="adr-tag" style={{color:theme.accent, borderColor:theme.border, background:`${theme.glow}`}}>
                {occupation.icon} {occupation.title}
              </div>

              <h1 className="adr-status" style={{color:sev?.color}}>
                {typedStatus}
                {!statusDone && <span className="adr-cursor" style={{background:sev?.color}}/>}
              </h1>

              <p className="adr-summ">
                {typedSumm}
                {typedSumm && typedSumm.length < summ.length && <span className="adr-cursor"/>}
              </p>

              <div className="adr-chips">
                <span className="adr-chip adr-chip-acc" style={{color:theme.accent, borderColor:theme.border}}>
                  🎯 {data.confidence}% ML confidence
                </span>
                <span className="adr-chip">⚙ {data.condition?.replace(/_/g," ")}</span>
                <span className="adr-chip">🗓 {data.weather?.season?.replace("_"," ")}</span>
              </div>
            </div>

            <div className="adr-badge" style={{color:sev?.color, borderColor:`${sev?.color}30`, background:`${sev?.color}0d`}}>
              <span className="adr-badge-dot" style={{background:sev?.color}}/>
              <div className="adr-badge-lbl">Alert Level</div>
              <div className="adr-badge-val">{sev?.label}</div>
            </div>
          </div>

          {/* ── WEATHER GRID ── */}
          <div className="adr-section" style={{opacity:phase>=2?1:0, transform:phase>=2?"none":"translateY(16px)", transition:"all 0.5s ease"}}>
            <div className="adr-sec-head">
              <div className="adr-sec-line" style={{background:theme.accent}}/>
              <span className="adr-sec-lbl">Live Atmospheric Data · {data.city}</span>
              <div className="adr-sec-line" style={{background:theme.accent}}/>
            </div>
            <div className="adr-wgrid">
              {[
                {icon:"🌡", label:"Temperature",  val:`${data.weather?.temp}°C`,       color:"#fbbf24"},
                {icon:"💧", label:"Humidity",     val:`${data.weather?.humidity}%`,    color:"#60a5fa"},
                {icon:"🌬", label:"Wind Speed",   val:`${data.weather?.wind_speed} km/h`, color:"#a78bfa"},
                {icon:"🌧", label:"Rainfall",     val:`${data.weather?.rainfall}mm`,   color:"#34d399"},
                {icon:"👁", label:"Visibility",   val:`${data.weather?.visibility}km`, color:theme.accent},
                {icon:"📊", label:"Pressure",     val:`${data.weather?.pressure}hPa`,  color:"#f9a8d4"},
              ].map(({icon,label,val,color},i)=>(
                <div key={label} className="adr-wcard"
                  style={{animationDelay:`${i*0.06}s`, borderColor:`${color}20`}}>
                  <div className="adr-wcard-icon">{icon}</div>
                  <div className="adr-wcard-val" style={{color}}>{val}</div>
                  <div className="adr-wcard-lbl">{label}</div>
                </div>
              ))}
            </div>
            <div className="adr-pills">
              {[["☁",data.weather?.description],["🌿",["","Good","Fair","Moderate","Poor","Very Poor"][data.weather?.aqi]||"—"]].map(([ic,v])=>(
                <span key={v} className="adr-wpill">{ic} {v}</span>
              ))}
            </div>
          </div>

          {/* ── ANALYSIS ── */}
          <div className="adr-section" style={{opacity:phase>=3?1:0, transform:phase>=3?"none":"translateY(16px)", transition:"all 0.5s ease"}}>
            <div className="adr-sec-head">
              <div className="adr-sec-line" style={{background:theme.accent}}/>
              <span className="adr-sec-lbl">Intelligence Analysis</span>
              <div className="adr-sec-line" style={{background:theme.accent}}/>
            </div>
            <div className="adr-analysis" style={{borderColor:theme.border}}>
              <div className="adr-analysis-glow" style={{background:theme.glow}}/>
              <div className="adr-terminal-line" style={{color:theme.accent}}>
                &gt; analysis.run(occupation="{occupation.id}", city="{city}")
              </div>
              <p className="adr-analysis-text">{data.advisory?.details}</p>
            </div>
          </div>

          {/* ── ACTIONS ── */}
          <div className="adr-section" style={{opacity:phase>=3?1:0, transition:"opacity 0.5s 0.15s"}}>
            <div className="adr-sec-head">
              <div className="adr-sec-line" style={{background:theme.accent}}/>
              <span className="adr-sec-lbl">Recommended Actions</span>
              <div className="adr-sec-line" style={{background:theme.accent}}/>
            </div>
            <div className="adr-actions">
              {data.advisory?.actions?.map((action,i)=>(
                <div key={i} className="adr-action" style={{animationDelay:`${i*0.07}s`, borderColor:`${theme.accent}15`}}>
                  <div className="adr-action-num" style={{color:theme.accent, borderColor:theme.border}}>
                    {String(i+1).padStart(2,"0")}
                  </div>
                  <div className="adr-action-txt">{action}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── INSIGHT ── */}
          {data.advisory?.insight && (
            <div className="adr-section" style={{opacity:phase>=4?1:0, transform:phase>=4?"none":"translateY(12px)", transition:"all 0.5s ease"}}>
              <div className="adr-sec-head">
                <div className="adr-sec-line" style={{background:theme.accent}}/>
                <span className="adr-sec-lbl">Expert Insight</span>
                <div className="adr-sec-line" style={{background:theme.accent}}/>
              </div>
              <div className="adr-insight" style={{borderColor:theme.border}}>
                <span className="adr-insight-tag" style={{color:theme.accent, borderColor:theme.border}}>💡 DATA POINT</span>
                <p className="adr-insight-txt">{data.advisory.insight}</p>
              </div>
            </div>
          )}

          {/* ── CROP ── */}
          {occupation.id==="farmer" && phase>=4 && (
            <div className="adr-section">
              <div className="adr-sec-head">
                <div className="adr-sec-line" style={{background:theme.accent}}/>
                <span className="adr-sec-lbl">NPK Crop Intelligence</span>
                <div className="adr-sec-line" style={{background:theme.accent}}/>
              </div>
              <CropAdvisor city={city} weather={data.weather} accent={theme.accent} border={theme.border}/>
            </div>
          )}

          {/* FOOTER */}
          <div className="adr-footer">
            <button className="adr-refresh" onClick={fetch_}>↻ Refresh</button>
            <span className="adr-footer-note">AeroSense ML · Random Forest · 771,456 samples</span>
          </div>

        </div>
      )}
    </div>
  );
}
