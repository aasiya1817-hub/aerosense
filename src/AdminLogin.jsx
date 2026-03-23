import React, { useState } from "react";
import "./AdminLogin.css";

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res  = await fetch("http://localhost/aerosense-api/admin_login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem("admin_auth", "true");
        onLogin();
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch {
      setError("Cannot connect to server. Is XAMPP running?");
    }
    setLoading(false);
  };

  return (
    <div className="al-root">
      <div className="al-grid-bg"/>
      <div className="al-orb al-orb-1"/><div className="al-orb al-orb-2"/><div className="al-orb al-orb-3"/>

      <div className="al-card">
        <div className="al-logo">
          <div className="al-logo-icon">🌐</div>
          <div className="al-logo-text"><span className="al-logo-aero">Aero</span><span className="al-logo-sense">Sense</span></div>
          <span className="al-logo-badge">Admin</span>
        </div>

        <h1 className="al-title">Welcome back</h1>
        <p className="al-sub">Sign in to the control center</p>

        <div className="al-hint">
          <span>🔐</span>
          <span>Use your admin credentials — <strong>aerosense_admin / Admin@2026</strong></span>
        </div>

        <form onSubmit={handleLogin}>
          <div className="al-field">
            <label className="al-label">Username</label>
            <div className="al-input-wrap">
              <span className="al-input-icon">👤</span>
              <input className="al-input" type="text" placeholder="aerosense_admin" value={username} onChange={e=>setUsername(e.target.value)} required/>
            </div>
          </div>
          <div className="al-field">
            <label className="al-label">Password</label>
            <div className="al-input-wrap">
              <span className="al-input-icon">🔒</span>
              <input className="al-input" type="password" placeholder="••••••••••" value={password} onChange={e=>setPassword(e.target.value)} required/>
            </div>
          </div>

          <button className="al-btn" type="submit" disabled={loading}>
            {loading ? <><span className="al-spinner"/>Authenticating…</> : <><span>🚀</span> Access Control Center</>}
          </button>
        </form>

        {error && <div className="al-error"><span>⚠️</span>{error}</div>}
      </div>
    </div>
  );
}
