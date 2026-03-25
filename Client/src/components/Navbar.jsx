import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ROLE_LINKS = {
  SUPER_ADMIN: [
    { to: "/admin",               label: "Dashboard" },
    { to: "/admin/doctors",       label: "Doctors" },
    { to: "/admin/receptionists", label: "Receptionists" },
    { to: "/admin/stats",         label: "Stats" },
    { to: "/scheduler",           label: "Scheduler" },
    { to: "/appointments/list",   label: "Appointments" },
  ],
  RECEPTIONIST: [
    { to: "/appointments",        label: "Dashboard" },
    { to: "/scheduler",           label: "Scheduler" },
    { to: "/appointments/list",   label: "Appointments" },
  ],
  DOCTOR: [
    { to: "/doctor",              label: "My Appointments" },
  ],
  PATIENT: [
    { to: "/patient/dashboard",     label: "Dashboard" },
    { to: "/patient/book",          label: "Book Appointment" },
    { to: "/patient/appointments", label: "My Appointments" },
    { to: "/patient/profile",       label: "My Profile" },
  ],
};

const ROLE_META = {
  SUPER_ADMIN:  { label: "Super Admin",  bg: "rgba(14,165,160,0.18)", text: "#14b8b3" },
  RECEPTIONIST: { label: "Receptionist", bg: "rgba(139,92,246,0.18)", text: "#a78bfa" },
  DOCTOR:       { label: "Doctor",       bg: "rgba(16,185,129,0.18)", text: "#34d399" },
  PATIENT:      { label: "Patient",      bg: "rgba(14,165,160,0.16)", text: "#0ea5a0" },
};

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  const links    = user ? (ROLE_LINKS[user.role] || []) : [];
  const roleMeta = user ? ROLE_META[user.role] : null;

  // Close drawer whenever the route changes (link was clicked)
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Lock body scroll while drawer is open on mobile
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <div className="nav-root">
      <header className="nb-header">
        <div className="nb-inner">

          {/* Logo */}
          <Link to="/" className="nb-logo">
            <div className="nb-logo-icon">⚕</div>
            <div className="nb-logo-text">
              <span className="nb-logo-main">MedFlow</span>
              <span className="nb-logo-sub">EMR System</span>
            </div>
          </Link>

          {/* Desktop nav */}
          {isAuthenticated && (
            <nav className="nb-desktop-nav">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nb-link${location.pathname === link.to ? " active" : ""}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Desktop right */}
          <div className="nb-desktop-right">
            {isAuthenticated && user ? (
              <>
                <div style={{ textAlign: "right" }}>
                  <div className="nb-user-name">{user.name}</div>
                  <span className="nb-role-badge" style={{ background: roleMeta?.bg, color: roleMeta?.text }}>
                    {roleMeta?.label}
                  </span>
                </div>
                <button className="nb-logout-btn" onClick={handleLogout}>Sign Out</button>
              </>
            ) : (
              <Link to="/login" className="nb-logout-btn" style={{ textDecoration: "none" }}>Login</Link>
            )}
          </div>

          {/* Hamburger */}
          {isAuthenticated && (
            <button
              className={`nb-hamburger${open ? " is-open" : ""}`}
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              <span className="nb-bar" />
              <span className="nb-bar" />
              <span className="nb-bar" />
            </button>
          )}
        </div>
      </header>

      {/* ── Backdrop (closes drawer when tapped outside) ── */}
      <div
        className={`nb-backdrop${open ? " is-open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* ── Mobile drawer ── */}
      <div className={`nb-drawer${open ? " is-open" : ""}`} aria-hidden={!open}>
        <div className="nb-drawer-inner">

          {/* User info */}
          {user && (
            <div className="nb-drawer-user">
              <div className="nb-drawer-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="nb-drawer-uname">{user.name}</div>
                <span className="nb-drawer-urole" style={{ background: roleMeta?.bg, color: roleMeta?.text }}>
                  {roleMeta?.label}
                </span>
              </div>
            </div>
          )}

          {/* Nav links — onClick just closes; navigation happens via React Router */}
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nb-drawer-link${location.pathname === link.to ? " active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <span className="nb-dot" />
              {link.label}
            </Link>
          ))}

          {/* Logout */}
          <div className="nb-divider" />
          <button className="nb-drawer-logout" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
