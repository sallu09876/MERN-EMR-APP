import React, { useEffect, useState, useCallback, useMemo } from "react";
import api from "../services/api.js";
import { useDoctors } from "../hooks/useDoctors";
import { SlotGrid } from "../components/SlotGrid.jsx";
import { Loader } from "../components/Loader.jsx";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { formatDateForInput } from "../utils/formatTime.js";
import { useNavigate } from "react-router-dom";

export const SchedulerPage = () => {
  const { doctors, departments } = useDoctors();
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const today = formatDateForInput(new Date());
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const filteredDoctors = useMemo(
    () => !departmentFilter ? doctors : doctors.filter((d) => d.department === departmentFilter),
    [doctors, departmentFilter]
  );

  useEffect(() => { setDoctorId(""); setSlots([]); setSelectedSlot(null); }, [departmentFilter]);

  const loadSlots = useCallback(async () => {
    if (!doctorId || !date) return;
    setLoading(true); setError(""); setSelectedSlot(null);
    try {
      const { data } = await api.get("/api/slots", { params: { doctorId, date } });
      setSlots(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load slots");
    } finally { setLoading(false); }
  }, [doctorId, date]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const selectedDoctor  = doctors.find((d) => d._id === doctorId);
  const availableCount  = slots.filter((s) => s.status === "AVAILABLE").length;

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <style>{`
        /* ── Filter panel grid ── */
        .sch-filters {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }
        @media (min-width: 560px) {
          .sch-filters { grid-template-columns: 1fr 1fr; }
        }
        @media (min-width: 900px) {
          .sch-filters { grid-template-columns: 1fr 1fr 1fr auto; align-items: end; }
        }

        /* ── Doctor info bar ── */
        .sch-docinfo {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem 1.25rem;
        }
        .sch-docinfo-item {
          font-size: 0.78rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        /* ── Legend + count row ── */
        .sch-legend {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .sch-legend-items {
          display: flex;
          gap: 0.875rem;
          flex-wrap: wrap;
        }
        .sch-legend-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .sch-legend-dot {
          width: 11px; height: 11px;
          border-radius: 3px;
          display: inline-block;
          flex-shrink: 0;
        }
        .sch-avail-count {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--teal);
          white-space: nowrap;
        }

        /* ── Selected slot confirmation bar ── */
        .sch-selected-bar {
          margin-top: 1.25rem;
          padding: 0.875rem 1rem;
          background: linear-gradient(135deg, rgba(14,165,160,0.08), rgba(8,145,178,0.08));
          border-radius: 10px;
          border: 1.5px solid rgba(14,165,160,0.25);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .sch-selected-info { min-width: 0; }
        .sch-selected-time {
          margin: 0;
          font-weight: 600;
          color: var(--navy);
          font-size: 0.92rem;
          white-space: nowrap;
        }
        .sch-selected-meta {
          margin: 0.1rem 0 0;
          font-size: 0.78rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sch-book-btn {
          flex-shrink: 0;
          white-space: nowrap;
          min-height: 44px;
          -webkit-tap-highlight-color: transparent;
        }
        @media (max-width: 767px) {
          .sch-selected-bar { flex-direction: column; align-items: stretch; gap: 0.75rem; }
          .sch-book-btn { width: 100%; justify-content: center; }
          .sch-filters { grid-template-columns: 1fr !important; gap: 1rem; }
          .sch-filters .btn-primary { min-height: 44px; width: 100%; }
          .sch-filter-panel { padding: 1rem !important; }
          .sch-legend { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
          .sch-legend-items { flex-wrap: wrap; }
          .sch-slot-area { padding: 1rem !important; }
        }

        /* ── Page header ── */
        .sch-header { margin-bottom: 1.25rem; }
        .sch-header h1 {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(1.4rem, 5vw, 1.9rem);
          color: var(--navy); margin: 0;
        }
        .sch-header p { color: var(--text-muted); margin: 0.2rem 0 0; font-size: 0.875rem; }
      `}</style>

      <div className="sch-header">
        <h1>Appointment Scheduler</h1>
        <p>Select a doctor and date to view available slots</p>
      </div>

      <ErrorMessage message={error} />

      {/* ── Filter panel ── */}
      <div className="sch-filter-panel" style={{ background:"white", borderRadius:"14px", padding:"1.25rem", marginBottom:"1.25rem", boxShadow:"var(--shadow-sm)", border:"1px solid var(--border)" }}>
        <div className="sch-filters">
          <div>
            <label className="form-label">Department</label>
            <select className="form-input" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Doctor</label>
            <select className="form-input" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">Select Doctor</option>
              {filteredDoctors.map((doc) => <option key={doc._id} value={doc._id}>{doc.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={date} min={today} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <button
              className="btn-primary"
              style={{ width:"100%", justifyContent:"center" }}
              disabled={!doctorId}
              onClick={loadSlots}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Doctor info bar */}
        {selectedDoctor && (
          <div className="sch-docinfo">
            {[
              { icon: "🏥", text: selectedDoctor.department },
              { icon: "⏰", text: `${selectedDoctor.workingHoursStart} – ${selectedDoctor.workingHoursEnd}` },
              { icon: "🕐", text: `${selectedDoctor.slotDuration} min slots` },
              selectedDoctor.breakStart && { icon: "☕", text: `Break ${selectedDoctor.breakStart}–${selectedDoctor.breakEnd}` },
            ].filter(Boolean).map((item, i) => (
              <span key={i} className="sch-docinfo-item">
                <span>{item.icon}</span>{item.text}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Slot area ── */}
      {!doctorId ? (
        <div style={{ background:"white", borderRadius:"14px", padding:"3.5rem 2rem", textAlign:"center", border:"2px dashed var(--border)", color:"var(--text-muted)" }}>
          <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>👨‍⚕️</div>
          <p style={{ fontWeight:500, margin:0 }}>Select a doctor to view available slots</p>
          <p style={{ fontSize:"0.8rem", margin:"0.25rem 0 0" }}>Use the filters above to find the right doctor</p>
        </div>
      ) : loading ? <Loader text="Loading slots…" /> : (
        <div className="sch-slot-area" style={{ background:"white", borderRadius:"14px", padding:"1.25rem", boxShadow:"var(--shadow-sm)", border:"1px solid var(--border)" }}>

          {/* Legend */}
          <div className="sch-legend">
            <div className="sch-legend-items">
              {[
                { bg:"white",              border:"var(--border)",    label:"Available" },
                { bg:"var(--teal)",        border:"var(--teal)",      label:"Selected"  },
                { bg:"var(--surface-2)",   border:"var(--surface-2)", label:"Booked"    },
              ].map((s) => (
                <span key={s.label} className="sch-legend-item">
                  <span className="sch-legend-dot" style={{ background:s.bg, border:`1.5px solid ${s.border}` }} />
                  {s.label}
                </span>
              ))}
            </div>
            <span className="sch-avail-count">{availableCount} available</span>
          </div>

          <SlotGrid slots={slots} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />

          {/* Selected confirmation */}
          {selectedSlot && (
            <div className="sch-selected-bar">
              <div className="sch-selected-info">
                <p className="sch-selected-time">✅ {selectedSlot.start} – {selectedSlot.end} selected</p>
                <p className="sch-selected-meta">{selectedDoctor?.name} · {date}</p>
              </div>
              <button
                className="btn-primary sch-book-btn"
                onClick={() => navigate("/booking", { state: { doctorId, date, slot: selectedSlot } })}
              >
                Book This Slot →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
