import { useAuth } from "../context/AuthContext";
import { useMinuteClock } from "../hooks/useMinuteClock";
import { formatClock, formatLongDate, initialsOf } from "../utils/format";

const ROLE_LABEL = { owner: "Owner", cashier: "Cashier" };

export default function Topbar({ branchLabel, showClock = false, showDate = false }) {
  const { user } = useAuth();
  const now = useMinuteClock();
  const isOwner = user?.role === "owner";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="brand">
          Filipee's <span className="brand-accent">Bistro</span>
        </h1>
        <span className="pill pill-branch">
          <i className="icon" aria-hidden="true">{isOwner ? "🌐" : "🏬"}</i> {branchLabel}
        </span>
        {showClock && (
          <span className="pill pill-time">
            <i className="icon" aria-hidden="true">🕐</i>{" "}
            <time dateTime={now.toISOString()}>{formatClock(now)}</time>
          </span>
        )}
        {showDate && (
          <span className="pill pill-date">
            <i className="icon" aria-hidden="true">📅</i>{" "}
            <time dateTime={now.toISOString()}>{formatLongDate(now)}</time>
          </span>
        )}
      </div>

      <div className="topbar-right">
        <span className={`avatar ${isOwner ? "avatar-owner" : ""}`} aria-hidden="true">
          {initialsOf(user?.full_name)}
        </span>
        <span className="user-info">
          {user?.full_name} <span className="dot">·</span> {ROLE_LABEL[user?.role] ?? ""}
        </span>
      </div>
    </header>
  );
}