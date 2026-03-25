import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { toastError } from "../../utils/toast.js";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export const PatientDashboardPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([
        api.get("/api/patient/profile"),
        api.get("/api/appointments/my-appointments"),
      ]);
      setProfile(p.data.data || null);
      setAppointments(a.data.data || []);
    } catch (err) {
      toastError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completion = useMemo(() => {
    if (!profile) return { percent: 0, filled: 0, total: 0 };
    const fields = [
      profile.name,
      profile.age,
      profile.gender,
      profile.bloodGroup,
      profile.mobile,
      profile.address,
      profile.medicalHistory,
      profile.profilePhoto,
    ];
    const total = fields.length;
    const filled = fields.filter((v) => v !== undefined && v !== null && String(v).trim() !== "").length;
    const percent = total ? Math.round((filled / total) * 100) : 0;
    return { percent, filled, total };
  }, [profile]);

  const upcoming = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return (appointments || [])
      .filter((a) => {
        const d = new Date(a.appointmentDate);
        return d >= todayStart && ["BOOKED", "ARRIVED"].includes(a.status);
      })
      .sort((x, y) => new Date(x.appointmentDate) - new Date(y.appointmentDate))
      .slice(0, 3);
  }, [appointments]);

  if (loading || !profile) {
    return (
      <div style={{ padding: "3rem 1.5rem", animation: "fadeUp 0.3s ease" }}>
        <div style={{ color: "var(--text-muted)", textAlign: "center" }}>Loading your dashboard…</div>
      </div>
    );
  }

  const greeting = getGreeting();

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <div className="page-header">
        <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--teal)", margin: "0 0 0.25rem" }}>
          {greeting}
        </p>
        <h1>{profile.name || user?.name || "Patient"} 👋</h1>
        <p>Manage your profile and appointments</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
        <div className="stat-card teal" style={{ padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                Profile completion
              </p>
              <div style={{ fontSize: "2.2rem", fontFamily: "'DM Serif Display',serif", color: "var(--navy)", fontWeight: 800, lineHeight: 1.1 }}>
                {completion.percent}%
              </div>
              <p style={{ margin: "0.35rem 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                {completion.filled}/{completion.total} fields
              </p>
            </div>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <div style={{ height: 10, background: "var(--surface-2)", borderRadius: 999, border: "1px solid var(--border)", overflow: "hidden" }}>
              <div style={{ width: `${completion.percent}%`, height: "100%", background: "linear-gradient(135deg, var(--teal), #0891b2)" }} />
            </div>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <Link to="/patient/profile" className="btn-secondary" style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}>
              Update Profile →
            </Link>
          </div>
        </div>

        <div style={{ background: "white", borderRadius: 14, padding: "1.25rem 1.5rem", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
            Quick Actions
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", marginTop: "1rem" }}>
            <Link to="/patient/book" style={{ textDecoration: "none" }}>
              <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "1rem", background: "var(--surface-2)", boxShadow: "var(--shadow-sm)", cursor: "pointer" }}>
                <div style={{ fontSize: "1.35rem" }}>📅</div>
                <div style={{ fontWeight: 800, color: "var(--navy)", marginTop: "0.25rem" }}>Book Appointment</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Choose doctor & slot</div>
              </div>
            </Link>

            <Link to="/patient/profile" style={{ textDecoration: "none" }}>
              <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "1rem", background: "var(--surface-2)", boxShadow: "var(--shadow-sm)", cursor: "pointer" }}>
                <div style={{ fontSize: "1.35rem" }}>👤</div>
                <div style={{ fontWeight: 800, color: "var(--navy)", marginTop: "0.25rem" }}>My Profile</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Update details</div>
              </div>
            </Link>

            <Link to="/patient/appointments" style={{ textDecoration: "none" }}>
              <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "1rem", background: "var(--surface-2)", boxShadow: "var(--shadow-sm)", cursor: "pointer" }}>
                <div style={{ fontSize: "1.35rem" }}>📋</div>
                <div style={{ fontWeight: 800, color: "var(--navy)", marginTop: "0.25rem" }}>My Appointments</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>View history</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 14, padding: "1.25rem 1.5rem", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
          Upcoming Appointments
        </p>
        {upcoming.length === 0 ? (
          <div style={{ marginTop: "1rem", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2rem" }}>📅</div>
            <div style={{ marginTop: "0.5rem", fontWeight: 600 }}>No upcoming appointments</div>
            <div style={{ marginTop: "0.25rem", fontSize: "0.85rem" }}>Book one to get started.</div>
          </div>
        ) : (
          <div style={{ marginTop: "0.95rem", display: "grid", gap: "0.75rem" }}>
            {upcoming.map((a) => (
              <div key={a._id} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "0.9rem", background: "var(--surface-2)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 800, color: "var(--navy)" }}>{a.doctorId?.name || "Doctor"}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{a.doctorId?.department || ""}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                    {new Date(a.appointmentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} · {a.slotStartTime}–{a.slotEndTime}
                  </div>
                </div>
                <span className="badge badge-available" style={{ textTransform: "none", fontSize: "0.75rem" }}>
                  Upcoming
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

