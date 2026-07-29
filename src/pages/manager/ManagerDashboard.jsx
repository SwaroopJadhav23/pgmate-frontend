import { FaHandPaper } from "react-icons/fa";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
  Area, AreaChart, CartesianGrid,
} from "recharts";
import "../../layouts/layout.css";
import "./ManagerDashboard.css";
import { getApkDownloadUrl } from "../../utils/apk";
import languageIcon from "../../assets/Language_icon.png";


/* ─── helpers ─────────────────────────────────────── */
const fmtINR = (n) => "₹" + Math.round(n ?? 0).toLocaleString("en-IN");

/* ─── count-up hook ───────────────────────────────── */
const useCountUp = (target, duration = 900) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
};

/* ─── Custom bar tooltip ──────────────────────────── */
const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="custom-tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="custom-tooltip-item" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

/* ─── Revenue Pulse tooltip ───────────────────────── */
const RevTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rev-tooltip">
      <p className="rev-tooltip-label">{label}</p>
      <p className="rev-tooltip-val">{fmtINR(payload[0]?.value)}</p>
    </div>
  );
};

/* ─── Revenue Pulse Card ──────────────────────────── */
 // eslint-disable-next-line
const RevenuePulseCard = ({ stats, onNavigate }) => {
  if (!stats) {
    return (
      <div className="dash-chart-card dash-revenue-card dash-chart-card-empty">
        <div className="dash-chart-title rev-header dash-chart-title-empty">Revenue pulse</div>
        <div className="dash-chart-empty-text">Loading…</div>
      </div>
    );
  }

  const collected = stats.revenueCollected ?? 0;
  const pending = stats.revenuePending ?? 0;
  const overdue = stats.revenueOverdue ?? 0;
  const total = collected + pending + overdue;
  const colRate = total > 0 ? Math.round((collected / total) * 100) : 0;

  const history = Array.isArray(stats.revenueHistory) && stats.revenueHistory.length > 0
    ? stats.revenueHistory : [];

  const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const nowMonth = new Date().getMonth();
  const chartData = history.map((v, i) => ({
    month: allMonths[(nowMonth - (history.length - 1 - i) + 12) % 12],
    amount: v,
  }));

  const pctChange = history.length >= 2
    ? Math.round(
      ((history[history.length - 1] - history[history.length - 2]) /
        (history[history.length - 2] || 1)) * 100
    )
    : null;

  return (
    <div className="dash-chart-card dash-revenue-card" onClick={() => onNavigate("revenue")} style={{ cursor: "pointer" }}>
      <div className="dash-chart-title rev-header">
        <span className="rev-icon-wrap">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M1 8h3l2-5 3 10 2-6 2 3h2" stroke="#534AB7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        Revenue pulse
        {pctChange !== null && (
          <span className={`rev-tag ${pctChange >= 0 ? "rev-tag-up" : "rev-tag-down"}`}>
            {pctChange >= 0 ? "▲" : "▼"} {Math.abs(pctChange)}% this mo.
          </span>
        )}
      </div>
      <div>
        <div className="rev-big">{fmtINR(collected)}</div>
        <div className="rev-sub">Collected this month</div>
      </div>
      <div className="rev-sparkline-wrap">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
              <defs>
                <linearGradient id="revGradMgr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7B74F0" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#7B74F0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`} />
              <Tooltip content={<RevTooltip />} />
              <Area type="monotone" dataKey="amount" stroke="#7B74F0" strokeWidth={2}
                fill="url(#revGradMgr)" dot={false} activeDot={{ r: 4, fill: "#4F46E5" }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="dash-chart-empty-text">
            No history data yet
          </div>
        )}
      </div>
      <div className="rev-pills-row">
        <div className="rev-pill rev-pill-pending">
          <span className="rev-pill-label">Pending</span>
          <span className="rev-pill-val">{fmtINR(pending)}</span>
        </div>
        <div className="rev-pill rev-pill-overdue">
          <span className="rev-pill-label">Overdue</span>
          <span className="rev-pill-val">{fmtINR(overdue)}</span>
        </div>
      </div>
      <div>
        <div className="rev-bar-head">
          <span className="rev-bar-label">Collection rate</span>
          <span className="rev-bar-pct">{colRate}%</span>
        </div>
        <div className="rev-bar-track">
          <div className="rev-bar-fill" style={{ width: `${colRate}%` }} />
        </div>
      </div>
    </div>
  );
};

/* ─── Bed Health Score Card ───────────────────────── */
const BedHealthCard = ({ stats, onNavigate }) => {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { if (stats) setTimeout(() => setAnimated(true), 120); }, [stats]);

  if (!stats) {
    return (
      <div className="dash-chart-card dash-bh-card dash-chart-card-empty">
        <div className="dash-chart-title bh-header dash-chart-title-empty">Bed health score</div>
        <div className="dash-chart-empty-text">Loading…</div>
      </div>
    );
  }

  const totalBeds = stats.totalBeds ?? 0;
  const occupied = stats.occupiedBeds ?? 0;
  const available = stats.availableBeds ?? 0;
  const avgVacant = stats.avgVacancyDays ?? 0;
  const turnover = stats.monthlyTurnoverRate ?? 0;
  const dueService = stats.bedsDueService ?? 0;
  const longVacant = stats.longVacantBeds ?? 0;

  const vacancyPressure = available > 0 ? Math.round((longVacant / available) * 100) : 0;

  const score = totalBeds === 0 ? 0 : Math.max(0, Math.min(100, Math.round(
    (occupied / totalBeds) * 45 +
    (1 - Math.min(avgVacant, 30) / 30) * 25 +
    (1 - Math.min(turnover, 50) / 50) * 20 +
    (1 - Math.min(dueService, totalBeds) / totalBeds) * 10
  )));

  let grade, gradeClass, arcColor, tip;
  if (totalBeds === 0) {
    grade = "No beds"; gradeClass = "bh-tag-amber"; arcColor = "#9CA3AF";
    tip = "Add beds to your PG to start tracking bed health.";
  } else if (score >= 75) {
    grade = "Excellent"; gradeClass = "bh-tag-green"; arcColor = "#639922";
    tip = "Your beds are in great shape. Vacancy is low and turnover is healthy.";
  } else if (score >= 50) {
    grade = "Moderate"; gradeClass = "bh-tag-amber"; arcColor = "#BA7517";
    tip = "A few beds have been vacant over 14 days. Consider running promotions.";
  } else {
    grade = "Needs attention"; gradeClass = "bh-tag-red"; arcColor = "#A32D2D";
    tip = "High vacancy pressure. Review pricing and listing visibility urgently.";
  }

  const circ = 2 * Math.PI * 34;
  const dash = animated ? `${(score / 100) * circ} ${circ}` : `0 ${circ}`;

  return (
    <div className="dash-chart-card dash-bh-card" onClick={() => onNavigate("beds")} style={{ cursor: "pointer" }}>
      <div className="dash-chart-title bh-header">
        <span className="bh-icon-wrap">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z" stroke="#3B6D11" strokeWidth="1.5" />
            <path d="M8 5v3.5l2.5 1.5" stroke="#3B6D11" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        Bed health score
        <span className={`bh-tag ${gradeClass}`}>{grade}</span>
      </div>
      <div className="bh-ring-row">
        <div className="bh-ring-wrap">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="34" fill="none" stroke="#e8e7fd" strokeWidth="9" />
            <circle cx="44" cy="44" r="34" fill="none"
              stroke={arcColor} strokeWidth="9" strokeLinecap="round"
              strokeDasharray={dash} transform="rotate(-90 44 44)"
              className="dash-bh-circle-anim"
            />
          </svg>
          <div className="bh-ring-label">
            <span className="bh-score-num" style={{ color: arcColor }}>{score}</span>
            <span className="bh-score-denom">/ 100</span>
          </div>
        </div>
        <div className="bh-facts">
          <div className="bh-fact-row"><span className="bh-fact-label">Avg. days vacant</span><span className="bh-fact-val">{avgVacant > 0 ? `${avgVacant}d` : "—"}</span></div>
          <div className="bh-fact-row"><span className="bh-fact-label">Turnover rate</span><span className="bh-fact-val">{turnover > 0 ? `${turnover}%/mo` : "—"}</span></div>
          <div className="bh-fact-row"><span className="bh-fact-label">Beds due service</span><span className="bh-fact-val">{dueService}</span></div>
          <div className="bh-fact-row"><span className="bh-fact-label">Long-vacant (&gt;14d)</span><span className="bh-fact-val">{longVacant}</span></div>
        </div>
      </div>
      <div className="bh-tip">{tip}</div>
      <div>
        <div className="bh-bar-head">
          <span className="bh-bar-label">Vacancy pressure</span>
          <span className="bh-bar-pct">{vacancyPressure}%</span>
        </div>
        <div className="bh-bar-track">
          <div className="bh-bar-fill" style={{
            width: `${vacancyPressure}%`,
            background: vacancyPressure > 60 ? "#E24B4A" : vacancyPressure > 30 ? "#BA7517" : "#639922",
          }} />
        </div>
      </div>
    </div>
  );
};

/* ─── MAIN ────────────────────────────────────────── */
const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [managerLangOpen, setManagerLangOpen] = useState(false);
  const managerLangRef = useRef(null);

  useEffect(() => {
    api.get("/manager/dashboard/stats")
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Dashboard error", err));
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (managerLangRef.current && !managerLangRef.current.contains(e.target))
        setManagerLangOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const animTotalPgs = useCountUp(stats?.totalPgs ?? 0);
  const animTotalBeds = useCountUp(stats?.totalBeds ?? 0);
  const animAvailableBeds = useCountUp(stats?.availableBeds ?? 0);
  const animFloors = useCountUp(stats?.totalFloors ?? 0);
  const animRooms = useCountUp(stats?.totalRooms ?? 0);
  const animOccupiedBeds = useCountUp(stats?.occupiedBeds ?? 0);
  const animTotalTenants = useCountUp(stats?.totalTenants ?? 0);

  const navTo = (path) => navigate(`/manager/${path}`);

  const pgBarData = stats ? [
    { name: "Floors", value: stats.totalFloors ?? 0, fill: "#7B74F0" },
    { name: "Rooms", value: stats.totalRooms ?? 0, fill: "#4F46E5" },
    { name: "Occupied", value: stats.occupiedBeds ?? 0, fill: "#a5a0ee" },
    { name: "Free", value: stats.availableBeds ?? 0, fill: "#c7c2f6" },
  ] : [];

  const occupied = stats?.occupiedBeds ?? 0;
  const available = stats?.availableBeds ?? 0;
  const total = stats?.totalBeds ?? 0;
  const donutData = total > 0
    ? [{ value: occupied, fill: "#4F46E5" }, { value: available, fill: "#e8e7fd" }]
    : [{ value: 1, fill: "#e8e7fd" }];

  /* ─── Overview cards data (Owner-style: PGs / Beds / Tenants) ──── */
  const overviewCards = [
    {
      label: "Total PGs",
      value: stats ? animTotalPgs : "—",
      icon: (
        <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="#4F46E5" strokeWidth="1.3">
          <rect x="3" y="1.5" width="8" height="13" rx="1" />
          <rect x="11" y="6" width="2.5" height="8.5" rx="0.5" />
          <line x1="5" y1="4" x2="6" y2="4" />
          <line x1="8" y1="4" x2="9" y2="4" />
          <line x1="5" y1="7" x2="6" y2="7" />
          <line x1="8" y1="7" x2="9" y2="7" />
          <line x1="5" y1="10" x2="6" y2="10" />
          <line x1="8" y1="10" x2="9" y2="10" />
          <rect x="5.7" y="11.5" width="1.6" height="3" rx="0.2" />
        </svg>
      ),
      iconBg: "#EEF2FF",
      onClick: () => navigate("/manager/pgs"),
    },
    {
      label: "Total Beds",
      value: stats ? animTotalBeds : "—",
      icon: (
        <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor" style={{ color: "#22C55E" }}>
          <path d="M2 1.5a.5.5 0 0 0-1 0V14a.5.5 0 0 0 1 0v-2h12v2a.5.5 0 0 0 1 0V8a2 2 0 0 0-1-1.732V5.5A2.5 2.5 0 0 0 11.5 3h-7A2.5 2.5 0 0 0 2 5.5v.768A2 2 0 0 0 1 8v.5h1zm1 4V5.5A1.5 1.5 0 0 1 4.5 4h7A1.5 1.5 0 0 1 13 5.5v.5H3zm-1 3V8a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v.5z" />
        </svg>
      ),
      iconBg: "#DCFCE7",
      onClick: () => navigate("/manager/beds"),
    },
    {
      label: "Total Tenants",
      value: stats ? animTotalTenants : "—",
      icon: (
        <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="#F97316" strokeWidth="1.3">
          <circle cx="6.5" cy="5" r="2.5" />
          <path d="M1.5 14c0-3 2.3-5 5-5s5 2 5 5" />
          <line x1="13" y1="5" x2="13" y2="9" />
          <line x1="11" y1="7" x2="15" y2="7" />
        </svg>
      ),
      iconBg: "#FFF7ED",
      onClick: () => navigate("/manager/residents"),
    },
  ];

  return (
    <DashboardLayout
      title="Caretaker Dashboard"
      subtitle="Manage your PG operations"
      rightAction={
        <div ref={managerLangRef} style={{ position: "relative" }}>
  <button
    onClick={(e) => { e.stopPropagation(); setManagerLangOpen((o) => !o); }}
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
      transition: "background 0.15s, box-shadow 0.15s"
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
        zIndex: 10000
      }}
    >
      Language
    </span>
  </button>

  {managerLangOpen && (
    <div className="dash-lang-menu">
      <div className="dash-lang-header">
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
        { value: "ml", label: "മലయാളం" },
      ].map((lang) => (
        <div
          key={lang.value}
          className="notranslate dash-lang-item"
          translate="no"
          onClick={() => {
            const cookieValue = lang.value === "en" ? "/en/en" : `/en/${lang.value}`;
            document.cookie = `googtrans=${cookieValue}; path=/`;
            document.cookie = `googtrans=${cookieValue}; path=/; domain=${window.location.hostname}`;
            window.location.reload();
          }}
        >
          {lang.label}
        </div>
      ))}
    </div>
  )}
</div>
      }
    >
      {/* ── Welcome Banner ── */}
      <div className="dashboard-welcome">
        <div className="welcome-text">
          <h2>Welcome back, <span className="welcome-name">Caretaker</span> <FaHandPaper color="#f59e0b" /></h2>
          <p className="welcome-subtitle">Here's what's happening in your PG today.</p>
        </div>
        <div className="welcome-app-cta">
          <div className="app-cta-header">
            <div className="app-icon"><i className="bi bi-phone-fill"></i></div>
            <p className="app-cta-text">Get PGMate App</p>
          </div>
          <button className="app-cta-btn" onClick={() => window.location.href = getApkDownloadUrl()}>
            <i className="bi bi-download"></i>
            <span className="app-cta-btn-text">Download APK</span>
          </button>
        </div>
      </div>

      {/* ── Quick Actions — one row, top (Owner-style) ── */}
      <div className="mgr-quick-col">
        <div className="mgr-quick-header">
          <h4>Quick Action</h4><span>| Run your PG faster</span>
        </div>
        <div className="mgr-quick-row">
          <button className="mgr-quick-btn mgr-qb-purple" onClick={() => navigate("/manager/rooms")}>
            <i className="bi bi-door-open"></i><span>Add Room</span>
          </button>
          <button className="mgr-quick-btn mgr-qb-green" onClick={() => navigate("/manager/beds")}>
            <i className="bi bi-grid"></i><span>Add Bed</span>
          </button>
          <button className="mgr-quick-btn mgr-qb-orange" onClick={() => navigate("/manager/residents")}>
            <i className="bi bi-person-plus"></i><span>Add Tenant</span>
          </button>
        </div>
      </div>

      {/* ── Overview Section (Owner-style: PGs / Beds / Tenants) ── */}
      <div className="mgr-overview-section">
        <div className="mgr-overview-header">Overview</div>
        <div className="mgr-overview-grid">
          {overviewCards.map((card) => (
            <div key={card.label} className="mgr-overview-card" onClick={card.onClick}>
              <div className="mgr-overview-icon" style={{ background: card.iconBg }}>
                {card.icon}
              </div>
              <div className="mgr-overview-label">{card.label}</div>
              <div className="mgr-overview-value">{card.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="dash-main-grid">

        {/* LEFT */}
        <div className="dash-left">

          {/* Chart Row — Bed Health */}
          <div className="dash-chart-row dash-chart-row--single">
            <BedHealthCard stats={stats} onNavigate={navTo} />
          </div>

          {/* PG Bar Section */}
          <div className="dash-pg-section">
            <div className="dash-pg-title">Total PG — {stats ? animTotalPgs : "—"}</div>

            <div className="dash-stats-strip">
              <div className="dash-stat-box" onClick={() => navigate("/manager/pgs")}>
                <div className="dash-stat-box-label">Total Floors</div>
                <div className="dash-stat-box-value">{stats ? animFloors : "—"}</div>
              </div>
              <div className="dash-stat-box" onClick={() => navigate("/manager/rooms")}>
                <div className="dash-stat-box-label">Total Rooms</div>
                <div className="dash-stat-box-value">{stats ? animRooms : "—"}</div>
              </div>
              <div className="dash-stat-box" onClick={() => navigate("/manager/beds")}>
                <div className="dash-stat-box-label">Available Beds</div>
                <div className="dash-stat-box-value">{stats ? animAvailableBeds : "—"}</div>
              </div>
            </div>

            <div className="dash-pg-bottom">
              <div>
                <div className="dash-bar-legend">
                  {[["#7B74F0", "Floor"], ["#4F46E5", "Occupied PG"], ["#c7c2f6", "Available PG"]].map(([c, l]) => (
                    <div key={l} className="dash-legend-item">
                      <div className="dash-legend-dot" style={{ background: c }}></div> {l}
                    </div>
                  ))}
                </div>
                <div className="dash-bar-chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pgBarData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={52}>
                        {pgBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="dash-bed-card">
                <div className="dash-bed-title">Total Beds</div>
                <div className="dash-pie-wrapper">
                  <PieChart width={120} height={120}>
                    <Pie data={donutData} cx={55} cy={55} innerRadius={38} outerRadius={55}
                      dataKey="value" startAngle={90} endAngle={-270} stroke="none">
                      {donutData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                  </PieChart>
                  <div className="dash-pie-text">
                    <div className="dash-pie-value">{stats ? animTotalBeds : "—"}</div>
                    beds
                  </div>
                </div>
                <div className="dash-bed-stats">
                  <div className="dash-bed-stat-row">
                    <span>Occupied Beds</span><span>{stats ? animOccupiedBeds : "—"}</span>
                  </div>
                  <div className="dash-bed-stat-row">
                    <span>Available Beds</span><span>{stats ? animAvailableBeds : "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>{/* end dash-left */}

      </div>

    </DashboardLayout>
  );
};

export default ManagerDashboard;