import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useDoctors } from "../../hooks/useDoctors.js";
import { SlotGrid } from "../../components/SlotGrid.jsx";
import { Loader } from "../../components/Loader.jsx";
import { ErrorMessage } from "../../components/ErrorMessage.jsx";
import { formatDateForInput } from "../../utils/formatTime.js";
import { toastError, toastSuccess } from "../../utils/toast.js";

export const PatientBookPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { doctors, loading: doctorsLoading } = useDoctors();

  const today = formatDateForInput(new Date());

  const [profile, setProfile] = useState(null);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  const filteredDoctors = useMemo(() => {
    if (!departmentFilter) return doctors;
    return doctors.filter((d) => d.department === departmentFilter);
  }, [doctors, departmentFilter]);

  useEffect(() => {
    // Load profile for Razorpay prefill.
    api
      .get("/api/patient/profile")
      .then((res) => setProfile(res.data.data || null))
      .catch(() => {});
  }, []);

  const fetchSlots = useCallback(async () => {
    if (!doctorId || !date) return;
    setLoadingSlots(true);
    setError("");
    try {
      const res = await api.get("/api/appointments/available-slots", { params: { doctorId, date } });
      const nextSlots = res.data.data || [];
      setSlots(nextSlots);

      setSelectedSlot((prev) => {
        if (!prev) return prev;
        const stillSelected = nextSlots.find(
          (s) => s.start === prev.start && s.end === prev.end && s.status === "AVAILABLE"
        );
        return stillSelected || null;
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load slots");
      setSelectedSlot(null);
    } finally {
      setLoadingSlots(false);
    }
  }, [doctorId, date]);

  useEffect(() => {
    setSlots([]);
    setSelectedSlot(null);
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId) return;
    fetchSlots();
    const id = setInterval(() => fetchSlots(), 30000);
    return () => clearInterval(id);
  }, [fetchSlots, doctorId]);

  const availableCount = slots.filter((s) => s.status === "AVAILABLE").length;

  const handlePay = async () => {
    if (!selectedSlot || !doctorId) {
      toastError("Select a slot first");
      return;
    }
    if (!profile) {
      toastError("Profile not loaded yet. Please try again.");
      return;
    }

    setPaying(true);
    try {
      const { data } = await api.post("/api/payment/create-order", {
        doctorId,
        appointmentDate: date,
        slotStartTime: selectedSlot.start,
        slotEndTime: selectedSlot.end,
      });

      const { orderId, amount, currency, keyId } = data;

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: "MedFlow Hospital",
        description: "Appointment Booking Fee",
        order_id: orderId,
        theme: { color: "#0e9fa0" },
        prefill: {
          name: profile.name || user?.name || "",
          email: profile.email || user?.email || "",
          contact: profile.mobile || "",
        },
        handler: async function (response) {
          try {
            const verifyRes = await api.post("/api/payment/verify", {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            void verifyRes;
            toastSuccess("Payment successful! Appointment confirmed 🎉");
            navigate("/patient/appointments");
          } catch (err) {
            const msg = err.response?.data?.message || "Payment verification failed";
            // Slot may have been taken between create-order and verify.
            toastError(msg);
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: async function () {
            try {
              await api.post("/api/payment/failed", { orderId });
            } catch {
              // ignore
            }
            toastError("Payment failed. Please try again.");
            setPaying(false);
          },
        },
      });

      rzp.open();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to initiate payment";
      if (msg.toLowerCase().includes("slot")) toastError("This slot was just booked. Please choose another.");
      else toastError(msg);
      setPaying(false);
    }
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease", maxWidth: 900, width: "100%", padding: "0 0.5rem" }}>
      <div className="page-header">
        <h1>Book Appointment</h1>
        <p>Select a doctor, choose date, then pay ₹100 to confirm</p>
      </div>

      {doctorsLoading ? (
        <Loader text="Loading doctors…" />
      ) : (
        <div style={{ background: "white", borderRadius: 14, padding: "1.25rem 1.5rem", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.95rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.95rem" }}>
              <div>
                <label className="form-label">Department</label>
                <select className="form-input" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                  <option value="">All departments</option>
                  {[...new Set(doctors.map((d) => d.department).filter(Boolean))].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Doctor</label>
                <select className="form-input" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                  <option value="">Select Doctor</option>
                  {filteredDoctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} · {d.department}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: "1.25rem" }}>
            {!doctorId ? (
              <div style={{ background: "var(--surface-2)", borderRadius: 14, padding: "3.25rem 1.5rem", textAlign: "center", border: "2px dashed var(--border)", color: "var(--text-muted)" }}>
                <div style={{ fontSize: "2.5rem" }}>👨‍⚕️</div>
                <p style={{ fontWeight: 600, margin: 0 }}>Select a doctor to view slots</p>
              </div>
            ) : loadingSlots ? (
              <Loader text="Loading slots…" />
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                  <div style={{ color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.75rem" }}>
                    Slot availability
                  </div>
                  <div style={{ color: "var(--teal)", fontWeight: 800 }}>{availableCount} available</div>
                </div>
                <ErrorMessage message={error} />
                <SlotGrid slots={slots} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />

                {selectedSlot && (
                  <div style={{ marginTop: "1.25rem", background: "linear-gradient(135deg, rgba(14,165,160,0.08), rgba(8,145,178,0.08))", borderRadius: 12, border: "1px solid rgba(14,165,160,0.25)", padding: "1rem", display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 900, color: "var(--navy)" }}>
                        ✅ {selectedSlot.start} – {selectedSlot.end}
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        Pay ₹100 to confirm
                      </div>
                      <div style={{ marginTop: "0.35rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        🔒 Secure payment powered by Razorpay · ₹100 booking fee
                      </div>
                    </div>
                    <button className="btn-primary" type="button" onClick={handlePay} disabled={paying}>
                      {paying ? "Opening payment…" : "Pay ₹100 & Book Now→"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

