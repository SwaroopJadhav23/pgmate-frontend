import { FaBed } from "react-icons/fa";
import { useEffect, useState, useCallback } from "react";
import { useNavigate,  } from "react-router-dom";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import { TableSkeleton } from "../public/Skeleton";
import "./AvailableBeds.css";

const PAGE_SIZE = 50;
const formatBedCode = (bed) => `${bed.roomNumber}-B${bed.bedNumber}`;

const AvailableBeds = ({ apiPrefix = "/owner" }) => {
  const pgEndpoint = apiPrefix === "/manager" ? "/manager/pg/my" : "/owner/pgs";
  const floorEndpoint = apiPrefix === "/manager" ? "/manager/floors" : "/owner/floors";
  const roomEndpoint = apiPrefix === "/manager" ? "/manager/rooms" : "/owner/rooms";
  const bedEndpoint = apiPrefix === "/manager" ? "/manager/beds" : "/owner/beds";

  const [pgs, setPgs] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);

  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [pgId, setPgId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [sharing, setSharing] = useState("");
  const [roomType, setRoomType] = useState("");

  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [stats, setStats] = useState({ totalPgs: 0, single: 0, double: 0, triple: 0, quadruple: 0, custom: 0 });

  const loadBeds = useCallback(async (nextPage = 0, append = false) => {
    try {
      append ? setLoadingMore(true) : setLoading(true);

      const params = new URLSearchParams();
      params.append("page", nextPage);
      params.append("size", PAGE_SIZE);
      if (search.trim()) params.append("search", search.trim());
      if (pgId) params.append("pgId", pgId);
      if (floorId) params.append("floorId", floorId);
      if (roomId) params.append("roomId", roomId);
      if (sharing) params.append("sharing", sharing);
      if (roomType) params.append("roomType", roomType);

      const res = await api.get(`${bedEndpoint}/available?${params.toString()}`);
      const content = res.data?.content || [];
      const totalPages = res.data?.totalPages || 0;

      setBeds((prev) => (append ? [...prev, ...content] : content));
      setPage(nextPage);
      setTotalElements(res.data?.totalElements || 0);
      setHasMore(nextPage + 1 < totalPages);

      if (!append) {
        setStats((prev) => ({
          ...prev,
          single: content.filter((b) => b.sharingType === "SINGLE").length,
          double: content.filter((b) => b.sharingType === "DOUBLE").length,
          triple: content.filter((b) => b.sharingType === "TRIPLE").length,
          quadruple: content.filter((b) => b.sharingType === "QUADRUPLE").length,
          custom: content.filter((b) => b.sharingType === "CUSTOM").length,
        }));
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [bedEndpoint, floorId, pgId, roomId, search, sharing, roomType]);

  useEffect(() => {
    api.get(pgEndpoint).then((res) => {
      setPgs(res.data);
      setStats((prev) => ({ ...prev, totalPgs: res.data?.length || 0 }));
    });
  }, [pgEndpoint]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => { loadBeds(0, false); }, [loadBeds]);

  useEffect(() => {
    if (!pgId) { setFloors([]); setFloorId(""); setRoomId(""); return; }
    api.get(`${floorEndpoint}/pg/${pgId}`).then((res) => setFloors(res.data));
  }, [floorEndpoint, pgId]);

  useEffect(() => {
    if (!floorId) { setRooms([]); setRoomId(""); return; }
    api.get(`${roomEndpoint}?floorId=${floorId}`).then((res) => setRooms(res.data));
  }, [floorId, roomEndpoint]);

  const getSharingBadgeClass = (type) => {
    if (type === "SINGLE") return "avb-badge avb-badge--single";
    if (type === "DOUBLE") return "avb-badge avb-badge--double";
    if (type === "TRIPLE") return "avb-badge avb-badge--triple";
    if (type === "QUADRUPLE") return "avb-badge avb-badge--quadruple";
    if (type === "CUSTOM") return "avb-badge avb-badge--custom";
    return "avb-badge";
  };

  const getSharingCardClass = (type) => {
    if (type === "SINGLE") return "avb-card avb-card--single";
    if (type === "DOUBLE") return "avb-card avb-card--double";
    if (type === "TRIPLE") return "avb-card avb-card--triple";
    if (type === "QUADRUPLE") return "avb-card avb-card--quadruple";
    if (type === "CUSTOM") return "avb-card avb-card--custom";
    return "avb-card";
  };

  const handleAssign = (bed) => {
    navigate(`${apiPrefix}/residents/add`, { state: { prefill: bed } });
  };

  return (
    <DashboardLayout title="Available Beds" subtitle="Assign Tenants">

      {/* ── Stats Row ── */}
      <div className="owners-stats-row">
        <div className="owners-stat-card" style={{ borderTopColor: "#5B5BD6" }}>
          <div className="owners-stat-icon" style={{ background: "#eef2ff" }}>
            <i className="bi bi-house-fill" style={{ color: "#5B5BD6" }}></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{stats.totalPgs}</div>
            <div className="owners-stat-label">Total PGs</div>
            <div className="owners-stat-sub">Properties tracked</div>
          </div>
        </div>

        <div className="owners-stat-card" style={{ borderTopColor: "#16a34a" }}>
          <div className="owners-stat-icon" style={{ background: "#f0fdf4" }}>
            <i className="bi bi-person-fill" style={{ color: "#16a34a" }}></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{stats.single}</div>
            <div className="owners-stat-label">Single Sharing</div>
            <div className="owners-stat-sub">Available beds</div>
          </div>
        </div>

        <div className="owners-stat-card" style={{ borderTopColor: "#ea580c" }}>
          <div className="owners-stat-icon" style={{ background: "#fff7ed" }}>
            <i className="bi bi-people-fill" style={{ color: "#ea580c" }}></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{stats.double}</div>
            <div className="owners-stat-label">Double Sharing</div>
            <div className="owners-stat-sub">Available beds</div>
          </div>
        </div>

        <div className="owners-stat-card" style={{ borderTopColor: "#9333ea" }}>
          <div className="owners-stat-icon" style={{ background: "#fdf4ff" }}>
            <i className="bi bi-people-fill" style={{ color: "#9333ea" }}></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{stats.triple}</div>
            <div className="owners-stat-label">Triple Sharing</div>
            <div className="owners-stat-sub">Available beds</div>
          </div>
        </div>

        <div className="owners-stat-card" style={{ borderTopColor: "#8b5cf6" }}>
          <div className="owners-stat-icon" style={{ background: "#f5f3ff" }}>
            <i className="bi bi-people-fill" style={{ color: "#8b5cf6" }}></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{stats.quadruple}</div>
            <div className="owners-stat-label">4 Sharing</div>
            <div className="owners-stat-sub">Available beds</div>
          </div>
        </div>

        <div className="owners-stat-card" style={{ borderTopColor: "#0891b2" }}>
          <div className="owners-stat-icon" style={{ background: "#ecfeff" }}>
            <i className="bi bi-grid-fill" style={{ color: "#0891b2" }}></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{stats.custom}</div>
            <div className="owners-stat-label">Custom Sharing</div>
            <div className="owners-stat-sub">Available beds</div>
          </div>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="avb-search-bar">
        <span className="avb-search-label">Search</span>
        <input
          type="text"
          placeholder="Search by PG name, room or bed number..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="avb-search-input"
        />
        {searchInput && (
          <button className="avb-search-clear" onClick={() => setSearchInput("")}>
            Clear
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="avb-filters-card">
        <select className="avb-filter-select" value={pgId} onChange={(e) => setPgId(e.target.value)}>
          <option value="">All PGs</option>
          {pgs.map((pg) => (
            <option key={pg.id} value={pg.id}>{pg.name}</option>
          ))}
        </select>

        <select className="avb-filter-select" value={floorId} onChange={(e) => setFloorId(e.target.value)} disabled={!pgId}>
          <option value="">All Floors</option>
          {floors.map((f) => (
            <option key={f.id} value={f.id}>Floor {f.floorNumber}</option>
          ))}
        </select>

        <select className="avb-filter-select" value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={!floorId}>
          <option value="">All Rooms</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.roomNumber}</option>
          ))}
        </select>

        <select className="avb-filter-select" value={sharing} onChange={(e) => setSharing(e.target.value)}>
          <option value="">All Sharing</option>
          <option value="SINGLE">SINGLE</option>
          <option value="DOUBLE">DOUBLE</option>
          <option value="TRIPLE">TRIPLE</option>
          <option value="QUADRUPLE">4 Sharing</option>
          <option value="CUSTOM">CUSTOM</option>
        </select>

        <select className="avb-filter-select" value={roomType} onChange={(e) => setRoomType(e.target.value)}>
          <option value="">All Types</option>
          <option value="AC">AC</option>
          <option value="NON_AC">Non-AC</option>
        </select>
      </div>

      {/* ── Result Count ── */}
      <p className="avb-result-count">
        Showing <strong>{beds.length}</strong> of {totalElements} available beds
      </p>

      {/* ════════════════════════════════════════
          DESKTOP TABLE
          Hidden on mobile via CSS.
          ════════════════════════════════════════ */}
      <div className="avb-desktop-wrap">
        <div className="avb-table-scroll">
          <table className="avb-table">
            <thead>
              <tr>
                <th className="avb-th avb-th--pg">PG Name</th>
                <th className="avb-th avb-th--floor">Floor</th>
                <th className="avb-th avb-th--room">Room</th>
                <th className="avb-th avb-th--bed">Bed Code</th>
                <th className="avb-th avb-th--sharing">Sharing</th>
                <th className="avb-th avb-th--action">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={8} cols={6} />
              ) : beds.length === 0 ? (
                <tr>
                  <td colSpan="6" className="avb-empty-cell">
                    {search ? `No beds found for "${search}"` : "No available beds found"}
                  </td>
                </tr>
              ) : (
                beds.map((b) => (
                  <tr key={b.bedId} className="avb-tr">
                    <td className="avb-td avb-td--primary">{b.pgName}</td>
                    <td className="avb-td">{b.floorNumber}</td>
                    <td className="avb-td">{b.roomNumber}</td>
                    <td className="avb-td avb-td--bed">{formatBedCode(b)}</td>
                    <td className="avb-td">
                      <span className={getSharingBadgeClass(b.sharingType)}>
                        {b.sharingType === "QUADRUPLE" ? "4 Sharing" : b.sharingType}
                      </span>
                    </td>
                    <td className="avb-td">
                      <button className="avb-assign-btn" onClick={() => handleAssign(b)}>
                        Add Tenant
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ════════════════════════════════════════
          MOBILE CARD LIST
          Lives outside any scroll/overflow wrapper.
          Hidden on desktop via CSS.
          ════════════════════════════════════════ */}
      <div className="avb-mobile-list">
        {loading ? (
          <div className="avb-mobile-loading">Loading…</div>
        ) : beds.length === 0 ? (
          <div className="avb-mobile-empty">
            {search ? `No beds found for "${search}"` : "No available beds found"}
          </div>
        ) : (
          beds.map((b) => (
            <div key={b.bedId} className={getSharingCardClass(b.sharingType)}>

              {/* Card Header */}
              <div className="avb-card-header">
                <div className="avb-card-header-left">
                  <div className="avb-card-icon"><FaBed /></div>
                  <div>
                    <div className="avb-card-pgname">{b.pgName}</div>
                    <div className="avb-card-bedcode">{formatBedCode(b)}</div>
                  </div>
                </div>
                <span className={getSharingBadgeClass(b.sharingType)}>
                  {b.sharingType === "QUADRUPLE" ? "4 Sharing" : b.sharingType}
                </span>
              </div>

              {/* Card Body */}
              <div className="avb-card-body">
                <div className="avb-card-row">
                  <span className="avb-card-label">Floor</span>
                  <span className="avb-card-value">{b.floorNumber}</span>
                </div>
                <div className="avb-card-row">
                  <span className="avb-card-label">Room</span>
                  <span className="avb-card-value">{b.roomNumber}</span>
                </div>
                <div className="avb-card-row">
                  <span className="avb-card-label">Bed</span>
                  <span className="avb-card-value avb-card-value--bed">{formatBedCode(b)}</span>
                </div>
                {b.roomType && (
                  <div className="avb-card-row">
                    <span className="avb-card-label">Type</span>
                    <span className="avb-card-value">{b.roomType}</span>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="avb-card-footer">
                <button className="avb-assign-btn avb-assign-btn--full" onClick={() => handleAssign(b)}>
                  + Add Tenant
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* ── Load More ── */}
      {hasMore && (
        <div className="avb-load-more-wrap">
          <button
            type="button"
            className="avb-load-more-btn"
            onClick={() => loadBeds(page + 1, true)}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      </DashboardLayout>
  );
};

export default AvailableBeds;
