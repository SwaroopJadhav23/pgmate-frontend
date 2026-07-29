import { useEffect, useState, useRef } from "react";
import api from "../../api/axios";
import Swal from "sweetalert2";
import SortableImageGrid from "../../components/Sortableimagegrid";
import "./ReviewSection.css";

/* ── toast mixin ── */
const reviewToast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

/* ── category config ── */
const CAT_CONFIG = [
  { key: "cleanlinessRating", label: "Cleanliness", color: "#ef4444" },
  { key: "securityRating", label: "Security", color: "#22c55e" },
  { key: "roomConditionRating", label: "Room Condition", color: "#5B5BD6" },
  { key: "managementRating", label: "Management", color: "#a78bfa" },
  { key: "waterSupplyRating", label: "Water Supply", color: "#3b82f6" },
];

/* ── helpers ── */
function StarDisplay({ rating, size = 13 }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{ color: n <= rating ? "#f59e0b" : "#d1d5db", fontSize: size }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function CatBars({ review, cols = 2 }) {
  return (
    <div className={`rs-cat-grid rs-cat-cols-${cols}`}>
      {CAT_CONFIG.map((c) => (
        <div className="rs-bar-row" key={c.key}>
          <span className="rs-bar-label">{c.label}</span>
          <div className="rs-bar-bg">
            <div
              className="rs-bar-fill"
              style={{
                width: `${((review[c.key] || 0) / 5) * 100}%`,
                background: c.color,
              }}
            />
          </div>
          <span className="rs-bar-val">{review[c.key] || 0}</span>
        </div>
      ))}
    </div>
  );
}

function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "#5B5BD6", "#0891b2", "#059669", "#be185d", "#d97706", "#7c3aed",
];
function avatarColor(name = "") {
  let h = 0;
  for (const c of name) h = c.charCodeAt(0) + h;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

/* ═══════════════════════════════════════════════════
   REVIEW CARD (horizontal strip)
═══════════════════════════════════════════════════ */
function ReviewCard({ r, onClick }) {
  return (
    <div className="rs-card" onClick={onClick}>
      <div className="rs-card-top">
        <div
          className="rs-avatar"
          style={{ background: avatarColor(r.userName) }}
        >
          {r.userPhoto ? (
            <img src={r.userPhoto} alt={r.userName} />
          ) : (
            getInitials(r.userName)
          )}
        </div>
        <div className="rs-card-meta">
          <span className="rs-card-name">{r.userName}</span>
          <StarDisplay rating={r.rating} />
        </div>
      </div>
      <p className="rs-card-comment">"{r.comment}"</p>
      {r.imageUrls?.length > 0 && (
        <div className="rs-card-imgs">
          {r.imageUrls.slice(0, 2).map((url, i) => (
            <img key={i} src={url} alt="" className="rs-card-thumb" />
          ))}
          {r.imageUrls.length > 2 && (
            <div className="rs-card-thumb rs-card-more">
              +{r.imageUrls.length - 2}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MY REVIEW CARD
═══════════════════════════════════════════════════ */
function MyReviewCard({ r, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="rs-my-card">
      <div className="rs-my-card-header">
        <div
          className="rs-avatar"
          style={{ background: avatarColor(r.userName) }}
        >
          {r.userPhoto ? (
            <img src={r.userPhoto} alt={r.userName} />
          ) : (
            getInitials(r.userName)
          )}
        </div>
        <div className="rs-card-meta">
          <span className="rs-card-name">
            {r.userName}{" "}
            <span className="rs-you-tag">(You)</span>
          </span>
          <StarDisplay rating={r.rating} />
        </div>
        <div className="rs-menu-wrap" ref={menuRef}>
          <button
            className="rs-three-dot"
            onClick={() => setMenuOpen((p) => !p)}
            aria-label="Review options"
          >
            ⋮
          </button>
          {menuOpen && (
            <div className="rs-dropdown">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
              >
                <i className="bi bi-pencil" /> Edit review
              </button>
              <button
                className="rs-dropdown-del"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
              >
                <i className="bi bi-trash" /> Delete review
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="rs-my-comment">"{r.comment}"</p>
      <CatBars review={r} cols={2} />

      {r.imageUrls?.length > 0 && (
        <div className="rs-card-imgs" style={{ marginTop: 10 }}>
          {r.imageUrls.map((url, i) => (
            <img key={i} src={url} alt="" className="rs-card-thumb" />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   DETAIL POPUP MODAL
═══════════════════════════════════════════════════ */
function DetailModal({ r, onClose }) {
  if (!r) return null;
  return (
    <div className="rs-modal-overlay" onClick={onClose}>
      <div className="rs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rs-modal-header">
          <div className="rs-modal-user">
            <div
              className="rs-avatar"
              style={{ background: avatarColor(r.userName) }}
            >
              {r.userPhoto ? (
                <img src={r.userPhoto} alt={r.userName} />
              ) : (
                getInitials(r.userName)
              )}
            </div>
            <div>
              <div className="rs-card-name">{r.userName}</div>
              <StarDisplay rating={r.rating} size={15} />
            </div>
          </div>
          <button className="rs-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="rs-modal-comment">"{r.comment}"</p>
        <CatBars review={r} cols={1} />
        {r.imageUrls?.length > 0 && (
          <div className="rs-modal-imgs">
            {r.imageUrls.map((url, i) => (
              <img key={i} src={url} alt="" className="rs-modal-img" />
            ))}
          </div>
        )}
        {r.videoUrls?.length > 0 && (
          <div className="rs-modal-imgs">
            {r.videoUrls.map((url, i) => (
              <video key={i} src={url} controls className="rs-modal-img" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   REVIEW FORM MODAL (add / edit)
═══════════════════════════════════════════════════ */
function ReviewFormModal({ pgId, existing, onClose, onSaved }) {
  const isEditing = !!existing;

  const [rating, setRating] = useState(existing?.rating || 0);
  const [catRatings, setCatRatings] = useState({
    cleanlinessRating: existing?.cleanlinessRating || 0,
    securityRating: existing?.securityRating || 0,
    roomConditionRating: existing?.roomConditionRating || 0,
    managementRating: existing?.managementRating || 0,
    waterSupplyRating: existing?.waterSupplyRating || 0,
  });
  const [comment, setComment] = useState(existing?.comment || "");
  const [images, setImages] = useState(
    existing?.imageUrls?.map((url) => ({ src: url, existing: true, url })) || []
  );
  const [videos, setVideos] = useState(
    existing?.videoUrls?.map((url) => ({ src: url, existing: true, url })) || []
  );
  const [submitting, setSubmitting] = useState(false);

  const setCat = (key, val) =>
    setCatRatings((p) => ({ ...p, [key]: val }));

  const handleFiles = (files) => {
    Array.from(files).forEach((file) => {
      const src = URL.createObjectURL(file);
      if (file.type.startsWith("image"))
        setImages((p) => [...p, { id: Date.now() + Math.random(), file, src, existing: false }]);
      else if (file.type.startsWith("video"))
        setVideos((p) => [...p, { file, src, existing: false }]);
    });
  };

  const submit = async () => {
    if (!rating) {
      reviewToast.fire({ icon: "warning", title: "Please select an overall rating." });
      return;
    }
    if (!comment.trim()) {
      reviewToast.fire({ icon: "warning", title: "Please write a comment." });
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("rating", rating);
      fd.append("comment", comment);
      Object.entries(catRatings).forEach(([k, v]) => fd.append(k, v));
      images.forEach((img) => { if (img.file) fd.append("images", img.file); });
      videos.forEach((vid) => { if (vid.file) fd.append("videos", vid.file); });
      if (isEditing) {
        images.filter((i) => i.existing).forEach((i) => fd.append("existingImageUrls", i.url));
        videos.filter((v) => v.existing).forEach((v) => fd.append("existingVideoUrls", v.url));
        await api.put(`/user/pgs/review/${existing.id}`, fd);
        reviewToast.fire({ icon: "success", title: "✏️ Review updated!" });
      } else {
        await api.post(`/user/pgs/${pgId}/review`, fd);
        reviewToast.fire({ icon: "success", title: "🎉 Review submitted!" });
      }
      onSaved();
      onClose();
    } catch (err) {
      reviewToast.fire({
        icon: "error",
        title: err.response?.data?.message || "Something went wrong.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rs-modal-overlay" onClick={onClose}>
      <div className="rs-modal rs-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rs-modal-header">
          <h3 className="rs-modal-title">
            <i className="bi bi-chat-left-text" />{" "}
            {isEditing ? "Edit Review" : "Write a Review"}
          </h3>
          <button className="rs-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Overall stars */}
        <div className="rs-form-section">
          <label className="rs-form-label">Overall Rating</label>
          <div className="rs-star-input">
            {[1, 2, 3, 4, 5].map((n) => (
              <i
                key={n}
                className={`bi ${rating >= n ? "bi-star-fill rs-star-active" : "bi-star"} rs-star`}
                onClick={() => setRating(n)}
              />
            ))}
          </div>
        </div>

        {/* Category stars */}
        <div className="rs-form-section">
          <label className="rs-form-label">Rate by Category</label>
          <div className="rs-cat-form-grid">
            {CAT_CONFIG.map((c) => (
              <div key={c.key} className="rs-cat-form-row">
                <span className="rs-cat-form-label">{c.label}</span>
                <div className="rs-star-input rs-star-sm">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <i
                      key={n}
                      className={`bi ${catRatings[c.key] >= n ? "bi-star-fill" : "bi-star"} rs-star`}
                      style={{ color: catRatings[c.key] >= n ? c.color : "#d1d5db" }}
                      onClick={() => setCat(c.key, n)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="rs-form-section">
          <label className="rs-form-label">Your Review</label>
          <textarea
            className="rs-textarea"
            placeholder="Share your experience…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {/* Media upload */}
        <div
          className="review-drop-zone"
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("drag-over"); }}
          onDragLeave={(e) => e.currentTarget.classList.remove("drag-over")}
          onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("drag-over"); handleFiles(e.dataTransfer.files); }}
          onPaste={(e) => {
            Array.from(e.clipboardData?.items || []).forEach((item) => {
              if (item.type.startsWith("image")) {
                const file = item.getAsFile();
                const src = URL.createObjectURL(file);
                setImages((p) => [...p, { id: Date.now(), file, src, existing: false }]);
              }
            });
          }}
          tabIndex={0}
        >
          <label className="custom-file-upload" style={{ pointerEvents: "auto" }}>
            📷 Upload / Drop / Paste Photos & Videos
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
          <p className="drop-zone-hint">or drag & drop · Ctrl+V to paste</p>
        </div>

        {images.length > 0 && (
          <SortableImageGrid
            imageList={images.map((img, i) => ({ ...img, id: img.id ?? i }))}
            onChange={(newList) => setImages(newList)}
            onRemove={(i) => setImages((p) => p.filter((_, idx) => idx !== i))}
          />
        )}
        {videos.length > 0 && (
          <div className="review-preview-grid">
            {videos.map((vid, i) => (
              <div key={i} className="review-preview-item">
                <video src={vid.src} controls />
                <button
                  type="button"
                  className="preview-remove-btn"
                  onClick={() => setVideos((p) => p.filter((_, idx) => idx !== i))}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Submit */}
        <button
          className="btn-submit-modern"
          onClick={submit}
          disabled={submitting}
          style={{
            marginTop: 12,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: submitting ? 0.8 : 1,
          }}
        >
          {submitting ? (
            <>
              <span className="rs-spinner" />
              Submitting…
            </>
          ) : (
            <>
              <i className="bi bi-send" />
              {isEditing ? "Update Review" : "Submit Review"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SUMMARY BAR (top of section)
═══════════════════════════════════════════════════ */
function SummaryBar({ summary }) {
  if (!summary || summary.totalReviews === 0) return null;
  return (
    <div className="rs-summary">
      <div className="rs-summary-score">
        <span className="rs-big-num">{summary.averageRating?.toFixed(1)}</span>
        <StarDisplay rating={Math.round(summary.averageRating)} size={16} />
        <span className="rs-review-count">{summary.totalReviews} reviews</span>
      </div>
      <div className="rs-summary-cats">
        {CAT_CONFIG.map((c) => (
          <div className="rs-bar-row" key={c.key}>
            <span className="rs-bar-label">{c.label}</span>
            <div className="rs-bar-bg">
              <div
                className="rs-bar-fill"
                style={{
                  width: `${((summary[`avg${c.key.charAt(0).toUpperCase() + c.key.slice(1)}`] || 0) / 5) * 100}%`,
                  background: c.color,
                }}
              />
            </div>
            <span className="rs-bar-val">
              {(summary[`avg${c.key.charAt(0).toUpperCase() + c.key.slice(1)}`] || 0).toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════ */
export default function ReviewSection({ pgId, me, isUser }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [eligible, setEligible] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [detailR, setDetailR] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editReview, setEditReview] = useState(null);

  const fetchReviews = () => {
    api.get(`/public/pg/${pgId}/reviews`)
      .then((res) => setReviews(res.data || []))
      .catch(() => setReviews([]));
  };

  const fetchSummary = () => {
    api.get(`/public/pg/${pgId}/rating`)
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null));
  };

  const checkEligibility = () => {
    if (!isUser) return;
    api.get(`/user/pgs/${pgId}/can-review`)
      .then(() => setEligible(true))
      .catch(() => setEligible(false));
  };

  
  useEffect(() => {
    fetchReviews();
    fetchSummary();
    checkEligibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pgId, isUser]);

  const myReview = reviews.find((r) => r.userId === me?.id) || null;

  /* sort */
  const sorted = [...reviews].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === "best") return b.rating - a.rating;
    if (sortBy === "worst") return a.rating - b.rating;
    return 0;
  });

  const otherReviews = sorted.filter((r) => r.userId !== me?.id);

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete Review?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/user/pgs/review/${myReview.id}`);
      reviewToast.fire({ icon: "success", title: "🗑️ Review deleted." });
      fetchReviews();
      fetchSummary();
    } catch {
      reviewToast.fire({ icon: "error", title: "Failed to delete review." });
    }
  };

  const openAddReview = () => {
    if (!isUser) {
      reviewToast.fire({ icon: "info", title: "Please login to write a review." });
      return;
    }
    if (!eligible) {
      reviewToast.fire({
        icon: "warning",
        title: "You can only review a PG you have stayed in.",
      });
      return;
    }
    setEditReview(null);
    setShowForm(true);
  };

  return (
    <section className="content-card">
      <h2 className="section-title">Reviews ({reviews.length})</h2>

      {/* Summary */}
      <SummaryBar summary={summary} />

      {/* Tabs */}
      <div className="rs-tabs">
        <button
          className={`rs-tab ${activeTab === "all" ? "rs-tab-active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Reviews
        </button>
        {isUser && (eligible || myReview) && (
          <button
            className={`rs-tab ${activeTab === "mine" ? "rs-tab-active" : ""}`}
            onClick={() => setActiveTab("mine")}
          >
            My Review{myReview && <span className="rs-tab-badge">1</span>}
          </button>
        )}
      </div>

      {/* ALL REVIEWS */}
      {activeTab === "all" && (
        <>
          <div className="rs-sort-bar">
            <span className="rs-sort-info">
              {otherReviews.length} review{otherReviews.length !== 1 ? "s" : ""}
            </span>
            <div className="rs-sort-btns">
              {["newest", "oldest", "best", "worst"].map((s) => (
                <button
                  key={s}
                  className={`rs-sort-btn ${sortBy === s ? "rs-sort-btn-active" : ""}`}
                  onClick={() => setSortBy(s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {otherReviews.length === 0 ? (
            <p className="no-review">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="reviews-horizontal-list">
              <div className="rs-marquee-track">
                {[...Array(4)].flatMap((_, gi) =>
                  otherReviews.map((r, i) => (
                    <ReviewCard key={`${gi}-${i}`} r={r} onClick={() => setDetailR(r)} />
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* MY REVIEW */}
      {activeTab === "mine" && isUser && (
        <>
          {myReview ? (
            <MyReviewCard
              r={myReview}
              onEdit={() => { setEditReview(myReview); setShowForm(true); }}
              onDelete={handleDelete}
            />
          ) : (
            <p className="no-review">You haven't reviewed this PG yet.</p>
          )}
        </>
      )}

      {/* Add review button — only shown if eligible and no review yet */}
      {isUser && !myReview && eligible && (
        <button className="open-review-btn" onClick={openAddReview}>
          Add Review
        </button>
      )}

      {/* Modals */}
      {detailR && (
        <DetailModal r={detailR} onClose={() => setDetailR(null)} />
      )}
      {showForm && (
        <ReviewFormModal
          pgId={pgId}
          existing={editReview}
          onClose={() => { setShowForm(false); setEditReview(null); }}
          onSaved={() => { fetchReviews(); fetchSummary(); }}
        />
      )}
    </section>
  );
}