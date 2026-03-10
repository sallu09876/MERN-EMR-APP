import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await login(email, password);
      if (user.role === "SUPER_ADMIN") navigate("/admin");
      else if (user.role === "DOCTOR") navigate("/doctor");
      else navigate("/appointments");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: "linear-gradient(135deg, #0a1628 0%, #112240 60%, #0ea5a020 100%)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background decorations */}
      <div style={{
        position: "absolute", top: "-120px", right: "-120px",
        width: "400px", height: "400px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(14,165,160,0.12) 0%, transparent 70%)",
      }} />
      <div style={{
        position: "absolute", bottom: "-80px", left: "-80px",
        width: "300px", height: "300px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(14,165,160,0.08) 0%, transparent 70%)",
      }} />

      {/* Left branding panel */}
      <div style={{
        flex: 1, display: "none", flexDirection: "column", justifyContent: "center",
        padding: "4rem",
        "@media (min-width: 768px)": { display: "flex" }
      }} style={{ display:"flex", flexDirection:"column", justifyContent:"center", padding:"4rem" }}>
        <div style={{ maxWidth: "400px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "3rem"
          }}>
            <div style={{
              width: "48px", height: "48px",
              background: "linear-gradient(135deg, #0ea5a0, #0891b2)",
              borderRadius: "12px",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(14,165,160,0.4)",
              fontSize: "22px"
            }}>⚕</div>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.5rem", color: "white" }}>MedFlow EMR</div>
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Appointment System</div>
            </div>
          </div>

          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "2.5rem", color: "white", lineHeight: 1.2, marginBottom: "1.25rem" }}>
            Clinical care,<br />
            <em style={{ color: "#0ea5a0" }}>beautifully managed.</em>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.7, fontSize: "0.95rem" }}>
            Streamline appointments, manage your clinical team, and deliver exceptional patient experiences — all in one place.
          </p>

          <div style={{ marginTop: "3rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {["Role-based access control", "Real-time slot availability", "Audit logging & compliance"].map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(14,165,160,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "#0ea5a0", fontSize: "11px" }}>✓</span>
                </div>
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.85rem" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem", minWidth:"380px", width:"450px" }}>
        <div style={{
          background: "white",
          borderRadius: "20px",
          padding: "2.5rem",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
          animation: "fadeUp 0.5s ease both",
        }}>
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.75rem", color: "#0a1628", margin: 0 }}>Welcome back</h2>
            <p style={{ color: "#8896ab", fontSize: "0.875rem", marginTop: "0.375rem" }}>Sign in to your account to continue</p>
          </div>

          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: "8px", padding: "0.75rem 1rem",
              color: "#dc2626", fontSize: "0.85rem", marginBottom: "1.25rem",
              display: "flex", alignItems: "center", gap: "0.5rem"
            }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label className="form-label">Email address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@hospital.com"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "0.75rem", fontSize: "0.9rem", marginTop: "0.5rem" }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <svg style={{ animation: "spin 1s linear infinite", width: "16px", height: "16px" }} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                  </svg>
                  Signing in…
                </span>
              ) : "Sign In →"}
            </button>
          </form>

          <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.75rem", color: "#8896ab" }}>
            Secure access · HIPAA-compliant · 256-bit encrypted
          </p>
        </div>
      </div>
    </div>
  );
};
