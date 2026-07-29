import { FaHome } from "react-icons/fa";
import { useEffect, useState } from "react";
import api from "../../../api/axios";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext, useSortable,
  verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
 
const DragHandle = (props) => (
  <span {...props} className="drag-handle" title="Drag to reorder">⠿</span>
);
 
const SortableRow = ({ pg, onEditExpiry, onCancel }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: pg.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
 
  return (
    <tr ref={setNodeRef} style={style}>
      <td>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <DragHandle {...attributes} {...listeners} />
          <span className="slot-badge">{pg.cityPriority}</span>
        </div>
      </td>
      <td>
        <div className="pc-pg-cell">
          <div className="pc-pg-icon"><FaHome /></div>
          <span className="pc-pg-name">{pg.name}</span>
        </div>
      </td>
      <td style={{color: pg.priorityUntil ? "#5B5BD6" : "#94a3b8", fontWeight: pg.priorityUntil ? 600 : 400}}>
        {pg.priorityUntil ? new Date(pg.priorityUntil).toLocaleDateString() : "—"}
      </td>
      <td>
        <div className="btn-actions">
          <button className="btn-tbl btn-tbl-edit"   onClick={() => onEditExpiry(pg)}>Edit Expiry</button>
          <button className="btn-tbl btn-tbl-cancel" onClick={() => onCancel(pg.id)}>Cancel</button>
        </div>
      </td>
    </tr>
  );
};
 
const AdminPGManagement = ({ refreshKey }) => {
  const [pgs, setPgs]     = useState([]);
  const [search, setSearch] = useState("");
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [activePg, setActivePg]   = useState(null);
  const [expiry, setExpiry]       = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
 
  useEffect(() => { loadPGs(); }, [refreshKey]);
 
  const loadPGs = async () => {
    const res = await api.get("/admin/pgs");
    setPgs(res.data || []);
  };
 
  const groupedByCity = pgs
  .filter((pg) => !search || pg.name?.toLowerCase().includes(search.toLowerCase()))
  .filter((pg) => !cityFilter || pg.city === cityFilter)
  .reduce((acc, pg) => {
      acc[pg.city] = acc[pg.city] || [];
      acc[pg.city].push(pg);
      return acc;
    }, {});
 
  const cancel = async (pgId) => {
    const confirm = await Swal.fire({
      title:"Cancel Priority?", text:"This will expire the sponsorship and remove priority.",
      icon:"warning", showCancelButton:true, confirmButtonText:"Yes, Cancel", confirmButtonColor:"#dc3545",
    });
    if (!confirm.isConfirmed) return;
    try {
      await api.put(`/admin/pgs/${pgId}/cancel-city-priority`);
      toast.success("Priority & sponsorship removed.");
      await loadPGs();
      window.dispatchEvent(new Event("priorityChanged"));
    } catch { toast.error("Failed to cancel priority."); }
  };
 
  const updateExpiry = async () => {
    try {
      await api.put(`/admin/pgs/${activePg.id}/update-expiry?expiry=${expiry}`);
      await loadPGs();
      setShowExpiryModal(false);
      window.dispatchEvent(new Event("priorityChanged"));
    } catch (err) { console.error("Expiry update failed", err); }
  };
 
  const handleDragEnd = async (event, city) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const cityPGs  = groupedByCity[city] || [];
    const assigned = cityPGs.filter((p) => p.cityPriority != null).sort((a,b) => a.cityPriority - b.cityPriority);
    const oldIndex = assigned.findIndex((p) => p.id === active.id);
    const newIndex = assigned.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(assigned, oldIndex, newIndex);
    await api.put(`/admin/pgs/city/${city}/reorder-priority`, reordered.map((p) => p.id));
    await loadPGs();
  };
 
  return (
    <>
      {/* SEARCH */}
     <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
  <div className="pc-search-wrapper" style={{ margin: 0 }}>
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
<div className="city-dropdown">
  <button
className={`city-dropdown-btn city-filter-searchbar ${cityFilter ? "active" : ""}`}    onClick={() => setCityDropdownOpen((p) => !p)}
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
      {[...new Set(pgs.map((p) => p.city).filter(Boolean))].map((c) => (
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
 
      {Object.entries(groupedByCity).map(([city, cityPGs]) => {
        const assigned = cityPGs
          .filter((p) => p.cityPriority != null)
          .sort((a, b) => a.cityPriority - b.cityPriority);
 
        if (assigned.length === 0) return null;
 
        return (
          <div key={city} className="city-group">
            <div className="city-group-header">
              <span className="city-group-name">{city}</span>
              <span className="city-count-badge">{assigned.length} slot{assigned.length!==1?"s":""}</span>
            </div>
 
            {/* ── DESKTOP TABLE ── */}
            <div className="pc-table-wrapper" style={{padding:0}}>
              <DndContext collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, city)}>
                <SortableContext items={assigned.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                  <table className="pc-table">
                    <thead>
                      <tr>
                        <th style={{width:100}}>Slot</th>
                        <th>PG Name</th>
                        <th style={{width:140}}>Expiry</th>
                        <th style={{width:200}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assigned.map((pg) => (
                        <SortableRow
                          key={pg.id}
                          pg={pg}
                          onEditExpiry={(p) => {
                            setActivePg(p);
                            setExpiry(p.priorityUntil ? p.priorityUntil.slice(0,10) : "");
                            setShowExpiryModal(true);
                          }}
                          onCancel={cancel}
                        />
                      ))}
                    </tbody>
                  </table>
                </SortableContext>
              </DndContext>
            </div>
 
            {/* ── MOBILE CARDS ── */}
            <div className="pc-card-list" style={{padding:0,paddingTop:8}}>
              {assigned.map((pg) => (
                <div key={pg.id} className="priority-card">
                  <div className="priority-card-slot">
                    <span className="slot-badge">{pg.cityPriority}</span>
                  </div>
                  <div className="priority-card-info">
                    <div className="priority-card-name">{pg.name}</div>
                    <div className="priority-card-expiry">
                      {pg.priorityUntil ? `Expires ${new Date(pg.priorityUntil).toLocaleDateString()}` : "No expiry set"}
                    </div>
                  </div>
                  <div className="priority-card-actions">
                    <button className="btn-tbl btn-tbl-edit" onClick={() => { setActivePg(pg); setExpiry(pg.priorityUntil?pg.priorityUntil.slice(0,10):""); setShowExpiryModal(true); }}>Edit</button>
                    <button className="btn-tbl btn-tbl-cancel" onClick={() => cancel(pg.id)}>Cancel</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
 
      {Object.values(groupedByCity).every((g) => g.filter((p) => p.cityPriority != null).length === 0) && (
        <div className="pc-empty">No priority assignments found</div>
      )}
 
      {/* EXPIRY MODAL */}
      {showExpiryModal && (
        <div className="modal-backdrop-custom" onClick={()=>setShowExpiryModal(false)}>
          <div className="modal-card" onClick={(e)=>e.stopPropagation()}>
            <h4 style={{fontSize:16,fontWeight:700,color:"#1e293b",marginBottom:16,paddingBottom:12,borderBottom:"1px solid #f1f5f9"}}>
              Edit Expiry — {activePg?.name}
            </h4>
            <input
              type="date"
              className="form-control mb-4"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              style={{borderRadius:8,border:"1px solid #e2e8f0",fontSize:"13.5px"}}
            />
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button className="btn-tbl btn-tbl-cancel" style={{padding:"7px 14px"}} onClick={()=>setShowExpiryModal(false)}>Cancel</button>
              <button className="btn-tbl btn-tbl-approve" style={{padding:"7px 16px",fontWeight:600}} onClick={updateExpiry}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
 
export default AdminPGManagement;