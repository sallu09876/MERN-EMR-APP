import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NavCard = ({ to, icon, title, description, color }) => (
  <Link to={to} className="admin-nav-card" style={{ "--card-color": color }}>
    <div className="admin-nav-card-icon" style={{ background: `${color}18` }}>
      {icon}
    </div>
    <div className="admin-nav-card-body">
      <h3 className="admin-nav-card-title">{title}</h3>
      <p className="admin-nav-card-desc">{description}</p>
    </div>
    <div className="admin-nav-card-arrow" style={{ color }}>→</div>
  </Link>
);

export const AdminDashboard = () => {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <style>{`
        /* ── Admin dashboard card grid ── */
        .admin-nav-card {
          text-decoration: none;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          background: white;
          border-radius: 14px;
          padding: 1.25rem;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
          position: relative;
          overflow: hidden;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
          /* Ensure the whole card is one tap target */
          -webkit-tap-highlight-color: transparent;
          cursor: pointer;
        }
        .admin-nav-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--card-color);
        }
        .admin-nav-card:active {
          transform: translateY(0);
        }
        .admin-nav-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          flex-shrink: 0;
        }
        .admin-nav-card-body {
          flex: 1;
        }
        .admin-nav-card-title {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--navy);
          line-height: 1.3;
        }
        .admin-nav-card-desc {
          margin: 0.25rem 0 0;
          font-size: 0.8rem;
          color: var(--text-muted);
          line-height: 1.5;
        }
        .admin-nav-card-arrow {
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          font-size: 1rem;
          opacity: 0.45;
          transition: opacity 0.15s, transform 0.15s;
        }
        .admin-nav-card:hover .admin-nav-card-arrow {
          opacity: 0.9;
          transform: translateX(3px);
        }

        /* ── Grid: 1 col on mobile, 2 on sm, 3+ on lg ── */
        .admin-cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.875rem;
        }
        @media (min-width: 480px) {
          .admin-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .admin-nav-card {
            padding: 1.4rem;
          }
        }
        @media (min-width: 900px) {
          .admin-cards-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
          }
          .admin-nav-card {
            padding: 1.5rem;
          }
        }

        /* ── Header responsive ── */
        .admin-dash-header {
          margin-bottom: 1.5rem;
          animation: fadeUp 0.4s ease;
        }
        .admin-dash-greeting {
          color: var(--teal);
          font-weight: 600;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 0 0 0.2rem;
        }
        .admin-dash-name {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(1.5rem, 5vw, 2rem);
          color: var(--navy);
          margin: 0;
          line-height: 1.2;
        }
        .admin-dash-sub {
          color: var(--text-muted);
          margin: 0.25rem 0 0;
          font-size: 0.875rem;
        }
        @media (min-width: 768px) {
          .admin-dash-header {
            margin-bottom: 2rem;
          }
        }
      `}</style>

      <div style={{ animation: "fadeUp 0.4s ease" }}>
        <div className="admin-dash-header">
          <p className="admin-dash-greeting">{greeting}</p>
          <h1 className="admin-dash-name">{user?.name || "Admin"}</h1>
          <p className="admin-dash-sub">Here's your system overview for today.</p>
        </div>

        <div className="admin-cards-grid">
          <NavCard to="/admin/doctors" icon="👨‍⚕️" title="Manage Doctors" description="Add, edit, or remove doctor accounts and schedules" color="#0ea5a0" />
          <NavCard to="/admin/receptionists" icon="🗂️" title="Receptionists" description="Manage receptionist staff and login credentials" color="#8b5cf6" />
          <NavCard to="/admin/stats" icon="📊" title="System Statistics" description="View appointments, staff counts, and activity trends" color="#f0a500" />
          <NavCard to="/scheduler" icon="📅" title="Appointment Scheduler" description="Browse and book available doctor slots" color="#10b981" />
          <NavCard to="/appointments/list" icon="📋" title="All Appointments" description="View, edit, and manage all scheduled appointments" color="#3b82f6" />
        </div>
      </div>
    </>
  );
};
