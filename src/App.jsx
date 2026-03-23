import React, { useState } from "react";
import UserLogin        from "./UserLogin";
import UserDashboard    from "./UserDashboard";
import WeatherDashboard from "./WeatherDashboard";
import ExplorePage      from "./ExplorePage";
import ProfilePage      from "./ProfilePage";
import AdminLogin       from "./AdminLogin";
import AdminDashboard   from "./AdminDashboard";
import DisasterRisk     from "./DisasterRisk";
import AdvisoryPage     from "./AdvisoryPage";
import AdvisoryDetail   from "./Advisorydetail";

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")) || null; }
    catch { return null; }
  });
  const [screen,         setScreen]         = useState("landing");
  const [cityOverride,   setCityOverride]   = useState(null);
  const [adminAuth,      setAdminAuth]      = useState(() => sessionStorage.getItem("admin_auth") === "true");
  const [selectedOcc,    setSelectedOcc]    = useState(null);

  const handleSetUser         = (u) => { setUser(u); setScreen("landing"); };
  const handleLogout          = () => { localStorage.removeItem("user"); setUser(null); setScreen("landing"); setCityOverride(null); };
  const handleViewWeather     = () => { setCityOverride(null); setScreen("weather"); };
  const handleViewCityWeather = (city) => { setCityOverride(city); setScreen("weather"); };

  // ── ADMIN ROUTE ──
  if (window.location.hash === "#admin") {
    if (!adminAuth) return <AdminLogin onLogin={() => setAdminAuth(true)} />;
    return <AdminDashboard onLogout={() => { sessionStorage.removeItem("admin_auth"); setAdminAuth(false); window.location.hash = ""; }}/>;
  }

  // ── USER ROUTES ──
  if (!user) return <UserLogin setUser={handleSetUser} />;

  if (screen === "disaster")
    return <DisasterRisk user={user} onBack={() => setScreen("landing")} />;

  if (screen === "advisory")
    return <AdvisoryPage user={user} onBack={() => setScreen("landing")} onSelectOccupation={(occ) => { setSelectedOcc(occ); setScreen("advisory-detail"); }}/>;

  if (screen === "advisory-detail" && selectedOcc)
    return <AdvisoryDetail user={user} occupation={selectedOcc} onBack={() => setScreen("advisory")} />;

  if (screen === "weather")
    return <WeatherDashboard onLogout={handleLogout} cityOverride={cityOverride} onBack={() => setScreen(cityOverride ? "explore" : "landing")} />;

  if (screen === "explore")
    return <ExplorePage onBack={() => setScreen("landing")} onViewCityWeather={handleViewCityWeather} onGoProfile={() => setScreen("profile")} />;

  if (screen === "profile")
    return <ProfilePage onBack={() => setScreen("explore")} onViewCityWeather={handleViewCityWeather} onLogout={handleLogout} />;

  return <UserDashboard
    onViewWeather={handleViewWeather}
    onLogout={handleLogout}
    onExplore={() => setScreen("explore")}
    onProfile={() => setScreen("profile")}
    onDisaster={() => setScreen("disaster")}
    onAdvisory={() => setScreen("advisory")}
  />;
}
