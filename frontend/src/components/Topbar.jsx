// src/components/Topbar.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function formatTime(date) {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

export default function Topbar({ branchLabel, showClock = false, dateLabel }) {
  const { user } = useAuth();
  const time = useClock();

  const initials = user?.fullName
    ? user.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "??";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="brand">
          Filipee's <span className="brand-accent">Bistro</span>
        </h1>
        <span className="pill pill-branch">
          <i className="icon">{user?.role === "owner" ? "🌐" : "🏬"}</i> {branchLabel}
        </span>
        {showClock && (
          <span className="pill pill-time">
            <i className="icon">🕐</i> {formatTime(time)}
          </span>
        )}
        {dateLabel && (
          <span className="pill pill-date">
            <i className="icon">📅</i> {dateLabel}
          </span>
        )}
      </div>

      <div className="topbar-right">
        <span className={`avatar ${user?.role === "owner" ? "avatar-owner" : ""}`}>{initials}</span>
        <span className="user-info">
          {user?.fullName} <span className="dot">·</span> {user?.role === "owner" ? "Admin" : "Cashier"}
        </span>
      </div>
    </header>
  );
}
