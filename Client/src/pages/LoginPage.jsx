import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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
    <>
      <style>{`
        /* ── Reset for this page ── */
        .lp-root *, .lp-root *::before, .lp-root *::after {
          box-sizing: border-box;
        }

        /* ── Page shell ── */
        .lp-root {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(145deg, #0a1628 0%, #0f1e38 55%, #0a1628 100%);
          position: relative;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }

        /* Ambient blobs */
        .lp-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .lp-blob-1 {
          width: min(480px, 80vw);
          height: min(480px, 80vw);
          top: -20%;
          right: -15%;
          background: radial-gradient(circle, rgba(14,165,160,0.13) 0%, transparent 68%);
        }
        .lp-blob-2 {
          width: min(360px, 70vw);
          height: min(360px, 70vw);
          bottom: -15%;
          left: -12%;
          background: radial-gradient(circle, rgba(14,165,160,0.08) 0%, transparent 68%);
        }
        .lp-blob-3 {
          width: min(200px, 40vw);
          height: min(200px, 40vw);
          top: 40%;
          left: 30%;
          background: radial-gradient(circle, rgba(240,165,0,0.04) 0%, transparent 68%);
        }

        /* ── Mobile header strip ── */
        .lp-mobile-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.25rem 1.25rem 0;
          z-index: 1;
        }
        .lp-logo-icon {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, #0ea5a0, #0891b2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          box-shadow: 0 3px 14px rgba(14,165,160,0.45);
          flex-shrink: 0;
        }
        .lp-logo-text-main {
          font-family: 'DM Serif Display', serif;
          font-size: 1.1rem;
          color: #fff;
          line-height: 1.2;
        }
        .lp-logo-text-sub {
          font-size: 0.58rem;
          color: rgba(255,255,255,0.38);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        /* ── Card wrapper ── */
        .lp-card-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.25rem;
          z-index: 1;
        }

        /* ── The white card ── */
        .lp-card {
          background: #ffffff;
          border-radius: 22px;
          padding: 1.75rem 1.5rem 1.5rem;
          width: 100%;
          max-width: 420px;
          box-shadow:
            0 4px 6px rgba(0,0,0,0.05),
            0 20px 60px rgba(0,0,0,0.4),
            0 0 0 1px rgba(255,255,255,0.06);
          animation: lp-fadeup 0.4s cubic-bezier(0.22,1,0.36,1) both;
        }

        .lp-card-heading {
          font-family: 'DM Serif Display', serif;
          font-size: 1.7rem;
          color: #0a1628;
          margin: 0 0 0.3rem;
          line-height: 1.2;
        }
        .lp-card-sub {
          font-size: 0.85rem;
          color: #8896ab;
          margin: 0 0 1.5rem;
        }

        /* Role hint pills */
        .lp-role-hints {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }
        .lp-role-pill {
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          border: 1px solid;
        }
        .lp-role-pill-admin  { color: #0ea5a0; border-color: rgba(14,165,160,0.35); background: rgba(14,165,160,0.07); }
        .lp-role-pill-doc    { color: #16a34a; border-color: rgba(22,163,74,0.3);   background: rgba(22,163,74,0.07);  }
        .lp-role-pill-recept { color: #7c3aed; border-color: rgba(124,58,237,0.3);  background: rgba(124,58,237,0.07); }

        /* Error */
        .lp-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 0.7rem 0.9rem;
          color: #dc2626;
          font-size: 0.83rem;
          display: flex;
          align-items: flex-start;
          gap: 0.45rem;
          margin-bottom: 1.1rem;
          line-height: 1.4;
        }

        /* Form */
        .lp-form {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }
        .lp-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.35rem;
          letter-spacing: 0.01em;
        }
        .lp-input {
          width: 100%;
          padding: 0.72rem 0.9rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.95rem;
          font-family: 'DM Sans', sans-serif;
          color: #0a1628;
          background: #fafbfd;
          transition: border-color 0.15s, box-shadow 0.15s;
          outline: none;
          -webkit-appearance: none;
        }
        .lp-input:focus {
          border-color: #0ea5a0;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(14,165,160,0.12);
        }
        .lp-input::placeholder { color: #bcc5d0; }

        /* Password wrapper */
        .lp-pw-wrap { position: relative; }
        .lp-pw-wrap .lp-input { padding-right: 2.8rem; }
        .lp-eye {
          position: absolute;
          right: 0.7rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          color: #94a3b8;
          font-size: 1rem;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: color 0.15s;
        }
        .lp-eye:hover { color: #0ea5a0; }

        /* Submit button */
        .lp-btn {
          width: 100%;
          padding: 0.82rem 1rem;
          border: none;
          border-radius: 11px;
          background: linear-gradient(135deg, #0ea5a0 0%, #0891b2 100%);
          color: #fff;
          font-size: 0.95rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          box-shadow: 0 4px 16px rgba(14,165,160,0.35);
          margin-top: 0.3rem;
          letter-spacing: 0.01em;
          -webkit-tap-highlight-color: transparent;
        }
        .lp-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(14,165,160,0.45);
        }
        .lp-btn:active:not(:disabled) { transform: translateY(0); }
        .lp-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        /* Spinner */
        .lp-spin {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: lp-spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        /* Footer */
        .lp-footer {
          margin-top: 1.4rem;
          text-align: center;
          font-size: 0.7rem;
          color: #b0bac6;
          line-height: 1.7;
        }

        /* ── Desktop: side-by-side ── */
        @media (min-width: 768px) {
          .lp-root         { flex-direction: row; }
          .lp-mobile-header { display: none; }
          .lp-brand         { display: flex !important; }
          .lp-card-wrap {
            width: 480px;
            flex: none;
            padding: 2rem 2.5rem;
            align-items: center;
          }
          .lp-card {
            padding: 2.5rem 2.25rem 2rem;
          }
          .lp-card-heading { font-size: 2rem; }
        }

        /* ── Brand panel — hidden on mobile ── */
        .lp-brand {
          display: none;
          flex: 1;
          flex-direction: column;
          justify-content: center;
          padding: 4rem 4rem 4rem 5rem;
          z-index: 1;
        }
        .lp-brand-logo {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 3.5rem;
        }
        .lp-brand-logo-icon {
          width: 52px; height: 52px;
          background: linear-gradient(135deg, #0ea5a0, #0891b2);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px;
          box-shadow: 0 4px 20px rgba(14,165,160,0.45);
        }
        .lp-brand-logo-main {
          font-family: 'DM Serif Display', serif;
          font-size: 1.5rem;
          color: #fff;
          line-height: 1.2;
        }
        .lp-brand-logo-sub {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.38);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .lp-brand-headline {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(2rem, 3.5vw, 2.8rem);
          color: #fff;
          line-height: 1.18;
          margin: 0 0 1.25rem;
        }
        .lp-brand-em { color: #0ea5a0; font-style: italic; }
        .lp-brand-body {
          color: rgba(255,255,255,0.5);
          font-size: 0.95rem;
          line-height: 1.8;
          margin: 0 0 3rem;
          max-width: 360px;
        }
        .lp-features { display: flex; flex-direction: column; gap: 1rem; }
        .lp-feature {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }
        .lp-feature-check {
          width: 24px; height: 24px;
          border-radius: 50%;
          background: rgba(14,165,160,0.18);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          color: #0ea5a0;
          font-size: 11px;
          font-weight: 700;
        }
        .lp-feature-text {
          color: rgba(255,255,255,0.58);
          font-size: 0.875rem;
        }

        /* Divider with "or" */
        .lp-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 0.25rem 0;
          color: #cbd5e1;
          font-size: 0.75rem;
        }
        .lp-divider::before, .lp-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        /* Animations */
        @keyframes lp-fadeup {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="lp-root">
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />
        <div className="lp-blob lp-blob-3" />

        {/* Mobile-only top logo */}
        <div className="lp-mobile-header">
          <div className="lp-logo-icon">⚕</div>
          <div>
            <div className="lp-logo-text-main">MedFlow EMR</div>
            <div className="lp-logo-text-sub">Appointment System</div>
          </div>
        </div>

        {/* ── Desktop brand panel ── */}
        <div className="lp-brand">
          <div className="lp-brand-logo">
            <div className="lp-brand-logo-icon">⚕</div>
            <div>
              <div className="lp-brand-logo-main">MedFlow EMR</div>
              <div className="lp-brand-logo-sub">Appointment System</div>
            </div>
          </div>

          <h1 className="lp-brand-headline">
            Clinical care,<br />
            <em className="lp-brand-em">beautifully managed.</em>
          </h1>

          <p className="lp-brand-body">
            Streamline appointments, manage your clinical team, and deliver
            exceptional patient experiences — all in one place.
          </p>

          <div className="lp-features">
            {[
              "Role-based access control",
              "Real-time slot availability",
              "Audit logging & compliance",
            ].map((f) => (
              <div key={f} className="lp-feature">
                <div className="lp-feature-check">✓</div>
                <span className="lp-feature-text">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Form panel ── */}
        <div className="lp-card-wrap">
          <div className="lp-card">
            <h2 className="lp-card-heading">Welcome back</h2>
            <p className="lp-card-sub">Sign in to your account to continue</p>

            {/* Role hint pills */}
            <div className="lp-role-hints">
              <span className="lp-role-pill lp-role-pill-admin">Super Admin</span>
              <span className="lp-role-pill lp-role-pill-doc">Doctor</span>
              <span className="lp-role-pill lp-role-pill-recept">Receptionist</span>
            </div>

            {error && (
              <div className="lp-error">
                <span style={{ flexShrink: 0 }}>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form className="lp-form" onSubmit={handleSubmit}>
              <div>
                <label className="lp-label" htmlFor="lp-email">Email address</label>
                <input
                  id="lp-email"
                  className="lp-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@hospital.com"
                  required
                  autoFocus
                  autoCapitalize="none"
                  inputMode="email"
                />
              </div>

              <div>
                <label className="lp-label" htmlFor="lp-password">Password</label>
                <div className="lp-pw-wrap">
                  <input
                    id="lp-password"
                    className="lp-input"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="lp-eye"
                    onClick={() => setShowPw((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="lp-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="lp-spin" />
                    Signing in…
                  </>
                ) : (
                  <>Sign In &rarr;</>
                )}
              </button>
            </form>

            <div className="lp-footer">
              🔒 Secure access · HIPAA-compliant · 256-bit encrypted
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
