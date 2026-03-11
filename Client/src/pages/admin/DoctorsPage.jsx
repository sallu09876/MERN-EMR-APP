import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import { ErrorMessage } from "../../components/ErrorMessage";
import { Loader } from "../../components/Loader";

const EMPTY = { name: "", department: "", email: "", password: "", workingHoursStart: "09:00", workingHoursEnd: "17:00", slotDuration: 30, breakStart: "", breakEnd: "" };

const DEPTS = ["Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Dermatology", "Oncology", "Radiology", "General Medicine", "ENT", "Ophthalmology", "Psychiatry", "Gynecology", "Urology"];

export const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchDoctors = useCallback(async () => {
    setFetching(true);
    try {
      const { data } = await api.get("/api/doctors");
      setDoctors(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch doctors");
    } finally { setFetching(false); }
  }, []);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const resetForm = () => { setForm(EMPTY); setEditingId(null); setError(""); setShowForm(false); };

  const saveDoctor = async () => {
    setError(""); setLoading(true);
    try {
      const payload = { ...form, slotDuration: Number(form.slotDuration) };
      if (editingId) {
        const { email, password, ...upd } = payload;
        await api.put(`/api/doctors/${editingId}`, upd);
      } else {
        await api.post("/api/doctors", payload);
      }
      resetForm();
      fetchDoctors();
    } catch (err) {
      setError(err.response?.data?.message || "Save failed");
    } finally { setLoading(false); }
  };

  const deleteDoctor = async (id) => {
    if (!window.confirm("Delete this doctor and their login account?")) return;
    try { await api.delete(`/api/doctors/${id}`); fetchDoctors(); }
    catch (err) { setError(err.response?.data?.message || "Delete failed"); }
  };

  const editDoctor = (doc) => {
    setForm({ name: doc.name, department: doc.department, email: "", password: "", workingHoursStart: doc.workingHoursStart || "09:00", workingHoursEnd: doc.workingHoursEnd || "17:00", slotDuration: doc.slotDuration || 30, breakStart: doc.breakStart || "", breakEnd: doc.breakEnd || "" });
    setEditingId(doc._id); setError(""); setShowForm(true);
    setTimeout(() => document.getElementById("doctor-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const F = ({ label, children }) => (
    <div>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );

  return (
    <div>
      <style>{`
        .dp-cards { display: none; }
        @media (max-width: 767px) {
          .dp-header { flex-direction: column; align-items: stretch; gap: 1rem; }
          .dp-header .btn-primary { width: 100%; justify-content: center; min-height: 44px; }
          .dp-form-row { flex-direction: column; }
          .dp-form-grid { grid-template-columns: 1fr !important; }
          .dp-table-wrap { display: none !important; }
          .dp-cards { display: block !important; }
          .dp-card { background: white; border-radius: 14px; padding: 1rem; margin-bottom: 0.75rem; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
          .dp-card-actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap; }
          .dp-card-actions button { min-height: 44px; flex: 1; min-width: 0; -webkit-tap-highlight-color: transparent; }
        }
        @media (min-width: 768px) {
          .dp-cards { display: none !important; }
        }
      `}</style>
      <div className="dp-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem", animation: "fadeUp 0.4s ease", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(1.4rem, 4vw, 2rem)", color: "var(--navy)", margin: 0 }}>Manage Doctors</h1>
          <p style={{ color: "var(--text-muted)", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>{doctors.length} doctor{doctors.length !== 1 ? "s" : ""} registered</p>
        </div>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Doctor</button>
        )}
      </div>

      <ErrorMessage message={error} />

      {/* Form panel */}
      {showForm && (
        <div id="doctor-form" style={{
          background: "white", borderRadius: "16px", padding: "1.75rem",
          border: "2px solid var(--teal)", boxShadow: "0 0 0 4px var(--teal-glow)",
          marginBottom: "1.5rem", animation: "fadeUp 0.3s ease",
        }}>
          <div className="dp-form-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: "'DM Serif Display',serif", fontSize: "clamp(1.1rem, 3vw, 1.3rem)", color: "var(--navy)" }}>
                {editingId ? "Edit Doctor" : "Add New Doctor"}
              </h2>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {editingId ? "Update schedule and department details" : "Create a doctor account with login credentials"}
              </p>
            </div>
            <button onClick={resetForm} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.5rem", lineHeight: 1, padding: "0.25rem", minWidth: 44, minHeight: 44, WebkitTapHighlightColor: "transparent" }} aria-label="Close">×</button>
          </div>

          <div className="dp-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <F label="Full Name *">
              <input className="form-input" name="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Dr. John Smith" />
            </F>
            <F label="Department *">
              <select className="form-input" name="department" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                <option value="">Select department…</option>
                {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                <option value="__custom">Other…</option>
              </select>
            </F>
            {form.department === "__custom" && (
              <F label="Custom Department">
                <input className="form-input" placeholder="Enter department" onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
              </F>
            )}
            {!editingId && (
              <>
                <F label="Email (login) *">
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="doctor@hospital.com" />
                </F>
                <F label="Password *">
                  <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
                </F>
              </>
            )}
            <F label="Work Start">
              <input className="form-input" type="time" value={form.workingHoursStart} onChange={e => setForm(f => ({ ...f, workingHoursStart: e.target.value }))} />
            </F>
            <F label="Work End">
              <input className="form-input" type="time" value={form.workingHoursEnd} onChange={e => setForm(f => ({ ...f, workingHoursEnd: e.target.value }))} />
            </F>
            <F label="Slot Duration (min)">
              <input className="form-input" type="number" min={5} max={120} value={form.slotDuration} onChange={e => setForm(f => ({ ...f, slotDuration: e.target.value }))} />
            </F>
            <div />
            <F label="Break Start (optional)">
              <input className="form-input" type="time" value={form.breakStart} onChange={e => setForm(f => ({ ...f, breakStart: e.target.value }))} />
            </F>
            <F label="Break End (optional)">
              <input className="form-input" type="time" value={form.breakEnd} onChange={e => setForm(f => ({ ...f, breakEnd: e.target.value }))} />
            </F>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border)" }}>
            <button className="btn-primary" onClick={saveDoctor} disabled={loading}>
              {loading ? "Saving…" : editingId ? "Save Changes" : "Add Doctor"}
            </button>
            <button className="btn-secondary" onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      {fetching ? <Loader text="Loading doctors…" /> : (
        <div style={{ background: "white", borderRadius: "14px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)", overflow: "hidden", animation: "fadeUp 0.4s ease 0.1s both" }}>
          {doctors.length === 0 ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>👨‍⚕️</div>
              <p style={{ fontWeight: 500, margin: 0 }}>No doctors added yet</p>
              <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Click "Add Doctor" to get started</p>
            </div>
          ) : (
            <>
            {/* Mobile card layout */}
            <div className="dp-cards" style={{ padding: "0.75rem" }}>
              {doctors.map((doc) => (
                <div key={doc._id} className="dp-card">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, var(--teal) 0%, #0891b2 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.9rem", flexShrink: 0 }}>
                      {doc.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{doc.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{doc.department}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{doc.workingHoursStart} – {doc.workingHoursEnd} · {doc.slotDuration} min</div>
                    </div>
                  </div>
                  <div className="dp-card-actions">
                    <button className="btn-secondary btn-sm" onClick={() => editDoctor(doc)}>Edit</button>
                    <button className="btn-danger btn-sm" onClick={() => deleteDoctor(doc._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="dp-table-wrap" style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Department</th>
                    <th>Working Hours</th>
                    <th>Slot</th>
                    <th>Break</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doc, i) => (
                    <tr key={doc._id} style={{ animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{
                            width: "36px", height: "36px", borderRadius: "50%",
                            background: "linear-gradient(135deg, var(--teal) 0%, #0891b2 100%)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "white", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0,
                          }}>
                            {doc.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{doc.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{doc.userId?.email || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ background: "rgba(14,165,160,0.1)", color: "var(--teal)", padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 600 }}>
                          {doc.department}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                        {doc.workingHoursStart} – {doc.workingHoursEnd}
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                        {doc.slotDuration} min
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.83rem" }}>
                        {doc.breakStart ? `${doc.breakStart}–${doc.breakEnd}` : <span style={{ opacity: 0.5 }}>—</span>}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          <button className="btn-secondary btn-sm" onClick={() => editDoctor(doc)}>Edit</button>
                          <button className="btn-danger btn-sm" onClick={() => deleteDoctor(doc._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
