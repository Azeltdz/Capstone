// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import profilePic from "../assets/profile.jpg";

const EYE_OPEN_PATH =
  "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z";

const EYE_SLASH_PATH =
  "M2.71 3.27 1.29 4.69l3.17 3.17A10.94 10.94 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.63 0 3.17-.31 4.57-.87l3.14 3.14 1.42-1.42L2.71 3.27zM12 17c-2.76 0-5-2.24-5-5 0-1.1.36-2.12.96-2.94l1.42 1.42A3 3 0 0 0 12 15c.39 0 .77-.08 1.11-.22l1.57 1.57c-.82.41-1.73.65-2.68.65zm2.97-2.97-1.46-1.46A3 3 0 0 0 12 9c-.39 0-.77.08-1.11.22L9.43 7.76A5 5 0 0 1 17 12c0 .75-.17 1.47-.47 2.03L14.97 14.03zM12 6.5c3.2 0 6.08 1.83 7.67 5.5-.44 1.01-1.05 1.9-1.79 2.65l1.42 1.42A12.2 12.2 0 0 0 23 12C21.27 7.61 17 4.5 12 4.5c-1.03 0-2.03.13-2.98.38l1.57 1.57c.46-.03.93-.05 1.41-.05z";

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
          src={profilePic}
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
              onChange={(e) => {
                const value = e.target.value;
                setPassword(value);
                if (!value) setShowPassword(false);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            {password.length > 0 && (
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
            )}
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
