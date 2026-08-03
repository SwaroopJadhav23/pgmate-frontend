import { FaCalendarAlt } from "react-icons/fa";
import { useEffect, useMemo, useState, useCallback ,  useRef} from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  LabelList,
} from "recharts";
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  format,
  isWithinInterval,
    parse   
} from "date-fns";
import "./AdminRevenue.css";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

/* ================= COUNT UP HOOK ================= */

const useCountUp = (value, duration = 800) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = value / (duration / 16);

    const counter = setInterval(() => {
      start += increment;

      if (start >= value) {
        setDisplay(value);
        clearInterval(counter);
      } else {
        setDisplay(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(counter);
  }, [value, duration]);

  return display;
};

const AdminRevenue = () => {
  const navigate = useNavigate();
  const [showExport, setShowExport] = useState(false);

  const [reservations, setReservations] = useState([]);
  const [ownerEnquiries, setOwnerEnquiries] = useState([]);
  const [filter, setFilter] = useState("MONTH");
 

  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
const [endDate, setEndDate] = useState(null);
const [showCalendar, setShowCalendar] = useState(false);
const calendarRef = useRef(null);
const [subscriptions, setSubscriptions] = useState([]);
const isMobile = window.innerWidth < 768;

const loadData = useCallback(async () => {
  try {

    const from = startDate ? format(startDate, "yyyy-MM-dd") : "";
    const to = endDate ? format(endDate, "yyyy-MM-dd") : "";

    const [resRes, enqRes, subRes] = await Promise.all([
      api.get("/admin/reservations"),
      api.get("/admin/enquiries"),
      api.get(`/admin/subscriptions?fromDate=${from}&toDate=${to}`)
    ]);

    setReservations(resRes.data || []);
    setOwnerEnquiries(enqRes.data || []);
    setSubscriptions(subRes.data || []);

  } catch (err) {
    console.error("Admin revenue error:", err);
  } finally {
    setLoading(false);
  }
}, [startDate, endDate]);

useEffect(() => {
  loadData();
}, [loadData]);
  /* ================= DATE RANGE ================= */

  const fromDate = useMemo(() => {
    const now = new Date();

    if (filter === "DAY") return startOfDay(now);
    if (filter === "WEEK") return startOfWeek(now, { weekStartsOn: 1 });
    if (filter === "MONTH") return startOfMonth(now);
if (filter === "YEAR")
  return new Date(now.getFullYear(), 0, 1);
    return startOfMonth(now);
}, [filter]);

  const toDate = (value) => (value ? new Date(value) : null);
const isDateInFilter = useCallback(
  (date) => {

    if (!date) return false;

    const today = new Date();

    if (startDate && endDate) {
      return isWithinInterval(date, {
        start: startDate,
        end: endDate
      });
    }

    return isWithinInterval(date, {
      start: fromDate,
      end: today
    });

  },
  [fromDate, startDate, endDate]
);

  /* ================= FILTERED RESERVATIONS ================= */

 const dateFilteredReservations = useMemo(() => {
  return reservations.filter((r) => {
    const reservationDate = toDate(r.reservationDate || r.createdAt);
    return isDateInFilter(reservationDate);
  });
}, [reservations, isDateInFilter]);

const dateFilteredEnquiries = useMemo(() => {
  return ownerEnquiries.filter((e) => {
    if (!e.createdAt) return false;

    const enquiryDate = parse(
      e.createdAt,
      "dd-MM-yyyy HH:mm:ss",
      new Date()
    );

    return isDateInFilter(enquiryDate);
  });
}, [ownerEnquiries, isDateInFilter]);

const dateFilteredSubscriptions = useMemo(() => {
  return subscriptions.filter((s) => {

const subDate = toDate(s.lastRenewedAt || s.startDate);

    if (!subDate) return false;

    return isDateInFilter(subDate);

  });
}, [subscriptions, isDateInFilter]);

const filteredSubscriptionRevenue = dateFilteredSubscriptions.reduce(
  (sum, s) => sum + Number(s.amountPaid || 0),
  0
);

const filteredActiveSubscriptions = dateFilteredSubscriptions.filter(
  s => s.active === true
).length;
  /* ================= KPI CALCULATIONS ================= */

const totalRevenue = dateFilteredReservations.reduce(
  (sum, r) => sum + Number(r.reservationAmount || 0),
  0
);

const totalActiveReservations = dateFilteredReservations.filter(
  r => r.status === "ACTIVE"
).length;
const totalReservations = dateFilteredReservations.length;

  /* ================= CHART DATA ================= */

const chartData = useMemo(() => {

  const map = {};

  // Reservation revenue
  dateFilteredReservations.forEach((r) => {

    const dateObj = toDate(r.reservationDate || r.createdAt);
    if (!dateObj) return;

    const key = format(dateObj, "yyyy-MM-dd");

    if (!map[key]) {
      map[key] = {
        date: key,
        label: format(dateObj, "dd MMM"),
        reservation: 0,
        subscription: 0
      };
    }

    map[key].reservation += Number(r.reservationAmount || 0);
  });

  // Subscription revenue
  dateFilteredSubscriptions.forEach((s) => {

    const dateObj = toDate(s.lastRenewedAt || s.startDate);
    if (!dateObj) return;

    const key = format(dateObj, "yyyy-MM-dd");

    if (!map[key]) {
      map[key] = {
        date: key,
        label: format(dateObj, "dd MMM"),
        reservation: 0,
        subscription: 0
      };
    }

    map[key].subscription += Number(s.amountPaid || 0);
  });

  return Object.values(map)
    .map(item => ({
      ...item,
      total: item.reservation + item.subscription
    }))
   .sort((a, b) => a.date.localeCompare(b.date));

}, [dateFilteredReservations, dateFilteredSubscriptions]);
  /* ================= ANIMATIONS ================= */

  const animatedRevenue = useCountUp(totalRevenue);
  const animatedActiveReservations = useCountUp(totalActiveReservations);
  const animatedTotalReservations = useCountUp(totalReservations);

const animatedEnquiries = useCountUp(dateFilteredEnquiries.length, 600);

const totalPlatformRevenue =
  totalRevenue + filteredSubscriptionRevenue;
const animatedActiveSubscriptions = useCountUp(filteredActiveSubscriptions);
const animatedSubscriptionRevenue = useCountUp(filteredSubscriptionRevenue);
const animatedPlatformRevenue = useCountUp(totalPlatformRevenue);

  /* ================= COMMON EXPORT DATA ================= */

const getRevenueLabel = () => {

  if (startDate && endDate)
    return `Revenue (${format(startDate,"dd MMM yyyy")} - ${format(endDate,"dd MMM yyyy")})`;
if (filter === "DAY")
  return startDate
    ? `Revenue of ${format(startDate, "dd MMM yyyy")}`
    : "Revenue of Selected Day";

  if (filter === "WEEK")
    return "Revenue of Current Week";

  if (filter === "MONTH")
    return "Revenue of Current Month";

  if (filter === "YEAR")
    return "Revenue of Current Year";

  return "Platform Analytics";
};
const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatCurrencyPDF = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
const formatCompactCurrency = (value) => {
  const amount = Number(value || 0);
  if (amount >= 100000) return `â‚¹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `â‚¹${Math.round(amount / 1000)}k`;
  return `â‚¹${amount}`;
};
const reportRows = [
  {
    label: "Active Reservations",
    value: totalActiveReservations,
    type: "number",
  },
  {
    label: "Total Reservations",
    value: totalReservations,
    type: "number",
  },
  {
    label: "Reservation Revenue",
    value: totalRevenue,
    type: "currency",
  },
{
  label: "Active Subscriptions",
  value: filteredActiveSubscriptions,
},
{
  label: "Subscription Revenue",
  value: filteredSubscriptionRevenue,
},
  {
    label: "Total Platform Revenue",
    value: totalPlatformRevenue,
    type: "currency",
  },
  {
    label: "Owner Enquiries",
    value: dateFilteredEnquiries.length,
    type: "number",
  },
];
  const exportPDF = () => {

  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = pdf.internal.pageSize.getWidth();

  const labelX = 25;
  const valueX = pageWidth - 25; // right margin lock

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text("Platform Analytics Report", labelX, 22);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(13);
  pdf.text(getRevenueLabel(), labelX, 32);

  let y = 50;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("Summary Metrics", labelX, y);

  y += 14;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);

  reportRows.forEach((row) => {

    let formatted;

    if (row.type === "currency")
      formatted = formatCurrencyPDF(row.value);
    else
      formatted = String(row.value);

    /* LEFT COLUMN */
    pdf.text(row.label, labelX, y);

    /* RIGHT COLUMN PERFECT ALIGN */
    pdf.text(formatted, valueX, y, {
      align: "right",
      maxWidth: 60,
    });

    y += 10;
  });

  pdf.save("AdminRevenueAnalytics.pdf");
  setShowExport(false);
};
const exportExcel = () => {

  const data = [
    ["Platform Analytics Report"],
    [getRevenueLabel()],
    [],
    ["Metric", "Value"],
    ...reportRows.map(row => {

      let formatted =
        row.type === "currency"
          ? formatCurrency(row.value)
          : String(row.value);

      return [row.label, formatted];
    }),
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  /* COLUMN WIDTH */
  ws["!cols"] = [
    { wch: 40 },
    { wch: 25 },
  ];

  /* RIGHT ALIGN VALUE COLUMN */
  Object.keys(ws).forEach(cell => {
    if (cell.startsWith("B") && ws[cell]) {
      ws[cell].s = {
        alignment: { horizontal: "right" }
      };
    }
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    ws,
    "Platform Analytics"
  );

  XLSX.writeFile(wb, "AdminRevenueAnalytics.xlsx");

  setShowExport(false);
};
const exportWord = () => {

  const rowsHTML = reportRows.map(row => {

    let formatted =
      row.type === "currency"
        ? formatCurrency(row.value)
        : row.value;

    return `
      <tr>
        <td style="width:65%">${row.label}</td>
        <td style="width:35%; text-align:right">
          ${formatted}
        </td>
      </tr>
    `;
  }).join("");

  const htmlContent = `
  <html>
  <head>
    <meta charset="utf-8"/>
    <style>
      body{
        font-family:Calibri;
        padding:40px;
      }

      table{
        width:100%;
        border-collapse:collapse;
        table-layout:fixed;
      }

      th,td{
        border:1px solid #ccc;
        padding:10px;
      }

      th{
        background:#f3f4f6;
      }
    </style>
  </head>

  <body>

    <h2>Platform Analytics Report</h2>
    <h4>${getRevenueLabel()}</h4>

    <table>
      <tr>
        <th style="width:65%">Metric</th>
        <th style="width:35%;text-align:right">Value</th>
      </tr>

      ${rowsHTML}

    </table>

  </body>
  </html>
  `;

  const blob = new Blob(["\ufeff", htmlContent], {
    type: "application/msword",
  });

  saveAs(blob, "AdminRevenueAnalytics.doc");
  setShowExport(false);
};
useEffect(() => {
  const handleClickOutside = (e) => {
    if (
      calendarRef.current &&
      !calendarRef.current.contains(e.target)
    ) {
      setShowCalendar(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () =>
    document.removeEventListener("mousedown", handleClickOutside);
}, []);

  return (
<DashboardLayout
  title="Platform Analytics"
  subtitle="Reservations & platform revenue"
  rightAction={
    <div className="export-wrapper">
      <button
  className="export-btn-modern"
  onClick={() => setShowExport(!showExport)}
>
  <span className="export-icon">⬇</span>
  <span className="export-label">Export ▾</span>
</button>

      {showExport && (
        <div className="export-dropdown-modern">
          <button onClick={exportPDF}>Export as PDF</button>
          <button onClick={exportWord}>Export as Word</button>
          <button onClick={exportExcel}>Export as Excel</button>
        </div>
      )}
    </div>
  }
>
      {/* EXPORT BUTTON */}

      <div className="admin-revenue-container">
        {loading && <div className="loader">Loading...</div>}

        {!loading && (
          <>
            {/* FILTER */}
           <div className="top-bar">
 
  <div className="filter-row">
    {["DAY", "WEEK", "MONTH", "YEAR"].map((f) => (
      <button
        key={f}
        onClick={() => setFilter(f)}
        className={filter === f ? "active" : ""}
      >
        {f}
      </button>
    ))}
  </div>

 

    {/* ✅ ADD CALENDAR HERE */}
  <div className="calendar-wrapper">

    <button
      className="date-trigger-btn"
      onClick={() => setShowCalendar(!showCalendar)}
    >
    {startDate && endDate
      ? `${format(startDate,"dd MMM yyyy")} - ${format(endDate,"dd MMM yyyy")}`
      : <><FaCalendarAlt /> Select Date Range</>}
    </button>

    {showCalendar && (
    <div ref={calendarRef} className="calendar-popup">

    <div className="range-preview">

    <div>
    <label>From</label>
      <div className="range-box">
      {startDate ? format(startDate, "dd MMM yyyy") : "Select"}
      </div>
    </div>

    <div>
    <label>To</label>
      <div className="range-box">
      {endDate ? format(endDate, "dd MMM yyyy") : "Select"}
      </div>
  </div>

  </div>

  <DayPicker
    mode={filter === "DAY" ? "single" : "range"}
    numberOfMonths={1}
    pagedNavigation
    selected={{
    from: startDate,
    to: endDate
    }}
    onSelect={(range)=>{

    if(filter === "DAY"){
    setStartDate(range);
    setEndDate(range);
    }else{
    setStartDate(range?.from || null);
    setEndDate(range?.to || null);
    }

    }}
  />

  <div style={{ marginTop: "10px", textAlign: "right" }}>
    <button
    className="btn btn-sm btn-light"
    onClick={()=>{
    setStartDate(null);
    setEndDate(null);
    setShowCalendar(false);
    }}
    >
    Clear
    </button>
  </div>

  </div>
  )}

  </div>

  </div>

      {/* KPI GRID */}
    <div className="kpi-grid">

  <KPI
    title="Active Reservations"
    value={animatedActiveReservations}
    onClick={() => navigate("/admin/reservations")}
  />

  <KPI
    title="Total Reservations"
    value={animatedTotalReservations}
    onClick={() => navigate("/admin/reservations")}
  />

  <KPI
    title="Reservation Revenue"
    value={`₹${animatedRevenue.toLocaleString()}`}
  />

  <KPI
    title="Active Subscriptions"
    value={animatedActiveSubscriptions}
  />

  <KPI
    title="Subscription Revenue"
    value={`₹${animatedSubscriptionRevenue.toLocaleString()}`}
  />

  <KPI
    title="Total Platform Revenue"
    value={`₹${animatedPlatformRevenue.toLocaleString()}`}
  />

  <KPI
    title="Owner Enquiries"
    value={animatedEnquiries}
    onClick={() => navigate("/admin/owner-enquiries")}
  />

</div>

            {/* CHART */}
          <div className="chart-card">
  <h3>Platform Revenue Trend</h3>

  <div className="revenue-chart-shell">
  <ResponsiveContainer width="100%" height={isMobile ? 260 : 420}>
  <AreaChart
  data={chartData}
  margin={isMobile
    ? { top: 12, right: 8, left: 0, bottom: 4 }
    : { top: 20, right: 10, left: -10, bottom: 0 }}   // unchanged
>
  <CartesianGrid strokeDasharray="3 3" />

  <XAxis
    dataKey="label"
    interval="preserveStartEnd"
    minTickGap={isMobile ? 22 : 14}
    tickMargin={8}
    tick={{ fontSize: isMobile ? 11 : 13 }}
  />

  <YAxis
    hide={isMobile}
    width={isMobile ? 0 : 90}                          // 60 → 85, more room
    tick={{ fontSize: isMobile ? 11 : 13, dx: -18 }}    // dx: -12 added — pushes label text left
    tickFormatter={(v) => formatCompactCurrency(v)}
    domain={[0, (dataMax) => dataMax + 5000]}
  />

    <Tooltip formatter={(v) => formatCurrency(v)} />

    {!isMobile && <Legend />}

    <Area
      type="monotone"
      dataKey="total"
      stroke="#6366f1"
      fill="#6366f1"
      fillOpacity={0.4}
      name="Platform Revenue"
    >
      {!isMobile && (
        <LabelList
          dataKey="total"
          position="top"
          formatter={(v) => `₹${v}`}
        />
      )}
    </Area>
  </AreaChart>
</ResponsiveContainer>
  </div>
    </div>
      </>
      )}
      </div>
    </DashboardLayout>
  );
};

const KPI = ({ title, value, onClick }) => (
  <div
    className="kpi-card"
    style={{ cursor: onClick ? "pointer" : "default" }}
    onClick={onClick}
  >
    <span>{title}</span>
    <h2>{value}</h2>
  </div>
);

export default AdminRevenue;
