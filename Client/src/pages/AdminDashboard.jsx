import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import { toastError, toastSuccess } from "../utils/toast.js";
import { exportToExcel, exportToPDF } from "../utils/exportUtils.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const avatarUrlFor = (person) => {
  const name = person?.name || "Patient";
  return person?.profilePhoto
    ? person.profilePhoto
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8b5cf6&color=fff&size=128`;
};

const fmtINR = (paise) => `₹${(Number(paise ?? 0) / 100).toFixed(2)}`;

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
};

const fmtPaymentId = (id) => {
  if (!id) return "—";
  const s = String(id);
  return s.length > 8 ? `${s.slice(0, 8)}...` : s;
};

const fmtSlotTime = (t) => (t ? String(t) : "—");

// Format YYYY-MM-DD date string into a short day name
const formatDay = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" });
  } catch {
    return "—";
  }
};

const RevShimmer = ({ width = "100%", height = 14 }) => (
  <div className="rev-shimmer" style={{ width, height }} />
);

const NavCard = ({ to, icon, title, description, color }) => (
  <Link to={to} className="anc-card" style={{ "--anc-color": color }}>
    <div className="anc-icon" style={{ background: `${color}18` }}>{icon}</div>
    <div className="anc-body">
      <h3 className="anc-title">{title}</h3>
      <p className="anc-desc">{description}</p>
    </div>
    <span className="anc-arrow" style={{ color }}>→</span>
  </Link>
);

export const AdminDashboard = () => {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 480;
  const monthLabel = useMemo(() => {
    return new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  }, []);

  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [revenueStats, setRevenueStats] = useState(null);
  const [recentPaidBookings, setRecentPaidBookings] = useState([]);

  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [byDepartment, setByDepartment] = useState([]);

  useEffect(() => {
    if (!isSuperAdmin) return;

    let active = true;
    setLoadingRevenue(true);
    setRevenueStats(null);
    setRecentPaidBookings([]);

    Promise.all([api.get("/api/admin/revenue/stats"), api.get("/api/admin/revenue/recent")])
      .then(([statsRes, recentRes]) => {
        if (!active) return;
        setRevenueStats(statsRes?.data?.data || null);
        const recent = recentRes?.data?.data || [];
        setRecentPaidBookings(recent.slice(0, 10));
      })
      .catch(() => {
        toastError("Failed to load revenue data");
      })
      .finally(() => {
        if (!active) return;
        setLoadingRevenue(false);
      });

    return () => {
      active = false;
    };
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin) return;

    let active = true;
    setLoadingAnalytics(true);
    setChartData([]);
    setByDepartment([]);

    Promise.all([
      api.get("/api/admin/revenue/chart"),
      api.get("/api/admin/stats/by-department"),
    ])
      .then(([chartRes, deptRes]) => {
        if (!active) return;
        setChartData(chartRes?.data?.data || []);
        setByDepartment(deptRes?.data?.data || []);
      })
      .catch(() => {
        toastError("Failed to load analytics data");
      })
      .finally(() => {
        if (!active) return;
        setLoadingAnalytics(false);
      });

    return () => {
      active = false;
    };
  }, [isSuperAdmin]);

  const formattedWeekData = useMemo(() => {
    const list = Array.isArray(chartData) ? chartData : [];
    return list.map((d) => ({
      day: formatDay(d?.date),
      "Patient Bookings": d?.paid ?? 0,
      "Walk-in": d?.walkIn ?? 0,
    }));
  }, [chartData]);

  const deptChartData = useMemo(() => {
    const list = Array.isArray(byDepartment) ? byDepartment : [];
    return list.map((d) => ({
      name: d?.department,
      value: d?.count ?? 0,
    }));
  }, [byDepartment]);

  const COLORS = [
    "#0e9fa0",
    "#0a1628",
    "#8b5cf6",
    "#f59e0b",
    "#10b981",
    "#ef4444",
    "#3b82f6",
    "#ec4899",
  ];

  const totalRevenue = revenueStats?.totalRevenue ?? 0;
  const thisMonthRevenue = revenueStats?.thisMonthRevenue ?? 0;
  const todayRevenue = revenueStats?.todayRevenue ?? 0;
  const totalPaidBookings = revenueStats?.totalPaidBookings ?? 0;
  const failedPayments = revenueStats?.failedPayments ?? 0;
  const pendingPayments = revenueStats?.pendingPayments ?? 0;

  const recentPayments = recentPaidBookings;

  const handleExportRevenuePDF = () => {
    if (recentPayments.length === 0) return;
    exportToPDF({
      title: "MedFlow — Revenue Report",
      subtitle: `Total Revenue: ₹${(totalRevenue / 100).toFixed(2)} · ${totalPaidBookings} paid bookings`,
      columns: ["Patient", "Doctor", "Department", "Date", "Time", "Amount", "Payment ID", "Paid At"],
      rows: recentPayments.map((p) => [
        p.patientId?.name || "—",
        p.doctorId?.name || "—",
        p.doctorId?.department || "—",
        p.appointmentDate,
        p.slotStartTime,
        `₹${(p.amount / 100).toFixed(2)}`,
        p.razorpayPaymentId?.slice(0, 12) || "—",
        new Date(p.createdAt).toLocaleDateString(),
      ]),
      filename: "medflow-revenue",
    });
    toastSuccess("Report downloaded successfully");
  };

  const handleExportRevenueExcel = () => {
    if (recentPayments.length === 0) return;
    exportToExcel({
      sheetName: "Revenue Report",
      columns: ["Patient", "Doctor", "Department", "Date", "Time", "Amount (₹)", "Payment ID", "Paid At"],
      rows: recentPayments.map((p) => [
        p.patientId?.name || "—",
        p.doctorId?.name || "—",
        p.doctorId?.department || "—",
        p.appointmentDate,
        p.slotStartTime,
        (p.amount / 100).toFixed(2),
        p.razorpayPaymentId || "—",
        new Date(p.createdAt).toLocaleDateString(),
      ]),
      filename: "medflow-revenue",
    });
    toastSuccess("Report downloaded successfully");
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <style>{`
        /* ── Card ── */
        .anc-card {
          text-decoration: none;
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          background: white;
          border-radius: 14px;
          padding: 1.1rem 1.1rem 1.4rem;
          border: 1.5px solid var(--border);
          box-shadow: var(--shadow-sm);
          position: relative;
          cursor: pointer;
          isolation: isolate;
          overflow: hidden;
          transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        @media (max-width: 767px) {
          .anc-card { min-height: 80px; }
        }
        .anc-card:hover  { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--anc-color); }
        .anc-card:active { transform: translateY(0); }
        .anc-icon {
          width: 42px; height: 42px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
          /* Make sure emoji doesn't capture pointer events */
          pointer-events: none;
        }
        .anc-body  { flex: 1; pointer-events: none; }
        .anc-title { margin: 0; font-size: 0.92rem; font-weight: 600; color: var(--navy); line-height: 1.3; }
        .anc-desc  { margin: 0.2rem 0 0; font-size: 0.78rem; color: var(--text-muted); line-height: 1.5; }
        .anc-arrow {
          position: absolute;
          bottom: 0.875rem; right: 0.875rem;
          font-size: 0.9rem;
          opacity: 0.4;
          pointer-events: none;
          transition: opacity 0.15s, transform 0.15s;
        }
        .anc-card:hover .anc-arrow { opacity: 0.85; transform: translateX(3px); }

        /* ── Grid: strictly 1 col mobile, 2 col ≥480, 3 col ≥900 ── */
        .anc-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }
        @media (min-width: 480px) {
          .anc-grid { grid-template-columns: repeat(2, 1fr); gap: 0.875rem; }
          .anc-card { padding: 1.25rem 1.25rem 1.5rem; }
        }
        @media (min-width: 900px) {
          .anc-grid { grid-template-columns: repeat(3, 1fr); gap: 1rem; }
          .anc-card { padding: 1.5rem 1.5rem 1.75rem; }
        }

        /* ── Header ── */
        .anc-header { margin-bottom: 1.4rem; }
        .anc-greeting {
          color: var(--teal); font-weight: 600; font-size: 0.75rem;
          text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 0.2rem;
        }
        .anc-name {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(1.45rem, 5vw, 2rem);
          color: var(--navy); margin: 0; line-height: 1.2;
        }
        .anc-sub { color: var(--text-muted); margin: 0.2rem 0 0; font-size: 0.875rem; }
        @media (min-width: 768px) { .anc-header { margin-bottom: 2rem; } }

        /* ── Revenue & payments ── */
        .rev-section { margin-top: 1.75rem; }
        .rev-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
        @media (max-width: 767px) { .rev-stats-grid { grid-template-columns: repeat(2, 1fr); } }

        .rev-stat-wrap { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; min-height: 110px; }
        .rev-stat-sub { margin: 0; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); line-height: 1.2; }
        .rev-stat-value { margin: 0.25rem 0 0; font-size: 2rem; font-weight: 800; color: var(--navy); font-family: 'DM Serif Display',serif; line-height: 1.1; }
        .rev-stat-emoji { font-size: 1.55rem; line-height: 1; padding-top: 0.15rem; }

        .rev-shimmer {
          background: linear-gradient(90deg,var(--surface-2) 25%,var(--surface-3) 50%,var(--surface-2) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 10px;
        }

        .rev-table-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
        .rev-table-title { margin: 0; font-family: 'DM Serif Display',serif; font-size: 1.35rem; color: var(--navy); }
        .rev-table-wrap { overflow-x: auto; }
        .rev-cards { display: none; }
        @media (max-width: 767px) {
          .rev-table-wrap { display: none !important; }
          .rev-cards { display: block !important; padding: 0.75rem 0; }
          .rev-card {
            background: white; border-radius: 14px; padding: 1rem; margin-bottom: 0.75rem;
            border: 1px solid var(--border); box-shadow: var(--shadow-sm);
          }
        }
        @media (min-width: 768px) { .rev-cards { display: none !important; } }
      `}</style>

      <div className="anc-header">
        <p className="anc-greeting">{greeting}</p>
        <h1 className="anc-name">{user?.name || "Admin"}</h1>
        <p className="anc-sub">Here's your system overview for today.</p>
      </div>

      <div className="anc-grid">
        <NavCard to="/admin/doctors"       icon="👨‍⚕️" title="Manage Doctors"       description="Add, edit, or remove doctor accounts and schedules"   color="#0ea5a0" />
        <NavCard to="/admin/receptionists" icon="🗂️"  title="Manage Receptionists"         description="Manage receptionist staff and login credentials"      color="#8b5cf6" />
        <NavCard to="/admin/patients"      icon="👥"   title="Manage Patients"     description="View patient profiles and delete patient accounts"       color="#8b5cf6" />
        <NavCard to="/admin/stats"         icon="📊"  title="System Statistics"     description="View appointments, staff counts, and activity trends" color="#f0a500" />
        <NavCard to="/scheduler"           icon="📅"  title="Appointment Scheduler" description="Browse and book available doctor slots"               color="#10b981" />
        <NavCard to="/appointments/list"   icon="📋"  title="All Appointments"      description="View, edit, and manage all scheduled appointments"    color="#3b82f6" />
      </div>

      {isSuperAdmin && (
        <>
          <div className="rev-section">
          <div className="rev-table-top" style={{ marginBottom: "1rem" }}>
            <div>
              <p className="rev-stat-sub" style={{ fontSize: "0.72rem", marginBottom: "0.35rem", color: "var(--teal)" }}>
                Revenue & Payments
              </p>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Live overview of bookings and payment status
              </p>
            </div>
          </div>

          <div className="rev-stats-grid">
            {/* Card 1 - Total Revenue */}
            <div className="stat-card green" style={{ padding: "1.25rem 1.5rem" }}>
              <div className="rev-stat-wrap">
                <div style={{ minWidth: 0 }}>
                  <p className="rev-stat-sub">All time</p>
                  {loadingRevenue ? (
                    <div style={{ marginTop: "0.55rem" }}>
                      <RevShimmer width="120px" height="42px" />
                    </div>
                  ) : (
                    <p className="rev-stat-value">{fmtINR(totalRevenue)}</p>
                  )}
                </div>
                <div className="rev-stat-emoji" aria-hidden>💰</div>
              </div>
            </div>

            {/* Card 2 - This Month */}
            <div className="stat-card teal" style={{ padding: "1.25rem 1.5rem" }}>
              <div className="rev-stat-wrap">
                <div style={{ minWidth: 0 }}>
                  <p className="rev-stat-sub">{monthLabel}</p>
                  {loadingRevenue ? (
                    <div style={{ marginTop: "0.55rem" }}>
                      <RevShimmer width="120px" height="42px" />
                    </div>
                  ) : (
                    <p className="rev-stat-value">{fmtINR(thisMonthRevenue)}</p>
                  )}
                </div>
                <div className="rev-stat-emoji" aria-hidden>📅</div>
              </div>
            </div>

            {/* Card 3 - Today */}
            <div className="stat-card orange" style={{ padding: "1.25rem 1.5rem" }}>
              <div className="rev-stat-wrap">
                <div style={{ minWidth: 0 }}>
                  <p className="rev-stat-sub">Today's earnings</p>
                  {loadingRevenue ? (
                    <div style={{ marginTop: "0.55rem" }}>
                      <RevShimmer width="120px" height="42px" />
                    </div>
                  ) : (
                    <p className="rev-stat-value">{fmtINR(todayRevenue)}</p>
                  )}
                </div>
                <div className="rev-stat-emoji" aria-hidden>⚡</div>
              </div>
            </div>

            {/* Card 4 - Total Paid Bookings */}
            <div className="stat-card violet" style={{ padding: "1.25rem 1.5rem" }}>
              <div className="rev-stat-wrap">
                <div style={{ minWidth: 0 }}>
                  {loadingRevenue ? (
                    <>
                      <RevShimmer width="190px" height="16px" />
                      <div style={{ marginTop: "0.55rem" }}>
                        <RevShimmer width="90px" height="42px" />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="rev-stat-sub">
                        {failedPayments} failed · {pendingPayments} pending
                      </p>
                      <p className="rev-stat-value">{totalPaidBookings}</p>
                    </>
                  )}
                </div>
                <div className="rev-stat-emoji" aria-hidden>🎫</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "0.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "1rem", flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--navy)" }}>
                Recent Paid Bookings
              </h3>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn-secondary btn-sm"
                  onClick={handleExportRevenuePDF}
                  disabled={recentPayments.length === 0}
                  title={recentPayments.length === 0 ? "No data to export" : "Export as PDF"}
                >
                  ↓ PDF
                </button>
                <button
                  className="btn-secondary btn-sm"
                  onClick={handleExportRevenueExcel}
                  disabled={recentPayments.length === 0}
                  title={recentPayments.length === 0 ? "No data to export" : "Export as Excel"}
                >
                  ↓ Excel
                </button>
              </div>
            </div>

            <div className="rev-table-top">
              <div />
              <button className="btn-secondary btn-sm" onClick={() => {}} disabled={loadingRevenue}>
                View All
              </button>
            </div>

            {/* Mobile cards */}
            <div className="rev-cards">
              {loadingRevenue ? (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rev-card">
                      <RevShimmer width="70%" height="16" />
                      <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                        <RevShimmer width="55%" height="38" />
                        <RevShimmer width="30%" height="38" />
                      </div>
                      <div style={{ marginTop: "0.75rem" }}>
                        <RevShimmer width="90%" height="14" />
                        <div style={{ marginTop: "0.5rem" }}><RevShimmer width="80%" height="14" /></div>
                      </div>
                    </div>
                  ))}
                </>
              ) : recentPaidBookings.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem 0.75rem", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎫</div>
                  <p style={{ margin: 0, fontWeight: 600 }}>No paid bookings yet</p>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem" }}>As soon as customers pay, it will show up here.</p>
                </div>
              ) : (
                recentPaidBookings.map((p) => (
                  <div key={p._id} className="rev-card">
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                        <div style={{ width: "44px", height: "44px", borderRadius: "50%", overflow: "hidden", background: "var(--surface-2)", flexShrink: 0 }}>
                          {/* eslint-disable-next-line jsx-a11y/alt-text */}
                          <img src={avatarUrlFor(p?.patientId)} style={{ width: "44px", height: "44px", objectFit: "cover" }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {p?.patientId?.name || "—"}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {p?.doctorId?.name || "—"}{p?.doctorId?.department ? ` · ${p.doctorId.department}` : ""}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 900, fontFamily: "'DM Serif Display',serif", color: "var(--navy)", fontSize: "1.25rem", lineHeight: 1.1 }}>
                        {fmtINR(p?.amount)}
                      </div>
                    </div>

                    <div style={{ marginTop: "0.6rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                      {fmtDate(p?.appointmentDate)} · {fmtSlotTime(p?.slotStartTime)}
                    </div>

                    <div style={{ marginTop: "0.35rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      Payment: {fmtPaymentId(p?.razorpayPaymentId)}
                    </div>

                    <div style={{ marginTop: "0.35rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      Paid At: {fmtDate(p?.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop table */}
            <div className="rev-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor + Department</th>
                    <th>Date & Time</th>
                    <th>Amount</th>
                    <th>Payment ID</th>
                    <th>Paid At</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRevenue ? (
                    <>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td><RevShimmer width="140px" height="14" /></td>
                          <td><RevShimmer width="160px" height="14" /></td>
                          <td><RevShimmer width="120px" height="14" /></td>
                          <td><RevShimmer width="80px" height="14" /></td>
                          <td><RevShimmer width="120px" height="14" /></td>
                          <td><RevShimmer width="120px" height="14" /></td>
                        </tr>
                      ))}
                    </>
                  ) : recentPaidBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2.25rem 1rem" }}>
                        No paid bookings found
                      </td>
                    </tr>
                  ) : (
                    recentPaidBookings.map((p) => (
                      <tr key={p._id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", background: "var(--surface-2)", flexShrink: 0 }}>
                              {/* eslint-disable-next-line jsx-a11y/alt-text */}
                              <img src={avatarUrlFor(p?.patientId)} style={{ width: "36px", height: "36px", objectFit: "cover" }} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 800, fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {p?.patientId?.name || "—"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                          <div style={{ fontWeight: 800 }}>{p?.doctorId?.name || "—"}</div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.2rem" }}>
                            {p?.doctorId?.department || ""}
                          </div>
                        </td>

                        <td style={{ whiteSpace: "nowrap", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                          {fmtDate(p?.appointmentDate)} · {fmtSlotTime(p?.slotStartTime)}
                        </td>

                        <td style={{ fontWeight: 900, fontFamily: "'DM Serif Display',serif", color: "var(--navy)", whiteSpace: "nowrap" }}>
                          {fmtINR(p?.amount)}
                        </td>

                        <td style={{ whiteSpace: "nowrap", color: "var(--text-secondary)" }}>
                          {fmtPaymentId(p?.razorpayPaymentId)}
                        </td>

                        <td style={{ whiteSpace: "nowrap", color: "var(--text-muted)" }}>
                          {fmtDate(p?.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "1.75rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: isMobile ? "flex-start" : "center",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              marginBottom: "1rem",
              gap: "0.5rem",
            }}
          >
            <h2
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: isMobile ? "1.2rem" : "1.4rem",
                color: "var(--navy)",
                margin: 0,
              }}
            >
              📊 Analytics
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: isMobile ? "1rem" : "1.5rem",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <h3
                style={{
                  margin: "0 0 1rem",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                  fontWeight: 600,
                  color: "var(--navy)",
                }}
              >
                Appointments This Week
              </h3>

              {loadingAnalytics ? (
                <div
                  className="rev-shimmer"
                  style={{
                    width: "100%",
                    height: isMobile ? 200 : 260,
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                  }}
                />
              ) : formattedWeekData.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "3rem 1rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <div style={{ fontSize: "2rem" }}>📊</div>
                  <p style={{ margin: 0, fontWeight: 600 }}>No appointment data yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={isMobile ? 200 : 260}>
                  <BarChart data={formattedWeekData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: isMobile ? 10 : 12, fill: "var(--text-muted)" }}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: isMobile ? 10 : 12, fill: "var(--text-muted)" }}
                      allowDecimals={false}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid var(--border)",
                        fontSize: "0.78rem",
                      }}
                    />
                    <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: isMobile ? "0.72rem" : "0.8rem" }} />
                    <Bar
                      dataKey="Patient Bookings"
                      fill="#0e9fa0"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="Walk-in"
                      fill="#0a1628"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: isMobile ? "1rem" : "1.5rem",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <h3
                style={{
                  margin: "0 0 1rem",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                  fontWeight: 600,
                  color: "var(--navy)",
                }}
              >
                Appointments by Department
              </h3>

              {loadingAnalytics ? (
                <div
                  className="rev-shimmer"
                  style={{
                    width: "100%",
                    height: isMobile ? 220 : 260,
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                  }}
                />
              ) : deptChartData.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "3rem 1rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <div style={{ fontSize: "2rem" }}>📊</div>
                  <p style={{ margin: 0, fontWeight: 600 }}>No appointment data yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={isMobile ? 220 : 260}>
                  <PieChart>
                    <Pie
                      data={deptChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={isMobile ? 70 : 90}
                      dataKey="value"
                      label={(d) => (isMobile ? `${d.value}` : `${d.name} (${d.value})`)}
                      labelLine={!isMobile}
                    >
                      {deptChartData.map((entry, index) => (
                        <Cell
                          key={`${entry?.name}-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid var(--border)",
                        fontSize: "0.78rem",
                      }}
                      formatter={(value, name) => [value, name]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      wrapperStyle={{
                        fontSize: isMobile ? "0.68rem" : "0.78rem",
                        paddingTop: "0.5rem",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          </div>

          {false && (
            <div style={{ marginTop: "1.75rem" }}>
            <h2
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "1.4rem",
                color: "var(--navy)",
                marginBottom: "1rem",
              }}
            >
              📊 Analytics
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1.25rem",
                marginBottom: "2rem",
              }}
            >
              <div
                style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 1rem",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--navy)",
                  }}
                >
                  Appointments This Week
                </h3>

                {loadingAnalytics ? (
                  <div
                    className="rev-shimmer"
                    style={{
                      width: "100%",
                      height: 260,
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                    }}
                  />
                ) : formattedWeekData.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "3rem 1rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <div style={{ fontSize: "2rem" }}>📊</div>
                    <p style={{ margin: 0, fontWeight: 600 }}>No appointment data yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={formattedWeekData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "10px",
                          border: "1px solid var(--border)",
                          fontSize: "0.8rem",
                        }}
                      />
                      <Legend verticalAlign="bottom" />
                      <Bar
                        dataKey="Patient Bookings"
                        fill="#0e9fa0"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="Walk-in"
                        fill="#0a1628"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div
                style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 1rem",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--navy)",
                  }}
                >
                  Appointments by Department
                </h3>

                {loadingAnalytics ? (
                  <div
                    className="rev-shimmer"
                    style={{
                      width: "100%",
                      height: 260,
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                    }}
                  />
                ) : deptChartData.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "3rem 1rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <div style={{ fontSize: "2rem" }}>📊</div>
                    <p style={{ margin: 0, fontWeight: 600 }}>No appointment data yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={deptChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        label={({ name, value }) => `${name} (${value})`}
                        labelLine={false}
                      >
                        {deptChartData.map((entry, index) => (
                          <Cell
                            key={`${entry?.name}-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "10px",
                          border: "1px solid var(--border)",
                          fontSize: "0.8rem",
                        }}
                      />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

        </>
      )}
    </div>
  );
};
