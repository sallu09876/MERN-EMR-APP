import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { toastError, toastSuccess } from "../../utils/toast.js";
import { ServerWakeSpinner } from "../../components/ServerWakeSpinner.jsx";

export const PatientLoginPage = () => {
  const { patientLogin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slowWarning, setSlowWarning] = useState(false);
  const [serverStatus, setServerStatus] = useState("checking");
  const slowTimerRef = useRef(null);

  useEffect(() => {
    const checkAndWarm = async () => {
      const start = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        await fetch(`${import.meta.env.VITE_API_URL}/health`, {
          signal: controller.signal,
        });
        const elapsed = Date.now() - start;
        setServerStatus(elapsed < 2000 ? "warm" : "cold");
      } catch {
        setServerStatus("cold");
      } finally {
        clearTimeout(timeout);
      }
    };

    checkAndWarm();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSlowWarning(false);
    slowTimerRef.current = setTimeout(() => {
      setSlowWarning(true);
    }, 4000);

    try {
      await patientLogin(email, password);
      toastSuccess("Login successful");
      navigate("/patient/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid email or password";
      setError(msg);
      toastError(msg);
    } finally {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      setLoading(false);
      setSlowWarning(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", background: "linear-gradient(145deg, #0a1628 0%, #0f1e38 55%, #0a1628 100%)" }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: "1.2rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, margin: "0 auto 0.8rem", background: "linear-gradient(135deg, #0ea5a0, #0891b2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 22, fontWeight: 800 }}>
            ⚕
          </div>
          <h1 style={{ margin: 0, fontFamily: "'DM Serif Display',serif", color: "white", fontSize: "2rem" }}>Patient Portal</h1>
          <p style={{ margin: "0.35rem 0 0", color: "rgba(255,255,255,0.58)", fontSize: "0.9rem" }}>Sign in to book appointments</p>
        </div>

        <div style={{ background: "white", borderRadius: 22, padding: "1.6rem 1.4rem", boxShadow: "var(--shadow-lg)" }}>
          <h2 style={{ margin: 0, fontFamily: "'DM Serif Display',serif", color: "var(--navy)", fontSize: "1.6rem" }}>Welcome back</h2>
          <p style={{ margin: "0.35rem 0 1.1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Patient authentication</p>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 12, padding: "0.7rem 0.9rem", marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.95rem" }}>
            <div>
              <label className="form-label" htmlFor="pl-email">Email</label>
              <input id="pl-email" className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" required />
            </div>

            <div>
              <label className="form-label" htmlFor="pl-password">Password</label>
              <input id="pl-password" className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>

            <button
              className="btn-primary"
              type="submit"
              disabled={loading || authLoading}
              style={{ width: "100%", minHeight: "46px", justifyContent: "center", position: "relative" }}
            >
              {loading ? (
                <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <span>{slowWarning ? "Waking up server..." : "Logging in..."}</span>
                  {slowWarning && (
                    <>
                      <span style={{ fontSize: "0.7rem", opacity: 0.8, fontWeight: 400 }}>
                        Free server is starting up - this happens once, please wait
                      </span>
                      <ServerWakeSpinner message="Connecting to backend..." />
                    </>
                  )}
                </span>
              ) : "Sign In →"}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.1rem" }}>
              <Link to="/patient/register" style={{ color: "var(--teal)", textDecoration: "none", fontWeight: 700 }}>Don't have an account? Sign Up</Link>
              <Link to="/patient/forgot-password" style={{ color: "var(--text-secondary)", textDecoration: "none", fontWeight: 700 }}>Forgot Password?</Link>
            </div>

            <div style={{ marginTop: "0.6rem", borderTop: "1px solid var(--border)", paddingTop: "0.9rem" }}>
              <button type="button" className="btn-secondary" onClick={() => navigate("/login")} style={{ width: "100%", justifyContent: "center" }}>
                ← Back to Staff Login
              </button>
            </div>
          </form>
        </div>
        {/* {serverStatus === "cold" && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.65rem 1rem",
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "10px",
              fontSize: "0.78rem",
              color: "#92400e",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              animation: "fadeUp 0.3s ease",
            }}
          >
            <span>⚡</span>
            <span>
              Server is warming up - first login may take up to 30 seconds.
              Subsequent logins will be instant.
            </span>
          </div>
        )}

        {serverStatus === "warm" && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: "10px",
              fontSize: "0.78rem",
              color: "#065f46",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>🟢</span>
            <span>Server is online</span>
          </div>
        )} */}
      </div>
    </div>
  );
};

