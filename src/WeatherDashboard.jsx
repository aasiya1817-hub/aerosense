import React, { useState, useEffect, useRef } from "react";
import "./WeatherDashboard.css";

const API_KEY      = "3eb9f7833ab61f790ef56eabc77c80d8";
const NEWS_API_KEY = "df018ca5a7a44dc78047e4051190b01a";

const getIcon = (code, isDay = true) => {
  if (code >= 200 && code < 300) return "⛈";
  if (code >= 300 && code < 400) return "🌦";
  if (code >= 500 && code < 600) return "🌧";
  if (code >= 600 && code < 700) return "❄️";
  if (code >= 700 && code < 800) return "🌫";
  if (code === 800) return isDay ? "☀️" : "🌙";
  if (code === 801) return "🌤";
  if (code === 802) return "⛅";
  if (code >= 803) return "☁️";
  return "🌡";
};

const windDir = (deg) => ["N","NE","E","SE","S","SW","W","NW"][Math.round(deg/45)%8];
const fmtTime = (unix, tz) => { const d = new Date((unix+tz)*1000); return d.toUTCString().slice(17,22); };

const getAQILevel = (aqi) => {
  const levels = ["","Good","Fair","Moderate","Poor","Very Poor"];
  const colors  = ["","#4ade80","#a3e635","#facc15","#fb923c","#f87171"];
  return { label: levels[aqi]||"—", color: colors[aqi]||"#94a3b8" };
};

const getDangerLevel = (weather, aqi) => {
  let score = 0;
  const temp=weather.main.temp, wind=weather.wind.speed*3.6;
  const code=weather.weather[0].id, aqiV=aqi?.main?.aqi||0;
  if (temp>=45) score+=3; else if (temp>=38) score+=2; else if (temp>=34) score+=1;
  if (temp<=2)  score+=3; else if (temp<=8)  score+=2;
  if (wind>=70) score+=3; else if (wind>=50) score+=2; else if (wind>=30) score+=1;
  if (code>=200&&code<300) score+=3;
  if (code>=500&&code<600) score+=1;
  if (code>=600&&code<700) score+=2;
  if (weather.main.humidity>=90) score+=1;
  if (aqiV>=5) score+=2; else if (aqiV>=4) score+=1;
  if (score>=6) return { level:"DANGER",  color:"#ef4444", bg:"rgba(239,68,68,0.1)",   border:"rgba(239,68,68,0.25)",   icon:"🚨", desc:"Extreme conditions. Stay indoors." };
  if (score>=3) return { level:"WARNING", color:"#f97316", bg:"rgba(249,115,22,0.1)",  border:"rgba(249,115,22,0.25)",  icon:"⚠️", desc:"Adverse weather. Take precautions." };
  return             { level:"NORMAL",  color:"#4ade80", bg:"rgba(74,222,128,0.07)", border:"rgba(74,222,128,0.2)",  icon:"✅", desc:"Conditions are safe. Enjoy your day!" };
};

function Sparkline({ data, color }) {
  if (!data||data.length<2) return null;
  const W=400,H=90,pad=12,min=Math.min(...data),max=Math.max(...data),range=max-min||1;
  const pts=data.map((v,i)=>({x:pad+(i/(data.length-1))*(W-pad*2),y:H-pad-((v-min)/range)*(H-pad*2-10)}));
  const line=pts.map((p,i)=>`${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const fill=`${line} L${pts.at(-1).x},${H} L${pts[0].x},${H} Z`;
  const id=`sg${color.replace(/[^a-z0-9]/gi,"")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{width:"100%",height:"100%"}}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.35"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <path d={fill} fill={`url(#${id})`}/><path d={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3" fill={color}/>)}
    </svg>
  );
}

function BarChart({ data, color }) {
  if (!data||data.length<2) return null;
  const W=400,H=90,pad=12,max=Math.max(...data,1),bw=(W-pad*2)/data.length-3;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{width:"100%",height:"100%"}}>
      {data.map((v,i)=>{ const bh=Math.max(3,(v/max)*(H-pad*2)),x=pad+i*((W-pad*2)/data.length)+1.5; return <rect key={i} x={x} y={H-pad-bh} width={bw} height={bh} rx="3" fill={color} opacity="0.75"/>; })}
    </svg>
  );
}

function WindCompass({ deg, speed }) {
  const dir=windDir(deg);
  return (
    <div className="compass-outer">
      <svg viewBox="0 0 140 140" className="compass-svg">
        <circle cx="70" cy="70" r="62" fill="rgba(99,102,241,0.06)" stroke="rgba(99,102,241,0.2)" strokeWidth="1"/>
        <circle cx="70" cy="70" r="44" fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="1"/>
        {Array.from({length:36},(_,i)=>{ const a=(i*10-90)*Math.PI/180,isMaj=i%9===0,r1=isMaj?54:58,r2=62; return <line key={i} x1={70+r1*Math.cos(a)} y1={70+r1*Math.sin(a)} x2={70+r2*Math.cos(a)} y2={70+r2*Math.sin(a)} stroke={isMaj?"rgba(99,102,241,0.5)":"rgba(99,102,241,0.15)"} strokeWidth={isMaj?1.5:0.8}/>; })}
        {[["N",70,12],["E",126,74],["S",70,132],["W",14,74]].map(([l,x,y])=>(<text key={l} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="rgba(148,163,184,0.8)" fontSize="9" fontFamily="Outfit" fontWeight="700">{l}</text>))}
        <g transform={`rotate(${deg},70,70)`}><polygon points="70,22 73.5,68 70,78 66.5,68" fill="#6366f1"/><polygon points="70,118 73.5,72 70,62 66.5,72" fill="rgba(148,163,184,0.25)"/></g>
        <circle cx="70" cy="70" r="7" fill="#6366f1"/><circle cx="70" cy="70" r="3.5" fill="white"/>
      </svg>
      <div className="compass-labels"><span className="compass-speed">{speed}</span><span className="compass-unit">km/h {dir}</span></div>
    </div>
  );
}

// ── Floating Side Panel ──
function FloatingPanel({ weather, forecast, hourly, aqi, unit, toF, alerts, dangerInfo }) {
  const reportRef  = useRef(null);
  const [generating, setGenerating] = useState(false);
  const [collapsed,  setCollapsed]  = useState(false);
  const unitLabel  = unit==="F"?"°F":"°C";
  const now        = new Date();
  const isDay      = now.getHours()>=6&&now.getHours()<19;
  const dateStr    = now.toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const timeStr    = now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
  const aqiInfo    = aqi?getAQILevel(aqi.main.aqi):null;
  const dayNamesFull=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  const loadScript=(src)=>new Promise(resolve=>{
    if(document.querySelector(`script[src="${src}"]`)){resolve();return;}
    const s=document.createElement("script");s.src=src;s.onload=resolve;document.head.appendChild(s);
  });

  const generatePDF=async()=>{
    setGenerating(true);
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      await new Promise(r=>setTimeout(r,400));
      const canvas=await window.html2canvas(reportRef.current,{scale:2,useCORS:true,backgroundColor:"#0a0f1e",logging:false});
      const imgData=canvas.toDataURL("image/png");
      const{jsPDF:JsPDF}=window.jspdf;
      const pdf=new JsPDF({orientation:"portrait",unit:"mm",format:"a4"});
      const pageW=pdf.internal.pageSize.getWidth(),pageH=pdf.internal.pageSize.getHeight();
      const imgW=pageW,imgH=(canvas.height*imgW)/canvas.width;
      let heightLeft=imgH,position=0;
      pdf.addImage(imgData,"PNG",0,position,imgW,imgH);heightLeft-=pageH;
      while(heightLeft>0){position=heightLeft-imgH;pdf.addPage();pdf.addImage(imgData,"PNG",0,position,imgW,imgH);heightLeft-=pageH;}
      pdf.save(`AeroSense_${weather.name}_${now.toISOString().slice(0,10)}.pdf`);
    } catch(err){console.error(err);alert("PDF generation failed.");}
    setGenerating(false);
  };

  return (
    <>
      <div className={`floating-panel ${collapsed?"collapsed":""}`}>
        <button className="panel-toggle" onClick={()=>setCollapsed(!collapsed)}>{collapsed?"◀":"▶"}</button>
        <div className="panel-inner">

          <div className="panel-header">
            <span className="panel-logo"><span style={{color:"#fff"}}>Aero</span><span style={{color:"#7dd3fc"}}>Sense</span></span>
            <span className="panel-sub">Quick Actions</span>
          </div>

          {/* Danger Detection */}
          <div className="panel-section danger-widget" style={{background:dangerInfo.bg,border:`1px solid ${dangerInfo.border}`}}>
            <div className="danger-header">
              <span className="danger-icon">{dangerInfo.icon}</span>
              <div>
                <div className="danger-label">Weather Status</div>
                <div className="danger-level" style={{color:dangerInfo.color}}>{dangerInfo.level}</div>
              </div>
              <div className="danger-ring" style={{borderColor:dangerInfo.color}}/>
            </div>
            <div className="danger-desc">{dangerInfo.desc}</div>
            <div className="danger-bars">
              {[
                ["Temp",   Math.min(100,Math.max(0,((weather.main.temp-10)/40)*100)),"#fb923c"],
                ["Wind",   Math.min(100,(weather.wind.speed*3.6/80)*100),            "#818cf8"],
                ["AQI",    Math.min(100,((aqi?.main?.aqi||0)/5)*100),                "#f87171"],
                ["Humid",  weather.main.humidity,                                    "#60a5fa"],
              ].map(([label,val,color])=>(
                <div key={label} className="danger-bar-row">
                  <span className="danger-bar-label">{label}</span>
                  <div className="danger-bar-track"><div className="danger-bar-fill" style={{width:`${val}%`,background:color}}/></div>
                  <span className="danger-bar-val" style={{color}}>{Math.round(val)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* PDF Report */}
          <div className="panel-section pdf-widget">
            <div className="pdf-widget-header">
              <span className="pdf-widget-icon">📄</span>
              <div>
                <div className="pdf-widget-title">Weather Report</div>
                <div className="pdf-widget-sub">Full PDF · {weather.name}</div>
              </div>
            </div>
            <div className="pdf-widget-meta">
              <span>📅 {now.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>
              <span>🕐 {now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span>
            </div>
            <div className="pdf-includes">
              {["Current conditions","5-day forecast","AQI breakdown","Smart alerts","Hourly summary"].map(item=>(
                <div key={item} className="pdf-include-item"><span className="pdf-check">✓</span>{item}</div>
              ))}
            </div>
            <button onClick={generatePDF} disabled={generating} className="pdf-generate-btn">
              {generating
                ?<><span className="pdf-spinner"/>Generating…</>
                :<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Download Report</>
              }
            </button>
          </div>

          {/* Quick Stats */}
          <div className="panel-section panel-quickstats">
            <div className="panel-qs-title">Live Snapshot</div>
            {[
              ["🌡","Temp",`${toF(weather.main.temp)}${unitLabel}`],
              ["💧","Humidity",`${weather.main.humidity}%`],
              ["🌬","Wind",`${Math.round(weather.wind.speed*3.6)} km/h`],
              ["🌿","AQI",aqiInfo?.label||"—"],
            ].map(([icon,label,val])=>(
              <div key={label} className="panel-qs-row"><span>{icon} {label}</span><span className="panel-qs-val">{val}</span></div>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden PDF template */}
      <div style={{position:"fixed",left:"-9999px",top:0,zIndex:-1}}>
        <div ref={reportRef} style={{width:"794px",background:"#0a0f1e",fontFamily:"'Segoe UI',Arial,sans-serif",color:"#f1f5f9"}}>
          <div style={{background:"linear-gradient(135deg,#0c1a3a,#0a2a4a,#061d35)",borderBottom:"2px solid rgba(125,211,252,0.3)",padding:"36px 48px 28px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:"-40px",right:"-40px",width:"200px",height:"200px",background:"radial-gradient(circle,rgba(14,165,233,0.15),transparent 70%)",borderRadius:"50%"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px"}}>
                  <svg width="36" height="36" viewBox="0 0 38 38" fill="none"><circle cx="19" cy="19" r="17.5" stroke="#7dd3fc" strokeWidth="1.2" strokeDasharray="4 2.5"/><circle cx="19" cy="19" r="5.5" fill="#0ea5e9"/><circle cx="19" cy="19" r="2.8" fill="white"/><path d="M19 2.5 A16.5 16.5 0 0 1 35.5 19" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/></svg>
                  <span style={{fontSize:"28px",fontWeight:"900"}}><span style={{color:"#fff"}}>Aero</span><span style={{color:"#7dd3fc"}}>Sense</span></span>
                </div>
                <div style={{fontSize:"12px",color:"rgba(255,255,255,0.45)",letterSpacing:"0.1em",textTransform:"uppercase"}}>Environmental Intelligence Platform</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:"13px",color:"rgba(255,255,255,0.6)",marginBottom:"4px"}}>{dateStr}</div>
                <div style={{fontSize:"12px",color:"rgba(255,255,255,0.35)"}}>Generated at {timeStr}</div>
                <div style={{marginTop:"8px",display:"inline-block",padding:"4px 12px",background:"rgba(125,211,252,0.12)",border:"1px solid rgba(125,211,252,0.25)",borderRadius:"20px",fontSize:"11px",color:"#7dd3fc"}}>WEATHER REPORT</div>
              </div>
            </div>
            <div style={{marginTop:"24px",display:"flex",alignItems:"center",gap:"10px"}}>
              <span style={{fontSize:"20px"}}>📍</span>
              <div><div style={{fontSize:"22px",fontWeight:"700",color:"#fff"}}>{weather.name}, India</div><div style={{fontSize:"12px",color:"rgba(255,255,255,0.4)"}}>Live atmospheric data report</div></div>
              <div style={{marginLeft:"auto",padding:"7px 18px",background:dangerInfo.bg,border:`1px solid ${dangerInfo.border}`,borderRadius:"50px",fontSize:"13px",fontWeight:"700",color:dangerInfo.color}}>{dangerInfo.icon} {dangerInfo.level}</div>
            </div>
          </div>
          <div style={{padding:"32px 48px"}}>
            <div style={{fontSize:"11px",color:"#7dd3fc",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"16px",fontWeight:"600"}}>◆ Current Conditions</div>
            <div style={{display:"flex",gap:"16px",marginBottom:"28px"}}>
              <div style={{flex:"0 0 200px",background:"rgba(125,211,252,0.06)",border:"1px solid rgba(125,211,252,0.15)",borderRadius:"16px",padding:"24px",textAlign:"center"}}>
                <div style={{fontSize:"48px",marginBottom:"4px"}}>{getIcon(weather.weather[0].id,isDay)}</div>
                <div style={{fontSize:"44px",fontWeight:"900",color:"#fff",lineHeight:1}}>{toF(weather.main.temp)}<span style={{fontSize:"22px",color:"#7dd3fc"}}>{unitLabel}</span></div>
                <div style={{fontSize:"13px",color:"rgba(255,255,255,0.5)",marginTop:"6px",textTransform:"capitalize"}}>{weather.weather[0].description}</div>
                <div style={{fontSize:"12px",color:"rgba(255,255,255,0.35)",marginTop:"4px"}}>Feels like {toF(weather.main.feels_like)}{unitLabel}</div>
              </div>
              <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                {[["💧","Humidity",`${weather.main.humidity}%`],["🌬","Wind",`${Math.round(weather.wind.speed*3.6)} km/h`],["👁","Visibility",`${(weather.visibility/1000).toFixed(1)} km`],["🌡","Pressure",`${weather.main.pressure} hPa`],["🌅","Sunrise",fmtTime(weather.sys.sunrise,weather.timezone)],["🌇","Sunset",fmtTime(weather.sys.sunset,weather.timezone)],["📊","H/L",`${toF(weather.main.temp_max)}${unitLabel}/${toF(weather.main.temp_min)}${unitLabel}`],["☁","Clouds",`${weather.clouds.all}%`]].map(([ic,lb,vl])=>(
                  <div key={lb} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"10px",padding:"10px 12px",display:"flex",alignItems:"center",gap:"8px"}}>
                    <span style={{fontSize:"15px"}}>{ic}</span>
                    <div><div style={{fontSize:"9px",color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"0.06em"}}>{lb}</div><div style={{fontSize:"12px",color:"#f1f5f9",fontWeight:"600"}}>{vl}</div></div>
                  </div>
                ))}
              </div>
            </div>
            {aqi&&aqiInfo&&(<>
              <div style={{fontSize:"11px",color:"#7dd3fc",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"12px",fontWeight:"600"}}>◆ Air Quality Index</div>
              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"14px",padding:"16px 24px",marginBottom:"24px",display:"flex",alignItems:"center",gap:"32px"}}>
                <div><div style={{fontSize:"10px",color:"rgba(255,255,255,0.4)",marginBottom:"4px"}}>Overall AQI</div><div style={{fontSize:"20px",fontWeight:"800",color:aqiInfo.color}}>{aqiInfo.label}</div></div>
                {[["PM2.5",aqi.components.pm2_5?.toFixed(1)],["PM10",aqi.components.pm10?.toFixed(1)],["NO₂",aqi.components.no2?.toFixed(1)],["O₃",aqi.components.o3?.toFixed(1)]].map(([k,v])=>(
                  <div key={k} style={{textAlign:"center"}}><div style={{fontSize:"10px",color:"rgba(255,255,255,0.35)",textTransform:"uppercase"}}>{k}</div><div style={{fontSize:"14px",fontWeight:"700",color:"#f1f5f9"}}>{v}</div><div style={{fontSize:"9px",color:"rgba(255,255,255,0.3)"}}>μg/m³</div></div>
                ))}
              </div>
            </>)}
            {alerts.length>0&&(<>
              <div style={{fontSize:"11px",color:"#7dd3fc",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"12px",fontWeight:"600"}}>◆ Smart Alerts</div>
              <div style={{display:"flex",flexDirection:"column",gap:"7px",marginBottom:"24px"}}>
                {alerts.map((a,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:"12px",background:"rgba(251,146,60,0.07)",border:"1px solid rgba(251,146,60,0.2)",borderRadius:"10px",padding:"9px 16px"}}><span style={{fontSize:"15px"}}>{a.icon}</span><span style={{fontSize:"12px",color:"rgba(255,255,255,0.75)"}}>{a.text}</span></div>))}
              </div>
            </>)}
            <div style={{fontSize:"11px",color:"#7dd3fc",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"12px",fontWeight:"600"}}>◆ 5-Day Forecast</div>
            <div style={{display:"flex",flexDirection:"column",gap:"7px",marginBottom:"28px"}}>
              {forecast.map((f,i)=>{ const d=new Date(f.dt*1000); return (
                <div key={i} style={{display:"grid",gridTemplateColumns:"130px 44px 1fr 70px 130px",gap:"12px",alignItems:"center",padding:"11px 16px",background:i===0?"rgba(125,211,252,0.07)":"rgba(255,255,255,0.025)",border:i===0?"1px solid rgba(125,211,252,0.2)":"1px solid rgba(255,255,255,0.06)",borderRadius:"10px"}}>
                  <span style={{fontSize:"13px",fontWeight:i===0?"700":"400",color:i===0?"#7dd3fc":"#f1f5f9"}}>{i===0?"Today":dayNamesFull[d.getDay()]}</span>
                  <span style={{fontSize:"18px"}}>{getIcon(f.weather[0].id)}</span>
                  <span style={{fontSize:"12px",color:"rgba(255,255,255,0.6)",textTransform:"capitalize"}}>{f.weather[0].description}</span>
                  <span style={{fontSize:"12px",color:"#60a5fa"}}>💧{Math.round((f.pop||0)*100)}%</span>
                  <span style={{fontSize:"12px"}}><span style={{color:"#fb923c"}}>{toF(f.main.temp_max)}{unitLabel}</span>{" / "}<span style={{color:"#60a5fa"}}>{toF(f.main.temp_min)}{unitLabel}</span></span>
                </div>
              );})}
            </div>
            <div style={{fontSize:"11px",color:"#7dd3fc",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"12px",fontWeight:"600"}}>◆ Next 24 Hours</div>
            <div style={{display:"flex",gap:"7px",marginBottom:"32px"}}>
              {hourly.slice(0,8).map((h,i)=>{ const d=new Date(h.dt*1000); return (
                <div key={i} style={{flex:"1",textAlign:"center",background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"10px",padding:"10px 6px"}}>
                  <div style={{fontSize:"10px",color:"rgba(255,255,255,0.35)",marginBottom:"4px"}}>{d.getHours()}:00</div>
                  <div style={{fontSize:"17px",marginBottom:"4px"}}>{getIcon(h.weather[0].id,d.getHours()>=6&&d.getHours()<19)}</div>
                  <div style={{fontSize:"11px",fontWeight:"600",color:"#f1f5f9"}}>{toF(h.main.temp)}{unitLabel}</div>
                  <div style={{fontSize:"10px",color:"#60a5fa"}}>💧{Math.round((h.pop||0)*100)}%</div>
                </div>
              );})}
            </div>
            <div style={{borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:"18px",display:"flex",justifyContent:"space-between"}}>
              <div style={{fontSize:"10px",color:"rgba(255,255,255,0.25)"}}>Generated by AeroSense Environmental Intelligence Platform</div>
              <div style={{fontSize:"10px",color:"rgba(255,255,255,0.25)"}}>Data sourced from OpenWeatherMap API · {dateStr}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── News Tab ──
function NewsTab({ city }) {
  const [news,    setNews]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(()=>{
    const fetchNews=async()=>{
      try {
        setLoading(true);
        // Strictly weather/climate news — no sports/cricket leak
        const res=await fetch(
          `https://newsapi.org/v2/everything?q=(weather+OR+climate+OR+rainfall+OR+heatwave+OR+cyclone+OR+flood+OR+storm+OR+monsoon+OR+temperature)+India&language=en&sortBy=publishedAt&pageSize=12&apiKey=${NEWS_API_KEY}`
        );
        const data=await res.json();
        if(data.status!=="ok") throw new Error("News unavailable");
        setNews(data.articles.filter(a=>a.title&&a.title!=="[Removed]"));
      } catch(e){ setError(e.message); } finally { setLoading(false); }
    };
    fetchNews();
  },[city]);

  const timeAgo=(dateStr)=>{
    const diff=Date.now()-new Date(dateStr).getTime();
    const h=Math.floor(diff/3600000);
    if(h<1) return "Just now";
    if(h<24) return `${h}h ago`;
    return `${Math.floor(h/24)}d ago`;
  };

  if(loading) return <div className="news-loading"><div className="wd-spinner"/><p>Fetching latest weather news…</p></div>;
  if(error)   return <div className="news-loading"><p style={{fontSize:"2rem"}}>📡</p><p style={{color:"#f87171",marginTop:"8px"}}>Could not load news</p><small style={{color:"rgba(255,255,255,0.3)"}}>{error}</small></div>;

  return (
    <div className="news-grid">
      {news.map((article,i)=>(
        <a key={i} href={article.url} target="_blank" rel="noreferrer" className={`news-card ${i===0?"news-card-featured":""}`}>
          {article.urlToImage&&(
            <div className="news-img-wrap">
              <img src={article.urlToImage} alt="" className="news-img" onError={e=>e.target.style.display="none"}/>
              <div className="news-img-overlay"/>
            </div>
          )}
          <div className="news-content">
            <div className="news-meta">
              <span className="news-source">{article.source?.name||"News"}</span>
              <span className="news-time">{timeAgo(article.publishedAt)}</span>
            </div>
            <div className="news-title">{article.title}</div>
            {i===0&&article.description&&<div className="news-desc">{article.description}</div>}
          </div>
        </a>
      ))}
    </div>
  );
}

// ── MAIN ──
export default function WeatherDashboard({ onLogout, cityOverride, onBack }) {
  const [weather,  setWeather]  = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourly,   setHourly]   = useState([]);
  const [aqi,      setAqi]      = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [time,     setTime]     = useState(new Date());
  const [unit,     setUnit]     = useState("C");
  const [activeTab,setActiveTab]= useState("weather");

  const user=JSON.parse(localStorage.getItem("user")||"{}");
  const city=cityOverride||user.city||"Mumbai";
  const toF=(c)=>unit==="F"?Math.round(c*9/5+32):Math.round(c);
  const unitLabel=unit==="F"?"°F":"°C";

  useEffect(()=>{ const t=setInterval(()=>setTime(new Date()),1000); return()=>clearInterval(t); },[]);

  useEffect(()=>{
    const fetchAll=async()=>{
      try {
        setLoading(true);setError(null);
        const[cRes,fRes]=await Promise.all([
          fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},IN&appid=${API_KEY}&units=metric`),
          fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)},IN&appid=${API_KEY}&units=metric&cnt=40`),
        ]);
        if(!cRes.ok) throw new Error("City not found");
        const cur=await cRes.json(),for_=await fRes.json();
        setWeather(cur);setHourly(for_.list.slice(0,8));
        const aqiRes=await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${cur.coord.lat}&lon=${cur.coord.lon}&appid=${API_KEY}`);
        if(aqiRes.ok){const aqiData=await aqiRes.json();setAqi(aqiData.list?.[0]);}
        const days={};
        for_.list.forEach(item=>{const key=new Date(item.dt*1000).toDateString();if(!days[key])days[key]=item;});
        setForecast(Object.values(days).slice(0,5));
      } catch(e){setError(e.message);}finally{setLoading(false);}
    };
    fetchAll();
  },[city]);

  if(loading) return <div className="wd-loading"><div className="wd-spinner"/><p>Fetching live data for <span>{city}</span>…</p></div>;
  if(error)   return <div className="wd-loading"><p style={{fontSize:"2.5rem",marginBottom:"12px"}}>⚠️</p><p style={{color:"#f87171"}}>Could not load weather for <span style={{color:"#818cf8"}}>{city}</span></p><small style={{color:"rgba(255,255,255,0.4)",marginTop:"8px"}}>{error}</small></div>;

  const isDay=time.getHours()>=6&&time.getHours()<19;
  const icon=getIcon(weather.weather[0].id,isDay);
  const dayNames=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const tempData=hourly.map(h=>h.main.temp);
  const rainData=hourly.map(h=>(h.pop||0)*100);
  const timeLabels=hourly.map(h=>{const d=new Date(h.dt*1000);return`${d.getHours()}:00`;});

  const alerts=[];
  if(weather.main.temp>=38)  alerts.push({icon:"🔥",text:"Heatwave Alert — Stay hydrated!",color:"#fb923c"});
  if(weather.main.temp<=8)   alerts.push({icon:"🧊",text:"Cold Alert — Dress warm!",color:"#60a5fa"});
  if(weather.wind.speed>=14) alerts.push({icon:"💨",text:"Strong winds detected!",color:"#a78bfa"});
  if(weather.weather[0].id>=500&&weather.weather[0].id<600) alerts.push({icon:"☔",text:"Rain expected — carry an umbrella!",color:"#38bdf8"});
  if(weather.main.humidity>=85) alerts.push({icon:"💧",text:"High humidity — feels muggy!",color:"#34d399"});
  if(aqi&&aqi.main.aqi>=4)   alerts.push({icon:"😷",text:"Poor air quality — limit outdoor activity",color:"#f87171"});

  const aqiInfo=aqi?getAQILevel(aqi.main.aqi):null;
  const dangerInfo=getDangerLevel(weather,aqi);

  return (
    <div className="wd-root">
      {/* NAV */}
      <nav className="wd-nav">
        <div className="wd-nav-logo"><span className="logo-aero">Aero</span><span className="logo-sense">Sense</span></div>
        <div className="wd-tab-switcher">
          <button className={`wd-tab ${activeTab==="weather"?"active":""}`} onClick={()=>setActiveTab("weather")}><span>🌤</span> Weather</button>
          <button className={`wd-tab ${activeTab==="news"?"active":""}`} onClick={()=>setActiveTab("news")}><span>📰</span> News <span className="news-badge">LIVE</span></button>
        </div>
        <div className="wd-nav-center">
          <span className="live-dot"/>
          <span className="nav-label">📍 {weather.name} · Live Data</span>
          <span className="nav-divider"/>
          <span className="nav-time">{time.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</span>
        </div>
        <div className="wd-nav-right">
          {onBack&&<button className="wd-back-btn" onClick={onBack}>← Back</button>}
          <button className={`unit-toggle ${unit==="C"?"active":""}`} onClick={()=>setUnit("C")}>°C</button>
          <button className={`unit-toggle ${unit==="F"?"active":""}`} onClick={()=>setUnit("F")}>°F</button>
          <button className="wd-logout" onClick={onLogout}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </nav>

      {/* NEWS TAB */}
      {activeTab==="news"&&(
        <div className="news-page">
          <div className="news-page-header">
            <div className="news-page-title"><span className="news-pulse"/><h2>Weather News <span style={{color:"#7dd3fc"}}>· India</span></h2></div>
            <p className="news-page-sub">Live weather & climate headlines from across India</p>
          </div>
          <NewsTab city={city}/>
        </div>
      )}

      {/* WEATHER TAB */}
      {activeTab==="weather"&&(
        <div className="wd-body">
          <div className="wd-top-stats">
            {[
              {label:"Temperature",    value:`${toF(weather.main.temp)}${unitLabel}`,      icon:"🌡"},
              {label:"Rain Probability",value:`${Math.round((hourly[0]?.pop||0)*100)}%`,   icon:"🌧"},
              {label:"Humidity",       value:`${weather.main.humidity}%`,                  icon:"💧"},
              {label:"Wind Speed",     value:`${Math.round(weather.wind.speed*3.6)} km/h`, icon:"🌬"},
              {label:"Air Quality",    value:aqiInfo?.label||"—",                          icon:"🌿",color:aqiInfo?.color},
            ].map(({label,value,icon:ic,color})=>(
              <div className="top-stat-card" key={label}>
                <span className="ts-icon">{ic}</span>
                <div><div className="ts-label">{label}</div><div className="ts-value" style={color?{color}:{}}>{value}</div></div>
              </div>
            ))}
          </div>

          <div className="wd-grid">
            <div className="wd-col-left">
              <div className="wd-card hero-card">
                <div className="hero-icon">{icon}</div>
                <div className="hero-temp">{toF(weather.main.temp)}<span className="hero-unit">{unitLabel}</span></div>
                <div className="hero-desc">{weather.weather[0].description}</div>
                <div className="hero-hl">H {toF(weather.main.temp_max)}{unitLabel} / L {toF(weather.main.temp_min)}{unitLabel}</div>
                <div className="hero-feels">Feels like {toF(weather.main.feels_like)}{unitLabel}</div>
                <div className="hero-loc">📍 {weather.name}, India</div>
                <div className="hero-extra">
                  <div className="he-item"><span>🌅</span><span>{fmtTime(weather.sys.sunrise,weather.timezone)}</span></div>
                  <div className="he-sep"/>
                  <div className="he-item"><span>🌇</span><span>{fmtTime(weather.sys.sunset,weather.timezone)}</span></div>
                  <div className="he-sep"/>
                  <div className="he-item"><span>👁</span><span>{(weather.visibility/1000).toFixed(1)} km</span></div>
                </div>
              </div>
              {alerts.length>0&&(
                <div className="wd-card alerts-card">
                  <div className="card-title">⚡ Smart Alerts</div>
                  <div className="alerts-list">{alerts.map((a,i)=>(<div className="alert-row" key={i} style={{"--ac":a.color}}><span className="alert-icon">{a.icon}</span><span className="alert-text">{a.text}</span></div>))}</div>
                </div>
              )}
              {aqi&&(
                <div className="wd-card aqi-card">
                  <div className="card-title">🌿 Air Quality</div>
                  <div className="aqi-main">
                    <div className="aqi-score" style={{color:aqiInfo.color}}>{aqiInfo.label}</div>
                    <div className="aqi-subs">
                      {[["PM2.5",aqi.components.pm2_5?.toFixed(1)],["PM10",aqi.components.pm10?.toFixed(1)],["NO₂",aqi.components.no2?.toFixed(1)],["O₃",aqi.components.o3?.toFixed(1)]].map(([k,v])=>(<div className="aqi-pill" key={k}><span>{k}</span><span>{v} μg</span></div>))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="wd-col-mid">
              <div className="wd-card chart-card">
                <div className="chart-header"><div className="card-title">📈 Temperature Trend (Next 24h)</div><div className="chart-labels">{timeLabels.map((l,i)=><span key={i}>{l}</span>)}</div></div>
                <div className="chart-area"><Sparkline data={tempData} color="#818cf8"/></div>
                <div className="chart-footer"><span>Min: {toF(Math.min(...tempData))}{unitLabel}</span><span>Max: {toF(Math.max(...tempData))}{unitLabel}</span></div>
              </div>
              <div className="wd-card chart-card">
                <div className="chart-header"><div className="card-title">🌧 Rain Probability (Next 24h)</div><div className="chart-labels">{timeLabels.map((l,i)=><span key={i}>{l}</span>)}</div></div>
                <div className="chart-area"><BarChart data={rainData} color="#60a5fa"/></div>
                <div className="chart-footer"><span>Avg: {Math.round(rainData.reduce((a,b)=>a+b,0)/rainData.length)}%</span><span>Peak: {Math.round(Math.max(...rainData))}%</span></div>
              </div>
              <div className="wd-card atmos-card">
                <div className="card-title">🌫 Atmosphere</div>
                <div className="atmos-list">
                  {[{label:"Cloud Cover",val:weather.clouds.all,cls:"bar-purple"},{label:"Humidity",val:weather.main.humidity,cls:"bar-blue"},{label:"Temperature",val:Math.min(100,Math.round((weather.main.temp/50)*100)),cls:"bar-orange"},{label:"Pressure",val:Math.min(100,Math.round((weather.main.pressure-950)/50*100)),cls:"bar-green"}].map(({label,val,cls})=>(
                    <div className="atm-row" key={label}><span className="atm-label">{label}</span><div className="atm-track"><div className={`atm-fill ${cls}`} style={{width:`${Math.max(2,val)}%`}}/></div><span className="atm-val">{val}%</span></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="wd-col-right">
              <div className="wd-card forecast-card">
                <div className="card-title">📅 5-Day Forecast</div>
                <div className="fc-list">
                  {forecast.map((f,i)=>{ const d=new Date(f.dt*1000); return (
                    <div className="fc-row" key={i}>
                      <span className="fc-day">{i===0?"Today":dayNames[d.getDay()]}</span>
                      <span className="fc-icon">{getIcon(f.weather[0].id)}</span>
                      <span className="fc-desc">{f.weather[0].main}</span>
                      <span className="fc-pop">💧{Math.round((f.pop||0)*100)}%</span>
                      <div className="fc-temps"><span className="fc-hi">{toF(f.main.temp_max)}{unitLabel}</span><span className="fc-lo">{toF(f.main.temp_min)}{unitLabel}</span></div>
                    </div>
                  );})}
                </div>
              </div>
              <div className="wd-card wind-card">
                <div className="card-title">🧭 Wind</div>
                <WindCompass deg={weather.wind.deg} speed={Math.round(weather.wind.speed*3.6)}/>
                {weather.wind.gust&&<div className="wind-gust">Gusts up to {Math.round(weather.wind.gust*3.6)} km/h</div>}
              </div>
              <div className="wd-card extra-card">
                <div className="card-title">📊 Details</div>
                {[["Pressure",`${weather.main.pressure} hPa`],["Visibility",`${(weather.visibility/1000).toFixed(1)} km`],["Dew Point",`${Math.round(weather.main.temp-((100-weather.main.humidity)/5))}${unitLabel}`],["Cloudiness",`${weather.clouds.all}%`]].map(([k,v])=>(
                  <div className="extra-row" key={k}><span className="extra-key">{k}</span><span className="extra-val">{v}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING PANEL — always visible on both tabs */}
      <FloatingPanel weather={weather} forecast={forecast} hourly={hourly} aqi={aqi} unit={unit} toF={toF} alerts={alerts} dangerInfo={dangerInfo}/>
    </div>
  );
}
