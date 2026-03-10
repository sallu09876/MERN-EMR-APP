import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { ErrorMessage } from "../components/ErrorMessage";

export const BookingPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [patientType, setPatientType] = useState("NEW");
  const [patientSearch, setPatientSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [searching, setSearching] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: "", mobile: "", email: "", dob: "", gender: "OTHER" });
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!state?.doctorId || !state?.date || !state?.slot) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <div style={{ fontSize: "3rem" }}>⚠️</div>
        <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>No slot selected. Please go back to the scheduler.</p>
        <button className="btn-secondary" style={{ marginTop: "1rem" }} onClick={() => navigate("/scheduler")}>← Back to Scheduler</button>
      </div>
    );
  }

  const handleSearch = async () => {
    if (!patientSearch.trim()) return;
    setSearching(true);
    try {
      const { data } = await api.get("/api/patients/search", { params: { query: patientSearch } });
      setSearchResults(data.data || []);
    } catch (err) {
      setError("Search failed");
    } finally { setSearching(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      const payload = {
        doctorId: state.doctorId,
        appointmentDate: state.date,
        slotStartTime: state.slot.start,
        slotEndTime: state.slot.end,
        purpose, notes, patientType,
        ...(patientType === "EXISTING" ? { patientId: selectedPatientId } : { patient: newPatient }),
      };
      await api.post("/api/appointments", payload);
      navigate("/appointments/list");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to book appointment. The slot may have been taken.");
    } finally { setSubmitting(false); }
  };

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: "1.5rem" }}>
      <h3 style={{ margin: "0 0 1rem", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>{title}</h3>
      {children}
    </div>
  );

  return (
    <div style={{ animation: "fadeUp 0.4s ease", maxWidth: "680px" }}>
      <div className="page-header">
        <h1>Book Appointment</h1>
        <p>Complete the details below to confirm your booking</p>
      </div>

      {/* Slot summary */}
      <div style={{
        background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)",
        borderRadius: "14px", padding: "1.25rem 1.5rem",
        marginBottom: "1.5rem", color: "white",
        display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "40px", height: "40px", background: "rgba(14,165,160,0.25)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>📅</div>
          <div>
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Date</div>
            <div style={{ fontWeight: 600 }}>{new Date(state.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
          </div>
        </div>
        <div style={{ width: "1px", height: "36px", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "40px", height: "40px", background: "rgba(14,165,160,0.25)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🕐</div>
          <div>
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Time Slot</div>
            <div style={{ fontWeight: 600 }}>{state.slot.start} – {state.slot.end}</div>
          </div>
        </div>
      </div>

      <ErrorMessage message={error} />

      <div style={{ background: "white", borderRadius: "14px", padding: "1.75rem", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
        <form onSubmit={handleSubmit}>

          {/* Patient type */}
          <Section title="Patient Type">
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {["NEW", "EXISTING"].map((type) => (
                <button key={type} type="button" onClick={() => setPatientType(type)} style={{
                  flex: 1, padding: "0.875rem", borderRadius: "10px", cursor: "pointer",
                  border: `2px solid ${patientType === type ? "var(--teal)" : "var(--border)"}`,
                  background: patientType === type ? "var(--teal-glow)" : "var(--surface-2)",
                  color: patientType === type ? "var(--teal)" : "var(--text-secondary)",
                  fontWeight: patientType === type ? 700 : 500,
                  fontSize: "0.875rem", transition: "all 0.15s"
                }}>
                  {type === "NEW" ? "🆕 New Patient" : "🔍 Existing Patient"}
                </button>
              ))}
            </div>
          </Section>

          {/* Patient info */}
          {patientType === "EXISTING" ? (
            <Section title="Search Patient">
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
                <input className="form-input" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} placeholder="Search by name, mobile, or patient ID…" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())} />
                <button type="button" className="btn-primary" onClick={handleSearch} disabled={searching} style={{ whiteSpace: "nowrap" }}>
                  {searching ? "…" : "Search"}
                </button>
              </div>
              {searchResults.length > 0 && (
                <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", maxHeight: "200px", overflowY: "auto" }}>
                  {searchResults.map((p) => (
                    <label key={p._id} style={{
                      display: "flex", alignItems: "center", gap: "0.875rem",
                      padding: "0.75rem 1rem", cursor: "pointer",
                      borderBottom: "1px solid var(--border)",
                      background: selectedPatientId === p._id ? "var(--teal-glow)" : "white",
                      transition: "background 0.15s"
                    }}>
                      <input type="radio" name="patient" value={p._id} checked={selectedPatientId === p._id} onChange={() => setSelectedPatientId(p._id)} style={{ accentColor: "var(--teal)" }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{p.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.mobile} · ID: {p._id.slice(-6)}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {searchResults.length === 0 && patientSearch && !searching && (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "0.5rem 0" }}>No patients found. Try a different search term.</p>
              )}
            </Section>
          ) : (
            <Section title="New Patient Details">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div><label className="form-label">Full Name *</label><input className="form-input" value={newPatient.name} onChange={(e) => setNewPatient(p => ({ ...p, name: e.target.value }))} placeholder="John Smith" required /></div>
                <div><label className="form-label">Mobile *</label><input className="form-input" type="tel" value={newPatient.mobile} onChange={(e) => setNewPatient(p => ({ ...p, mobile: e.target.value }))} placeholder="+91 98765 43210" required /></div>
                <div><label className="form-label">Email</label><input className="form-input" type="email" value={newPatient.email} onChange={(e) => setNewPatient(p => ({ ...p, email: e.target.value }))} placeholder="patient@email.com" /></div>
                <div><label className="form-label">Date of Birth</label><input className="form-input" type="date" value={newPatient.dob} onChange={(e) => setNewPatient(p => ({ ...p, dob: e.target.value }))} /></div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Gender</label>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    {["MALE", "FEMALE", "OTHER"].map((g) => (
                      <label key={g} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                        <input type="radio" name="gender" value={g} checked={newPatient.gender === g} onChange={() => setNewPatient(p => ({ ...p, gender: g }))} style={{ accentColor: "var(--teal)" }} />
                        {g.charAt(0) + g.slice(1).toLowerCase()}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Appointment details */}
          <Section title="Appointment Details">
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div><label className="form-label">Purpose / Chief Complaint</label><input className="form-input" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Chest pain, routine checkup, follow-up…" /></div>
              <div><label className="form-label">Additional Notes</label><textarea className="form-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any relevant medical history or special requirements…" style={{ resize: "vertical" }} /></div>
            </div>
          </Section>

          <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>← Back</button>
            <button type="submit" className="btn-primary" disabled={submitting || (patientType === "EXISTING" && !selectedPatientId)} style={{ flex: 1, justifyContent: "center" }}>
              {submitting ? "Confirming booking…" : "✅ Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
