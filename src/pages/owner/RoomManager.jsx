import { FaSnowflake, FaFan } from "react-icons/fa";
import { useCallback, useEffect, useMemo, useState } from "react";
import React from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import "./RoomManager.css";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

const EMPTY_FORM = {
  baseRoomNumber: "",
  roomNumber: "",
  sharingType: "SINGLE",
  monthlyRent: "",
  deposit: "",
  dailyRent: "",
  roomType: "",
  customBedCount: "",
};

const sharingLabel = {
  SINGLE: "Single",
  DOUBLE: "Double",
  TRIPLE: "Triple",
  QUADRUPLE: "4 Sharing",
  CUSTOM: "Custom",
};


const formatMoney = (value) => `\u20B9 ${Number(value || 0).toLocaleString("en-IN")}`;
const sharingSuffix = { SINGLE: "S", DOUBLE: "D", TRIPLE: "T", QUADRUPLE: "Q", CUSTOM: "C" };
const getBaseRoomNumber = (room) => room?.baseRoomNumber || room?.roomNumber?.split("-")?.[0] || "";
const getUnitCodePreview = (room) => {
  const base = getBaseRoomNumber(room).trim().toUpperCase();
  if (!base) return "Will be generated after save";
  const suffix = sharingSuffix[room?.sharingType] || "S";
  const index = room?.unitIndex || 1;
  return `${base}-${suffix}${index}`;
};

const RoomManager = ({ role }) => {
  const [pgs, setPgs] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [pgId, setPgId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [addLoading, setAddLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const pgEndpoint = role === "PG_MANAGER" ? "/manager/pg/my" : "/owner/pgs";
  const floorEndpoint = role === "PG_MANAGER" ? "/manager/floors" : "/owner/floors";
  const roomEndpoint = role === "PG_MANAGER" ? "/manager/rooms" : "/owner/rooms";

  const fetchAllRoomsGlobal = useCallback(async (pgList) => {
    try {
      if (!pgList || pgList.length === 0) { setAllRooms([]); return; }
      const floorResults = await Promise.all(
        pgList.map((pg) => api.get(`${floorEndpoint}/pg/${pg.id}`).then((r) => r.data))
      );
      const allFloors = floorResults.flat();
      if (allFloors.length === 0) { setAllRooms([]); return; }
      const roomResults = await Promise.all(
        allFloors.map((f) => api.get(`${roomEndpoint}?floorId=${f.id}`).then((r) => r.data))
      );
      setAllRooms(roomResults.flat());
    } catch { setAllRooms([]); }
  }, [floorEndpoint, roomEndpoint]);

useEffect(() => {
  api.get(pgEndpoint).then((res) => {
    const pgList = res.data;
    setPgs(pgList);
    fetchAllRoomsGlobal(pgList);
    if (pgList.length === 1) setPgId(pgList[0].id);
  });
}, [pgEndpoint, fetchAllRoomsGlobal]);

  useEffect(() => {
    if (!pgId) { setFloors([]); setFloorId(""); setRooms([]); return; }
    setFloorId(""); setRooms([]);
    api.get(`${floorEndpoint}/pg/${pgId}`).then((res) => setFloors(res.data));
  }, [pgId, floorEndpoint]);

  const loadRooms = useCallback(async () => {
    if (!floorId) { setRooms([]); return; }
    const res = await api.get(`${roomEndpoint}?floorId=${floorId}`);
    setRooms(res.data);
    fetchAllRoomsGlobal(pgs);
  }, [floorId, roomEndpoint, fetchAllRoomsGlobal, pgs]);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  const stats = useMemo(() => {
    let source = allRooms;
    if (floorId) { source = rooms; }
    else if (pgId) {
      const floorIds = new Set(floors.map((f) => f.id));
      source = allRooms.filter((r) => floorIds.has(r.floorId));
    }
    return {
      total: source.length,
      single: source.filter((r) => r.sharingType === "SINGLE").length,
      double: source.filter((r) => r.sharingType === "DOUBLE").length,
      triple: source.filter((r) => r.sharingType === "TRIPLE").length,
      quadruple: source.filter((r) => r.sharingType === "QUADRUPLE").length,
      custom: source.filter((r) => r.sharingType === "CUSTOM").length,
    };
  }, [allRooms, rooms, floorId, pgId, floors]);

  const buildPayload = (source) => ({
    floorId,
    baseRoomNumber: getBaseRoomNumber(source),
    roomNumber: getBaseRoomNumber(source),
    sharingType: source.sharingType,
    monthlyRent: Number(source.monthlyRent || 0),
    deposit: Number(source.deposit || 0),
    dailyRent: source.dailyRent === "" || source.dailyRent == null ? null : Number(source.dailyRent),
    roomType: source.roomType,
    customBedCount: source.sharingType === "CUSTOM" ? Number(source.customBedCount) : null,
  });

  const addRoom = async () => {
    if (!floorId) { toast("Please select a floor first.", { icon: "ℹ️" }); return; }
    if (!getBaseRoomNumber(form) || !form.monthlyRent) { toast("Please fill all required fields.", { icon: "⚠️" }); return; }
    if (!form.roomType) { toast("Please select AC or Non-AC.", { icon: "⚠️" }); return; }
    if (form.sharingType === "CUSTOM" && (!form.customBedCount || Number(form.customBedCount) < 5 || Number(form.customBedCount) > 20)) {
      toast("Custom sharing must be between 5 and 20 beds.", { icon: "⚠️" }); return;
    }
    setAddLoading(true);
    try {
      await api.post(roomEndpoint, buildPayload(form));
      setForm(EMPTY_FORM);
      setShowAdd(false);
      loadRooms();
      toast.success("Room added successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add room.");
    } finally { setAddLoading(false); }
  };

  const updateRoom = async () => {
    await api.put(`${roomEndpoint}/${editRoom.id}`, buildPayload(editRoom));
    setEditRoom(null);
    loadRooms();
    toast.success("Room updated successfully.");
  };

  const deleteRoom = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Room?",
      text: "This room will be permanently removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Delete",
    });
    if (!confirm.isConfirmed) return;
    await api.delete(`${roomEndpoint}/${id}`);
    loadRooms();
    toast.success("Room deleted successfully.");
  };

  const addPreview = useMemo(() => getUnitCodePreview(form), [form]);
  const editPreview = useMemo(() => (editRoom ? getUnitCodePreview(editRoom) : ""), [editRoom]);

  return (
    <DashboardLayout title="Manage Rooms" subtitle="Add and manage rooms">

      {/* ── Stats Grid ── */}
      <div className="rm-stats-grid">
        <div className="rm-stat-card total">
          <div className="rm-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" className="rm-icon">
              <path d="M3 10L12 3l9 7v10a1 1 0 0 1-1 1h-6v-6H10v6H4a1 1 0 0 1-1-1z" />
            </svg>
          </div>
          <div><div className="rm-value">{pgs.length}</div><div className="rm-label">Total PGs</div></div>
        </div>
        <div className="rm-stat-card rooms">
          <div className="rm-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" className="rm-icon">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M7 8h10M7 12h10M7 16h6" />
            </svg>
          </div>
          <div><div className="rm-value">{stats.total}</div><div className="rm-label">Total Rooms</div></div>
        </div>
        <div className="rm-stat-card single">
          <div className="rm-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" className="rm-icon">
              <circle cx="12" cy="7" r="4" /><path d="M5 21a7 7 0 0 1 14 0" />
            </svg>
          </div>
          <div><div className="rm-value">{stats.single}</div><div className="rm-label">Single Sharing Rooms</div></div>
        </div>
        <div className="rm-stat-card double">
          <div className="rm-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" className="rm-icon">
              <circle cx="9" cy="8" r="3" /><circle cx="16" cy="8" r="3" />
              <path d="M3 20a6 6 0 0 1 12 0" /><path d="M10 20a6 6 0 0 1 12 0" />
            </svg>
          </div>
          <div><div className="rm-value">{stats.double}</div><div className="rm-label">Double Sharing Rooms</div></div>
        </div>
        <div className="rm-stat-card triple">
          <div className="rm-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" className="rm-icon">
              <circle cx="6" cy="8" r="3" /><circle cx="12" cy="8" r="3" /><circle cx="18" cy="8" r="3" />
              <path d="M2 20a6 6 0 0 1 8 0" /><path d="M8 20a6 6 0 0 1 8 0" /><path d="M14 20a6 6 0 0 1 8 0" />
            </svg>
          </div>
          <div><div className="rm-value">{stats.triple}</div><div className="rm-label">Triple Sharing Rooms</div></div>
        </div>

        <div className="rm-stat-card quadruple">
          <div className="rm-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" className="rm-icon">
              <circle cx="4" cy="8" r="2.5" /><circle cx="10" cy="8" r="2.5" />
              <circle cx="14" cy="8" r="2.5" /><circle cx="20" cy="8" r="2.5" />
              <path d="M1 20a4 4 0 0 1 6 0" /><path d="M7 20a4 4 0 0 1 6 0" />
              <path d="M11 20a4 4 0 0 1 6 0" /><path d="M17 20a4 4 0 0 1 6 0" />
            </svg>
          </div>
          <div><div className="rm-value">{stats.quadruple}</div><div className="rm-label">4 Sharing Rooms</div></div>
        </div>

        <div className="rm-stat-card custom">
          <div className="rm-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" className="rm-icon">
              <circle cx="5" cy="8" r="2.5" /><circle cx="12" cy="8" r="2.5" /><circle cx="19" cy="8" r="2.5" />
              <circle cx="5" cy="16" r="2.5" /><circle cx="12" cy="16" r="2.5" /><circle cx="19" cy="16" r="2.5" />
            </svg>
          </div>
          <div><div className="rm-value">{stats.custom}</div><div className="rm-label">Custom Sharing Rooms</div></div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="room-filter-bar">
        {pgs.length === 1 ? (
  <div className="form-control rm-single-pg-display" style={{ width: "100%" }}>
    {pgs[0].name}
  </div>
) : (
  <select className="form-control" value={pgId} onChange={(e) => setPgId(e.target.value)} style={{ width: "100%" }}>
    <option value="">Select PG</option>
    {pgs.map((pg) => <option key={pg.id} value={pg.id}>{pg.name}</option>)}
  </select>
)}
        <select className="form-control" value={floorId} onChange={(e) => setFloorId(e.target.value)} disabled={!floors.length} style={{ width: "100%" }}>
          <option value="">Select Floor</option>
          {floors.map((f) => <option key={f.id} value={f.id}>Floor {f.floorNumber}</option>)}
        </select>
        <button className="add-room-btn" disabled={!pgId || !floorId} onClick={() => setShowAdd(true)}>
          + Add Room
        </button>
      </div>

      {/* ══════════════════════════════════════════
          DESKTOP TABLE  — hidden on mobile via CSS
      ══════════════════════════════════════════ */}
      <div className="rm-desktop-table-wrap table-responsive-x">
        <table className="modern-table room-table">
          <thead>
            <tr>
              <th>Base Room</th>
              <th>Unit Code</th>
              <th>Sharing</th>
              <th>Beds</th>
              <th>Monthly Rent</th>
              <th>Deposit</th>
              <th>Daily Rent</th>
              <th width="150">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!floorId ? (
              <tr><td colSpan="8" className="empty-state">Select a PG and Floor to manage rooms.</td></tr>
            ) : rooms.length === 0 ? (
              <tr><td colSpan="8" className="empty-state">No rooms found for this floor.</td></tr>
            ) : (
              rooms.map((r) => (
                <tr key={r.id}>
                  <td>{getBaseRoomNumber(r)}</td>
                  <td>{r.roomNumber}</td>
                  <td>{sharingLabel[r.sharingType] || r.sharingType}</td>
                  <td>{r.totalBeds}</td>
                  <td>{formatMoney(r.monthlyRent)}</td>
                  <td>{formatMoney(r.deposit)}</td>
                  <td>{r.dailyRent != null ? formatMoney(r.dailyRent) : "-"}</td>
                  <td>
                    <button className="action-btn edit" onClick={() => setEditRoom({ ...r, baseRoomNumber: getBaseRoomNumber(r), dailyRent: r.dailyRent ?? "" })}>Edit</button>
                    <button className="action-btn delete" onClick={() => deleteRoom(r.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE CARDS  — completely outside table,
          hidden on desktop via CSS
      ══════════════════════════════════════════ */}
      <div className="rmm-card-list">
        {!floorId ? (
          <div className="rmm-empty">Select a PG and Floor to manage rooms.</div>
        ) : rooms.length === 0 ? (
          <div className="rmm-empty">No rooms found for this floor.</div>
        ) : (
          rooms.map((r) => (
            <div
              key={r.id}
              className={`rmm-card rmm-card--${r.sharingType.toLowerCase()}`}
            >
              {/* Card Header */}
              <div className="rmm-card__header">
                <div className="rmm-card__header-left">
                  <span className="rmm-card__room-num">Room {getBaseRoomNumber(r)}</span>
                  <span className="rmm-card__unit-code">{r.roomNumber}</span>
                </div>
                <div className="rmm-card__header-right">
                  <span className={`rmm-badge rmm-badge--${r.sharingType.toLowerCase()}`}>
                    {sharingLabel[r.sharingType] || r.sharingType}
                  </span>
                  <span className="rmm-card__beds">{r.totalBeds} Bed{r.totalBeds !== 1 ? "s" : ""}</span>
                </div>
              </div>

              {/* Rent Grid */}
              <div className="rmm-card__rent-grid">
                <div className="rmm-card__rent-cell">
                  <span className="rmm-card__rent-label">Monthly Rent</span>
                  <span className="rmm-card__rent-val">{formatMoney(r.monthlyRent)}</span>
                </div>
                <div className="rmm-card__rent-cell rmm-card__rent-cell--mid">
                  <span className="rmm-card__rent-label">Deposit</span>
                  <span className="rmm-card__rent-val">{formatMoney(r.deposit)}</span>
                </div>
                <div className="rmm-card__rent-cell">
                  <span className="rmm-card__rent-label">Daily Rent</span>
                  <span className="rmm-card__rent-val rmm-card__rent-val--muted">
                    {r.dailyRent != null ? formatMoney(r.dailyRent) : "—"}
                  </span>
                </div>
              </div>

              {/* Footer: room type + actions */}
              <div className="rmm-card__footer">
                <span className={`rmm-type-pill ${r.roomType === "AC" ? "rmm-type-pill--ac" : "rmm-type-pill--nonac"}`}>
                  {r.roomType === "AC" ? <><FaSnowflake color="#0ea5e9" /> AC</> : r.roomType === "NON_AC" ? <><FaFan /> Non-AC</> : "—"}
                </span>
                <div className="rmm-card__actions">
                  <button
                    className="rmm-btn rmm-btn--edit"
                    onClick={() => setEditRoom({ ...r, baseRoomNumber: getBaseRoomNumber(r), dailyRent: r.dailyRent ?? "" })}
                  >
                    Edit
                  </button>
                  <button className="rmm-btn rmm-btn--delete" onClick={() => deleteRoom(r.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ══════════════════════════════════════════
          ADD ROOM MODAL
      ══════════════════════════════════════════ */}
      {showAdd && (
        <div className="modal-backdrop-custom">
          <div className="modal-box rmm-modal-box">
            <div className="rmm-modal-header">
              <h5 className="rmm-modal-title">Add Room</h5>
              <button className="rmm-modal-close" onClick={() => setShowAdd(false)}>✕</button>
            </div>

            <div className="rmm-modal-body">
              <div className="rmm-field-group">
                <label className="rmm-label">Base Room Number <span className="rmm-required">*</span></label>
                <input
                  className="form-control rmm-input"
                  placeholder="e.g. 101"
                  value={form.baseRoomNumber}
                  onChange={(e) => setForm({ ...form, baseRoomNumber: e.target.value, roomNumber: e.target.value })}
                />
              </div>

              <div className="rmm-field-group">
                <label className="rmm-label">Sharing Type</label>
                <select className="form-control rmm-input" value={form.sharingType} onChange={(e) => setForm({ ...form, sharingType: e.target.value })}>
                  <option value="SINGLE">Single Sharing</option>
                  <option value="DOUBLE">Double Sharing</option>
                  <option value="TRIPLE">Triple Sharing</option>
                  <option value="QUADRUPLE">Four Sharing</option>
                  <option value="CUSTOM">Custom</option>
                </select>

                {form.sharingType === "CUSTOM" && (
                  <div className="rmm-field-group" style={{ marginTop: "10px" }}>
                    <label className="rmm-label">Number of Beds <span className="rmm-required">*</span></label>
                    <input
                      type="number"
                      className="form-control rmm-input"
                      placeholder="Enter beds (5–20)"
                      min="5"
                      max="20"
                      value={form.customBedCount}
                      onChange={(e) => setForm({ ...form, customBedCount: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="rmm-preview-pill">
                Unit code preview: <strong>{addPreview}</strong>
              </div>

              <div className="rmm-field-group">
                <label className="rmm-label">Room Type <span className="rmm-required">*</span></label>
                <select className="form-control rmm-input" value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })}>
                  <option value="">Select Room Type</option>
                  <option value="AC">AC</option>
                  <option value="NON_AC">Non-AC</option>
                </select>
              </div>

              <div className="rmm-field-group">
                <label className="rmm-label">Monthly Rent <span className="rmm-required">*</span></label>
                <input
                  type="number"
                  className="form-control rmm-input"
                  placeholder="Enter amount"
                  maxLength="10"
                  value={form.monthlyRent}
                  onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })}
                  onWheel={(e) => e.target.blur()}
                />
              </div>

              <div className="rmm-field-group">
                <label className="rmm-label">Deposit Amount</label>
                <input
                  type="number"
                  className="form-control rmm-input"
                  placeholder="Enter amount"
                  maxLength="10"
                  value={form.deposit}
                  onChange={(e) => setForm({ ...form, deposit: e.target.value })}
                  onWheel={(e) => e.target.blur()}
                />
              </div>

              <div className="rmm-field-group">
                <label className="rmm-label">Daily Rent <span className="rmm-optional">(optional)</span></label>
                <input
                  type="number"
                  className="form-control rmm-input"
                  placeholder="Enter amount"
                  maxLength="10"
                  value={form.dailyRent}
                  onChange={(e) => setForm({ ...form, dailyRent: e.target.value })}
                  onWheel={(e) => e.target.blur()}
                />
              </div>
            </div>

            <div className="modal-actions rmm-modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowAdd(false)}>Cancel</button>
              <button
                className="modal-btn primary"
                onClick={addRoom}
                disabled={addLoading}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: addLoading ? 0.85 : 1 }}
              >
                {addLoading ? "Adding…" : "Add Room"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          EDIT ROOM MODAL
      ══════════════════════════════════════════ */}
      {editRoom && (
        <div className="modal-backdrop-custom">
          <div className="modal-box rmm-modal-box">
            <div className="rmm-modal-header">
              <h5 className="rmm-modal-title">Edit Room</h5>
              <button className="rmm-modal-close" onClick={() => setEditRoom(null)}>✕</button>
            </div>

            <div className="rmm-modal-body">
              <div className="rmm-field-group">
                <label className="rmm-label">Base Room Number</label>
                <input
                  className="form-control rmm-input"
                  placeholder="Base Room Number"
                  value={editRoom.baseRoomNumber || ""}
                  onChange={(e) => setEditRoom({ ...editRoom, baseRoomNumber: e.target.value, roomNumber: e.target.value })}
                />
              </div>

              <div className="rmm-field-group">
                <label className="rmm-label">Sharing Type</label>
                <select className="form-control rmm-input" value={editRoom.sharingType} onChange={(e) => setEditRoom({ ...editRoom, sharingType: e.target.value })}>
                  <option value="SINGLE">Single Sharing</option>
                  <option value="DOUBLE">Double Sharing</option>
                  <option value="TRIPLE">Triple Sharing</option>
                  <option value="QUADRUPLE">Four Sharing</option>
                  <option value="CUSTOM">Custom</option>
                </select>

                {editRoom.sharingType === "CUSTOM" && (
                  <div className="rmm-field-group" style={{ marginTop: "10px" }}>
                    <label className="rmm-label">Number of Beds <span className="rmm-required">*</span></label>
                    <input
                      type="number"
                      className="form-control rmm-input"
                      placeholder="Enter beds (5–20)"
                      min="5"
                      max="20"
                      value={editRoom.customBedCount ?? ""}
                      onChange={(e) => setEditRoom({ ...editRoom, customBedCount: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="rmm-preview-pill">
                Unit code preview: <strong>{editPreview}</strong>
              </div>

              <div className="rmm-field-group">
                <label className="rmm-label">Room Type</label>
                <select className="form-control rmm-input" value={editRoom.roomType} onChange={(e) => setEditRoom({ ...editRoom, roomType: e.target.value })}>
                  <option value="AC">AC</option>
                  <option value="NON_AC">Non-AC</option>
                </select>
              </div>

              <div className="rmm-field-group">
                <label className="rmm-label">Monthly Rent</label>
                <input
                  type="number"
                  className="form-control rmm-input"
                  maxLength="10"
                  value={editRoom.monthlyRent}
                  onChange={(e) => setEditRoom({ ...editRoom, monthlyRent: e.target.value })}
                />
              </div>

              <div className="rmm-field-group">
                <label className="rmm-label">Deposit Amount</label>
                <input
                  type="number"
                  className="form-control rmm-input"
                  maxLength="10"
                  value={editRoom.deposit}
                  onChange={(e) => setEditRoom({ ...editRoom, deposit: e.target.value })}
                />
              </div>

              <div className="rmm-field-group">
                <label className="rmm-label">Daily Rent <span className="rmm-optional">(optional)</span></label>
                <input
                  type="number"
                  className="form-control rmm-input"
                  placeholder="Enter amount"
                  maxLength="10"
                  value={editRoom.dailyRent ?? ""}
                  onChange={(e) => setEditRoom({ ...editRoom, dailyRent: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-actions rmm-modal-actions">
              <button className="modal-btn cancel" onClick={() => setEditRoom(null)}>Cancel</button>
              <button className="modal-btn primary" onClick={updateRoom}>Update Room</button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default RoomManager;