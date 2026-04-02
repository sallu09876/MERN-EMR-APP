import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { toastError, toastSuccess } from "../../utils/toast.js";
import { exportToExcel, exportToPDF } from "../../utils/exportUtils.js";

const badgeStyle = (status) => {
  if (status === "COMPLETED") return { background: "#f1f5f9", color: "#475569" };
  if (status === "CANCELLED") return { background: "#fee2e2", color: "#b91c1c" };
  return { background: "#d1fae5", color: "#065f46" }; // upcoming
};

export const PatientAppointmentsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/appointments/my-appointments");
      setAppointments(res.data.data || []);
    } catch (err) {
      toastError(err.response?.data?.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const canCancel = (a) => {
    if (["COMPLETED", "CANCELLED"].includes(a.status)) return false;
    const apptDate = new Date(a.appointmentDate);
    return apptDate >= todayStart;
  };

  const cancelAppointment = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      await api.delete(`/api/appointments/my-appointments/${id}`);
      toastSuccess("Appointment cancelled");
      await load();
    } catch (err) {
      toastError(err.response?.data?.message || "Failed to cancel");
    }
  };

  if (loading) {
    return <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-muted)", animation: "fadeUp 0.3s ease" }}>Loading appointments…</div>;
  }

  const patientName = user?.name || "Patient";

  const handleExportPDF = () => {
    if (appointments.length === 0) return;
    exportToPDF({
      title: "My Appointments — MedFlow",
      subtitle: `${patientName} · Exported on ${new Date().toLocaleDateString()}`,
      columns: ["Doctor", "Department", "Date", "Time", "Status", "Booked By", "Payment"],
      rows: appointments.map((a) => [
        a.doctorId?.name || a.patientName || "—",
        a.doctorId?.department || "—",
        a.appointmentDate,
        a.slotStartTime,
        a.status,
        a.bookedBy,
        a.paymentStatus === "PAID" ? "₹1 Paid" : "Walk-in",
      ]),
      filename: "my-appointments",
    });
    toastSuccess("Report downloaded successfully");
  };

  const handleExportExcel = () => {
    if (appointments.length === 0) return;
    exportToExcel({
      sheetName: "My Appointments",
      columns: ["Doctor", "Department", "Date", "Time", "Status", "Booked By", "Payment"],
      rows: appointments.map((a) => [
        a.doctorId?.name || a.patientName || "—",
        a.doctorId?.department || "—",
        a.appointmentDate,
        a.slotStartTime,
        a.status,
        a.bookedBy,
        a.paymentStatus === "PAID" ? "Paid ₹1" : "Walk-in",
      ]),
      filename: "my-appointments",
    });
    toastSuccess("Report downloaded successfully");
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "0.75rem", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontFamily: "'DM Serif Display', serif", color: "var(--navy)" }}>
            My Appointments
          </h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="btn-secondary btn-sm"
              onClick={handleExportPDF}
              disabled={appointments.length === 0}
              title={appointments.length === 0 ? "No data to export" : "Export as PDF"}
            >
              ↓ PDF
            </button>
            <button
              className="btn-secondary btn-sm"
              onClick={handleExportExcel}
              disabled={appointments.length === 0}
              title={appointments.length === 0 ? "No data to export" : "Export as Excel"}
            >
              ↓ Excel
            </button>
          </div>
        </div>
        <p>View upcoming visits and cancel future appointments</p>
      </div>

      <div style={{ background: "white", borderRadius: 14, padding: "0.75rem 0.75rem", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        {appointments.length === 0 ? (
          <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2rem" }}>📋</div>
            <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>No appointments found</div>
            <div style={{ marginTop: "0.25rem", fontSize: "0.85rem" }}>Book an appointment to see it here.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem", padding: "0.75rem" }}>
            {appointments.map((a) => {
              const statusKey = a.status === "ARRIVED" ? "BOOKED" : a.status;
              const badge = badgeStyle(statusKey);
              const payBadge =
                a.bookedBy === "PATIENT" && a.paymentStatus === "PAID"
                  ? { label: "✅ Paid ₹1", style: { background: "rgba(14,165,160,0.12)", color: "var(--teal)", border: "1px solid rgba(14,165,160,0.35)" } }
                  : a.bookedBy === "RECEPTIONIST"
                    ? { label: "🏥 Walk-in", style: { background: "rgba(124,58,237,0.10)", color: "#6d28d9", border: "1px solid rgba(124,58,237,0.28)" } }
                    : { label: "UNPAID", style: { background: "#f1f5f9", color: "#475569" } };

              return (
                <div key={a._id} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "1rem", background: "var(--surface-2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 900, color: "var(--navy)" }}>{a.doctorId?.name || "Doctor"}</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{a.doctorId?.department || ""}</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.45rem" }}>
                        {new Date(a.appointmentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} · {a.slotStartTime}–{a.slotEndTime}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                      <span className="badge" style={{ ...badge, textTransform: "none", fontSize: "0.75rem" }}>
                        {a.status === "BOOKED" || a.status === "ARRIVED" ? "Upcoming" : a.status}
                      </span>
                      <span className="badge" style={{ ...payBadge.style, textTransform: "none", fontSize: "0.7rem" }}>
                        {payBadge.label}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "0.75rem", flexWrap: "wrap" }}>
                    {canCancel(a) && (
                      <button className="btn-danger btn-sm" onClick={() => cancelAppointment(a._id)} style={{ borderColor: "rgba(239,68,68,0.35)" }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

