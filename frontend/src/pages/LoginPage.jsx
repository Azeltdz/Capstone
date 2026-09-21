// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const EYE_OPEN_PATH =
  "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z";

const EYE_SLASH_PATH =
  "M12 6c1.66 0 3 1.34 3 3 0 .35-.07.69-.18 1L17.6 12.79c.65-.85 1.14-1.81 1.4-2.79-1.73-4.39-6-7.5-11-7.5-1.27 0-2.49.2-3.64.57l1.65 1.65C7.09 4.15 8 4 9 4c0 0 3 0 3 2zM2.71 3.16 1.29 4.57 4.5 7.78C3.06 8.89 1.89 10.34 1 12c1.73 4.39 6 7.5 11 7.5 1.53 0 2.98-.29 4.29-.82l3.02 3.02 1.41-1.41L2.71 3.16zM12 17c-2.76 0-5-2.24-5-5 0-.71.16-1.38.42-1.99l1.57 1.57c-.02.14-.03.28-.03.42 0 1.66 1.34 3 3 3 .14 0 .28-.01.42-.03l1.57 1.57c-.61.27-1.28.46-1.95.46zm2.97-5.33L9.67 6.37c.44-.24.94-.37 1.33-.37 1.66 0 3 1.34 3 3 0 .39-.13.89-.03 1.33-.05.01 1 1 1 1z";

export default function LoginPage() {
  const [role, setRole] = useState("owner");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin() {
    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const user = await login(username.trim(), password);

      if (user.role !== role) {
        setError(`This account is registered as ${user.role}, not ${role}.`);
        sessionStorage.clear(); // undo the login() side-effect since the role check failed
        setLoading(false);
        return;
      }

      navigate(user.role === "owner" ? "/owner" : "/cashier");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleLogin();
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img
          className="login-logo"
          alt="Filipee's Bistro logo"
          src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop"
        />
        <h1 className="login-title">Filipee's Bistro</h1>
        <p className="login-tagline">Masarap na Mura pa, Saan ka pa!</p>

        <div className="login-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your username"
            autoComplete="username"
          />
        </div>

        <div className="login-field">
          <label htmlFor="password">Password</label>
          <div className="password-wrap">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="eye-toggle"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <svg viewBox="0 0 24 24">
                <path d={showPassword ? EYE_SLASH_PATH : EYE_OPEN_PATH} />
              </svg>
            </button>
          </div>
        </div>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="button" className="primary-btn" onClick={handleLogin} disabled={loading}>
          {loading ? "Signing in…" : "Log In"}
        </button>

        <div className="role-row" role="radiogroup" aria-label="Login as">
          <button
            type="button"
            className={`role-btn ${role === "owner" ? "active" : ""}`}
            role="radio"
            aria-checked={role === "owner"}
            onClick={() => setRole("owner")}
          >
            Owner
          </button>
          <button
            type="button"
            className={`role-btn ${role === "cashier" ? "active" : ""}`}
            role="radio"
            aria-checked={role === "cashier"}
            onClick={() => setRole("cashier")}
          >
            Cashier
          </button>
        </div>
      </div>
    </div>
  );
}
