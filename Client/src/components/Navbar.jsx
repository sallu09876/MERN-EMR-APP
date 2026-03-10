import React, { useState, useEffect, useRef } from "react";
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
};

const ROLE_META = {
  SUPER_ADMIN:  { label: "Super Admin",  bg: "rgba(14,165,160,0.18)", text: "#14b8b3" },
  RECEPTIONIST: { label: "Receptionist", bg: "rgba(139,92,246,0.18)", text: "#a78bfa" },
  DOCTOR:       { label: "Doctor",       bg: "rgba(16,185,129,0.18)", text: "#34d399" },
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
    <>
      <style>{`
        .nb-header {
          background: linear-gradient(135deg, #0a1628 0%, #112240 100%);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 20px rgba(0,0,0,0.3);
        }
        .nb-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 60px;
          gap: 0.5rem;
        }

        /* Logo */
        .nb-logo {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          text-decoration: none;
          flex-shrink: 0;
        }
        .nb-logo-icon {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #0ea5a0, #0891b2);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
          box-shadow: 0 2px 8px rgba(14,165,160,0.4);
          flex-shrink: 0;
        }
        .nb-logo-main {
          font-family: 'DM Serif Display', serif;
          font-size: 1.05rem;
          color: #fff;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .nb-logo-sub {
          font-size: 0.58rem;
          color: rgba(255,255,255,0.32);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          display: block;
          margin-top: -1px;
        }

        /* Desktop nav — hidden on mobile */
        .nb-desktop-nav {
          display: none;
          align-items: center;
          gap: 0.15rem;
          flex: 1;
          justify-content: center;
        }
        .nb-link {
          text-decoration: none;
          font-size: 0.8rem;
          padding: 0.38rem 0.7rem;
          border-radius: 7px;
          transition: all 0.14s;
          white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          color: rgba(255,255,255,0.58);
        }
        .nb-link:hover {
          color: rgba(255,255,255,0.9);
          background: rgba(255,255,255,0.07);
        }
        .nb-link.active {
          color: #14b8b3;
          background: rgba(14,165,160,0.15);
          font-weight: 600;
        }

        /* Desktop right — hidden on mobile */
        .nb-desktop-right {
          display: none;
          align-items: center;
          gap: 0.65rem;
          flex-shrink: 0;
        }
        .nb-user-name {
          font-size: 0.78rem;
          font-weight: 600;
          color: #fff;
          text-align: right;
          line-height: 1.3;
        }
        .nb-role-badge {
          font-size: 0.62rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          padding: 2px 8px;
          border-radius: 999px;
        }
        .nb-logout-btn {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.72);
          padding: 0.38rem 0.85rem;
          border-radius: 7px;
          font-size: 0.78rem;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .nb-logout-btn:hover {
          background: rgba(239,68,68,0.15);
          border-color: rgba(239,68,68,0.4);
          color: #fca5a5;
        }

        /* Hamburger — mobile only */
        .nb-hamburger {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 5px;
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9px;
          cursor: pointer;
          padding: 0;
          transition: background 0.15s;
          flex-shrink: 0;
          -webkit-tap-highlight-color: transparent;
        }
        .nb-hamburger:hover { background: rgba(255,255,255,0.12); }
        .nb-bar {
          width: 18px;
          height: 2px;
          background: rgba(255,255,255,0.8);
          border-radius: 2px;
          transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
          transform-origin: center;
        }
        .nb-hamburger.is-open .nb-bar:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .nb-hamburger.is-open .nb-bar:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .nb-hamburger.is-open .nb-bar:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* Backdrop */
        .nb-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 98;
          animation: nb-fadein 0.2s ease both;
        }
        .nb-backdrop.is-open { display: block; }

        /* Drawer */
        .nb-drawer {
          position: fixed;
          top: 60px;
          left: 0; right: 0;
          background: #0f1e38;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          z-index: 99;
          transform: translateY(-8px);
          opacity: 0;
          pointer-events: none;
          transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), opacity 0.2s ease;
          max-height: calc(100dvh - 60px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        .nb-drawer.is-open {
          transform: translateY(0);
          opacity: 1;
          pointer-events: auto;
        }
        .nb-drawer-inner {
          padding: 0.75rem 1rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        /* Drawer user block */
        .nb-drawer-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 0.5rem 0.9rem;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          margin-bottom: 0.4rem;
        }
        .nb-drawer-avatar {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0ea5a0, #0891b2);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          color: #fff;
          flex-shrink: 0;
        }
        .nb-drawer-uname {
          font-size: 0.9rem;
          font-weight: 600;
          color: #fff;
          line-height: 1.3;
        }
        .nb-drawer-urole {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          padding: 2px 8px;
          border-radius: 999px;
          display: inline-block;
          margin-top: 3px;
        }

        /* Drawer links */
        .nb-drawer-link {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          text-decoration: none;
          font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          color: rgba(255,255,255,0.65);
          padding: 0.72rem 0.75rem;
          border-radius: 10px;
          transition: background 0.13s, color 0.13s;
          -webkit-tap-highlight-color: transparent;
          /* IMPORTANT: pointer-events must be auto so clicks register */
          pointer-events: auto;
        }
        .nb-drawer-link:hover { color: #fff; background: rgba(255,255,255,0.07); }
        .nb-drawer-link.active {
          color: #14b8b3;
          background: rgba(14,165,160,0.14);
          font-weight: 600;
        }
        .nb-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #0ea5a0;
          flex-shrink: 0;
          opacity: 0;
          transition: opacity 0.13s;
        }
        .nb-drawer-link.active .nb-dot { opacity: 1; }

        /* Drawer logout */
        .nb-divider {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 0.4rem 0;
        }
        .nb-drawer-logout {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          width: 100%;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          color: #fca5a5;
          padding: 0.75rem;
          border-radius: 10px;
          font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
          margin-top: 0.2rem;
          -webkit-tap-highlight-color: transparent;
        }
        .nb-drawer-logout:hover, .nb-drawer-logout:active {
          background: rgba(239,68,68,0.18);
          border-color: rgba(239,68,68,0.35);
        }

        /* Desktop breakpoint */
        @media (min-width: 768px) {
          .nb-inner         { padding: 0 1.5rem; height: 64px; }
          .nb-desktop-nav   { display: flex; }
          .nb-desktop-right { display: flex; }
          .nb-hamburger     { display: none; }
          .nb-drawer        { display: none !important; }
          .nb-backdrop      { display: none !important; }
        }

        @keyframes nb-fadein {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* ── Header bar ── */}
      <header className="nb-header">
        <div className="nb-inner">

          {/* Logo */}
          <Link to="/" className="nb-logo">
            <div className="nb-logo-icon">⚕</div>
            <div>
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
    </>
  );
};
