import { FaCalendarAlt } from "react-icons/fa";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import { LabelList, Legend } from "recharts";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import "./OwnerRevenue.css";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  isWithinInterval,
  parse,
  // subMonths, 
  format,
} from "date-fns";
import "./OwnerRevenue.css";


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

const OwnerRevenue = () => {
  const navigate = useNavigate();
  const [residents, setResidents] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("MONTH");
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);
  const [rentRecords, setRentRecords] = useState([]);
  const [chartType, setChartType] = useState("area");
  const isMobile = window.innerWidth < 768;


  useEffect(() => {
    loadData();
    loadStats();
  }, []);



  const loadData = async () => {
    try {
      const [active, records, reserved, enq, rentRes] = await Promise.all([
        api.get("/owner/residents"),
        api.get("/owner/residents/records"),
        api.get("/owner/residents/reserved"),
        api.get("/enquiry/enquiries"),
        api.get("/owner/rent?status=PAID")
      ]);

      setRentRecords(Array.isArray(rentRes.data) ? rentRes.data : []);
      const merged = [
        ...(Array.isArray(active.data) ? active.data : []),
        ...(Array.isArray(records.data) ? records.data : []),
        ...(Array.isArray(reserved.data) ? reserved.data : []),
      ];

      const uniqueResidents = Array.from(
        new Map(merged.map((r) => [r.residentId, r])).values()
      );

      setResidents(uniqueResidents);
      setEnquiries(Array.isArray(enq.data) ? enq.data : []);
    } catch (err) {
      console.error("Owner revenue error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await api.get("/owner/dashboard/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Stats error:", err);
    }
  };

  /* ================= DATE RANGE ================= */
  const fromDate = useMemo(() => {

    const now = new Date();

    if (filter === "DAY") {
      return startOfDay(now);
    }

    if (filter === "WEEK") {
      return startOfWeek(now, { weekStartsOn: 1 });
    }

    if (filter === "MONTH") {
      return startOfMonth(now);
    }

    if (filter === "YEAR") {
      return new Date(now.getFullYear(), 0, 1);
    }

    return startOfMonth(now);

  }, [filter]);
  //  MONTH COMPARISON TEMPORARILY DISABLED
  /*
  const previousMonthStart = useMemo(() => {
    return startOfMonth(subMonths(new Date(), 1));
  }, []);
  */

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

  const getRevenueDate = (r) => {
    return toDate(
      r.onboardingPaymentDate || r.createdAt || r.checkinDate
    );
  };


  /* ================= REVENUE ================= */
  const calculateRevenue = () => {
    let total = 0;

    // 1. Rent from rentRecords (monthly payments)
    rentRecords.forEach((rec) => {
      const paidDate = toDate(rec.paidDate);

      if (rec.status === "PAID" && isDateInFilter(paidDate)) {
        total += Number(rec.rentAmount || 0);
      }
    });

    // 2. Onboarding / first rent (from residents)
    residents.forEach((r) => {
      const revenueDate = getRevenueDate(r);

      if (isDateInFilter(revenueDate)) {
        total += Number(r.monthlyRent || 0);
      }
    });

    // 3. Deposit damage (extra income)
    residents.forEach((r) => {
      const checkoutDate = toDate(r.actualCheckoutDate);

      if (isDateInFilter(checkoutDate)) {
        const damage =
          Number(r.deposit || 0) - Number(r.refundAmount || 0);

        if (damage > 0) {
          total += damage;
        }
      }
    });

    return total;
  };
  const collectionsInRange = calculateRevenue();

  //  MONTH COMPARISON + GROWTH DISABLED
  /*
  const previousMonthRevenue = calculateRevenue(previousMonthStart);

  const growth =
    previousMonthRevenue > 0
      ? ((collectionsInRange - previousMonthRevenue) /
          previousMonthRevenue) *
        100
      : 0;
  */

  /* ================= RENT COLLECTED ================= */
  const totalRentCollected = (() => {
    let total = 0;

    // rent records (monthly payments)
    rentRecords.forEach((rec) => {
      const paidDate = toDate(rec.paidDate);

      if (rec.status === "PAID" && isDateInFilter(paidDate)) {
        total += Number(rec.rentAmount || 0);
      }
    });

    // onboarding rent (first payment)
    residents.forEach((r) => {
      const revenueDate = getRevenueDate(r);

      if (isDateInFilter(revenueDate)) {
        total += Number(r.monthlyRent || 0);
      }
    });

    return total;
  })();
  /* ================= DEPOSIT HELD ================= */
  const totalDepositHeld = residents.reduce((sum, r) => {

    const date = getRevenueDate(r);

    if (!isDateInFilter(date)) return sum;

    const deposit = Number(r.deposit || 0);
    const refund = Number(r.refundAmount ?? 0);

    const held = deposit - refund;

    return held > 0 ? sum + held : sum;

  }, 0);



  /* ================= FUTURE DEPOSIT REFUND ================= */
  const futureDepositRefund = residents.reduce((sum, r) => {
    if (r.status !== "ACTIVE") return sum; // still living here, refund pending future
    return sum + Number(r.futureDepositRefund || 0);
  }, 0);

  /* ================= OCCUPANCY ================= */

  const occupancyRate = useMemo(() => {
    if (!stats) return 0;

    const totalBeds = stats.totalBeds || 0;
    const occupiedBeds = stats.occupiedBeds || 0;

    if (totalBeds === 0) return 0;

    return Math.round((occupiedBeds / totalBeds) * 100);
  }, [stats]);

  const totalActiveResidents = residents.filter((r) => {
    const revenueDate = getRevenueDate(r);

    return (
      r.status === "ACTIVE" &&
      isDateInFilter(revenueDate)
    );
  }).length;

  const totalReservedResidents = residents.filter((r) => {
    return r.status === "RESERVED";
  }).length;
  const totalEnquiries = enquiries.filter((e) => {
    if (!e.createdAt) return false;

    const parsedDate = parse(
      e.createdAt,
      "dd-MM-yyyy HH:mm:ss",
      new Date()
    );

    if (isNaN(parsedDate)) return false;

    return isDateInFilter(parsedDate);
  }).length;

  const avgRevenuePerResident =
    totalActiveResidents > 0
      ? Math.round(collectionsInRange / totalActiveResidents)
      : 0;

  /* ================= CHART DATA ================= */

  const chartData = useMemo(() => {
    const map = {};

    // RENT FROM RECORDS
    rentRecords.forEach((rec) => {
      const date = toDate(rec.paidDate);
      if (!isDateInFilter(date)) return;

      const key = format(date, "dd MMM");

      if (!map[key]) {
        map[key] = { date: key, revenue: 0 };
      }

      map[key].revenue += Number(rec.rentAmount || 0);
    });

    //  DAMAGE (deposit loss)
    residents.forEach((r) => {
      const date = toDate(r.actualCheckoutDate);
      if (!isDateInFilter(date)) return;

      const damage =
        Number(r.deposit || 0) - Number(r.refundAmount || 0);

      if (damage > 0) {
        const key = format(date, "dd MMM");

        if (!map[key]) {
          map[key] = { date: key, revenue: 0 };
        }

        map[key].revenue += damage;
      }
    });

    return Object.values(map).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [rentRecords, residents, isDateInFilter]);
  /* ================= ANIMATIONS ================= */

  const totalRevenue = totalRentCollected + totalDepositHeld;

  const animatedRevenue = useCountUp(collectionsInRange);
  const animatedDeposit = useCountUp(totalDepositHeld);
  const animatedRent = useCountUp(totalRentCollected);
  const animatedTotalRevenue = useCountUp(totalRevenue);
  const animatedAvg = useCountUp(avgRevenuePerResident);

  const animatedFutureRefund = useCountUp(futureDepositRefund);




  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef(null);
  /* ================= COMMON EXPORT DATA ================= */
  const getRevenueLabel = () => {

    if (startDate && endDate)
      return `Revenue (${format(startDate, "dd MMM yyyy")} - ${format(endDate, "dd MMM yyyy")})`;

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

    return "Revenue Report";
  };

  /* ---------- CURRENCY FORMATTERS ---------- */

  /* Used for WORD + EXCEL */
  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  /*  Used ONLY for PDF  */
  const formatCurrencyPDF = (value) =>
    `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;


  /* ---------- RAW REPORT DATA (NO FORMAT HERE) ---------- */
  /* VERY IMPORTANT → keep numbers RAW */

  const reportRows = [
    {
      label: "Net Revenue",
      value: collectionsInRange,
      type: "currency",
    },
    {
      label: "Total Revenue",
      value: totalRevenue,
      type: "currency",
    },
    {
      label: "Rent Collected",
      value: totalRentCollected,
      type: "currency",
    },
    { label: "Future Deposit Refund", value: futureDepositRefund, type: "currency" },
    {
      label: "Deposit Held",
      value: totalDepositHeld,
      type: "currency",
    },
    {
      label: "Active Residents",
      value: totalActiveResidents,
      type: "number",
    },
    {
      label: "Reserved Residents",
      value: totalReservedResidents,
      type: "number",
    },
    /*
    {
      label: "Total Enquiries",
      value: totalEnquiries,
      type: "number",
    },*/
    {
      label: "Avg Revenue / Resident",
      value: avgRevenuePerResident,
      type: "currency",
    },
    {
      label: "Occupancy Rate",
      value: occupancyRate,
      type: "percentage",
    },
  ];
  /* ================= PDF ================= */
  const exportPDF = () => {

    const pdf = new jsPDF("p", "mm", "a4");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("Revenue Analytics Report", 20, 20);

    pdf.setFontSize(13);
    pdf.text(getRevenueLabel(), 20, 30);

    let y = 45;

    pdf.setFontSize(14);
    pdf.text("Summary Metrics", 20, y);
    y += 12;

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    const pageWidth = pdf.internal.pageSize.getWidth();

    const labelX = 25;              // left column
    const valueX = pageWidth - 25;  // right column

    reportRows.forEach((row) => {

      let formatted;

      if (row.type === "currency")
        formatted = formatCurrencyPDF(row.value);
      else if (row.type === "percentage")
        formatted = `${row.value}%`;
      else
        formatted = row.value;

      /* LEFT COLUMN */
      pdf.text(row.label, labelX, y);

      /* RIGHT COLUMN (PERFECT ALIGNMENT) */
      pdf.text(
        String(formatted),
        valueX,
        y,
        { align: "right" }
      );

      y += 9;
    });

    pdf.save("RevenueAnalytics.pdf");
    setShowExport(false);
  };

  /* ================= EXCEL ================= */
  const exportExcel = () => {

    /* ---------- BUILD DATA ---------- */
    const data = [
      ["Revenue Analytics Report"],
      [getRevenueLabel()],
      [],
      ["Metric", "Value"],

      ...reportRows.map((row) => {

        let formatted;

        if (row.type === "currency")
          formatted = formatCurrency(row.value);

        else if (row.type === "percentage")
          formatted = `${row.value}%`;

        else
          formatted = String(row.value);

        return [row.label, formatted];
      }),
    ];

    /* ---------- CREATE SHEET ---------- */
    const ws = XLSX.utils.aoa_to_sheet(data);

    /* ---------- COLUMN WIDTH ---------- */
    ws["!cols"] = [
      { wch: 38 }, // Metric column
      { wch: 24 }, // Value column
    ];

    /* ---------- HEADER BOLD ---------- */
    ws["A4"].s = { font: { bold: true } };
    ws["B4"].s = { font: { bold: true } };

    /* ---------- CREATE WORKBOOK ---------- */
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Revenue Analytics"
    );

    /* ---------- DOWNLOAD ---------- */
    XLSX.writeFile(
      wb,
      "RevenueAnalytics.xlsx"
    );

    setShowExport(false);
  };
  /* ================= WORD ================= */
  const exportWord = () => {
    const rowsHTML = reportRows.map((row) => {

      let formatted;

      if (row.type === "currency")
        formatted = formatCurrency(row.value);
      else if (row.type === "percentage")
        formatted = `${row.value}%`;
      else
        formatted = row.value;

      return `
    <tr>
      <td>${row.label}</td>
      <td style="text-align:right">${formatted}</td>
    </tr>
  `;
    }).join("");

    const htmlContent = `
  <html>
  <head>
    <meta charset="utf-8"/>
    <style>
      body {
        font-family: Calibri;
        padding:40px;
      }

      h2 { margin-bottom:5px; }
      h4 { margin-top:0; color:#555; }

      table {
        width:100%;
        border-collapse:collapse;
        margin-top:20px;
      }

      th, td {
        border:1px solid #ccc;
        padding:10px;
      }

      th {
        background:#f3f4f6;
        text-align:left;
      }
    </style>
  </head>

  <body>

    <h2>Revenue Analytics Report</h2>
    <h4>${getRevenueLabel()}</h4>

    <table>
      <tr>
        <th>Metric</th>
        <th style="text-align:right">Value</th>
      </tr>
      ${rowsHTML}
    </table>

  </body>
  </html>
  `;

    const blob = new Blob(["\ufeff", htmlContent], {
      type: "application/msword",
    });

    saveAs(blob, "RevenueAnalytics.doc");
    setShowExport(false);
  };
  useEffect(() => {

    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);

  }, []);
  return (
    <DashboardLayout
      title="Revenue Analytics"
      subtitle="Advanced PG performance insights"

      rightAction={
        <div className="dashboard-export-wrapper">

          <button
            className="dashboard-export-btn"
            onClick={() => setShowExport(!showExport)}
          >
            <i className="bi bi-download"></i> Export
          </button>

          {showExport && (
            <div className="dashboard-export-dropdown">
              <button onClick={exportPDF}>Export as PDF</button>
              <button onClick={exportWord}>Export as Word</button>
              <button onClick={exportExcel}>Export as Excel</button>
            </div>
          )}

        </div>
      }
    >

      <div className="owner-revenue-container" ref={exportRef}>
        {loading && <div className="loader">Loading...</div>}

        {!loading && (
          <>
            {/* FILTER */}
            <div className="top-bar">

              <div className="filter-row">
                {[/*"DAY", "WEEK",*/ "MONTH", "YEAR"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={filter === f ? "active" : ""}
                  >
                    {f}
                  </button>
                ))}
              </div>



              {/* CALENDAR  */}

              <div className="calendar-wrapper">

                <button
                  className="date-trigger-btn"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  {startDate && endDate
                    ? `${format(startDate, "dd MMM yyyy")} - ${format(endDate, "dd MMM yyyy")}`
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
                      numberOfMonths={isMobile ? 1 : 1}
                      pagedNavigation
                      selected={{
                        from: startDate,
                        to: endDate
                      }}
                      onSelect={(range) => {

                        if (filter === "DAY") {
                          setStartDate(range);
                          setEndDate(range);
                        } else {
                          setStartDate(range?.from || null);
                          setEndDate(range?.to || null);
                        }

                      }}
                    />
                    {/* Clear Filter Button */}
                    <div style={{ marginTop: "10px", textAlign: "right" }}>
                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => {
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
                title="Total Revenue"
                value={`₹${animatedTotalRevenue.toLocaleString()}`}
                icon="bi bi-cash-stack"
                color="kpi-orange"
              />

             
              <KPI
                title="Rent Collected"
                value={`₹${animatedRent.toLocaleString()}`}
                icon="bi bi-wallet2"
                color="kpi-purple"
              />
              <KPI
                title="Deposit Held"
                value={`₹${animatedDeposit.toLocaleString()}`}
                icon="bi bi-safe"
                color="kpi-green"
              />

               <KPI
                title="Future Deposit Refund"
                value={`₹${animatedFutureRefund.toLocaleString()}`}
                icon="bi bi-calendar-check"
                color="kpi-red"
              />

              <KPI
                title="Active Residents"
                value={totalActiveResidents}
                icon="bi bi-person-check"
                color="kpi-green"
                onClick={() => navigate("/owner/residents")}
              />
              <KPI
                title="Reserved Residents"
                value={totalReservedResidents}
                icon="bi bi-bookmark-check"
                color="kpi-purple"
                onClick={() => navigate("/owner/residents")}
              />
             
              {/*
              <KPI
                title="Total Enquiries"
                value={totalEnquiries}
                icon="bi bi-chat-dots"
                color="kpi-blue"
                onClick={() => navigate("/owner/enquiries")}
              />
              */}

             

               <KPI
                title="Net Revenue"
                value={`₹${animatedRevenue.toLocaleString()}`}
                icon="bi bi-currency-rupee"
                color="kpi-blue"
              />

               <KPI
                title="Avg Revenue / Resident"
                value={`₹${animatedAvg.toLocaleString()}`}
                icon="bi bi-graph-up-arrow"
                color="kpi-blue"
              />
              

            </div>


            {/* CHARTS */}
            <div className="analytics-grid">
              <div className="chart-card small-card">
                <h3>Occupancy Rate</h3>

                <div style={{ position: 'relative' }}>
                  <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Occupied", value: occupancyRate, fill: "#6366f1" },
                          { name: "Vacant", value: 100 - occupancyRate, fill: "#e5e7eb" },
                        ].filter(d => d.value > 0)}
                        dataKey="value"
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        innerRadius={isMobile ? 50 : 60}
                        outerRadius={isMobile ? 75 : 90}
                      >
                        {[
                          { name: "Occupied", value: occupancyRate, fill: "#6366f1" },
                          { name: "Vacant", value: 100 - occupancyRate, fill: "#e5e7eb" },
                        ].filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="donut-center">
                    {occupancyRate}%
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0 }}>Revenue Trend</h3>
                  <div className="chart-toggle-wrapper">
                    <button
                      className={`chart-toggle-switch ${chartType}`}
                      onClick={() => setChartType(chartType === "area" ? "bar" : "area")}
                      aria-label="Toggle Chart Type"
                    >
                      <span className="chart-toggle-thumb"></span>
                    </button>
                    <span className="chart-toggle-label">
                      {chartType === "area" ? "Line Chart" : "Bar Chart"}
                    </span>
                  </div>
                </div>

                {chartData.length === 0 ? (

                  <div className="empty-chart">
                    No revenue data for selected dates
                  </div>

                ) : (

                  <ResponsiveContainer width="100%" height={isMobile ? 220 : 320}>
                    {chartType === "area" ? (
                      <AreaChart
                        data={chartData}
                        margin={
                          isMobile
                            ? { top: 16, right: 30, left: 10, bottom: 0 }
                            : { top: 20, right: 40, left: 20, bottom: 0 }
                        }
                      >
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: isMobile ? 10 : 13 }}
                          tickLine={false}
                          interval={isMobile ? "preserveStartEnd" : 0}
                        />

                        <YAxis
                          width={isMobile ? 48 : 60}
                          tick={{ fontSize: isMobile ? 10 : 13 }}
                          tickFormatter={(v) =>
                            isMobile
                              ? v >= 1000
                                ? `₹${(v / 1000).toFixed(0)}k`
                                : `₹${v}`
                              : `₹${v}`
                          }
                        />

                        <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                        <Legend wrapperStyle={{ fontSize: isMobile ? 12 : 14 }} />

                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#6366f1"
                          fill="#6366f1"
                          fillOpacity={0.4}
                        >
                          {!isMobile && (
                            <LabelList
                              dataKey="revenue"
                              position="top"
                              formatter={(v) => `₹${v}`}
                            />
                          )}
                        </Area>
                      </AreaChart>
                    ) : (
                      <BarChart
                        data={chartData}
                        margin={
                          isMobile
                            ? { top: 16, right: 30, left: 10, bottom: 0 }
                            : { top: 20, right: 40, left: 20, bottom: 0 }
                        }
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: isMobile ? 10 : 13 }}
                          tickLine={false}
                          interval={isMobile ? "preserveStartEnd" : 0}
                        />
                        <YAxis
                          width={isMobile ? 48 : 60}
                          tick={{ fontSize: isMobile ? 10 : 13 }}
                          tickFormatter={(v) =>
                            isMobile
                              ? v >= 1000
                                ? `₹${(v / 1000).toFixed(0)}k`
                                : `₹${v}`
                              : `₹${v}`
                          }
                        />
                        <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                        <Legend wrapperStyle={{ fontSize: isMobile ? 12 : 14 }} />
                        <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]}>
                          {!isMobile && (
                            <LabelList
                              dataKey="revenue"
                              position="top"
                              formatter={(v) => `₹${v}`}
                            />
                          )}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>

                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

const KPI = ({ title, value, icon, color, onClick }) => (
  <div
    className={`kpi-card ${color || ""}`}
    style={{ cursor: onClick ? "pointer" : "default" }}
    onClick={onClick}
  >
    <div className="kpi-header">

      <div className="kpi-info">
        <span>{title}</span>
        <h2>{value}</h2>
      </div>

      {icon && (
        <div className="kpi-icon">
          <i className={icon}></i>
        </div>
      )}

    </div>
  </div>
);

export default OwnerRevenue;