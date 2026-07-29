/**
 * BedPickerPopup — dual-mode bed selector
 *
 * MODE 1: mode="pick"  (default, inside ReserveSeatModal)
 *   onConfirm({ floor, room, bed, floorId, roomId, bedId, sharingType })
 *
 * MODE 2: mode="availability"  (PGDetail page — replaces BedAvailabilityDisplay)
 *   Green "Reserve" button — parent opens ReserveSeatModal with prefilled state
 *
 * Props:
 *   pg             — full PG object (floors[].rooms[].beds[])
 *   onConfirm(p)   — called on confirm
 *   onClose()      — close handler
 *   mode           — "pick" | "availability"   (default: "pick")
 *   currentBedId   — pre-highlight an already-selected bed (optional)
 */

import { useMemo, useState } from "react";

const FF = "'DM Sans','Segoe UI',sans-serif";

/* ── Inject global styles once ── */
if (typeof document !== "undefined" && !document.head.querySelector("[data-bpp]")) {
  const st = document.createElement("style");
  st.setAttribute("data-bpp", "1");
  st.textContent = `
    .bpp-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
    .bpp-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
    .bpp-scroll::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 10px; }
    .bpp-avl:hover { transform: scale(1.08) !important; box-shadow: 0 4px 12px rgba(34,197,94,0.25) !important; }
    @media (max-width: 520px) {
      .bpp-modal   { border-radius: 14px !important; }
      .bpp-th-wrap { padding: 5px 4px !important; }
      .bpp-col     { padding: 6px 4px !important; }
      .bpp-bed     { width: 34px !important; height: 44px !important; }
      .bpp-bed-ico { font-size: 10px !important; }
      .bpp-bed-lbl { font-size: 7px !important; }
      .bpp-bed-sub { font-size: 6px !important; }
      .bpp-th-label { font-size: 8px !important; }
      .bpp-th-rent  { font-size: 7px !important; }
      .bpp-th-dep   { font-size: 6px !important; }
    }
      @media (min-width: 521px) and (max-width: 1024px) {
      .bpp-modal    { max-width: 90vw !important; border-radius: 16px !important; }
      .bpp-th-wrap  { padding: 8px 8px !important; }
      .bpp-col      { padding: 10px 8px !important; }
      .bpp-bed      { width: 54px !important; height: 66px !important; }
      .bpp-bed-ico  { font-size: 16px !important; }
      .bpp-bed-lbl  { font-size: 11px !important; }
      .bpp-bed-sub  { font-size: 9px !important; }
      .bpp-th-label { font-size: 13px !important; }
      .bpp-th-rent  { font-size: 11px !important; }
      .bpp-th-dep   { font-size: 10px !important; }
    }
  `;
  document.head.appendChild(st);
}

/* ── Compute min-rent and min-deposit across all rooms of a type ── */
function getRentInfo(floors, type) {
  const rents = [], deps = [];
  const isCustomN = type.startsWith("CUSTOM_");
  const customBeds = isCustomN ? Number(type.split("_")[1]) : null;
  floors.forEach(f =>
    f.rooms?.filter(r =>
      isCustomN
        ? r.sharingType === "CUSTOM" && r.totalBeds === customBeds
        : r.sharingType === type
    ).forEach(r => {
      if (r.monthlyRent > 0) rents.push(r.monthlyRent);
      if (r.deposit > 0) deps.push(r.deposit);
    })
  );
  if (!rents.length) return null;
  const lo = Math.min(...rents), hi = Math.max(...rents);
  const dep = deps.length ? Math.min(...deps) : 0;
  return {
    rent: lo === hi ? `₹${lo.toLocaleString()}` : `₹${lo.toLocaleString()}+`,
    deposit: dep > 0 ? `dep ₹${dep.toLocaleString()}` : null,
  };
}

/* ─────────── STYLES ─────────── */
const S = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.62)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 999999,   /* above any navbar */
    padding: "10px 8px",
  },
  modal: {
    width: "100%", maxWidth: 660,
    background: "#fff", borderRadius: 18,
    fontFamily: FF,
    maxHeight: "93vh", display: "flex", flexDirection: "column",
    boxShadow: "0 28px 72px rgba(0,0,0,0.32)",
  },
  header: {
    padding: "11px 16px",
    background: "linear-gradient(135deg,#6366f1,#4f46e5)",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    flexShrink: 0, borderRadius: "18px 18px 0 0",
  },
  headerTitle: { color: "#fff", fontWeight: 800, fontSize: 13 },
  headerSub: { color: "#c7d2fe", fontSize: 10, marginTop: 1 },
  closeBtn: {
    width: 28, height: 28, borderRadius: "50%",
    background: "rgba(255,255,255,0.2)", border: "none",
    color: "#fff", cursor: "pointer", fontSize: 15,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  legend: {
    display: "flex", gap: 10, padding: "6px 14px",
    background: "#f5f6ff", borderBottom: "1px solid #e8eaf5",
    flexWrap: "wrap", flexShrink: 0, alignItems: "center",
  },
  legItem: { display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: "#64748b" },
  legDot: (s) => ({ width: 9, height: 9, borderRadius: 2, flexShrink: 0, ...s }),

  scrollWrap: { overflowX: "auto", overflowY: "auto", WebkitOverflowScrolling: "touch", flex: 1, minHeight: 0 },
  inner: { minWidth: 480 },

  thead: {
    display: "grid", 
    background: "#eef0ff", borderBottom: "1px solid #dde0f7",
    position: "sticky", top: 0, zIndex: 2,
  },
  thCell: {
    padding: "7px 7px", display: "flex", flexDirection: "column", gap: 2,
  },
  thLabel: { fontSize: 10, fontWeight: 800, color: "#6366f1", letterSpacing: "0.4px", textTransform: "uppercase" },
  thRentTag: {
    display: "inline-flex", width: "fit-content",
    background: "#f0fdf4", border: "1px solid #86efac",
    color: "#16a34a", borderRadius: 4,
    fontSize: 8, fontWeight: 800, padding: "1px 4px", whiteSpace: "nowrap",
  },
  thDepTag: {
    display: "inline-flex", width: "fit-content",
    background: "#fffbeb", border: "1px solid #fde68a",
    color: "#92400e", borderRadius: 4,
    fontSize: 7, fontWeight: 700, padding: "1px 3px", whiteSpace: "nowrap",
  },

  row: {
    display: "grid", 
    borderBottom: "1px solid #f1f2fb", alignItems: "stretch",
  },
  floorLabel: { padding: "10px 4px", display: "flex", flexDirection: "column", gap: 3, alignItems: "center", justifyContent: "flex-start" },
  floorNum: {
    width: 22, height: 22, borderRadius: 6, background: "#6366f1",
    color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
  },
  floorName: { fontSize: 9, fontWeight: 700, color: "#94a3b8" },

  col: { padding: "8px 5px", borderLeft: "1px dashed #ede9fe" },
  colInner: { fontSize: 9, fontWeight: 800, letterSpacing: "0.4px", textTransform: "uppercase", color: "#a5b4fc", marginBottom: 4 },
  tabs: { display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 5 },
  tab: (a) => ({
    padding: "2px 6px", borderRadius: 20, fontSize: 9, fontWeight: 700,
    cursor: "pointer", lineHeight: "1.5", border: "1.5px solid",
    borderColor: a ? "#6366f1" : "#c7d2fe",
    background: a ? "#6366f1" : "#fff",
    color: a ? "#fff" : "#6366f1",
    transition: "all 0.12s",
  }),

  beds: { display: "flex", gap: 4, flexWrap: "wrap" },
  bed: (state) => {
    const base = {
      width: 40, height: 50, borderRadius: 9, display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      border: "2px solid", transition: "all 0.15s",
      position: "relative", userSelect: "none", gap: 1,
    };
    if (state === "sel") return {
      ...base, background: "linear-gradient(135deg,#6366f1,#4f46e5)",
      borderColor: "#4338ca", color: "#fff",
      transform: "scale(1.1)", boxShadow: "0 5px 16px rgba(99,102,241,0.42)", cursor: "default",
    };
    if (state === "avl") return { ...base, background: "#f0fdf4", borderColor: "#86efac", color: "#16a34a", cursor: "pointer" };
    return { ...base, background: "#fafafa", borderColor: "#ede9fe", color: "#c4b5fd", cursor: "not-allowed" };
  },
  yoursTag: {
    position: "absolute", top: -7, left: "50%", transform: "translateX(-50%)",
    background: "#f59e0b", color: "#fff", fontSize: 6, fontWeight: 800,
    padding: "1px 3px", borderRadius: 3, whiteSpace: "nowrap",
  },

  emptyCol: {
    padding: "8px 5px", borderLeft: "1px dashed #ede9fe",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  emptyPill: {
    display: "flex", alignItems: "center", gap: 4,
    padding: "5px 8px", borderRadius: 20,
    background: "#f8f9ff", border: "1.5px solid #e0e4f8",
    cursor: "not-allowed",
  },
  emptyDot: { width: 5, height: 5, borderRadius: "50%", background: "#c7d2fe", flexShrink: 0 },
  emptyText: { fontSize: 8, color: "#a5b4fc", fontWeight: 700, whiteSpace: "nowrap" },

  footer: { padding: "10px 14px", borderTop: "1px solid #e8eaf5", background: "#fafbff", flexShrink: 0, borderRadius: "0 0 18px 18px" },
  selRow: { display: "flex", alignItems: "center", gap: 5, marginBottom: 7, minHeight: 18, flexWrap: "wrap" },
  badge: { background: "#eef2ff", border: "1.5px solid #c7d2fe", color: "#6366f1", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 800 },
  hint: { fontSize: 10, color: "#a5b4fc" },
  confirmBtn: (ready, mode) => ({
    width: "100%", padding: "11px 10px", borderRadius: 11, border: "none",
    fontWeight: 800, fontSize: 13, letterSpacing: "-0.2px",
    cursor: ready ? "pointer" : "not-allowed", transition: "all 0.18s",
    background: ready
      ? mode === "availability" ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#6366f1,#4f46e5)"
      : "#e0e7ff",
    color: ready ? "#fff" : "#a5b4fc",
    boxShadow: ready
      ? mode === "availability" ? "0 4px 14px rgba(16,185,129,0.35)" : "0 4px 14px rgba(99,102,241,0.35)"
      : "none",
  }),
};

/* ── Column header cell with rent info ── */
const ThCell = ({ type, floors }) => {
  const info = useMemo(() => getRentInfo(floors, type), [floors, type]);
  const label = (() => {
    if (type === "SINGLE") return "SINGLE";
    if (type === "DOUBLE") return "DOUBLE";
    if (type === "TRIPLE") return "TRIPLE";
    if (type === "QUADRUPLE") return "QUADRUPLE";
    if (type.startsWith("CUSTOM_")) return `${type.split("_")[1]} SHARING`;
    return "CUSTOM";
  })();
  return (
    <div className="bpp-th-wrap" style={S.thCell}>
      <span className="bpp-th-label" style={S.thLabel}>{label}</span>
      {info && <>
        <span className="bpp-th-rent" style={S.thRentTag}>{info.rent}/mo</span>
        {info.deposit && <span className="bpp-th-dep" style={S.thDepTag}>{info.deposit}</span>}
      </>}
    </div>
  );
};

/* ── Empty cell ── */
const EmptyCol = () => (
  <div style={S.emptyCol}>
    <div style={S.emptyPill}>
      <div style={S.emptyDot} />
      <span style={S.emptyText}>Not available</span>
      <div style={S.emptyDot} />
    </div>
  </div>
);

/* ── Bed card ── */
const BedCard = ({ bed, isSelected, onSelect, reservationEnabled }) => {
  const state = isSelected ? "sel" : bed.status === "AVAILABLE" ? "avl" : "tkn";
  const sub = isSelected ? "yours" : bed.status === "AVAILABLE" ? "avl" : "taken";
  return (
    <div
      className={`bpp-bed${state === "avl" ? " bpp-avl" : ""}`}
      style={S.bed(state)}

      onClick={() => {
        if (state === "avl" && reservationEnabled) onSelect();
      }}
    >
      {isSelected && <span style={S.yoursTag}>YOURS</span>}
      <span className="bpp-bed-ico" style={{ fontSize: 12, lineHeight: 1 }}>🛏</span>
      <span className="bpp-bed-lbl" style={{ fontSize: 8, fontWeight: 800, lineHeight: 1 }}>B{bed.bedNumber}</span>
      <span className="bpp-bed-sub" style={{ fontSize: 7, fontWeight: 700, opacity: 0.75, lineHeight: 1 }}>{sub}</span>
    </div>
  );
};

/* ── Sharing column (no rent here — it's in the header now) ── */
const SharingCol = ({ sharingType, rooms, floorId, activeRoomId, setActiveRoom, selectedBedId, onBedSelect, reservationEnabled }) => {
  if (!rooms.length) return <EmptyCol />;
  const active = rooms.find(r => r.roomId === activeRoomId) || rooms[0];
  return (
    <div className="bpp-col" style={S.col}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>

        {/* LEFT: Sharing Type */}
        <div style={S.colInner}>
          {sharingType.startsWith("CUSTOM_") ? `${sharingType.split("_")[1]} BED` : sharingType}
        </div>

        {/* RIGHT: AC Badge */}
        {rooms.some(r => r.roomType === "AC") && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 999,

              /* ✨ Premium gradient */
              background: "linear-gradient(135deg, #e0f2fe, #bae6fd)",

              /* ✨ Border + glow */
              border: "1px solid rgba(2,132,199,0.25)",
              boxShadow: "0 2px 8px rgba(2,132,199,0.15)",

              /* ✨ Text */
              color: "#0369a1",
              letterSpacing: "0.3px",

              display: "flex",
              alignItems: "center",
              gap: 4,

              /* ✨ Smooth feel */
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)"
            }}
          >
            <span style={{ fontSize: 11 }}>❄️</span>
            AC
          </span>
        )}
      </div>
      <div style={S.tabs}>
        {rooms.map(r => (
          <span key={r.roomId} style={S.tab(r.roomId === active.roomId)} onClick={() => setActiveRoom(floorId, sharingType, r.roomId)}>
            {r.roomNumber}
          </span>
        ))}
      </div>
      <div style={S.beds}>
        {active.beds.map(bed => (
          <BedCard key={bed.bedId} bed={bed} isSelected={selectedBedId === bed.bedId} onSelect={() => onBedSelect(bed, active)} reservationEnabled={reservationEnabled} />
        ))}
      </div>
    </div>
  );
};

/* ── Main component ── */
const BedPickerPopup = ({ pg, onConfirm, onClose = () => { }, mode = "pick", currentBedId }) => {
  const [selBed, setSelBed] = useState(null);
  const [selRoom, setSelRoom] = useState(null);
  const [selFloor, setSelFloor] = useState(null);
  const [activeRooms, setActiveRooms] = useState({});
  
  const floors = useMemo(() => pg?.floors || [], [pg?.floors]);

  const customBedCounts = useMemo(() => {
    const counts = new Set();
    floors.forEach(f =>
      f.rooms?.forEach(r => {
        if (r.sharingType === "CUSTOM" && r.totalBeds) counts.add(r.totalBeds);
      })
    );
    return [...counts].sort((a, b) => a - b); // [6, 8, ...]
  }, [floors]);

  const fixedTypesPresent = useMemo(() => {
  const present = new Set();
  floors.forEach(f =>
    f.rooms?.forEach(r => {
      if (["SINGLE", "DOUBLE", "TRIPLE", "QUADRUPLE"].includes(r.sharingType)) {
        present.add(r.sharingType);
      }
    })
  );
  return ["SINGLE", "DOUBLE", "TRIPLE", "QUADRUPLE"].filter(t => present.has(t));
}, [floors]);

const allTypes = [...fixedTypesPresent, ...customBedCounts.map(n => `CUSTOM_${n}`)];


  const getActive = (fid, type, rooms) => activeRooms[`${fid}_${type}`] || rooms[0]?.roomId;
  const setActive = (fid, type, rid) => setActiveRooms(p => ({ ...p, [`${fid}_${type}`]: rid }));

  const onBedPick = (bed, room, floor) => { setSelBed(bed); setSelRoom(room); setSelFloor(floor); };

  const confirm = () => {
    if (!selBed) return;
    onConfirm({ floor: selFloor, room: selRoom, bed: selBed, floorId: selFloor?.floorId, roomId: selRoom?.roomId, bedId: selBed?.bedId, sharingType: selRoom?.sharingType });
  };

  const ready = !!selBed;
  const btnLabel = ready
    ? mode === "availability"
      ? `⚡ Reserve — Room ${selRoom?.roomNumber}, Bed ${selBed?.bedNumber}`
      : `Confirm — Room ${selRoom?.roomNumber}, Bed ${selBed?.bedNumber}`
    : "Select a bed to continue";

  return (
    <div style={S.overlay} onClick={() => onClose()}>
      <div className="bpp-modal" style={S.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={S.header}>
          <div>
            <div style={S.headerTitle}>🏠 Beds Availability</div>
            <div style={S.headerSub}>{pg?.name || "PG"} · tap a green bed to select</div>
          </div>
          <button style={S.closeBtn} onClick={(e) => { e.stopPropagation(); onClose(); }}>✕</button>
        </div>

        {/* Legend */}
        <div style={S.legend}>
          {[
            { dot: { background: "#86efac", border: "1.5px solid #4ade80" }, label: "Available" },
            { dot: { background: "#ede9fe", border: "1.5px solid #c4b5fd" }, label: "Taken" },
            { dot: { background: "linear-gradient(135deg,#6366f1,#4f46e5)" }, label: "Yours" },
          ].map(({ dot, label }) => (
            <div key={label} style={S.legItem}><div style={S.legDot(dot)} />{label}</div>
          ))}
          <span style={{ fontSize: 9, color: "#b0b8d0", marginLeft: "auto", fontStyle: "italic" }}>scroll → to see all</span>
        </div>

        {/* Grid */}
        <div className="bpp-scroll" style={S.scrollWrap}>
          <div style={S.inner}>

            {/* Sticky header — rent/deposit shown here */}
            <div style={{ ...S.thead, gridTemplateColumns: `58px ${allTypes.map(() => "1fr").join(" ")}` }}>
              <div style={{ ...S.thCell, alignItems: "center", justifyContent: "center" }}>
                <span style={S.thLabel}>FLOOR</span>
              </div>
              {allTypes.map(t => (
                <ThCell key={t} type={t} floors={floors} />
              ))}
            </div>

            {/* Rows */}
            {floors.map(floor => {
              // eslint-disable-next-line
              const byType = t => floor.rooms.filter(r => r.sharingType === t);
              return (
                <div key={floor.floorId} style={{ ...S.row, gridTemplateColumns: `58px ${allTypes.map(() => "1fr").join(" ")}` }}>
                  <div style={S.floorLabel}>
                    <div style={S.floorNum}>{floor.floorNumber}</div>
                    <div style={S.floorName}>Flr {floor.floorNumber}</div>
                  </div>
                  {allTypes.map(type => {
                    const isCustomN = type.startsWith("CUSTOM_");
                    const customBeds = isCustomN ? Number(type.split("_")[1]) : null;
                    const rooms = isCustomN
                      ? floor.rooms.filter(r => r.sharingType === "CUSTOM" && r.totalBeds === customBeds)
                      : floor.rooms.filter(r => r.sharingType === type);
                    return (
                      <SharingCol
                        key={type}
                        sharingType={type}
                        rooms={rooms}
                        floorId={floor.floorId}
                        activeRoomId={getActive(floor.floorId, type, rooms)}
                        setActiveRoom={setActive}
                        selectedBedId={selBed?.bedId ?? currentBedId}
                        onBedSelect={(bed, room) => onBedPick(bed, room, floor)}
                        reservationEnabled={pg?.reservationEnabled || pg?.dailyReservationEnabled}
                      />
                    );
                  })}
                </div>
              );
            })}

          </div>
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <div style={S.selRow}>
            {ready ? (
              <div style={S.selRow}>
                <span style={S.hint}>Selected:</span>

                <span style={S.badge}>
                  Floor {selFloor?.floorNumber} · Room {selRoom?.roomNumber} · Bed {selBed?.bedNumber}
                </span>

                {selRoom?.monthlyRent > 0 && (
                  <span style={{ ...S.badge, background: "#f0fdf4", borderColor: "#86efac", color: "#16a34a" }}>
                    ₹{selRoom.monthlyRent.toLocaleString()}/mo
                  </span>
                )}

                {selRoom?.deposit > 0 && (
                  <span style={{ ...S.badge, background: "#fffbeb", borderColor: "#fde68a", color: "#92400e" }}>
                    dep ₹{selRoom.deposit.toLocaleString()}
                  </span>
                )}
              </div>
            ) : (
              (pg?.reservationEnabled || pg?.dailyReservationEnabled) && (
                <span style={S.hint}>Select a bed above to continue</span>
              )
            )}
          </div>
          {(pg?.reservationEnabled || pg?.dailyReservationEnabled) && (
            <button
              style={S.confirmBtn(ready, mode)}
              disabled={!ready}
              onClick={confirm}
            >
              {btnLabel}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default BedPickerPopup;
