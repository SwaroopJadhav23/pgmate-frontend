import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../../api/axios";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { getUIText, saveUIText } from "./uiText";
import AdminUITextEditor from "./AdminUITextEditor";
import Swal from "sweetalert2";
import "./ManageUI.css";

/* 🔹 helpers for the City Section table */
const cityNameFromLink = (link) => {
  if (!link) return "—";
  const idx = link.indexOf("city=");
  return idx === -1 ? link : decodeURIComponent(link.slice(idx + 5));
};

const formatUploadDate = (value) => {
  if (!value) return { date: "—", time: "" };

  let d;
  if (Array.isArray(value)) {
    // Java LocalDateTime serialized as [year, month(1-12), day, hour, minute, second, nanos]
    const [y, mo = 1, day = 1, h = 0, mi = 0, s = 0, nanos = 0] = value;
    d = new Date(y, mo - 1, day, h, mi, s, Math.floor(nanos / 1e6));
  } else {
    d = new Date(value);
  }

  if (isNaN(d.getTime())) return { date: String(value), time: "" };
  return {
    date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  };
};

/* windowed page numbers, e.g. 1 … 3 4 5 … 9 */
const getPageNumbers = (current, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  if (current > 3) pages.push("…");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
};

const sections = [
  //{ key: "home_banner", label: "Home Banner" },
  //{ key: "home_features", label: "Home Features" },
  //{ key: "home_ads", label: "Advertisements" },
  //{ key: "home_stats", label: "Stats Section" },
  { key: "home_citywise", label: "City Section" },
  { key: "owner_testimonials", label: "Owner Testimonials" },
//{ key: "user_testimonials", label: "User Testimonials" },
  { key: "OWNER_HELP_VIDEO_1", label: "Owner Help – PG Setup (Video)" },
  { key: "OWNER_HELP_VIDEO_2", label: "Owner Help – Residents & Payments (Video)" }
];

const ManageUI = () => {
 const [section, setSection] = useState("owner_testimonials");
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [dbCities, setDbCities] = useState([]);

  const [uiText, setUiText] = useState(null);
  const [originalText, setOriginalText] = useState(null);
  const [showTextModal, setShowTextModal] = useState(false);

  /* 🔹 City Section table pagination */
  const [cityPage, setCityPage] = useState(0);
  const [cityPageSize, setCityPageSize] = useState(5);
  const [previewImg, setPreviewImg] = useState(null);
  const [replaceTargetId, setReplaceTargetId] = useState(null);
  const [replacingId, setReplacingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const uploadRowRef = useRef(null);
  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);

  const isOwnerHelpSection = section.startsWith("OWNER_HELP_");
  const isCitySection = section === "home_citywise";

  /* 🔹 FETCH REAL CITY LIST (for City Section dropdown) */
  useEffect(() => {
    if (!isCitySection) return;
    api
      .get("/public/cities")
      .then((res) => setDbCities(res.data || []))
      .catch(() => setDbCities([]));
  }, [isCitySection]);

  /* 🔹 FETCH ASSETS */
  const fetchAssets = useCallback(() => {
    api
      .get(`/admin/ui-assets?section=${section}`)
      .then((res) => setItems(res.data || []))
      .catch(console.error);
  }, [section]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  /* 🔹 CLOSE MOBILE ACTIONS MENU ON OUTSIDE CLICK */
  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openMenuId]);

  /* 🔹 OPEN TEXT EDITOR (SAFE) */
  const openTextEditor = async () => {
    const data = await getUIText(section);
   if (!data) {
  Swal.fire("No Content", "No text content exists for this section.", "info");
  return;
}
    const clone = JSON.parse(JSON.stringify(data));
    setOriginalText(clone);
    setUiText(clone);
    setShowTextModal(true);
  };

  /* 🔹 UPLOAD (USED ✅) */
  const upload = async () => {
 if (!file) {
  return Swal.fire("Missing File", "Please select a file first.", "warning");
}

    const isVideo = file.type.startsWith("video/");
  if (isOwnerHelpSection && !isVideo)
  return Swal.fire(
    "Invalid File",
    "Only video allowed for Owner Help sections",
    "error"
  );
  if (!isOwnerHelpSection && isVideo)
  return Swal.fire(
    "Invalid File",
    "Video upload allowed only for Owner Help sections",
    "error"
  );

    const form = new FormData();
    form.append("section", section);

    setLoading(true);
    try {
      if (isVideo) {
        form.append("video", file);
        await api.post("/admin/ui-assets/video", form);
      } else {
        form.append("image", file);
        if (link.trim()) form.append("link", link.trim());
        await api.post("/admin/ui-assets", form);
      }

      setFile(null);
      setLink("");
      fetchAssets();
    } finally {
      setLoading(false);
    }
  };

  /* 🔹 DELETE */
  const remove = async (id) => {
  const confirm = await Swal.fire({
  title: "Delete item?",
  text: "This cannot be undone.",
  icon: "warning",
  showCancelButton: true,
  confirmButtonColor: "#dc3545",
  confirmButtonText: "Delete"
});

if (!confirm.isConfirmed) return;
    await api.delete(`/admin/ui-assets/${id}`);
    fetchAssets();
  };

  /* 🔹 TOGGLE ENABLE/DISABLE */
  const toggleActive = async (id) => {
    await api.put(`/admin/ui-assets/${id}/toggle`);
    fetchAssets();
  };

  /* 🔹 REPLACE IMAGE (keeps same row/link, swaps file only) */
  const triggerReplace = (id) => {
    setReplaceTargetId(id);
    if (replaceInputRef.current) {
      replaceInputRef.current.value = "";
      replaceInputRef.current.click();
    }
  };

  const handleReplaceFile = async (e) => {
    const newFile = e.target.files[0];
    if (!newFile || !replaceTargetId) return;

    const form = new FormData();
    form.append("image", newFile);

    setReplacingId(replaceTargetId);
    try {
      await api.put(`/admin/ui-assets/${replaceTargetId}`, form);
      fetchAssets();
    } catch (err) {
      // global axios interceptor already shows a Swal error popup;
      // this catch only stops the unhandled-promise-rejection console error
    } finally {
      setReplacingId(null);
      setReplaceTargetId(null);
    }
  };

  /* 🔹 DRAG & DROP */
  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    setItems(reordered);

    await api.put(
      "/admin/ui-assets/reorder",
      reordered.map((item, index) => ({
        id: item.id,
        position: index,
      }))
    );
  };



  /* 🔹 CITY TABLE — derived pagination values */
  const totalCityPages = Math.max(1, Math.ceil(items.length / cityPageSize));
  const citySafePage = Math.min(cityPage, totalCityPages - 1);
  const cityStartIdx = citySafePage * cityPageSize;
  const cityEndIdx = Math.min(cityStartIdx + cityPageSize, items.length);
  const paginatedCities = items.slice(cityStartIdx, cityEndIdx);

  /* 🔹 ASSET CARD (UNCHANGED UI) */
  const UIAssetCard = ({ img }) => (
    <div className={`card shadow-sm h-100 ${!img.active ? "opacity-50" : ""}`}>
      {img.videoUrl ? (
        <video src={img.videoUrl} controls style={{ height: 160, width: "100%", objectFit: "cover" }} />
      ) : (
        <img src={img.imageUrl} alt="ui" className="img-fluid" />
      )}

      <div className="card-body p-2 text-center">
        {img.link && <a href={img.link} className="small">{img.link}</a>}

        <div className="d-flex gap-2 mt-2">
          <button
            className="btn btn-sm btn-outline-secondary w-100"
            onClick={() => toggleActive(img.id)}
          >
            {img.active ? "Disable" : "Enable"}
          </button>
          <button
            className="btn btn-sm btn-outline-danger w-100"
            onClick={() => remove(img.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Manage UI" subtitle="Control all homepage content">

      {/* SECTION SELECT */}
      <div className="section-select-wrap mb-3">
        <select
          className="form-select section-select"
          value={section}
          onChange={(e) => {
            setSection(e.target.value);
            setLink("");
            setFile(null);
            setCityPage(0);
          }}
        >
          {sections.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <svg
          className="section-select-chevron"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* EDIT TEXT */}
      {!isCitySection && (
        <button className="btn btn-warning mb-3" onClick={openTextEditor}>
          Edit Text Content
        </button>
      )}

      {isCitySection ? (
        /* 🔹 CITY SECTION — dedicated card with table + pagination */
        <div className="city-section-card">
          <div className="city-section-header">
            <div>
              <h3 className="city-section-title">City Images</h3>
              <p className="city-section-subtitle">
                Manage and organize city images that appear in the app.
              </p>
            </div>
          </div>

          {/* upload row */}
          <div className="city-upload-row" ref={uploadRowRef}>
            <label className="city-file-input">
              <span className="choose-file-btn">Choose File</span>
              <span className="file-name">{file ? file.name : "No file chosen"}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
                hidden
              />
            </label>

            <div className="city-select-wrap">
              <select
                className="city-select"
                value={link.replace("/pgs?city=", "")}
                onChange={(e) =>
                  setLink(e.target.value ? `/pgs?city=${e.target.value}` : "")
                }
              >
                <option value="">Select a city...</option>
                {dbCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <svg
                className="city-select-chevron"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <button
              type="button"
              className="btn-upload-image"
              onClick={upload}
              disabled={loading}
            >
              {loading ? "Uploading..." : "Upload Image"}
            </button>
          </div>
          <p className="city-upload-hint">
            Pick the city this image is for — list comes from cities already in the database.
          </p>

          {/* table */}
          <input
            type="file"
            accept="image/*"
            ref={replaceInputRef}
            hidden
            onChange={handleReplaceFile}
          />
          <div className="city-table-wrapper">
            <table className="city-table">
              <thead>
                <tr>
                  <th>Sr No</th>
                  <th>City Name</th>
                  <th className="col-link">Link</th>
                  <th>View Image</th>
                  <th className="col-date">Upload Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCities.map((img, idx) => {
                  const uploaded = formatUploadDate(img.createdAt);
                  return (
                    <tr key={img.id} className={!img.active ? "row-disabled" : ""}>
                      <td data-label="Sr No">{String(cityStartIdx + idx + 1).padStart(2, "0")}</td>
                      <td className="city-name-cell" data-label="City">
                        {cityNameFromLink(img.link)}
                      </td>
                      <td className="col-link" data-label="Link">
                        <a href={img.link} className="city-link" title={img.link}>{img.link}</a>
                      </td>
                      <td data-label="Image">
                        <img
                          src={img.imageUrl}
                          alt={cityNameFromLink(img.link)}
                          className="city-thumb"
                          onClick={() => setPreviewImg(img.imageUrl)}
                        />
                      </td>
                      <td className="col-date" data-label="Upload Date">
                        <div className="upload-date">{uploaded.date}</div>
                        {uploaded.time && <div className="upload-time">{uploaded.time}</div>}
                      </td>
                      <td data-label="Actions" className="actions-cell">
                        {/* desktop: inline text actions */}
                        <div className="actions-desktop">
                          <button
                            className="link-action"
                            onClick={() => triggerReplace(img.id)}
                            disabled={replacingId === img.id}
                          >
                            {replacingId === img.id ? "Replacing…" : "Replace"}
                          </button>
                          <button className="link-action" onClick={() => toggleActive(img.id)}>
                            {img.active ? "Disable" : "Enable"}
                          </button>
                          <button className="link-action danger" onClick={() => remove(img.id)}>
                            Delete
                          </button>
                        </div>

                        {/* tablet: kebab menu */}
                        <div className="actions-kebab-wrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="kebab-btn"
                            aria-label="Row actions"
                            onClick={() =>
                              setOpenMenuId(openMenuId === img.id ? null : img.id)
                            }
                          >
                            ⋮
                          </button>
                          {openMenuId === img.id && (
                            <div className="kebab-menu">
                              <button
                                className="kebab-item"
                                disabled={replacingId === img.id}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  triggerReplace(img.id);
                                }}
                              >
                                {replacingId === img.id ? "Replacing…" : "Replace"}
                              </button>
                              <button
                                className="kebab-item"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  toggleActive(img.id);
                                }}
                              >
                                {img.active ? "Disable" : "Enable"}
                              </button>
                              <button
                                className="kebab-item danger"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  remove(img.id);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-row">No cities added yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 🔹 MOBILE-ONLY CARD LIST — plain divs, no table semantics, guaranteed layout */}
          <div className="city-mobile-list">
            <div className="city-mobile-header">
              <span style={{ width: 28 }}></span>
              <span className="city-mobile-name">City Name</span>
              <span className="city-mobile-header-image">Image</span>
              <span className="city-mobile-header-actions"></span>
            </div>
            {paginatedCities.map((img, idx) => (
              <div key={img.id} className={`city-mobile-row ${!img.active ? "row-disabled" : ""}`}>
                <div className="city-mobile-index">{cityStartIdx + idx + 1}</div>
                <span className="city-mobile-name">{cityNameFromLink(img.link)}</span>
                <img
                  src={img.imageUrl}
                  alt={cityNameFromLink(img.link)}
                  className="city-mobile-thumb"
                  onClick={() => setPreviewImg(img.imageUrl)}
                />
                <div className="city-mobile-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="kebab-btn"
                    aria-label="Row actions"
                    onClick={() =>
                      setOpenMenuId(openMenuId === img.id ? null : img.id)
                    }
                  >
                    ⋮
                  </button>
                  {openMenuId === img.id && (
                    <div className="kebab-menu">
                      <button
                        className="kebab-item"
                        disabled={replacingId === img.id}
                        onClick={() => {
                          setOpenMenuId(null);
                          triggerReplace(img.id);
                        }}
                      >
                        {replacingId === img.id ? "Replacing…" : "Replace"}
                      </button>
                      <button
                        className="kebab-item"
                        onClick={() => {
                          setOpenMenuId(null);
                          toggleActive(img.id);
                        }}
                      >
                        {img.active ? "Disable" : "Enable"}
                      </button>
                      <button
                        className="kebab-item danger"
                        onClick={() => {
                          setOpenMenuId(null);
                          remove(img.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="empty-row">No cities added yet.</div>
            )}
          </div>

          {/* pagination footer */}
          {items.length > 0 && (
            <div className="city-pagination">
              <span className="pagination-info">
                Showing {cityStartIdx + 1} to {cityEndIdx} of {items.length} cities
              </span>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="page-arrow"
                  disabled={citySafePage === 0}
                  onClick={() => setCityPage((p) => Math.max(0, p - 1))}
                >
                  ‹
                </button>
                {getPageNumbers(citySafePage + 1, totalCityPages).map((p, i) =>
                  p === "…" ? (
                    <span key={`dots-${i}`} className="page-dots">…</span>
                  ) : (
                    <button
                      type="button"
                      key={p}
                      className={`page-pill ${p === citySafePage + 1 ? "active" : ""}`}
                      onClick={() => setCityPage(p - 1)}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  type="button"
                  className="page-arrow"
                  disabled={citySafePage >= totalCityPages - 1}
                  onClick={() => setCityPage((p) => Math.min(totalCityPages - 1, p + 1))}
                >
                  ›
                </button>
              </div>

              <select
                className="per-page-select"
                value={cityPageSize}
                onChange={(e) => {
                  setCityPageSize(Number(e.target.value));
                  setCityPage(0);
                }}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
              </select>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 🔹 UPLOAD UI (RESTORED → fixes ESLint) */}
          <div className="card p-3 mb-4 shadow-sm">
            <div className="row g-2">
              <div className="col-md-4">
                <input
                  type="file"
                  className="form-control"
                  accept={isOwnerHelpSection ? "video/*" : "image/*"}
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </div>

              <div className="col-md-5">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Optional link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </div>

              <div className="col-md-3">
                <button
                  className="btn btn-primary w-100"
                  onClick={upload}
                  disabled={loading}
                >
                  {loading ? "Uploading..." : isOwnerHelpSection ? "Upload Video" : "Upload Image"}
                </button>
              </div>
            </div>
          </div>

          {/* ASSETS GRID */}
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="ui-assets" direction="horizontal">
              {(provided) => (
                <div className="row" ref={provided.innerRef} {...provided.droppableProps}>
                  {items.map((img, index) => (
                    <Draggable key={img.id} draggableId={img.id} index={index}>
                      {(provided) => (
                        <div
                          className="col-md-3 mb-4"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <UIAssetCard img={img} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </>
      )}

      {/* IMAGE PREVIEW LIGHTBOX */}
      {previewImg && (
        <div className="modal-backdrop-custom" onClick={() => setPreviewImg(null)}>
          <div className="image-preview-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="image-preview-close"
              onClick={() => setPreviewImg(null)}
            >
              ×
            </button>
            <img src={previewImg} alt="Full preview" />
          </div>
        </div>
      )}

      {/* TEXT MODAL */}
      {showTextModal && (
      
  <div
    className="modal-backdrop-custom"
    onClick={() => setShowTextModal(false)}
  >
    <div
      className="modal-box"
      style={{ maxWidth: "900px" }}
      onClick={(e) => e.stopPropagation()}
    >

      {/* HEADER */}
      <div className="modal-header-custom">
        <h4>Edit Text – {section}</h4>
                <button className="btn-close" onClick={() => setShowTextModal(false)} />
              </div>

                            
              <div className="modal-body">
                <AdminUITextEditor
                  data={uiText}
                  onChange={setUiText}
                />
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setUiText(originalText);
                    setShowTextModal(false);
                  }}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-success"
                  onClick={async () => {
                    await saveUIText(section, uiText);
                    setShowTextModal(false);
                  }}
                >
                  Save Changes
                </button>
                
             </div>

          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default ManageUI;