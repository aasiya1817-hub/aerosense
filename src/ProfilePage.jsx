import React, { useState, useEffect } from "react";
import "./ProfilePage.css";

const API_KEY  = "3eb9f7833ab61f790ef56eabc77c80d8";
const BASE_URL = "http://localhost/aerosense-api";

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

function LikedCityCard({ city, onUnlike, onViewWeather }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},IN&appid=${API_KEY}&units=metric`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [city]);

  const isDay = new Date().getHours() >= 6 && new Date().getHours() < 19;

  return (
    <div className="pp-city-card">
      <button className="pp-unlike-btn" onClick={() => onUnlike(city)} title="Unlike">❤️</button>
      {loading ? (
        <div className="pp-card-loading"><div className="pp-spinner"/></div>
      ) : data && data.main ? (
        <>
          <div className="pp-card-icon">{getIcon(data.weather[0].id, isDay)}</div>
          <div className="pp-card-temp">{Math.round(data.main.temp)}°C</div>
          <div className="pp-card-city">{city}</div>
          <div className="pp-card-desc">{data.weather[0].main}</div>
          <div className="pp-card-hl">H {Math.round(data.main.temp_max)}° · L {Math.round(data.main.temp_min)}°</div>
          <button className="pp-card-btn" onClick={() => onViewWeather(city)}>View →</button>
        </>
      ) : (
        <div className="pp-card-city">{city}</div>
      )}
    </div>
  );
}

export default function ProfilePage({ onBack, onViewCityWeather, onLogout }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [homeWeather, setHomeWeather] = useState(null);
  const [joined] = useState(() => {
    const d = new Date();
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  });

  useEffect(() => {
    if (!user.id) return;
    // Fetch profile
    fetch(`${BASE_URL}/get_profile.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id })
    })
      .then(r => r.json())
      .then(d => {
        if (d.status === "success") setProfile(d.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch home city weather
    if (user.city) {
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(user.city)},IN&appid=${API_KEY}&units=metric`)
        .then(r => r.json())
        .then(d => setHomeWeather(d))
        .catch(() => {});
    }
  }, []);

  const handleUnlike = async (city) => {
    try {
      const res  = await fetch(`${BASE_URL}/like_city.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, city })
      });
      const data = await res.json();
      if (data.status === "success") {
        setProfile(prev => ({ ...prev, liked_cities: data.liked_cities }));
      }
    } catch(e) {}
  };

  const isDay = new Date().getHours() >= 6 && new Date().getHours() < 19;
  const liked = profile?.liked_cities || [];

  return (
    <div className="pp-root">

      {/* NAV */}
      <nav className="pp-nav">
        <button className="pp-back" onClick={onBack}>← Back</button>
        <div className="pp-nav-logo">
          <span className="pp-logo-aero">Aero</span><span className="pp-logo-sense">Sense</span>
        </div>
        <button className="pp-logout" onClick={onLogout}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </nav>

      {loading ? (
        <div className="pp-loading"><div className="pp-spinner-lg"/><p>Loading profile…</p></div>
      ) : (
        <div className="pp-body">

          {/* PROFILE HEADER */}
          <div className="pp-header">
            <div className="pp-avatar-wrap">
              <div className="pp-avatar">
                {user.username?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="pp-avatar-ring"/>
            </div>

            <div className="pp-info">
              <h1 className="pp-username">@{profile?.username || user.username}</h1>
              <div className="pp-meta-row">
                <span className="pp-meta-pill">📍 {profile?.city || user.city}</span>
                <span className="pp-meta-pill">🗓 Joined {joined}</span>
                <span className="pp-meta-pill">🌤 AeroSense Member</span>
              </div>
              <div className="pp-stats-row">
                <div className="pp-stat">
                  <span className="pp-stat-num">{liked.length}</span>
                  <span className="pp-stat-lbl">Liked Cities</span>
                </div>
                <div className="pp-stat-sep"/>
                <div className="pp-stat">
                  <span className="pp-stat-num">1</span>
                  <span className="pp-stat-lbl">Home City</span>
                </div>
                <div className="pp-stat-sep"/>
                <div className="pp-stat">
                  <span className="pp-stat-num">100</span>
                  <span className="pp-stat-lbl">Cities Available</span>
                </div>
              </div>
            </div>
          </div>

          {/* HOME CITY WEATHER BANNER */}
          {homeWeather && homeWeather.main && (
            <div className="pp-home-banner">
              <div className="pp-home-left">
                <div className="pp-home-label">🏠 Your Home City</div>
                <div className="pp-home-city">{homeWeather.name}</div>
                <div className="pp-home-desc">{homeWeather.weather[0].description}</div>
              </div>
              <div className="pp-home-center">
                <div className="pp-home-icon">{getIcon(homeWeather.weather[0].id, isDay)}</div>
              </div>
              <div className="pp-home-right">
                <div className="pp-home-temp">{Math.round(homeWeather.main.temp)}°C</div>
                <div className="pp-home-hl">H {Math.round(homeWeather.main.temp_max)}° / L {Math.round(homeWeather.main.temp_min)}°</div>
                <button className="pp-home-btn" onClick={() => onViewCityWeather(user.city)}>
                  View Dashboard →
                </button>
              </div>
            </div>
          )}

          {/* LIKED CITIES */}
          <div className="pp-section">
            <div className="pp-section-header">
              <h2>❤️ Liked Cities</h2>
              <span>{liked.length} cities</span>
            </div>

            {liked.length === 0 ? (
              <div className="pp-empty">
                <div style={{fontSize:"3rem"}}>🤍</div>
                <p>No liked cities yet</p>
                <small>Explore cities and tap the heart to save your favourites!</small>
                <button className="pp-explore-btn" onClick={onBack}>Explore Cities →</button>
              </div>
            ) : (
              <div className="pp-liked-grid">
                {liked.map(city => (
                  <LikedCityCard
                    key={city}
                    city={city}
                    onUnlike={handleUnlike}
                    onViewWeather={onViewCityWeather}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
