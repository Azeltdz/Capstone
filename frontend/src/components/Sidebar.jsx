import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ sections }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <nav className="sidebar" aria-label="Main navigation">
      {sections.map((section) => (
        <div key={section.label}>
          {section.label && <p className="sidebar-label">{section.label}</p>}
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <i className="icon" aria-hidden="true">{item.icon}</i> {item.label}
              {item.badge > 0 && (
                <span
                  className="badge badge-warn"
                  style={{ marginLeft: "auto" }}
                  title={`${item.badge} ${item.badgeLabel ?? "alerts"}`}
                >
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      ))}

      <button type="button" className="nav-item logout-item" onClick={handleLogout}>
        <i className="icon" aria-hidden="true">🚪</i> Log Out
      </button>
    </nav>
  );
}