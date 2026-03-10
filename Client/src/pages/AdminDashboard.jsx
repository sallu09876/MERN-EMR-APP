import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NavCard = ({ to, icon, title, description, color }) => (
  <Link to={to} className="anc-card" style={{ "--anc-color": color }}>
    <div className="anc-icon" style={{ background: `${color}18` }}>{icon}</div>
    <div className="anc-body">
      <h3 className="anc-title">{title}</h3>
      <p className="anc-desc">{description}</p>
    </div>
    <span className="anc-arrow" style={{ color }}>→</span>
  </Link>
);

export const AdminDashboard = () => {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <style>{`
        /* ── Card ── */
        .anc-card {
          text-decoration: none;
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          background: white;
          border-radius: 14px;
          padding: 1.1rem 1.1rem 1.4rem;
          border: 1.5px solid var(--border);
          box-shadow: var(--shadow-sm);
          position: relative;
          cursor: pointer;
          /* Critical: isolate so z-index stacking is per-card */
          isolation: isolate;
          /* Prevent any overflow from child elements capturing taps */
          overflow: hidden;
          transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
          -webkit-tap-highlight-color: rgba(0,0,0,0.04);
        }
        .anc-card:hover  { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--anc-color); }
        .anc-card:active { transform: translateY(0); }
        .anc-icon {
          width: 42px; height: 42px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
          /* Make sure emoji doesn't capture pointer events */
          pointer-events: none;
        }
        .anc-body  { flex: 1; pointer-events: none; }
        .anc-title { margin: 0; font-size: 0.92rem; font-weight: 600; color: var(--navy); line-height: 1.3; }
        .anc-desc  { margin: 0.2rem 0 0; font-size: 0.78rem; color: var(--text-muted); line-height: 1.5; }
        .anc-arrow {
          position: absolute;
          bottom: 0.875rem; right: 0.875rem;
          font-size: 0.9rem;
          opacity: 0.4;
          pointer-events: none;
          transition: opacity 0.15s, transform 0.15s;
        }
        .anc-card:hover .anc-arrow { opacity: 0.85; transform: translateX(3px); }

        /* ── Grid: strictly 1 col mobile, 2 col ≥480, 3 col ≥900 ── */
        .anc-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }
        @media (min-width: 480px) {
          .anc-grid { grid-template-columns: repeat(2, 1fr); gap: 0.875rem; }
          .anc-card { padding: 1.25rem 1.25rem 1.5rem; }
        }
        @media (min-width: 900px) {
          .anc-grid { grid-template-columns: repeat(3, 1fr); gap: 1rem; }
          .anc-card { padding: 1.5rem 1.5rem 1.75rem; }
        }

        /* ── Header ── */
        .anc-header { margin-bottom: 1.4rem; }
        .anc-greeting {
          color: var(--teal); font-weight: 600; font-size: 0.75rem;
          text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 0.2rem;
        }
        .anc-name {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(1.45rem, 5vw, 2rem);
          color: var(--navy); margin: 0; line-height: 1.2;
        }
        .anc-sub { color: var(--text-muted); margin: 0.2rem 0 0; font-size: 0.875rem; }
        @media (min-width: 768px) { .anc-header { margin-bottom: 2rem; } }
      `}</style>

      <div className="anc-header">
        <p className="anc-greeting">{greeting}</p>
        <h1 className="anc-name">{user?.name || "Admin"}</h1>
        <p className="anc-sub">Here's your system overview for today.</p>
      </div>

      <div className="anc-grid">
        <NavCard to="/admin/doctors"       icon="👨‍⚕️" title="Manage Doctors"       description="Add, edit, or remove doctor accounts and schedules"   color="#0ea5a0" />
        <NavCard to="/admin/receptionists" icon="🗂️"  title="Receptionists"         description="Manage receptionist staff and login credentials"      color="#8b5cf6" />
        <NavCard to="/admin/stats"         icon="📊"  title="System Statistics"     description="View appointments, staff counts, and activity trends" color="#f0a500" />
        <NavCard to="/scheduler"           icon="📅"  title="Appointment Scheduler" description="Browse and book available doctor slots"               color="#10b981" />
        <NavCard to="/appointments/list"   icon="📋"  title="All Appointments"      description="View, edit, and manage all scheduled appointments"    color="#3b82f6" />
      </div>
    </div>
  );
};
