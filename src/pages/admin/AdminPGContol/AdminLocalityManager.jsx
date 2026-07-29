import { useEffect, useState, useCallback } from "react";
import api from "../../../api/axios";
import DashboardLayout from "../../../layouts/DashboardLayout";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { FaSearch, FaLightbulb, FaHourglassHalf, FaTimes } from "react-icons/fa";
import "./AdminLocalityManager.css";

const AdminLocalityManager = ({ basePath = "/admin" }) => {
  const [localities, setLocalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [canonicalName, setCanonicalName] = useState("");
  const [merging, setMerging] = useState(false);
  const [cities, setCities] = useState([]);

  const fetchLocalities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`${basePath}/pgs/localities`, {
        params: { city: cityFilter || undefined },
      });
      setLocalities(res.data || []);
      const uniqueCities = [...new Set((res.data || []).map((l) => l.city).filter(Boolean))].sort();
      setCities(uniqueCities);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [basePath, cityFilter]);

  useEffect(() => {
    fetchLocalities();
  }, [fetchLocalities]);

  const filtered = localities.filter((l) => {
    const matchesCity = !cityFilter || l.city === cityFilter;
    const matchesSearch = !search || l.locality.toLowerCase().includes(search.toLowerCase());
    return matchesCity && matchesSearch;
  });

  const toggleSelect = (locality) => {
    setSelected((prev) =>
      prev.includes(locality) ? prev.filter((l) => l !== locality) : [...prev, locality]
    );
  };

  const handleMerge = async () => {
    if (selected.length < 2) {
      toast("Please select 2 or more localities to merge.", { icon: "ℹ️" });
      return;
    }
    if (!canonicalName.trim()) {
      toast.error("Please enter a canonical locality name to merge into.");
      return;
    }
    const confirm = await Swal.fire({
      icon: "question",
      title: "Confirm Merge",
      html: `Merge <b>${selected.join(", ")}</b><br/>into <b>${canonicalName}</b>?<br/><br/>This will update all PGs in the database.`,
      showCancelButton: true,
      confirmButtonText: "Yes, merge",
      confirmButtonColor: "#6366f1",
    });
    if (!confirm.isConfirmed) return;

    setMerging(true);
    try {
      const res = await api.post(`${basePath}/pgs/merge-localities`, {
        from: selected,
        to: canonicalName,
      });
      toast.success(`${res.data.pgsUpdated} PG(s) merged successfully!`);
      setSelected([]);
      setCanonicalName("");
      fetchLocalities();
    } catch (e) {
      console.error(e);
      toast.error("Merge failed. Please try again.");
    } finally {
      setMerging(false);
    }
  };

  return (
    <DashboardLayout title="Locality Manager" subtitle="Organize and merge duplicate locality spellings">
      <style>{`
        /* Container & Typography */
        .lm-container { 
          max-width: 1200px; 
          margin: 0 auto; 
          font-family: 'Inter', system-ui, sans-serif;
          padding-bottom: 100px; /* Space for sticky bar */
          color: #1e293b;
        }
        
        /* Modern Glassmorphic Controls */
        .lm-controls {
          display: flex; gap: 16px; flex-wrap: wrap; align-items: center; justify-content: space-between;
          background: rgba(255, 255, 255, 0.85); 
          backdrop-filter: blur(12px);
          border-radius: 16px; 
          padding: 20px 24px;
          margin-bottom: 28px; 
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
        }
        
        .lm-search-group {
          display: flex; gap: 16px; flex: 1; min-width: 300px;
        }

        .lm-controls input, .lm-controls select {
          background: #ffffff; 
          border: 1px solid #cbd5e1; 
          color: #334155;
          border-radius: 12px; 
          padding: 12px 18px; 
          font-size: 0.95rem; 
          outline: none;
          flex: 1;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .lm-controls input:focus, .lm-controls select:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }
        .lm-controls input::placeholder { color: #94a3b8; }
        
        .lm-hint { 
          color: #64748b; 
          font-size: 0.85rem; 
          margin: 0; 
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f1f5f9;
          padding: 10px 16px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }

        /* Sticky Merge Bar */
        .lm-merge-bar {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 60px);
          max-width: 900px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 20px;
          padding: 20px 28px; 
          display: flex; gap: 16px; flex-wrap: wrap; align-items: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02);
          z-index: 100;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 40px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        .lm-merge-bar .selected-tags { display: flex; flex-wrap: wrap; gap: 8px; flex: 1; align-items: center; }
        
        .lm-tag {
          background: linear-gradient(135deg, #4f46e5, #6366f1); 
          color: #ffffff; 
          border-radius: 8px;
          padding: 6px 14px; 
          font-size: 0.85rem; 
          font-weight: 500;
          display: flex; align-items: center; gap: 8px;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
        }
        .lm-tag button { 
          background: rgba(255,255,255,0.2); 
          border: none; 
          color: white; 
          border-radius: 50%;
          width: 20px; height: 20px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; 
          font-size: 14px; 
          transition: background 0.2s;
        }
        .lm-tag button:hover { background: rgba(255,255,255,0.4); }
        
        .lm-merge-input {
          background: #ffffff; 
          border: 1px solid #cbd5e1; 
          color: #1e293b;
          border-radius: 10px; 
          padding: 12px 18px; 
          font-size: 0.95rem; 
          outline: none; 
          min-width: 220px;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05) inset;
        }
        .lm-merge-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }
        .lm-merge-input::placeholder { color: #94a3b8; font-weight: 400; }
        
        .lm-merge-btn {
          background: linear-gradient(135deg, #ec4899, #8b5cf6);
          color: white; 
          border: none; 
          border-radius: 10px;
          padding: 12px 24px; 
          font-weight: 600; 
          font-size: 0.95rem;
          cursor: pointer; 
          transition: all 0.2s; 
          white-space: nowrap;
          box-shadow: 0 8px 20px rgba(236, 72, 153, 0.25);
        }
        .lm-merge-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 25px rgba(236, 72, 153, 0.35);
        }
        .lm-merge-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

        /* Premium Table */
        .lm-table-wrap { 
          background: #ffffff;
          border-radius: 16px; 
          border: 1px solid #e2e8f0; 
          overflow: hidden; 
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
        }
        .lm-table { width: 100%; border-collapse: collapse; }
        .lm-table th {
          background: #f8fafc; 
          color: #64748b; 
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase; 
          letter-spacing: 0.08em;
          padding: 16px 20px; 
          text-align: left; 
          border-bottom: 1px solid #e2e8f0;
        }
        .lm-table td { 
          padding: 16px 20px; 
          border-bottom: 1px solid #f1f5f9; 
          color: #334155; 
          font-size: 0.95rem; 
          vertical-align: middle; 
          transition: all 0.2s;
        }
        .lm-table tr { transition: all 0.2s; }
        .lm-table tr:hover td { background: #f8fafc; }
        .lm-table tr.lm-selected td { 
          background: rgba(99, 102, 241, 0.06); 
        }
        
        /* Custom Checkbox */
        .lm-checkbox { 
          width: 20px; 
          height: 20px; 
          cursor: pointer; 
          accent-color: #6366f1;
          border-radius: 6px;
        }
        
        /* Badges & States */
        .lm-count { 
          background: #f1f5f9; 
          color: #475569; 
          border-radius: 20px; 
          padding: 4px 12px; 
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid #e2e8f0;
        }
        .lm-empty { 
          text-align: center; 
          padding: 60px; 
          color: #64748b; 
          font-size: 1.1rem; 
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .lm-empty-icon {
          font-size: 3rem;
          opacity: 0.4;
        }

        .lm-table-responsive {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .lm-card-list {
          display: none;
        }

        /* Responsive Design for Mobile */
        @media (max-width: 768px) {
          .lm-table-responsive {
            display: none !important;
          }
          .lm-card-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .lm-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
            cursor: pointer;
            transition: all 0.2s;
          }
          .lm-card.lm-card-selected {
            background: rgba(99, 102, 241, 0.04);
            border-color: #6366f1;
          }
          .lm-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }
          .lm-card-title {
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 600;
            color: #1e293b;
            font-size: 1.05rem;
          }
          .lm-card-city {
            color: #64748b;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .lm-table-wrap {
            background: transparent;
            border: none;
            box-shadow: none;
          }
          .lm-container {
            padding-bottom: 220px;
          }
          .lm-controls {
            flex-direction: column;
            align-items: stretch;
            padding: 16px;
          }
          .lm-search-group {
            flex-direction: column;
            min-width: 100%;
            gap: 12px;
          }
          .lm-merge-bar {
            width: calc(100% - 32px);
            padding: 16px;
            bottom: 16px;
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            border-radius: 16px;
          }
          .lm-merge-bar > div:last-child {
            flex-direction: column !important;
            align-items: stretch !important;
            width: 100%;
            gap: 10px !important;
          }
          .lm-merge-bar > div:last-child > span {
            display: none !important;
          }
          .lm-merge-input {
            width: 100%;
            min-width: 0;
          }
          .lm-merge-btn {
            width: 100%;
            white-space: normal;
          }
          .lm-table th, .lm-table td {
            padding: 12px 10px;
            font-size: 0.9rem;
          }
        }
      `}</style>

      <div className="lm-container">
        <div className="lm-controls">
          <div className="lm-search-group">
            <input
              placeholder="Search locality..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={cityFilter} onChange={(e) => { setCityFilter(e.target.value); setSelected([]); }}>
              <option value="">All Cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <p className="lm-hint">
            <FaLightbulb color="#eab308" /> Check 2+ similar localities, type the correct name, and merge.
          </p>
        </div>

        {selected.length > 0 && (
          <div className="lm-merge-bar">
            <div className="selected-tags">
              <span className="lm-selected-text">Selected:</span>
              {selected.map((s) => (
                <span key={s} className="lm-tag">
                  {s}
                  <button onClick={() => toggleSelect(s)}><FaTimes size={12} /></button>
                </span>
              ))}
            </div>
            <div className="lm-selected-arrow-wrapper">
              <span className="lm-selected-arrow">→</span>
              <input
                className="lm-merge-input"
                placeholder="Type final correct name..."
                value={canonicalName}
                onChange={(e) => setCanonicalName(e.target.value)}
              />
              <button className="lm-merge-btn" onClick={handleMerge} disabled={merging}>
                {merging ? "Merging Data..." : `Merge ${selected.length} Localities`}
              </button>
            </div>
          </div>
        )}

        <div className="lm-table-wrap">
          {loading ? (
            <div className="lm-empty">
              <div className="lm-empty-icon"><FaHourglassHalf color="#cbd5e1" /></div>
              Loading localities data...
            </div>
          ) : filtered.length === 0 ? (
            <div className="lm-empty">
              <div className="lm-empty-icon"><FaSearch color="#cbd5e1" /></div>
              No localities match your search.
            </div>
          ) : (
            <>
            <div className="lm-table-responsive">
              <table className="lm-table">
                <thead>
                <tr>
                  <th className="lm-th-checkbox"></th>
                  <th className="lm-th-name">Locality Name</th>
                  <th className="lm-th-city">City</th>
                  <th className="lm-th-pgs">PGs Attached</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => (
                  <tr 
                    key={i} 
                    className={`${selected.includes(l.locality) ? "lm-selected" : ""} lm-tr-clickable`} 
                    onClick={() => toggleSelect(l.locality)}
                  >
                    <td className="lm-td-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="lm-checkbox"
                        checked={selected.includes(l.locality)}
                        onChange={() => toggleSelect(l.locality)}
                      />
                    </td>
                    <td className="lm-td-name">
                      <span className={`lm-locality-text ${selected.includes(l.locality) ? "lm-locality-text-selected" : "lm-locality-text-unselected"}`}>
                        {l.locality}
                      </span>
                    </td>
                    <td className="lm-td-city">
                       <i className="bi bi-geo-alt-fill lm-geo-icon"></i> 
                       {l.city || "—"}
                    </td>
                    <td className="lm-td-pgs">
                      <span className="lm-count lm-count-badge">
                        {l.count} PG{l.count !== 1 ? "s" : ""}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            <div className="lm-card-list">
              {filtered.map((l, i) => (
                <div 
                  key={i} 
                  className={`lm-card ${selected.includes(l.locality) ? "lm-card-selected" : ""}`}
                  onClick={() => toggleSelect(l.locality)}
                >
                  <div className="lm-mobile-card-row">
                    <div className="lm-mobile-checkbox-wrap">
                       <input
                         type="checkbox"
                         className="lm-checkbox"
                         checked={selected.includes(l.locality)}
                         onChange={() => toggleSelect(l.locality)}
                         onClick={(e) => e.stopPropagation()}
                       />
                    </div>
                    <div className="lm-mobile-info-wrap">
                      <div className="lm-mobile-name-wrap">
                        <span className={`lm-locality-text ${selected.includes(l.locality) ? "lm-locality-text-selected" : "lm-locality-text-unselected"}`}>
                          {l.locality}
                        </span>
                      </div>
                      <div className="lm-mobile-city-row">
                        <span><i className="bi bi-geo-alt-fill lm-geo-icon-sm"></i> {l.city || "—"}</span>
                        <span className="lm-mobile-dot">•</span>
                        <span>PGs Attached: <strong className="lm-count-badge">{l.count}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminLocalityManager;
