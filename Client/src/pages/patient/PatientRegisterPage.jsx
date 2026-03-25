import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api.js";
import { toastError, toastSuccess } from "../../utils/toast.js";

export const PatientRegisterPage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toastError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/patient/auth/register", { name, email, password });
      toastSuccess("OTP sent to your email");
      const params = new URLSearchParams({ email, purpose: "SIGNUP" });
      localStorage.setItem("pending_patient_signup_email", email.trim());
      localStorage.setItem("pending_patient_signup_purpose", "SIGNUP");
      navigate(`/patient/verify-otp?${params.toString()}`);
    } catch (err) {
      toastError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", background: "linear-gradient(145deg, #0a1628 0%, #0f1e38 55%, #0a1628 100%)" }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ textAlign: "center", marginBottom: "1.2rem" }}>
          <h1 style={{ margin: 0, fontFamily: "'DM Serif Display',serif", color: "white", fontSize: "2rem" }}>Create account</h1>
          <p style={{ margin: "0.35rem 0 0", color: "rgba(255,255,255,0.58)", fontSize: "0.9rem" }}>OTP verification required</p>
        </div>

        <div style={{ background: "white", borderRadius: 22, padding: "1.6rem 1.4rem", boxShadow: "var(--shadow-lg)" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.95rem" }}>
            <div>
              <label className="form-label" htmlFor="pr-name">Full Name</label>
              <input id="pr-name" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" required />
            </div>
            <div>
              <label className="form-label" htmlFor="pr-email">Email</label>
              <input id="pr-email" className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" required />
            </div>
            <div>
              <label className="form-label" htmlFor="pr-password">Password</label>
              <input id="pr-password" className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div>
              <label className="form-label" htmlFor="pr-confirm">Confirm Password</label>
              <input id="pr-confirm" className="form-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>

            <button className="btn-primary" type="submit" disabled={loading} style={{ justifyContent: "center" }}>
              {loading ? "Sending OTP…" : "Sign Up →"}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.1rem" }}>
              <Link to="/patient/login" style={{ color: "var(--text-secondary)", textDecoration: "none", fontWeight: 700 }}>I already have an account</Link>
              <Link to="/login" style={{ color: "var(--teal)", textDecoration: "none", fontWeight: 700 }}>Staff login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

