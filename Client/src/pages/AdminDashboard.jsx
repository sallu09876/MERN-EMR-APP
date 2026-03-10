import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NavCard = ({ to, icon, title, description, color }) => (
  <Link to={to} style={{ textDecoration: "none" }}>
    <div style={{
      background: "white", borderRadius: "14px", padding: "1.5rem",
      border: "1px solid var(--border)", cursor: "pointer",
      transition: "all 0.2s ease", boxShadow: "var(--shadow-sm)",
      display: "flex", flexDirection: "column", gap: "0.75rem",
      position: "relative", overflow: "hidden"
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.borderColor = color; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
        {icon}
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--navy)" }}>{title}</h3>
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{description}</p>
      </div>
      <div style={{ position: "absolute", bottom: "1rem", right: "1rem", color: color, fontSize: "1rem", opacity: 0.5 }}>→</div>
    </div>
  </Link>
);

export const AdminDashboard = () => {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <p style={{ color: "var(--teal)", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>{greeting}</p>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "2rem", color: "var(--navy)", margin: 0 }}>
          {user?.name || "Admin"}
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.25rem", fontSize: "0.9rem" }}>Here's your system overview for today.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
        <NavCard to="/admin/doctors"      icon="👨‍⚕️" title="Manage Doctors"      description="Add, edit, or remove doctor accounts and schedules"   color="#0ea5a0" />
        <NavCard to="/admin/receptionists" icon="🗂️" title="Receptionists"       description="Manage receptionist staff and login credentials"      color="#8b5cf6" />
        <NavCard to="/admin/stats"        icon="📊" title="System Statistics"   description="View appointments, staff counts, and activity trends" color="#f0a500" />
        <NavCard to="/scheduler"          icon="📅" title="Appointment Scheduler" description="Browse and book available doctor slots"             color="#10b981" />
        <NavCard to="/appointments/list"  icon="📋" title="All Appointments"    description="View, edit, and manage all scheduled appointments"    color="#3b82f6" />
      </div>
    </div>
  );
};
