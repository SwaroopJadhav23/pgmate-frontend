import { useEffect, useState } from "react";
import "./OnboardingGuide.css";

/* ============================================================
   SVG ICONS — replace emoji, inherit color via currentColor
============================================================ */
const Icon = {
  Wave: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-1-6-3l-3.3-4.6a2 2 0 0 1 3.1-2.5L8 14" />
    </svg>
  ),
  Home: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
    </svg>
  ),
  Building: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <line x1="8" y1="7" x2="9" y2="7" /><line x1="15" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="9" y2="11" /><line x1="15" y1="11" x2="16" y2="11" />
      <line x1="8" y1="15" x2="9" y2="15" /><line x1="15" y1="15" x2="16" y2="15" />
      <line x1="10" y1="21" x2="10" y2="18" /><line x1="14" y1="21" x2="14" y2="18" />
    </svg>
  ),
  Door: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="1" />
      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  Bed: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18v-6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6" />
      <path d="M2 18v3" /><path d="M22 18v3" />
      <path d="M4 12V8a2 2 0 0 1 2-2h5v6" />
      <circle cx="7" cy="8.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  Check: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Party: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21l6-2 11-11-4-4L5 15l-2 6z" />
      <line x1="14" y1="6" x2="18" y2="10" />
    </svg>
  ),
  Rocket: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
};

/* ============================================================
   MODE CONFIGS
   - "pg"   : new user, no PGs yet
   - "room" : has PGs but no rooms
   - "bed"  : has rooms but no beds/available beds
============================================================ */
const CONFIGS = {
  pg: {
    badgeIcon: <Icon.Wave />,
    badge: "Welcome aboard",
    title: "Let's get your PG set up",
    subtitle: "Follow these simple steps and you'll be live in minutes.",
    ctaIcon: <Icon.Rocket />,
    ctaLabel: "Let's Go — Add My First PG",
    steps: [
      {
        icon: <Icon.Home />,
        step: "01",
        title: "Add Your PG",
        desc: "Go to 'My PGs' and click '+ Add PG' to list your first property.",
      },
      {
        icon: <Icon.Building />,
        step: "02",
        title: "Floors? Already handled!",
        desc: "Floors are set up while adding your PG — no extra step needed. Just make sure your floor count is correct.",
      },
      {
        icon: <Icon.Door />,
        step: "03",
        title: "Add Rooms",
        desc: "Inside each floor, add rooms with sharing type and rent details.",
      },
      {
        icon: <Icon.Bed />,
        step: "04",
        title: "Add Beds",
        desc: "Inside each room, add beds — you're ready to accept tenants!",
      },
    ],
  },

  room: {
    badgeIcon: <Icon.Door />,
    badge: "Almost there",
    title: "Next step — Add your Rooms",
    subtitle: "Your PG is set up. Now add rooms to each floor.",
    ctaIcon: <Icon.Plus />,
    ctaLabel: "Go to Manage Rooms",
    steps: [
      {
        icon: <Icon.Check />,
        step: "01",
        title: "PG Added",
        desc: "Your PG is live. Floors were configured during setup.",
        done: true,
      },
      {
        icon: <Icon.Door />,
        step: "02",
        title: "Add Rooms",
        desc: "Select your PG and floor, then add rooms with sharing type, rent, and deposit.",
        active: true,
      },
      {
        icon: <Icon.Bed />,
        step: "03",
        title: "Add Beds",
        desc: "After rooms are set, add beds inside each room to start accepting residents.",
      },
    ],
  },

  bed: {
    badgeIcon: <Icon.Bed />,
    badge: "One last step",
    title: "Now add Beds to your Rooms",
    subtitle: "Rooms are ready. Add beds to start accepting tenants.",
    ctaIcon: <Icon.Bed />,
    ctaLabel: "Go to Available Beds",
    steps: [
      {
        icon: <Icon.Check />,
        step: "01",
        title: "PG & Rooms Ready",
        desc: "Your PG and rooms are all set up.",
        done: true,
      },
      {
        icon: <Icon.Bed />,
        step: "02",
        title: "Add Beds",
        desc: "Go to 'Available Beds', select a room and add beds. Each bed can be assigned to a resident.",
        active: true,
      },
      {
        icon: <Icon.Party />,
        step: "03",
        title: "You're Live!",
        desc: "Once beds are added, you can start assigning residents and collecting rent.",
      },
    ],
  },
};

const OnboardingGuide = ({ mode = "pg", onCta, onSkip }) => {
  const [visible, setVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const config = CONFIGS[mode];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const nonDoneIndexes = config.steps
      .map((s, i) => (!s.done ? i : null))
      .filter((i) => i !== null);

    const firstActive = config.steps.findIndex((s) => s.active);
    setActiveStep(firstActive >= 0 ? firstActive : nonDoneIndexes[0] ?? 0);

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        const currentIdx = nonDoneIndexes.indexOf(prev);
        return nonDoneIndexes[(currentIdx + 1) % nonDoneIndexes.length];
      });
    }, 2200);
    return () => clearInterval(interval);
  }, [config]);

  return (
    <div className={`ob-backdrop ${visible ? "ob-visible" : ""}`}>
      <div className="ob-modal">
        {/* Header */}
        <div className="ob-header">
          <div className="ob-badge">
            <span className="ob-badge-icon">{config.badgeIcon}</span>
            {config.badge}
          </div>
          <h2 className="ob-title">{config.title}</h2>
          <p className="ob-subtitle">{config.subtitle}</p>
        </div>

        {/* Steps */}
        <div className="ob-steps">
          {config.steps.map((s, i) => (
            <div
              key={i}
              className={`ob-step 
                ${activeStep === i ? "ob-step-active" : ""} 
                ${s.done ? "ob-step-done" : ""}
              `}
              onClick={() => !s.done && setActiveStep(i)}
            >
              <div className="ob-step-left">
                <div className="ob-step-icon">{s.done ? <Icon.Check /> : s.icon}</div>
                {i < config.steps.length - 1 && (
                  <div
                    className={`ob-step-connector ${s.done ? "ob-connector-done" : ""}`}
                  />
                )}
              </div>
              <div className="ob-step-content">
                <div className="ob-step-number">
                  {s.done ? "Completed" : `Step ${s.step}`}
                </div>
                <div className="ob-step-title">{s.title}</div>
                <div className="ob-step-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="ob-actions">
          <button className="ob-btn-go" onClick={onCta}>
            <span className="ob-btn-go-icon">{config.ctaIcon}</span>
            {config.ctaLabel}
          </button>
          <button className="ob-btn-skip" onClick={onSkip}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingGuide;