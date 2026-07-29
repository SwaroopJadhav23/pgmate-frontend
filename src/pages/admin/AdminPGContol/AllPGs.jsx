import { FaHome } from "react-icons/fa";
import { useEffect, useState, useCallback, useRef } from "react";
import api from "../../../api/axios";
import { useLocation, useNavigate } from "react-router-dom";
import { TableSkeleton, UniversalCardSkeleton } from "../../public/Skeleton";
import DashboardLayout from "../../../layouts/DashboardLayout";
import toast from "react-hot-toast";
import "./AllPGs.css";

const PAGE_SIZE = 20;

const AllPGs = ({ basePath = "/admin" }) => {
  const [pgs, setPgs] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const openPgId = params.get("openPg");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pgDetail, setPgDetail] = useState(null);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [mediaType, setMediaType] = useState("image");
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const navigate = useNavigate();
  const modalOpenedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [sortDir, setSortDir] = useState("DESC");
  const [genderFilter, setGenderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pgStats, setPgStats] = useState({ male: 0, female: 0, active: 0, inactive: 0 });

  const load = useCallback(
    async (nextPage = 0, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const res = await api.get(`${basePath}/pgs/paged`, {
          params: {
            page: nextPage,
            size: PAGE_SIZE,
            search: search.trim() || undefined,
            sortDir,
            genderType: genderFilter || undefined,
            status: statusFilter || undefined,
          },
        });

        const content = res.data?.content || [];
        setPgs((prev) => (append ? [...prev, ...content] : content));
        setPage(res.data?.number || nextPage);
        setTotalPages(res.data?.totalPages || 0);
        setTotalElements(res.data?.totalElements || 0);
      } catch (err) {
        console.error(err);
        alert("Failed to load PG details");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [basePath, search, sortDir, genderFilter, statusFilter],
  );

  const loadStats = useCallback(async () => {
    try {
      const [male, female, active, inactive] = await Promise.all([
        api.get(`${basePath}/pgs/paged`, { params: { size: 1, genderType: "MALE" } }),
        api.get(`${basePath}/pgs/paged`, { params: { size: 1, genderType: "FEMALE" } }),
        api.get(`${basePath}/pgs/paged`, { params: { size: 1, status: "ACTIVE" } }),
        api.get(`${basePath}/pgs/paged`, { params: { size: 1, status: "INACTIVE" } }),
      ]);
      setPgStats({
        male: male.data.totalElements,
        female: female.data.totalElements,
        active: active.data.totalElements,
        inactive: inactive.data.totalElements,
      });
    } catch (err) {
      console.error("Stats load failed", err);
    }
  }, [basePath]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => { load(0, false); }, [load]);
  useEffect(() => { loadStats(); }, [loadStats]);

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

  const openDetailModal = useCallback(
    async (pg) => {
      setShowDetailModal(true);
      setDetailError("");
      setLoadingDetail(true);
      setPgDetail({
        id: pg.id,
        name: pg.name,
        ownerName: getOwnerName(pg),
        city: pg.city,
        locality: pg.locality,
        status: pg.status,
        genderType: pg.genderType,
        amenities: [],
        imageUrls: [],
        videoUrls: [],
        houseRules: [],
        floors: [],
      });
      try {
        const res = await api.get(`${basePath}/owners/pg/${pg.id}`, { timeout: 15000 });
        setPgDetail(res.data);
      } catch (error) {
        console.error(error);
        setDetailError("Could not load the full PG details. Please try again.");
      } finally {
        setLoadingDetail(false);
      }
    },
    [basePath],
  );

  useEffect(() => {
    if (!openPgId || pgs.length === 0 || modalOpenedRef.current) return;
    modalOpenedRef.current = true;
    const selectedPg = pgs.find((pg) => pg.id === openPgId);
    if (selectedPg) openDetailModal(selectedPg);
    navigate(`${basePath}/all-pgs`, { replace: true });
  }, [openPgId, pgs, navigate, openDetailModal, basePath]);

  const toggleVisibility = async (pgId, current) => {
    setPgs((prev) => prev.map((pg) => (pg.id === pgId ? { ...pg, isPublic: !current } : pg)));
    try {
      await api.put(`${basePath}/owners/pg/${pgId}/visibility?isPublic=${!current}`);
    } catch {
      setPgs((prev) => prev.map((pg) => (pg.id === pgId ? { ...pg, isPublic: current } : pg)));
      alert("Failed to update visibility");
    }
  };

  const handleNormalizeLocalities = async () => {
    try {
      const res = await api.post(`${basePath}/pgs/normalize-localities`);
      toast.success(`Normalized ${res.data.pgsUpdated} PGs successfully!`);
      load(page);
    } catch (err) {
      console.error(err);
      toast.error("Failed to normalize localities.");
    }
  };


  const toggleReservation = async (pgId, current) => {
    setPgs((prev) =>
      prev.map((pg) => (pg.id === pgId ? { ...pg, reservationEnabled: !current } : pg)),
    );
    try {
      await api.put(`${basePath}/owners/pg/${pgId}/reservation?enabled=${!current}`);
    } catch {
      setPgs((prev) =>
        prev.map((pg) => (pg.id === pgId ? { ...pg, reservationEnabled: current } : pg)),
      );
      alert("Failed to update reservation");
    }
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setShowMediaViewer(false);
    setMediaIndex(0);
    setPgDetail(null);
    setDetailError("");
    setLoadingDetail(false);
  };

  const showValue = (value, fallback = "Not specified") =>
    value && value.length !== 0 ? value : fallback;

  const pageOffset = page * PAGE_SIZE;

  return (
    <DashboardLayout title="AllPGS" subtitle="All pgs list">
      {/* Stat Cards */}
      <div className="allpg-stats-row">
        <div className="allpg-stat-card allpg-stat-blue">
          <div className="allpg-stat-icon">
            <i className="bi bi-person-fill"></i>
          </div>
          <div className="allpg-stat-info">
            <div className="allpg-stat-value">{loading ? "—" : pgStats.male}</div>
            <div className="allpg-stat-label">Male PGs</div>
            <div className="allpg-stat-sub">Male only accommodations</div>
          </div>
        </div>

        <div className="allpg-stat-card allpg-stat-pink">
          <div className="allpg-stat-icon">
            <i className="bi bi-person-fill"></i>
          </div>
          <div className="allpg-stat-info">
            <div className="allpg-stat-value">{loading ? "—" : pgStats.female}</div>
            <div className="allpg-stat-label">Female PGs</div>
            <div className="allpg-stat-sub">Female only accommodations</div>
          </div>
        </div>

        <div className="allpg-stat-card allpg-stat-green">
          <div className="allpg-stat-icon">
            <i className="bi bi-patch-check-fill"></i>
          </div>
          <div className="allpg-stat-info">
            <div className="allpg-stat-value">{loading ? "—" : pgStats.active}</div>
            <div className="allpg-stat-label">Active PGs</div>
            <div className="allpg-stat-sub">Currently live on platform</div>
          </div>
        </div>

        <div className="allpg-stat-card allpg-stat-grey">
          <div className="allpg-stat-icon">
            <i className="bi bi-slash-circle-fill"></i>
          </div>
          <div className="allpg-stat-info">
            <div className="allpg-stat-value">{loading ? "—" : pgStats.inactive}</div>
            <div className="allpg-stat-label">Inactive PGs</div>
            <div className="allpg-stat-sub">Not visible to users</div>
          </div>
        </div>
      </div>


      <div className="pg-top-bar">
        <div className="pg-search-wrapper">
          <i className="bi bi-search search-icon"></i>
          <input
            className="form-control"
            placeholder="Search by PG name, city or owner..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <button 
          className="btn btn-warning fw-bold px-3 py-2 ms-2 me-auto" 
          onClick={handleNormalizeLocalities}
          title="Fix duplicate localities in the database"
        >
          <i className="bi bi-magic me-2"></i> Normalize Localities
        </button>

        <select
          className="allpg-sort-select"
          value={sortDir}
          onChange={(e) => { setSortDir(e.target.value); setPage(0); }}
        >
          <option value="DESC">Newest First</option>
          <option value="ASC">Oldest First</option>
        </select>

        <select
          className="allpg-sort-select"
          value={genderFilter}
          onChange={(e) => { setGenderFilter(e.target.value); setPage(0); }}
        >
          <option value="">All Genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>

        <select
          className="allpg-sort-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        
      </div>

      <div className="" style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>
        Showing {pgs.length} of {totalElements} PGs
      </div>

      <div className="pg-table-wrapper">
        <table className="pg-table">
          <thead>
            <tr>
              <th>Sr No</th>
              <th>PG Name</th>
              <th>Owner</th>
              <th>City</th>
              <th>Locality</th>
              <th>Gender</th>
              <th className="text-center">Status</th>
              <th className="text-center">Verified</th>
              <th className="text-center">Public</th>
              <th className="text-center">Reservation</th>
              <th className="text-center">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={8} cols={11} />
            ) : pgs.length === 0 ? (
              <tr>
                <td colSpan="11" className="pg-table-empty">
                  No PGs found
                </td>
              </tr>
            ) : (
              pgs.map((pg, index) => (
                <tr key={pg.id}>
                  <td style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}>
                    {pageOffset + index + 1}
                  </td>
                  <td>
                    <div className="pg-name-cell">
                      <div className="pg-name-icon"><FaHome /></div>
                      <span className="pg-name-text">{pg.name}</span>
                    </div>
                  </td>
                  <td style={{ color: "#64748b" }}>{getOwnerName(pg)}</td>
                  <td style={{ color: "#64748b" }}>{pg.city}</td>
                  <td style={{ color: "#64748b", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {pg.locality}
                  </td>
                  <td style={{ color: "#64748b" }}>{pg.genderType}</td>
                  <td className="text-center">
                    <span className={`statuss-pill ${pg.status || "INACTIVE"}`}>{pg.status}</span>
                  </td>
                  <td className="text-center">
                    <span className={`statuss-pill ${pg.verified ? "APPROVED" : "REJECTED"}`}>
                      {pg.verified ? "Verified" : "Unverified"}
                    </span>
                  </td>
                  <td className="text-center">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={Boolean(pg.isPublic)}
                        onChange={() => toggleVisibility(pg.id, pg.isPublic)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td className="text-center">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={Boolean(pg.reservationEnabled)}
                        onChange={() => toggleReservation(pg.id, pg.reservationEnabled)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td className="text-center">
                    <button className="btn-tbl btn-tbl-details" onClick={() => openDetailModal(pg)}>
                      Details
                    </button>
                  </td>
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
          <p style={{ textAlign: "center", color: "#94a3b8", padding: "32px 0" }}>No PGs found</p>
        ) : (
          pgs.map((pg, index) => (
            <div key={pg.id} className="pg-card">
              <div className="pg-card-bar" />
              <div className="pg-card-body">
                <div className="pg-card-top">
                  <div>
                    <div className="pg-card-name">
                      <span style={{ color: "#94a3b8", fontSize: "12px", marginRight: "6px" }}>
                        #{pageOffset + index + 1}
                      </span>
                      {pg.name}
                    </div>
                    <div className="pg-card-sub">{getOwnerName(pg)}</div>
                  </div>
                  <div className="pg-card-badges">
                    <span className={`statuss-pill ${pg.status || "INACTIVE"}`}>{pg.status}</span>
                    <span className={`statuss-pill ${pg.verified ? "APPROVED" : "REJECTED"}`}>
                      {pg.verified ? "Verified" : "Unverified"}
                    </span>
                  </div>
                </div>
                <div className="pg-card-meta">
                  <div className="pg-card-meta-item"><i className="bi bi-geo-alt-fill"></i>{pg.city}</div>
                  <div className="pg-card-meta-item"><i className="bi bi-map"></i>{pg.locality}</div>
                  <div className="pg-card-meta-item"><i className="bi bi-person-fill"></i>{pg.genderType}</div>
                </div>
                <div className="pg-card-toggles">
                  <div className="pg-card-toggle-item">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={Boolean(pg.isPublic)}
                        onChange={() => toggleVisibility(pg.id, pg.isPublic)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    Public
                  </div>
                  <div className="pg-card-toggle-item">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={Boolean(pg.reservationEnabled)}
                        onChange={() => toggleReservation(pg.id, pg.reservationEnabled)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    Reservation
                  </div>
                </div>
                <div className="pg-card-actions">
                  <button className="btn-tbl btn-tbl-details" onClick={() => openDetailModal(pg)}>
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && page + 1 < totalPages && (
        <div className="admin-load-more-wrap">
          <button className="admin-load-more-btn" onClick={() => load(page + 1, true)} disabled={loadingMore}>
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {showDetailModal && (
        <div className="modal-backdrop-custom" onClick={closeDetail}>
          <div className="modal-box" style={{ maxWidth: "900px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h4>PG Details</h4>
              <button className="modal-close" onClick={closeDetail}>X</button>
            </div>
            {!pgDetail ? (
              <div className="text-center p-5" style={{ color: "#94a3b8" }}>Loading PG Details...</div>
            ) : (
              <>
                {loadingDetail && (
                  <div className="text-center" style={{ color: "#94a3b8", marginBottom: "16px" }}>
                    Loading full PG details...
                  </div>
                )}
                {detailError && (
                  <div className="text-center" style={{ color: "#dc2626", marginBottom: "16px" }}>
                    {detailError}
                  </div>
                )}
                <div className="pg-header">
                  <h3>{pgDetail.name}</h3>
                  <span className={`statuss-pill ${pgDetail.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"}`}>
                    {pgDetail.status}
                  </span>
                </div>
                <p className="fw-semibold mb-1" style={{ color: "#475569" }}>
                  Owner: {pgDetail.ownerName || getOwnerName(pgDetail)}
                </p>
                <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
                  {pgDetail.locality}, {pgDetail.city}
                </p>

                <div className="media-section">
                  {pgDetail.imageUrls?.length ? (
                    <button
                      className="media-view-btn"
                      onClick={() => { setMediaType("image"); setMediaIndex(0); setShowMediaViewer(true); }}
                    >
                      View Images ({pgDetail.imageUrls.length})
                    </button>
                  ) : (
                    <span className="empty-text">No Images Available</span>
                  )}
                  {pgDetail.videoUrls?.length ? (
                    <button
                      className="media-view-btn"
                      onClick={() => { setMediaType("video"); setMediaIndex(0); setShowMediaViewer(true); }}
                    >
                      View Videos ({pgDetail.videoUrls.length})
                    </button>
                  ) : (
                    <span className="empty-text">No Videos Available</span>
                  )}
                </div>

                <h6 className="section-title mt-4">About Property</h6>
                <p className="about-text">{showValue(pgDetail.aboutDescription)}</p>

                <h6 className="section-title mt-4">Room Options</h6>
                <div className="room-grid">
                  {pgDetail.floors?.flatMap((floor) =>
                    floor.rooms?.map((room) => {
                      const avail = room.beds?.filter((b) => b.status === "AVAILABLE").length || 0;
                      return (
                        <div key={room.roomId} className="room-card">
                          <h6>{room.sharingType} Sharing</h6>
                          <p>Rs {room.monthlyRent}/month</p>
                          <small>Beds: {room.beds?.length || 0} — Available: {avail}</small>
                        </div>
                      );
                    })
                  )}
                </div>

                <h6 className="section-title mt-4">Amenities</h6>
                <div className="chip-container">
                  {pgDetail.amenities?.length
                    ? pgDetail.amenities.map((a, i) => <span key={i} className="chip">{a}</span>)
                    : <span className="empty-text">Not specified</span>}
                </div>

                <h6 className="section-title mt-4">House Rules</h6>
                <ul className="rules-list">
                  {pgDetail.houseRules?.length
                    ? pgDetail.houseRules.map((r, i) => <li key={i}>{r}</li>)
                    : <span className="empty-text">Not specified</span>}
                </ul>

                <h6 className="section-title mt-4">Floor Details</h6>
                {pgDetail.floors?.length ? (
                  pgDetail.floors.map((floor) => {
                    const totalBeds = floor.rooms?.reduce((s, r) => s + (r.beds?.length || 0), 0) || 0;
                    const availBeds = floor.rooms?.reduce(
                      (s, r) => s + (r.beds?.filter((b) => b.status === "AVAILABLE").length || 0), 0
                    ) || 0;
                    const sharing = [...new Set(floor.rooms?.map((r) => r.sharingType))];
                    return (
                      <div key={floor.floorId} className="floor-card detailed">
                        <h6 className="fw-bold mb-3">Floor {floor.floorNumber}</h6>
                        <div className="floor-stats">
                          <span><strong>Rooms:</strong> {floor.rooms?.length || 0}</span>
                          <span><strong>Total Beds:</strong> {totalBeds}</span>
                          <span className="available"><strong>Available:</strong> {availBeds}</span>
                          <span className="occupied"><strong>Occupied:</strong> {totalBeds - availBeds}</span>
                          <span><strong>Sharing:</strong> {sharing.join(", ") || "Not specified"}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <span className="empty-text">Not specified</span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showMediaViewer && (
        <div className="modal-backdrop-custom" onClick={() => setShowMediaViewer(false)}>
          <div className="modal-box" style={{ maxWidth: "900px", boxSizing: "border-box" }} onClick={(e) => e.stopPropagation()}>
            <div className="media-viewer-body">
              <button className="media-close" onClick={() => setShowMediaViewer(false)}>X</button>
              <button className="media-nav prev" onClick={() => setMediaIndex((i) => Math.max(i - 1, 0))}>
                &#8249;
              </button>
              {mediaType === "image" ? (
                <img src={pgDetail?.imageUrls?.[mediaIndex]} alt="PG" className="viewer-media" />
              ) : (
                <video controls src={pgDetail?.videoUrls?.[mediaIndex]} className="viewer-media" />
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
    </DashboardLayout>
  );
};

export default AllPGs;