import { useEffect, useMemo, useState } from "react";

import "./BedAvailabilityDisplay.css";

/* ═══════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════ */
const BedIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v5"/>
    <path d="M2 20v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5"/>
    <path d="M2 13h20"/><path d="M7 13v7"/><path d="M17 13v7"/>
  </svg>
);

const ChevronDown = ({ open }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    className="bed-chevron"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

/* ═══════════════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════════════ */
const SHARING_LABELS = {
  SINGLE: { label: "Private", emoji: "🚪" },
  DOUBLE: { label: "Double",  emoji: "🛏" },
  TRIPLE: { label: "Triple",  emoji: "🛏" },
};

/* ═══════════════════════════════════════════════════
   INTERACTIVE BED SLOT (clickable for selection)
═══════════════════════════════════════════════════ */
const BedSlot = ({ bed, isSelected, onToggle }) => {
  const isAvailable = bed.status === "AVAILABLE";
  const stateClass = isSelected ? "is-selected" : isAvailable ? "is-available" : "";
  
  return (
    <button
      type="button"
      onClick={() => isAvailable && onToggle && onToggle(bed.bedId)}
      title={`Bed ${bed.bedNumber} — ${bed.status}`}
      className={`bed-slot ${stateClass}`}
    >
      {isSelected && <div className="bed-slot-yours">✓ YOURS</div>}
      <BedIcon size={18} />
      <span className="bed-slot-num">B{bed.bedNumber}</span>
      <span className="bed-slot-status">
        {isSelected ? "✓ Sel" : isAvailable ? "Free" : "Taken"}
      </span>
    </button>
  );
};

/* ═══════════════════════════════════════════════════
   ROOM CARD
═══════════════════════════════════════════════════ */
const RoomCard = ({ room, selectedBeds, onBedToggle }) => {
  const avail = room.beds?.filter(b => b.status === "AVAILABLE").length ?? 0;
  const total = room.beds?.length ?? 0;
  return (
    <div className="bed-room-card">
      <div className="bed-room-header">
        <div className="bed-room-title-wrap">
          <span className="bed-room-title">
            Room {room.roomNumber}
          </span>
          <span className={`bed-room-avail ${avail > 0 ? "has-avail" : "no-avail"}`}>
            {avail}/{total} free
          </span>
        </div>
        <span className="bed-room-price">
          ₹{room.monthlyRent?.toLocaleString()}
        </span>
      </div>
      <div className="bed-room-beds">
        {room.beds?.map(bed => (
          <BedSlot 
            key={bed.bedId} 
            bed={bed}
            isSelected={selectedBeds.some(id => String(id) === String(bed.bedId))}
            onToggle={onBedToggle}
          />
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   FLOOR ACCORDION
═══════════════════════════════════════════════════ */
const FloorAccordion = ({ floor, sharingType, defaultOpen, selectedBeds, onBedToggle }) => {
  const [open, setOpen] = useState(defaultOpen);
  const rooms = useMemo(() => floor.rooms?.filter(r => r.sharingType === sharingType) ?? [], [floor, sharingType]);
  const availBeds = rooms.reduce((a, r) => a + (r.beds?.filter(b => b.status === "AVAILABLE").length ?? 0), 0);
  const totalBeds = rooms.reduce((a, r) => a + (r.beds?.length ?? 0), 0);
  if (rooms.length === 0) return null;

  return (
    <div className="bed-floor-acc">
      <button type="button" onClick={() => setOpen(o => !o)} className={`bed-floor-btn ${open ? "is-open" : ""}`}>
        <div className="bed-floor-header">
          <div className={`bed-floor-num ${availBeds > 0 ? "has-avail" : "no-avail"}`}>
            {floor.floorNumber}
          </div>
          <div className="bed-floor-text">
            <div className="bed-floor-title">Floor {floor.floorNumber}</div>
            <div className="bed-floor-desc">
              {rooms.length} room{rooms.length !== 1 ? "s" : ""} ·{" "}
              <span className={`bed-floor-avail-text ${availBeds > 0 ? "has-avail" : "no-avail"}`}>
                {availBeds}/{totalBeds} Available
              </span>
            </div>
          </div>
        </div>
        <ChevronDown open={open} />
      </button>
      {open && (
        <div className="bed-floor-content">
          {rooms.map(room => (
            <RoomCard 
              key={room.roomId} 
              room={room}
              selectedBeds={selectedBeds}
              onBedToggle={onBedToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   SHARING TABS (inside popup)
═══════════════════════════════════════════════════ */
const SharingTabs = ({ availableTypes, value, onChange }) => {
  if (availableTypes.length <= 1) return null;
  return (
    <div className="bed-sharing-tabs">
      {availableTypes.map(t => {
        const cfg = SHARING_LABELS[t] ?? { label: t, emoji: "🛏" };
        const active = value === t;
        return (
          <button key={t} type="button" onClick={() => onChange(t)} className={`bed-sharing-btn ${active ? "is-active" : ""}`}>
            {cfg.emoji} {cfg.label}
          </button>
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   LEGEND
═══════════════════════════════════════════════════ */
const Legend = () => (
  <div className="bed-legend">
    {[
      { bg: "#f0fdf4", border: "#86efac", label: "Available" },
      { bg: "#d1fae5", border: "#10b981", label: "Selected" },
      { bg: "#f8fafc", border: "#e2e8f0", label: "Occupied"  },
    ].map(({ bg, border, label }) => (
      <div key={label} className="bed-legend-item">
        <div className="bed-legend-box" style={{ background: bg, border: `2px solid ${border}` }} />
        <span className="bed-legend-label">{label}</span>
      </div>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════
   AVAILABILITY POPUP MODAL
═══════════════════════════════════════════════════ */
const AvailabilityModal = ({ pg, sharingType: initialType, onReserve, onClose }) => {
  const availableTypes = useMemo(() => {
    const types = new Set();
    pg?.floors?.forEach(f => f.rooms?.forEach(r => types.add(r.sharingType)));
    return ["SINGLE", "DOUBLE", "TRIPLE"].filter(t => types.has(t));
  }, [pg]);

  const [sharingType, setSharingType] = useState(initialType || availableTypes[0] || "");
  const [selectedBeds, setSelectedBeds] = useState([]);

  const floors = useMemo(() =>
    (pg?.floors ?? []).filter(f => f.rooms?.some(r => r.sharingType === sharingType)),
  [pg, sharingType]);

  const totalAvail = useMemo(() =>
    floors.reduce((sum, f) =>
      sum + f.rooms.filter(r => r.sharingType === sharingType)
        .reduce((s, r) => s + (r.beds?.filter(b => b.status === "AVAILABLE").length ?? 0), 0)
    , 0),
  [floors, sharingType]);

  const handleBedToggle = (bedId) => {
    // Toggle: if already selected, deselect; otherwise select
    setSelectedBeds(prev => {
      if (prev.some(id => String(id) === String(bedId))) {
        return prev.filter(id => String(id) !== String(bedId));
      } else {
        return [...prev, bedId];
      }
    });
  };

  const handleReserveClick = () => {
    onClose();
    onReserve(selectedBeds);
  };

  return (
    <div
      onClick={onClose}
      className="bed-modal-overlay"
    >
      <div 
        onClick={e => e.stopPropagation()} 
        className="bed-modal-box">

        {/* Modal header bar */}
        <div className="bed-modal-header">
          <div className="bed-modal-header-inner">
            <div>
              <div className="bed-modal-title">
                🛏 Bed Availability
              </div>
              <div className="bed-modal-subtitle">
                {pg.name} ·{" "}
                {totalAvail > 0
                  ? <span className="bed-modal-avail-text has-avail">{totalAvail} beds available</span>
                  : <span className="bed-modal-avail-text no-avail">No beds available</span>
                }
              </div>
            </div>
            <button type="button" onClick={onClose} className="bed-modal-close"><CloseIcon /></button>
          </div>
        </div>

        {/* Content area with proper scroll */}
        <div className="bed-modal-body bed-modal-scroll">
          <SharingTabs availableTypes={availableTypes} value={sharingType} onChange={setSharingType} />
          <Legend />

          {floors.length === 0 ? (
            <div className="bed-modal-empty">
              No rooms for this sharing type.
            </div>
          ) : (
            <div className="bed-floor-list">
              {floors.map((floor, idx) => (
                <FloorAccordion 
                  key={floor.floorId} 
                  floor={floor} 
                  sharingType={sharingType} 
                  defaultOpen={idx === 0}
                  selectedBeds={selectedBeds}
                  onBedToggle={handleBedToggle}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer with buttons */}
        <div className="bed-modal-footer">
          <button type="button"
            onClick={handleReserveClick}
            disabled={selectedBeds.length === 0}
            className={`bed-reserve-btn ${selectedBeds.length > 0 ? "is-active" : "is-disabled"}`}>
            {selectedBeds.length > 0 
              ? `⚡ Reserve ${selectedBeds.length} Bed${selectedBeds.length !== 1 ? "s" : ""}`
              : "🛏 Select Beds to Continue"}
          </button>

          <button type="button" onClick={onClose} className="bed-close-btn">Close</button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN EXPORT
   — renders as flex:1 button, no badge, no count
   — fits neatly inside a flex row with Enquiry button
   — passes selected beds to onReserve callback
═══════════════════════════════════════════════════ */
const BedAvailabilityDisplay = ({ pg, sharingType, onReserve }) => {
  const [showModal, setShowModal] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showModal]);

  const handleReserveWithBeds = (selectedBedIds) => {
    setShowModal(false);
    onReserve(selectedBedIds);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="bed-avail-trigger"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 9V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v5"/>
          <path d="M2 20v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5"/>
          <path d="M2 13h20"/>
        </svg>
        Availability
      </button>

      {showModal && (
        <AvailabilityModal
          pg={pg}
          sharingType={sharingType}
          onReserve={handleReserveWithBeds}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default BedAvailabilityDisplay;