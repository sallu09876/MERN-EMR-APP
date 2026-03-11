import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

const QuickCard = ({ to, icon, title, desc, accent, delay }) => (
  <Link to={to} style={{ textDecoration: "none", WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}>
    <div className="rcd-quick-card" style={{
      background: "white", borderRadius: "16px", padding: "1.5rem",
      border: `1px solid var(--border)`, cursor: "pointer",
      boxShadow: "var(--shadow-sm)", animation: `fadeUp 0.4s ease ${delay}s both`,
      transition: "all 0.2s ease", display: "flex", flexDirection: "column", gap: "1rem",
      position: "relative", overflow: "hidden",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; e.currentTarget.style.borderColor = accent; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      <div style={{ width: "50px", height: "50px", borderRadius: "13px", background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>{icon}</div>
      <div>
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--navy)" }}>{title}</h3>
        <p style={{ margin: "0.375rem 0 0", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{desc}</p>
      </div>
      <div style={{ position: "absolute", bottom: "1.25rem", right: "1.25rem", width: "28px", height: "28px", borderRadius: "50%", background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center", color: accent, fontSize: "0.9rem", fontWeight: 700 }}>→</div>
    </div>
  </Link>
);

export const ReceptionistDashboard = () => {
  const { user } = useAuth();
  const [todayCount, setTodayCount] = useState("…");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    api.get("/api/appointments", { params: { page: 1, limit: 1, date: today } })
      .then(res => setTodayCount(res.data.pagination?.total ?? 0))
      .catch(() => setTodayCount("—"));
  }, []);

  return (
    <div>
      <style>{`
        @media (max-width: 767px) {
          .rcd-quick-card { min-height: 100px; }
          .rcd-today { padding: 1.25rem 1.5rem !important; }
          .rcd-today-num { font-size: 2.25rem !important; }
        }
      `}</style>
      <div style={{ marginBottom: "2rem", animation: "fadeUp 0.4s ease" }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--teal)", margin: "0 0 0.25rem" }}>{greeting}</p>
        <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "2rem", color: "var(--navy)", margin: 0 }}>{user?.name || "Receptionist"}</h1>
        <p style={{ color: "var(--text-muted)", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>Ready to manage today's appointments.</p>
      </div>

      {/* Today stat */}
      <div className="rcd-today" style={{
        background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)",
        borderRadius: "16px", padding: "1.5rem 2rem", marginBottom: "1.75rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 8px 32px rgba(10,22,40,0.25)", animation: "fadeUp 0.4s ease 0.05s both",
      }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.45)" }}>Today's Appointments</p>
          <p className="rcd-today-num" style={{ margin: "0.25rem 0 0", fontSize: "3rem", fontWeight: 700, fontFamily: "'DM Serif Display',serif", color: "white", lineHeight: 1 }}>{todayCount}</p>
        </div>
        <div style={{ fontSize: "3.5rem", opacity: 0.2 }}>📅</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
        <QuickCard to="/scheduler" icon="📅" title="Open Scheduler" desc="Browse available slots by doctor, department & date — then book instantly" accent="#0ea5a0" delay={0.1} />
        <QuickCard to="/appointments/list" icon="📋" title="Appointment List" desc="View, edit, mark patients as arrived, or cancel appointments" accent="#8b5cf6" delay={0.15} />
      </div>
    </div>
  );
};
