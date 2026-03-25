import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api.js";
import { toastError, toastSuccess } from "../../utils/toast.js";

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
            if (e.key === "Backspace" && !digits[idx] && idx > 0) inputsRef.current[idx - 1]?.focus();
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

export const PatientForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const emailFromQuery = searchParams.get("email") || "";
  const stepFromQuery = Number(searchParams.get("step") || "1");

  const persistedEmail = localStorage.getItem("pending_patient_forgot_email") || "";
  const persistedStepRaw = localStorage.getItem("pending_patient_forgot_step") || "1";
  const persistedStep = Number(persistedStepRaw);

  const initialStep =
    Number.isFinite(stepFromQuery) && stepFromQuery >= 1 && stepFromQuery <= 3
      ? stepFromQuery
      : Number.isFinite(persistedStep) && persistedStep >= 1 && persistedStep <= 3
        ? persistedStep
        : 1;

  const initialEmail = emailFromQuery || persistedEmail || "";

  const [step, setStep] = useState(initialStep);
  const [email, setEmail] = useState(initialEmail);

  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [secondsLeft, setSecondsLeft] = useState(10 * 60);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step < 2) return;
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [step, secondsLeft]);

  useEffect(() => {
    if (emailFromQuery) setEmail(emailFromQuery);
  }, [emailFromQuery]);

  useEffect(() => {
    if (stepFromQuery >= 1 && stepFromQuery <= 3) setStep(stepFromQuery);
  }, [stepFromQuery]);

  useEffect(() => {
    if (step === 2) setSecondsLeft(10 * 60);
  }, [step]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post("/api/patient/auth/forgot-password", { email });
      toastSuccess("OTP sent if account exists");
      setOtp("");
      setResetToken("");
      setStep(2);
      setSearchParams({ email: email.trim(), step: "2" });
      localStorage.setItem("pending_patient_forgot_email", email.trim());
      localStorage.setItem("pending_patient_forgot_step", "2");
    } catch (err) {
      toastError(err.response?.data?.message || "Failed to request OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.replace(/\D/g, "").length !== 6) {
      toastError("Enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/api/patient/auth/verify-otp", {
        email,
        otp: otp.replace(/\D/g, ""),
        purpose: "FORGOT_PASSWORD",
      });
      setResetToken(data.resetToken);
      setStep(3);
      setSearchParams({ email: email.trim(), step: "3" });
      localStorage.setItem("pending_patient_forgot_email", email.trim());
      localStorage.setItem("pending_patient_forgot_step", "3");
      toastSuccess("OTP verified. Set your new password.");
    } catch (err) {
      toastError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      toastError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/patient/auth/reset-password", { resetToken, newPassword });
      toastSuccess("Password reset successful");
      navigate("/patient/login");
    } catch (err) {
      toastError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await api.post("/api/patient/auth/resend-otp", { email, purpose: "FORGOT_PASSWORD" });
      toastSuccess("OTP resent");
      setOtp("");
      setResetToken("");
      setStep(2);
      setSecondsLeft(10 * 60);
      setSearchParams({ email: email.trim(), step: "2" });
      localStorage.setItem("pending_patient_forgot_email", email.trim());
      localStorage.setItem("pending_patient_forgot_step", "2");
    } catch (err) {
      toastError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", background: "linear-gradient(145deg, #0a1628 0%, #0f1e38 55%, #0a1628 100%)" }}>
      <div style={{ width: "100%", maxWidth: 580 }}>
        <div style={{ background: "white", borderRadius: 22, padding: "1.6rem 1.4rem", boxShadow: "var(--shadow-lg)" }}>
          <div style={{ marginBottom: "1.25rem" }}>
            <h1 style={{ margin: 0, fontFamily: "'DM Serif Display',serif", color: "var(--navy)", fontSize: "1.9rem" }}>
              Forgot Password
            </h1>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
              {[
                { id: 1, label: "Step 1" },
                { id: 2, label: "Step 2" },
                { id: 3, label: "Step 3" },
              ].map((s) => (
                <span
                  key={s.id}
                  style={{
                    padding: "0.4rem 0.7rem",
                    borderRadius: 999,
                    background: step === s.id ? "rgba(14,165,160,0.12)" : "var(--surface-2)",
                    color: step === s.id ? "var(--teal)" : "var(--text-muted)",
                    border: step === s.id ? "1.5px solid rgba(14,165,160,0.35)" : "1px solid var(--border)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                  }}
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          {step === 1 && (
            <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "0.95rem" }}>
              <div>
                <label className="form-label" htmlFor="fp-email">Email</label>
                <input id="fp-email" className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@gmail.com" />
              </div>
              <button className="btn-primary" type="submit" disabled={loading} style={{ justifyContent: "center" }}>
                {loading ? "Sending…" : "Send OTP →"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center" }}>
                Enter the 6-digit OTP sent to <b>{email}</b>
              </p>
              <OtpBoxes value={otp} onChange={setOtp} disabled={loading} />
              <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Resend available in <b>{formatMMSS(secondsLeft)}</b>
              </div>
              <button className="btn-primary" type="submit" disabled={loading} style={{ justifyContent: "center" }}>
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
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "0.95rem" }}>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Set your new password
              </p>
              <div>
                <label className="form-label" htmlFor="fp-new">New Password</label>
                <input id="fp-new" className="form-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              <div>
                <label className="form-label" htmlFor="fp-confirm">Confirm Password</label>
                <input id="fp-confirm" className="form-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              <button className="btn-primary" type="submit" disabled={loading} style={{ justifyContent: "center" }}>
                {loading ? "Resetting…" : "Reset Password →"}
              </button>
            </form>
          )}

          <div style={{ marginTop: "1.2rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
            <button type="button" className="btn-secondary" style={{ width: "100%", justifyContent: "center" }} onClick={() => navigate("/patient/login")}>
              ← Back to Patient Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

