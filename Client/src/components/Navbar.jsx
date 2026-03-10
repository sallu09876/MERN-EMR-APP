import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ROLE_LINKS = {
  SUPER_ADMIN: [
    { to: "/admin", label: "Dashboard" },
    { to: "/admin/doctors", label: "Doctors" },
    { to: "/admin/receptionists", label: "Receptionists" },
    { to: "/admin/stats", label: "Stats" },
    { to: "/scheduler", label: "Scheduler" },
    { to: "/appointments/list", label: "Appointments" },
  ],
  RECEPTIONIST: [
    { to: "/appointments", label: "Dashboard" },
    { to: "/scheduler", label: "Scheduler" },
    { to: "/appointments/list", label: "Appointments" },
  ],
  DOCTOR: [
    { to: "/doctor", label: "My Appointments" },
  ],
};

const ROLE_COLORS = {
  SUPER_ADMIN: { bg: "rgba(14,165,160,0.15)", text: "#14b8b3", label: "Super Admin" },
  RECEPTIONIST: { bg: "rgba(139,92,246,0.15)", text: "#a78bfa", label: "Receptionist" },
  DOCTOR: { bg: "rgba(16,185,129,0.15)", text: "#34d399", label: "Doctor" },
};

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const links = user ? ROLE_LINKS[user.role] || [] : [];
  const roleStyle = user ? ROLE_COLORS[user.role] : null;

  return (
    <header style={{
      background: "linear-gradient(135deg, #0a1628 0%, #112240 100%)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      position: "sticky", top: 0, zIndex: 50,
      boxShadow: "0 2px 20px rgba(0,0,0,0.3)"
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>

        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
          <div style={{
            width: "34px", height: "34px",
            background: "linear-gradient(135deg, #0ea5a0, #0891b2)",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(14,165,160,0.4)"
          }}>
            <span style={{ color: "white", fontSize: "16px" }}>⚕</span>
          </div>
          <div>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.1rem", color: "white", letterSpacing: "-0.01em" }}>MedFlow</span>
            <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", display: "block", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "-2px" }}>EMR System</span>
          </div>
        </Link>

        {/* Nav links */}
        {isAuthenticated && (
          <nav style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            {links.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link key={link.to} to={link.to} className="sidebar-link" style={{
                  color: active ? "#14b8b3" : "rgba(255,255,255,0.6)",
                  background: active ? "rgba(14,165,160,0.15)" : "transparent",
                  fontWeight: active ? 600 : 400,
                  fontSize: "0.82rem",
                  padding: "0.4rem 0.75rem",
                }}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {isAuthenticated && user ? (
            <>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "white" }}>{user.name}</div>
                <span style={{
                  fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.05em",
                  padding: "1px 7px", borderRadius: "999px",
                  background: roleStyle?.bg, color: roleStyle?.text
                }}>
                  {roleStyle?.label}
                </span>
              </div>
              <button onClick={handleLogout} style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.75)",
                padding: "0.4rem 0.875rem",
                borderRadius: "7px",
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.target.style.background = "rgba(239,68,68,0.15)"; e.target.style.borderColor = "rgba(239,68,68,0.4)"; e.target.style.color = "#fca5a5"; }}
              onMouseLeave={e => { e.target.style.background = "rgba(255,255,255,0.06)"; e.target.style.borderColor = "rgba(255,255,255,0.12)"; e.target.style.color = "rgba(255,255,255,0.75)"; }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary" style={{ textDecoration: "none" }}>Login</Link>
          )}
        </div>
      </div>
    </header>
  );
};
