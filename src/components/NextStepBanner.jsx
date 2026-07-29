import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./NextStepBanner.css";

/* ================================================
   NextStepBanner
   Shows a contextual "what's next" nudge inside
   PGList after a PG is created for the first time.

   Props:
   - mode: "room" | "bed"
   - onDismiss: fn to hide the banner
================================================ */

/* ---- Inline icon components (no external deps) ---- */
const PartyIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.8 11.3 2 22l10.7-3.8" />
    <path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01" />
    <path d="m22 2-2.24 2.24" />
    <path d="M18.37 6.63 20 5" />
    <path d="m17 11 6 6" />
    <path d="M15.6 15.6 22 22" />
    <path d="m5 4 2.5 2.5" />
    <path d="M17 4h.5a2.5 2.5 0 0 1 0 5H17" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const BedIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4v16" />
    <path d="M2 8h18a2 2 0 0 1 2 2v10" />
    <path d="M2 17h20" />
    <path d="M6 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const CONFIGS = {
  room: {
    icon: <PartyIcon />,
    title: "PG added successfully!",
    desc: "Next step — head to Manage Rooms and add rooms to your floors.",
    cta: (
      <>
        <PlusIcon /> Go to Manage Rooms
      </>
    ),
    route: "/owner/rooms",
  },
  bed: {
    icon: <CheckCircleIcon />,
    title: "Rooms are set up!",
    desc: "Last step — add beds to your rooms so you can assign residents.",
    cta: (
      <>
        <BedIcon /> Go to Available Beds
      </>
    ),
    route: "/owner/available-beds",
  },
};

const NextStepBanner = ({ mode, onDismiss }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const config = CONFIGS[mode];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  if (!config) return null;

  return (
    <div className={`nsb-wrap ${visible ? "nsb-visible" : ""}`}>
      <div className="nsb-inner">
        <div className="nsb-left">
          <span className="nsb-icon">{config.icon}</span>
          <div className="nsb-text">
            <div className="nsb-title">{config.title}</div>
            <div className="nsb-desc">{config.desc}</div>
          </div>
        </div>
        <div className="nsb-actions">
          <button
            className="nsb-btn-cta"
            onClick={() => {
              onDismiss();
              navigate(config.route);
            }}
          >
            {config.cta}
          </button>
          <button className="nsb-btn-dismiss" onClick={onDismiss}>
            <CloseIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NextStepBanner;