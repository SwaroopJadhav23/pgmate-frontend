import { FaHome } from "react-icons/fa";
import { useEffect, useState } from "react";
import api from "../../../api/axios";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { TableSkeleton, UniversalCardSkeleton } from "../../public/Skeleton";
const AdminSponsorship = ({ onPriorityChanged,onStatsChange }) => {
  const [records, setRecords] = useState([]);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [priorityCity, setPriorityCity] = useState("");
  const [existingPriority, setExistingPriority] = useState([]);
  const [cityPendingPGs, setCityPendingPGs] = useState([]);
  const [assignedPgId, setAssignedPgId] = useState(null);
  const [end, setEnd] = useState("");
  const [activeTab, setActiveTab] = useState("PENDING");
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [cityFilter, setCityFilter] = useState("");
  const [allCities, setAllCities] = useState([]);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
 
 // eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { loadData(); loadCities(); }, []);

  const loadCities = async () => {
    try {
      const res = await api.get("/admin/pgs");
      const cities = [...new Set((res.data || []).map((pg) => pg.city).filter(Boolean))];
      setAllCities(cities);
    } catch { }
  };

const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/sponsorship/all");
      const data = res.data || [];
      setRecords(data);
      onStatsChange?.({
        pending:   data.filter(r => r.status === "PENDING").length,
        approved:  data.filter(r => r.status === "APPROVED").length,
        rejected:  data.filter(r => r.status === "REJECTED").length,
        reApplied: data.filter(r => r.status === "RE_APPLIED").length,
      });
    } catch {
      toast.error("Failed to load sponsorship requests.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const openApproveModal = async (record) => {
    try {
      const res = await api.get("/admin/pgs");
      const allPGs = res.data || [];
      const sponsorshipPG = allPGs.find((pg) => pg.id === record.pgId);
      const assigned = allPGs
        .filter((pg) => pg.city === record.city && pg.cityPriority != null)
        .sort((a, b) => a.cityPriority - b.cityPriority);
      let available = [];
      if (sponsorshipPG && sponsorshipPG.cityPriority == null) available = [sponsorshipPG];
      setSelected(record); setPriorityCity(record.city);
      setExistingPriority(assigned); setCityPendingPGs(available);
      setAssignedPgId(null); setEnd("");
      setShowPriorityModal(true);
    } catch {
      toast.error("Failed to load priority data.");
    }
  };

  const assignPriority = (pgId) => {
    setAssignedPgId(pgId);
    toast.success("Priority assigned. Will be applied after approving sponsorship.");
  };

  const finalApprove = async () => {
    const alreadyHasPriority = cityPendingPGs.length === 0;
    if (!alreadyHasPriority && !assignedPgId) return toast.error("Please assign priority first.");
    if (!end) return toast.error("Please select a sponsorship end date.");
    try {
      if (!alreadyHasPriority) {
        const nextSlot = existingPriority.length + 1;
        await api.put("/admin/pgs/city/increase-slots", null, { params: { city: priorityCity } });
        await api.put(`/admin/pgs/${assignedPgId}/assign-city-priority`, null, { params: { priority: nextSlot } });
      }
      await api.post(`/admin/sponsorship/approve/${selected.id}`, null, { params: { end } });
      toast.success("Sponsorship activated successfully.");
      setShowPriorityModal(false); loadData();
    } catch { toast.error("Approval failed. Please try again."); }
  };

  const reject = async (id) => {
    const { value: reason } = await Swal.fire({
      title: "Reject Sponsorship", input: "textarea", inputLabel: "Rejection Reason",
      inputPlaceholder: "Enter rejection reason...", showCancelButton: true,
      confirmButtonText: "Reject", confirmButtonColor: "#dc3545",
      preConfirm: (v) => { if (!v) Swal.showValidationMessage("Reason is required"); return v; }
    });
    if (!reason) return;
    try {
      await api.post(`/admin/sponsorship/reject/${id}`, null, { params: { reason } });
      toast.success("Sponsorship rejected."); loadData();
    } catch { toast.error("Failed to reject sponsorship."); }
  };

  const expire = async (id, pgId) => {
    const confirm = await Swal.fire({ title: "Expire Sponsorship?", icon: "warning", showCancelButton: true, confirmButtonText: "Yes" });
    if (!confirm.isConfirmed) return;
    try {
      await api.put(`/admin/sponsorship/expire/${id}`);
      await api.put(`/admin/pgs/${pgId}/cancel-city-priority`);
      toast.success("Sponsorship expired and priority cancelled."); loadData();
    } catch { toast.error("Failed to expire sponsorship."); }
  };

  const copyPhone = (phone, id) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filtered = records
    .filter((r) => {
      const matchesTab = r.status === activeTab;
      const matchesCity = cityFilter === "" || r.city === cityFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        r.pgName?.toLowerCase().includes(q) ||
        r.city?.toLowerCase().includes(q) ||
        r.ownerName?.toLowerCase().includes(q) ||
        r.ownerPhone?.toString().includes(q);
      return matchesTab && matchesSearch && matchesCity;
    })
    .sort((a, b) => {
      const da = a.appliedAt ? new Date(a.appliedAt) : 0;
      const db = b.appliedAt ? new Date(b.appliedAt) : 0;
      return sortOrder === "desc" ? db - da : da - db;
    });

  useEffect(() => {
    setSearch("");
    setSortOrder("desc");
  }, [activeTab]);

  const planClass = (plan) => {
    if (!plan || plan === "FREE") return "plan-badge plan-free";
    return `plan-badge plan-${plan.toLowerCase()}`;
  };

  return (
    <>

    {/* STAT CARDS */}
     

  
      {/* STATUS TABS + SORT BUTTON — all inline */}
      <div className="status-tabs">
        {["PENDING", "APPROVED", "REJECTED", "EXPIRED", "RE_APPLIED"].map((s) => (
          <button
            key={s}
            className={`status-btn ${activeTab === s ? "active" : ""}`}
            onClick={() => setActiveTab(s)}
          >
            {s === "RE_APPLIED" ? "Re-Applied" : s}
          </button>
        ))}

        {/* Sort — styled exactly like a status-btn */}
        <button
          className="status-btn spon-flex-center-gap"
          onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
        >
          <i className={`bi ${sortOrder === "desc" ? "bi-sort-down" : "bi-sort-up"}`}></i>
          {sortOrder === "desc" ? "Newest First" : "Oldest First"}
        </button>

        <div className="city-dropdown spon-flex-center">  <button
          className={`status-btn city-dropdown-btn ${cityFilter ? "active" : ""}`}
          onClick={() => setCityDropdownOpen((p) => !p)}
        >
          {cityFilter || "All Cities"}
          <i className={`bi bi-chevron-${cityDropdownOpen ? "up" : "down"}`}></i>
        </button>
          {cityDropdownOpen && (
            <div className="city-dropdown-menu">
              <div
                className={`city-dropdown-item ${cityFilter === "" ? "selected" : ""}`}
                onClick={() => { setCityFilter(""); setCityDropdownOpen(false); }}
              >
                All Cities
              </div>
              {allCities.map((c) => (
                <div
                  key={c}
                  className={`city-dropdown-item ${cityFilter === c ? "selected" : ""}`}
                  onClick={() => { setCityFilter(c); setCityDropdownOpen(false); }}
                >
                  {c}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="pc-search-wrapper">
        <span className="search-icon">
          <i className="bi bi-search"></i>
        </span>
        <input
          type="text"
          className="form-control"
          placeholder="Search PG..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ══ DESKTOP TABLE ══ */}
      <div className="pc-table-wrapper">
        <table className="pc-table">
          <thead>
            <tr>
              <th>Sr.No</th>
              <th>PG</th>
              <th>City</th>
              <th>Owner</th>
              <th>Plan</th>
              <th>Phone</th>
              <th>Applied</th>
              {activeTab !== "PENDING" && activeTab !== "RE_APPLIED" && <th>End Date</th>}
              <th>Note</th>
              {activeTab === "REJECTED" && <th>Reason</th>}
              {(activeTab === "PENDING" || activeTab === "APPROVED" || activeTab === "RE_APPLIED") && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={6} cols={9} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="9" className="pc-empty">
                  No {activeTab.toLowerCase()} records
                </td>
              </tr>
            ) : (
              filtered.map((r, index) => (
                <tr key={r.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="pc-pg-cell">
                      <div className="pc-pg-icon"><FaHome /></div>
                      <span className="pc-pg-name">{r.pgName}</span>
                    </div>
                  </td>
                  <td className="spon-table-muted">{r.city}</td>
                  <td className="spon-table-muted">{r.ownerName}</td>
                  <td><span className={planClass(r.subscriptionPlan)}>{r.subscriptionPlan || "FREE"}</span></td>
                  <td>
                    {r.ownerPhone ? (
                      <div className="phone-wrapper">
                        <span className="phone-number">{r.ownerPhone}</span>
                        <button className="icon-btn" onClick={() => copyPhone(r.ownerPhone, r.id)}>
                          <i className={`bi ${copiedId === r.id ? "bi-check2 text-success" : "bi-copy"}`}></i>
                        </button>
                        <a href={`tel:${r.ownerPhone}`} className="icon-btn"><i className="bi bi-telephone-fill text-success"></i></a>
                        <a href={`https://wa.me/91${r.ownerPhone}`} target="_blank" rel="noopener noreferrer" className="icon-btn"><i className="bi bi-whatsapp text-success"></i></a>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="spon-table-muted">{formatDate(r.appliedAt)}</td>
                  {activeTab !== "PENDING" && activeTab !== "RE_APPLIED" && (
                    <td className="spon-table-muted">{formatDate(r.endDate)}</td>
                  )}
                  <td><span className="note-text">{r.note || "—"}</span></td>
                  {activeTab === "REJECTED" && <td><span className="rejection-text">{r.rejectionReason || "—"}</span></td>}
                  {(activeTab === "PENDING" || activeTab === "RE_APPLIED") && (
                    <td>
                      <div className="btn-actions">
                        <button className="btn-tbl btn-tbl-approve" onClick={() => openApproveModal(r)}>✓ Approve</button>
                        <button className="btn-tbl btn-tbl-reject" onClick={() => reject(r.id)}>✕ Reject</button>
                      </div>
                    </td>
                  )}
                  {activeTab === "APPROVED" && (
                    <td><button className="btn-tbl btn-tbl-expire" onClick={() => expire(r.id, r.pgId)}>Expire</button></td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ══ MOBILE CARDS ══ */}
      <div className="pc-card-list">
        {loading ? (
          <UniversalCardSkeleton
            count={4}
            actions={
              activeTab === "PENDING" ? 2 :
                activeTab === "RE_APPLIED" ? 2 :
                  activeTab === "APPROVED" ? 1 : 0
            }
          />
        ) : filtered.length === 0 ? (
          <div className="pc-empty">
            No {activeTab.toLowerCase()} records
          </div>
        ) : (
          filtered.map((r, index) => (
            <div key={r.id} className="pc-card">
              <div className={`pc-card-bar ${activeTab}`} />
              <div className="pc-card-body">
                <div className="spon-card-id">
                  # {index + 1}
                </div>
                <div className="pc-card-top">
                  <div className="pc-card-pg">
                    <div className="pc-pg-icon"><FaHome /></div>
                    <div>
                      <div className="pc-card-pgname">{r.pgName}</div>
                      <div className="pc-card-owner">{r.ownerName}</div>
                    </div>
                  </div>
                  <span className={planClass(r.subscriptionPlan)}>{r.subscriptionPlan || "FREE"}</span>
                </div>

                {r.ownerPhone && (
                  <div className="pc-card-phone">
                    <span className="phone-number">{r.ownerPhone}</span>
                    <button className="icon-btn" onClick={() => copyPhone(r.ownerPhone, `c-${r.id}`)}>
                      <i className={`bi ${copiedId === `c-${r.id}` ? "bi-check2 text-success" : "bi-copy"}`}></i>
                    </button>
                    <a href={`tel:${r.ownerPhone}`} className="icon-btn"><i className="bi bi-telephone-fill text-success"></i></a>
                    <a href={`https://wa.me/91${r.ownerPhone}`} target="_blank" rel="noopener noreferrer" className="icon-btn"><i className="bi bi-whatsapp text-success"></i></a>
                  </div>
                )}

                <div className="pc-card-meta">
                  <div className="pc-card-meta-item"><i className="bi bi-geo-alt-fill"></i>{r.city}</div>
                  <div className="pc-card-meta-item"><i className="bi bi-calendar3"></i>{formatDate(r.appliedAt)}</div>
                  {r.endDate && <div className="pc-card-meta-item"><i className="bi bi-calendar-check"></i>{formatDate(r.endDate)}</div>}
                </div>

                {r.note && <div className="pc-card-note">{r.note}</div>}
                {activeTab === "REJECTED" && r.rejectionReason && <div className="pc-card-rejection">Reason: {r.rejectionReason}</div>}

                <div className="pc-card-actions">
                  {(activeTab === "PENDING" || activeTab === "RE_APPLIED") && <><button className="btn-tbl btn-tbl-approve" onClick={() => openApproveModal(r)}>✓ Approve</button><button className="btn-tbl btn-tbl-reject" onClick={() => reject(r.id)}>✕ Reject</button></>}
                  {activeTab === "APPROVED" && <button className="btn-tbl btn-tbl-expire" onClick={() => expire(r.id, r.pgId)}>Expire</button>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ══ APPROVE + PRIORITY MODAL ══ */}
      {showPriorityModal && (
        <div className="modal-backdrop-custom" onClick={() => setShowPriorityModal(false)}>
          <div className="modal-box spon-modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h4>Assign Priority — Slot {existingPriority.length + 1}</h4>
              <button className="modal-close" onClick={() => setShowPriorityModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="modal-section-label">Existing Priority — {priorityCity}</div>
              {existingPriority.length === 0 ? (
                <p className="spon-empty-text">No priority assigned yet</p>
              ) : (
                <table className="pc-table mb-4 spon-table-auto">
                  <thead>
                    <tr><th>Slot</th><th>PG</th><th>Expiry</th></tr>
                  </thead>
                  <tbody>
                    {existingPriority.map((pg) => (
                      <tr key={pg.id}>
                        <td><span className="slot-badge">{pg.cityPriority}</span></td>
                        <td className="spon-fw-500">{pg.name}</td>
                        <td className="spon-text-primary-fw">{pg.priorityUntil ? new Date(pg.priorityUntil).toLocaleDateString() : "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="modal-section-label spon-mt-18">Assign to Slot {existingPriority.length + 1}</div>
              {cityPendingPGs.length === 0 ? (
                <div className="spon-alert-success">
                  ✓ This PG already has priority assigned.
                </div>
              ) : cityPendingPGs.map((pg) => (
                <div key={pg.id} className="assign-pg-row">
                  <span className="assign-pg-name">{pg.name}</span>
                  <button
                    className={`btn-tbl ${assignedPgId === pg.id ? "btn-tbl-approve" : "btn-tbl-edit"} spon-min-w-90`}
                    onClick={() => assignPriority(pg.id)}
                    disabled={assignedPgId === pg.id}
                  >
                    {assignedPgId === pg.id ? "✓ Assigned" : "Assign"}
                  </button>
                </div>
              ))}

              <div className="modal-section-label spon-mt-18">Sponsorship End Date</div>
              <input
                type="datetime-local"
                className="form-control spon-input-styled"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-tbl btn-tbl-reject spon-btn-cancel" onClick={() => setShowPriorityModal(false)}>Cancel</button>
              <button className="btn-tbl btn-tbl-approve spon-btn-approve" onClick={finalApprove}>Approve Sponsorship</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSponsorship;