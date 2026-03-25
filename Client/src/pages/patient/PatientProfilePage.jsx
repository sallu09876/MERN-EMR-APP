import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../services/api.js";
import { toastError, toastSuccess } from "../../utils/toast.js";

const GenderOptions = ["MALE", "FEMALE", "OTHER"];
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const toTitle = (s) => (s ? String(s).toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : "");

export const PatientProfilePage = () => {
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    bloodGroup: "",
    mobile: "",
    address: "",
    medicalHistory: "",
  });

  const [photoPreview, setPhotoPreview] = useState("");

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const progress = useMemo(() => {
    if (!profile) return 0;
    const fields = [
      form.name,
      form.age,
      form.gender,
      form.bloodGroup,
      form.mobile,
      form.address,
      form.medicalHistory,
      photoPreview,
    ];
    const total = fields.length;
    const filled = fields.filter((v) => v !== undefined && v !== null && String(v).trim() !== "").length;
    return total ? Math.round((filled / total) * 100) : 0;
  }, [form, profile, photoPreview]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/patient/profile");
      const p = data.data || {};
      setProfile(p);
      setForm({
        name: p.name || "",
        age: p.age ?? "",
        gender: p.gender || "",
        bloodGroup: p.bloodGroup || "",
        mobile: p.mobile || "",
        address: p.address || "",
        medicalHistory: p.medicalHistory || "",
      });
      setPhotoPreview(p.profilePhoto || "");
    } catch (err) {
      toastError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        age: form.age === "" ? undefined : Number(form.age),
      };
      await api.put("/api/patient/profile", payload);
      toastSuccess("Profile saved");
      await load();
    } catch (err) {
      toastError(err.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const onPickPhoto = () => fileInputRef.current?.click();

  const onPhotoSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optimistic preview
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const { data } = await api.post("/api/patient/profile/photo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = data?.data?.profilePhoto || "";
      setPhotoPreview(url);
      toastSuccess("Photo updated");
      await load();
    } catch (err) {
      toastError(err.response?.data?.message || "Photo upload failed");
      await load(); // revert
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toastError("Passwords do not match");
      return;
    }
    setPwSubmitting(true);
    try {
      await api.post("/api/patient/auth/change-password", { currentPassword, newPassword });
      toastSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePassword(false);
    } catch (err) {
      toastError(err.response?.data?.message || "Failed to change password");
    } finally {
      setPwSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-muted)", animation: "fadeUp 0.3s ease" }}>
        Loading profile…
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Update your details and manage your account</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.25rem" }}>
        <div style={{ background: "white", borderRadius: 14, padding: "1.25rem 1.5rem", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 76, height: 76, borderRadius: "50%", background: "var(--surface-2)", border: "1px solid var(--border)", overflow: "hidden", position: "relative" }}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "var(--text-muted)", fontSize: "1.4rem" }}>
                    {form.name?.charAt(0)?.toUpperCase() || "P"}
                  </div>
                )}
                <button
                  type="button"
                  onClick={onPickPhoto}
                  disabled={uploading}
                  style={{
                    position: "absolute",
                    bottom: 6,
                    right: 6,
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    border: "1px solid rgba(14,165,160,0.35)",
                    background: "rgba(14,165,160,0.12)",
                    color: "var(--teal)",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                  aria-label="Upload photo"
                >
                  📷
                </button>
              </div>

              <div>
                <div style={{ fontWeight: 900, color: "var(--navy)", fontSize: "1.1rem" }}>{form.name || profile?.name || "Patient"}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Completion: <b style={{ color: "var(--teal)" }}>{progress}%</b>
                </div>
              </div>
            </div>

            <div style={{ width: 1, height: 1, opacity: 0 }} />
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPhotoSelected} />
        </div>

        <form onSubmit={onSave} style={{ background: "white", borderRadius: 14, padding: "1.25rem 1.5rem", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.95rem" }}>
            <div>
              <label className="form-label">Name</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.95rem" }}>
              <div>
                <label className="form-label">Age</label>
                <input className="form-input" type="number" inputMode="numeric" value={form.age} onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Gender</label>
                <select className="form-input" value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}>
                  <option value="">Select</option>
                  {GenderOptions.map((g) => (
                    <option key={g} value={g}>
                      {toTitle(g)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">Blood Group</label>
              <select className="form-input" value={form.bloodGroup} onChange={(e) => setForm((p) => ({ ...p, bloodGroup: e.target.value }))}>
                <option value="">Select</option>
                {bloodGroups.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.mobile} onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))} placeholder="Digits only" inputMode="numeric" />
            </div>
            <div>
              <label className="form-label">Address</label>
              <textarea className="form-input" rows={3} value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} style={{ resize: "vertical" }} />
            </div>
            <div>
              <label className="form-label">Medical History</label>
              <textarea className="form-input" rows={3} value={form.medicalHistory} onChange={(e) => setForm((p) => ({ ...p, medicalHistory: e.target.value }))} style={{ resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
              <button className="btn-secondary" type="button" onClick={() => load()} disabled={saving}>
                Reset
              </button>
              <button className="btn-primary" type="submit" disabled={saving} style={{ marginLeft: "auto" }}>
                {saving ? "Saving…" : "Save Changes →"}
              </button>
            </div>
          </div>
        </form>

        <div style={{ background: "white", borderRadius: 14, padding: "1.25rem 1.5rem", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 900, color: "var(--navy)", fontSize: "1.05rem" }}>Change Password</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Keep your account secure.
              </div>
            </div>
            <button type="button" className="btn-secondary" onClick={() => setShowChangePassword((v) => !v)}>
              {showChangePassword ? "Hide" : "Update Password"}
            </button>
          </div>

          {showChangePassword && (
            <form onSubmit={onChangePassword} style={{ marginTop: "1rem", display: "grid", gap: "0.95rem" }}>
              <div>
                <label className="form-label">Current Password</label>
                <input className="form-input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Confirm Password</label>
                <input className="form-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowChangePassword(false)} disabled={pwSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={pwSubmitting} style={{ marginLeft: "auto" }}>
                  {pwSubmitting ? "Updating…" : "Change Password →"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

