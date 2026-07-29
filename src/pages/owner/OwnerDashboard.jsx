import { useEffect, useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import pgmateLogo from "../../assets/PGMate.png";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import OnboardingGuide from "../../components/OnboardingGuide";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Area,
  AreaChart,
  CartesianGrid,
} from "recharts";

import "../../layouts/layout.css";
import "./OwnerDashboard.css";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
import { getApkDownloadUrl } from "../../utils/apk";
import languageIcon from "../../assets/Language_icon.png";
import {
  FaUserCheck,
  FaCheckCircle,
  FaExclamationCircle,
  FaMobileAlt,
  FaDownload,
} from "react-icons/fa";

/* ─── helpers ──────────────────────────────────────────────── */
const getOwnerProfileChecklist = (profile) => {
  if (!profile) return [];
  return [
    { key: "name", label: "Full name", complete: Boolean(profile.name?.trim()) },
    { key: "email", label: "Email", complete: Boolean(profile.email?.trim()) },
    { key: "city", label: "City", complete: Boolean(profile.city?.trim()) },
    { key: "photo", label: "Profile photo", complete: Boolean(profile.photoUrl) },
    { key: "idProof", label: "ID proof", complete: Boolean(profile.idProofUrl) },
  ];
};
const getOwnerProfileCompletion = (profile) => {
  const list = getOwnerProfileChecklist(profile);
  if (!list.length) return 0;
  return Math.round(
    (list.filter((i) => i.complete).length / list.length) * 100,
  );
};
const getOnboardingMode = (stats) => {
  if (!stats) return null;
  if (stats.totalPgs === 0) return "pg";
  if (stats.totalRooms === 0) return "room";
  if (stats.totalBeds === 0) return "bed";
  return null;
};
const fmtINR = (n) => "₹" + Math.round(n ?? 0).toLocaleString("en-IN");

/* ─── count-up hook ─────────────────────────────────────────── */
const useCountUp = (target, duration = 900) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
};

/* ─── Profile popup ─────────────────────────────────────────── */
const ProfileCompletionPopup = ({ profile, onCompleteNow }) => {
  const checklist = getOwnerProfileChecklist(profile);
  const completion = getOwnerProfileCompletion(profile);
  return (
    <div className="profile-complete-overlay">
      <div className="profile-complete-modal">
        <div className="profile-complete-badge">
          <FaUserCheck /> Owner profile setup
        </div>
        <h2>Complete your profile to continue</h2>
        <p>
          Please finish your owner profile details before using the dashboard.
        </p>
        <div className="profile-complete-progress-card">
          <div className="profile-complete-progress-head">
            <span>Completion progress</span>
            <strong>{completion}%</strong>
          </div>
          <div className="profile-complete-progress-bar">
            <div
              className="profile-complete-progress-fill"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
        <div className="profile-complete-checklist">
          {checklist.map((item) => (
            <div
              key={item.key}
              className={`profile-complete-item ${item.complete ? "is-done" : "is-missing"}`}
            >
              {item.complete ? <FaCheckCircle /> : <FaExclamationCircle />}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <button className="profile-complete-btn" onClick={onCompleteNow}>
          Complete Profile
        </button>
      </div>
    </div>
  );
};

/* ─── Custom bar tooltip (enhanced) ────────────────────────── */
const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="custom-tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="custom-tooltip-item">
          <span
            className="custom-tooltip-dot"
            style={{ background: p.payload.fill || p.color }}
          />
          <span className="custom-tooltip-value">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

/* ─── Revenue Pulse custom tooltip ─────────────────────────── */
const RevTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rev-tooltip">
      <p className="rev-tooltip-label">{label}</p>
      <p className="rev-tooltip-val">{fmtINR(payload[0]?.value)}</p>
    </div>
  );
};

/* ─── Revenue Pulse Card — DYNAMIC ─────────────────────────── */
const RevenuePulseCard = ({ stats, onNavigate, subscriptionExpired }) => {
  if (!stats) {
    return (
      <div className="dash-chart-card dash-revenue-card dash-chart-card-empty">
        <div className="dash-chart-title rev-header dash-chart-title-empty">
          Revenue pulse
        </div>
        <div className="dash-chart-empty-text">Loading…</div>
      </div>
    );
  }

  const collected = stats.revenueCollected ?? 0;
  const pending = stats.revenuePending ?? 0;
  const overdue = stats.revenueOverdue ?? 0;
  const total = collected + pending + overdue;
  const colRate = total > 0 ? Math.round((collected / total) * 100) : 0;

  const history =
    Array.isArray(stats.revenueHistory) && stats.revenueHistory.length > 0
      ? stats.revenueHistory
      : [];

  const allMonths = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const nowMonth = new Date().getMonth();
  const chartData = history.map((v, i) => ({
    month: allMonths[(nowMonth - (history.length - 1 - i) + 12) % 12],
    amount: v,
  }));

  const pctChange =
    history.length >= 2
      ? Math.round(
        ((history[history.length - 1] - history[history.length - 2]) /
          (history[history.length - 2] || 1)) *
        100,
      )
      : null;

  return (
    <div
      className={`dash-chart-card dash-revenue-card ${subscriptionExpired ? "dash-card-disabled" : ""}`}
      onClick={() => onNavigate("ownerRevenue")}
      style={{ cursor: "pointer" }}
    >
      <div className="dash-chart-title rev-header">
        <span className="rev-icon-wrap">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path
              d="M1 8h3l2-5 3 10 2-6 2 3h2"
              stroke="#534AB7"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        Revenue pulse
        {pctChange !== null && (
          <span
            className={`rev-tag ${pctChange >= 0 ? "rev-tag-up" : "rev-tag-down"}`}
          >
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
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -32, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7B74F0" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#7B74F0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f8"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`
                }
              />
              <Tooltip content={<RevTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#7B74F0"
                strokeWidth={2}
                fill="url(#revGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#4F46E5" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="dash-chart-empty-text">No history data yet</div>
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

/* ─── Bed Health Score Card — DYNAMIC ──────────────────────── */
const BedHealthCard = ({ stats, onNavigate, subscriptionExpired }) => {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    if (stats) setTimeout(() => setAnimated(true), 120);
  }, [stats]);

  if (!stats) {
    return (
      <div className="dash-chart-card dash-bh-card dash-chart-card-empty">
        <div className="dash-chart-title bh-header dash-chart-title-empty">
          Bed health score
        </div>
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

  const vacancyPressure =
    available > 0 ? Math.round((longVacant / available) * 100) : 0;

  const score =
    totalBeds === 0
      ? 0
      : Math.max(
        0,
        Math.min(
          100,
          Math.round(
            (occupied / totalBeds) * 45 +
            (1 - Math.min(avgVacant, 30) / 30) * 25 +
            (1 - Math.min(turnover, 50) / 50) * 20 +
            (1 - Math.min(dueService, totalBeds) / totalBeds) * 10,
          ),
        ),
      );

  let grade, gradeClass, arcColor, tip;
  if (totalBeds === 0) {
    grade = "No beds";
    gradeClass = "bh-tag-amber";
    arcColor = "#9CA3AF";
    tip = "Add beds to your PG to start tracking bed health.";
  } else if (score >= 75) {
    grade = "Excellent";
    gradeClass = "bh-tag-green";
    arcColor = "#639922";
    tip =
      "Your beds are in great shape. Vacancy is low and turnover is healthy.";
  } else if (score >= 50) {
    grade = "Moderate";
    gradeClass = "bh-tag-amber";
    arcColor = "#BA7517";
    tip =
      "A few beds have been vacant over 14 days. Consider running promotions.";
  } else {
    grade = "Needs attention";
    gradeClass = "bh-tag-red";
    arcColor = "#A32D2D";
    tip =
      "High vacancy pressure. Review pricing and listing visibility urgently.";
  }

  const circ = 2 * Math.PI * 34;
  const dash = animated ? `${(score / 100) * circ} ${circ}` : `0 ${circ}`;

  return (
    <div
      className={`dash-chart-card dash-bh-card ${subscriptionExpired ? "dash-card-disabled" : ""}`}
      onClick={() => onNavigate("available-beds")}
      style={{ cursor: "pointer" }}
    >
      <div className="dash-chart-title bh-header">
        <span className="bh-icon-wrap">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z"
              stroke="#3B6D11"
              strokeWidth="1.5"
            />
            <path
              d="M8 5v3.5l2.5 1.5"
              stroke="#3B6D11"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
        Bed health score
        <span className={`bh-tag ${gradeClass}`}>{grade}</span>
      </div>
      <div className="bh-ring-row">
        <div className="bh-ring-wrap">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle
              cx="44"
              cy="44"
              r="34"
              fill="none"
              stroke="#e8e7fd"
              strokeWidth="9"
            />
            <circle
              cx="44"
              cy="44"
              r="34"
              fill="none"
              stroke={arcColor}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={dash}
              transform="rotate(-90 44 44)"
              className="dash-bh-circle-anim"
            />
          </svg>
          <div className="bh-ring-label">
            <span className="bh-score-num" style={{ color: arcColor }}>
              {score}
            </span>
            <span className="bh-score-denom">/ 100</span>
          </div>
        </div>
        <div className="bh-facts">
          <div className="bh-fact-row">
            <span className="bh-fact-label">Avg. days vacant</span>
            <span className="bh-fact-val">
              {avgVacant > 0 ? `${avgVacant}d` : "—"}
            </span>
          </div>
          <div className="bh-fact-row">
            <span className="bh-fact-label">Turnover rate</span>
            <span className="bh-fact-val">
              {turnover > 0 ? `${turnover}%/mo` : "—"}
            </span>
          </div>
          <div className="bh-fact-row">
            <span className="bh-fact-label">Beds due service</span>
            <span className="bh-fact-val">{dueService}</span>
          </div>
          <div className="bh-fact-row">
            <span className="bh-fact-label">Long-vacant (&gt;14d)</span>
            <span className="bh-fact-val">{longVacant}</span>
          </div>
        </div>
      </div>
      <div className="bh-tip">{tip}</div>
      <div>
        <div className="bh-bar-head">
          <span className="bh-bar-label">Vacancy pressure</span>
          <span className="bh-bar-pct">{vacancyPressure}%</span>
        </div>
        <div className="bh-bar-track">
          <div
            className="bh-bar-fill"
            style={{
              width: `${vacancyPressure}%`,
              background:
                vacancyPressure > 60
                  ? "#E24B4A"
                  : vacancyPressure > 30
                    ? "#BA7517"
                    : "#639922",
            }}
          />
        </div>
      </div>
    </div>
  );
};

/* ─── MAIN ──────────────────────────────────────────────────── */
const OwnerDashboard = ({ apiPrefix = "/owner" }) => {
  const [stats, setStats] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [onboardingMode, setOnboardingMode] = useState(null);
  const [ownerName, setOwnerName] = useState("");
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [showProfileCompletionPopup, setShowProfileCompletionPopup] =
    useState(false);

  const navigate = useNavigate();
  const { subscriptionExpired } = useContext(AuthContext);
  const exportRef = useRef(null);

  const animTotalPgs = useCountUp(stats?.totalPgs ?? 0);
  const animTotalBeds = useCountUp(stats?.totalBeds ?? 0);
  const animAvailableBeds = useCountUp(stats?.availableBeds ?? 0);
  const animFloors = useCountUp(stats?.totalFloors ?? 0);
  const animRooms = useCountUp(stats?.totalRooms ?? 0);
  const animOccupiedBeds = useCountUp(stats?.occupiedBeds ?? 0);
  const animTotalTenants = useCountUp(stats?.totalTenants ?? 0);

  useEffect(() => {
    api
      .get(`${apiPrefix}/dashboard/stats`)
      .then((res) => {
        setStats(res.data);
        setOnboardingMode(getOnboardingMode(res.data));
      })
      .catch((err) => console.error("Dashboard error", err));

    if (apiPrefix === "/owner") {
      const cached = localStorage.getItem("ownerProfile");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setOwnerProfile(parsed);
          setOwnerName(parsed?.name || "Owner");
          setShowProfileCompletionPopup(
            getOwnerProfileCompletion(parsed) < 100,
          );
        } catch {
          localStorage.removeItem("ownerProfile");
        }
      }
      api
        .get("/owner/profile")
        .then((res) => {
          const profile = res.data || null;
          setOwnerProfile(profile);
          setOwnerName(profile?.name || "Owner");
          setShowProfileCompletionPopup(
            getOwnerProfileCompletion(profile) < 100,
          );
          localStorage.setItem("ownerProfile", JSON.stringify(profile));
        })
        .catch(() => {
          setOwnerName((p) => p || "Owner");
          setShowProfileCompletionPopup(false);
        });
    } else {
      setOwnerName("Manager");
      setShowProfileCompletionPopup(false);
    }
  }, [apiPrefix]);

  /* ─ exports ─ */
  const exportPDF = async () => {
    if (!stats) return;

    // Fetch per-PG breakdown data
    let perPgRows = [];
    try {
      const [pgRes, statsRes, revRes] = await Promise.all([
        api.get("/owner/pgs"),
        api.get("/owner/pgs/stats"),
        api.get("/owner/dashboard/pgs/revenue-stats"),
      ]);
      const statsMap = Object.fromEntries(
        (statsRes.data || []).map((s) => [s.pgId, s]),
      );
      const revMap = Object.fromEntries(
        (revRes.data || []).map((r) => [r.pgId, r]),
      );
      perPgRows = (pgRes.data || []).map((pg) => {
        const s = statsMap[pg.id] || {};
        const r = revMap[pg.id] || {};
        return {
          name: pg.name || "—",
          floors: pg.totalFloors ?? 0,
          rooms: s.totalRooms ?? 0,
          beds: s.totalBeds ?? 0,
          occupied: s.occupiedBeds ?? 0,
          available: s.availableBeds ?? 0,
          occupancyPercent: s.occupancyPercent ?? 0,
          collected: r.revenueCollected ?? 0,
          pending: r.revenuePending ?? 0,
          overdue: r.revenueOverdue ?? 0,
        };
      });
    } catch (err) {
      console.error("Per-PG data fetch error", err);
    }

    const toDataURL = (url) =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = img.width;
          c.height = img.height;
          c.getContext("2d").drawImage(img, 0, 0);
          resolve(c.toDataURL("image/png"));
        };
        img.src = url;
      });
    const logoData = await toDataURL(pgmateLogo);

    const pdf = new jsPDF("p", "mm", "a4");
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();

    const PURPLE = [99, 91, 255];
    const DARK = [30, 27, 75];
    const GRAY = [120, 120, 132];
    const LIGHT_BG = [238, 242, 255];
    const GREEN = [34, 197, 94];
    const AMBER = [186, 117, 23];
    const RED_BG = [253, 226, 226];
    const RED_TXT = [163, 45, 45];
    const AMBER_BG = [255, 243, 224];

    /* ── arc helper (donut/score ring via many tiny segments) ── */
    const drawArc = (cx, cy, r, startDeg, endDeg, color, width) => {
      pdf.setDrawColor(...color);
      pdf.setLineWidth(width);
      const steps = Math.max(2, Math.round(Math.abs(endDeg - startDeg)));
      for (let i = 0; i < steps; i++) {
        const a1 =
          (Math.PI / 180) * (startDeg + (endDeg - startDeg) * (i / steps));
        const a2 =
          (Math.PI / 180) *
          (startDeg + (endDeg - startDeg) * ((i + 1) / steps));
        pdf.line(
          cx + r * Math.cos(a1),
          cy + r * Math.sin(a1),
          cx + r * Math.cos(a2),
          cy + r * Math.sin(a2),
        );
      }
    };

    /* ── mini line chart (sparkline) ── */
    const drawLineChart = (x, y, w, h, data, color) => {
      if (!data.length) {
        pdf.setTextColor(...GRAY);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.text("No history data yet", x + w / 2, y + h / 2, {
          align: "center",
        });
        return;
      }
      const max = Math.max(...data, 1);
      const stepX = w / Math.max(data.length - 1, 1);
      pdf.setDrawColor(...color);
      pdf.setLineWidth(0.6);
      for (let i = 0; i < data.length - 1; i++) {
        const x1 = x + i * stepX,
          y1 = y + h - (data[i] / max) * h;
        const x2 = x + (i + 1) * stepX,
          y2 = y + h - (data[i + 1] / max) * h;
        pdf.line(x1, y1, x2, y2);
      }
    };

    /* ── Header ── */
    pdf.setFillColor(230, 228, 250);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        pdf.circle(W - 25 + c * 3, 3 + r * 3, 0.4, "F");
      }
    }
    pdf.addImage(logoData, "PNG", 15, 10, 18, 18);
    pdf.setTextColor(...DARK);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(17);
    pdf.text("OWNER DASHBOARD REPORT", W / 2, 18, { align: "center" });
    pdf.setTextColor(...GRAY);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text("Smart PG & Co-Living Management", W / 2, 24, { align: "center" });

    pdf.setDrawColor(...PURPLE);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(W - 45, 9, 30, 13, 2.5, 2.5, "S");
    pdf.setTextColor(...PURPLE);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text(
      new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      W - 30,
      17,
      { align: "center" },
    );

    pdf.setDrawColor(...PURPLE);
    pdf.setLineWidth(0.6);
    pdf.line(15, 28, W - 15, 28);

    /* ── Stat cards (2 rows x 4) ── */
    const cardW = 43,
      cardH = 26,
      gap = 4;

    const drawStatIcon = (cx, cy, type, color) => {
      pdf.setDrawColor(...color);
      pdf.setFillColor(...color);
      pdf.setLineWidth(0.4);
      switch (type) {
        case "pg":
          // building outline with windows
          pdf.rect(cx - 2.2, cy - 3.2, 4.4, 6.4, "S");
          pdf.rect(cx - 1.4, cy - 2.2, 0.9, 0.9, "F");
          pdf.rect(cx + 0.5, cy - 2.2, 0.9, 0.9, "F");
          pdf.rect(cx - 1.4, cy - 0.4, 0.9, 0.9, "F");
          pdf.rect(cx + 0.5, cy - 0.4, 0.9, 0.9, "F");
          pdf.rect(cx - 0.6, cy + 1.5, 1.2, 1.7, "F");
          break;
        case "bed":
          // simple bed: base + headboard + pillow
          pdf.roundedRect(cx - 3.2, cy - 0.2, 6.4, 2.4, 0.5, 0.5, "S");
          pdf.line(cx - 3.2, cy - 0.2, cx - 3.2, cy + 3);
          pdf.line(cx + 3.2, cy - 0.2, cx + 3.2, cy + 3);
          pdf.roundedRect(cx - 2.6, cy - 1.6, 1.8, 1.5, 0.4, 0.4, "F");
          break;
        case "check":
          pdf.circle(cx, cy, 3.2, "S");
          pdf.setLineWidth(0.6);
          pdf.line(cx - 1.4, cy, cx - 0.2, cy + 1.3);
          pdf.line(cx - 0.2, cy + 1.3, cx + 1.6, cy - 1.4);
          break;
        case "floor":
          // stacked bars icon
          pdf.roundedRect(cx - 3, cy - 3, 6, 1.6, 0.4, 0.4, "F");
          pdf.roundedRect(cx - 3, cy - 0.8, 6, 1.6, 0.4, 0.4, "F");
          pdf.roundedRect(cx - 3, cy + 1.4, 6, 1.6, 0.4, 0.4, "F");
          break;
        case "room":
          // door icon
          pdf.roundedRect(cx - 2, cy - 3.3, 4, 6.6, 0.6, 0.6, "S");
          pdf.circle(cx + 0.9, cy, 0.35, "F");
          break;
        case "people":
          pdf.circle(cx - 1.3, cy - 1.2, 1.1, "F");
          pdf.circle(cx + 1.3, cy - 1.2, 1.1, "F");
          pdf.roundedRect(cx - 2.6, cy + 0.2, 2.6, 2.4, 1, 1, "F");
          pdf.roundedRect(cx, cy + 0.2, 2.6, 2.4, 1, 1, "F");
          break;
        case "revenue":
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(6);
          pdf.text("Rs", cx, cy + 1, { align: "center" });
          break;
        default:
          break;
      }
    };

    const rs = (n) => "Rs. " + Math.round(n ?? 0).toLocaleString("en-IN");

    const drawStatCard = (x, y, card) => {
      pdf.setFillColor(250, 250, 253);
      pdf.setDrawColor(235, 235, 245);
      pdf.roundedRect(x, y, cardW, cardH, 2.5, 2.5, "FD");
      pdf.setFillColor(...LIGHT_BG);
      pdf.circle(x + cardW - 10, y + 6, 4, "F");
      drawStatIcon(x + cardW - 10, y + 6, card.icon, card.color);
      pdf.setTextColor(...GRAY);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.5);
      pdf.text(card.label.toUpperCase(), x + 4, y + 9, { maxWidth: cardW - 20 });
      pdf.setTextColor(...card.color);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(card.small ? 11 : 15);
      pdf.text(String(card.value), x + 4, y + (card.small ? 20 : 19));
    };
    const cards = [
      {
        label: "Total PGs",
        value: stats.totalPgs ?? 0,
        color: PURPLE,
        icon: "pg",
      },
      {
        label: "Total Beds",
        value: stats.totalBeds ?? 0,
        color: PURPLE,
        icon: "bed",
      },
      {
        label: "Available Beds",
        value: stats.availableBeds ?? 0,
        color: GREEN,
        icon: "check",
      },
      {
        label: "Total Floors",
        value: stats.totalFloors ?? 0,
        color: PURPLE,
        icon: "floor",
      },
      {
        label: "Total Rooms",
        value: stats.totalRooms ?? 0,
        color: PURPLE,
        icon: "room",
      },
      {
        label: "Occupied Beds",
        value: stats.occupiedBeds ?? 0,
        color: PURPLE,
        icon: "bed",
      },
      {
        label: "Total Tenants",
        value: stats.totalTenants ?? 0,
        color: PURPLE,
        icon: "people",
      },
      {
        label: "Revenue (This Month)",
        value: rs(stats.revenueCollected ?? 0),
        color: PURPLE,
        small: true,
        icon: "revenue",
      },
    ];

    let y = 32;
    cards
      .slice(0, 4)
      .forEach((c, i) => drawStatCard(15 + i * (cardW + gap), y, c));
    y += cardH + gap;
    cards
      .slice(4)
      .forEach((c, i) => drawStatCard(15 + i * (cardW + gap), y, c));

    /* ── Revenue & Collections + Bed Health row ── */
    y += cardH + 8;
    const colW = (W - 30 - 6) / 2;
    const rowH = 78;

    // Revenue card
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(235, 235, 245);
    pdf.roundedRect(15, y, colW, rowH, 3, 3, "FD");
    pdf.setTextColor(...PURPLE);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("REVENUE & COLLECTIONS", 20, y + 8);

    const collected = stats.revenueCollected ?? 0;
    const pending = stats.revenuePending ?? 0;
    const overdue = stats.revenueOverdue ?? 0;
    const revTotal = collected + pending + overdue;
    const colRate = revTotal > 0 ? Math.round((collected / revTotal) * 100) : 0;
    const history = Array.isArray(stats.revenueHistory)
      ? stats.revenueHistory
      : [];

    if (history.length >= 2) {
      const pctChange = Math.round(
        ((history[history.length - 1] - history[history.length - 2]) /
          (history[history.length - 2] || 1)) *
        100,
      );
      const badgeW = 26,
        badgeX = 15 + colW - badgeW - 5;
      pdf.setFillColor(...(pctChange >= 0 ? [220, 252, 231] : [253, 226, 226]));
      pdf.roundedRect(badgeX, y + 3, badgeW, 6, 1.5, 1.5, "F");
      pdf.setTextColor(...(pctChange >= 0 ? GREEN : RED_TXT));
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6);
      pdf.text(
        `${pctChange >= 0 ? "Up" : "Down"} ${Math.abs(pctChange)}%`,
        badgeX + badgeW / 2,
        y + 7,
        { align: "center" },
      );
    }

    pdf.setTextColor(...DARK);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(rs(collected), 20, y + 17);
    pdf.setTextColor(...GRAY);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.text("Collected this month", 20, y + 22);

    drawLineChart(20, y + 26, colW - 10, 20, history, PURPLE);

    pdf.setFillColor(...AMBER_BG);
    pdf.roundedRect(20, y + 50, colW / 2 - 14, 12, 2, 2, "F");
    pdf.setTextColor(...AMBER);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.5);
    pdf.text("PENDING", 24, y + 56);
    pdf.setFontSize(9);
    pdf.text(rs(pending), 24, y + 60);

    pdf.setFillColor(...RED_BG);
    pdf.roundedRect(20 + colW / 2 - 10, y + 50, colW / 2 - 14, 12, 2, 2, "F");
    pdf.setTextColor(...RED_TXT);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.5);
    pdf.text("OVERDUE", 24 + colW / 2 - 10, y + 56);
    pdf.setFontSize(9);
    pdf.text(rs(overdue), 24 + colW / 2 - 10, y + 60);

    pdf.setTextColor(...GRAY);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.text("Collection Rate", 20, y + 68);
    pdf.setTextColor(...PURPLE);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${colRate}%`, 20 + colW - 20, y + 68);
    pdf.setFillColor(230, 228, 250);
    pdf.roundedRect(20, y + 70, colW - 10, 2.5, 1, 1, "F");
    pdf.setFillColor(...PURPLE);
    pdf.roundedRect(20, y + 70, (colW - 10) * (colRate / 100), 2.5, 1, 1, "F");

    // Bed Health card
    const bx = 15 + colW + 6;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(235, 235, 245);
    pdf.roundedRect(bx, y, colW, rowH, 3, 3, "FD");
    pdf.setTextColor(...PURPLE);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("BED HEALTH SCORE", bx + 5, y + 8);

    const totalBeds = stats.totalBeds ?? 0;
    const occ = stats.occupiedBeds ?? 0;
    const avail = stats.availableBeds ?? 0;
    const avgVacant = stats.avgVacancyDays ?? 0;
    const turnover = stats.monthlyTurnoverRate ?? 0;
    const dueService = stats.bedsDueService ?? 0;
    const longVacant = stats.longVacantBeds ?? 0;
    const vacancyPressure =
      avail > 0 ? Math.round((longVacant / avail) * 100) : 0;
    const score =
      totalBeds === 0
        ? 0
        : Math.max(
          0,
          Math.min(
            100,
            Math.round(
              (occ / totalBeds) * 45 +
              (1 - Math.min(avgVacant, 30) / 30) * 25 +
              (1 - Math.min(turnover, 50) / 50) * 20 +
              (1 - Math.min(dueService, totalBeds) / totalBeds) * 10,
            ),
          ),
        );
    const scoreColor = score >= 75 ? GREEN : score >= 50 ? AMBER : RED_TXT;

    pdf.setDrawColor(230, 228, 250);
    pdf.setLineWidth(2.5);
    pdf.circle(bx + 22, y + 30, 12, "S");
    drawArc(
      bx + 22,
      y + 30,
      12,
      -90,
      -90 + (score / 100) * 360,
      scoreColor,
      2.5,
    );
    pdf.setTextColor(...scoreColor);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(String(score), bx + 22, y + 31, { align: "center" });
    pdf.setTextColor(...GRAY);
    pdf.setFontSize(6);
    pdf.text("/100", bx + 22, y + 35, { align: "center" });

    const facts = [
      ["Avg. days vacant", avgVacant ? `${avgVacant}d` : "—"],
      ["Turnover rate", turnover ? `${turnover}%/mo` : "—"],
      ["Beds due service", String(dueService)],
      ["Long-vacant (>14d)", String(longVacant)],
    ];
    let fy = y + 20;
    facts.forEach(([l, v]) => {
      pdf.setTextColor(...GRAY);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.text(l, bx + 40, fy);
      pdf.setTextColor(...DARK);
      pdf.setFont("helvetica", "bold");
      pdf.text(v, bx + colW - 5, fy, { align: "right" });
      fy += 6;
    });

    pdf.setFillColor(...LIGHT_BG);
    pdf.roundedRect(bx + 5, y + 48, colW - 10, 14, 2, 2, "F");
    pdf.setTextColor(...DARK);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.text(
      score >= 75
        ? "Your beds are in great shape. Vacancy is low."
        : "Some beds need attention. Check pricing/listing.",
      bx + 8,
      y + 55,
      { maxWidth: colW - 16 },
    );

    pdf.setTextColor(...GRAY);
    pdf.setFontSize(7);
    pdf.text("Vacancy Pressure", bx + 5, y + 68);
    pdf.setTextColor(...DARK);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${vacancyPressure}%`, bx + colW - 8, y + 68, { align: "right" });
    pdf.setFillColor(230, 228, 250);
    pdf.roundedRect(bx + 5, y + 70, colW - 10, 2.5, 1, 1, "F");
    pdf.setFillColor(
      ...(vacancyPressure > 60
        ? RED_TXT
        : vacancyPressure > 30
          ? AMBER
          : GREEN),
    );
    pdf.roundedRect(
      bx + 5,
      y + 70,
      (colW - 10) * (vacancyPressure / 100),
      2.5,
      1,
      1,
      "F",
    );

    /* ── Property Summary ── */
    y += rowH + 8;
    pdf.setTextColor(...DARK);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(`PROPERTY SUMMARY (Total PGs: ${stats.totalPgs ?? 0})`, 15, y);
    y += 6;

    const psBoxW = (W - 30 - 3 * 4) / 4;
    [
      ["Total Floors", stats.totalFloors ?? 0],
      ["Total Rooms", stats.totalRooms ?? 0],
      ["Available Beds", stats.availableBeds ?? 0],
      ["Occupied Beds", stats.occupiedBeds ?? 0],
    ].forEach(([l, v], i) => {
      const bx2 = 15 + i * (psBoxW + 4);
      pdf.setFillColor(...LIGHT_BG);
      pdf.roundedRect(bx2, y, psBoxW, 16, 2, 2, "F");
      pdf.setTextColor(...GRAY);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.5);
      pdf.text(l.toUpperCase(), bx2 + psBoxW / 2, y + 6, { align: "center" });
      pdf.setTextColor(...PURPLE);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(String(v), bx2 + psBoxW / 2, y + 13, { align: "center" });
    });
    y += 22;

    // legend row above the chart
    const legendItems = [
      ["Floor", [123, 116, 240]],
      ["Occupied PG", [79, 70, 229]],
      ["Available PG", [199, 194, 246]],
    ];
    let lx = 15;
    legendItems.forEach(([label, color]) => {
      pdf.setFillColor(...color);
      pdf.rect(lx, y - 3, 2.5, 2.5, "F");
      pdf.setTextColor(...GRAY);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6);
      pdf.text(label, lx + 4, y - 1);
      lx += pdf.getTextWidth(label) + 12;
    });

    y += 6;

    // bar chart (left) + donut (right)
    const barChartW = colW,
      barData = [
        ["Floors", stats.totalFloors ?? 0, [123, 116, 240]],
        ["Rooms", stats.totalRooms ?? 0, [79, 70, 229]],
        ["Occupied", stats.occupiedBeds ?? 0, [165, 160, 238]],
        ["Free", stats.availableBeds ?? 0, [199, 194, 246]],
      ];
    const maxBar = Math.max(...barData.map((b) => b[1]), 1);
    const chartH = 34;
    // round max up to a clean scale (e.g. nearest 4) for axis labels
    const axisMax = Math.max(4, Math.ceil(maxBar / 4) * 4);
    const axisSteps = 4;

    // y-axis gridlines + labels
    for (let s = 0; s <= axisSteps; s++) {
      const val = Math.round((axisMax / axisSteps) * s);
      const gy = y + chartH - (val / axisMax) * chartH;
      pdf.setDrawColor(240, 240, 245);
      pdf.setLineWidth(0.2);
      pdf.line(22, gy, 15 + barChartW, gy);
      pdf.setTextColor(...GRAY);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(5.5);
      pdf.text(String(val), 20, gy + 1, { align: "right" });
    }

    const barW = 14,
      barGap = (barChartW - 8 - barData.length * barW) / (barData.length + 1);
    barData.forEach(([label, val, color], i) => {
      const bx3 = 22 + barGap + i * (barW + barGap);
      const bh = (val / axisMax) * chartH;
      pdf.setFillColor(...color);
      pdf.roundedRect(bx3, y + chartH - bh, barW, bh, 1, 1, "F");
      pdf.setTextColor(...DARK);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.text(String(val), bx3 + barW / 2, y + chartH - bh - 2, {
        align: "center",
      });
      pdf.setTextColor(...GRAY);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.text(label, bx3 + barW / 2, y + chartH + 6, { align: "center" });
    });
    // donut (Total Beds) drawn as arc
    const dCx = bx + colW / 2,
      dCy = y + 20;
    const occRatio = totalBeds > 0 ? occ / totalBeds : 0;
    pdf.setDrawColor(232, 231, 253);
    pdf.setLineWidth(5);
    pdf.circle(dCx, dCy, 15, "S");
    drawArc(dCx, dCy, 15, -90, -90 + occRatio * 360, [79, 70, 229], 5);
    pdf.setTextColor(...DARK);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(String(totalBeds), dCx, dCy + 1, { align: "center" });
    pdf.setTextColor(...GRAY);
    pdf.setFontSize(6);
    pdf.text("beds", dCx, dCy + 5, { align: "center" });

    pdf.setFillColor(79, 70, 229);
    pdf.circle(bx + 6, y + 41.3, 1, "F");
    pdf.setTextColor(...GRAY);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.text("Occupied Beds", bx + 9, y + 42);
    pdf.setTextColor(...DARK);
    pdf.setFont("helvetica", "bold");
    pdf.text(String(occ), bx + colW - 5, y + 42, { align: "right" });
    pdf.setDrawColor(240, 240, 245);
    pdf.setLineWidth(0.3);
    pdf.line(bx + 5, y + 44, bx + colW - 5, y + 44);

    pdf.setFillColor(232, 231, 253);
    pdf.setDrawColor(200, 198, 245);
    pdf.setLineWidth(0.3);
    pdf.circle(bx + 6, y + 48.3, 1, "FD");
    pdf.setTextColor(...GRAY);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.text("Available Beds", bx + 9, y + 49);
    pdf.setTextColor(...DARK);
    pdf.setFont("helvetica", "bold");
    pdf.text(String(avail), bx + colW - 5, y + 49, { align: "right" });
    pdf.setDrawColor(240, 240, 245);
    pdf.setLineWidth(0.3);
    pdf.line(bx + 5, y + 51, bx + colW - 5, y + 51);

    /* ── Footer bar ── */
    pdf.setFillColor(...PURPLE);
    pdf.rect(0, H - 14, W, 14, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    const websiteW1 = pdf.getTextWidth("www.pgmate.in");
    pdf.textWithLink("www.pgmate.in", 20, H - 6, {
      url: "https://www.pgmate.in",
    });
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.2);
    pdf.line(20, H - 5, 20 + websiteW1, H - 5);

    pdf.setFontSize(6.5);
    pdf.text(
      "Manage rooms, tenants, rent, receipts, bookings, and WhatsApp with ease every day",
      W / 2,
      H - 6,
      { align: "center" },
    );
    pdf.setFontSize(8);

    const supportEmailW1 = pdf.getTextWidth("support.pgmate@gmail.com");
    pdf.textWithLink(
      "support.pgmate@gmail.com",
      W - 20 - supportEmailW1,
      H - 6,
      { url: "mailto:support.pgmate@gmail.com" },
    );
    pdf.line(W - 20 - supportEmailW1, H - 5, W - 20, H - 5);

    /* ── PAGE 2 — Per-PG Breakdown (horizontal cards) ── */
    if (perPgRows.length > 0) {
      pdf.addPage();

      pdf.addImage(logoData, "PNG", 15, 10, 18, 18);
      pdf.setTextColor(...DARK);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.text("PER-PG BREAKDOWN", W / 2, 18, { align: "center" });
      pdf.setTextColor(...GRAY);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text("Individual property performance", W / 2, 24, { align: "center" });
      pdf.setDrawColor(...PURPLE);
      pdf.setLineWidth(0.6);
      pdf.line(15, 28, W - 15, 28);

      let py = 34;
      const cardH = 32,
        cardGap = 5,
        cardW = W - 30;

      const INDIGO = [79, 70, 229]; // matches app's #4F46E5 (Total PGs icon / banner)
      const INDIGO_BG = [238, 242, 255]; // matches app's #EEF2FF icon backgrounds
      const GREEN_BG = [220, 252, 231]; // matches app's "Excellent" badge bg

      const drawPgCard = (row) => {
        // card container — clean white, soft border, rounder corners like app cards
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(235, 235, 245);
        pdf.roundedRect(15, py, cardW, cardH, 4, 4, "FD");

        // icon badge — rounded square, matches Overview card icon style
        pdf.setFillColor(...INDIGO_BG);
        pdf.roundedRect(20, py + 5, 9, 9, 2.5, 2.5, "F");
        pdf.setDrawColor(...INDIGO);
        pdf.setFillColor(...INDIGO);
        pdf.setLineWidth(0.4);
        pdf.rect(23, py + 7.3, 3.3, 4.8, "S");
        pdf.rect(23.6, py + 8, 0.7, 0.7, "F");
        pdf.rect(25, py + 8, 0.7, 0.7, "F");
        pdf.rect(23.6, py + 9.4, 0.7, 0.7, "F");

        // PG name
        pdf.setTextColor(...DARK);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.text(row.name, 33, py + 10.5, { maxWidth: cardW - 55 });

        // occupancy badge — fully rounded pill, like "Excellent" badge in Bed Health card
        const isGood = row.occupancyPercent >= 75;
        const isOk = row.occupancyPercent >= 40 && row.occupancyPercent < 75;
        const badgeBg = isGood ? GREEN_BG : isOk ? AMBER_BG : RED_BG;
        const badgeTxt = isGood ? GREEN : isOk ? AMBER : RED_TXT;
        const badgeLabel = isGood
          ? "Excellent"
          : isOk
            ? "Moderate"
            : "Low Occupancy";
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        const badgeW = pdf.getTextWidth(badgeLabel) + 8;
        const badgeX = 15 + cardW - badgeW - 6;
        pdf.setFillColor(...badgeBg);
        pdf.roundedRect(badgeX, py + 5, badgeW, 7, 3.5, 3.5, "F");
        pdf.setTextColor(...badgeTxt);
        pdf.text(badgeLabel, badgeX + badgeW / 2, py + 9.5, { align: "center" });

        // divider line
        pdf.setDrawColor(240, 240, 245);
        pdf.setLineWidth(0.3);
        pdf.line(20, py + 16, 15 + cardW - 6, py + 16);

        // property stats row
        const statItems = [
          ["Floors", row.floors],
          ["Rooms", row.rooms],
          ["Beds", row.beds],
          ["Occupied", row.occupied],
          ["Available", row.available],
        ];
        const statColW = (cardW - 12) / statItems.length;
        statItems.forEach(([label, val], i) => {
          const sx = 20 + i * statColW;
          pdf.setTextColor(...GRAY);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(6);
          pdf.text(label.toUpperCase(), sx, py + 21);
          pdf.setTextColor(...INDIGO);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(10);
          pdf.text(String(val), sx, py + 27);
        });

        // revenue pills row — fully rounded, matching app pill style
        const revItems = [
          ["Collected", row.collected, INDIGO_BG, INDIGO],
          ["Pending", row.pending, AMBER_BG, AMBER],
          ["Overdue", row.overdue, RED_BG, RED_TXT],
        ];
        const pillW = (cardW - 12 - 8) / 3;
        revItems.forEach(([label, val, bg, txt], i) => {
          const px = 20 + i * (pillW + 4);
          pdf.setFillColor(...bg);
          pdf.roundedRect(px, py + 29, pillW, 6, 3, 3, "F");
          pdf.setTextColor(...txt);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(6.5);
          pdf.text(`${label}: ${rs(val)}`, px + pillW / 2, py + 33, {
            align: "center",
          });
        });

        py += cardH + cardGap;
      };

      const drawFooter = () => {
        pdf.setFillColor(...PURPLE);
        pdf.rect(0, H - 14, W, 14, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);

        const websiteW2 = pdf.getTextWidth("www.pgmate.in");
        pdf.textWithLink("www.pgmate.in", 20, H - 6, {
          url: "https://www.pgmate.in",
        });
        pdf.setDrawColor(255, 255, 255);
        pdf.setLineWidth(0.2);
        pdf.line(20, H - 5, 20 + websiteW2, H - 5);

        pdf.setFontSize(6.5);
        pdf.text(
          "Manage rooms, tenants, rent, receipts, bookings, and WhatsApp with ease every day",
          W / 2,
          H - 6,
          { align: "center" },
        );
        pdf.setFontSize(8);

        const supportEmailW2 = pdf.getTextWidth("support.pgmate@gmail.com");
        pdf.textWithLink(
          "support.pgmate@gmail.com",
          W - 20 - supportEmailW2,
          H - 6,
          { url: "mailto:support.pgmate@gmail.com" },
        );
        pdf.line(W - 20 - supportEmailW2, H - 5, W - 20, H - 5);
      };

      const CARDS_PER_PAGE = 6;
      perPgRows.forEach((row, idx) => {
        if (idx > 0 && idx % CARDS_PER_PAGE === 0) {
          drawFooter();
          pdf.addPage();
          py = 20;
        }
        drawPgCard(row);
      });

      // ── About + Thank you row (before footer) — only on the very last page ──
      const infoBoxH = 18;
      if (py + infoBoxH + 8 > H - 18) {
        drawFooter();
        pdf.addPage();
        py = 20;
      }

      pdf.setDrawColor(...PURPLE);
      pdf.setLineWidth(0.4);
      pdf.line(15, py, W - 15, py);
      py += 6;

      const infoColW = (cardW - 6) / 2;
      const infoBx = 15 + infoColW + 6;

      pdf.setFillColor(...LIGHT_BG);
      pdf.roundedRect(15, py, infoColW, infoBoxH, 3, 3, "F");
      pdf.setTextColor(...PURPLE);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.text("ABOUT PGMATE", 20, py + 6);
      pdf.setTextColor(...GRAY);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6);
      pdf.text(
        "PGMate helps you manage your PG & Co-Living operations effortlessly.",
        20,
        py + 11,
        { maxWidth: infoColW - 10, lineHeightFactor: 1.3 },
      );

      pdf.setFillColor(...LIGHT_BG);
      pdf.roundedRect(infoBx, py, infoColW, infoBoxH, 3, 3, "F");
      pdf.setTextColor(...PURPLE);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.text("Thank you for using PGMate!", infoBx + 5, py + 7);
      pdf.setTextColor(...GRAY);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6);
      pdf.text(
        `Generated on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
        infoBx + 5,
        py + 13,
      );

      py += infoBoxH + 4;

      drawFooter();
    }

    pdf.save("OwnerDashboard.pdf");
    setShowExport(false);
  };

  const exportExcel = () => {
    if (!stats) return;
    setShowExport(false);
    const data = [
      ["Owner Dashboard Report"],
      [],
      ["Metric", "Value"],
      ["Total PGs", stats.totalPgs ?? 0],
      ["Total Beds", stats.totalBeds ?? 0],
      ["Available Beds", stats.availableBeds ?? 0],
      ["Total Floors", stats.totalFloors ?? 0],
      ["Total Rooms", stats.totalRooms ?? 0],
      ["Occupied Beds", stats.occupiedBeds ?? 0],
      ["Total Tenants", stats.totalTenants ?? 0],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [{ wch: 40 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dashboard");
    XLSX.writeFile(wb, "OwnerDashboard.xlsx");
  };
  // const exportWord = () => {
  //   if (!stats) return;
  //   const html = `<html><body style="font-family:Calibri;padding:40px"><h2>Owner Dashboard Report</h2>
  //     <table border="1" cellpadding="10" cellspacing="0" width="100%">
  //       <tr><th>Metric</th><th>Value</th></tr>
  //       <tr><td>Total PGs</td><td>${stats.totalPgs ?? 0}</td></tr>
  //       <tr><td>Total Beds</td><td>${stats.totalBeds ?? 0}</td></tr>
  //       <tr><td>Available Beds</td><td>${stats.availableBeds ?? 0}</td></tr>
  //       <tr><td>Total Floors</td><td>${stats.totalFloors ?? 0}</td></tr>
  //       <tr><td>Total Rooms</td><td>${stats.totalRooms ?? 0}</td></tr>
  //       <tr><td>Occupied Beds</td><td>${stats.occupiedBeds ?? 0}</td></tr>
  //       <tr><td>Total Tenants</td><td>${stats.totalTenants ?? 0}</td></tr>
  //     </table></body></html>`;
  //   saveAs(new Blob(["\ufeff", html], { type: "application/msword" }), "OwnerDashboard.doc"); setShowExport(false);
  // };

  const handleCta = () => {
    setOnboardingMode(null);
    if (onboardingMode === "pg")
      navigate(`${apiPrefix}/pgs`, { state: { openCreate: true } });
    else if (onboardingMode === "room") navigate(`${apiPrefix}/rooms`);
    else if (onboardingMode === "bed") navigate(`${apiPrefix}/available-beds`);
  };
  const handleSkip = () => setOnboardingMode(null);
  const handleCompleteProfile = () => navigate("/owner/dashboard/profile");
  // ✅ single gate: expired owner -> pricing page, no matter which action
  const navTo = (path) =>
    subscriptionExpired
      ? navigate("/owner/pricing")
      : navigate(`${apiPrefix}/${path}`);
  const goTo = (path, opts) =>
    subscriptionExpired ? navigate("/owner/pricing") : navigate(path, opts);

  const pgBarData = stats
    ? [
      { name: "Floors", value: stats.totalFloors ?? 0, fill: "#7B74F0" },
      { name: "Rooms", value: stats.totalRooms ?? 0, fill: "#4F46E5" },
      { name: "Occupied", value: stats.occupiedBeds ?? 0, fill: "#a5a0ee" },
      { name: "Vacant", value: stats.availableBeds ?? 0, fill: "#c7c2f6" },
    ]
    : [];

  const occupied = stats?.occupiedBeds ?? 0;
  const available = stats?.availableBeds ?? 0;
  const total = stats?.totalBeds ?? 0;
  const donutData =
    total > 0
      ? [
        { value: occupied, fill: "#4F46E5" },
        { value: available, fill: "#e8e7fd" },
      ]
      : [{ value: 1, fill: "#e8e7fd" }];

  const [ownerLangOpen, setOwnerLangOpen] = useState(false);
  const ownerLangRef = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (ownerLangRef.current && !ownerLangRef.current.contains(e.target))
        setOwnerLangOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ─── Overview cards data ─────────────────────────────────── */

  const overviewCards = [
    {
      label: "Total PGs",
      value: stats ? animTotalPgs : "—",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 16 16"
          fill="none"
          stroke="#4F46E5"
          strokeWidth="1.3"
        >
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
      onClick: () => navTo("pgs"),
    },
    {
      label: "Total Beds",
      value: stats ? animTotalBeds : "—",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 16 16"
          fill="currentColor"
          style={{ color: "#22C55E" }}
        >
          <path d="M2 1.5a.5.5 0 0 0-1 0V14a.5.5 0 0 0 1 0v-2h12v2a.5.5 0 0 0 1 0V8a2 2 0 0 0-1-1.732V5.5A2.5 2.5 0 0 0 11.5 3h-7A2.5 2.5 0 0 0 2 5.5v.768A2 2 0 0 0 1 8v.5h1zm1 4V5.5A1.5 1.5 0 0 1 4.5 4h7A1.5 1.5 0 0 1 13 5.5v.5H3zm-1 3V8a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v.5z" />
        </svg>
      ),
      iconBg: "#DCFCE7",
      onClick: () => navTo("available-beds"),
    },
    {
      label: "Total Tenants",
      value: stats ? animTotalTenants : "—",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 16 16"
          fill="none"
          stroke="#F97316"
          strokeWidth="1.3"
        >
          <circle cx="6.5" cy="5" r="2.5" />
          <path d="M1.5 14c0-3 2.3-5 5-5s5 2 5 5" />
          <line x1="13" y1="5" x2="13" y2="9" />
          <line x1="11" y1="7" x2="15" y2="7" />
        </svg>
      ),
      iconBg: "#FFF7ED",
      onClick: () => navTo("residents"),
    },
    {
      label: "Revenue (This Month)",
      value: stats ? fmtINR(stats.revenueCollected ?? 0) : "—",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 16 16"
          fill="currentColor"
          style={{ color: "#7B74F0" }}
        >
          <path d="M4 2a.5.5 0 0 0 0 1h1.05a3.5 3.5 0 0 1 3.4 2.5H4a.5.5 0 0 0 0 1h4.567a3.5 3.5 0 0 1-3.517 2.5H4a.5.5 0 0 0-.354.854l5 5a.5.5 0 0 0 .708-.708L5.426 10.04A4.5 4.5 0 0 0 9.583 6.5H11a.5.5 0 0 0 0-1H9.583A4.5 4.5 0 0 0 8.96 3H11a.5.5 0 0 0 0-1H4z" />
        </svg>
      ),
      iconBg: "#EEF2FF",
      onClick: () => navTo("ownerRevenue"),
    },
  ];

  return (
    <>
      <DashboardLayout
        title={
          apiPrefix === "/manager" ? "Manager Dashboard" : "Owner Dashboard"
        }
        subtitle="Manage your PG operations"
        rightAction={
          <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
            <div className="export-wrapper" ref={exportRef}>
              <button
                className="export-btn-modern"
                onClick={() => setShowExport(!showExport)}
              >
                <span className="export-icon">⬇</span>
              </button>
              {showExport && (
                <div className="export-dropdown-modern">
                  <button onClick={exportPDF}>Export as PDF</button>
                  {/* <button onClick={exportWord}>Export as Word</button> */}
                  <button onClick={exportExcel}>Export as Excel</button>
                </div>
              )}
            </div>
          </div>
        }
      >
        {/* ── Welcome Banner ── */}
        <div className="dashboard-welcome">
          <div className="welcome-text">
            <h2>
              Welcome back , <span className="welcome-name">{ownerName}</span>
            </h2>
            <p className="welcome-subtitle">
              Here's what's happening in your PG today
            </p>
          </div>
          <div className="welcome-app-cta">
            <div className="app-cta-header">
              <div className="app-icon">
                <FaMobileAlt />
              </div>
              <p className="app-cta-text">Get PGMate App</p>
            </div>
            <button
              className="app-cta-btn"
              onClick={() => (window.location.href = getApkDownloadUrl())}
            >
              <FaDownload />
              <span className="app-cta-btn-text">Download APK</span>
            </button>
          </div>
        </div>

        {onboardingMode && (
          <OnboardingGuide
            mode={onboardingMode}
            onCta={handleCta}
            onSkip={handleSkip}
          />
        )}

        {/* ── Quick Actions — horizontal strip below welcome banner ── */}
        <div className="dash-quick-col">
          <div className="dash-quick-header">
            <h4>Quick Action</h4>
            <span>| Run your PG faster</span>
          </div>
          <div
            className={`dash-quick-row ${subscriptionExpired ? "dash-quick-row-disabled" : ""}`}
          >
            <button
              className="dash-quick-btn qb-indigo"
              onClick={() =>
                goTo(`${apiPrefix}/pgs`, { state: { openCreate: true } })
              }
            >
              <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="#4F46E5" strokeWidth="1.3">
                <circle cx="8" cy="8" r="6.5" />
                <line x1="8" y1="5" x2="8" y2="11" />
                <line x1="5" y1="8" x2="11" y2="8" />
              </svg>
              <span>Add PG</span>
            </button>
            <button
              className="dash-quick-btn qb-purple"
              onClick={() => navTo("rooms")}
            >
              <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="#8B5CF6" strokeWidth="1.3">
                <path d="M4 1.5h6a1 1 0 0 1 1 1V14H3V2.5a1 1 0 0 1 1-1z" />
                <circle cx="8.7" cy="8" r="0.5" fill="#8B5CF6" />
              </svg>
              <span>Add Room</span>
            </button>
            <button
              className="dash-quick-btn qb-green"
              onClick={() => navTo("available-beds")}
            >
              <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="#22C55E" strokeWidth="1.3">
                <rect x="2" y="2" width="5" height="5" rx="1" />
                <rect x="9" y="2" width="5" height="5" rx="1" />
                <rect x="2" y="9" width="5" height="5" rx="1" />
                <rect x="9" y="9" width="5" height="5" rx="1" />
              </svg>
              <span>Add Bed</span>
            </button>
            <button
              className="dash-quick-btn qb-orange"
              onClick={() => navTo("residents")}
            >
              <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="#F97316" strokeWidth="1.3">
                <circle cx="6" cy="5" r="2.3" />
                <path d="M1.5 14c0-2.8 2-4.7 4.5-4.7s4.5 1.9 4.5 4.7" />
                <line x1="13" y1="4.5" x2="13" y2="8.5" />
                <line x1="11" y1="6.5" x2="15" y2="6.5" />
              </svg>
              <span>Add Resident</span>
            </button>
            {apiPrefix === "/owner" && (
              <button
                className="dash-quick-btn qb-red"
                onClick={() => goTo("/owner/complaints")}
              >
                <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="#EF4444" strokeWidth="1.3">
                  <circle cx="8" cy="8" r="6.5" />
                  <line x1="8" y1="4.5" x2="8" y2="8.7" />
                  <circle cx="8" cy="11.2" r="0.6" fill="#EF4444" stroke="none" />
                </svg>
                <span>Complaints</span>
              </button>
            )}

            <button
              className="dash-quick-btn qb-teal"
              onClick={() => navTo("rent")}
            >
              <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="#0D9488" strokeWidth="1.3">
                <rect x="2" y="3" width="12" height="9" rx="1.2" />
                <line x1="2" y1="6" x2="14" y2="6" />
                <line x1="4.5" y1="9" x2="8" y2="9" />
              </svg>
              <span>Dues</span>
            </button>

            <button
              className="dash-quick-btn qb-slate"
              onClick={() => navTo("checkout-records")}
            >
              <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="#475569" strokeWidth="1.3">
                <path d="M6 2H3.5A1 1 0 0 0 2.5 3v10a1 1 0 0 0 1 1H6" />
                <line x1="6" y1="8" x2="14" y2="8" />
                <path d="M11 5l3 3-3 3" />
              </svg>
              <span>Checkout Records</span>
            </button>

            <button
              className="dash-quick-btn qb-blue"
              onClick={() => navTo("bookings")}
            >
              <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="#2563EB" strokeWidth="1.3">
                <rect x="2" y="3" width="12" height="10.5" rx="1.2" />
                <line x1="2" y1="6.2" x2="14" y2="6.2" />
                <line x1="5" y1="1.5" x2="5" y2="4" />
                <line x1="11" y1="1.5" x2="11" y2="4" />
              </svg>
              <span>Bookings</span>
            </button>

            <button
              className="dash-quick-btn qb-brown"
              onClick={() => navTo("purchase-history")}
            >
              <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="#92400E" strokeWidth="1.3">
                <path d="M1.5 2h1.5l1.4 8.2a1 1 0 0 0 1 .8h5.7a1 1 0 0 0 1-.8l1-5.2H4" />
                <circle cx="6" cy="13.5" r="1" fill="#92400E" stroke="none" />
                <circle cx="11" cy="13.5" r="1" fill="#92400E" stroke="none" />
              </svg>
              <span>Purchase History</span>
            </button>

            <button
              className="dash-quick-btn qb-cyan"
              onClick={() => navTo("enquiries")}
            >
              <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="#0E7490" strokeWidth="1.3">
                <path d="M2 3h12v7H5.5L2 13V3z" />
                <line x1="4.5" y1="6" x2="11.5" y2="6" />
                <line x1="4.5" y1="8.3" x2="9" y2="8.3" />
              </svg>
              <span>Enquiries</span>
            </button>

          </div>
        </div>

        {/* ── Main grid (single column) ── */}
        <div className="dash-main-grid">
          <div className="dash-left">
            {/* ── Overview Section (replaces old KPI cards) ── */}
            <div className="dash-overview-section">
              <div className="dash-overview-header">Overview</div>
              <div
                className={`dash-overview-grid ${subscriptionExpired ? "dash-quick-row-disabled" : ""}`}
              >
                {overviewCards.map((card) => (
                  <div
                    key={card.label}
                    className="dash-overview-card"
                    onClick={card.onClick}
                  >
                    <div
                      className="dash-overview-icon"
                      style={{ background: card.iconBg }}
                    >
                      {card.icon}
                    </div>
                    <div className="dash-overview-label">{card.label}</div>
                    <div className="dash-overview-value">{card.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Charts row */}
            <div className="dash-chart-row">
              <RevenuePulseCard
                stats={stats}
                onNavigate={navTo}
                subscriptionExpired={subscriptionExpired}
              />
              <BedHealthCard
                stats={stats}
                onNavigate={navTo}
                subscriptionExpired={subscriptionExpired}
              />
            </div>

            {/* PG bar section */}
            <div className="dash-pg-section">
              <div className="dash-pg-title">
                Total PG — {stats ? animTotalPgs : "—"}
              </div>

              <div
                className={`dash-stats-strip ${subscriptionExpired ? "dash-quick-row-disabled" : ""}`}
              >
                <div className="dash-stat-box" onClick={() => navTo("pgs")}>
                  <div className="dash-stat-box-label">Total Floors</div>
                  <div className="dash-stat-box-value">
                    {stats ? animFloors : "—"}
                  </div>
                </div>
                <div className="dash-stat-box" onClick={() => navTo("rooms")}>
                  <div className="dash-stat-box-label">Total Rooms</div>
                  <div className="dash-stat-box-value">
                    {stats ? animRooms : "—"}
                  </div>
                </div>
                <div
                  className="dash-stat-box"
                  onClick={() => navTo("available-beds")}
                >
                  <div className="dash-stat-box-label">Available Beds</div>
                  <div className="dash-stat-box-value">
                    {stats ? animAvailableBeds : "—"}
                  </div>
                </div>
              </div>

              <div className="dash-pg-bottom">
                <div>
                  <div className="dash-bar-legend">
                    {[
                      ["#7B74F0", "Floor"],
                      ["#4F46E5", "Occupied PG"],
                      ["#c7c2f6", "Available PG"],
                    ].map(([c, l]) => (
                      <div key={l} className="dash-legend-item">
                        <div
                          className="dash-legend-dot"
                          style={{ background: c }}
                        ></div>{" "}
                        {l}
                      </div>
                    ))}
                  </div>
                  {/* Replace the ResponsiveContainer/BarChart block with this grid */}
                  <div className="dash-stat-grid">
                    {pgBarData.map((item) => (
                      <div
                        key={item.name}
                        className="dash-stat-grid-cell"
                        style={{ "--cell-color": item.fill }}
                      >
                        <div className="dash-stat-grid-dot" />
                        <div className="dash-stat-grid-label">{item.name}</div>
                        <div className="dash-stat-grid-value">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dash-bed-card">
                  <div className="dash-bed-title">Total Beds</div>
                  <div className="dash-pie-wrapper">
                    <PieChart width={120} height={120}>
                      <Pie
                        data={donutData}
                        cx={55}
                        cy={55}
                        innerRadius={38}
                        outerRadius={55}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                      >
                        {donutData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                    <div className="dash-pie-text">
                      <div className="dash-pie-value">
                        {stats ? animTotalBeds : "—"}
                      </div>
                      beds
                    </div>
                  </div>
                  <div className="dash-bed-stats">
                    <div className="dash-bed-stat-row">
                      <span>Occupied Beds</span>
                      <span>{stats ? animOccupiedBeds : "—"}</span>
                    </div>
                    <div className="dash-bed-stat-row">
                      <span>Available Beds</span>
                      <span>{stats ? animAvailableBeds : "—"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* end dash-left */}
        </div>
        {/* end dash-main-grid */}
      </DashboardLayout>

      {apiPrefix === "/owner" && showProfileCompletionPopup && ownerProfile && (
        <ProfileCompletionPopup
          profile={ownerProfile}
          onCompleteNow={handleCompleteProfile}
        />
      )}
    </>
  );
};

export default OwnerDashboard;
