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

  const filteredDoctors = useMemo(() => !departmentFilter ? doctors : doctors.filter((d) => d.department === departmentFilter), [doctors, departmentFilter]);

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

  const selectedDoctor = doctors.find((d) => d._id === doctorId);
  const availableCount = slots.filter((s) => s.status === "AVAILABLE").length;

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <div className="page-header">
        <h1>Appointment Scheduler</h1>
        <p>Select a doctor and date to view available slots</p>
      </div>

      <ErrorMessage message={error} />

      {/* Filter panel */}
      <div style={{ background: "white", borderRadius: "14px", padding: "1.5rem", marginBottom: "1.25rem", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", alignItems: "end" }}>
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
            <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={!doctorId} onClick={loadSlots}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Doctor info bar */}
        {selectedDoctor && (
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {[
              { icon: "🏥", text: selectedDoctor.department },
              { icon: "⏰", text: `${selectedDoctor.workingHoursStart} – ${selectedDoctor.workingHoursEnd}` },
              { icon: "🕐", text: `${selectedDoctor.slotDuration} min slots` },
              selectedDoctor.breakStart && { icon: "☕", text: `Break ${selectedDoctor.breakStart}–${selectedDoctor.breakEnd}` },
            ].filter(Boolean).map((item, i) => (
              <span key={i} style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <span>{item.icon}</span>{item.text}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Slot grid */}
      {!doctorId ? (
        <div style={{ background: "white", borderRadius: "14px", padding: "4rem 2rem", textAlign: "center", border: "2px dashed var(--border)", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>👨‍⚕️</div>
          <p style={{ fontWeight: 500 }}>Select a doctor to view available slots</p>
          <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Use the filters above to find the right doctor</p>
        </div>
      ) : loading ? <Loader text="Loading slots…" /> : (
        <div style={{ background: "white", borderRadius: "14px", padding: "1.5rem", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", gap: "1.25rem" }}>
              {[
                { color: "white", border: "var(--border)", label: "Available" },
                { color: "var(--teal)", border: "var(--teal)", label: "Selected" },
                { color: "var(--surface-3)", border: "var(--surface-3)", label: "Booked" },
              ].map((s) => (
                <span key={s.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "4px", background: s.color, border: `1.5px solid ${s.border}`, display: "inline-block" }} />
                  {s.label}
                </span>
              ))}
            </div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--teal)" }}>{availableCount} slots available</span>
          </div>

          <SlotGrid slots={slots} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />

          {selectedSlot && (
            <div style={{
              marginTop: "1.25rem", padding: "1rem 1.25rem",
              background: "linear-gradient(135deg, rgba(14,165,160,0.08), rgba(8,145,178,0.08))",
              borderRadius: "10px", border: "1.5px solid rgba(14,165,160,0.25)",
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem"
            }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: "var(--navy)", fontSize: "0.95rem" }}>
                  ✅ {selectedSlot.start} – {selectedSlot.end} selected
                </p>
                <p style={{ margin: "0.125rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {selectedDoctor?.name} · {date}
                </p>
              </div>
              <button className="btn-primary" onClick={() => navigate("/booking", { state: { doctorId, date, slot: selectedSlot } })}>
                Book This Slot →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
