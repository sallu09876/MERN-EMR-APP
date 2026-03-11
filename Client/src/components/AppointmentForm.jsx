import React, { useState } from "react";
import api from "../services/api";
import { ErrorMessage } from "./ErrorMessage";

export const AppointmentForm = ({ appointment, onSaved, onCancel }) => {
  const [purpose, setPurpose] = useState(appointment.purpose || "");
  const [notes, setNotes] = useState(appointment.notes || "");
  const [status, setStatus] = useState(appointment.status || "BOOKED");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      const { data } = await api.put(`/api/appointments/${appointment._id}`, { purpose, notes, status });
      onSaved(data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="apf-form" style={{
      background: "white", borderRadius: "14px", padding: "1.5rem",
      border: "2px solid var(--teal)", boxShadow: "0 0 0 4px var(--teal-glow)",
      animation: "fadeUp 0.3s ease",
      marginBottom: "1rem"
    }}>
      <style>{`
        @media (max-width: 767px) {
          .apf-form { padding: 1rem !important; }
          .apf-form form { grid-template-columns: 1fr !important; }
          .apf-form .apf-close { min-width: 44px; min-height: 44px; padding: 0.25rem; }
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--navy)" }}>Edit Appointment</h3>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {appointment.patientId?.name} · {appointment.doctorId?.name} · {appointment.slotStartTime}–{appointment.slotEndTime}
          </p>
        </div>
        <button type="button" className="apf-close" onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.25rem" }} aria-label="Close">×</button>
      </div>

      <ErrorMessage message={error} />

      <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="form-label">Purpose</label>
          <input className="form-input" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Reason for visit" />
        </div>
        <div>
          <label className="form-label">Status</label>
          <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="BOOKED">BOOKED</option>
            <option value="ARRIVED">ARRIVED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="form-label">Notes</label>
          <textarea className="form-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes" style={{ resize: "vertical" }} />
        </div>
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: "0.75rem" }}>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Saving…" : "Save Changes"}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
};
