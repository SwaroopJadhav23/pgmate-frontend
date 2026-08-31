import { useEffect, useState, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import pgmateLogo from "../../assets/PGMate.png";
import api from "../../api/axios";
import toast from "react-hot-toast";
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
  CartesianGrid,
  LabelList,
} from "recharts";

import "../../layouts/layout.css";
import "./OwnerDashboard.css";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
import { getApkDownloadUrl } from "../../utils/apk";
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
    if (target == null) return;
    if (target === 0) {
      setValue(0);
      return;
    }
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

const allMonths = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const nowMonth = new Date().getMonth();

/* ─── Revenue Pulse Card — DYNAMIC ─────────────────────────── */
const RevenuePulseCard = ({ stats, onNavigate, subscriptionExpired, timeframe, setTimeframe }) => {

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
  
  const expectedRent = collected + pending + overdue;
  const colRate = expectedRent > 0 ? Math.round((collected / expectedRent) * 100) : 0;

  const totalCollected = timeframe === "MONTH" 
    ? (stats.totalAmountMonth ?? 0) 
    : (stats.totalAmountYear ?? 0);

  const maxPotential = timeframe === "MONTH" 
    ? (stats.maxPotentialRevenue ?? 0)
    : (stats.maxPotentialRevenue ?? 0) * 12;

  const historyYear = Array.isArray(stats.revenueHistory) ? stats.revenueHistory : [];
  const historyMonth = Array.isArray(stats.revenueHistoryMonth) ? stats.revenueHistoryMonth : [];

  let chartData = [];
  if (timeframe === "YEAR") {
    // Always produce exactly 6 monthly buckets (last 6 months) filled with 0
    const BUCKETS = 6;
    const filled = Array(BUCKETS).fill(0);
    historyYear.slice(-BUCKETS).forEach((v, i) => {
      filled[i + Math.max(0, BUCKETS - historyYear.length)] = v;
    });
    chartData = filled.map((v, i) => ({
      label: allMonths[(nowMonth - (BUCKETS - 1 - i) + 12) % 12],
      amount: v,
    }));
  } else {
    // Always produce exactly 4 weekly buckets
    const WEEKS = 4;
    const dailyData = historyMonth.slice(-28); // last 28 days
    const weeklyData = Array.from({ length: WEEKS }, (_, w) => {
      const start = w * 7;
      const end = start + 7;
      const sum = dailyData.slice(start, end).reduce((a, b) => a + b, 0);
      return { label: `Week ${w + 1}`, amount: sum };
    });
    chartData = weeklyData;
  }

  const pctChange =
    historyYear.length >= 2
      ? Math.round(
        ((historyYear[historyYear.length - 1] - historyYear[historyYear.length - 2]) /
          (historyYear[historyYear.length - 2] || 1)) *
        100,
      )
      : null;

  return (
    <div
      className={`dash-chart-card dash-revenue-card ${subscriptionExpired ? "dash-card-disabled" : ""}`}
    >
      <div className="dash-chart-title rev-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div onClick={() => onNavigate("ownerRevenue")} style={{ cursor: "pointer", display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
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
        <div className="rev-timeframe-toggle">
          <button 
            className={`rev-toggle-btn ${timeframe === "MONTH" ? "active" : ""}`} 
            onClick={() => setTimeframe("MONTH")}>
            Month
          </button>
          <button 
            className={`rev-toggle-btn ${timeframe === "YEAR" ? "active" : ""}`} 
            onClick={() => setTimeframe("YEAR")}>
            Year
          </button>
        </div>
      </div>
      <div onClick={() => onNavigate("ownerRevenue")} style={{ cursor: "pointer" }}>
        <div className="rev-big">{fmtINR(maxPotential)}</div>
        <div className="rev-sub">
          {timeframe === "MONTH" ? "Collected This Month (Potential Revenue)" : "Collected This Year (Potential Revenue)"}
        </div>
      </div>
      <div className="rev-sparkline-wrap" onClick={() => onNavigate("ownerRevenue")} style={{ cursor: "pointer" }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 8, left: -20, bottom: 0 }}
              maxBarSize={40}
              barCategoryGap="25%"
            >
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                dy={8}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`
                }
                width={42}
              />
              <Tooltip content={<RevTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
              <Bar
                dataKey="amount"
                fill="#818cf8"
                radius={[5, 5, 0, 0]}
              >
                <LabelList 
                  dataKey="amount" 
                  position="top" 
                  formatter={(v) => v >= 1000 ? `₹${Math.round(v / 1000)}k` : (v > 0 ? `₹${v}` : '')} 
                  style={{ fontSize: '9px', fill: '#64748b', fontWeight: 700 }} 
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="dash-chart-empty-text">No history data yet</div>
        )}
      </div>
      <div className="rev-pills-row" onClick={() => onNavigate("ownerRevenue")} style={{ cursor: "pointer" }}>
        <div className="rev-pill rev-pill-total">
          <span className="rev-pill-label">Total Collected</span>
          <span className="rev-pill-val">{fmtINR(totalCollected)}</span>
        </div>
        <div className="rev-pill rev-pill-pending">
          <span className="rev-pill-label">Pending</span>
          <span className="rev-pill-val">{fmtINR(pending)}</span>
        </div>
        <div className="rev-pill rev-pill-overdue">
          <span className="rev-pill-label">Overdue</span>
          <span className="rev-pill-val">{fmtINR(overdue)}</span>
        </div>
      </div>
      <div onClick={() => onNavigate("ownerRevenue")} style={{ cursor: "pointer" }}>
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

  return (
    <div
      className={`dash-chart-card dash-bh-card ${subscriptionExpired ? "dash-card-disabled" : ""}`}
      onClick={() => onNavigate("available-beds")}
      style={{ cursor: "pointer" }}
    >
      <div className="dash-chart-title bh-header">
        <span className="bh-icon-wrap">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z" stroke="#3B6D11" strokeWidth="1.5" />
            <path d="M8 5v3.5l2.5 1.5" stroke="#3B6D11" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        Bed Health Insights
        <span className={`bh-tag ${gradeClass}`}>{grade}</span>
      </div>

      <div className="bh-main-content">
        <div className="bh-ring-section">
          <div className="bh-ring-wrap">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#F1F5F9" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke={arcColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={animated ? `${(score / 100) * (2 * Math.PI * 38)} ${2 * Math.PI * 38}` : `0 ${2 * Math.PI * 38}`}
                transform="rotate(-90 50 50)"
                className="dash-bh-circle-anim"
              />
            </svg>
            <div className="bh-ring-label">
              <span className="bh-score-num" style={{ color: arcColor }}>{score}</span>
              <span className="bh-score-denom">Health Score</span>
            </div>
          </div>
        </div>

        <div className="bh-facts-grid">
          <div className="bh-fact-box">
            <div className="bh-fact-icon" style={{ color: "#3B82F6", background: "#EFF6FF" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 1v1z"/>
                <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>
              </svg>
            </div>
            <div className="bh-fact-content">
              <div className="bh-fact-label">Turnover</div>
              <div className="bh-fact-val">{turnover > 0 ? `${turnover}%/mo` : "—"}</div>
            </div>
          </div>

          <div className="bh-fact-box">
            <div className="bh-fact-icon" style={{ color: "#8B5CF6", background: "#F5F3FF" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4V.5zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z"/>
              </svg>
            </div>
            <div className="bh-fact-content">
              <div className="bh-fact-label">Avg Vacancy</div>
              <div className="bh-fact-val">{avgVacant > 0 ? `${avgVacant}d` : "—"}</div>
            </div>
          </div>

          <div className="bh-fact-box">
            <div className="bh-fact-icon" style={{ color: "#F59E0B", background: "#FFFBEB" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
              </svg>
            </div>
            <div className="bh-fact-content">
              <div className="bh-fact-label">Long Vacant</div>
              <div className="bh-fact-val">{longVacant} <span className="bh-subtext">(&gt;14d)</span></div>
            </div>
          </div>

          <div className="bh-fact-box">
            <div className="bh-fact-icon" style={{ color: "#10B981", background: "#ECFDF5" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3 2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V2zm6 11a1 1 0 1 0-2 0 1 1 0 0 0 2 0z"/>
              </svg>
            </div>
            <div className="bh-fact-content">
              <div className="bh-fact-label">Occupancy</div>
              <div className="bh-fact-val">{totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className={`bh-tip-box bh-tip-${gradeClass}`}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 11.5v-5" strokeLinecap="round"/>
          <path d="M8 4.5h.01" strokeLinecap="round" strokeWidth="2"/>
          <circle cx="8" cy="8" r="7"/>
        </svg>
        <span>{tip}</span>
      </div>

      <div className="bh-footer">
        <div className="bh-bar-head">
          <span className="bh-bar-label">Vacancy Pressure</span>
          <span className="bh-bar-pct">{vacancyPressure}%</span>
        </div>
        <div className="bh-bar-track">
          <div
            className="bh-bar-fill"
            style={{
              width: `${vacancyPressure}%`,
              background: vacancyPressure > 60 ? "#EF4444" : vacancyPressure > 30 ? "#F59E0B" : "#10B981",
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
  const [pgs, setPgs] = useState([]);
  const [selectedPgId, setSelectedPgId] = useState("ALL");
  const [subSummary, setSubSummary] = useState(null);
  const [revenueTimeframe, setRevenueTimeframe] = useState("MONTH");

  const navigate = useNavigate();
  const { subscriptionExpired } = useContext(AuthContext);
  const exportRef = useRef(null);

  const animTotalPgs = useCountUp(stats?.totalPgs ?? 0);
  const animFloors = useCountUp(stats?.totalFloors ?? 0);
  const animRooms = useCountUp(stats?.totalRooms ?? 0);
  const animTotalBeds = useCountUp(stats?.totalBeds ?? 0);
  const animAvailableBeds = useCountUp(stats?.availableBeds ?? 0);
  const animTotalTenants = useCountUp(stats?.totalTenants ?? 0);

  // ── Notification Pill Logic ───────────────────────────────────
  // These are always read from localStorage so they update correctly
  // whether the component mounts fresh OR was already mounted (SPA nav).
  const unreadEnquiriesCount  = stats?.unreadEnquiries          ?? 0;
  const unreadComplaintsCount = stats?.unreadComplaints         ?? 0;
  const unreadDuesCount       = stats?.tenantsRemainingToPayCount ?? 0;
  const unreadBookingsCount   = stats?.unreadBookings           ?? 0;

  const [seenEnquiriesCount,  setSeenEnquiriesCount]  = useState(-1);
  const [seenComplaintsCount, setSeenComplaintsCount] = useState(-1);
  const [seenDuesCount,       setSeenDuesCount]       = useState(-1);
  const [seenBookingsCount,   setSeenBookingsCount]   = useState(-1);

  const location = useLocation();

  // Re-read seen counts from localStorage every time the user navigates to this page.
  // This ensures that if the user visits Enquiries/Complaints/Dues/Bookings pages
  // (which stamp localStorage on mount), the pill disappears when they return.
  useEffect(() => {
    const read = (key) => parseInt(localStorage.getItem(key) ?? "-1", 10);
    setSeenEnquiriesCount(read("seen_enquiries_count"));
    setSeenComplaintsCount(read("seen_complaints_count"));
    setSeenDuesCount(read("seen_dues_count"));
    setSeenBookingsCount(read("seen_bookings_count"));
  }, [location.pathname]);

  // Seed on first-ever load so existing items don't show as new.
  // Only seeds if the key has never been set (null in localStorage).
  useEffect(() => {
    if (!stats) return;
    const seed = (key, val, setter) => {
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, val.toString());
        setter(val);
      }
    };
    seed("seen_enquiries_count",  unreadEnquiriesCount,  setSeenEnquiriesCount);
    seed("seen_complaints_count", unreadComplaintsCount, setSeenComplaintsCount);
    seed("seen_dues_count",       unreadDuesCount,       setSeenDuesCount);
    seed("seen_bookings_count",   unreadBookingsCount,   setSeenBookingsCount);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats]);

  // Compute new counts (how many arrived since last visit)
  const newEnquiriesCount  = seenEnquiriesCount  < 0 ? 0 : Math.max(0, unreadEnquiriesCount  - seenEnquiriesCount);
  const newComplaintsCount = seenComplaintsCount < 0 ? 0 : Math.max(0, unreadComplaintsCount - seenComplaintsCount);
  const newDuesCount       = seenDuesCount       < 0 ? 0 : Math.max(0, unreadDuesCount       - seenDuesCount);
  const newBookingsCount   = seenBookingsCount   < 0 ? 0 : Math.max(0, unreadBookingsCount   - seenBookingsCount);

  const showEnquiriesBadge  = newEnquiriesCount  > 0;
  const showComplaintsBadge = newComplaintsCount > 0;
  const showDuesBadge       = newDuesCount       > 0;
  const showBookingsBadge   = newBookingsCount   > 0;

  useEffect(() => {
    if (apiPrefix === "/owner") {
      api.get("/owner/pgs")
        .then(res => setPgs(res.data || []))
        .catch(err => console.error("Error fetching PGs", err));
        
      api.get("/owner/subscription/summary")
        .then((res) => setSubSummary(res.data))
        .catch((err) => console.error("Error fetching sub summary", err));
    }

    api
      .get(`${apiPrefix}/dashboard/stats`, { params: { pgId: selectedPgId } })
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
  }, [apiPrefix, selectedPgId]);

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

    /* ── mini bar chart for revenue pulse ── */
    const drawBarChart = (x, y, w, h, data, labels, color) => {
      if (!data || !data.length) {
        pdf.setTextColor(...GRAY);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.text("No history data yet", x + w / 2, y + h / 2, { align: "center" });
        return;
      }
      
      const maxVal = Math.max(...data, 1);
      const yTicks = 5;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6);
      pdf.setTextColor(160, 160, 170);
      pdf.setDrawColor(240, 240, 245);
      pdf.setLineWidth(0.3);
      pdf.setLineDashPattern([1, 1], 0);

      for (let i = 0; i < yTicks; i++) {
        const val = (maxVal * i) / (yTicks - 1);
        const ty = y + h - (h * i) / (yTicks - 1);
        const label = val >= 1000 ? Math.round(val / 1000) + "k" : Math.round(val);
        pdf.text("Rs. " + label, x + 8, ty + 2, { align: "right" });
        pdf.line(x + 10, ty, x + w, ty);
      }
      pdf.setLineDashPattern([], 0); // reset

      // Draw Bars
      const bars = data.length;
      const barSpace = (w - 10) / bars;
      const barW = Math.min(8, barSpace - 2);
      
      for (let i = 0; i < bars; i++) {
        const val = data[i];
        if (val > 0) {
          const barH = Math.max(0.5, (val / maxVal) * h); // Ensure min height
          const bx = x + 10 + i * barSpace + (barSpace - barW) / 2;
          const by = y + h - barH;
          
          const label = val >= 1000 ? Math.round(val / 1000) + "k" : Math.round(val);
          pdf.setTextColor(...DARK);
          pdf.setFont("helvetica", "bold");
          pdf.text("Rs. " + label, bx + barW / 2, by - 1, { align: "center" });
          
          pdf.setFillColor(...color);
          pdf.rect(bx, by, barW, barH, "F");
        }
        
        const bxLabel = x + 10 + i * barSpace + (barSpace - barW) / 2;
        pdf.setTextColor(160, 160, 170);
        pdf.setFont("helvetica", "normal");
        pdf.text(labels[i], bxLabel + barW / 2, y + h + 4, { align: "center" });
      }
    };


    /* ── Header ── */
    pdf.addImage(logoData, "PNG", 15, 12, 22, 14);
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
        label: "Potential Revenue",
        value: rs(stats.maxPotentialRevenue ?? 0),
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
    const rowH = 80; // Decreased height to remove whitespace

    // Revenue card
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(235, 235, 245);
    pdf.roundedRect(15, y, colW, rowH, 3, 3, "FD");
    
    // Title
    pdf.setTextColor(...DARK);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("Revenue pulse", 20, y + 6);

    const collected = revenueTimeframe === "MONTH" ? (stats.revenueCollected ?? 0) : (stats.totalAmountYear ?? 0);
    const pending = stats.revenuePending ?? 0;
    const overdue = stats.revenueOverdue ?? 0;
    const revTotal = collected + pending + overdue;
    const colRate = revTotal > 0 ? Math.round((collected / revTotal) * 100) : 0;
    const history = Array.isArray(stats.revenueHistory) ? stats.revenueHistory : [];
    
    let pdfChartData = [];
    let pdfChartLabels = [];
    
    if (revenueTimeframe === "YEAR") {
      const BUCKETS = 6;
      const filled = Array(BUCKETS).fill(0);
      history.slice(-BUCKETS).forEach((v, i) => {
        filled[i + Math.max(0, BUCKETS - history.length)] = v;
      });
      pdfChartData = filled;
      pdfChartLabels = filled.map((_, i) => allMonths[(nowMonth - (BUCKETS - 1 - i) + 12) % 12]);
    } else {
      const historyMonth = Array.isArray(stats.revenueHistoryMonth) ? stats.revenueHistoryMonth : [];
      const weeklyData = [0, 0, 0, 0];
      for (let i = 0; i < historyMonth.length; i++) {
        if (i < 7) weeklyData[0] += historyMonth[i];
        else if (i < 14) weeklyData[1] += historyMonth[i];
        else if (i < 21) weeklyData[2] += historyMonth[i];
        else weeklyData[3] += historyMonth[i];
      }
      pdfChartData = weeklyData;
      pdfChartLabels = ["Week 1", "Week 2", "Week 3", "Week 4"];
    }

    if (history.length >= 2) {
      const pctChange = Math.round(
        ((history[history.length - 1] - history[history.length - 2]) /
          (history[history.length - 2] || 1)) * 100
      );
      const badgeW = 28, badgeX = 20 + 26;
      pdf.setFillColor(...(pctChange >= 0 ? [220, 252, 231] : [253, 226, 226]));
      pdf.roundedRect(badgeX, y + 2.5, badgeW, 4.5, 1, 1, "F");
      pdf.setTextColor(...(pctChange >= 0 ? GREEN : RED_TXT));
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(5);
      pdf.text(
        `${pctChange >= 0 ? "Up" : "Down"} ${Math.abs(pctChange)}% this ${revenueTimeframe === "YEAR" ? "yr." : "mo."}`,
        badgeX + badgeW / 2,
        y + 5.5,
        { align: "center" }
      );
    }

    // Big Value (Potential Revenue)
    pdf.setTextColor(...DARK);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    const maxPot = revenueTimeframe === "MONTH" ? (stats.maxPotentialRevenue ?? 0) : (stats.maxPotentialRevenue ?? 0) * 12;
    pdf.text(rs(maxPot), 20, y + 14);
    
    pdf.setTextColor(...GRAY);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.text(`Collected This ${revenueTimeframe === "YEAR" ? "Year" : "Month"} (Potential Revenue)`, 20, y + 18);

    // Bar Chart
    drawBarChart(20, y + 22, colW - 10, 22, pdfChartData, pdfChartLabels, [129, 140, 248]);

    // 3 Cards below the chart
    const cardY = y + 51;
    const subCardW = (colW - 14) / 3;
    
    // TOTAL COLLECTED
    pdf.setFillColor(243, 232, 255); // PURPLE_LIGHT
    pdf.roundedRect(20, cardY, subCardW, 13, 1.5, 1.5, "F");
    pdf.setTextColor(99, 91, 255); // PURPLE
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(5.5);
    pdf.text("TOTAL COLLECTED", 20 + 2, cardY + 4.5);
    pdf.setFontSize(9);
    pdf.text(rs(collected), 20 + 2, cardY + 10);

    // PENDING
    pdf.setFillColor(254, 243, 199); // AMBER_LIGHT
    pdf.roundedRect(20 + subCardW + 3, cardY, subCardW, 13, 1.5, 1.5, "F");
    pdf.setTextColor(217, 119, 6); // AMBER
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(5.5);
    pdf.text("PENDING", 20 + subCardW + 4, cardY + 4.5);
    pdf.setFontSize(9);
    pdf.text(rs(pending), 20 + subCardW + 4, cardY + 10);

    // OVERDUE
    pdf.setFillColor(...RED_BG);
    pdf.roundedRect(20 + subCardW * 2 + 6, cardY, subCardW, 13, 1.5, 1.5, "F");
    pdf.setTextColor(...RED_TXT);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(5.5);
    pdf.text("OVERDUE", 20 + subCardW * 2 + 7, cardY + 4.5);
    pdf.setFontSize(9);
    pdf.text(rs(overdue), 20 + subCardW * 2 + 7, cardY + 10);

    // Collection Rate
    const crY = y + 70;
    pdf.setTextColor(...GRAY);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.text("Collection rate", 20, crY);
    pdf.setTextColor(99, 91, 255);
    pdf.text(`${colRate}%`, 20 + colW - 10, crY, { align: "right" });
    
    // Progress Bar
    pdf.setFillColor(230, 228, 250);
    pdf.roundedRect(20, crY + 3, colW - 10, 2, 1, 1, "F");
    pdf.setFillColor(99, 91, 255);
    pdf.roundedRect(20, crY + 3, (colW - 10) * (colRate / 100), 2, 1, 1, "F");

    // Bed Health card
    const bx = 15 + colW + 6;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(235, 235, 245);
    pdf.roundedRect(bx, y, colW, rowH, 3, 3, "FD");
    pdf.setTextColor(...PURPLE);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("BED HEALTH SCORE", bx + 5, y + 6);

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
    pdf.circle(bx + 22, y + 24, 12, "S");
    drawArc(
      bx + 22,
      y + 24,
      12,
      -90,
      -90 + (score / 100) * 360,
      scoreColor,
      2.5,
    );
    pdf.setTextColor(...scoreColor);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(String(score), bx + 22, y + 25, { align: "center" });
    pdf.setTextColor(...GRAY);
    pdf.setFontSize(6);
    pdf.text("/100", bx + 22, y + 29, { align: "center" });

    const facts = [
      ["Avg. days vacant", avgVacant ? `${avgVacant}d` : "—"],
      ["Turnover rate", turnover ? `${turnover}%/mo` : "—"],
      ["Beds due service", String(dueService)],
      ["Long-vacant (>14d)", String(longVacant)],
    ];
    let fy = y + 14;
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
    pdf.roundedRect(bx + 5, y + 42, colW - 10, 14, 2, 2, "F");
    pdf.setTextColor(...DARK);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.text(
      score >= 75
        ? "Your beds are in great shape. Vacancy is low."
        : "Some beds need attention. Check pricing/listing.",
      bx + 8,
      y + 49,
      { maxWidth: colW - 16 },
    );

    pdf.setTextColor(...GRAY);
    pdf.setFontSize(7);
    pdf.text("Vacancy Pressure", bx + 5, y + 64);
    pdf.setTextColor(...DARK);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${vacancyPressure}%`, bx + colW - 8, y + 64, { align: "right" });
    pdf.setFillColor(230, 228, 250);
    pdf.roundedRect(bx + 5, y + 67, colW - 10, 2.5, 1, 1, "F");
    pdf.setFillColor(
      ...(vacancyPressure > 60
        ? RED_TXT
        : vacancyPressure > 30
          ? AMBER
          : GREEN),
    );
    pdf.roundedRect(
      bx + 5,
      y + 67,
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

      pdf.addImage(logoData, "PNG", 15, 12, 22, 14);
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
      const cardH = 29,
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
        pdf.roundedRect(20, py + 3, 8, 8, 2, 2, "F");
        pdf.setDrawColor(...INDIGO);
        pdf.setFillColor(...INDIGO);
        pdf.setLineWidth(0.4);
        pdf.rect(22.7, py + 4.8, 2.8, 4, "S");
        pdf.rect(23.2, py + 5.4, 0.5, 0.5, "F");
        pdf.rect(24.3, py + 5.4, 0.5, 0.5, "F");
        pdf.rect(23.2, py + 6.5, 0.5, 0.5, "F");

        // PG name
        pdf.setTextColor(...DARK);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10.5);
        pdf.text(row.name, 31, py + 8.5, { maxWidth: cardW - 55 });

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
        pdf.setFontSize(6.5);
        const badgeW = pdf.getTextWidth(badgeLabel) + 6;
        const badgeX = 15 + cardW - badgeW - 5;
        pdf.setFillColor(...badgeBg);
        pdf.roundedRect(badgeX, py + 3.5, badgeW, 6, 3, 3, "F");
        pdf.setTextColor(...badgeTxt);
        pdf.text(badgeLabel, badgeX + badgeW / 2, py + 7.7, { align: "center" });

        // divider line
        pdf.setDrawColor(240, 240, 245);
        pdf.setLineWidth(0.3);
        pdf.line(20, py + 12.5, 15 + cardW - 6, py + 12.5);

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
          pdf.setFontSize(5.5);
          pdf.text(label.toUpperCase(), sx, py + 16.5);
          pdf.setTextColor(...INDIGO);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(9);
          pdf.text(String(val), sx, py + 21);
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
          pdf.roundedRect(px, py + 22.5, pillW, 5, 2.5, 2.5, "F");
          pdf.setTextColor(...txt);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(6);
          pdf.text(`${label}: ${rs(val)}`, px + pillW / 2, py + 26, {
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
      const targetPy = H - 42; // Anchor exactly above the footer (H - 14 - 4 gap - 18 box - 6 line gap)
      
      if (py > targetPy) {
        drawFooter();
        pdf.addPage();
        py = targetPy;
      } else {
        py = targetPy; // Push down to the bottom
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

  const exportExcel = async () => {
    if (!stats) return;
    try {
      const toastId = toast.loading("Generating Excel Export...");
      const response = await api.get("/owner/dashboard/export-excel", {
        params: { ownerName: ownerName, pgId: selectedPgId },
        responseType: "blob" // Crucial for receiving binary data
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Owner_Dashboard_${selectedPgId !== 'ALL' ? selectedPgId + '_' : ''}${new Date().toISOString().slice(0,10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export downloaded successfully!", { id: toastId });
    } catch (error) {
      toast.error("Failed to export Excel data.");
    }
    setShowExport(false);
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
  const occupied = stats?.occupiedBeds ?? 0;
  const available = stats?.availableBeds ?? 0;
  const total = stats?.totalBeds ?? 0;

  const donutData =
    total > 0
      ? [
        { name: "Occupied Beds", value: occupied, fill: "#4F46E5" },
        { name: "Available Beds", value: available, fill: "#e0e7ff" },
      ]
      : [{ name: "No Data", value: 1, fill: "#e8e7fd" }];

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
      label: "Potential Revenue",
      value: stats ? fmtINR(stats.maxPotentialRevenue ?? 0) : "—",
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
            {pgs.length > 0 && (
              <select
                className="dashboard-global-filter"
                value={selectedPgId}
                onChange={(e) => setSelectedPgId(e.target.value)}
              >
                <option value="ALL">All PGs</option>
                {pgs.map((pg) => (
                  <option key={pg.id} value={pg.id}>
                    {pg.name}
                  </option>
                ))}
              </select>
            )}
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

       {onboardingMode && !subscriptionExpired && (
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
              style={subSummary?.pgLimit >= 0 && subSummary?.pgUsed >= subSummary?.pgLimit ? { opacity: 0.6 } : {}}
              onClick={() => {
                if (subSummary?.pgLimit >= 0 && subSummary?.pgUsed >= subSummary?.pgLimit) {
                  toast.error("Upgrade plan to add more PGs");
                  return;
                }
                goTo(`${apiPrefix}/pgs`, { state: { openCreate: true } });
              }}
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
                onClick={() => {
                  localStorage.setItem("seen_complaints_count", unreadComplaintsCount.toString());
                  setSeenComplaintsCount(unreadComplaintsCount);
                  goTo("/owner/complaints");
                }}
              >
                {showComplaintsBadge && (
                  <div className="dash-quick-badge">
                    {newComplaintsCount > 99 ? '99+' : newComplaintsCount}
                  </div>
                )}
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
              onClick={() => {
                localStorage.setItem("seen_dues_count", unreadDuesCount.toString());
                setSeenDuesCount(unreadDuesCount);
                navTo("rent");
              }}
            >
              {showDuesBadge && (
                <div className="dash-quick-badge">
                  {newDuesCount > 99 ? '99+' : newDuesCount}
                </div>
              )}
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
              onClick={() => {
                localStorage.setItem("seen_bookings_count", unreadBookingsCount.toString());
                setSeenBookingsCount(unreadBookingsCount);
                navTo("bookings");
              }}
            >
              {showBookingsBadge && (
                <div className="dash-quick-badge">
                  {newBookingsCount > 99 ? '99+' : newBookingsCount}
                </div>
              )}
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
              onClick={() => {
                localStorage.setItem("seen_enquiries_count", unreadEnquiriesCount.toString());
                setSeenEnquiriesCount(unreadEnquiriesCount);
                navTo("enquiries");
              }}
            >
              {showEnquiriesBadge && (
                <div className="dash-quick-badge">
                  {newEnquiriesCount > 99 ? '99+' : newEnquiriesCount}
                </div>
              )}
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
                timeframe={revenueTimeframe}
                setTimeframe={setRevenueTimeframe}
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
                <div className="dash-stat-box">
                  <div className="dash-stat-box-label">Total Beds</div>
                  <div className="dash-stat-box-value">
                    {stats ? animTotalBeds : "—"}
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

              <div className="dash-pg-bottom-layout">
                <div className="dash-pg-breakdown-grid">
                  {stats?.pgStatsList && stats.pgStatsList.length > 0 ? (
                    stats.pgStatsList.map((pgStat, idx) => (
                      <div key={idx} className="dash-pg-stat-card">
                        <div className="dash-pg-stat-card-title">{pgStat.pgName}</div>
                        <div className="dash-pg-stat-row">
                          <span>Floors</span>
                          <strong>{pgStat.totalFloors}</strong>
                        </div>
                        <div className="dash-pg-stat-row">
                          <span>Rooms</span>
                          <strong>{pgStat.totalRooms}</strong>
                        </div>
                        <div className="dash-pg-stat-row">
                          <span>Total Beds</span>
                          <strong>{pgStat.totalBeds}</strong>
                        </div>
                        <div className="dash-pg-stat-row">
                          <span>Occupied</span>
                          <strong>{pgStat.occupiedBeds}</strong>
                        </div>
                        <div className="dash-pg-stat-row">
                          <span>Available</span>
                          <strong>{pgStat.availableBeds}</strong>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="dash-pg-stat-card">
                          <div className="skeleton-box" style={{ height: "18px", width: "50%", marginBottom: "12px" }}></div>
                          <div className="dash-pg-stat-row">
                            <div className="skeleton-box" style={{ height: "12px", width: "40%" }}></div>
                            <div className="skeleton-box" style={{ height: "12px", width: "10%" }}></div>
                          </div>
                          <div className="dash-pg-stat-row">
                            <div className="skeleton-box" style={{ height: "12px", width: "35%" }}></div>
                            <div className="skeleton-box" style={{ height: "12px", width: "15%" }}></div>
                          </div>
                          <div className="dash-pg-stat-row">
                            <div className="skeleton-box" style={{ height: "12px", width: "45%" }}></div>
                            <div className="skeleton-box" style={{ height: "12px", width: "10%" }}></div>
                          </div>
                          <div className="dash-pg-stat-row">
                            <div className="skeleton-box" style={{ height: "12px", width: "40%" }}></div>
                            <div className="skeleton-box" style={{ height: "12px", width: "12%" }}></div>
                          </div>
                          <div className="dash-pg-stat-row">
                            <div className="skeleton-box" style={{ height: "12px", width: "35%" }}></div>
                            <div className="skeleton-box" style={{ height: "12px", width: "10%" }}></div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div className="dash-bed-card">
                  <div className="dash-bed-title">TOTAL BEDS</div>
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
                      <span>{occupied}</span>
                    </div>
                    <div className="dash-bed-stat-row">
                      <span>Available Beds</span>
                      <span>{available}</span>
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