import { FaSun, FaMoon, FaThumbsUp, FaHome, FaRocket, FaHandsHelping, FaEnvelopeOpenText } from "react-icons/fa";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "./AdminDashboard.css";
import { saveAs } from "file-saver";
import { getApkDownloadUrl } from "../../utils/apk";
import languageIcon from "../../assets/Language_icon.png";
/* ── count-up hook ── */
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

/* ── live clock hook ── */
const useClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
};

const getGreeting = (h) => {
  if (h < 12) return { text: "Good morning", emoji: "☀️" };
  if (h < 17) return { text: "Good afternoon", emoji: <FaSun color="#eab308" /> };
  return { text: "Good evening", emoji: <FaMoon color="#94a3b8" /> };
};

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconHome = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const CardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const BedIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 15h20M6 10V6a2 2 0 0 1 2-2h3v6M11 10V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 20v2M22 20v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const MOTIVATIONAL_NOTES = [
  <>You're doing great — the platform is in good hands. <FaThumbsUp /></>,
  <>Every verified PG helps someone find a home. Keep going! <FaHome /></>,
  <>Small consistent actions build great platforms. <FaRocket /></>,
  "Your work keeps this community running smoothly. ✨",
  <>Behind every listing is a person looking for a home. <FaHandsHelping /></>,
];

const formatDate = (d) =>
  d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const padZ = (n) => String(n).padStart(2, "0");

const AdminDashboard = () => {
  const navigate = useNavigate();
  const now  = useClock();
  const hour = now.getHours();
  const { text: greetText, emoji: greetEmoji } = getGreeting(hour);

  /* pick a note that rotates daily */
  const noteIndex = now.getDate() % MOTIVATIONAL_NOTES.length;
  const note = MOTIVATIONAL_NOTES[noteIndex];

  /* time parts */
  const hh   = padZ(hour % 12 || 12);
  const mm   = padZ(now.getMinutes());
  const ss   = padZ(now.getSeconds());
  const ampm = hour < 12 ? "AM" : "PM";

  const [stats, setStats] = useState({ owners: null, pgs: null, subscriptions: null, ownersWithActiveTenants: null });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [adminLangOpen, setAdminLangOpen] = useState(false);
  const adminLangRef = useRef(null);
  const exportRef = useRef(null);

  useEffect(() => {
    api.get("/admin/dashboard/stats")
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, []);

useEffect(() => {
    const h = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target))
        setShowExportMenu(false);
      if (adminLangRef.current && !adminLangRef.current.contains(e.target))
        setAdminLangOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const animOwners = useCountUp(stats.owners ?? 0);
  const animPgs    = useCountUp(stats.pgs    ?? 0);
  const animSubs   = useCountUp(stats.subscriptions ?? 0);
  const animActiveOwners = useCountUp(stats.ownersWithActiveTenants ?? 0);


  /* exports */
  const exportPDF = () => {
    if (!stats) return; setShowExportMenu(false);
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(18);
    pdf.text("Admin Dashboard Report", 20, 20);
    let y = 40;
    [["Total PG Owners", stats.owners ?? 0], ["Total PGs", stats.pgs ?? 0], ["Active Subscriptions", stats.subscriptions ?? 0]]
      .forEach(([l, v]) => {
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(12);
        pdf.text(l, 25, y);
        pdf.text(String(v), pdf.internal.pageSize.getWidth() - 25, y, { align: "right" });
        y += 10;
      });
    pdf.save("AdminDashboard.pdf");
  };

  const exportWord = () => {
    if (!stats) return; setShowExportMenu(false);
    saveAs(new Blob(["\ufeff", `<html><body style="font-family:Calibri;padding:40px"><h2>Admin Dashboard Report</h2><table border="1" cellpadding="10" width="100%"><tr><th>Metric</th><th>Value</th></tr><tr><td>Total PG Owners</td><td>${stats.owners ?? 0}</td></tr><tr><td>Total PGs</td><td>${stats.pgs ?? 0}</td></tr><tr><td>Active Subscriptions</td><td>${stats.subscriptions ?? 0}</td></tr></table></body></html>`], { type: "application/msword" }), "AdminDashboard.doc");
  };

  const exportExcel = () => {
    if (!stats) return; setShowExportMenu(false);
    const ws = XLSX.utils.aoa_to_sheet([["Admin Dashboard Report"], [], ["Metric", "Value"], ["Total PG Owners", stats.owners ?? 0], ["Total PGs", stats.pgs ?? 0], ["Active Subscriptions", stats.subscriptions ?? 0]]);
    ws["!cols"] = [{ wch: 40 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dashboard");
    XLSX.writeFile(wb, "AdminDashboard.xlsx");
  };

 const STAT_CARDS = [
    { icon: <UsersIcon />, label: "PG Owners",           value: stats.owners                  !== null ? animOwners       : "—", sub: "Registered on platform",  cls: "sc-blue"  , path: "/admin/owners" },
    { icon: <IconHome />, label: "Total PGs",            value: stats.pgs                     !== null ? animPgs          : "—", sub: "Listed properties",       cls: "sc-purple", path: "/admin/pg-control"  },
    { icon: <CardIcon />, label: "Active Subscriptions", value: stats.subscriptions           !== null ? animSubs         : "—", sub: "Paid plan holders",       cls: "sc-green" , path: "/admin/owners"  },
    { icon: <BedIcon />, label: "Owners With Tenants",  value: stats.ownersWithActiveTenants !== null ? animActiveOwners : "—", sub: "Currently have a tenant", cls: "sc-orange", path: "/admin/owners"  },
  ];

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="Platform overview"
rightAction={
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap', overflow: 'visible' }}>
<div ref={adminLangRef} style={{ position: "relative", flexShrink: 0 }}>
<button
    onClick={(e) => { e.stopPropagation(); setAdminLangOpen((o) => !o); }}
    className="lang-btn-mobile"
    style={{
  display: "flex", alignItems: "center", justifyContent: "center",
  width: "48px", height: "48px",
  border: "none", background: "transparent",
  borderRadius: "10px",
  cursor: "pointer",
  padding: 0,
  position: "relative",
  flexShrink: 0,
  transition: "background 0.15s, box-shadow 0.15s"
}}
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
  >
    <img
      src={languageIcon}
      alt="Language"
      style={{ width: "38px", height: "38px" }}
    />
    <span
      className="lang-tooltip"
      style={{
        position: "absolute", top: "calc(100% + 8px)", left: "50%",
        transform: "translateX(-50%)",
        background: "#fff", color: "#212352",
        fontSize: "11px", fontWeight: 600,
        padding: "5px 10px", borderRadius: "6px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        border: "1px solid #e5e7eb",
        whiteSpace: "nowrap",
        opacity: 0, pointerEvents: "none",
        transition: "opacity 0.15s",
        zIndex: 10000
      }}
    >
      Language
    </span>
  </button>

  {adminLangOpen && (
    <div style={{
      position: "absolute", top: "calc(100% + 6px)", right: 0,
      background: "#fff", border: "1.5px solid #e5e7eb",
      borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      zIndex: 9999, minWidth: "150px", padding: "6px"
    }}>
      <div style={{
        padding: "6px 14px 8px", fontSize: "11px", fontWeight: 700,
        color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px",
        borderBottom: "1px solid #f1f5f9", marginBottom: "4px",
        cursor: "default", userSelect: "none"
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

    <div className="export-wrapper" ref={exportRef} style={{ flexShrink: 0 }}>
      <button className="export-btn-modern" onClick={() => setShowExportMenu(!showExportMenu)}>
  <span className="export-icon">⬇</span>
  <span className="export-label">Export ▾</span>
</button>
      {showExportMenu && (
        <div className="export-dropdown-modern">
          <button onClick={exportPDF}>Export as PDF</button>
          <button onClick={exportWord}>Export as Word</button>
          <button onClick={exportExcel}>Export as Excel</button>
        </div>
      )}
    </div>
  </div>
}
    >

      {/* ══ GREETING BANNER ══ */}
      <div className="dash-greeting">
        <div className="dash-greeting-orb orb1" />
        <div className="dash-greeting-orb orb2" />
        <div className="dash-greeting-orb orb3" />

        {/* Top row — greeting text + status */}
        <div className="dash-greeting-top">
          <div className="dash-greeting-left">
            <div className="dash-eyebrow">
              <span className="dash-eyebrow-dot" />
              Admin Control Center
            </div>
            <h2 className="dash-greeting-title">
              {greetText}, Super Admin&nbsp;
              <span className="wave">{greetEmoji}</span>
            </h2>
            <p className="dash-greeting-date">{formatDate(now)}</p>
          </div>
          <div className="dash-greeting-status">
            <span className="dash-status-dot" />
            All systems operational
          </div>
        </div>

        {/* Bottom row — clock + note */}
       <div className="dash-greeting-bottom">

        {/* Left side: Clock + Note */}
        <div className="dash-left-content">

          {/* Live Clock */}
          <div className="dash-clock">
            <div className="dash-clock-time">
              <span className="dash-clock-hhmm">{hh}:{mm}</span>
              <span className="dash-clock-ss">{ss}</span>
              <span className="dash-clock-ampm">{ampm}</span>
            </div>
            <div className="dash-clock-label">Local time</div>
          </div>

          <div className="dash-banner-divider" />

          {/* Motivational note */}
          <div className="dash-note">
            <div className="dash-note-icon"><FaEnvelopeOpenText /></div>
            <div className="dash-note-body">
              <div className="dash-note-heading">A note for you</div>
              <div className="dash-note-text">{note}</div>
            </div>
          </div>

        </div>

        {/* ✅ RIGHT SIDE APK CTA */}
        <div className="dash-app-cta">
          <div className="dash-app-header">
            <div className="dash-app-icon">
              <i className="bi bi-phone-fill"></i>
            </div>
            <span className="dash-app-text">Get PGMate App</span>
          </div>

          <button
            className="dash-app-btn"
            onClick={() => window.location.href = getApkDownloadUrl()}
          >
            Download App
          </button>
        </div>

      </div>
      </div>

{/* ══ STAT CARDS ══ */}
      <div className="dash-stat-row">
        {STAT_CARDS.map((card, i) => (
          <div
            key={i}
            className={`dash-stat-card ${card.cls}`}
            style={{ animationDelay: `${i * 0.09}s` }}
            onClick={() => navigate(card.path)} 
          >
            <div className="dash-stat-icon-wrap">
              <span className="dash-stat-icon">{card.icon}</span>
            </div>
            <div className="dash-stat-value">{card.value}</div>
            <div className="dash-stat-label">{card.label}</div>
            <div className="dash-stat-sub">{card.sub}</div>
          </div>
        ))}
      </div>

     
      

    </DashboardLayout>
  );
};

export default AdminDashboard;
