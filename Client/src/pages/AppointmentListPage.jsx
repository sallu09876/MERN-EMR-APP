import React, { useEffect, useState, useCallback } from "react";
import { useAppointments } from "../hooks/useAppointments";
import { AppointmentForm } from "../components/AppointmentForm";
import { Loader } from "../components/Loader";
import { ErrorMessage } from "../components/ErrorMessage";

const BADGE = { BOOKED: "badge-booked", ARRIVED: "badge-arrived", COMPLETED: "badge-completed", CANCELLED: "badge-cancelled" };

export const AppointmentListPage = () => {
  const { appointments, pagination, loading, error, load, markArrived, remove } = useAppointments();
  const [updatingId, setUpdatingId] = useState("");
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [actionError, setActionError] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadPage = useCallback((page = 1) => {
    const params = { page };
    if (dateFilter) params.date = dateFilter;
    if (statusFilter) params.status = statusFilter;
    load(params);
  }, [load, dateFilter, statusFilter]);

  useEffect(() => { loadPage(1); }, [loadPage]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this appointment?")) return;
    setUpdatingId(id); setActionError("");
    try { await remove(id); loadPage(pagination.page); }
    catch (err) { setActionError(err.response?.data?.message || "Failed to delete"); }
    finally { setUpdatingId(""); }
  };

  const handleArrive = async (id) => {
    setUpdatingId(id); setActionError("");
    try { await markArrived(id); loadPage(pagination.page); }
    catch (err) { setActionError(err.response?.data?.message || "Failed to mark arrived"); }
    finally { setUpdatingId(""); }
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <div className="page-header">
        <h1>Appointments</h1>
        <p>View and manage all scheduled appointments</p>
      </div>

      {/* Filters */}
      <div style={{ background: "white", borderRadius: "14px", padding: "1.25rem 1.5rem", marginBottom: "1.25rem", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
        <div>
          <label className="form-label">Date</label>
          <input type="date" className="form-input" style={{ width: "auto" }} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Status</label>
          <select className="form-input" style={{ width: "auto" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="BOOKED">Booked</option>
            <option value="ARRIVED">Arrived</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        {(dateFilter || statusFilter) && (
          <button className="btn-secondary" onClick={() => { setDateFilter(""); setStatusFilter(""); }}>Clear Filters</button>
        )}
        <div style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--text-muted)", alignSelf: "center" }}>
          {pagination.total} appointment{pagination.total !== 1 ? "s" : ""}
        </div>
      </div>

      <ErrorMessage message={error || actionError} />

      {editingAppointment && (
        <AppointmentForm
          appointment={editingAppointment}
          onSaved={() => { setEditingAppointment(null); loadPage(pagination.page); }}
          onCancel={() => setEditingAppointment(null)}
        />
      )}

      {loading ? <Loader /> : (
        <div style={{ background: "white", borderRadius: "14px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Doctor</th>
                  <th>Patient</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a, i) => (
                  <tr key={a._id} style={{ animation: `fadeUp 0.3s ease ${i * 0.03}s both` }}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{new Date(a.appointmentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{a.slotStartTime} – {a.slotEndTime}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{a.doctorId?.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{a.doctorId?.department}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{a.patientId?.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{a.patientId?.mobile}</div>
                    </td>
                    <td style={{ maxWidth: "160px" }}>
                      <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.purpose || "—"}</div>
                    </td>
                    <td>
                      <span className={`badge ${BADGE[a.status] || ""}`}>{a.status}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                        <button className="btn-secondary btn-sm" disabled={updatingId === a._id || a.status === "CANCELLED"} onClick={() => setEditingAppointment(a)}>Edit</button>
                        <button className="btn-secondary btn-sm" disabled={updatingId === a._id || ["ARRIVED","COMPLETED","CANCELLED"].includes(a.status)} onClick={() => handleArrive(a._id)}
                          style={{ borderColor: "#86efac", color: "#16a34a" }}
                          onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = "#f0fdf4"; e.currentTarget.style.borderColor = "#16a34a"; } }}
                          onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#86efac"; }}
                        >Arrived</button>
                        <button className="btn-danger btn-sm" disabled={updatingId === a._id} onClick={() => handleDelete(a._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!appointments.length && (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                    <div style={{ fontSize: "2rem" }}>📋</div>
                    <div style={{ marginTop: "0.5rem" }}>No appointments found</div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}>
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
