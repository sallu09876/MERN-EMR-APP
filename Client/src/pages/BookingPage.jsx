import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { ErrorMessage } from "../components/ErrorMessage";

export const BookingPage = () => {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const [patientType, setPatientType]           = useState("NEW");
  const [patientSearch, setPatientSearch]       = useState("");
  const [searchResults, setSearchResults]       = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [searching, setSearching]               = useState(false);
  const [newPatient, setNewPatient]             = useState({ name:"", mobile:"", email:"", dob:"", gender:"OTHER" });
  const [purpose, setPurpose]                   = useState("");
  const [notes, setNotes]                       = useState("");
  const [error, setError]                       = useState("");
  const [submitting, setSubmitting]             = useState(false);

  if (!state?.doctorId || !state?.date || !state?.slot) {
    return (
      <div style={{ textAlign:"center", padding:"4rem 1.5rem" }}>
        <div style={{ fontSize:"3rem" }}>⚠️</div>
        <p style={{ color:"var(--text-muted)", marginTop:"1rem" }}>No slot selected. Please go back to the scheduler.</p>
        <button className="btn-secondary" style={{ marginTop:"1rem" }} onClick={() => navigate("/scheduler")}>← Back to Scheduler</button>
      </div>
    );
  }

  const handleSearch = async () => {
    if (!patientSearch.trim()) return;
    setSearching(true);
    try {
      const { data } = await api.get("/api/patients/search", { params: { query: patientSearch } });
      setSearchResults(data.data || []);
    } catch { setError("Search failed"); }
    finally { setSearching(false); }
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
      setError(err.response?.data?.message || "Failed to book. The slot may have been taken.");
    } finally { setSubmitting(false); }
  };

  const SectionTitle = ({ title }) => (
    <div style={{ marginBottom:"0.875rem" }}>
      <h3 style={{ margin:0, fontSize:"0.78rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-muted)" }}>{title}</h3>
    </div>
  );

  return (
    <div style={{ animation:"fadeUp 0.4s ease", maxWidth:"680px" }}>
      <style>{`
        /* ── Slot summary bar ── */
        .bk-summary {
          background: linear-gradient(135deg, var(--navy) 0%, #1a3a6b 100%);
          border-radius: 14px;
          padding: 1rem 1.25rem;
          margin-bottom: 1.25rem;
          color: white;
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }
        @media (min-width: 500px) {
          .bk-summary {
            flex-direction: row;
            align-items: center;
            gap: 1.25rem;
            flex-wrap: wrap;
          }
        }
        .bk-summary-item {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }
        .bk-summary-icon {
          width: 36px; height: 36px;
          background: rgba(14,165,160,0.25);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
        }
        .bk-summary-label {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.07em;
          line-height: 1;
          margin-bottom: 0.2rem;
        }
        .bk-summary-val {
          font-weight: 600;
          font-size: 0.9rem;
          line-height: 1.2;
        }
        .bk-divider {
          width: 1px; height: 32px;
          background: rgba(255,255,255,0.1);
          display: none;
        }
        @media (min-width: 500px) { .bk-divider { display: block; } }

        /* ── Patient type toggle ── */
        .bk-type-row {
          display: flex;
          gap: 0.625rem;
          margin-bottom: 1.25rem;
        }
        .bk-type-btn {
          flex: 1;
          padding: 0.75rem 0.5rem;
          border-radius: 10px;
          cursor: pointer;
          border: 2px solid var(--border);
          background: var(--surface-2);
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 0.85rem;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.14s;
          -webkit-tap-highlight-color: transparent;
          white-space: nowrap;
        }
        .bk-type-btn.active {
          border-color: var(--teal);
          background: var(--teal-glow);
          color: var(--teal);
          font-weight: 700;
        }

        /* ── Patient fields grid: 1 col mobile, 2 col ≥500px ── */
        .bk-patient-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.875rem;
        }
        @media (min-width: 500px) {
          .bk-patient-grid { grid-template-columns: 1fr 1fr; }
          .bk-span2 { grid-column: 1 / -1; }
        }
        .bk-span2 { /* on mobile already full width, nothing needed */ }

        /* ── Search row ── */
        .bk-search-row {
          display: flex;
          gap: 0.625rem;
          margin-bottom: 0.875rem;
          flex-wrap: wrap;
        }
        .bk-search-row .form-input { flex: 1; min-width: 0; }
        .bk-search-row .btn-primary { flex-shrink: 0; white-space: nowrap; }

        /* ── Gender row ── */
        .bk-gender-row {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .bk-gender-label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        /* ── Action row ── */
        .bk-actions {
          display: flex;
          gap: 0.625rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
          flex-wrap: wrap;
        }
        .bk-back-btn { flex-shrink: 0; }
        .bk-confirm-btn {
          flex: 1;
          justify-content: center;
          min-width: 160px;
        }

        /* ── Page header ── */
        .bk-header { margin-bottom: 1.1rem; }
        .bk-header h1 {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(1.35rem, 5vw, 1.8rem);
          color: var(--navy); margin: 0;
        }
        .bk-header p { color: var(--text-muted); margin: 0.2rem 0 0; font-size: 0.85rem; }

        /* ── Section spacing ── */
        .bk-section { margin-bottom: 1.4rem; }
      `}</style>

      {/* Page header */}
      <div className="bk-header">
        <h1>Book Appointment</h1>
        <p>Complete the details below to confirm your booking</p>
      </div>

      {/* Slot summary */}
      <div className="bk-summary">
        <div className="bk-summary-item">
          <div className="bk-summary-icon">📅</div>
          <div>
            <div className="bk-summary-label">Date</div>
            <div className="bk-summary-val">
              {new Date(state.date).toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long" })}
            </div>
          </div>
        </div>
        <div className="bk-divider" />
        <div className="bk-summary-item">
          <div className="bk-summary-icon">🕐</div>
          <div>
            <div className="bk-summary-label">Time Slot</div>
            <div className="bk-summary-val">{state.slot.start} – {state.slot.end}</div>
          </div>
        </div>
      </div>

      <ErrorMessage message={error} />

      {/* Form */}
      <div style={{ background:"white", borderRadius:"14px", padding:"1.25rem", boxShadow:"var(--shadow-sm)", border:"1px solid var(--border)" }}>
        <form onSubmit={handleSubmit}>

          {/* Patient type */}
          <div className="bk-section">
            <SectionTitle title="Patient Type" />
            <div className="bk-type-row">
              {["NEW","EXISTING"].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`bk-type-btn${patientType === type ? " active" : ""}`}
                  onClick={() => setPatientType(type)}
                >
                  {type === "NEW" ? "🆕 New Patient" : "🔍 Existing Patient"}
                </button>
              ))}
            </div>
          </div>

          {/* Patient info */}
          {patientType === "EXISTING" ? (
            <div className="bk-section">
              <SectionTitle title="Search Patient" />
              <div className="bk-search-row">
                <input
                  className="form-input"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Name, mobile, or patient ID…"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                />
                <button type="button" className="btn-primary" onClick={handleSearch} disabled={searching}>
                  {searching ? "…" : "Search"}
                </button>
              </div>
              {searchResults.length > 0 && (
                <div style={{ border:"1px solid var(--border)", borderRadius:"10px", overflow:"hidden", maxHeight:"200px", overflowY:"auto" }}>
                  {searchResults.map((p) => (
                    <label key={p._id} style={{
                      display:"flex", alignItems:"center", gap:"0.75rem",
                      padding:"0.7rem 0.875rem", cursor:"pointer",
                      borderBottom:"1px solid var(--border)",
                      background: selectedPatientId === p._id ? "var(--teal-glow)" : "white",
                      transition:"background 0.13s"
                    }}>
                      <input type="radio" name="patient" value={p._id} checked={selectedPatientId === p._id} onChange={() => setSelectedPatientId(p._id)} style={{ accentColor:"var(--teal)", flexShrink:0 }} />
                      <div>
                        <div style={{ fontWeight:600, fontSize:"0.875rem" }}>{p.name}</div>
                        <div style={{ fontSize:"0.73rem", color:"var(--text-muted)" }}>{p.mobile} · ID: {p._id.slice(-6)}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {searchResults.length === 0 && patientSearch && !searching && (
                <p style={{ color:"var(--text-muted)", fontSize:"0.83rem", margin:"0.5rem 0 0" }}>No patients found. Try a different term.</p>
              )}
            </div>
          ) : (
            <div className="bk-section">
              <SectionTitle title="New Patient Details" />
              <div className="bk-patient-grid">
                <div>
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={newPatient.name} onChange={(e) => setNewPatient(p=>({...p,name:e.target.value}))} placeholder="John Smith" required />
                </div>
                <div>
                  <label className="form-label">Mobile *</label>
                  <input className="form-input" type="tel" inputMode="tel" value={newPatient.mobile} onChange={(e) => setNewPatient(p=>({...p,mobile:e.target.value}))} placeholder="+91 98765 43210" required />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" inputMode="email" autoCapitalize="none" value={newPatient.email} onChange={(e) => setNewPatient(p=>({...p,email:e.target.value}))} placeholder="patient@email.com" />
                </div>
                <div>
                  <label className="form-label">Date of Birth</label>
                  <input className="form-input" type="date" value={newPatient.dob} onChange={(e) => setNewPatient(p=>({...p,dob:e.target.value}))} />
                </div>
                <div className="bk-span2">
                  <label className="form-label">Gender</label>
                  <div className="bk-gender-row">
                    {["MALE","FEMALE","OTHER"].map((g) => (
                      <label key={g} className="bk-gender-label">
                        <input type="radio" name="gender" value={g} checked={newPatient.gender===g} onChange={() => setNewPatient(p=>({...p,gender:g}))} style={{ accentColor:"var(--teal)" }} />
                        {g.charAt(0)+g.slice(1).toLowerCase()}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appointment details */}
          <div className="bk-section">
            <SectionTitle title="Appointment Details" />
            <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
              <div>
                <label className="form-label">Purpose / Chief Complaint</label>
                <input className="form-input" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Chest pain, routine checkup, follow-up…" />
              </div>
              <div>
                <label className="form-label">Additional Notes</label>
                <textarea className="form-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any relevant medical history or special requirements…" style={{ resize:"vertical" }} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bk-actions">
            <button type="button" className="btn-secondary bk-back-btn" onClick={() => navigate(-1)}>← Back</button>
            <button
              type="submit"
              className="btn-primary bk-confirm-btn"
              disabled={submitting || (patientType==="EXISTING" && !selectedPatientId)}
            >
              {submitting ? "Confirming…" : "✅ Confirm Booking"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
