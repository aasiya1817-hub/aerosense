import React, { useState, useEffect, useRef } from "react";
import "./UserLogin.css";

const BASE_URL = "http://localhost/aerosense-api";

const CITIES = [
  "Ahmedabad","Mumbai","Delhi","Bangalore","Hyderabad","Chennai",
  "Kolkata","Pune","Jaipur","Surat","Lucknow","Kanpur","Nagpur",
  "Indore","Bhopal","Patna","Vadodara","Ludhiana","Agra","Nashik",
  "Faridabad","Meerut","Rajkot","Varanasi","Srinagar","Aurangabad",
  "Dhanbad","Amritsar","Prayagraj","Ranchi","Howrah","Coimbatore",
  "Jabalpur","Gwalior","Vijayawada","Madurai","Raipur","Kota",
  "Chandigarh","Guwahati","Solapur","Hubli","Bareilly","Moradabad",
  "Mysore","Gurgaon","Aligarh","Jalandhar","Tiruchirappalli",
  "Bhubaneswar","Salem","Warangal","Guntur","Bhiwandi","Saharanpur",
  "Noida","Jamshedpur","Cuttack","Firozabad","Kochi","Bhavnagar",
  "Dehradun","Durgapur","Asansol","Kolhapur","Ajmer","Gulbarga",
  "Jamnagar","Ujjain","Loni","Siliguri","Jhansi","Ulhasnagar",
  "Nellore","Jammu","Sangli","Belgaum","Mangalore","Ambattur",
  "Tirunelveli","Malegaon","Gaya","Jalgaon","Udaipur","Maheshtala",
  "Tiruppur","Davanagere","Kozhikode","Akola","Kurnool","Bokaro",
  "Rajahmundry","Ballari","Agartala","Bhagalpur","Muzaffarnagar","Bhatpara"
];

function Particles() {
  return (
    <div className="particles">
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="particle" style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 8}s`,
          animationDuration: `${6 + Math.random() * 8}s`,
          width: `${2 + Math.random() * 3}px`,
          height: `${2 + Math.random() * 3}px`,
          opacity: 0.1 + Math.random() * 0.3
        }} />
      ))}
    </div>
  );
}

function Logo() {
  return (
    <div className="ul-logo">
      <div className="ul-logo-icon">
        <svg width="32" height="32" viewBox="0 0 38 38" fill="none">
          <circle cx="19" cy="19" r="17.5" stroke="url(#lg1)" strokeWidth="1.2" strokeDasharray="4 2.5"/>
          <circle cx="19" cy="19" r="5.5" fill="url(#lg2)"/>
          <circle cx="19" cy="19" r="2.8" fill="white" opacity="0.95"/>
          <path d="M19 2.5 A16.5 16.5 0 0 1 35.5 19" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          <defs>
            <linearGradient id="lg1" x1="0" y1="0" x2="38" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7dd3fc"/>
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3"/>
            </linearGradient>
            <radialGradient id="lg2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#bae6fd"/>
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.7"/>
            </radialGradient>
          </defs>
        </svg>
      </div>
      <div className="ul-logo-text">
        <span className="ul-logo-aero">Aero</span><span className="ul-logo-sense">Sense</span>
      </div>
    </div>
  );
}

function StepBar({ step }) {
  const labels = ["Your Details", "Verify Email", "All Done!"];
  return (
    <div className="stepbar">
      {labels.map((l, i) => (
        <React.Fragment key={l}>
          <div className="stepbar-item">
            <div className={`stepbar-circle ${i < step ? "done" : i === step ? "active" : ""}`}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`stepbar-label ${i === step ? "active" : ""}`}>{l}</span>
          </div>
          {i < labels.length - 1 && <div className={`stepbar-line ${i < step ? "done" : ""}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, error, icon, autoFocus }) {
  const [showPwd, setShowPwd] = useState(false);
  const isPwd = type === "password";
  return (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      <div className={`field-box ${error ? "field-err" : value ? "field-filled" : ""}`}>
        {icon && <span className="field-icon">{icon}</span>}
        <input
          className="field-input"
          type={isPwd ? (showPwd ? "text" : "password") : type}
          value={value} onChange={onChange} placeholder={placeholder}
          autoComplete="off" autoFocus={autoFocus}
        />
        {isPwd && (
          <button className="field-eye" type="button" onClick={() => setShowPwd(s => !s)}>
            {showPwd ? "🙈" : "👁"}
          </button>
        )}
      </div>
      {error && <p className="field-errmsg">{error}</p>}
    </div>
  );
}

function OTPBoxes({ value, onChange, disabled }) {
  const refs = useRef([]);
  const arr  = Array.from({ length: 6 }, (_, i) => value[i] || "");
  const update = (i, v) => { const next = [...arr]; next[i] = v; onChange(next.join("")); };
  const handleInput = (i, e) => {
    const v = e.target.value.replace(/\D/, "").slice(-1);
    update(i, v); if (v && i < 5) refs.current[i + 1]?.focus();
  };
  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !arr[i] && i > 0) { refs.current[i - 1]?.focus(); update(i - 1, ""); }
  };
  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(text.padEnd(6, "").slice(0, 6).trimEnd());
    refs.current[Math.min(text.length, 5)]?.focus(); e.preventDefault();
  };
  return (
    <div className="otp-row">
      {arr.map((d, i) => (
        <input key={i} ref={el => refs.current[i] = el}
          className={`otp-digit ${d ? "otp-digit-filled" : ""}`}
          type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={e => handleInput(i, e)} onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste} disabled={disabled} autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

function Alert({ type, msg }) {
  if (!msg) return null;
  return (
    <div className={`ul-alert ${type === "error" ? "ul-alert-err" : "ul-alert-ok"}`}>
      <span>{type === "error" ? "⚠" : "✓"}</span>{msg}
    </div>
  );
}

export default function UserLogin({ setUser }) {
  const [screen, setScreen] = useState("login");
  const [active, setActive] = useState(false);

  const [lUser, setLUser] = useState(""); const [lPass, setLPass] = useState("");
  const [lErrs, setLErrs] = useState({}); const [lMsg,  setLMsg]  = useState("");
  const [lLoad, setLLoad] = useState(false);

  const [sEmail,   setSEmail]   = useState(""); const [sUser,    setSUser]    = useState("");
  const [sPass,    setSPass]    = useState(""); const [sConfirm, setSConfirm] = useState("");
  const [sCity,    setSCity]    = useState(""); const [sErrs,    setSErrs]    = useState({});
  const [sMsg,     setSMsg]     = useState(""); const [sLoad,    setSLoad]    = useState(false);

  const [otpEmail,  setOtpEmail]  = useState(""); const [otpVal,    setOtpVal]    = useState("");
  const [otpMsg,    setOtpMsg]    = useState(""); const [otpOk,     setOtpOk]     = useState("");
  const [otpLoad,   setOtpLoad]   = useState(false);
  const [canResend, setCanResend] = useState(false); const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (screen !== "otp") return;
    setCountdown(60); setCanResend(false);
    const t = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(t); setCanResend(true); return 0; } return c - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [screen]);

  const reset = () => { setLMsg(""); setLErrs({}); setSMsg(""); setSErrs({}); setOtpMsg(""); setOtpOk(""); setOtpVal(""); };

  const switchTo = (s) => {
    reset();
    if (s === "login")  { setActive(false); setTimeout(() => setScreen("login"),  350); }
    if (s === "signup") { setActive(true);  setTimeout(() => setScreen("signup"), 350); }
    if (s === "otp")    setScreen("otp");
  };

  const valLogin = () => {
    const e = {};
    if (!lUser.trim()) e.user = "Username is required."; else if (lUser.length < 3) e.user = "Minimum 3 characters.";
    if (!lPass) e.pass = "Password is required."; else if (lPass.length < 6) e.pass = "Minimum 6 characters.";
    return e;
  };

  const valSignup = () => {
    const e = {};
    if (!sEmail.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sEmail)) e.email = "Enter a valid email — e.g. you@gmail.com";
    if (!sUser.trim()) e.user = "Username is required."; else if (sUser.length < 3) e.user = "Minimum 3 characters.";
    else if (!/^[a-zA-Z0-9_]+$/.test(sUser)) e.user = "Letters, numbers and underscores only.";
    if (!sPass) e.pass = "Password is required."; else if (sPass.length < 6) e.pass = "Minimum 6 characters.";
    else if (!/(?=.*[A-Za-z])(?=.*[0-9])/.test(sPass)) e.pass = "Must include a letter and a number.";
    if (!sConfirm) e.confirm = "Please confirm your password."; else if (sConfirm !== sPass) e.confirm = "Passwords do not match.";
    if (!sCity) e.city = "Please select your city.";
    return e;
  };

  const doLogin = async () => {
    setLMsg(""); const errs = valLogin(); setLErrs(errs);
    if (Object.keys(errs).length) return; setLLoad(true);
    try {
      const r = await fetch(`${BASE_URL}/login.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: lUser.trim(), password: lPass }) });
      const data = await r.json();
      if (data.status === "success") { localStorage.setItem("user", JSON.stringify(data.user)); setScreen("done"); setTimeout(() => setUser(data.user), 1500); }
      else if (data.status === "not_verified") { setOtpEmail(data.email || ""); setScreen("otp"); }
      else { const m = { nouser: "No account found with that username.", wrong: "Incorrect password. Please try again.", nodata: "Please fill in all fields.", dberror: "Server error. Try again later." }; setLMsg(m[data.status] || data.message || "Login failed."); }
    } catch { setLMsg("Cannot connect. Make sure XAMPP is running."); } finally { setLLoad(false); }
  };

  const doSignup = async () => {
    setSMsg(""); const errs = valSignup(); setSErrs(errs);
    if (Object.keys(errs).length) return; setSLoad(true);
    try {
      const r = await fetch(`${BASE_URL}/signup.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: sEmail.trim().toLowerCase(), username: sUser.trim(), password: sPass, city: sCity }) });
      const data = await r.json();
      if (data.status === "success") { setOtpEmail(sEmail.trim().toLowerCase()); setScreen("otp"); }
      else { const m = { exists: "Username already taken.", email_exists: "Email already registered.", invalid_email: "Invalid email address.", weak_password: "Password too weak.", nodata: "Please fill in all fields.", error: "Registration failed. Try again." }; setSMsg(m[data.status] || data.message || "Registration failed."); }
    } catch { setSMsg("Cannot connect. Make sure XAMPP is running."); } finally { setSLoad(false); }
  };

  const doVerify = async () => {
    if (otpVal.trim().length < 6) { setOtpMsg("Enter all 6 digits."); return; }
    setOtpMsg(""); setOtpOk(""); setOtpLoad(true);
    try {
      const r = await fetch(`${BASE_URL}/verify_otp.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: otpEmail, otp: otpVal.trim() }) });
      const data = await r.json();
      if (data.status === "success" || data.status === "already_verified") { localStorage.setItem("user", JSON.stringify(data.user)); setScreen("done"); setTimeout(() => setUser(data.user), 1500); }
      else { const m = { wrong_otp: "Incorrect code. Please try again.", expired: "Code expired. Request a new one below.", nouser: "Account not found." }; setOtpMsg(m[data.status] || data.message || "Verification failed."); }
    } catch { setOtpMsg("Cannot connect. Make sure XAMPP is running."); } finally { setOtpLoad(false); }
  };

  const doResend = async () => {
    setOtpMsg(""); setOtpOk(""); setOtpVal(""); setCanResend(false); setCountdown(60);
    const t = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(t); setCanResend(true); return 0; } return c - 1; }), 1000);
    try {
      const r = await fetch(`${BASE_URL}/send_otp.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: otpEmail }) });
      const data = await r.json();
      if (data.status === "success") setOtpOk("New code sent! Check your inbox."); else setOtpMsg("Failed to resend. Try again.");
    } catch { setOtpMsg("Cannot connect."); }
  };

  const maskEmail = (e) => { if (!e) return ""; const [u, d] = e.split("@"); return u.slice(0, 2) + "••••@" + d; };

  // ── DONE ──
  if (screen === "done") return (
    <div className="ul-root"><div className="ul-bg" /><div className="ul-vignette" /><Particles />
      <div className="ul-done">
        <div className="done-ring"><div className="done-check">✓</div></div>
        <h2 className="done-title">You're in!</h2>
        <p className="done-sub">Taking you to AeroSense…</p>
        <div className="done-bar"><div className="done-fill" /></div>
      </div>
    </div>
  );

  // ── OTP ──
  if (screen === "otp") return (
    <div className="ul-root"><div className="ul-bg" /><div className="ul-vignette" /><Particles />
      <div className="ul-card otp-card">
        <Logo /><StepBar step={1} />
        <div className="otp-envelope">📧</div>
        <div className="ul-header">
          <h2 className="ul-title">Check your inbox</h2>
          <p className="ul-desc">We sent a 6-digit code to<br /><strong className="otp-email">{maskEmail(otpEmail)}</strong></p>
        </div>
        <OTPBoxes value={otpVal} onChange={setOtpVal} disabled={otpLoad} />
        <Alert type="error" msg={otpMsg} /><Alert type="ok" msg={otpOk} />
        <button className="ul-btn" onClick={doVerify} disabled={otpLoad || otpVal.length < 6}>
          {otpLoad ? <span className="spin" /> : <><span>Verify Code</span><span className="btn-arrow">→</span></>}
        </button>
        <div className="otp-resend">
          {canResend ? <>Didn't receive it? <button className="ul-link" onClick={doResend}>Resend code</button></>
            : <span className="otp-timer">Resend available in <strong>{countdown}s</strong></span>}
        </div>
        <button className="ul-link-back" onClick={() => switchTo("signup")}>← Back to sign up</button>
      </div>
    </div>
  );

  // ── MAIN SLIDING PANEL ──
  return (
    <div className="ul-root">
      <div className="ul-bg" /><div className="ul-vignette" /><Particles />

      <div className={`slider-container ${active ? "active" : ""}`}>

        {/* LOGIN FORM */}
        <div className="slider-form slider-form-login">
          <Logo />
          <div className="ul-header">
            <h2 className="ul-title">Welcome back 👋</h2>
            <p className="ul-desc">Sign in to continue to AeroSense</p>
          </div>
          <Field label="Username" icon="👤" value={lUser} autoFocus
            onChange={e => { setLUser(e.target.value); setLErrs(p => ({...p, user: ""})); }}
            placeholder="Your username" error={lErrs.user} />
          <Field label="Password" type="password" icon="🔒" value={lPass}
            onChange={e => { setLPass(e.target.value); setLErrs(p => ({...p, pass: ""})); }}
            placeholder="Your password" error={lErrs.pass} />
          <Alert type="error" msg={lMsg} />
          <button className="ul-btn" onClick={doLogin} disabled={lLoad}>
            {lLoad ? <span className="spin" /> : <><span>Login</span><span className="btn-arrow">→</span></>}
          </button>
          <p className="ul-foot">No account yet? <button className="ul-link" onClick={() => switchTo("signup")}>Create one free</button></p>
        </div>

        {/* SIGNUP FORM */}
        <div className="slider-form slider-form-signup">
          <Logo />
          <StepBar step={0} />
          <div className="ul-header">
            <h2 className="ul-title">Create account ✨</h2>
            <p className="ul-desc">A verification code will be sent to your email</p>
          </div>
          <div className="signup-grid">
            <Field label="Email Address" type="email" icon="✉️" value={sEmail}
              onChange={e => { setSEmail(e.target.value); setSErrs(p => ({...p, email: ""})); }}
              placeholder="you@gmail.com" error={sErrs.email} />
            <Field label="Username" icon="👤" value={sUser}
              onChange={e => { setSUser(e.target.value); setSErrs(p => ({...p, user: ""})); }}
              placeholder="Choose a username" error={sErrs.user} />
            <Field label="Password" type="password" icon="🔒" value={sPass}
              onChange={e => { setSPass(e.target.value); setSErrs(p => ({...p, pass: ""})); }}
              placeholder="Min 6 chars + a number" error={sErrs.pass} />
            <Field label="Confirm Password" type="password" icon="🔑" value={sConfirm}
              onChange={e => { setSConfirm(e.target.value); setSErrs(p => ({...p, confirm: ""})); }}
              placeholder="Re-enter password" error={sErrs.confirm} />
          </div>
          <div className="field">
            <label className="field-label">Your City</label>
            <div className={`field-box ${sErrs.city ? "field-err" : sCity ? "field-filled" : ""}`}>
              <span className="field-icon">📍</span>
              <select className="field-select" value={sCity} onChange={e => { setSCity(e.target.value); setSErrs(p => ({...p, city: ""})); }}>
                <option value="">Select your city…</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {sErrs.city && <p className="field-errmsg">{sErrs.city}</p>}
          </div>
          <Alert type="error" msg={sMsg} />
          <button className="ul-btn" onClick={doSignup} disabled={sLoad}>
            {sLoad ? <span className="spin" /> : <><span>Continue</span><span className="btn-arrow">→</span></>}
          </button>
          <p className="ul-foot">Already registered? <button className="ul-link" onClick={() => switchTo("login")}>Login</button></p>
        </div>

        {/* OVERLAY — dark navy AeroSense theme */}
        <div className="slider-overlay">
          <div className="slider-overlay-inner">

            <div className="overlay-panel overlay-left">
              <Logo />
              <div className="overlay-divider" />
              <h2 className="overlay-title">Welcome Back!</h2>
              <p className="overlay-desc">Already have an account? Sign in to continue your AeroSense journey.</p>
              <button className="overlay-btn" onClick={() => switchTo("login")}>Login →</button>
            </div>

            <div className="overlay-panel overlay-right">
              <Logo />
              <div className="overlay-divider" />
              <h2 className="overlay-title">New Here?</h2>
              <p className="overlay-desc">Join AeroSense and get real-time environmental intelligence for your city.</p>
              <button className="overlay-btn" onClick={() => switchTo("signup")}>Sign Up →</button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
