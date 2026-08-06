import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getApkDownloadUrl } from "../../utils/apk";
import languageIcon from "../../assets/Language_icon.png";
import "./SubAdminDashboard.css";

/* ── SVG Icons ── */
const IconUser = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconHome = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const IconCreditCard = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const IconSearch = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconBuilding = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
  </svg>
);

const IconMail = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const IconPlus = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18" stroke="white" strokeWidth="2"/>
  </svg>
);



const IconSun = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const IconCloud = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
  </svg>
);

const IconMoon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

/* ── Helpers ── */
const useCountUp = (target, duration = 900) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
};

const getGreeting = (h) => {
  if (h < 12) return { text: "Good morning",   Icon: IconSun };
  if (h < 17) return { text: "Good afternoon", Icon: IconCloud };
  return       { text: "Good evening",         Icon: IconMoon };
};

/* ── Component ── */
const SubAdminDashboard = () => {
  const navigate  = useNavigate();
  const now       = new Date();
  const { text: greetText, Icon: GreetIcon } = getGreeting(now.getHours());

  const [stats, setStats] = useState({ owners: null, pgs: null, subscriptions: null });

  useEffect(() => {
    api.get("/subadmin/dashboard/stats")
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, []);

  const animOwners = useCountUp(stats.owners ?? 0);
  const animPgs    = useCountUp(stats.pgs    ?? 0);
  const animSubs   = useCountUp(stats.subscriptions ?? 0);

  const STAT_CARDS = [
    {
      Icon: IconUser,
      label: "PG Owners",
      value: stats.owners !== null ? animOwners : "—",
      sub: "Registered on platform",
      cls: "sa-blue",
      path: null,
    },
    {
      Icon: IconHome,
      label: "Total PGs",
      value: stats.pgs !== null ? animPgs : "—",
      sub: "Listed properties",
      cls: "sa-purple",
      path: null,
    },
    {
      Icon: IconCreditCard,
      label: "Active Subscriptions",
      value: stats.subscriptions !== null ? animSubs : "—",
      sub: "Paid plan holders",
      cls: "sa-green",
      path: null,
    },
  ];

  const QUICK_ACTIONS = [
    { Icon: IconSearch,   label: "PG Verifications", path: "/subadmin/verifications" },
    { Icon: IconBuilding, label: "PG Management",    path: "/subadmin/pg-control" },
    { Icon: IconMail,     label: "Owner Enquiries",  path: "/subadmin/owner-enquiries" },
    { Icon: IconPlus,     label: "Add Owner",        path: "/subadmin/add-owner" },
  ];

  const [subLangOpen, setSubLangOpen] = useState(false);
  const subLangRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (subLangRef.current && !subLangRef.current.contains(e.target))
        setSubLangOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <DashboardLayout
      title="Sub Admin Dashboard"
      subtitle="Platform overview"
      rightAction={
        <div ref={subLangRef} style={{ position: "relative" }}>
  <button
    onClick={(e) => { e.stopPropagation(); setSubLangOpen((o) => !o); }}
    className="lang-btn-mobile"
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "#ffffff";
      e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.12)";
      const tip = e.currentTarget.querySelector(".lang-tooltip");
      if (tip) tip.style.opacity = "1";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.boxShadow = "none";
      const tip = e.currentTarget.querySelector(".lang-tooltip");
      if (tip) tip.style.opacity = "0";
    }}
    style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      width: "48px", height: "48px", borderRadius: "10px",
      border: "none", background: "transparent",
      cursor: "pointer", padding: 0,
      position: "relative",
      transition: "background 0.15s, box-shadow 0.15s",
    }}
  >
    <img src={languageIcon} alt="Language" style={{ width: "38px", height: "38px" }} />
    <span
      className="lang-tooltip"
      style={{
        position: "absolute",
        top: "calc(100% + 6px)",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#1e1756",
        color: "#fff",
        fontSize: "11px",
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: "6px",
        whiteSpace: "nowrap",
        opacity: 0,
        pointerEvents: "none",
        transition: "opacity 0.15s",
        zIndex: 10000,
      }}
    >
      Language
    </span>
  </button>

  {subLangOpen && (
    <div style={{
      position: "absolute", top: "calc(100% + 6px)", right: 0,
      background: "#fff", border: "1.5px solid #e5e7eb",
      borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      zIndex: 9999, minWidth: "150px", padding: "6px",
    }}>
      <div style={{
        padding: "8px 14px 6px",
        fontSize: "11px", fontWeight: 700, color: "#9CA3AF",
        textTransform: "uppercase", letterSpacing: "0.5px",
        borderBottom: "1px solid #f1f2f6", marginBottom: "4px",
      }}>
        Language
      </div>
      {[
        { value: "en", label: "English" },
        { value: "hi", label: "हिंदी" },
        { value: "mr", label: "मराठी" },
        { value: "gu", label: "ગુજરાતી" },
        { value: "pa", label: "ਪੰਜਾਬੀ" },
        { value: "bn", label: "বাংলা" },
        { value: "ta", label: "தமிழ்" },
        { value: "te", label: "తెలుగు" },
        { value: "kn", label: "ಕನ್ನಡ" },
        { value: "ml", label: "മലയാളം" },
      ].map((lang) => (
        <div
          key={lang.value}
          className="notranslate"
          translate="no"
          onClick={() => {
            const cookieValue = lang.value === "en" ? "/en/en" : `/en/${lang.value}`;
            document.cookie = `googtrans=${cookieValue}; path=/`;
            document.cookie = `googtrans=${cookieValue}; path=/; domain=${window.location.hostname}`;
            window.location.reload();
          }}
          style={{
            padding: "6px 14px", fontSize: "13px", cursor: "pointer",
            borderRadius: "8px", color: "#374151",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          {lang.label}
        </div>
      ))}
    </div>
  )}
</div>
      }
    >
      {/* ══ GREETING ══ */}
      <div className="sa-greeting">
        <div className="sa-greeting-content">
          <p className="sa-eyebrow">Sub Admin Panel</p>
          <h2 className="sa-greeting-title">
            {greetText}, Sub Admin&nbsp;
            <span className="sa-greet-icon"><GreetIcon /></span>
          </h2>
          <p className="sa-greeting-sub">
            Here's a quick overview of the platform today.
          </p>
        </div>

        {/* APK CTA */}
        <div className="sa-app-cta">
          <div className="sa-app-header">
            <div className="sa-app-icon">
              <IconPhone />
            </div>
            <span className="sa-app-text">Get PGMate App</span>
          </div>
          <button
            className="sa-app-btn"
            onClick={() => window.location.href = getApkDownloadUrl()}
          >
            Download App
          </button>
        </div>
      </div>

      {/* ══ STAT CARDS ══ */}
      <div className="sa-stat-row">
        {STAT_CARDS.map((card, i) => (
          <div
            key={i}
            className={`sa-stat-card ${card.cls}`}
            style={{ animationDelay: `${i * 0.09}s` }}
            onClick={() => card.path && navigate(card.path)}
          >
            <div className="sa-stat-icon-wrap">
              <card.Icon />
            </div>
            <div className="sa-stat-value">{card.value}</div>
            <div className="sa-stat-label">{card.label}</div>
            <div className="sa-stat-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ══ QUICK ACTIONS ══ */}
      <div className="sa-actions-section">
        <h3 className="sa-actions-title">Quick Actions</h3>
        <div className="sa-actions-grid">
          {QUICK_ACTIONS.map((action, i) => (
            <div key={i} className="sa-action-card" onClick={() => navigate(action.path)}>
              <action.Icon />
              <p>{action.label}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SubAdminDashboard;