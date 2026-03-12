import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import { ErrorMessage } from "../../components/ErrorMessage";
import { Loader } from "../../components/Loader";

const EMPTY = { name: "", department: "", email: "", password: "", workingHoursStart: "09:00", workingHoursEnd: "17:00", slotDuration: 30, breakStart: "", breakEnd: "" };

export const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Departments
  const [depts, setDepts] = useState([]);
  const [deptsLoading, setDeptsLoading] = useState(true);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDeptInput, setNewDeptInput] = useState("");
  const [deptError, setDeptError] = useState("");
  const [deptSaving, setDeptSaving] = useState(false);
  const [deptDeleting, setDeptDeleting] = useState("");

  // ── Fetch departments from DB ──
  const fetchDepts = useCallback(async () => {
    setDeptsLoading(true);
    try {
      const { data } = await api.get("/api/departments");
      setDepts(data.data || []);
    } catch {
      // silently fail — form still works without dept list
    } finally { setDeptsLoading(false); }
  }, []);

  useEffect(() => { fetchDepts(); }, [fetchDepts]);

  // ── Add department ──
  const addDept = async () => {
    const val = newDeptInput.trim();
    if (!val) { setDeptError("Please enter a department name."); return; }
    setDeptSaving(true); setDeptError("");
    try {
      const { data } = await api.post("/api/departments", { name: val });
      setDepts(prev => [...prev, data.data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewDeptInput("");
    } catch (err) {
      setDeptError(err.response?.data?.message || "Failed to add department");
    } finally { setDeptSaving(false); }
  };

  // ── Delete department ──
  const removeDept = async (dept) => {
    if (!window.confirm(`Remove "${dept.name}" from departments?`)) return;
    setDeptDeleting(dept._id);
    try {
      await api.delete(`/api/departments/${dept._id}`);
      setDepts(prev => prev.filter(d => d._id !== dept._id));
      if (form.department === dept.name) setForm(f => ({ ...f, department: "" }));
    } catch (err) {
      setDeptError(err.response?.data?.message || "Failed to remove department");
    } finally { setDeptDeleting(""); }
  };

  // ── Doctors CRUD ──
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
      resetForm(); fetchDoctors();
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
    <div><label className="form-label">{label}</label>{children}</div>
  );

  return (
    <div>
      <style>{`
        /* ── Department Modal ── */
        .dm-overlay {
          position:fixed; inset:0; z-index:1000;
          background:rgba(10,22,40,0.55);
          display:flex; align-items:center; justify-content:center;
          padding:1rem; animation:dmFadeIn 0.18s ease;
        }
        @keyframes dmFadeIn { from{opacity:0} to{opacity:1} }
        .dm-modal {
          background:white; border-radius:20px;
          width:100%; max-width:480px;
          box-shadow:0 24px 64px rgba(10,22,40,0.25);
          animation:dmSlideUp 0.22s ease; overflow:hidden;
        }
        @keyframes dmSlideUp { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
        .dm-header {
          padding:1.25rem 1.5rem;
          border-bottom:1px solid var(--border);
          display:flex; align-items:center; justify-content:space-between;
          background:linear-gradient(135deg, var(--navy) 0%, #1a3a6b 100%);
        }
        .dm-header h2 { margin:0; font-family:'DM Serif Display',serif; font-size:1.2rem; color:white; }
        .dm-header p  { margin:0.2rem 0 0; font-size:0.75rem; color:rgba(255,255,255,0.55); }
        .dm-close {
          background:rgba(255,255,255,0.12); border:none; color:white;
          width:32px; height:32px; border-radius:50%; cursor:pointer;
          font-size:1.1rem; display:flex; align-items:center; justify-content:center;
          flex-shrink:0; transition:background 0.15s; -webkit-tap-highlight-color:transparent;
        }
        .dm-close:hover { background:rgba(255,255,255,0.22); }
        .dm-body { padding:1.25rem 1.5rem; max-height:55vh; overflow-y:auto; }
        .dm-add-row { display:flex; gap:0.5rem; margin-bottom:0.5rem; }
        .dm-add-row input { flex:1; min-width:0; }
        .dm-add-btn {
          background:linear-gradient(135deg, var(--teal), #0891b2);
          color:white; border:none; border-radius:9px;
          padding:0 1rem; cursor:pointer; font-weight:600; font-size:0.85rem;
          white-space:nowrap; min-height:42px; min-width:72px;
          transition:opacity 0.15s; -webkit-tap-highlight-color:transparent;
          font-family:'DM Sans',sans-serif; display:flex; align-items:center; justify-content:center;
        }
        .dm-add-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .dm-add-btn:hover:not(:disabled) { opacity:0.88; }
        .dm-error { color:#ef4444; font-size:0.78rem; margin:0.3rem 0 0.75rem; }
        .dm-dept-list { display:flex; flex-direction:column; gap:0.4rem; margin-top:0.75rem; }
        .dm-dept-item {
          display:flex; align-items:center; justify-content:space-between;
          padding:0.6rem 0.875rem; border-radius:9px;
          background:var(--surface-2); border:1px solid var(--border);
          transition:background 0.13s;
        }
        .dm-dept-item:hover { background:var(--surface-3); }
        .dm-dept-name { font-size:0.875rem; font-weight:500; color:var(--navy); }
        .dm-dept-tag {
          font-size:0.65rem; font-weight:600; padding:0.15rem 0.45rem;
          border-radius:999px; margin-left:0.5rem;
          background:rgba(14,165,160,0.1); color:var(--teal);
        }
        .dm-remove-btn {
          background:none; border:none; color:#ef4444; cursor:pointer;
          font-size:1.1rem; line-height:1; padding:0.25rem 0.5rem;
          border-radius:6px; transition:background 0.13s;
          -webkit-tap-highlight-color:transparent; min-width:32px; min-height:32px;
          display:flex; align-items:center; justify-content:center;
        }
        .dm-remove-btn:hover:not(:disabled) { background:#fef2f2; }
        .dm-remove-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .dm-footer {
          padding:1rem 1.5rem; border-top:1px solid var(--border);
          background:var(--surface-2);
          display:flex; align-items:center; justify-content:space-between;
        }
        .dm-count { font-size:0.78rem; color:var(--text-muted); }

        /* ── Dept selector row ── */
        .dept-row { display:flex; gap:0.5rem; align-items:center; }
        .dept-row select { flex:1; min-width:0; }
        .dept-manage-btn {
          height:42px; padding:0 0.875rem;
          background:linear-gradient(135deg,#8b5cf6,#7c3aed);
          color:white; border:none; border-radius:9px;
          cursor:pointer; font-size:0.78rem; font-weight:700;
          white-space:nowrap; transition:opacity 0.15s;
          -webkit-tap-highlight-color:transparent;
          font-family:'DM Sans',sans-serif;
          display:flex; align-items:center; gap:0.3rem; flex-shrink:0;
        }
        .dept-manage-btn:hover { opacity:0.88; }

        /* ── Mobile ── */
        .dp-cards { display:none; }
        @media (max-width:767px) {
          .dp-header { flex-direction:column; align-items:stretch; gap:1rem; }
          .dp-header .btn-primary { width:100%; justify-content:center; min-height:44px; }
          .dp-form-grid { grid-template-columns:1fr !important; }
          .dp-table-wrap { display:none !important; }
          .dp-cards { display:block !important; }
          .dp-card { background:white; border-radius:14px; padding:1rem; margin-bottom:0.75rem; border:1px solid var(--border); box-shadow:var(--shadow-sm); }
          .dp-card-actions { display:flex; gap:0.5rem; margin-top:0.75rem; }
          .dp-card-actions button { min-height:44px; flex:1; -webkit-tap-highlight-color:transparent; }
        }
        @media (min-width:768px) { .dp-cards { display:none !important; } }
      `}</style>

      {/* ── Department Modal ── */}
      {showDeptModal && (
        <div className="dm-overlay" onClick={e => e.target === e.currentTarget && setShowDeptModal(false)}>
          <div className="dm-modal">
            <div className="dm-header">
              <div>
                <h2>Manage Departments</h2>
                <p>Departments are saved permanently to the database</p>
              </div>
              <button className="dm-close" onClick={() => { setShowDeptModal(false); setNewDeptInput(""); setDeptError(""); }}>×</button>
            </div>

            <div className="dm-body">
              {/* Add row */}
              <div className="dm-add-row">
                <input
                  className="form-input"
                  value={newDeptInput}
                  onChange={e => { setNewDeptInput(e.target.value); setDeptError(""); }}
                  onKeyDown={e => e.key === "Enter" && addDept()}
                  placeholder="e.g. Hematology, Sports Medicine…"
                  disabled={deptSaving}
                />
                <button className="dm-add-btn" onClick={addDept} disabled={deptSaving}>
                  {deptSaving ? "…" : "+ Add"}
                </button>
              </div>
              {deptError && <p className="dm-error">⚠ {deptError}</p>}

              {/* List */}
              {deptsLoading ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "1rem 0" }}>Loading…</p>
              ) : (
                <div className="dm-dept-list">
                  {depts.map(dept => (
                    <div key={dept._id} className="dm-dept-item">
                      <span className="dm-dept-name">
                        {dept.name}
                        {dept.isDefault && <span className="dm-dept-tag">default</span>}
                      </span>
                      <button
                        className="dm-remove-btn"
                        onClick={() => removeDept(dept)}
                        disabled={deptDeleting === dept._id}
                        title={`Remove ${dept.name}`}
                      >
                        {deptDeleting === dept._id ? "…" : "×"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="dm-footer">
              <span className="dm-count">{depts.length} department{depts.length !== 1 ? "s" : ""} in database</span>
              <button className="btn-secondary btn-sm" onClick={() => { setShowDeptModal(false); setNewDeptInput(""); setDeptError(""); }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="dp-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem", animation: "fadeUp 0.4s ease", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(1.4rem,4vw,2rem)", color: "var(--navy)", margin: 0 }}>Manage Doctors</h1>
          <p style={{ color: "var(--text-muted)", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>{doctors.length} doctor{doctors.length !== 1 ? "s" : ""} registered</p>
        </div>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Doctor</button>
        )}
      </div>

      <ErrorMessage message={error} />

      {/* ── Form Panel ── */}
      {showForm && (
        <div id="doctor-form" style={{ background: "white", borderRadius: "16px", padding: "1.75rem", border: "2px solid var(--teal)", boxShadow: "0 0 0 4px var(--teal-glow)", marginBottom: "1.5rem", animation: "fadeUp 0.3s ease" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: "'DM Serif Display',serif", fontSize: "clamp(1.1rem,3vw,1.3rem)", color: "var(--navy)" }}>
                {editingId ? "Edit Doctor" : "Add New Doctor"}
              </h2>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {editingId ? "Update schedule and department details" : "Create a doctor account with login credentials"}
              </p>
            </div>
            <button onClick={resetForm} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.5rem", lineHeight: 1, padding: "0.25rem", minWidth: 44, minHeight: 44, WebkitTapHighlightColor: "transparent" }}>×</button>
          </div>

          <div className="dp-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <F label="Full Name *">
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Dr. John Smith" />
            </F>

            {/* Department + Manage button */}
            <div>
              <label className="form-label">Department *</label>
              <div className="dept-row">
                <select
                  className="form-input"
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  disabled={deptsLoading}
                >
                  <option value="">{deptsLoading ? "Loading…" : "Select department…"}</option>
                  {depts.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                </select>
                <button
                  type="button"
                  className="dept-manage-btn"
                  onClick={() => setShowDeptModal(true)}
                  title="Add or remove departments"
                >
                  <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span>
                  <span>Dept</span>
                </button>
              </div>
            </div>

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

      {/* ── List ── */}
      {fetching ? <Loader text="Loading doctors…" /> : (
        <div style={{ background: "white", borderRadius: "14px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)", overflow: "hidden", animation: "fadeUp 0.4s ease 0.1s both" }}>
          {doctors.length === 0 ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>👨‍⚕️</div>
              <p style={{ fontWeight: 500, margin: 0 }}>No doctors added yet</p>
              <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Click "+ Add Doctor" to get started</p>
            </div>
          ) : (<>
            {/* Mobile cards */}
            <div className="dp-cards" style={{ padding: "0.75rem" }}>
              {doctors.map(doc => (
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
                    <th>Doctor</th><th>Department</th><th>Working Hours</th><th>Slot</th><th>Break</th><th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doc, i) => (
                    <tr key={doc._id} style={{ animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, var(--teal) 0%, #0891b2 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0 }}>
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
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>{doc.workingHoursStart} – {doc.workingHoursEnd}</td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>{doc.slotDuration} min</td>
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
          </>)}
        </div>
      )}
    </div>
  );
};
