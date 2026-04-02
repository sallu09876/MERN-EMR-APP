import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { ErrorMessage } from "../../components/ErrorMessage";
import { Loader } from "../../components/Loader";
import { toastError, toastSuccess } from "../../utils/toast.js";

const avatarUrlFor = (patient) => {
  const name = patient?.name || "Patient";
  return patient?.profilePhoto
    ? patient.profilePhoto
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8b5cf6&color=fff&size=128`;
};

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
};

const fmtTime = (t) => (t ? String(t) : "—");

export const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("ALL"); // ALL | VERIFIED | UNVERIFIED

  const [viewingId, setViewingId] = useState("");
  const [viewing, setViewing] = useState(null);
  const [viewingLoading, setViewingLoading] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/admin/patients", {
        params: { page: 1, limit: 1000 },
      });

      setPatients(data?.data || []);
      setTotal(data?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();

    return patients.filter((p) => {
      const isVerified = !!p.isVerified;
      if (verifiedFilter === "VERIFIED" && !isVerified) return false;
      if (verifiedFilter === "UNVERIFIED" && isVerified) return false;

      if (!q) return true;
      const email = p?.userId?.email || p?.email || "";
      const name = p?.name || "";

      return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
    });
  }, [patients, search, verifiedFilter]);

  const openViewModal = async (patientId) => {
    setViewingId(patientId);
    setViewing(null);
    setViewingLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/api/admin/patients/${patientId}`);
      setViewing(data?.data || null);
    } catch (err) {
      toastError(err.response?.data?.message || "Failed to load patient");
      closeModal();
    } finally {
      setViewingLoading(false);
    }
  };

  const closeModal = () => {
    setViewingId("");
    setViewing(null);
    setViewingLoading(false);
  };

  const deletePatient = async (id) => {
    if (!window.confirm("Delete this patient and their login account? This cannot be undone.")) return;

    try {
      await api.delete(`/api/admin/patients/${id}`);
      setPatients((prev) => prev.filter((p) => String(p._id) !== String(id)));
      toastSuccess("Patient account deleted");
    } catch (err) {
      toastError(err.response?.data?.message || "Failed to delete patient");
    }
  };

  return (
    <div>
      <style>{`
        /* ── Modal ── */
        .pp-overlay{
          position:fixed; inset:0; z-index:1100;
          background:rgba(10,22,40,0.55);
          display:flex; align-items:center; justify-content:center;
          padding:1rem;
          animation:dmFadeIn 0.18s ease;
        }
        @keyframes dmFadeIn { from{opacity:0} to{opacity:1} }
        .pp-modal{
          background:white; border-radius:20px;
          width:100%; max-width:860px;
          box-shadow:0 24px 64px rgba(10,22,40,0.25);
          animation:dmSlideUp 0.22s ease; overflow:hidden;
          max-height:86vh; display:flex; flex-direction:column;
        }
        @keyframes dmSlideUp { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
        .pp-modal-header{
          padding:1.25rem 1.5rem;
          border-bottom:1px solid var(--border);
          display:flex; align-items:flex-start; justify-content:space-between;
          background:linear-gradient(135deg, var(--navy) 0%, #1a3a6b 100%);
        }
        .pp-modal-header h2{ margin:0; font-family:'DM Serif Display',serif; font-size:1.15rem; color:white; }
        .pp-modal-header p{ margin:0.2rem 0 0; font-size:0.75rem; color:rgba(255,255,255,0.6); }
        .pp-close{
          background:rgba(255,255,255,0.12); border:none; color:white;
          width:32px; height:32px; border-radius:50%;
          cursor:pointer; font-size:1.1rem;
          display:flex; align-items:center; justify-content:center;
          transition:background 0.15s; -webkit-tap-highlight-color:transparent;
          flex-shrink:0;
        }
        .pp-close:hover{ background:rgba(255,255,255,0.22); }
        .pp-modal-body{ padding:1.25rem 1.5rem; overflow:auto; }

        /* ── Mobile ↔ Desktop ── */
        .pp-cards{ display:none; }
        @media (max-width:767px){
          .pp-header{ flex-direction:column; align-items:stretch !important; }
          .pp-filters{ flex-direction:column; align-items:stretch !important; }
          .pp-filters .pp-search{ width:100%; }
          .pp-table-wrap{ display:none !important; }
          .pp-cards{ display:block !important; }

          .pp-card{
            background:white; border-radius:14px; padding:1rem;
            margin-bottom:0.75rem; border:1px solid var(--border);
            box-shadow:var(--shadow-sm);
          }
          .pp-card-actions{ display:flex; gap:0.5rem; margin-top:0.75rem; }
          .pp-card-actions button{ flex:1; min-height:44px; -webkit-tap-highlight-color:transparent; }
        }
        @media (min-width:768px){
          .pp-cards{ display:none !important; }
        }

        /* ── Badge styles ── */
        .pp-badge{
          display:inline-flex; align-items:center;
          font-size:0.7rem; font-weight:700; letter-spacing:0.05em; text-transform:uppercase;
          padding:0.25rem 0.75rem; border-radius:999px;
          border:1px solid transparent;
          white-space:nowrap;
        }
      `}</style>

      <div style={{ marginBottom: "1.75rem", animation: "fadeUp 0.3s ease" }}>
        <div className="pp-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(1.4rem,4vw,2rem)", color: "var(--navy)", margin: 0 }}>
              Manage Patients
            </h1>
            <p style={{ color: "var(--text-muted)", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
              {total} patient{total !== 1 ? "s" : ""} registered
            </p>
          </div>

          <div className="pp-filters" style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <div className="pp-search" style={{ flex: "1 1 220px", minWidth: 0 }}>
              <label className="form-label" style={{ marginBottom: "0.35rem" }}>Search</label>
              <input
                className="form-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
              />
            </div>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {[
                  { key: "ALL", label: "All" },
                  { key: "VERIFIED", label: "Verified" },
                  { key: "UNVERIFIED", label: "Unverified" },
                ].map((b) => (
                  <button
                    key={b.key}
                    className="btn-secondary btn-sm"
                    onClick={() => setVerifiedFilter(b.key)}
                    style={{
                      borderColor: verifiedFilter === b.key ? "var(--teal)" : "var(--border)",
                      color: verifiedFilter === b.key ? "var(--teal)" : "var(--text-primary)",
                      background: verifiedFilter === b.key ? "var(--teal-glow)" : "white",
                      boxShadow: verifiedFilter === b.key ? "0 0 0 3px rgba(14,165,160,0.15)" : "none",
                    }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ErrorMessage message={error} />

      {loading ? (
        <Loader text="Loading patients…" />
      ) : (
        <div style={{ background: "white", borderRadius: "14px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)", overflow: "hidden", animation: "fadeUp 0.4s ease 0.1s both" }}>
          {filteredPatients.length === 0 ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>👥</div>
              <p style={{ fontWeight: 500, margin: 0 }}>No patients match your filters</p>
              <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Try adjusting search or verification status</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="pp-cards" style={{ padding: "0.75rem" }}>
                {filteredPatients.map((p, i) => {
                  const email = p?.userId?.email || p?.email || "—";
                  return (
                    <div key={p._id} className="pp-card" style={{ animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                        <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(14,165,160,0.15) 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                          {/* profile photo */}
                          {/* eslint-disable-next-line jsx-a11y/alt-text */}
                          <img src={avatarUrlFor(p)} style={{ width: "44px", height: "44px", objectFit: "cover" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{p.name}</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>

                          <div style={{ marginTop: "0.4rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {p.gender || "—"} · {p.age ?? "—"} · {p.bloodGroup || "—"}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
                        <span
                          className="pp-badge"
                          style={{
                            background: p.isVerified ? "rgba(16,185,129,0.1)" : "rgba(220,38,38,0.1)",
                            color: p.isVerified ? "#065f46" : "#b91c1c",
                            borderColor: p.isVerified ? "rgba(16,185,129,0.25)" : "rgba(220,38,38,0.25)",
                          }}
                        >
                          {p.isVerified ? "Verified" : "Unverified"}
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
                          {p.appointmentCount ?? 0} appointment{(p.appointmentCount ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="pp-card-actions">
                        <button className="btn-secondary btn-sm" onClick={() => openViewModal(p._id)}>
                          View
                        </button>
                        <button className="btn-danger btn-sm" onClick={() => deletePatient(p._id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="pp-table-wrap" style={{ overflowX: "auto", padding: "0.25rem" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Age / Gender</th>
                      <th>Blood Group</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Appointments</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((p, i) => {
                      const email = p?.userId?.email || p?.email || "—";
                      return (
                        <tr key={p._id} style={{ animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <div style={{ width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", background: "var(--surface-2)", flexShrink: 0 }}>
                                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                                <img src={avatarUrlFor(p)} style={{ width: "36px", height: "36px", objectFit: "cover" }} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{p.name}</div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ color: "var(--text-secondary)", fontSize: "0.875rem", whiteSpace: "nowrap" }}>
                            {p.age ?? "—"}<span style={{ opacity: 0.5 }}> / </span>{p.gender || "—"}
                          </td>
                          <td>
                            <span style={{ background: "rgba(139,92,246,0.1)", color: "#7c3aed", padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700 }}>
                              {p.bloodGroup || "—"}
                            </span>
                          </td>
                          <td style={{ color: "var(--text-secondary)", fontSize: "0.875rem", whiteSpace: "nowrap" }}>
                            {p.mobile || "—"}
                          </td>
                          <td>
                            <span
                              className="pp-badge"
                              style={{
                                background: p.isVerified ? "rgba(16,185,129,0.1)" : "rgba(220,38,38,0.1)",
                                color: p.isVerified ? "#065f46" : "#b91c1c",
                                borderColor: p.isVerified ? "rgba(16,185,129,0.25)" : "rgba(220,38,38,0.25)",
                              }}
                            >
                              {p.isVerified ? "Verified" : "Unverified"}
                            </span>
                          </td>
                          <td style={{ color: "var(--text-muted)", fontWeight: 700 }}>
                            {p.appointmentCount ?? 0}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                              <button className="btn-secondary btn-sm" onClick={() => openViewModal(p._id)}>
                                View
                              </button>
                              <button className="btn-danger btn-sm" onClick={() => deletePatient(p._id)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* View Patient Modal */}
      {!!viewingId && (
        <div
          className="pp-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="pp-modal">
            <div className="pp-modal-header">
              <div>
                <h2>{viewing?.name || "Patient"}</h2>
                <p>{(viewing?.userId?.email || viewing?.email) || ""}</p>
              </div>
              <button className="pp-close" onClick={closeModal} aria-label="Close modal">×</button>
            </div>

            <div className="pp-modal-body">
              {viewingLoading || !viewing ? (
                <Loader text="Loading profile…" />
              ) : (
                <>
                  <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {/* eslint-disable-next-line jsx-a11y/alt-text */}
                      <img src={avatarUrlFor(viewing)} alt={`${viewing?.name || "Patient"} profile`} style={{ width: "80px", height: "80px", objectFit: "cover" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div style={{ fontWeight: 800, fontSize: "1.15rem", color: "var(--navy)" }}>{viewing.name}</div>
                      <div style={{ color: "var(--text-muted)", marginTop: "0.2rem", fontSize: "0.9rem" }}>
                        {viewing?.userId?.email || viewing?.email || "—"}
                      </div>
                      <div style={{ marginTop: "0.8rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span
                          className="pp-badge"
                          style={{
                            background: viewing.isVerified ? "rgba(16,185,129,0.1)" : "rgba(220,38,38,0.1)",
                            color: viewing.isVerified ? "#065f46" : "#b91c1c",
                            borderColor: viewing.isVerified ? "rgba(16,185,129,0.25)" : "rgba(220,38,38,0.25)",
                          }}
                        >
                          {viewing.isVerified ? "Verified" : "Unverified"}
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700 }}>
                          {(viewing.appointments || []).length} appointment{(viewing.appointments || []).length !== 1 ? "s" : ""} shown
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ height: "1px", background: "var(--border)", margin: "1.25rem 0" }} />

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                    <div>
                      <div className="form-label">Age</div>
                      <div style={{ color: "var(--text-secondary)", fontWeight: 700 }}>{viewing.age ?? "—"}</div>
                    </div>
                    <div>
                      <div className="form-label">Gender</div>
                      <div style={{ color: "var(--text-secondary)", fontWeight: 700 }}>{viewing.gender || "—"}</div>
                    </div>
                    <div>
                      <div className="form-label">Blood Group</div>
                      <div style={{ color: "var(--text-secondary)", fontWeight: 700 }}>{viewing.bloodGroup || "—"}</div>
                    </div>
                    <div>
                      <div className="form-label">Phone</div>
                      <div style={{ color: "var(--text-secondary)", fontWeight: 700 }}>{viewing.mobile || "—"}</div>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div className="form-label">Address</div>
                      <div style={{ color: "var(--text-secondary)", fontWeight: 700 }}>{viewing.address || "—"}</div>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div className="form-label">Medical History</div>
                      <div style={{ color: "var(--text-secondary)", fontWeight: 700 }}>{viewing.medicalHistory || "—"}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "0.75rem" }}>
                      <div>
                        <div style={{ fontFamily: "'DM Serif Display',serif", color: "var(--navy)", fontSize: "1.05rem", fontWeight: 700 }}>
                          Last 5 Appointments
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                          Latest schedule on record
                        </div>
                      </div>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Doctor</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Status</th>
                            <th>Payment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(viewing.appointments || []).map((a, idx) => (
                            <tr key={`${a._id || idx}`} style={{ animation: `fadeUp 0.3s ease ${idx * 0.03}s both` }}>
                              <td>{a.doctorId?.name || "—"}</td>
                              <td style={{ color: "var(--text-secondary)" }}>{fmtDate(a.appointmentDate)}</td>
                              <td style={{ color: "var(--text-secondary)" }}>{fmtTime(a.slotStartTime)}</td>
                              <td>
                                <span
                                  className="pp-badge"
                                  style={{
                                    background: a.status === "CANCELLED" ? "rgba(220,38,38,0.1)" : "rgba(14,165,160,0.1)",
                                    color: a.status === "CANCELLED" ? "#b91c1c" : "var(--teal)",
                                    borderColor: a.status === "CANCELLED" ? "rgba(220,38,38,0.25)" : "rgba(14,165,160,0.25)",
                                  }}
                                >
                                  {a.status || "—"}
                                </span>
                              </td>
                              <td>
                                <span
                                  className="pp-badge"
                                  style={{
                                    background: a.paymentStatus === "PAID" ? "rgba(16,185,129,0.1)" : "rgba(59,130,246,0.08)",
                                    color: a.paymentStatus === "PAID" ? "#065f46" : "#1d4ed8",
                                    borderColor: a.paymentStatus === "PAID" ? "rgba(16,185,129,0.25)" : "rgba(59,130,246,0.25)",
                                  }}
                                >
                                  {a.paymentStatus === "PAID" ? "Paid" : "Unpaid"}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {(viewing.appointments || []).length === 0 && (
                            <tr>
                              <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2.25rem 1rem" }}>
                                No appointments found for this patient
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

