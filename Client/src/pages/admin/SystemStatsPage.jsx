import React, { useEffect, useState } from "react";
import api from "../../services/api.js";
import { Loader } from "../../components/Loader";

const StatCard = ({ icon, label, value, color, delay = 0, sub = "" }) => (
  <div className="ssp-stat-card" style={{
    background: "white", borderRadius: "16px", padding: "1.5rem",
    border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
    display: "flex", flexDirection: "column", gap: "0.875rem",
    animation: `fadeUp 0.4s ease ${delay}s both`, position: "relative", overflow: "hidden",
    transition: "all 0.2s ease",
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
  >
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
        {icon}
      </div>
      <div style={{ position: "absolute", top: 0, right: 0, width: "80px", height: "80px", borderRadius: "0 16px 0 80px", background: `${color}06` }} />
    </div>
    <div>
      <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>{label}</p>
      <p style={{ margin: "0.3rem 0 0", fontSize: "2.5rem", fontWeight: 700, color: "var(--navy)", fontFamily: "'DM Serif Display',serif", lineHeight: 1 }}>{value ?? <span style={{ opacity: 0.3 }}>—</span>}</p>
      {sub && <p style={{ margin: "0.3rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>{sub}</p>}
    </div>
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${color}, ${color}55)` }} />
  </div>
);

const SkeletonCard = ({ delay = 0 }) => (
  <div style={{ background: "white", borderRadius: "16px", padding: "1.5rem", border: "1px solid var(--border)", height: "140px", animation: `fadeUp 0.4s ease ${delay}s both`, overflow: "hidden", position: "relative" }}>
    <div style={{ background: "linear-gradient(90deg,var(--surface-2) 25%,var(--surface-3) 50%,var(--surface-2) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", height: "100%", borderRadius: "8px" }} />
  </div>
);

export const SystemStatsPage = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/admin/stats")
      .then(res => setStats(res.data.data))
      .catch(() => setError("Failed to load statistics. Please refresh."));
  }, []);

  return (
    <div>
      <style>{`
        @media (max-width: 767px) {
          .ssp-grid { grid-template-columns: 1fr !important; gap: 0.75rem !important; }
          .ssp-stat-card { padding: 1.25rem !important; }
        }
      `}</style>
      <div style={{ marginBottom: "1.75rem", animation: "fadeUp 0.4s ease" }}>
        <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(1.4rem, 4vw, 2rem)", color: "var(--navy)", margin: 0 }}>System Statistics</h1>
        <p style={{ color: "var(--text-muted)", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>Real-time overview of your clinic's activity</p>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "1rem 1.25rem", color: "#dc2626", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
          ⚠ {error}
        </div>
      )}

      <div className="ssp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "1rem" }}>
        {!stats ? (
          <>
            <SkeletonCard delay={0} />
            <SkeletonCard delay={0.05} />
            <SkeletonCard delay={0.1} />
            <SkeletonCard delay={0.15} />
            <SkeletonCard delay={0.2} />
            <SkeletonCard delay={0.25} />
          </>
        ) : (
          <>
            <StatCard icon="👨‍⚕️" label="Total Doctors" value={stats.totalDoctors} color="#0ea5a0" delay={0} sub="Registered medical staff" />
            <StatCard icon="🗂️" label="Total Receptionists" value={stats.totalReceptionists} color="#7c3aed" delay={0.05} sub="Front desk personnel" />
            <StatCard icon="👥" label="Total Patients" value={stats.totalPatients} color="#8b5cf6" delay={0.3} sub={`${stats.totalUnverified ?? 0} unverified`} />
            <StatCard icon="📋" label="All Appointments" value={stats.totalAppointments} color="#3b82f6" delay={0.1} sub="Across all time" />
            <StatCard icon="📅" label="Today's Appointments" value={stats.todayAppointments} color="#f0a500" delay={0.15} sub={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })} />
            <StatCard icon="🕐" label="Currently Booked" value={stats.bookedCount} color="#f97316" delay={0.2} sub="Awaiting check-in" />
            <StatCard icon="✅" label="Patients Arrived" value={stats.arrivedCount} color="#10b981" delay={0.25} sub="Checked in today" />
            
          </>
        )}
      </div>
    </div>
  );
};
