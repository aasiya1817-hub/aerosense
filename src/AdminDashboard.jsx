import React, { useState, useEffect, useCallback } from "react";
import "./AdminDashboard.css";

const API   = "http://localhost/aerosense-api";
const OW    = "3eb9f7833ab61f790ef56eabc77c80d8";
const CITIES = ["Mumbai","Delhi","Ahmedabad","Bangalore","Chennai","Hyderabad","Pune","Kolkata","Jaipur","Surat"];

// ── Utilities ──
const getIcon = (code, isDay=true) => {
  if(code>=200&&code<300) return "⛈"; if(code>=300&&code<400) return "🌦";
  if(code>=500&&code<600) return "🌧"; if(code>=600&&code<700) return "❄️";
  if(code>=700&&code<800) return "🌫"; if(code===800) return isDay?"☀️":"🌙";
  if(code===801) return "🌤"; if(code===802) return "⛅"; if(code>=803) return "☁️";
  return "🌡";
};
const getAQI = (v) => { const l=["","Good","Fair","Moderate","Poor","Very Poor"],c=["","#4ade80","#a3e635","#facc15","#fb923c","#f87171"]; return {label:l[v]||"—",color:c[v]||"#94a3b8"}; };
const getDanger = (temp,wind,aqiV) => {
  let s=0;
  if(temp>=45)s+=3; else if(temp>=38)s+=2; else if(temp>=34)s+=1;
  if(wind>=70)s+=3; else if(wind>=50)s+=2; else if(wind>=30)s+=1;
  if(aqiV>=5)s+=2; else if(aqiV>=4)s+=1;
  if(s>=6) return {level:"DANGER",color:"#f87171",cls:"danger",icon:"🚨"};
  if(s>=3) return {level:"WARNING",color:"#fb923c",cls:"warning",icon:"⚠️"};
  return {level:"NORMAL",color:"#4ade80",cls:"normal",icon:"✅"};
};
const avatarColor = (name) => {
  const colors = ["#6366f1","#0ea5e9","#10b981","#f97316","#ec4899","#8b5cf6","#14b8a6","#f59e0b"];
  let h=0; for(let i=0;i<name.length;i++) h=(h+name.charCodeAt(i))%colors.length;
  return colors[h];
};
const fmtDate = (d) => { if(!d) return "—"; const dt=new Date(d); return dt.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}); };

// ── Mini Sparkline ──
function Spark({ data, color, h=60 }) {
  if (!data || data.length < 2) return <div style={{height:h}}/>;
  const W=400, H=h, pad=4;
  const min=Math.min(...data), max=Math.max(...data), range=max-min||1;
  const pts=data.map((v,i)=>({ x:pad+(i/(data.length-1))*(W-pad*2), y:H-pad-((v-min)/range)*(H-pad*2) }));
  const line=pts.map((p,i)=>`${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const fill=`${line} L${pts.at(-1).x},${H} L${pts[0].x},${H} Z`;
  const id=`sp_${color.replace(/[^a-z0-9]/gi,"")}${Math.random().toString(36).slice(2,6)}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{width:"100%",height:h}}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <path d={fill} fill={`url(#${id})`}/><path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Toast ──
function Toast({ toast }) {
  if (!toast) return null;
  const icons = { success:"✅", error:"❌", info:"ℹ️" };
  return <div className={`ad-toast ${toast.type}`}><span>{icons[toast.type]}</span>{toast.msg}</div>;
}

// ── Confirm Delete Modal ──
function ConfirmModal({ user, onConfirm, onCancel }) {
  return (
    <div className="ad-modal-overlay" onClick={onCancel}>
      <div className="ad-modal" onClick={e=>e.stopPropagation()} style={{width:380}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:"3rem",marginBottom:12}}>🗑️</div>
          <div className="ad-modal-title">Delete User</div>
          <div className="ad-modal-sub">This action is permanent and cannot be undone.</div>
          <div style={{marginTop:12,padding:"10px 16px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,fontSize:"0.85rem",color:"#f87171",fontWeight:600}}>{user.username}</div>
        </div>
        <div className="ad-modal-footer">
          <button className="ad-modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="ad-modal-submit" style={{background:"linear-gradient(135deg,#dc2626,#ef4444)",boxShadow:"0 4px 20px rgba(220,38,38,0.3)"}} onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// OVERVIEW PAGE
// ══════════════════════════════════════════════════
function OverviewPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/admin_stats.php`).then(r=>r.json()).then(d=>{ setStats(d); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  if (loading) return <div className="ad-loading-wrap"><div className="ad-spinner"/><span>Loading overview…</span></div>;
  if (!stats)  return <div className="ad-empty">⚠️ Could not fetch stats. Is XAMPP running?</div>;

  const apiCallsToday = stats.apiUsage?.[stats.apiUsage.length-1]?.calls_made || 0;
  const apiData = stats.apiUsage?.map(d=>d.calls_made) || [];
  const growthData = stats.userGrowth?.map(d=>d.count) || [];

  return (
    <div>
      {/* KPI Cards */}
      <div className="ad-kpi-grid">
        {[
          { label:"Total Users",    value:stats.totalUsers,    icon:"👥", footer:`${stats.verifiedUsers} verified`,      change:"+12%", up:true  },
          { label:"New Today",      value:stats.newToday,      icon:"🆕", footer:`${stats.newThisWeek} this week`,       change:"+5%",  up:true  },
          { label:"Active Logins",  value:stats.loginToday,    icon:"🔐", footer:"sessions today",                       change:"+8%",  up:true  },
          { label:"API Errors",     value:stats.apiErrors,     icon:"⚠️", footer:"total recorded errors",               change:"-3%",  up:false },
        ].map((k,i)=>(
          <div className="ad-kpi" key={k.label} style={{animationDelay:`${i*0.05}s`}}>
            <span className="ad-kpi-icon">{k.icon}</span>
            <div className="ad-kpi-label">{k.label}</div>
            <div className="ad-kpi-value">{k.value?.toLocaleString()}</div>
            <div className="ad-kpi-footer">
              <span className={`ad-kpi-change ${k.up?"up":"down"}`}>{k.up?"↑":"↓"} {k.change}</span>
              <span>{k.footer}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="ad-charts-row">
        <div className="ad-chart-card">
          <div className="ad-chart-title">API Calls — Last 7 Days</div>
          <div className="ad-chart-val">{apiCallsToday.toLocaleString()} <span style={{fontSize:"0.8rem",color:"var(--text3)",fontWeight:400}}>today</span></div>
          <div className="ad-chart-area"><Spark data={apiData} color="#7dd3fc" h={90}/></div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:"0.7rem",color:"var(--text3)"}}>
            <span>7 days ago</span><span>Today</span>
          </div>
        </div>
        <div className="ad-chart-card">
          <div className="ad-chart-title">New User Registrations</div>
          <div className="ad-chart-val">{stats.newThisWeek} <span style={{fontSize:"0.8rem",color:"var(--text3)",fontWeight:400}}>this week</span></div>
          <div className="ad-chart-area"><Spark data={growthData.length>0?growthData:[0,1,2,1,3,2,4]} color="#818cf8" h={90}/></div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:"0.7rem",color:"var(--text3)"}}>
            <span>7 days ago</span><span>Today</span>
          </div>
        </div>
      </div>

      {/* Top Cities */}
      <div className="ad-table-card">
        <div className="ad-table-head"><div className="ad-table-head-title">🏙️ Top Cities by User Count</div></div>
        <table className="ad-table">
          <thead><tr><th>City</th><th>Users</th><th>Share</th><th>Bar</th></tr></thead>
          <tbody>
            {(stats.topCities||[]).map((c,i)=>(
              <tr key={c.city}>
                <td><span style={{fontWeight:600,color:"#fff"}}>#{i+1} {c.city}</span></td>
                <td><span style={{color:"#7dd3fc",fontWeight:700}}>{c.count}</span></td>
                <td style={{color:"var(--text3)"}}>{Math.round((c.count/stats.totalUsers)*100)}%</td>
                <td style={{width:200}}>
                  <div style={{height:6,background:"rgba(255,255,255,0.05)",borderRadius:99,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${Math.round((c.count/stats.topCities[0].count)*100)}%`,background:"linear-gradient(90deg,#7dd3fc,#818cf8)",borderRadius:99}}/>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// MANAGE USERS PAGE
// ══════════════════════════════════════════════════
function ManageUsersPage({ showToast }) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");
  const [modal,   setModal]   = useState(null); // null | { mode:"add"|"edit", user?:{} }
  const [confirm, setConfirm] = useState(null); // user to delete
  const [form,    setForm]    = useState({ username:"", email:"", password:"", city:"Mumbai", status:"active" });
  const [saving,  setSaving]  = useState(false);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    fetch(`${API}/admin_users.php`).then(r=>r.json()).then(d=>{ setUsers(d.users||[]); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openAdd  = () => { setForm({username:"",email:"",password:"",city:"Mumbai",status:"active"}); setModal({mode:"add"}); };
  const openEdit = (u) => { setForm({username:u.username,email:u.email,password:"",city:u.city||"Mumbai",status:u.is_verified?"active":"inactive"}); setModal({mode:"edit",user:u}); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const isEdit = modal.mode === "edit";
      const body   = isEdit ? { id:modal.user.id, ...form } : form;
      const method = isEdit ? "PUT" : "POST";
      const res  = await fetch(`${API}/admin_users.php`, { method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { showToast(isEdit?"User updated ✓":"User created ✓","success"); setModal(null); fetchUsers(); }
      else showToast(data.message||"Error","error");
    } catch { showToast("Server error","error"); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      const res  = await fetch(`${API}/admin_users.php`, { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id:confirm.id}) });
      const data = await res.json();
      if (data.success) { showToast("User deleted","success"); setConfirm(null); fetchUsers(); }
      else showToast(data.message||"Error","error");
    } catch { showToast("Server error","error"); }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.city?.toLowerCase().includes(q);
    const matchFilter = filter==="all" || (filter==="active"&&u.is_verified==1) || (filter==="inactive"&&u.is_verified==0);
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <div className="ad-table-card">
        <div className="ad-table-head" style={{flexWrap:"wrap",gap:10}}>
          <div className="ad-table-head-title">All Users <span style={{color:"var(--text3)",fontWeight:400,fontSize:"0.8rem"}}>({filtered.length})</span></div>
          <div className="ad-search">
            <span>🔍</span>
            <input placeholder="Search username, email, city…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="ad-filter-select" value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="ad-btn-primary" onClick={openAdd}>➕ Add User</button>
        </div>

        {loading ? (
          <div className="ad-loading-wrap"><div className="ad-spinner"/><span>Loading users…</span></div>
        ) : (
          <table className="ad-table">
            <thead>
              <tr><th>User</th><th>City</th><th>Status</th><th>Liked Cities</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"var(--text3)"}}>No users found</td></tr>}
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="ad-user-cell">
                      <div className="ad-user-avatar" style={{background:avatarColor(u.username)}}>{u.username?.[0]?.toUpperCase()}</div>
                      <div><div className="ad-user-name">{u.username}</div><div className="ad-user-email">{u.email}</div></div>
                    </div>
                  </td>
                  <td>📍 {u.city||"—"}</td>
                  <td>
                    <span className={`ad-status-badge ${u.is_verified?"active":"inactive"}`}>
                      <span className="ad-status-dot-sm"/>
                      {u.is_verified ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{color:"var(--text2)"}}>{u.liked_count || 0} cities</td>
                  <td style={{color:"var(--text3)",fontSize:"0.75rem"}}>{fmtDate(u.created_at)}</td>
                  <td>
                    <div className="ad-action-btns">
                      <button className="ad-icon-btn" title="Edit user" onClick={()=>openEdit(u)}>✏️</button>
                      <button className="ad-icon-btn delete" title="Delete user" onClick={()=>setConfirm(u)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="ad-modal-overlay" onClick={()=>setModal(null)}>
          <div className="ad-modal" onClick={e=>e.stopPropagation()}>
            <div className="ad-modal-title">{modal.mode==="add"?"➕ Add New User":"✏️ Edit User"}</div>
            <div className="ad-modal-sub">{modal.mode==="add"?"Create a new user account":"Update user information"}</div>
            <div className="ad-modal-field">
              <label className="ad-modal-label">Username</label>
              <input className="ad-modal-input" placeholder="e.g. rahul_sharma" value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/>
            </div>
            <div className="ad-modal-field">
              <label className="ad-modal-label">Email</label>
              <input className="ad-modal-input" type="email" placeholder="email@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
            </div>
            {modal.mode==="add" && (
              <div className="ad-modal-field">
                <label className="ad-modal-label">Password</label>
                <input className="ad-modal-input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
              </div>
            )}
            <div className="ad-modal-field">
              <label className="ad-modal-label">Home City</label>
              <select className="ad-modal-input" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}>
                {CITIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="ad-modal-field">
              <label className="ad-modal-label">Status</label>
              <select className="ad-modal-input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="ad-modal-footer">
              <button className="ad-modal-cancel" onClick={()=>setModal(null)}>Cancel</button>
              <button className="ad-modal-submit" disabled={saving} onClick={handleSave}>
                {saving ? "Saving…" : modal.mode==="add" ? "Create User" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirm && <ConfirmModal user={confirm} onConfirm={handleDelete} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════
// CITY MONITOR PAGE
// ══════════════════════════════════════════════════
function CityMonitorPage() {
  const [cityData, setCityData] = useState({});
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const results = {};
      await Promise.all(CITIES.map(async city => {
        try {
          const [wRes, aRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city},IN&appid=${OW}&units=metric`),
            fetch(`https://api.openweathermap.org/data/2.5/air_pollution?q=${city},IN&appid=${OW}`)
          ]);
          const w = await wRes.json();
          if (w.cod !== 200) return;
          const aqiRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${w.coord.lat}&lon=${w.coord.lon}&appid=${OW}`);
          const a = aqiRes.ok ? await aqiRes.json() : null;
          results[city] = { w, aqi: a?.list?.[0] };
        } catch {}
      }));
      setCityData(results); setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return <div className="ad-loading-wrap"><div className="ad-spinner"/><span>Fetching live data for {CITIES.length} cities…</span></div>;

  return (
    <div>
      <div style={{marginBottom:16,padding:"12px 18px",background:"rgba(125,211,252,0.05)",border:"1px solid rgba(125,211,252,0.12)",borderRadius:12,fontSize:"0.8rem",color:"var(--text2)",display:"flex",alignItems:"center",gap:8}}>
        <span style={{color:"#4ade80"}}>●</span> Live data from OpenWeatherMap · Updated just now
      </div>
      <div className="ad-city-grid">
        {CITIES.map((city, i) => {
          const d = cityData[city];
          if (!d) return (
            <div className="ad-city-card" key={city} style={{animationDelay:`${i*0.04}s`}}>
              <div className="ad-city-loading"><div className="ad-spinner"/></div>
            </div>
          );
          const { w, aqi } = d;
          const temp  = Math.round(w.main.temp);
          const wind  = Math.round(w.wind.speed * 3.6);
          const aqiV  = aqi?.main?.aqi || 0;
          const aqiInfo = getAQI(aqiV);
          const danger = getDanger(temp, wind, aqiV);
          const isDay  = new Date().getHours()>=6 && new Date().getHours()<19;
          return (
            <div className="ad-city-card" key={city} style={{animationDelay:`${i*0.04}s`}}>
              <div className="ad-city-top">
                <div>
                  <div className="ad-city-name">{city}</div>
                  <div className="ad-city-country">India</div>
                  <div className={`ad-danger-pill ${danger.cls}`} style={{marginTop:6}}>
                    {danger.icon} {danger.level}
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div className="ad-city-icon">{getIcon(w.weather[0].id, isDay)}</div>
                  <div className="ad-city-temp">{temp}°C</div>
                </div>
              </div>
              <div style={{fontSize:"0.75rem",color:"var(--text3)",textTransform:"capitalize",marginBottom:6}}>{w.weather[0].description}</div>
              <div className="ad-city-row">
                <div className="ad-city-stat"><div className="ad-city-stat-label">Humidity</div><div className="ad-city-stat-val">{w.main.humidity}%</div></div>
                <div className="ad-city-stat"><div className="ad-city-stat-label">Wind</div><div className="ad-city-stat-val">{wind} km/h</div></div>
                <div className="ad-city-stat"><div className="ad-city-stat-label">AQI</div><div className="ad-city-stat-val" style={{color:aqiInfo.color}}>{aqiInfo.label}</div></div>
                <div className="ad-city-stat"><div className="ad-city-stat-label">Feels</div><div className="ad-city-stat-val">{Math.round(w.main.feels_like)}°C</div></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// API HEALTH PAGE
// ══════════════════════════════════════════════════
function APIHealthPage() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/admin_stats.php`).then(r=>r.json()).then(d=>{ setStats(d); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  if (loading) return <div className="ad-loading-wrap"><div className="ad-spinner"/><span>Loading API health…</span></div>;

  const apiUsage    = stats?.apiUsage || [];
  const todayUsage  = apiUsage[apiUsage.length-1] || {};
  const callsToday  = todayUsage.calls_made || 0;
  const callsLimit  = 100000;
  const pct         = Math.min(100, Math.round((callsToday/callsLimit)*100));
  const radius      = 70, circ = 2*Math.PI*radius;
  const strokePct   = circ - (pct/100)*circ;
  const gaugeColor  = pct>=80?"#f87171":pct>=50?"#fb923c":"#4ade80";
  const totalErrors = apiUsage.reduce((a,d)=>a+(d.errors||0), 0);
  const avgResp     = apiUsage.length ? Math.round(apiUsage.reduce((a,d)=>a+(d.avg_response_ms||0),0)/apiUsage.length) : 0;
  const callData    = apiUsage.map(d=>d.calls_made);

  return (
    <div>
      <div className="ad-api-grid">
        {/* Quota Ring */}
        <div className="ad-quota-card">
          <div className="ad-quota-title">OpenWeather API Quota</div>
          <div className="ad-quota-ring">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
              <circle cx="80" cy="80" r={radius} fill="none" stroke={gaugeColor} strokeWidth="10"
                strokeDasharray={circ} strokeDashoffset={strokePct}
                strokeLinecap="round" style={{transition:"stroke-dashoffset 1s ease",transform:"rotate(-90deg)",transformOrigin:"80px 80px"}}/>
            </svg>
            <div className="ad-quota-ring-text">
              <div className="ad-quota-pct" style={{color:gaugeColor}}>{pct}%</div>
              <div className="ad-quota-sub">used today</div>
            </div>
          </div>
          <div className="ad-quota-detail">{callsToday.toLocaleString()} / {callsLimit.toLocaleString()} calls</div>
          <div style={{marginTop:8,fontSize:"0.72rem",color:"var(--text3)"}}>Resets at midnight IST</div>
        </div>

        {/* API Stats */}
        <div className="ad-api-stats-grid">
          {[
            { label:"Calls Today",   val:callsToday.toLocaleString(),    sub:"API requests",           icon:"📡" },
            { label:"Total Errors",  val:totalErrors,                    sub:"across 7 days",           icon:"❌" },
            { label:"Avg Response",  val:`${avgResp}ms`,                 sub:"7-day average",           icon:"⚡" },
            { label:"Error Rate",    val:`${apiUsage.length?(((totalErrors/apiUsage.reduce((a,d)=>a+(d.calls_made||0),0))*100).toFixed(2)):"0.00"}%`, sub:"7-day rate", icon:"📊" },
          ].map(s=>(
            <div className="ad-api-stat" key={s.label}>
              <div className="ad-api-stat-label">{s.icon} {s.label}</div>
              <div className="ad-api-stat-val">{s.val}</div>
              <div className="ad-api-stat-sub">{s.sub}</div>
            </div>
          ))}
          <div className="ad-api-stat" style={{gridColumn:"1/-1"}}>
            <div className="ad-api-stat-label">📈 Call Volume — 7 Days</div>
            <div style={{marginTop:8}}><Spark data={callData} color="#7dd3fc" h={70}/></div>
          </div>
        </div>
      </div>

      {/* Usage Table */}
      <div className="ad-table-card">
        <div className="ad-table-head"><div className="ad-table-head-title">Daily API Usage Breakdown</div></div>
        <table className="ad-table">
          <thead><tr><th>Date</th><th>Calls Made</th><th>Errors</th><th>Avg Response</th><th>Error Rate</th><th>Usage</th></tr></thead>
          <tbody>
            {[...apiUsage].reverse().map(d=>{
              const ep = d.calls_made ? ((d.errors/d.calls_made)*100).toFixed(1) : "0.0";
              const barPct = Math.min(100,Math.round((d.calls_made/callsLimit)*100));
              const barColor = barPct>=80?"#f87171":barPct>=50?"#fb923c":"#4ade80";
              return (
                <tr key={d.date}>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.78rem"}}>{d.date}</td>
                  <td style={{color:"#7dd3fc",fontWeight:700}}>{d.calls_made?.toLocaleString()}</td>
                  <td style={{color:d.errors>0?"#f87171":"#4ade80",fontWeight:600}}>{d.errors}</td>
                  <td style={{color:"var(--text2)"}}>{d.avg_response_ms}ms</td>
                  <td style={{color:parseFloat(ep)>1?"#fb923c":"#4ade80"}}>{ep}%</td>
                  <td style={{width:120}}>
                    <div style={{height:6,background:"rgba(255,255,255,0.05)",borderRadius:99,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${barPct}%`,background:barColor,borderRadius:99}}/>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// ALERTS PAGE
// ══════════════════════════════════════════════════
function AlertsPage() {
  const [alerts, setAlerts] = useState([
    { id:1, type:"danger",  emoji:"🔥", title:"Extreme Heat Alert",   city:"Delhi",     msg:"Temperature at 46°C — exceeds danger threshold of 45°C",      time:"2 min ago",  dismissed:false },
    { id:2, type:"warning", emoji:"😷", title:"Very Poor Air Quality", city:"Kolkata",   msg:"AQI index at 198 (Very Poor) — PM2.5 at 142 μg/m³",           time:"18 min ago", dismissed:false },
    { id:3, type:"warning", emoji:"⚙️", title:"API Quota Warning",    city:"System",    msg:"OpenWeather API at 73% daily quota — approaching limit",       time:"34 min ago", dismissed:false },
    { id:4, type:"danger",  emoji:"🌀", title:"Cyclone Watch",        city:"Chennai",   msg:"Cyclonic storm forming in Bay of Bengal — landfall possible",  time:"2 hrs ago",  dismissed:false },
    { id:5, type:"warning", emoji:"⛈", title:"Thunderstorm Alert",   city:"Mumbai",    msg:"Heavy rainfall forecast with lightning — 89mm expected",       time:"3 hrs ago",  dismissed:false },
    { id:6, type:"info",    emoji:"✅", title:"DB Backup Complete",   city:"System",    msg:"Scheduled daily backup completed successfully (2.4 GB)",       time:"4 hrs ago",  dismissed:false },
    { id:7, type:"info",    emoji:"👥", title:"User Spike Detected",  city:"Bangalore", msg:"48 new registrations in last 2 hours — above normal",          time:"5 hrs ago",  dismissed:true  },
    { id:8, type:"warning", emoji:"❄️", title:"Cold Wave Warning",   city:"Delhi",     msg:"Night temperature to drop to 4°C — cold wave conditions",      time:"6 hrs ago",  dismissed:false },
  ]);

  const dismiss = (id) => setAlerts(a=>a.map(al=>al.id===id?{...al,dismissed:true}:al));
  const restore = (id) => setAlerts(a=>a.map(al=>al.id===id?{...al,dismissed:false}:al));
  const active   = alerts.filter(a=>!a.dismissed);
  const inactive = alerts.filter(a=>a.dismissed);

  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:20}}>
        {[{label:"Total",val:alerts.length,color:"var(--text2)"},{label:"Active",val:active.length,color:"#fb923c"},{label:"Dismissed",val:inactive.length,color:"var(--text3)"}].map(s=>(
          <div key={s.label} style={{padding:"10px 20px",background:"var(--bg2)",border:"1px solid var(--border2)",borderRadius:12,fontSize:"0.82rem",color:s.color}}>
            <strong style={{fontSize:"1.2rem",color:s.color,marginRight:6}}>{s.val}</strong>{s.label}
          </div>
        ))}
      </div>

      {active.length > 0 && (
        <>
          <div style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--text3)",marginBottom:10}}>Active Alerts</div>
          <div className="ad-alerts-list" style={{marginBottom:24}}>
            {active.map((a,i)=>(
              <div className={`ad-alert-item ${a.type}`} key={a.id} style={{animationDelay:`${i*0.05}s`}}>
                <div className="ad-alert-emoji">{a.emoji}</div>
                <div className="ad-alert-body">
                  <div className="ad-alert-title">{a.title}</div>
                  <div className="ad-alert-msg">{a.msg}</div>
                  <div className="ad-alert-meta"><span className="ad-alert-city">📍 {a.city}</span><span className="ad-alert-time">{a.time}</span></div>
                </div>
                <div className="ad-alert-actions">
                  <button className="ad-dismiss-btn" onClick={()=>dismiss(a.id)}>Dismiss</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {inactive.length > 0 && (
        <>
          <div style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--text3)",marginBottom:10}}>Dismissed</div>
          <div className="ad-alerts-list">
            {inactive.map((a,i)=>(
              <div className={`ad-alert-item ${a.type} dismissed`} key={a.id}>
                <div className="ad-alert-emoji" style={{opacity:0.4}}>{a.emoji}</div>
                <div className="ad-alert-body">
                  <div className="ad-alert-title">{a.title}</div>
                  <div className="ad-alert-meta"><span className="ad-alert-city">📍 {a.city}</span><span className="ad-alert-time">{a.time}</span></div>
                </div>
                <div className="ad-alert-actions">
                  <button className="ad-dismiss-btn" onClick={()=>restore(a.id)}>Restore</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════
// SYSTEM LOGS PAGE
// ══════════════════════════════════════════════════
function SystemLogsPage() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("");

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit:100 });
    if (filter) params.append("action", filter);
    if (search) params.append("search", search);
    fetch(`${API}/admin_logs.php?${params}`).then(r=>r.json()).then(d=>{ setLogs(d.logs||[]); setLoading(false); }).catch(()=>setLoading(false));
  }, [filter, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const fmtLogTime = (ts) => { if(!ts)return"—"; const d=new Date(ts); return d.toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",second:"2-digit"}); };
  const actionCls  = (a) => ["login","weather_search","pdf_download","api_error","backup","user_created","user_updated","user_deleted"].includes(a)?a:"unknown";

  return (
    <div>
      <div className="ad-table-card">
        <div className="ad-table-head" style={{flexWrap:"wrap",gap:10}}>
          <div className="ad-table-head-title">Activity Log <span style={{color:"var(--text3)",fontWeight:400,fontSize:"0.8rem"}}>({logs.length})</span></div>
          <div className="ad-search">
            <span>🔍</span>
            <input placeholder="Search user, city, details…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="ad-filter-select" value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="">All Actions</option>
            <option value="login">Login</option>
            <option value="weather_search">Weather Search</option>
            <option value="pdf_download">PDF Download</option>
            <option value="api_error">API Error</option>
            <option value="user_created">User Created</option>
            <option value="user_deleted">User Deleted</option>
          </select>
          <button className="ad-btn-primary" onClick={fetchLogs}>🔄 Refresh</button>
        </div>

        {loading ? (
          <div className="ad-loading-wrap"><div className="ad-spinner"/><span>Loading logs…</span></div>
        ) : logs.length === 0 ? (
          <div className="ad-empty">No logs found</div>
        ) : (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"160px 110px 130px 1fr 100px",gap:12,padding:"8px 20px",fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--text3)",borderBottom:"1px solid var(--border2)"}}>
              <span>Timestamp</span><span>User</span><span>Action</span><span>Details</span><span>City</span>
            </div>
            <div className="ad-logs-list">
              {logs.map((log,i)=>(
                <div className="ad-log-row" key={log.id} style={{animationDelay:`${Math.min(i,15)*0.02}s`}}>
                  <span className="ad-log-time">{fmtLogTime(log.created_at)}</span>
                  <span className="ad-log-user">{log.username}</span>
                  <span><span className={`ad-log-action ${actionCls(log.action)}`}>{log.action}</span></span>
                  <span className="ad-log-details">{log.details||"—"}</span>
                  <span className="ad-log-city">{log.city||"—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// MAIN ADMIN DASHBOARD
// ══════════════════════════════════════════════════
const PAGES = [
  { id:"overview",  label:"Overview",      icon:"📊", section:"main"   },
  { id:"users",     label:"Manage Users",  icon:"👥", section:"main",  badge:null },
  { id:"cities",    label:"City Monitor",  icon:"🌆", section:"main"   },
  { id:"api",       label:"API Health",    icon:"🔌", section:"system" },
  { id:"alerts",    label:"Alerts Center", icon:"🚨", section:"system", badge:3 },
  { id:"logs",      label:"System Logs",   icon:"📋", section:"system" },
];

export default function AdminDashboard({ onLogout }) {
  const [page,  setPage]  = useState("overview");
  const [time,  setTime]  = useState(new Date());
  const [toast, setToast] = useState(null);

  useEffect(() => { const t=setInterval(()=>setTime(new Date()),1000); return()=>clearInterval(t); }, []);

  const showToast = (msg, type="info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const pageTitles  = { overview:"Command Overview", users:"Manage Users", cities:"City Monitor", api:"API Health", alerts:"Alerts Center", logs:"System Logs" };
  const pageSubs    = { overview:"Platform health at a glance", users:"View, add, edit and remove user accounts", cities:"Live weather across all monitored cities", api:"OpenWeather API quota and performance", alerts:"Active weather and system alerts", logs:"Full activity trail" };

  const renderPage = () => {
    if (page === "overview") return <OverviewPage/>;
    if (page === "users")    return <ManageUsersPage showToast={showToast}/>;
    if (page === "cities")   return <CityMonitorPage/>;
    if (page === "api")      return <APIHealthPage/>;
    if (page === "alerts")   return <AlertsPage/>;
    if (page === "logs")     return <SystemLogsPage/>;
  };

  return (
    <div className="ad-root">
      {/* ── SIDEBAR ── */}
      <aside className="ad-sidebar">
        <div className="ad-sidebar-logo">
          <div className="ad-logo-top">
            <div className="ad-logo-icon">🌐</div>
            <div className="ad-logo-name"><span className="ad-logo-aero">Aero</span><span className="ad-logo-sense">Sense</span></div>
          </div>
          <span className="ad-logo-badge">Admin Panel</span>
          <div className="ad-logo-sub">Control Center v2.0</div>
        </div>

        <nav className="ad-nav">
          {/* Main */}
          <div className="ad-nav-section">
            <span className="ad-nav-label">Main</span>
            {PAGES.filter(p=>p.section==="main").map(p=>(
              <button key={p.id} className={`ad-nav-item ${page===p.id?"active":""}`} onClick={()=>setPage(p.id)}>
                <span className="ad-nav-icon">{p.icon}</span>
                {p.label}
                {p.badge&&<span className="ad-nav-badge">{p.badge}</span>}
              </button>
            ))}
          </div>
          <div className="ad-divider"/>
          {/* System */}
          <div className="ad-nav-section" style={{marginTop:8}}>
            <span className="ad-nav-label">System</span>
            {PAGES.filter(p=>p.section==="system").map(p=>(
              <button key={p.id} className={`ad-nav-item ${page===p.id?"active":""}`} onClick={()=>setPage(p.id)}>
                <span className="ad-nav-icon">{p.icon}</span>
                {p.label}
                {p.badge&&<span className="ad-nav-badge">{p.badge}</span>}
              </button>
            ))}
          </div>
        </nav>

        <div className="ad-sidebar-footer">
          <div className="ad-admin-info">
            <div className="ad-admin-avatar">A</div>
            <div><div className="ad-admin-name">aerosense_admin</div><div className="ad-admin-role">Super Administrator</div></div>
            <button className="ad-logout-btn" title="Logout" onClick={()=>{ sessionStorage.removeItem("admin_auth"); onLogout(); }}>🚪</button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="ad-main">
        <div className="ad-topbar">
          <div>
            <div className="ad-topbar-title">{pageTitles[page]}</div>
            <div className="ad-topbar-sub">{pageSubs[page]}</div>
          </div>
          <div className="ad-topbar-right">
            <div className="ad-status-pill"><span className="ad-status-dot"/>All Systems Operational</div>
            <div className="ad-topbar-time">{time.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</div>
          </div>
        </div>
a
        <div className="ad-content">
          {renderPage()}
        </div>
      </main>

      <Toast toast={toast}/>
    </div>
  );
}
