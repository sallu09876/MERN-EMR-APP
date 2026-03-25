import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api.js";
import { toastError, toastSuccess } from "../../utils/toast.js";
import { useAuth } from "../../context/AuthContext.jsx";

const maskEmail = (email) => {
  if (!email) return "";
  const [user, domain] = email.split("@");
  const maskedUser = user.length <= 3 ? user[0] + "***" : user.slice(0, 3) + "***";
  return `${maskedUser}@${domain}`;
};

const OtpBoxes = ({ value, onChange, disabled }) => {
  const inputsRef = useRef([]);

  const safeValue = String(value ?? "");
  const digits = safeValue
    .padEnd(6, " ")
    .slice(0, 6)
    .split("")
    .map((d) => (d === " " ? "" : d));

  const setDigit = (idx, digit) => {
    const next = [...digits];
    next[idx] = digit;
    onChange(next.join(""));
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
      {digits.map((d, idx) => (
        <input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          value={d}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          disabled={disabled}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "").slice(0, 1);
            setDigit(idx, raw);
            if (raw && idx < 5) inputsRef.current[idx + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[idx] && idx > 0) {
              inputsRef.current[idx - 1]?.focus();
            }
          }}
          style={{
            width: 44,
            height: 48,
            borderRadius: 12,
            border: "1.5px solid var(--border)",
            background: "var(--surface-2)",
            textAlign: "center",
            fontSize: "1.1rem",
            fontFamily: "'DM Sans',sans-serif",
            fontWeight: 700,
          }}
        />
      ))}
    </div>
  );
};

const formatMMSS = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export const PatientOTPPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [searchParams] = useSearchParams();
  const emailFromQuery = searchParams.get("email");
  const purposeFromQuery = searchParams.get("purpose");

  const persistedEmail = localStorage.getItem("pending_patient_signup_email") || "";
  const persistedPurpose = localStorage.getItem("pending_patient_signup_purpose") || "";

  const email = emailFromQuery || state?.email || persistedEmail || "";
  const purpose = purposeFromQuery || state?.purpose || persistedPurpose || "SIGNUP";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const [secondsLeft, setSecondsLeft] = useState(10 * 60);

  const masked = useMemo(() => maskEmail(email), [email]);

  useEffect(() => {
    setSecondsLeft(10 * 60);
  }, [email, purpose]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const handleResend = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await api.post("/api/patient/auth/resend-otp", { email, purpose });
      toastSuccess("OTP resent");
      setOtp("");
      setSecondsLeft(10 * 60);
    } catch (err) {
      toastError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email) return;
    if (!otp || otp.replace(/\D/g, "").length !== 6) {
      toastError("Enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/api/patient/auth/verify-otp", { email, otp: otp.replace(/\D/g, ""), purpose });
      if (data?.user?.id && data?.accessToken) {
        setSession(data.user, data.accessToken);
      }
      toastSuccess("Email verified. Welcome!");
      navigate("/patient/dashboard");
    } catch (err) {
      toastError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const [fallbackEmail, setFallbackEmail] = useState("");

  useEffect(() => {
    if (email) setFallbackEmail(email);
  }, [email]);

  if (!email) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", background: "linear-gradient(145deg, #0a1628 0%, #0f1e38 55%, #0a1628 100%)" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          <div style={{ background: "white", borderRadius: 22, padding: "1.6rem 1.4rem", boxShadow: "var(--shadow-lg)" }}>
            <h1 style={{ margin: 0, fontFamily: "'DM Serif Display',serif", color: "var(--navy)", fontSize: "1.9rem" }}>
              Verify OTP
            </h1>
            <p style={{ margin: "0.35rem 0 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Enter your email again to continue.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 240px" }}>
                <label className="form-label" htmlFor="otp-fb-email">Email</label>
                <input
                  id="otp-fb-email"
                  className="form-input"
                  type="email"
                  value={fallbackEmail}
                  onChange={(e) => setFallbackEmail(e.target.value)}
                  placeholder="you@gmail.com"
                />
              </div>
              <div style={{ alignSelf: "flex-end" }}>
                <button
                  className="btn-primary"
                  type="button"
                  disabled={!fallbackEmail.trim()}
                  onClick={() => {
                    const params = new URLSearchParams({ email: fallbackEmail.trim(), purpose });
                    navigate(`/patient/verify-otp?${params.toString()}`);
                  }}
                >
                  Continue →
                </button>
              </div>
            </div>
            <div style={{ marginTop: "1.2rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
              <button type="button" className="btn-secondary" style={{ width: "100%", justifyContent: "center" }} onClick={() => navigate("/patient/register")}>
                ← Back to Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", background: "linear-gradient(145deg, #0a1628 0%, #0f1e38 55%, #0a1628 100%)" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ background: "white", borderRadius: 22, padding: "1.6rem 1.4rem", boxShadow: "var(--shadow-lg)" }}>
          <div style={{ marginBottom: "1rem" }}>
            <h1 style={{ margin: 0, fontFamily: "'DM Serif Display',serif", color: "var(--navy)", fontSize: "1.9rem" }}>Verify OTP</h1>
            <p style={{ margin: "0.35rem 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Enter the code sent to <b>{masked}</b>
            </p>
          </div>

          <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <OtpBoxes value={otp} onChange={setOtp} disabled={loading} />

            <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "-0.4rem" }}>
              Resend available in <b>{formatMMSS(secondsLeft)}</b>
            </div>

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Verifying…" : "Verify OTP →"}
            </button>

            <button
              className="btn-secondary"
              type="button"
              onClick={handleResend}
              disabled={secondsLeft > 0 || loading}
              style={{ justifyContent: "center" }}
            >
              Resend OTP
            </button>

            <div style={{ marginTop: "0.25rem", borderTop: "1px solid var(--border)", paddingTop: "0.9rem" }}>
              <button type="button" className="btn-secondary" onClick={() => navigate("/patient/login")} style={{ width: "100%", justifyContent: "center" }}>
                ← Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

