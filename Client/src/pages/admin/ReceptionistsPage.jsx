import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import { ErrorMessage } from "../../components/ErrorMessage";
import { Loader } from "../../components/Loader";

const EMPTY = { name:"", email:"", password:"" };

export const ReceptionistsPage = () => {
  const [receptionists, setReceptionists] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchAll = useCallback(async () => {
    setFetching(true);
    try {
      const { data } = await api.get("/api/admin/receptionists");
      setReceptionists(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch");
    } finally { setFetching(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const resetForm = () => { setForm(EMPTY); setEditingId(null); setError(""); setShowForm(false); };

  const save = async () => {
    setError(""); setLoading(true);
    try {
      if (editingId) {
        await api.put(`/api/admin/receptionists/${editingId}`, { name:form.name, email:form.email });
      } else {
        await api.post("/api/admin/receptionists", form);
      }
      resetForm(); fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Save failed");
    } finally { setLoading(false); }
  };

  const deleteRec = async (id) => {
    if (!window.confirm("Delete this receptionist?")) return;
    try { await api.delete(`/api/admin/receptionists/${id}`); fetchAll(); }
    catch (err) { setError(err.response?.data?.message || "Delete failed"); }
  };

  const editRec = (rec) => {
    setForm({ name:rec.name, email:rec.email, password:"" });
    setEditingId(rec._id); setError(""); setShowForm(true);
    setTimeout(() => document.getElementById("rec-form")?.scrollIntoView({ behavior:"smooth", block:"start" }), 100);
  };

  const F = ({ label, children }) => (
    <div><label className="form-label">{label}</label>{children}</div>
  );

  // Avatar initials color from name
  const avatarColor = (name) => {
    const colors = ["#0ea5a0","#8b5cf6","#f0a500","#10b981","#3b82f6","#ef4444"];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  };

  return (
    <div>
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"1.75rem",animation:"fadeUp 0.4s ease" }}>
        <div>
          <h1 style={{ fontFamily:"'DM Serif Display',serif",fontSize:"2rem",color:"var(--navy)",margin:0 }}>Receptionists</h1>
          <p style={{ color:"var(--text-muted)",margin:"0.25rem 0 0",fontSize:"0.875rem" }}>{receptionists.length} staff member{receptionists.length!==1?"s":""}</p>
        </div>
        {!showForm && (
          <button className="btn-primary" onClick={()=>setShowForm(true)}>+ Add Receptionist</button>
        )}
      </div>

      <ErrorMessage message={error} />

      {showForm && (
        <div id="rec-form" style={{
          background:"white", borderRadius:"16px", padding:"1.75rem",
          border:"2px solid #8b5cf6", boxShadow:"0 0 0 4px rgba(139,92,246,0.1)",
          marginBottom:"1.5rem", animation:"fadeUp 0.3s ease",
        }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem" }}>
            <div>
              <h2 style={{ margin:0,fontFamily:"'DM Serif Display',serif",fontSize:"1.3rem",color:"var(--navy)" }}>
                {editingId ? "Edit Receptionist" : "Add New Receptionist"}
              </h2>
              <p style={{ margin:"0.25rem 0 0",fontSize:"0.8rem",color:"var(--text-muted)" }}>
                {editingId ? "Update name or email" : "Create login credentials for the new staff member"}
              </p>
            </div>
            <button onClick={resetForm} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:"1.5rem",lineHeight:1 }}>×</button>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:"1rem" }}>
            <F label="Full Name *">
              <input className="form-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Jane Doe" />
            </F>
            <F label="Email (login) *">
              <input className="form-input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="jane@hospital.com" />
            </F>
            {!editingId && (
              <F label="Password *">
                <input className="form-input" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Min 6 characters" />
              </F>
            )}
          </div>
          <div style={{ display:"flex",gap:"0.75rem",marginTop:"1.5rem",paddingTop:"1.25rem",borderTop:"1px solid var(--border)" }}>
            <button className="btn-primary" style={{ background:"linear-gradient(135deg,#8b5cf6,#7c3aed)",boxShadow:"0 2px 8px rgba(139,92,246,0.35)" }} onClick={save} disabled={loading}>
              {loading ? "Saving…" : editingId ? "Save Changes" : "Add Receptionist"}
            </button>
            <button className="btn-secondary" onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}

      {fetching ? <Loader text="Loading staff…" /> : (
        <div style={{ background:"white",borderRadius:"14px",boxShadow:"var(--shadow-sm)",border:"1px solid var(--border)",overflow:"hidden",animation:"fadeUp 0.4s ease 0.1s both" }}>
          {receptionists.length === 0 ? (
            <div style={{ padding:"4rem",textAlign:"center",color:"var(--text-muted)" }}>
              <div style={{ fontSize:"3rem",marginBottom:"0.75rem" }}>🗂️</div>
              <p style={{ fontWeight:500,margin:0 }}>No receptionists yet</p>
              <p style={{ fontSize:"0.8rem",marginTop:"0.25rem" }}>Click "Add Receptionist" to get started</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th style={{ textAlign:"right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {receptionists.map((rec, i) => (
                  <tr key={rec._id} style={{ animation:`fadeUp 0.3s ease ${i*0.04}s both` }}>
                    <td>
                      <div style={{ display:"flex",alignItems:"center",gap:"0.75rem" }}>
                        <div style={{
                          width:"36px",height:"36px",borderRadius:"50%",
                          background:`linear-gradient(135deg, ${avatarColor(rec.name)}, ${avatarColor(rec.name)}cc)`,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          color:"white",fontWeight:700,fontSize:"0.8rem",flexShrink:0,
                        }}>
                          {rec.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight:600,fontSize:"0.9rem" }}>{rec.name}</span>
                      </div>
                    </td>
                    <td style={{ color:"var(--text-secondary)",fontSize:"0.875rem" }}>{rec.email}</td>
                    <td>
                      <span style={{ background:"rgba(139,92,246,0.1)",color:"#7c3aed",padding:"0.25rem 0.75rem",borderRadius:"999px",fontSize:"0.78rem",fontWeight:600 }}>
                        Receptionist
                      </span>
                    </td>
                    <td>
                      <div style={{ display:"flex",gap:"0.5rem",justifyContent:"flex-end" }}>
                        <button className="btn-secondary btn-sm" onClick={()=>editRec(rec)}>Edit</button>
                        <button className="btn-danger btn-sm" onClick={()=>deleteRec(rec._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
