import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import UserLayout from "../../layouts/UserLayout";
import Swal from "sweetalert2";
import "./MyComplaints.css";

const CATEGORIES = ["MAINTENANCE", "NOISE", "CLEANLINESS", "BEHAVIOR", "BILLING", "OTHER"];

const STATUS_COLOR = {
  PENDING: { bg: "#fef9c3", color: "#92400e" },
  IN_PROGRESS: { bg: "#dbeafe", color: "#1d4ed8" },
  RESOLVED: { bg: "#dcfce7", color: "#166534" },
};

/* ---- Inline icon components (no external deps) ---- */
const IconBase = ({ children, size = 14, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mc-icon-base"
    {...props}
  >
    {children}
  </svg>
);

const WrenchIcon = (props) => (
  <IconBase {...props}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </IconBase>
);

const NoiseIcon = (props) => (
  <IconBase {...props}>
    <path d="M11 5 6 9H2v6h4l5 4z" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </IconBase>
);

const CleanlinessIcon = (props) => (
  <IconBase {...props}>
    <path d="m19.9 4.1-8 8" />
    <path d="M14.5 4.5 12 7l3 3 2.5-2.5a2.12 2.12 0 0 0-3-3Z" />
    <path d="M4 20c1.5-1.5 2-3 2-5a4 4 0 0 1 4-4c2 0 3 1 3 3s-1.5 2.5-3 3-3.5 1.5-5 5" />
  </IconBase>
);

const BehaviorIcon = (props) => (
  <IconBase {...props}>
    <path d="M11 21H5a2 2 0 0 1-2-2v-1a4 4 0 0 1 4-4h3" />
    <circle cx="9" cy="7" r="4" />
    <path d="m17 13 2 2 4-4" />
  </IconBase>
);

const BillingIcon = (props) => (
  <IconBase {...props}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </IconBase>
);

const FileTextIcon = (props) => (
  <IconBase {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
  </IconBase>
);

const AlertTriangleIcon = (props) => (
  <IconBase {...props}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </IconBase>
);

const XIcon = (props) => (
  <IconBase {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </IconBase>
);

const HomeIcon = (props) => (
  <IconBase {...props}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M9 22V12h6v10" />
  </IconBase>
);

const LightbulbIcon = (props) => (
  <IconBase {...props}>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5A5.5 5.5 0 1 0 6 8.5c0 1.5.5 2.5 1.5 3.5S9 14 9 14" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </IconBase>
);

const InboxIcon = (props) => (
  <IconBase {...props}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
  </IconBase>
);

const ImageIcon = (props) => (
  <IconBase {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
  </IconBase>
);

const PaperclipIcon = (props) => (
  <IconBase {...props}>
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </IconBase>
);

const CATEGORY_ICON = {
  MAINTENANCE: <WrenchIcon />,
  NOISE: <NoiseIcon />,
  CLEANLINESS: <CleanlinessIcon />,
  BEHAVIOR: <BehaviorIcon />,
  BILLING: <BillingIcon />,
  OTHER: <FileTextIcon />,
};

const MyComplaints = () => {
  const [searchParams] = useSearchParams();
  const pgId = searchParams.get("pgId") || "";
  const pgName = searchParams.get("pgName") || "";

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDesc, setExpandedDesc] = useState({});
  const [showForm, setShowForm] = useState(!!pgId);
  const [form, setForm] = useState({
    pgId, pgName, category: "MAINTENANCE", subject: "", description: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [viewingImages, setViewingImages] = useState(null);
  const [hasActivePg, setHasActivePg] = useState(true); // assume true until we know otherwise

  const fetchComplaints = () => {
    setLoading(true);
    api.get("/complaints/my")
      .then((res) => setComplaints(res.data || []))
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComplaints(); }, []);

  useEffect(() => {
    api.get("/complaints/my/active-pgs")
      .then((res) => {
        const data = res.data || [];
        setHasActivePg(data.length > 0);
        if (data.length > 0) {
          setForm((prev) => ({ ...prev, pgId: data[0].id, pgName: data[0].name }));
        }
      })
      .catch(() => { });
  }, []);

  const handleSubmit = async () => {
    if (!form.pgId) {
      Swal.fire({ icon: "warning", title: "Please select a PG", text: "Type and choose a PG from the suggestions" });
      return;
    }
    if (!form.subject.trim() || !form.description.trim()) {
      Swal.fire({ icon: "warning", title: "Please fill all fields" });
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("pgId", form.pgId || "");
      formData.append("pgName", form.pgName);
      formData.append("category", form.category);
      formData.append("subject", form.subject);
      formData.append("description", form.description);
      images.forEach((img) => formData.append("images", img));

      await api.post("/complaints", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      Swal.fire({ icon: "success", title: "Complaint submitted!", timer: 2000, showConfirmButton: false });
      setShowForm(false);
      setForm({ pgId: "", pgName: "", category: "MAINTENANCE", subject: "", description: "" });
      setImages([]);
      setImagePreviews([]);
      fetchComplaints();
    } catch {
      // handled by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <UserLayout hideWelcome>
      <main className="mc-main">

        {/* ── Header ── */}
        <div className="mc-header">
          <div>
            <h2><AlertTriangleIcon size={20} /> My Complaints</h2>
            <p>Track complaints you've raised</p>
          </div>
          <span className="mc-new-btn-wrap">
            <button
              className={`mc-new-btn ${showForm ? "mc-btn-new-cancel" : "mc-btn-new-create"}`}
              onClick={() => hasActivePg && setShowForm(!showForm)}
              disabled={!hasActivePg && !showForm}
            >
              {showForm ? (<><XIcon size={12} /> Cancel</>) : (<><span>+</span> New Complaint</>)}
            </button>
            {!hasActivePg && !showForm && (
              <span className="mc-new-btn-tooltip">
                You need to book a PG or bed before you can raise a complaint
              </span>
            )}
          </span>
        </div>

        {/* ── Complaint Form ── */}
        {showForm && (
          <div className="mc-form-card">
            <div className="mc-form-header">
              <div className="mc-form-icon-wrap">
                <AlertTriangleIcon size={18} />
              </div>
              <h3 className="mc-form-title">Raise a Complaint</h3>
            </div>


            {/* PG Name */}
            <div>
              <label className="mc-label">PG Name</label>
              <div className="mc-pg-name-input">
                <HomeIcon size={14} /> {form.pgName || "Loading..."}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="mc-label">Category *</label>
              <select className="mc-input" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Subject */}
            <label className="mc-label">Subject *</label>
            <input className="mc-input" placeholder="Brief subject of your complaint" value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })} />

            {/* Image Upload */}
            <label className="mc-label">Attach Images (optional)</label>
            <input
              type="file" accept="image/*" multiple
              className="mc-input mc-file-input"
              onChange={(e) => {
                const files = Array.from(e.target.files);
                setImages(files);
                setImagePreviews(files.map((f) => URL.createObjectURL(f)));
              }}
            />
            {imagePreviews.length > 0 && (
              <div className="mc-img-previews">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="mc-img-preview-wrap">
                    <img src={src} alt="" className="mc-img-preview" />
                    <button
                      onClick={() => {
                        setImages(images.filter((_, idx) => idx !== i));
                        setImagePreviews(imagePreviews.filter((_, idx) => idx !== i));
                      }}
                      className="mc-img-remove-btn"
                    ><XIcon size={10} /></button>
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <label className="mc-label">Description *</label>
            <textarea rows={3} className="mc-input mc-textarea"
              placeholder="Describe your issue clearly — include what happened, when it started, and how it's affecting you…"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

            <div className="mc-form-tip">
              <LightbulbIcon size={14} className="mc-tip-icon" /> <span><strong>Tip:</strong> Be specific in your description. Mention the exact location, time of issue, and any previous attempts to resolve it.</span>
            </div>

            <button onClick={handleSubmit} disabled={submitting} className="mc-submit-btn">
              {submitting ? "Submitting…" : "Submit Complaint"}
            </button>
          </div>
        )}

        {/* ── Complaints List ── */}
        {loading ? (
          <p className="mc-table-empty">Loading complaints…</p>
        ) : complaints.length === 0 ? (
          <div className="mc-table-empty-lg">
            <div className="mc-empty-icon"><InboxIcon size={40} /></div>
            <p>No complaints raised yet</p>
          </div>
        ) : (
          <>
            {/* ── DESKTOP TABLE ── */}
            <div className="mc-table mc-table-container">
              <div className="mc-table-head">
                {["SUBJECT", "PG NAME", "CATEGORY", "FILED", "STATUS"].map((h) => (
                  <div key={h}>{h}</div>
                ))}
              </div>

              {complaints.map((c, idx) => {
                const sc = STATUS_COLOR[c.status] || STATUS_COLOR.PENDING;
                const icon = CATEGORY_ICON[c.category] || <FileTextIcon />;
                const isAdminNote = c.ownerResponse?.startsWith("[ADMIN NOTE]");
                return (
                  <div key={c.id}>
                    <div className="mc-table-row" style={{ background: idx % 2 === 0 ? "#fff" : "#f8fafc" }}>
                      <div>
                        <p className="mc-table-subject">{c.subject}</p>
                        <p className="mc-table-desc">
                          {expandedDesc[c.id]
                            ? c.description
                            : c.description?.length > 60
                              ? c.description.slice(0, 60) + "…"
                              : c.description}
                          {c.description?.length > 60 && (
                            <span
                              onClick={() => setExpandedDesc((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}
                              className="mc-read-toggle"
                            >
                              {expandedDesc[c.id] ? "Read less" : "Read more"}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="mc-table-pg"><HomeIcon size={13} /> {c.pgName}</div>
                      <div>
                        <span className="mc-icon-inline mc-cat-pill">
                          {icon} {c.category}
                        </span>
                      </div>
                      <div className="mc-table-date">{c.createdAt}</div>
                      <div className="mc-table-actions">
                        <span className="mc-status-pill" style={{ background: sc.bg, color: sc.color }}>
                          {c.status}
                        </span>
                        {c.imageUrls?.length > 0 && (
                          <button
                            onClick={() => setViewingImages(c.imageUrls)}
                            className="mc-action-btn"
                          >
                            <ImageIcon size={12} /> View {c.imageUrls.length} Image{c.imageUrls.length > 1 ? "s" : ""}
                          </button>
                        )}
                      </div>
                    </div>

                    {c.ownerResponse && (
                      <div className="mc-note-row" style={{ background: idx % 2 === 0 ? "#fff" : "#f8fafc" }}>
                        <div className="mc-note-box" style={{
                          background: isAdminNote ? "#fef9c3" : "#f0fdf4",
                          borderLeft: isAdminNote ? "3px solid #f59e0b" : "3px solid #22c55e"
                        }}>
                          <p className="mc-note-title" style={{ color: isAdminNote ? "#92400e" : "#166534" }}>
                            {isAdminNote ? (<><AlertTriangleIcon size={11} /> Admin Note</>) : "Owner Response"}
                          </p>
                          <p className="mc-note-text" style={{ color: isAdminNote ? "#92400e" : "#166534" }}>
                            {c.ownerResponse.replace("[ADMIN NOTE] ", "")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── MOBILE CARD LIST ── */}
            <div className="mc-card-list">
              {complaints.map((c, idx) => {
                const sc = STATUS_COLOR[c.status] || STATUS_COLOR.PENDING;
                const icon = CATEGORY_ICON[c.category] || <FileTextIcon />;
                const isAdminNote = c.ownerResponse?.startsWith("[ADMIN NOTE]");
                const DESC_LIMIT = 100;
                const isExpanded = expandedDesc[c.id];

                return (
                  <div className="mc-card" key={c.id}>
                    {/* Card Header */}
                    <div className="mc-card-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="mc-card-subject">{c.subject}</p>
                        <span className="mc-icon-inline mc-cat-pill">
                          {icon} {c.category}
                        </span>
                      </div>
                      <span className="mc-status-pill" style={{ background: sc.bg, color: sc.color }}>
                        {c.status.replace("_", " ")}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="mc-card-body">
                      <div className="mc-card-row">
                        <span className="mc-card-label">PG</span>
                        <span className="mc-card-val mc-icon-inline mc-card-pg"><HomeIcon size={13} /> {c.pgName}</span>
                      </div>
                      <div className="mc-card-row">
                        <span className="mc-card-label">Filed</span>
                        <span className="mc-card-val mc-card-date">{c.createdAt}</span>
                      </div>
                      {c.description && (
                        <div className="mc-card-row">
                          <span className="mc-card-label">Details</span>
                          <span className="mc-card-val mc-card-desc">
                            {isExpanded
                              ? c.description
                              : c.description.length > DESC_LIMIT
                                ? c.description.slice(0, DESC_LIMIT) + "…"
                                : c.description}
                            {c.description.length > DESC_LIMIT && (
                              <span
                                onClick={() => setExpandedDesc((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}
                                className="mc-read-toggle"
                              >
                                {isExpanded ? "Read less" : "Read more"}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {c.imageUrls?.length > 0 && (
                        <div>
                          <button
                            onClick={() => setViewingImages(c.imageUrls)}
                            className="mc-action-btn"
                          >
                            <ImageIcon size={12} /> View {c.imageUrls.length} Image{c.imageUrls.length > 1 ? "s" : ""}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Owner / Admin response */}
                    {c.ownerResponse && (
                      <div className="mc-card-footer">
                        <div className="mc-note-box" style={{
                          background: isAdminNote ? "#fef9c3" : "#f0fdf4",
                          borderLeft: isAdminNote ? "3px solid #f59e0b" : "3px solid #22c55e"
                        }}>
                          <p className="mc-note-title" style={{ color: isAdminNote ? "#92400e" : "#166534" }}>
                            {isAdminNote ? (<><AlertTriangleIcon size={11} /> Admin Note</>) : "Owner Response"}
                          </p>
                          <p className="mc-note-text" style={{ color: isAdminNote ? "#92400e" : "#166534" }}>
                            {c.ownerResponse.replace("[ADMIN NOTE] ", "")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Image Viewer Modal ── */}
        {viewingImages && (
          <div className="mc-modal-overlay" onClick={() => setViewingImages(null)}>
            <div className="mc-modal-popup" onClick={(e) => e.stopPropagation()}>
              <div className="mc-modal-popup-header">
                <h3 className="mc-modal-popup-title"><PaperclipIcon size={15} /> Complaint Images</h3>
                <button onClick={() => setViewingImages(null)} className="mc-modal-popup-close">
                  <XIcon size={12} /> Close
                </button>
              </div>
              <div className="mc-modal-images">
                {viewingImages.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`complaint-img-${i + 1}`}
                    onClick={() => window.open(url, "_blank")}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </UserLayout>
  );
};



export default MyComplaints;