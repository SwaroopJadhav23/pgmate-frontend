import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/axios";
import HomeLayout from "../layouts/HomeLayouts";
import "./profile.css";

const getOwnerProfileCompletion = (profile) => {
  if (!profile) return 0;

  const fields = [
    profile.name,
    profile.email,
    profile.city,
    profile.photoUrl,
    profile.idProofUrl,
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
  ];
};

const CompletionPrompt = ({ completion, checklist, onClose }) => (
  <div className="owner-profile-prompt-overlay" onClick={onClose}>
    <div
      className="owner-profile-prompt-modal"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="owner-profile-prompt-title"
    >
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
          <div
            key={item.key}
            className={`owner-profile-prompt-item ${item.complete ? "is-done" : "is-missing"}`}
          >
            <i className={`bi ${item.complete ? "bi-check-circle-fill" : "bi-exclamation-circle-fill"}`}></i>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <button className="owner-profile-prompt-btn" onClick={onClose}>
        Complete Profile
      </button>
    </div>
  </div>
);

const OwnerProfile = () => {
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [idProof, setIdProof] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false);

  const completion = useMemo(() => Math.round(getOwnerProfileCompletion(profile)), [profile]);
  const checklist = useMemo(() => getOwnerProfileChecklist(profile), [profile]);

  useEffect(() => {
    api
      .get("/owner/profile")
      .then((res) => {
        const data = res.data || null;
        setProfile(data);
        const incomplete = getOwnerProfileCompletion(data) < 100;
        if ((location.state?.profileSetupRequired || incomplete) && incomplete) {
          setShowCompletionPrompt(true);
        }
      })
      .catch(() => alert("Failed to load owner profile"))
      .finally(() => setLoading(false));
  }, [location.state]);

  const save = async () => {
    const fd = new FormData();
    fd.append("name", profile.name || "");
    fd.append("email", profile.email || "");
    fd.append("city", profile.city || "");
    if (photo) fd.append("photo", photo);
    if (idProof) fd.append("idProof", idProof);

    try {
      await api.put("/owner/profile", fd);
      const res = await api.get("/owner/profile");
      const updatedProfile = res.data || null;
      setProfile(updatedProfile);
      localStorage.setItem("ownerProfile", JSON.stringify(updatedProfile));
      if (getOwnerProfileCompletion(updatedProfile) >= 100) {
        setShowCompletionPrompt(false);
      }
      alert("Profile updated successfully");
      setEditMode(false);
    } catch {
      alert("Failed to update profile");
    }
  };

  if (loading) return <HomeLayout>Loading...</HomeLayout>;
  if (!profile) return <HomeLayout>No profile found</HomeLayout>;

  if (!editMode) {
    return (
      <>
        <HomeLayout>
          <div className="profile-container">
            <div className="profile-card">
              <img
                className="profile-avatar"
                src={profile.photoUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                alt="Owner"
              />

              <div className="profile-name">{profile.name}</div>
              <div className="profile-role">PG Owner</div>

              <div className="profile-view">
                <p><b>Email:</b> {profile.email}</p>
                <p><b>Phone:</b> {profile.phone}</p>
                <p><b>City:</b> {profile.city}</p>

                {profile.idProofUrl && (
                  <p>
                    <b>ID Proof:</b>{" "}
                    <a href={profile.idProofUrl} target="_blank" rel="noreferrer">
                      View Document
                    </a>
                  </p>
                )}
              </div>

              <div className="profile-actions">
                <button className="btn btn-outline-primary w-100" onClick={() => setEditMode(true)}>
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </HomeLayout>

        {showCompletionPrompt && completion < 100 && (
          <CompletionPrompt
            completion={completion}
            checklist={checklist}
            onClose={() => setShowCompletionPrompt(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <HomeLayout>
        <div className="profile-container">
          <div className="profile-card">
            <img
              className="profile-avatar"
              src={profile.photoUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
              alt="Owner"
            />

            <div className="profile-name">Edit Profile</div>
            <div className="profile-role">PG Owner</div>

            <div className="profile-section">
              <label>Name</label>
              <input
                className="form-control"
                value={profile.name || ""}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />

              <label>Phone</label>
              <input className="form-control" value={profile.phone || ""} disabled />

              <label>Email</label>
              <input
                className="form-control"
                value={profile.email || ""}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />

              <label>City</label>
              <input
                className="form-control"
                value={profile.city || ""}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              />

              <label>Profile Photo</label>
              <input
                type="file"
                className="form-control"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />

              <label>ID Proof</label>
              <input
                type="file"
                className="form-control"
                onChange={(e) => setIdProof(e.target.files?.[0] || null)}
              />
            </div>

            <div className="profile-actions">
              <button className="btn btn-primary w-100" onClick={save}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </HomeLayout>

      {showCompletionPrompt && completion < 100 && (
        <CompletionPrompt
          completion={completion}
          checklist={checklist}
          onClose={() => setShowCompletionPrompt(false)}
        />
      )}
    </>
  );
};

export default OwnerProfile;
