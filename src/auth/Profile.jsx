import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import UserLayout from "../layouts/UserLayout";
import "./profile.css";
import languageIcon from "../assets/Language_icon.png";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिंदी" },
  { value: "mr", label: "मराठी" },
  { value: "gu", label: "ગુજરાતી" },
  { value: "pa", label: "ਪੰਜਾਬੀ" },
  { value: "bn", label: "বাংলা" },
  { value: "ta", label: "தமிழ்" },
  { value: "te", label: "తెలుగు" },
  { value: "kn", label: "ಕನ್ನಡ" },
  { value: "ml", label: "മലയാളം" },
];

/* ── Toast Hook ── */
const useToast = () => {
  const [toast, setToast] = useState(null);

  const show = useCallback((msg, type = "success") => {
    setToast({ msg, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  return { toast, show };
};

const Profile = () => {
  const [profile, setProfile] = useState(null);

  const [file, setFile] = useState(null);
  const [idProof, setIdProof] = useState(null);

  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [photoInfo, setPhotoInfo] = useState(null);
  const [idProofInfo, setIdProofInfo] = useState(null);

  const [previewImage, setPreviewImage] = useState(null);

  const { toast, show } = useToast();

  /* ── Delete Account ── */
  const [showDeleteModal, setShowDeleteModal] =
      useState(false);

  const [deleting, setDeleting] = useState(false);

  const [deleteForm, setDeleteForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    reason: "",
    otherReason: "",
    confirmation: "",
  });

  /* ── Language ── */
  const getInitialLanguage = () => {
    const match =
        document.cookie.match(
            /googtrans=\/en\/([a-z]{2})/,
        );

    return match
        ? match[1]
        : localStorage.getItem(
        "preferredLanguage",
    ) || "en";
  };

  const [selectedLang, setSelectedLang] =
      useState(getInitialLanguage());

  const handleLanguageChange = (langValue) => {
    const cookieValue =
        langValue === "en"
            ? "/en/en"
            : `/en/${langValue}`;

    document.cookie =
        `googtrans=${cookieValue}; path=/; max-age=31536000`;

    document.cookie =
        `googtrans=${cookieValue}; path=/; domain=${window.location.hostname}; max-age=31536000`;

    localStorage.setItem(
        "preferredLanguage",
        langValue,
    );

    setSelectedLang(langValue);

    window.location.reload();
  };

  /* ── Load Profile ── */
  useEffect(() => {
    api
        .get("/users/me")
        .then((res) => {
          setProfile(res.data);
        })
        .catch(() => {
          show(
              "Failed to load profile",
              "error",
          );
        })
        .finally(() => {
          setLoading(false);
        });
  }, [show]);

  /* ── Profile Completion ── */
  const completion = profile
      ? [
    profile.name,
    profile.city,
    profile.email,
    profile.profilePicUrl || file,
    profile.idProofUrl || idProof,
  ].filter(Boolean).length * 20
      : 0;

  /* ── Save Profile ── */
  const save = async () => {
    const emailRegex =
        /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(profile.email)) {
      show(
          "Please enter a valid email format (e.g., user@gmail.com)",
          "error",
      );
      return;
    }

    const fd = new FormData();

    fd.append("name", profile.name);
    fd.append("city", profile.city);
    fd.append("email", profile.email);

    if (file) {
      fd.append("profilePic", file);
    }

    if (idProof) {
      fd.append("idProof", idProof);
    }

    setSaving(true);

    try {
      await api.put(
          "/users/me",
          fd,
      );

      const res =
          await api.get("/users/me");

      setProfile(res.data);

      setEditMode(false);

      show(
          "Profile updated successfully!",
          "success",
      );
    } catch {
      show(
          "Failed to update profile",
          "error",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ── Submit Deletion Request ── */
  const submitDeletion = async () => {
    if (!deleteForm.reason) {
      show(
          "Please select a reason for deleting your account.",
          "error",
      );
      return;
    }

    if (
        deleteForm.reason === "Other" &&
        !deleteForm.otherReason.trim()
    ) {
      show(
          "Please specify your reason.",
          "error",
      );
      return;
    }

    if (
        deleteForm.confirmation
            .trim()
            .toUpperCase() !== "DELETE"
    ) {
      show(
          'Please type "DELETE" to confirm.',
          "error",
      );
      return;
    }

    setDeleting(true);

    try {
      await api.post(
          "/users/me/request-deletion",
          deleteForm,
      );

      const res =
          await api.get("/users/me");

      setProfile(res.data);

      show(
          "Deletion request submitted. Your account will be deleted in 7 days.",
          "success",
      );

      setShowDeleteModal(false);

      setDeleteForm({
        fullName: "",
        phone: "",
        email: "",
        reason: "",
        otherReason: "",
        confirmation: "",
      });
    } catch (err) {
      show(
          err.response?.data?.message ||
          "Failed to submit deletion request",
          "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ── Date Parser ── */
  const parseDate = (value) => {
    if (!value) {
      return null;
    }

    if (Array.isArray(value)) {
      const [
        year,
        month,
        day,
        hour = 0,
        minute = 0,
        second = 0,
      ] = value;

      return new Date(
          year,
          month - 1,
          day,
          hour,
          minute,
          second,
      );
    }

    if (
        typeof value === "object" &&
        value.$date
    ) {
      return new Date(value.$date);
    }

    const parsed =
        new Date(value);

    return isNaN(parsed.getTime())
        ? null
        : parsed;
  };

  /* ── Days Remaining ── */
  const daysLeftToDelete = () => {
    const requested =
        parseDate(
            profile?.deletionRequestedAt,
        );

    if (!requested) {
      return null;
    }

    const deadline =
        new Date(
            requested.getTime() +
            7 *
            24 *
            60 *
            60 *
            1000,
        );

    const diff =
        deadline - new Date();

    return Math.max(
        0,
        Math.ceil(
            diff /
            (1000 * 60 * 60 * 24),
        ),
    );
  };

  /* ── Delete Modal ── */
  const deleteModalJsx =
      showDeleteModal && (
          <div
              className="modal-backdrop-custom"
              onClick={() =>
                  !deleting &&
                  setShowDeleteModal(false)
              }
          >
            <div
                className="modal-box"
                style={{
                  maxWidth: "480px",
                }}
                onClick={(e) =>
                    e.stopPropagation()
                }
            >
              <div className="modal-header-custom">
                <h4>
                  Delete Account
                </h4>

                <button
                    className="modal-close"
                    onClick={() =>
                        !deleting &&
                        setShowDeleteModal(false)
                    }
                >
                  ✕
                </button>
              </div>

              <div
                  style={{
                    padding: "8px 4px",
                  }}
              >
                <p
                    style={{
                      color: "#dc2626",
                      fontSize: "13px",
                      marginBottom: "14px",
                    }}
                >
                  This action is permanent.
                  Your account will be deleted
                  after a 7-day grace period.
                </p>

                <label>
                  Full Name
                </label>

                <input
                    className="profile-input"
                    value={deleteForm.fullName}
                    onChange={(e) =>
                        setDeleteForm({
                          ...deleteForm,
                          fullName: e.target.value,
                        })
                    }
                    placeholder="As registered on your account"
                />

                <label>
                  Registered Mobile Number
                </label>

                <input
                    className="profile-input"
                    value={deleteForm.phone}
                    onChange={(e) =>
                        setDeleteForm({
                          ...deleteForm,
                          phone: e.target.value,
                        })
                    }
                />

                <label>
                  Registered Email Address
                </label>

                <input
                    className="profile-input"
                    value={deleteForm.email}
                    onChange={(e) =>
                        setDeleteForm({
                          ...deleteForm,
                          email: e.target.value,
                        })
                    }
                />

                <label>
                  Reason for Deleting Account
                </label>

                <select
                    className="profile-input"
                    value={deleteForm.reason}
                    onChange={(e) =>
                        setDeleteForm({
                          ...deleteForm,
                          reason: e.target.value,
                          otherReason: "",
                        })
                    }
                >
                  <option value="">
                    Select a reason
                  </option>

                  <option value="No longer need this account">
                    No longer need this account
                  </option>

                  <option value="Moving out / No longer require PG accommodation">
                    Moving out / No longer require PG accommodation
                  </option>

                  <option value="Not satisfied with the platform">
                    Not satisfied with the platform
                  </option>

                  <option value="Technical issues with the platform">
                    Technical issues with the platform
                  </option>

                  <option value="Found a better alternative">
                    Found a better alternative
                  </option>

                  <option value="Created an account by mistake">
                    Created an account by mistake
                  </option>

                  <option value="Have multiple accounts">
                    Have multiple accounts
                  </option>

                  <option value="Taking a break from using the platform">
                    Taking a break from using the platform
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>

                {deleteForm.reason ===
                    "Other" && (
                        <>
                          <label>
                            Please specify your reason
                          </label>

                          <textarea
                              className="profile-input"
                              rows={3}
                              value={
                                deleteForm.otherReason
                              }
                              onChange={(e) =>
                                  setDeleteForm({
                                    ...deleteForm,
                                    otherReason:
                                    e.target.value,
                                  })
                              }
                              placeholder="Please write your reason..."
                          />
                        </>
                    )}

                <label>
                  Type "DELETE" to confirm
                </label>

                <input
                    className="profile-input"
                    value={
                      deleteForm.confirmation
                    }
                    onChange={(e) =>
                        setDeleteForm({
                          ...deleteForm,
                          confirmation:
                          e.target.value,
                        })
                    }
                    placeholder="DELETE"
                />

                <div
                    className="profile-actions"
                    style={{
                      marginTop: "16px",
                    }}
                >
                  <button
                      className="profile-save-btn"
                      style={{
                        background: "#dc2626",
                      }}
                      onClick={
                        submitDeletion
                      }
                      disabled={deleting}
                  >
                    {deleting
                        ? "Submitting…"
                        : "Submit Deletion Request"}
                  </button>
                </div>
              </div>
            </div>
          </div>
      );

  /* ── Loading ── */
  if (loading) {
    return (
        <UserLayout>
          Loading...
        </UserLayout>
    );
  }

  /* ── No Profile ── */
  if (!profile) {
    return (
        <UserLayout>
          No profile found
        </UserLayout>
    );
  }

  /* ========================================
     COMPLETED PROFILE VIEW
  ======================================== */
  if (
      profile.profileCompleted &&
      !editMode
  ) {
    return (
        <UserLayout>

          {/* Deletion Pending Banner */}
          {profile.deletionRequested && (
              <div
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 999,
                    background: "#fef2f2",
                    borderBottom:
                        "2px solid #dc2626",
                    color: "#991b1b",
                    padding: "12px 20px",
                    textAlign: "center",
                    fontSize: "14px",
                  }}
              >
                <strong>
                  Account Deletion Pending:
                </strong>{" "}
                Your account will be permanently
                deleted in{" "}
                <strong>
                  {daysLeftToDelete()} day(s)
                </strong>
                . You can continue using your
                account during the grace period.
                {" "}
                <a
                    href="mailto:support.pgmate@gmail.com"
                    style={{
                      color: "#991b1b",
                      textDecoration:
                          "underline",
                      fontWeight: 600,
                    }}
                >
                  Contact Admin
                </a>
              </div>
          )}

          <div className="profile-container">
            <div className="profile-card">

              {/* Header */}
              <div className="pv-header">

                <img
                    className="pv-avatar"
                    src={
                      file
                          ? URL.createObjectURL(
                              file,
                          )
                          : profile.profilePicUrl ||
                          "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                    alt="User"
                />

                <div className="pv-info">
                  <div className="pv-name">
                    {profile.name}
                  </div>

                  <div className="pv-role">
                    User
                  </div>

                  <div className="pv-since">
                    Member since{" "}
                    {new Date(
                        profile.createdAt ||
                        Date.now(),
                    ).getFullYear()}
                  </div>
                </div>

                <svg
                    width="72"
                    height="72"
                    viewBox="0 0 72 72"
                >
                  <circle
                      cx="36"
                      cy="36"
                      r="30"
                      fill="none"
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth="6"
                  />

                  <circle
                      cx="36"
                      cy="36"
                      r="30"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="6"
                      strokeDasharray={188.5}
                      strokeDashoffset={
                          188.5 -
                          (188.5 *
                              completion) /
                          100
                      }
                      strokeLinecap="round"
                      transform="rotate(-90 36 36)"
                  />

                  <text
                      x="36"
                      y="41"
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="700"
                      fill="#ffffff"
                  >
                    {completion}%
                  </text>
                </svg>
              </div>

              {/* Personal Info */}
              <div className="pv-section">
                <div className="pv-section-head">
                <span className="pv-section-title">
                  Personal Info
                </span>

                  <button
                      className="pv-edit-btn"
                      onClick={() =>
                          setEditMode(true)
                      }
                  >
                    ✏ Edit
                  </button>
                </div>

                <div className="pv-fields">

                  <div className="pv-field">
                  <span className="pv-field-label">
                    Full Name
                  </span>

                    <span className="pv-field-val">
                    {profile.name}
                  </span>
                  </div>

                  <div className="pv-field">
                  <span className="pv-field-label">
                    Email
                  </span>

                    <span className="pv-field-val">
                    {profile.email}
                  </span>
                  </div>

                  <div className="pv-field">
                  <span className="pv-field-label">
                    Phone
                  </span>

                    <span className="pv-field-val">
                    {profile.phone}
                  </span>
                  </div>

                  <div className="pv-field">
                  <span className="pv-field-label">
                    City
                  </span>

                    <span className="pv-field-val">
                    {profile.city}
                  </span>
                  </div>

                </div>
              </div>

              {/* Preferences */}
              <div
                  className="pv-section"
                  style={{
                    marginTop: "20px",
                  }}
              >
                <div className="pv-section-head">
                <span
                    className="pv-section-title"
                    style={{
                      display: "flex",
                      alignItems:
                          "center",
                      gap: "8px",
                    }}
                >
                  <img
                      src={languageIcon}
                      alt="lang"
                      style={{
                        width: "18px",
                        height: "18px",
                      }}
                  />

                  Preferences
                </span>
                </div>

                <div className="pv-fields">
                  <div className="pv-field">
                  <span className="pv-field-label">
                    Language
                  </span>

                    <select
                        value={
                          selectedLang
                        }
                        onChange={(e) =>
                            handleLanguageChange(
                                e.target.value,
                            )
                        }
                        className="profile-input"
                        style={{
                          padding:
                              "4px 8px",
                          fontSize:
                              "14px",
                          border:
                              "1px solid #dbe3ee",
                          borderRadius:
                              "6px",
                          outline: "none",
                          width:
                              "fit-content",
                          fontFamily:
                              "inherit",
                        }}
                    >
                      {LANGUAGES.map(
                          (lang) => (
                              <option
                                  key={
                                    lang.value
                                  }
                                  value={
                                    lang.value
                                  }
                              >
                                {lang.label}
                              </option>
                          ),
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pv-section">
                <div className="pv-section-head">
                <span
                    className="pv-section-title"
                    style={{
                      color: "#dc2626",
                    }}
                >
                  Danger Zone
                </span>
                </div>

                {/* If deletion already requested */}
                {profile.deletionRequested ? (
                    <div
                        style={{
                          background:
                              "#fef2f2",
                          border:
                              "1px solid #fecaca",
                          borderRadius:
                              "10px",
                          padding:
                              "14px 16px",
                          color:
                              "#991b1b",
                          fontSize:
                              "13px",
                        }}
                    >
                      <strong>
                        Deletion Request Pending
                      </strong>

                      <div
                          style={{
                            marginTop:
                                "5px",
                          }}
                      >
                        Your deletion request
                        has already been submitted.
                        Your account will be
                        permanently deleted in{" "}
                        <strong>
                          {
                            daysLeftToDelete()
                          }{" "}
                          day(s)
                        </strong>.
                      </div>
                    </div>
                ) : (
                    <>
                      <p
                          style={{
                            color:
                                "#64748b",
                            fontSize:
                                "13px",
                            marginBottom:
                                "10px",
                          }}
                      >
                        Deleting your account
                        is permanent. You'll
                        have 7 days to change
                        your mind before it's
                        finalized.
                      </p>

                      <button
                          className="pv-edit-btn"
                          style={{
                            background:
                                "#dc2626",
                            color: "#fff",
                          }}
                          onClick={() => {
                            setDeleteForm({
                              fullName:
                                  profile.name ||
                                  "",
                              phone:
                                  profile.phone ||
                                  "",
                              email:
                                  profile.email ||
                                  "",
                              reason: "",
                              otherReason:
                                  "",
                              confirmation:
                                  "",
                            });

                            setShowDeleteModal(
                                true,
                            );
                          }}
                      >
                        Delete Account
                      </button>
                    </>
                )}
              </div>

            </div>
          </div>

          {/* Toast */}
          {toast && (
              <div
                  className={`profile-toast profile-toast--${toast.type}`}
              >
            <span className="profile-toast-icon">
              {toast.type ===
              "success"
                  ? "✓"
                  : "✕"}
            </span>

                {toast.msg}
              </div>
          )}

          {deleteModalJsx}

        </UserLayout>
    );
  }

  /* ========================================
     PROFILE EDIT / INCOMPLETE VIEW
  ======================================== */
  return (
      <UserLayout>

        {profile.deletionRequested && (
            <div
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 999,
                  background: "#fef2f2",
                  borderBottom:
                      "2px solid #dc2626",
                  color: "#991b1b",
                  padding: "12px 20px",
                  textAlign: "center",
                  fontSize: "14px",
                }}
            >
              <strong>
                Account Deletion Pending:
              </strong>{" "}
              Your account will be permanently
              deleted in{" "}
              <strong>
                {daysLeftToDelete()} day(s)
              </strong>
              .{" "}
              <a
                  href="mailto:support.pgmate@gmail.com"
                  style={{
                    color: "#991b1b",
                    textDecoration:
                        "underline",
                    fontWeight: 600,
                  }}
              >
                Contact Admin
              </a>
            </div>
        )}

        <div className="profile-container">
          <div className="profile-card">

            {/* Avatar */}
            <div className="profile-avatar-wrap">

              <img
                  className="profile-avatar"
                  src={
                    file
                        ? URL.createObjectURL(
                            file,
                        )
                        : profile.profilePicUrl ||
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  }
                  alt="User"
              />

              {completion === 100 && (
                  <span
                      className="profile-verified-dot"
                      title="Profile complete"
                  >
                ✓
              </span>
              )}
            </div>

            <div className="profile-name">
              {profile.profileCompleted
                  ? profile.name
                  : "Complete Your Profile"}
            </div>

            <div className="profile-subtitle">
              {profile.profileCompleted
                  ? "Edit your details below"
                  : "Fill in all fields to continue"}
            </div>

            <div className="profile-role">
              User
            </div>

            {/* Completion */}
            <div className="profile-completion warning">

              <div className="profile-completion-row">
              <span>
                Profile complete
              </span>

                <span
                    className={
                      completion === 100
                          ? "completion-pct done"
                          : "completion-pct"
                    }
                >
                {completion === 100
                    ? "✓ 100%"
                    : `${completion}%`}
              </span>
              </div>

              <div className="profile-progress">
                <div
                    className="profile-progress-bar"
                    style={{
                      width:
                          `${completion}%`,
                    }}
                />
              </div>

              {completion < 100 && (
                  <span className="completion-warning">
                Complete all fields to
                continue
              </span>
              )}
            </div>

            {/* Form */}
            <div className="profile-section">

              <label>
                Name
              </label>

              <input
                  className="profile-input"
                  value={
                      profile.name || ""
                  }
                  onChange={(e) =>
                      setProfile({
                        ...profile,
                        name:
                        e.target.value,
                      })
                  }
              />

              <label>
                Phone
              </label>

              <input
                  className="profile-input"
                  value={
                      profile.phone || ""
                  }
                  disabled
              />

              <label>
                Email
              </label>

              <input
                  className="profile-input"
                  value={
                      profile.email || ""
                  }
                  onChange={(e) =>
                      setProfile({
                        ...profile,
                        email:
                        e.target.value,
                      })
                  }
              />

              <label>
                City
              </label>

              <input
                  className="profile-input"
                  value={
                      profile.city || ""
                  }
                  onChange={(e) =>
                      setProfile({
                        ...profile,
                        city:
                        e.target.value,
                      })
                  }
              />

              {/* Profile Photo */}
              <label className="file-upload">

                <input
                    type="file"
                    onChange={(e) => {
                      const f =
                          e.target.files[0];

                      setFile(f);

                      if (f) {
                        setPhotoInfo({
                          name: f.name,
                          size: (
                              f.size /
                              1024
                          ).toFixed(1),
                        });
                      }
                    }}
                />

                <span>
                <i className="bi bi-upload" />
                Upload Profile Photo
              </span>

              </label>

              {photoInfo && (
                  <div className="file-meta">
                    {photoInfo.name} (
                    {photoInfo.size} KB)
                  </div>
              )}

              {profile.profilePicUrl && (
                  <>
                    <p
                        style={{
                          color: "green",
                          fontSize:
                              "13px",
                          marginTop:
                              "4px",
                        }}
                    >
                      ✔ Profile picture uploaded
                    </p>

                    <span
                        className="current-file-link"
                        onClick={() =>
                            setPreviewImage(
                                profile.profilePicUrl,
                            )
                        }
                    >
                  View Photo
                </span>

                    <p
                        style={{
                          color: "#666",
                          fontSize:
                              "12px",
                        }}
                    >
                      You can re-upload if
                      needed
                    </p>
                  </>
              )}

              {/* ID Proof */}
              <label className="file-upload">

                <input
                    type="file"
                    onChange={(e) => {
                      const f =
                          e.target.files[0];

                      setIdProof(f);

                      if (f) {
                        setIdProofInfo({
                          name: f.name,
                          size: (
                              f.size /
                              1024
                          ).toFixed(1),
                        });
                      }
                    }}
                />

                <span>
                <i className="bi bi-file-earmark-arrow-up" />
                Upload ID Proof
              </span>

              </label>

              {idProofInfo && (
                  <div className="file-meta">
                    {idProofInfo.name} (
                    {idProofInfo.size} KB)
                  </div>
              )}

              {profile.idProofUrl && (
                  <>
                    <p
                        style={{
                          color: "green",
                          fontSize:
                              "13px",
                          marginTop:
                              "4px",
                        }}
                    >
                      ✔ ID proof uploaded
                    </p>

                    <span
                        className="current-file-link"
                        onClick={() =>
                            setPreviewImage(
                                profile.idProofUrl,
                            )
                        }
                    >
                  View ID Proof
                </span>

                    <p
                        style={{
                          color: "#666",
                          fontSize:
                              "12px",
                        }}
                    >
                      You can re-upload if
                      needed
                    </p>
                  </>
              )}

              {/* Preferences */}
              <div
                  style={{
                    marginTop: "24px",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems:
                        "center",
                    gap: "8px",
                    fontWeight: "600",
                    color: "#1e293b",
                  }}
              >
                <img
                    src={languageIcon}
                    alt="lang"
                    style={{
                      width: "18px",
                      height: "18px",
                    }}
                />

                Preferences
              </div>

              <label>
                Language Preference
              </label>

              <select
                  className="profile-input"
                  value={selectedLang}
                  onChange={(e) =>
                      handleLanguageChange(
                          e.target.value,
                      )
                  }
              >
                {LANGUAGES.map(
                    (lang) => (
                        <option
                            key={lang.value}
                            value={lang.value}
                        >
                          {lang.label}
                        </option>
                    ),
                )}
              </select>

            </div>

            {/* Save Button */}
            <div className="profile-actions">

              <button
                  className={`profile-save-btn${
                      saving
                          ? " profile-save-btn--saving"
                          : ""
                  }`}
                  onClick={save}
                  disabled={
                      completion < 100 ||
                      saving
                  }
              >
                {saving ? (
                    <>
                      <span className="profile-save-spinner" />
                      Saving…
                    </>
                ) : (
                    "Save Changes"
                )}
              </button>

            </div>

          </div>
        </div>

        {/* Preview Modal */}
        {previewImage && (
            <div
                className="modal-backdrop-custom"
                onClick={() =>
                    setPreviewImage(null)
                }
            >
              <div
                  className="modal-box"
                  style={{
                    maxWidth: "900px",
                  }}
                  onClick={(e) =>
                      e.stopPropagation()
                  }
              >
                <div className="modal-header-custom">

                  <h4>
                    Document Preview
                  </h4>

                  <button
                      className="modal-close"
                      onClick={() =>
                          setPreviewImage(null)
                      }
                  >
                    ✕
                  </button>

                </div>

                <div className="text-center">

                  {previewImage
                      ?.toLowerCase()
                      .endsWith(".pdf") ? (
                      <iframe
                          src={previewImage}
                          title="Document"
                          width="100%"
                          height="500px"
                          style={{
                            border: "none",
                          }}
                      />
                  ) : (
                      <img
                          src={previewImage}
                          alt="Preview"
                          style={{
                            maxWidth: "100%",
                            maxHeight:
                                "500px",
                            borderRadius:
                                "8px",
                          }}
                      />
                  )}

                </div>
              </div>
            </div>
        )}

        {/* Toast */}
        {toast && (
            <div
                className={`profile-toast profile-toast--${toast.type}`}
            >
          <span className="profile-toast-icon">
            {toast.type === "success"
                ? "✓"
                : "✕"}
          </span>

              {toast.msg}
            </div>
        )}

        {deleteModalJsx}

      </UserLayout>
  );
};

export default Profile;