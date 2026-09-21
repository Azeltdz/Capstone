// src/components/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// sections: [{ label: "Main", items: [{ to, icon, label }] }, ...]
export default function Sidebar({ sections }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="sidebar">
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
              <i className="icon">{item.icon}</i> {item.label}
            </NavLink>
          ))}
        </div>
      ))}

      <button className="nav-item logout-item" onClick={handleLogout}>
        <i className="icon">🚪</i> Log Out
      </button>
    </nav>
  );
}
