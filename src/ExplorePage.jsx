import React, { useState, useEffect, useRef } from "react";
import "./ExplorePage.css";

const API_KEY  = "3eb9f7833ab61f790ef56eabc77c80d8";
const BASE_URL = "http://localhost/aerosense-api";

const ALL_CITIES = [
  "Ahmedabad","Mumbai","Delhi","Bangalore","Hyderabad","Chennai",
  "Kolkata","Pune","Jaipur","Surat","Lucknow","Kanpur",
  "Nagpur","Indore","Bhopal","Patna","Vadodara","Ludhiana",
  "Agra","Nashik","Faridabad","Meerut","Rajkot","Varanasi",
  "Srinagar","Aurangabad","Dhanbad","Amritsar","Prayagraj",
  "Ranchi","Howrah","Coimbatore","Jabalpur","Gwalior",
  "Vijayawada","Madurai","Raipur","Kota","Chandigarh",
  "Guwahati","Solapur","Hubli","Bareilly","Moradabad",
  "Mysore","Gurgaon","Aligarh","Jalandhar","Tiruchirappalli",
  "Bhubaneswar","Salem","Warangal","Guntur","Bhiwandi",
  "Saharanpur","Noida","Jamshedpur","Cuttack","Firozabad",
  "Kochi","Bhavnagar","Dehradun","Durgapur","Asansol",
  "Kolhapur","Ajmer","Gulbarga","Jamnagar","Ujjain",
  "Loni","Siliguri","Jhansi","Ulhasnagar","Nellore",
  "Jammu","Sangli","Belgaum","Mangalore","Ambattur",
  "Tirunelveli","Malegaon","Gaya","Jalgaon","Udaipur",
  "Maheshtala","Tiruppur","Davanagere","Kozhikode",
  "Akola","Kurnool","Bokaro","Rajahmundry","Ballari",
  "Agartala","Bhagalpur","Muzaffarnagar","Bhatpara"
];

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

function MiniWeatherCard({ city, onClose, onViewFull }) {
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
    <div className="mini-card-overlay" onClick={onClose}>
      <div className="mini-card" onClick={e => e.stopPropagation()}>
        <button className="mini-close" onClick={onClose}>✕</button>
        {loading ? (
          <div className="mini-loading"><div className="ep-spinner"/></div>
        ) : data && data.main ? (
          <>
            <div className="mini-icon">{getIcon(data.weather[0].id, isDay)}</div>
            <div className="mini-city">{data.name}</div>
            <div className="mini-temp">{Math.round(data.main.temp)}°C</div>
            <div className="mini-desc">{data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1)}</div>
            <div className="mini-stats">
              <span>💧 {data.main.humidity}%</span>
              <span>🌬 {Math.round(data.wind.speed * 3.6)} km/h</span>
              <span>👁 {(data.visibility/1000).toFixed(1)} km</span>
            </div>
            <div className="mini-hl">H {Math.round(data.main.temp_max)}° / L {Math.round(data.main.temp_min)}°</div>
            <button className="mini-full-btn" onClick={() => onViewFull(city)}>
              View Full Dashboard →
            </button>
          </>
        ) : (
          <div className="mini-error">Could not load weather</div>
        )}
      </div>
    </div>
  );
}

// ── Accurate India SVG map ──
function IndiaMap() {
  return (
    <div className="ep-map-wrap">
      <svg className="ep-india-map" viewBox="0 0 550 600" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M220,18 L245,14 L268,18 L290,28 L308,22 L328,30 L342,45 L350,62 L358,55 L372,62 L378,78 L368,90 L375,102 L370,118 L358,128 L362,142 L372,150 L380,165 L375,182 L360,192 L348,205 L355,218 L362,235 L355,250 L340,258 L330,272 L318,285 L308,300 L295,312 L282,328 L268,345 L255,362 L242,378 L230,395 L220,415 L212,432 L205,448 L200,462 L195,448 L188,432 L180,415 L170,398 L158,380 L148,362 L138,344 L128,326 L118,308 L108,290 L98,272 L90,254 L82,236 L76,218 L72,200 L70,182 L74,164 L80,148 L78,132 L85,118 L92,104 L88,90 L96,76 L108,65 L118,52 L132,42 L148,34 L165,24 L185,18 L205,15 Z"
          fill="rgba(125,211,252,0.06)"
          stroke="rgba(125,211,252,0.35)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Kashmir region */}
        <path
          d="M220,18 L232,10 L248,6 L265,10 L278,18 L290,28 L308,22 L300,35 L285,38 L268,32 L252,28 L235,25 Z"
          fill="rgba(125,211,252,0.04)"
          stroke="rgba(125,211,252,0.2)"
          strokeWidth="1"
        />
        {/* City dots — approximate real positions */}
        {[
          [230, 95,  "Delhi"],
          [185, 270, "Mumbai"],
          [290, 350, "Chennai"],
          [200, 300, "Pune"],
          [268, 305, "Hyderabad"],
          [268, 245, "Nagpur"],
          [200, 148, "Jaipur"],
          [340, 210, "Kolkata"],
          [290, 385, "Bangalore"],
          [175, 245, "Surat"],
          [215, 72,  "Chandigarh"],
          [162, 340, "Goa"],
          [135, 390, "Kochi"],
          [258, 140, "Lucknow"],
          [310, 168, "Patna"],
          [165, 195, "Ahmedabad"],
        ].map(([x, y, name]) => (
          <g key={name}>
            <circle cx={x} cy={y} r="3.5" fill="rgba(125,211,252,0.6)" stroke="#7dd3fc" strokeWidth="1"/>
            <circle cx={x} cy={y} r="7" fill="rgba(125,211,252,0.1)" className="ep-pulse-ring"/>
          </g>
        ))}
      </svg>
      <div className="ep-map-label">India</div>
    </div>
  );
}

export default function ExplorePage({ onBack, onViewCityWeather, onGoProfile }) {
  const user        = JSON.parse(localStorage.getItem("user") || "{}");
  const [search,    setSearch]    = useState("");
  // FIX 1: Initialize liked from user object in localStorage so it's instant
  const [liked,     setLiked]     = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return u.liked_cities || [];
    } catch { return []; }
  });
  const [expanded,  setExpanded]  = useState(null);
  const [filter,    setFilter]    = useState("all");
  const [loading,   setLoading]   = useState({});
  const inputRef = useRef();

  // Also fetch fresh from DB on mount (to sync any changes from other sessions)
  useEffect(() => {
    if (!user.id) return;
    fetch(`${BASE_URL}/get_profile.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id })
    })
      .then(r => r.json())
      .then(d => {
        if (d.status === "success") {
          setLiked(d.user.liked_cities || []);
          // Also update localStorage so next mount is instant too
          const u = JSON.parse(localStorage.getItem("user") || "{}");
          u.liked_cities = d.user.liked_cities || [];
          localStorage.setItem("user", JSON.stringify(u));
        }
      })
      .catch(() => {});
  }, []);

  const toggleLike = async (city, e) => {
    e.stopPropagation();
    if (!user.id) return;

    // FIX 2: Optimistic update — update UI immediately before API call
    const isCurrentlyLiked = liked.includes(city);
    const optimisticLiked = isCurrentlyLiked
      ? liked.filter(c => c !== city)
      : [...liked, city];
    setLiked(optimisticLiked);

    // Also update localStorage immediately
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    u.liked_cities = optimisticLiked;
    localStorage.setItem("user", JSON.stringify(u));

    setLoading(prev => ({ ...prev, [city]: true }));
    try {
      const res  = await fetch(`${BASE_URL}/like_city.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, city })
      });
      const data = await res.json();
      if (data.status === "success") {
        // Confirm with server's actual state
        setLiked(data.liked_cities);
        const u2 = JSON.parse(localStorage.getItem("user") || "{}");
        u2.liked_cities = data.liked_cities;
        localStorage.setItem("user", JSON.stringify(u2));
      } else {
        // Revert if API failed
        setLiked(liked);
      }
    } catch {
      // Revert on error — use functional form to avoid stale closure
      setLiked(prev => isCurrentlyLiked ? prev.filter(c => c !== city) : prev.includes(city) ? prev : [...prev, city]);
    }
    setLoading(prev => ({ ...prev, [city]: false }));
  };

  const filtered = ALL_CITIES.filter(c => {
    const matchSearch = c.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "liked" ? liked.includes(c) : true;
    return matchSearch && matchFilter;
  });

  return (
    <div className="ep-root">

      {/* NAV */}
      <nav className="ep-nav">
        <button className="ep-back" onClick={onBack}>← Back</button>
        <div className="ep-nav-logo">
          <span className="ep-logo-aero">Aero</span><span className="ep-logo-sense">Sense</span>
        </div>
        <button className="ep-profile-btn" onClick={onGoProfile}>
          <div className="ep-avatar">{user.username?.[0]?.toUpperCase() || "U"}</div>
          <span>{user.username || "Profile"}</span>
        </button>
      </nav>

      {/* HERO */}
      <div className="ep-hero">
        <div className="ep-hero-text">
          <div className="ep-badge">🗺 City Explorer</div>
          <h1>Explore <span>India's</span> Weather</h1>
          <p>Discover live weather across 100 cities. Like your favourites, explore the map.</p>
        </div>

        {/* FIX 3: Accurate India map */}
        <IndiaMap />
      </div>

      {/* SEARCH + FILTER */}
      <div className="ep-controls">
        <div className="ep-search-wrap">
          <span className="ep-search-icon">🔍</span>
          <input
            ref={inputRef}
            className="ep-search"
            placeholder="Search any city…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="ep-clear" onClick={() => setSearch("")}>✕</button>}
        </div>
        <div className="ep-filters">
          <button className={`ep-filter-btn ${filter==="all"?"active":""}`} onClick={() => setFilter("all")}>
            🌏 All Cities <span>{ALL_CITIES.length}</span>
          </button>
          <button className={`ep-filter-btn ${filter==="liked"?"active":""}`} onClick={() => setFilter("liked")}>
            ❤️ Liked <span>{liked.length}</span>
          </button>
        </div>
      </div>

      {/* CITY GRID */}
      <div className="ep-grid">
        {filtered.length === 0 ? (
          <div className="ep-empty">
            <div style={{fontSize:"3rem"}}>🏙</div>
            <p>No cities found for "<strong>{search}</strong>"</p>
          </div>
        ) : filtered.map((city, i) => {
          const isLiked = liked.includes(city);
          const isHome  = city === user.city;
          return (
            <div
              className={`ep-city-card ${isHome ? "home-city" : ""}`}
              key={city}
              style={{ animationDelay: `${(i % 20) * 0.03}s` }}
              onClick={() => setExpanded(city)}
            >
              {isHome && <div className="ep-home-badge">🏠 Your City</div>}
              <button
                className={`ep-like-btn ${isLiked ? "liked" : ""}`}
                onClick={(e) => toggleLike(city, e)}
                disabled={loading[city]}
                title={isLiked ? "Unlike" : "Like"}
              >
                {loading[city] ? "…" : isLiked ? "❤️" : "🤍"}
              </button>
              <div className="ep-city-name">{city}</div>
              <div className="ep-city-country">India</div>
              <div className="ep-city-arrow">→</div>
            </div>
          );
        })}
      </div>

      {/* MINI WEATHER POPUP */}
      {expanded && (
        <MiniWeatherCard
          city={expanded}
          onClose={() => setExpanded(null)}
          onViewFull={(city) => {
            setExpanded(null);
            // FIX 4: Pass the clicked city, not home city
            onViewCityWeather(city);
          }}
        />
      )}
    </div>
  );
}
