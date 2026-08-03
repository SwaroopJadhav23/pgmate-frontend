import {FaHome, FaFolderOpen, FaTrash} from "react-icons/fa";
import {useEffect, useState, useCallback} from "react";
import api from "../../../api/axios";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import {TableSkeleton, UniversalCardSkeleton} from "../../public/Skeleton";
import SortableImageGrid from "../../../components/Sortableimagegrid";
import "../../../components/Sortableimagegrid.css";
import "./AdminPGVerification.css";

const DEFAULT_PG_IMAGE =
  "https://res.cloudinary.com/drhjyumlm/image/upload/v1773823610/pgs/images/sk30iitclkb0lpsbcc3g.webp";
const PAGE_SIZE = 20;

const sessionReasonRef = {current: null};
const AdminPGVerification = ({basePath = "/admin"}) => {
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pgDetail, setPgDetail] = useState(null);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [mediaIndex, setMediaIndex] = useState(0);
  const [mediaType, setMediaType] = useState("image");
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [summary, setSummary] = useState({
    pending: 0,
    reapplied: 0,
    approved: 0,
    rejected: 0,
  });

  const fetchSummary = useCallback(async () => {
    try {
      const [pending, reapplied, approved, rejected] = await Promise.all([
        api.get(`${basePath}/pg-verification/paged`, {
          params: {page: 0, size: 1, status: "PENDING"},
        }),
        api.get(`${basePath}/pg-verification/paged`, {
          params: {page: 0, size: 1, status: "REAPPLIED"},
        }),
        api.get(`${basePath}/pg-verification/paged`, {
          params: {page: 0, size: 1, status: "APPROVED"},
        }),
        api.get(`${basePath}/pg-verification/paged`, {
          params: {page: 0, size: 1, status: "REJECTED"},
        }),
      ]);
      setSummary({
        pending: pending.data?.totalElements || 0,
        reapplied: reapplied.data?.totalElements || 0,
        approved: approved.data?.totalElements || 0,
        rejected: rejected.data?.totalElements || 0,
      });
    } catch (e) {
      console.error("Failed to load summary", e);
    }
  }, [basePath]);

  const load = useCallback(
    async (nextPage = 0, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const res = await api.get(`${basePath}/pg-verification/paged`, {
          params: {
            page: nextPage,
            size: PAGE_SIZE,
            search: search.trim() || undefined,
            status: activeTab,
          },
        });

        const content = res.data?.content || [];
        setPgs((prev) => (append ? [...prev, ...content] : content));
        setPage(res.data?.number || nextPage);
        setTotalPages(res.data?.totalPages || 0);
        setTotalElements(res.data?.totalElements || 0);
      } catch (e) {
        console.error(e);
        alert("Failed to load PGs");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab, basePath, search],
  );

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    load(0, false);
  }, [load]);

  const getOwnerName = (pg) => {
    if (!pg) return "-";
    if (pg.ownerName?.trim()) return pg.ownerName;
    if (pg.owner?.name?.trim()) return pg.owner.name;
    if (pg.owner?.fullName?.trim()) return pg.owner.fullName;
    const first = pg.owner?.firstName?.trim() || "";
    const last = pg.owner?.lastName?.trim() || "";
    const name = `${first} ${last}`.trim();
    if (name) return name;
    return "-";
  };

  const openDetailModal = async (pg) => {
    setShowDetailModal(true);
    setDetailError("");
    setLoadingDetail(true);
    setPgDetail({
      id: pg.id,
      name: pg.name,
      ownerName: getOwnerName(pg),
      city: pg.city,
      locality: pg.locality,
      status: pg.status || activeTab,
      amenities: [],
      imageUrls: [],
      videoUrls: [],
      houseRules: [],
      floors: [],
    });
    try {
      const res = await api.get(`${basePath}/owners/pg/${pg.id}`, {
        timeout: 15000,
      });
      setPgDetail(res.data);
    } catch (error) {
      console.error(error);
      setDetailError("Could not load the full PG details. Please try again.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setShowMediaViewer(false);
    setMediaIndex(0);
    setPgDetail(null);
    setDetailError("");
    setLoadingDetail(false);
    setUploadFiles([]);
    setIsDragOver(false);
  };

  const approvePG = async (pgId, pgName) => {
    const confirm = await Swal.fire({
      title: `Are you sure you want to approve "${pgName}"?`,
      text: "This will mark the PG as verified and make its listing publicly visible to users.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, approve it",
      cancelButtonText: "Cancel",
    });
    if (!confirm.isConfirmed) return;
    await api.put(`${basePath}/pg-verification/${pgId}/approve`);
    toast.success(`"${pgName}" approved and is now live.`);
    load(0, false);
    fetchSummary();
  };

  const rejectPG = async (pgId) => {
    const {value: reason} = await Swal.fire({
      title: "Reject PG",
      input: "textarea",
      inputLabel: "Reason",
      showCancelButton: true,
      preConfirm: (v) => {
        if (!v) Swal.showValidationMessage("Reason required");
        return v;
      },
    });
    if (!reason) return;
    await api.put(`${basePath}/pg-verification/${pgId}/reject`, null, {
      params: {reason},
    });
    toast.success("PG rejected successfully.");
    load(0, false);
    fetchSummary();
  };

  const handleDeleteMedia = async () => {
    const currentUrl =
      mediaType === "image"
        ? pgDetail?.imageUrls?.[mediaIndex]
        : pgDetail?.videoUrls?.[mediaIndex];

    let reason = sessionReasonRef.current;

    if (!reason) {
      const {value: inputReason} = await Swal.fire({
        title: "Delete Media",
        input: "textarea",
        inputLabel: "Enter Reason for deletion",
        inputPlaceholder: "e.g. Improper image, low quality, irrelevant...",
        showCancelButton: true,
        confirmButtonText: "Delete",
        preConfirm: (v) => {
          if (!v) Swal.showValidationMessage("Reason required");
          return v;
        },
      });
      if (!inputReason) return;
      sessionReasonRef.current = inputReason;
      reason = inputReason;
    } else {
      const confirm = await Swal.fire({
        title: "Are you sure?",
        text: "This media will be permanently deleted.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, Delete",
      });
      if (!confirm.isConfirmed) return;
    }

    try {
      await api.delete(`${basePath}/pg-verification/${pgDetail.id}/media`, {
        params: {
          url: currentUrl,
          reason: reason,
        },
      });

      toast.success("Media removed.");

      if (mediaType === "image") {
        const updated = pgDetail.imageUrls.filter((u) => u !== currentUrl);
        if (updated.length === 0) setShowMediaViewer(false);
        setPgDetail({...pgDetail, imageUrls: updated});
      } else {
        const updated = pgDetail.videoUrls.filter((u) => u !== currentUrl);
        if (updated.length === 0) setShowMediaViewer(false);
        setPgDetail({...pgDetail, videoUrls: updated});
      }

      setMediaIndex(0);
    } catch (err) {
      toast.error("Failed to delete media.");
    }
  };

  const disapprovePG = async (pgId) => {
    const {value: reason} = await Swal.fire({
      title: "Disapprove PG",
      input: "textarea",
      inputLabel: "Reason",
      showCancelButton: true,
      confirmButtonText: "Disapprove",
      preConfirm: (v) => {
        if (!v) Swal.showValidationMessage("Reason required");
        return v;
      },
    });

    if (!reason) return;

    await api.put(`${basePath}/pg-verification/${pgId}/reject`, null, {
      params: {reason},
    });

    toast.success("PG disapproved and moved to rejected.");
    load(0, false);
    fetchSummary();
  };

  const currentUrl =
    mediaType === "image"
      ? pgDetail?.imageUrls?.[mediaIndex]
      : pgDetail?.videoUrls?.[mediaIndex];

  const [showRearrange, setShowRearrange] = useState(false);
  const [rearrangeList, setRearrangeList] = useState([]);

  // ── Drag & Drop Image Upload state ──
  const [uploadFiles, setUploadFiles] = useState([]); // { id, file, preview, status: 'pending'|'uploading'|'done'|'error' }
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const openRearrange = () => {
    setRearrangeList(
      (pgDetail?.imageUrls || []).map((url, i) => ({
        id: `rearr-${i}`,
        src: url,
      })),
    );
    setShowRearrange(true);
  };

  const saveRearrangedOrder = () => {
    const newUrls = rearrangeList.map((img) => img.src);
    setPgDetail({...pgDetail, imageUrls: newUrls});
    setMediaIndex(0);
    setShowRearrange(false);
  };

  // ── Drag & Drop Upload Handlers ──
  const addFilesToUpload = (files) => {
    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (!imageFiles.length) return;
    const newEntries = imageFiles.map((file) => ({
      id: `upload-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
    }));
    setUploadFiles((prev) => [...prev, ...newEntries]);
  };

  const handleDropZoneDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    addFilesToUpload(e.dataTransfer.files);
  };

  const handleDropZoneDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDropZoneDragLeave = () => setIsDragOver(false);

  const removeUploadFile = (id) => {
    setUploadFiles((prev) => {
      const entry = prev.find((f) => f.id === id);
      if (entry?.preview) URL.revokeObjectURL(entry.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleUploadImages = async () => {
    const pending = uploadFiles.filter((f) => f.status === "pending");
    if (!pending.length || !pgDetail?.id) return;
    setIsUploading(true);

    const updateStatus = (id, status) =>
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === id ? {...f, status} : f)),
      );

    let anySuccess = false;
    const newUrls = [];

    for (const entry of pending) {
      updateStatus(entry.id, "uploading");
      try {
        const formData = new FormData();
        formData.append("images", entry.file);
        const res = await api.post(
          `${basePath}/pg-verification/${pgDetail.id}/upload-images`,
          formData,
          {headers: {"Content-Type": "multipart/form-data"}},
        );
        const uploaded = res.data?.imageUrls || res.data?.urls || [];
        newUrls.push(...uploaded);
        updateStatus(entry.id, "done");
        anySuccess = true;
      } catch {
        updateStatus(entry.id, "error");
      }
    }

    if (anySuccess) {
      setPgDetail((prev) => ({
        ...prev,
        imageUrls: [...(prev.imageUrls || []), ...newUrls],
      }));
      toast.success("Images uploaded successfully.");
    }
    setIsUploading(false);
  };

  const showValue = (value, fallback = "Not specified") =>
    value && value.length !== 0 ? value : fallback;

  const colSpan =
    activeTab === "PENDING"
      ? 7
      : activeTab === "REAPPLIED"
        ? 8
        : activeTab === "REJECTED"
          ? 6
          : activeTab === "APPROVED"
            ? 6
            : 5;

  return (
    <>
      <div className="pg-verify-stats-row">
        <div className="pg-verify-stat-card pg-stat-pending">
          <div className="pg-verify-stat-icon pg-stat-pending-icon">
            <i className="bi bi-hourglass-split pg-stat-pending-text"></i>
          </div>
          <div className="pg-verify-stat-info">
            <div className="pg-verify-stat-value">{summary.pending}</div>
            <div className="pg-verify-stat-label">Pending</div>
            <div className="pg-verify-stat-sub">Awaiting review</div>
          </div>
        </div>

        <div className="pg-verify-stat-card pg-stat-process">
          <div className="pg-verify-stat-icon pg-stat-process-icon">
            <i className="bi bi-arrow-repeat pg-stat-process-text"></i>
          </div>
          <div className="pg-verify-stat-info">
            <div className="pg-verify-stat-value">{summary.reapplied}</div>
            <div className="pg-verify-stat-label">Reapplied</div>
            <div className="pg-verify-stat-sub">Resubmitted for review</div>
          </div>
        </div>

        <div className="pg-verify-stat-card pg-stat-approved">
          <div className="pg-verify-stat-icon pg-stat-approved-icon">
            <i className="bi bi-check-circle-fill pg-stat-approved-text"></i>
          </div>
          <div className="pg-verify-stat-info">
            <div className="pg-verify-stat-value">{summary.approved}</div>
            <div className="pg-verify-stat-label">Approved</div>
            <div className="pg-verify-stat-sub">Live on platform</div>
          </div>
        </div>

        <div className="pg-verify-stat-card pg-stat-reject">
          <div className="pg-verify-stat-icon pg-stat-reject-icon">
            <i className="bi bi-x-circle-fill pg-stat-reject-text"></i>
          </div>
          <div className="pg-verify-stat-info">
            <div className="pg-verify-stat-value">{summary.rejected}</div>
            <div className="pg-verify-stat-label">Rejected</div>
            <div className="pg-verify-stat-sub">Failed verification</div>
          </div>
        </div>
      </div>

      <div className="status-tabs">
        {["PENDING", "REAPPLIED", "APPROVED", "REJECTED"].map((s) => (
          <button
            key={s}
            className={`status-btn ${activeTab === s ? "active" : ""}`}
            onClick={() => setActiveTab(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="pg-search-wrapper">
        <i className="bi bi-search search-icon"></i>
        <input
          className="form-control"
          placeholder="Search by PG name, city, owner..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="admin-results-count">
        Showing {pgs.length} of {totalElements} PGs
      </div>

      <div className="pg-table-wrapper pg-table-wrap-pd">
        <table className="pg-table">
          <thead>
            <tr>
              <th>PG Name</th>
              <th>Owner</th>
              <th>City</th>
              <th>Locality</th>
              <th className="text-center">Details</th>
              {(activeTab === "PENDING" || activeTab === "REAPPLIED") && (
                <>
                  <th className="text-center">Approve</th>
                  <th className="text-center">Reject</th>
                </>
              )}
              {(activeTab === "REJECTED" || activeTab === "REAPPLIED") && (
                <th>Reason</th>
              )}
              {activeTab === "APPROVED" && (
                <th className="text-center">Disapprove</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={8} cols={colSpan} />
            ) : pgs.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="pg-table-empty">
                  No records found
                </td>
              </tr>
            ) : (
              pgs.map((pg) => (
                <tr key={pg.id}>
                  <td>
                    <div className="pg-name-cell">
                      <div className="pg-name-icon">
                        <FaHome />
                      </div>
                      <span className="pg-name-text">{pg.name}</span>
                    </div>
                  </td>
                  <td className="pg-table-text-muted">{getOwnerName(pg)}</td>
                  <td className="pg-table-text-muted">{pg.city}</td>
                  <td className="pg-table-text-truncate">{pg.locality}</td>
                  <td className="text-center">
                    <button
                      className="btn-tbl btn-tbl-details"
                      onClick={() => openDetailModal(pg)}
                    >
                      Details
                    </button>
                  </td>
                  {(activeTab === "PENDING" || activeTab === "REAPPLIED") && (
                    <>
                      <td className="text-center">
                        <button
                          className="btn-tbl btn-tbl-approve"
                          onClick={() => approvePG(pg.id, pg.name)}
                        >
                          Approve
                        </button>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn-tbl btn-tbl-reject"
                          onClick={() => rejectPG(pg.id)}
                        >
                          Reject
                        </button>
                      </td>
                    </>
                  )}
                  {activeTab === "APPROVED" && (
                    <td className="text-center">
                      <button
                        className="btn-tbl btn-tbl-reject"
                        onClick={() => disapprovePG(pg.id)}
                      >
                        Disapprove
                      </button>
                    </td>
                  )}
                  {(activeTab === "REJECTED" || activeTab === "REAPPLIED") && (
                    <td className="rejection-cell">
                      {pg.rejectionReason || "-"}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pg-card-list">
        {loading ? (
          <UniversalCardSkeleton count={4} />
        ) : pgs.length === 0 ? (
          <p className="pg-table-empty">No records found</p>
        ) : (
          pgs.map((pg) => (
            <div key={pg.id} className="pg-card">
              <div className="pg-card-bar" />
              <div className="pg-card-body">
                <div className="pg-card-top">
                  <div>
                    <div className="pg-card-name">{pg.name}</div>
                    <div className="pg-card-sub">{getOwnerName(pg)}</div>
                  </div>
                  <div className="pg-card-badges">
                    <span className={`statuss-pill ${activeTab}`}>
                      {activeTab}
                    </span>
                  </div>
                </div>
                <div className="pg-card-meta">
                  <div className="pg-card-meta-item">
                    <i className="bi bi-geo-alt-fill"></i>
                    {pg.city}
                  </div>
                  <div className="pg-card-meta-item">
                    <i className="bi bi-map"></i>
                    {pg.locality}
                  </div>
                </div>
                {activeTab === "REJECTED" && pg.rejectionReason && (
                  <div className="pg-card-rejection">
                    Reason: {pg.rejectionReason}
                  </div>
                )}
                <div className="pg-card-actions">
                  <button
                    className="btn-tbl btn-tbl-details"
                    onClick={() => openDetailModal(pg)}
                  >
                    Details
                  </button>
                  {(activeTab === "PENDING" || activeTab === "REAPPLIED") && (
                    <>
                      <button
                        className="btn-tbl btn-tbl-approve"
                        onClick={() => approvePG(pg.id, pg.name)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-tbl btn-tbl-reject"
                        onClick={() => rejectPG(pg.id)}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {activeTab === "APPROVED" && (
                    <button
                      className="btn-tbl btn-tbl-reject"
                      onClick={() => disapprovePG(pg.id)}
                    >
                      Disapprove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && page + 1 < totalPages && (
        <div className="admin-load-more-wrap">
          <button
            className="admin-load-more-btn"
            onClick={() => load(page + 1, true)}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {showDetailModal && (
        <div
          className="modal-backdrop-custom"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="modal-box modal-box-wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-custom">
              <h4>PG Details</h4>
              <button className="modal-close" onClick={closeDetail}>
                X
              </button>
            </div>
            {loadingDetail ? (
              <div className="text-center p-5 modal-loading-text">
                Loading PG Details...
              </div>
            ) : (
              <div className="pg-modal-content">
                {loadingDetail && (
                  <div className="text-center modal-loading-text">
                    Loading full PG details...
                  </div>
                )}
                {detailError && (
                  <div className="text-center modal-error-text">
                    {detailError}
                  </div>
                )}
                <div className="pg-header">
                  <h3>{pgDetail.name}</h3>
                  <span
                    className={`statuss-pill ${pgDetail.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"}`}
                  >
                    {pgDetail.status}
                  </span>
                </div>
                <p className="fw-semibold mb-1 pg-detail-owner-name">
                  Owner: {pgDetail.ownerName || getOwnerName(pgDetail)}
                </p>
                <p className="pg-detail-locality">
                  {pgDetail.locality}, {pgDetail.city}
                </p>

                <div className="media-section">
                  {pgDetail.imageUrls?.length ? (
                    <button
                      className="media-view-btn"
                      onClick={() => {
                        setMediaType("image");
                        setMediaIndex(0);
                        setShowMediaViewer(true);
                      }}
                    >
                      View Images ({pgDetail.imageUrls.length})
                    </button>
                  ) : (
                    <span className="empty-text">No Images Available</span>
                  )}
                  {pgDetail.videoUrls?.length ? (
                    <button
                      className="media-view-btn"
                      onClick={() => {
                        setMediaType("video");
                        setMediaIndex(0);
                        setShowMediaViewer(true);
                      }}
                    >
                      View Videos ({pgDetail.videoUrls.length})
                    </button>
                  ) : (
                    <span className="empty-text">No Videos Available</span>
                  )}
                </div>

                {/* ── Drag & Drop Image Upload ── */}
                <div className="img-upload-section">
                  <div
                    className={`img-drop-zone${isDragOver ? " drag-over" : ""}`}
                    onDrop={handleDropZoneDrop}
                    onDragOver={handleDropZoneDragOver}
                    onDragLeave={handleDropZoneDragLeave}
                    onClick={() =>
                      document.getElementById("pg-img-file-input").click()
                    }
                  >
                    <div className="img-drop-icon">
                      <FaFolderOpen />
                    </div>
                    <p className="img-drop-label">
                      Drag & drop images here, or{" "}
                      <span className="img-drop-browse">browse</span>
                    </p>
                    <p className="img-drop-hint">PNG, JPG, WEBP supported</p>
                    <input
                      id="pg-img-file-input"
                      type="file"
                      accept="image/*"
                      multiple
                      className="pg-detail-hidden"
                      onChange={(e) => addFilesToUpload(e.target.files)}
                    />
                  </div>

                  {uploadFiles.length > 0 && (
                    <div className="img-upload-previews">
                      {uploadFiles.map((entry) => (
                        <div
                          key={entry.id}
                          className={`img-upload-thumb img-upload-thumb--${entry.status}`}
                        >
                          <img src={entry.preview} alt="preview" />
                          {entry.status === "uploading" && (
                            <div className="img-upload-overlay">
                              <div className="img-upload-spinner" />
                            </div>
                          )}
                          {entry.status === "done" && (
                            <div className="img-upload-overlay img-upload-overlay--done">
                              ✓
                            </div>
                          )}
                          {entry.status === "error" && (
                            <div className="img-upload-overlay img-upload-overlay--error">
                              ✕
                            </div>
                          )}
                          {entry.status !== "uploading" && (
                            <button
                              className="img-upload-remove"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeUploadFile(entry.id);
                              }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadFiles.some((f) => f.status === "pending") && (
                    <button
                      className="img-upload-btn"
                      onClick={handleUploadImages}
                      disabled={isUploading}
                    >
                      {isUploading
                        ? "Uploading…"
                        : `Upload ${uploadFiles.filter((f) => f.status === "pending").length} Image${uploadFiles.filter((f) => f.status === "pending").length !== 1 ? "s" : ""}`}
                    </button>
                  )}
                </div>

                <h6 className="section-title mt-4">About Property</h6>
                <p className="about-text">
                  {showValue(pgDetail.aboutDescription)}
                </p>

                <h6 className="section-title mt-4">Room Options</h6>
                <div className="room-grid">
                  {pgDetail.floors?.flatMap((floor) =>
                    floor.rooms?.map((room) => {
                      const avail =
                        room.beds?.filter((b) => b.status === "AVAILABLE")
                          .length || 0;
                      return (
                        <div key={room.roomId} className="room-card">
                          <h6>{room.sharingType} Sharing</h6>
                          <p>Rs {room.monthlyRent}/month</p>
                          <small>
                            Beds: {room.beds?.length || 0} Available: {avail}
                          </small>
                        </div>
                      );
                    }),
                  )}
                </div>

                <h6 className="section-title mt-4">Amenities</h6>
                <div className="chip-container">
                  {pgDetail.amenities?.length ? (
                    pgDetail.amenities.map((a, i) => (
                      <span key={i} className="chip">
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className="empty-text">Not specified</span>
                  )}
                </div>

                <h6 className="section-title mt-4">House Rules</h6>
                <ul className="rules-list">
                  {pgDetail.houseRules?.length ? (
                    pgDetail.houseRules.map((r, i) => <li key={i}>{r}</li>)
                  ) : (
                    <span className="empty-text">Not specified</span>
                  )}
                </ul>

                <h6 className="section-title mt-4">Floor Details</h6>
                {pgDetail.floors?.length ? (
                  pgDetail.floors.map((floor) => {
                    const totalBeds =
                      floor.rooms?.reduce(
                        (s, r) => s + (r.beds?.length || 0),
                        0,
                      ) || 0;
                    const availBeds =
                      floor.rooms?.reduce(
                        (s, r) =>
                          s +
                          (r.beds?.filter((b) => b.status === "AVAILABLE")
                            .length || 0),
                        0,
                      ) || 0;
                    const sharing = [
                      ...new Set(floor.rooms?.map((r) => r.sharingType)),
                    ];
                    return (
                      <div key={floor.floorId} className="floor-card detailed">
                        <h6 className="fw-bold mb-3">
                          Floor {floor.floorNumber}
                        </h6>
                        <div className="floor-stats">
                          <span>
                            <strong>Rooms:</strong> {floor.rooms?.length || 0}
                          </span>
                          <span>
                            <strong>Total Beds:</strong> {totalBeds}
                          </span>
                          <span className="available">
                            <strong>Available:</strong> {availBeds}
                          </span>
                          <span className="occupied">
                            <strong>Occupied:</strong> {totalBeds - availBeds}
                          </span>
                          <span>
                            <strong>Sharing:</strong>{" "}
                            {sharing.join(", ") || "Not specified"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <span className="empty-text">Not specified</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showMediaViewer && (
        <div
          className="modal-backdrop-custom"
          onClick={() => setShowMediaViewer(false)}
        >
          <div
            className="modal-box modal-box-wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="media-viewer-body">
              <button
                className="media-close"
                onClick={() => setShowMediaViewer(false)}
              >
                X
              </button>
              <button
                className="media-nav prev"
                onClick={() => setMediaIndex((i) => Math.max(i - 1, 0))}
              >
                &#8249;
              </button>
              {mediaType === "image" ? (
                <img
                  src={pgDetail?.imageUrls?.[mediaIndex]}
                  alt="PG"
                  className="viewer-media"
                />
              ) : (
                <video
                  controls
                  src={pgDetail?.videoUrls?.[mediaIndex]}
                  className="viewer-media"
                />
              )}
              {activeTab === "PENDING" &&
                currentUrl &&
                currentUrl !== DEFAULT_PG_IMAGE && (
                  <button
                    className="media-delete-btn"
                    onClick={handleDeleteMedia}
                  >
                    <FaTrash />
                  </button>
                )}
              {/* Rearrange button — only for images */}
              {mediaType === "image" && pgDetail?.imageUrls?.length > 1 && (
                <button
                  className="media-rearrange-btn"
                  title="Rearrange images"
                  onClick={(e) => {
                    e.stopPropagation();
                    openRearrange();
                  }}
                >
                  ⇅
                </button>
              )}
              <button
                className="media-nav next"
                onClick={() =>
                  setMediaIndex((i) =>
                    mediaType === "image"
                      ? Math.min(i + 1, pgDetail.imageUrls.length - 1)
                      : Math.min(i + 1, pgDetail.videoUrls.length - 1),
                  )
                }
              >
                &#8250;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ REARRANGE MODAL ══ */}
      {showRearrange && (
        <div
          className="modal-backdrop-custom"
          onClick={() => setShowRearrange(false)}
        >
          <div
            className="modal-box modal-box-medium"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-flex">
              <h5 className="modal-title-bold">⇅ Rearrange Images</h5>
              <button
                onClick={() => setShowRearrange(false)}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>
            <p className="modal-desc-text">
              Drag and drop images to reorder them.
            </p>
            <SortableImageGrid
              imageList={rearrangeList}
              onChange={setRearrangeList}
              onRemove={(i) =>
                setRearrangeList((prev) => prev.filter((_, idx) => idx !== i))
              }
            />
            <div className="modal-actions-right">
              <button
                onClick={() => setShowRearrange(false)}
                className="modal-btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={saveRearrangedOrder}
                className="modal-btn-primary"
              >
                Apply Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPGVerification;
