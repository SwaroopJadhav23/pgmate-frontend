import { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../../api/axios";
import { isValidEmail } from "../../utils/formValidators";
import { getApkDownloadUrl } from "../../utils/apk";
import { AuthContext } from "../../context/AuthContext";

import "./ownerDashboardProfile.css";
import "./PoliceFormUpdateModal.css";
import DashboardLayout from "../../layouts/DashboardLayout";
import languageIcon from "../../assets/Language_icon.png";

const TABS = [
  { key: "personal", label: "Personal Info", icon: "bi-person" },
  { key: "security", label: "Security", icon: "bi-shield-lock" },
  { key: "preferences", label: "Preferences", icon: "languageIcon" },
];

const LANGUAGES = [
  {value: "en", label: "English"},
  {value: "hi", label: "हिंदी"},
  {value: "mr", label: "मराठी"},
  {value: "gu", label: "ગુજરાતી"},
  {value: "pa", label: "ਪੰਜਾਬੀ"},
  {value: "bn", label: "বাংলা"},
  {value: "ta", label: "தமிழ்"},
  {value: "te", label: "తెలుగు"},
  {value: "kn", label: "ಕನ್ನಡ"},
  {value: "ml", label: "മലയാളം"},
];

const getOwnerProfileCompletion = (profile) => {
  if (!profile) return 0;

  const fields = [
    profile.name,
    profile.email,
    profile.city,
    profile.photoUrl,
    profile.idProofUrl,
    profile.defaultPoliceFormType,
  ];

  return (fields.filter(Boolean).length / fields.length) * 100;
};

const getOwnerProfileChecklist = (profile) => {
  if (!profile) return [];

  return [
    { key: "name", label: "Full name", complete: Boolean(profile.name?.trim()) },
    { key: "email", label: "Email", complete: Boolean(profile.email?.trim()) },
    { key: "city", label: "City", complete: Boolean(profile.city?.trim()) },
    { key: "photo", label: "Profile photo", complete: Boolean(profile.photoUrl) },
    { key: "idProof", label: "ID proof", complete: Boolean(profile.idProofUrl) },
    { key: "policeForm", label: "Police Form Preference", complete: Boolean(profile.defaultPoliceFormType) },
  ];
};

const OwnerDashboardProfile = () => {
  const { setOwner, refreshOwnerProfile } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");

  const [profile, setProfile] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [idProof, setIdProof] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [photoInfo, setPhotoInfo] = useState(null);
  const [idProofInfo, setIdProofInfo] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false);

  const [formErrors, setFormErrors] = useState({});
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const getInitialLanguage = () => {
    const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/);
    return match ? match[1] : (localStorage.getItem("preferredLanguage") || "en");
  };
  const [selectedLang, setSelectedLang] = useState(getInitialLanguage());

  const handleLanguageChange = (langValue) => {
    const cookieValue = langValue === "en" ? "/en/en" : `/en/${langValue}`;
    document.cookie = `googtrans=${cookieValue}; path=/; max-age=31536000`;
    document.cookie = `googtrans=${cookieValue}; path=/; domain=${window.location.hostname}; max-age=31536000`;
    localStorage.setItem("preferredLanguage", langValue);
    setSelectedLang(langValue);
    window.location.reload();
  };

  const checklist = useMemo(() => getOwnerProfileChecklist(profile), [profile]);
  const completion = useMemo(() => Math.round(getOwnerProfileCompletion(profile)), [profile]);

  useEffect(() => {
    api.get("/owner/profile")
      .then((res) => {
        const data = res.data || null;
        setProfile(data);
        // Check if they are missing ANY core field (name, email, city, photo, idProof).
        // If they are only missing defaultPoliceFormType, we don't show THIS popup, 
        // because the GlobalPoliceFormModal will show up instead and act as a feature update.
        const missingCoreField = !data.name || !data.email || !data.city || !data.photoUrl || !data.idProofUrl;
        
        if (location.state?.profileSetupRequired || missingCoreField) {
          // But wait, if they are routed here by ProtectedRoute just because of defaultPoliceFormType,
          // profileSetupRequired will be true! So we need to explicitly ignore profileSetupRequired
          // if they have all core fields.
          if (missingCoreField) {
            setShowCompletionPrompt(true);
          }
        }
      })
      .catch(() => alert("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [location.state]);

  const handleScrollToError = () => {
    setTimeout(() => {
      const firstError = document.querySelector('.error-field');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
    }, 100);
  };

  const save = async () => {
    const trimmedName = profile.name?.trim() || "";
    const trimmedEmail = profile.email?.trim() || "";
    const trimmedCity = profile.city?.trim() || "";

    const newErrors = {};

    if (!trimmedName) {
      newErrors.name = true;
    }
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      newErrors.email = true;
    }
    if (!trimmedCity) {
      newErrors.city = true;
    }
    if (!photo && !profile?.photoUrl) {
      newErrors.photo = true;
    }
    if (!idProof && !profile?.idProofUrl) {
      newErrors.idProof = true;
    }
    if (!profile?.defaultPoliceFormType) {
      newErrors.policeForm = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      handleScrollToError();
      await Swal.fire({ icon: "warning", title: "Missing Fields", text: "Please fill in all the required fields marked in red." });
      return;
    }
    
    setFormErrors({});

    const previousCompletion = getOwnerProfileCompletion(profile);
    const fd = new FormData();
    fd.append("name", trimmedName);
    fd.append("email", trimmedEmail);
    fd.append("city", trimmedCity);
    if (photo) fd.append("photo", photo);
    if (idProof) fd.append("idProof", idProof);
    if (profile.defaultPoliceFormType) fd.append("defaultPoliceFormType", profile.defaultPoliceFormType);

    setSaveLoading(true);
    try {
      await api.put("/owner/profile", fd);
      const res = await api.get("/owner/profile");
      const updatedProfile = res.data;
      const updatedCompletion = getOwnerProfileCompletion(updatedProfile);

      setProfile(updatedProfile);
      localStorage.setItem("ownerProfile", JSON.stringify(updatedProfile));
      setOwner?.(updatedProfile);

      if (updatedCompletion === 100) {
        setShowCompletionPrompt(false);
      }

      if (previousCompletion < 100 && updatedCompletion === 100) {
        // Refresh the shared AuthContext so ProtectedRoute sees profile as complete
        refreshOwnerProfile?.();
        await Swal.fire({
          icon: "success",
          title: "Profile Completed!",
          text: "Your owner profile is now complete and ready to use.",
          confirmButtonColor: "#4f46e5",
        });
        // Navigate back to the page the owner originally tried to access
        const returnTo = location.state?.from || "/owner/pgs";
        navigate(returnTo, { replace: true });
      } else {
        await Swal.fire({
          icon: "success",
          title: "Profile Updated",
          text: "Your profile changes have been saved successfully.",
          confirmButtonColor: "#4f46e5",
        });
      }
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "We could not save your profile right now. Please try again.",
        confirmButtonColor: "#4f46e5",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const getStrength = (pwd) => {
    if (!pwd) return 0;
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
  };

  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"];
  const strength = getStrength(passwords.newPassword);

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");
    if (!passwords.currentPassword) { setPasswordError("Current password is required."); return; }
    if (!passwords.newPassword || !passwords.confirmPassword) { setPasswordError("Both new password fields are required."); return; }
    if (passwords.newPassword !== passwords.confirmPassword) { setPasswordError("New passwords do not match."); return; }
    if (passwords.newPassword.length < 6) { setPasswordError("New password must be at least 6 characters."); return; }
    if (passwords.currentPassword === passwords.newPassword) { setPasswordError("New password must be different from current password."); return; }
    setPasswordLoading(true);
    try {
      await api.post("/owner/profile/change-password", passwords);
      setPasswordSuccess("Password updated successfully!");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordError(err?.response?.data || "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="My Profile" subtitle="Manage your personal details">
        <div style={{ padding: "40px", textAlign: "center" }}>
          Loading profile...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout title="My Profile" subtitle="Manage your personal details">
        <div className="profile-tabbar">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`ptab ${activeTab === t.key ? "ptab--active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.icon === "languageIcon" ? (
                <img src={languageIcon} alt="lang" style={{ width: "18px", height: "18px" }} />
              ) : (
                <i className={`bi ${t.icon}`}></i>
              )}
              {t.label}
            </button>
          ))}
        </div>

        <div className="profile-hero">
          <img
            src={profile.photoUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt="avatar"
            className="profile-hero__avatar"
          />
          <div>
            <div className="profile-hero__name">{profile.name}</div>
            <div className="profile-hero__role">PG Owner</div>
          </div>
        </div>

        {activeTab === "personal" && (
          <div className="pcard">
            <div className="pform">
              <div className="pfield">
                <label>Full Name</label>
                <input
                  className={formErrors.name ? "error-field" : ""}
                  value={profile.name || ""}
                  onChange={(e) => {
                    setProfile({ ...profile, name: e.target.value.trimStart() });
                    setFormErrors(prev => ({ ...prev, name: false }));
                  }}
                  placeholder="Enter your name"
                  autoComplete="name"
                />
              </div>

              <div className="pfield">
                <label>Phone &nbsp;<span className="locked-tag"><i className="bi bi-lock-fill"></i> Locked</span></label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={profile.phone || ""}
                  disabled
                />
              </div>

              <div className="pfield">
                <label>Email</label>
                <input
                  className={formErrors.email ? "error-field" : ""}
                  type="email"
                  autoComplete="email"
                  value={profile.email || ""}
                  onChange={(e) => {
                    setProfile({ ...profile, email: e.target.value.trim() });
                    setFormErrors(prev => ({ ...prev, email: false }));
                  }}
                  placeholder="Enter your email"
                />
              </div>

              <div className="pfield">
                <label>City</label>
                <input
                  className={formErrors.city ? "error-field" : ""}
                  value={profile.city || ""}
                  onChange={(e) => {
                    setProfile({ ...profile, city: e.target.value.trimStart() });
                    setFormErrors(prev => ({ ...prev, city: false }));
                  }}
                  placeholder="Enter your city"
                  autoComplete="address-level2"
                />
              </div>

              <div className="pfield pfield--full">
                <label>Profile Photo</label>
                <label className={`upload-zone ${formErrors.photo ? "error-field" : ""}`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files[0];
                      setPhoto(f);
                      if (f) {
                        setPhotoInfo({ name: f.name, size: (f.size / 1024).toFixed(1) });
                        setFormErrors(prev => ({ ...prev, photo: false }));
                      }
                    }}
                  />
                  <span><i className="bi bi-cloud-arrow-up-fill" style={{ fontSize: "18px" }}></i> Upload Profile Photo</span>
                </label>
                {photoInfo && <div className="file-chip"><i className="bi bi-file-earmark"></i>{photoInfo.name} ({photoInfo.size} KB)</div>}
                {profile.photoUrl && <span className="view-link" onClick={() => setPreviewImage(profile.photoUrl)}>View current photo</span>}
              </div>

              <div className="pfield pfield--full">
                <label>ID Proof</label>
                <label className={`upload-zone ${formErrors.idProof ? "error-field" : ""}`}>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const f = e.target.files[0];
                      setIdProof(f);
                      if (f) {
                        setIdProofInfo({ name: f.name, size: (f.size / 1024).toFixed(1) });
                        setFormErrors(prev => ({ ...prev, idProof: false }));
                      }
                    }}
                  />
                  <span><i className="bi bi-file-earmark-arrow-up-fill" style={{ fontSize: "18px" }}></i> Upload ID Proof</span>
                </label>
                {profile.idProofUrl && <span className="view-link" onClick={() => setPreviewImage(profile.idProofUrl)}>View ID proof</span>}
                {idProofInfo && <div className="file-chip"><i className="bi bi-file-earmark-text"></i>{idProofInfo.name} ({idProofInfo.size} KB)</div>}
              </div>

              <div className="pfield pfield--full">
                <label>Default Police Verification Preference</label>
                <div className={`police-form-option-grid ${formErrors.policeForm ? "error-field" : ""}`} style={{ marginTop: '8px', padding: formErrors.policeForm ? '8px' : '0' }}>
                  <div
                    className={`police-form-option ${profile.defaultPoliceFormType === "WITH_RULES" ? "selected" : ""}`}
                    onClick={() => {
                      setProfile({ ...profile, defaultPoliceFormType: "WITH_RULES" });
                      setFormErrors(prev => ({ ...prev, policeForm: false }));
                    }}
                  >
                    <div className="police-form-radio-dot" />
                    <div className="police-form-icon" style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <i className="bi bi-shield-check" style={{ color: '#4f46e5' }}></i>
                      <i className="bi bi-file-earmark-text" style={{ color: '#6b7280' }}></i>
                    </div>
                    <span className="police-form-option-title">Form with PG Rules</span>
                    <p className="police-form-option-desc">Includes all the rules, regulations, and fines you configured.</p>
                  </div>

                  <div
                    className={`police-form-option ${profile.defaultPoliceFormType === "ONLY" ? "selected" : ""}`}
                    onClick={() => {
                      setProfile({ ...profile, defaultPoliceFormType: "ONLY" });
                      setFormErrors(prev => ({ ...prev, policeForm: false }));
                    }}
                  >
                    <div className="police-form-radio-dot" />
                    <div className="police-form-icon">
                      <i className="bi bi-shield-check" style={{ color: '#4f46e5' }}></i>
                    </div>
                    <span className="police-form-option-title">Form Only</span>
                    <p className="police-form-option-desc">Standard police verification form without any additional rules.</p>
                  </div>
                </div>
              </div>


              <div className="pfield pfield--full">
                <button
                  className="submit-btn"
                  onClick={save}
                  disabled={saveLoading}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: saveLoading ? 0.85 : 1 }}
                >
                  {saveLoading ? (
                    <>
                      <span style={{
                        width: "15px", height: "15px",
                        border: "2px solid rgba(255,255,255,0.4)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "odp-spin 0.7s linear infinite",
                        flexShrink: 0,
                      }}/>
                      Saving...
                    </>
                  ) : "Save Changes"}
                  <style>{`@keyframes odp-spin { to { transform: rotate(360deg); } }`}</style>
                </button>
                <button
                  className="download-app-btn"
                  onClick={() => window.open(getApkDownloadUrl())}
                >
                  <i className="bi bi-cloud-arrow-down-fill" style={{ fontSize: "18px" }}></i>
                  Download Mobile App (APK)
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="pcard">
            <div className="security-banner">
              <i className="bi bi-shield-check"></i>
              <span>Use uppercase letters, numbers, and symbols for a strong password.</span>
            </div>

            <div className="pform">
              <div className="pfield">
                <label>Current Password</label>
                <div className="pw-wrap">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={passwords.currentPassword}
                    onChange={(e) => { setPasswords({ ...passwords, currentPassword: e.target.value }); setPasswordError(""); setPasswordSuccess(""); }}
                    placeholder="Enter your current password"
                  />
                  <button className="eye-btn" type="button" onClick={() => setShowCurrent(!showCurrent)}>
                    <i className={`bi ${showCurrent ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
                </div>
              </div>

              <div className="pfield">
                <label>New Password</label>
                <div className="pw-wrap">
                  <input
                    type={showNew ? "text" : "password"}
                    value={passwords.newPassword}
                    onChange={(e) => { setPasswords({ ...passwords, newPassword: e.target.value }); setPasswordError(""); setPasswordSuccess(""); }}
                    placeholder="Enter new password"
                  />
                  <button className="eye-btn" type="button" onClick={() => setShowNew(!showNew)}>
                    <i className={`bi ${showNew ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
                </div>
                {passwords.newPassword && (
                  <div className="strength-row">
                    <div className="strength-bars">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="sbar" style={{ background: i <= strength ? strengthColors[strength] : "#e2e8f0" }} />
                      ))}
                    </div>
                    <span className="strength-lbl" style={{ color: strengthColors[strength] }}>{strengthLabels[strength]}</span>
                  </div>
                )}
              </div>

              <div className="pfield">
                <label>Confirm Password</label>
                <div className="pw-wrap">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={passwords.confirmPassword}
                    onChange={(e) => { setPasswords({ ...passwords, confirmPassword: e.target.value }); setPasswordError(""); setPasswordSuccess(""); }}
                    placeholder="Confirm new password"
                  />
                  <button className="eye-btn" type="button" onClick={() => setShowConfirm(!showConfirm)}>
                    <i className={`bi ${showConfirm ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
                </div>
                {passwords.confirmPassword && (
                  <div className="match-row" style={{ color: passwords.newPassword === passwords.confirmPassword ? "#22c55e" : "#ef4444" }}>
                    <i className={`bi ${passwords.newPassword === passwords.confirmPassword ? "bi-check-circle" : "bi-x-circle"}`}></i>
                    {passwords.newPassword === passwords.confirmPassword ? "Passwords match" : "Passwords do not match"}
                  </div>
                )}
              </div>

              {passwordError && <div className="pw-msg pw-msg--error"><i className="bi bi-exclamation-circle"></i>{passwordError}</div>}
              {passwordSuccess && <div className="pw-msg pw-msg--success"><i className="bi bi-check-circle"></i>{passwordSuccess}</div>}

              <div className="pfield pfield--full">
                <button className="submit-btn" onClick={handleChangePassword} disabled={passwordLoading}>
                  {passwordLoading ? <><span className="spin"></span>Updating...</> : "Update Password"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="pcard">
            <div className="pform">
              <div className="pfield pfield--full">
                <label>Language Preference</label>
                <select
                  value={selectedLang}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  style={{
                    width: "100%", padding: "10px", borderRadius: "8px",
                    border: "1px solid #e2e8f0", fontSize: "14px", outline: "none",
                    fontFamily: "inherit", color: "#334155"
                  }}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
                <small style={{color: "#64748b", marginTop: "4px", display: "block"}}>
                  This sets your default language permanently.
                </small>
              </div>
            </div>
          </div>
        )}

        {previewImage && (
          <div className="modal-bg" onClick={() => setPreviewImage(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h4>Document Preview</h4>
                <button className="modal-close" onClick={() => setPreviewImage(null)}>×</button>
              </div>
              {previewImage?.toLowerCase().endsWith(".pdf")
                ? <iframe src={previewImage} title="doc" width="100%" height="500px" style={{ border: "none" }} />
                : <img src={previewImage} alt="preview" style={{ maxWidth: "100%", maxHeight: "500px", borderRadius: "8px" }} />
              }
            </div>
          </div>
        )}
      </DashboardLayout>

      {showCompletionPrompt && completion < 100 && (
        <div className="owner-profile-prompt-overlay" onClick={() => setShowCompletionPrompt(false)}>
          <div className="owner-profile-prompt-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="owner-profile-prompt-title">
            <div className="owner-profile-prompt-tag">Owner profile setup</div>
            <h3 id="owner-profile-prompt-title">Complete your profile to continue</h3>
            <p>
              Your profile is still incomplete. Please finish the missing details below so you can use all owner pages without interruption.
            </p>

            <div className="owner-profile-prompt-progress">
              <div className="owner-profile-prompt-progress-head">
                <span>Completion progress</span>
                <strong>{completion}%</strong>
              </div>
              <div className="owner-profile-prompt-progress-bar">
                <div className="owner-profile-prompt-progress-fill" style={{ width: `${completion}%` }}></div>
              </div>
            </div>

            <div className="owner-profile-prompt-list">
              {checklist.map((item) => (
                <div key={item.key} className={`owner-profile-prompt-item ${item.complete ? "is-done" : "is-missing"}`}>
                  <i className={`bi ${item.complete ? "bi-check-circle-fill" : "bi-exclamation-circle-fill"}`}></i>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <button className="owner-profile-prompt-btn" onClick={() => setShowCompletionPrompt(false)}>
              Complete Profile
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default OwnerDashboardProfile;