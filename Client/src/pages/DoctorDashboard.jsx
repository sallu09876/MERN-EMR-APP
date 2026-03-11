import React, { useEffect, useState, useCallback } from "react";
import { useAppointments } from "../hooks/useAppointments";
import { useAuth } from "../context/AuthContext.jsx";
import { Loader } from "../components/Loader";
import { ErrorMessage } from "../components/ErrorMessage";
import { formatDateForInput } from "../utils/formatTime";

const BADGE = { BOOKED: "badge-booked", ARRIVED: "badge-arrived", COMPLETED: "badge-completed", CANCELLED: "badge-cancelled" };

const StatCard = ({ icon, label, value, color, delay = 0 }) => (
  <div style={{
    background: "white", borderRadius: "14px", padding: "1.25rem 1.5rem",
    border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
    display: "flex", alignItems: "center", gap: "1rem",
    animation: `fadeUp 0.4s ease ${delay}s both`, position: "relative", overflow: "hidden",
  }}>
    <div style={{
      width: "48px", height: "48px", borderRadius: "12px", background: `${color}18`,
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0
    }}>{icon}</div>
    <div>
      <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>{label}</p>
      <p style={{ margin: "0.2rem 0 0", fontSize: "1.75rem", fontWeight: 700, color: "var(--navy)", fontFamily: "'DM Serif Display',serif", lineHeight: 1 }}>{value}</p>
    </div>
    <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "4px", background: color, borderRadius: "0 14px 14px 0" }} />
  </div>
);

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const { appointments, pagination, loading, error, load } = useAppointments();
  const [dateFilter, setDateFilter] = useState("");
  const today = formatDateForInput(new Date());

  const loadPage = useCallback((page = 1) => {
    const params = { page };
    if (dateFilter) params.date = dateFilter;
    load(params);
  }, [load, dateFilter]);

  useEffect(() => { loadPage(1); }, [loadPage]);

  const arrivedCount = appointments.filter(a => a.status === "ARRIVED").length;
  const bookedCount = appointments.filter(a => a.status === "BOOKED").length;
  const completedCount = appointments.filter(a => a.status === "COMPLETED").length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <style>{`
        @media (max-width: 767px) {
          .dd-stat-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 0.75rem !important; }
          .dd-filter-bar { flex-direction: column !important; align-items: stretch !important; }
          .dd-filter-bar .form-input { width: 100% !important; }
          .dd-filter-bar .btn-primary, .dd-filter-bar .btn-secondary { width: 100%; justify-content: center; }
          .dd-filter-count { margin-left: 0 !important; margin-top: 0.25rem; text-align: center; }
          .dd-table-wrap { display: none !important; }
          .dd-cards { display: block !important; }
          .dd-card { background: white; border-radius: 12px; padding: 1rem; margin-bottom: 0.75rem; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
          .dd-pagination { flex-direction: column; gap: 0.75rem; align-items: center; padding: 0.75rem 1rem !important; }
          .dd-pagination .btn-sm { min-width: 0; flex: 1; }
        }
        @media (min-width: 768px) {
          .dd-cards { display: none !important; }
        }
        .dd-cards { display: none; }
      `}</style>
      <div style={{ marginBottom: "1.75rem", animation: "fadeUp 0.4s ease" }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--teal)", margin: "0 0 0.25rem" }}>{greeting}, Doctor</p>
        <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "2rem", color: "var(--navy)", margin: 0 }}>{user?.name || "Doctor"}</h1>
        <p style={{ color: "var(--text-muted)", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>Here are your scheduled appointments.</p>
      </div>

      <div className="dd-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <StatCard icon="📋" label="Total" value={pagination.total} color="#0ea5a0" delay={0} />
        <StatCard icon="🕐" label="Booked" value={bookedCount} color="#3b82f6" delay={0.05} />
        <StatCard icon="✅" label="Arrived" value={arrivedCount} color="#10b981" delay={0.1} />
        <StatCard icon="🏁" label="Completed" value={completedCount} color="#8b5cf6" delay={0.15} />
      </div>

      <div className="dd-filter-bar" style={{ background: "white", borderRadius: "14px", padding: "1.25rem 1.5rem", marginBottom: "1.25rem", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end", animation: "fadeUp 0.4s ease 0.18s both" }}>
        <div style={{ flex: "1 1 140px" }}>
          <label className="form-label">Filter by Date</label>
          <input type="date" className="form-input" style={{ width: "100%", minWidth: 0 }} value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={() => setDateFilter(today)}>Today</button>
        {dateFilter && <button className="btn-secondary" onClick={() => setDateFilter("")}>Clear</button>}
        <div className="dd-filter-count" style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--text-muted)", alignSelf: "center" }}>{pagination.total} appointment{pagination.total !== 1 ? "s" : ""}</div>
      </div>

      <ErrorMessage message={error} />

      {loading ? <Loader text="Loading appointments…" /> : (
        <div style={{ background: "white", borderRadius: "14px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)", overflow: "hidden", animation: "fadeUp 0.4s ease 0.22s both" }}>
          {/* Mobile card layout */}
          <div className="dd-cards" style={{ padding: "0.75rem" }}>
            {!appointments.length ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🗓️</div>
                <p style={{ margin: 0, fontWeight: 500 }}>No appointments found</p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem" }}>{dateFilter ? "Try clearing the date filter" : "Your schedule is clear"}</p>
              </div>
            ) : appointments.map((a) => (
              <div key={a._id} className="dd-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{a.patientId?.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{a.slotStartTime} – {a.slotEndTime}</div>
                  </div>
                  <span className={`badge ${BADGE[a.status] || ""}`}>{a.status}</span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{a.purpose || "—"}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{new Date(a.appointmentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} · {a.patientId?.mobile}</div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="dd-table-wrap" style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th><th>Time</th><th>Patient</th><th>Mobile</th><th>Purpose</th><th>Notes</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a, i) => (
                  <tr key={a._id} style={{ animation: `fadeUp 0.3s ease ${i * 0.03}s both` }}>
                    <td style={{ whiteSpace: "nowrap", fontWeight: 500 }}>{new Date(a.appointmentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td style={{ whiteSpace: "nowrap", color: "var(--text-secondary)" }}>{a.slotStartTime} – {a.slotEndTime}</td>
                    <td style={{ fontWeight: 600 }}>{a.patientId?.name}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.83rem" }}>{a.patientId?.mobile}</td>
                    <td style={{ maxWidth: "150px" }}><span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-secondary)" }}>{a.purpose || "—"}</span></td>
                    <td style={{ maxWidth: "140px" }}><span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-muted)", fontSize: "0.82rem" }}>{a.notes || "—"}</span></td>
                    <td><span className={`badge ${BADGE[a.status] || ""}`}>{a.status}</span></td>
                  </tr>
                ))}
                {!appointments.length && (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🗓️</div>
                    <p style={{ margin: 0, fontWeight: 500 }}>No appointments found</p>
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem" }}>{dateFilter ? "Try clearing the date filter" : "Your schedule is clear"}</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="dd-pagination" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.875rem 1.5rem", borderTop: "1px solid var(--border)", background: "var(--surface-2)", flexWrap: "wrap", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Page {pagination.page} of {pagination.pages}</span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="btn-secondary btn-sm" disabled={pagination.page <= 1} onClick={() => loadPage(pagination.page - 1)}>← Prev</button>
              <button className="btn-secondary btn-sm" disabled={pagination.page >= pagination.pages} onClick={() => loadPage(pagination.page + 1)}>Next →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
