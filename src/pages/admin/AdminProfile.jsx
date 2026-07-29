import { useEffect, useState } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import toast from "react-hot-toast";
import { getApkDownloadUrl } from "../../utils/apk";

const AdminProfile = () => {

  /* ================= STATE ================= */
  const [activeTab, setActiveTab] = useState("personal");

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [passwordLoading, setPasswordLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* ================= LOAD PROFILE ================= */
  useEffect(() => {
    api.get("/admin/profile")
      .then(res => setProfile(res.data))
      .catch(() => {
        toast.error("Failed to load profile.");
      })
      .finally(() => setLoading(false));
  }, []);

  /* ================= SAVE PROFILE ================= */
  const save = async () => {
    setSaving(true);

    try {
      await api.put("/admin/profile", {
        name: profile.name,
        email: profile.email,
        city: profile.city,
      });
      toast.success("Profile updated successfully.");
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  /* ================= CHANGE PASSWORD ================= */
  const handleChangePassword = async () => {

  if (!passwords.currentPassword) {
    toast.error("Please enter your current password.");
    return;
  }
  if (!passwords.newPassword) {
    toast.error("Please enter a new password.");
    return;
  }
  if (!passwords.confirmPassword) {
    toast.error("Please confirm your new password.");
    return;
  }
  if (passwords.newPassword !== passwords.confirmPassword) {
    toast.error("Passwords do not match.");
    return;
  }
  if (passwords.currentPassword === passwords.newPassword) {
    toast.error("New password must be different from current password.");
    return;
  }

  setPasswordLoading(true);

  try {
    await api.post("/admin/profile/change-password", passwords);
    toast.success("Password changed successfully.");
    setPasswords({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
  } catch (err) {
    const msg = err?.response?.data?.message || "Something went wrong";
    toast.error(msg);
  } finally {
    setPasswordLoading(false);
  }
};

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <DashboardLayout
        title="Admin Profile"
        subtitle="Manage your personal details"
      >
        <div style={{ padding: "40px", textAlign: "center" }}>
          Loading profile...
        </div>
      </DashboardLayout>
    );
  }

  /* ================= UI ================= */
  return (
    <DashboardLayout
      title="Admin Profile"
      subtitle="Manage your personal details"
    >
      <div className="profile-tabbar">
        <button
          className={activeTab === "personal" ? "ptab ptab--active" : "ptab"}
          onClick={() => setActiveTab("personal")}
        >
          Personal Info
        </button>

        <button
          className={activeTab === "security" ? "ptab ptab--active" : "ptab"}
          onClick={() => setActiveTab("security")}
        >
          Security
        </button>
      </div>

      {/* ================= PERSONAL TAB ================= */}
      {activeTab === "personal" && (
        <div className="pcard">

          <div className="profile-hero" style={{ marginBottom: "20px" }}>
            <div>
              <div className="profile-hero__name">{profile.name}</div>
              <div className="profile-hero__role">Super Admin</div>
            </div>
          </div>

          <div className="pform">

            <div className="pfield">
              <label>Full Name</label>
              <input
                value={profile.name || ""}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
              />
            </div>

            <div className="pfield">
              <label>
                Phone <span className="locked-tag"><i className="bi bi-lock-fill"></i> Locked</span>
              </label>
              <input value={profile.phone || ""} disabled />
            </div>

            <div className="pfield">
              <label>Email</label>
              <input
                value={profile.email || ""}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
              />
            </div>

            <div className="pfield">
              <label>City</label>
              <input
                value={profile.city || ""}
                onChange={(e) =>
                  setProfile({ ...profile, city: e.target.value })
                }
              />
            </div>

            <div className="pfield pfield--full">
              <button
                className="submit-btn"
                onClick={save}
                disabled={saving}
              >
                {saving ? "Updating..." : "Save Changes"}
              </button>

               <button
                  className="download-app-btn"
                  onClick={() => window.open(getApkDownloadUrl())}
                >
                  <i className="bi bi-download"></i>
                  Download Mobile App (APK)
                </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= SECURITY TAB ================= */}

      {activeTab === "security" && (
        
        <div className="pcard">
          <div className="security-banner">
            <i className="bi bi-shield-check"></i>
            <span>Use uppercase letters, numbers, and symbols for a strong password.</span>
          </div>

          <div className="pform">

            {/* CURRENT PASSWORD */}
            <div className="pfield">
              <label>Current Password</label>
              <div className="pw-wrap">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, currentPassword: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  <i className={`bi ${showCurrent ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
              </div>
            </div>

            {/* NEW PASSWORD */}
            <div className="pfield">
              <label>New Password</label>
              <div className="pw-wrap">
                <input
                  type={showNew ? "text" : "password"}
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                />
               
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowNew(!showNew)}
                >
                  <i className={`bi ${showCurrent ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="pfield">
              <label>Confirm Password</label>
              <div className="pw-wrap">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, confirmPassword: e.target.value })
                  }
                />
               
              <button
              type="button"
              className="eye-btn"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              <i className={`bi ${showCurrent ? "bi-eye-slash" : "bi-eye"}`}></i>
            </button>
              </div>
            </div>

            <div className="pfield pfield--full">
              <button
                className="submit-btn"
                onClick={handleChangePassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </button>
            </div>

          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default AdminProfile;