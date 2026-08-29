import { FaCalendarAlt } from "react-icons/fa";
import { useEffect, useMemo, useState, useCallback, useRef, Fragment } from "react";
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
  endOfMonth,
  isWithinInterval,
  format,
} from "date-fns";
import DonutBreakdownChart from "../../components/owner/DonutBreakdownChart";
import "./OwnerRevenue.css";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];


/* ================= COUNT UP HOOK ================= */

// AnimatedNumber component isolates re-renders so the main page doesn't lag 
// during the 60fps animation.
const AnimatedNumber = ({ value, duration = 1200, prefix = "", suffix = "" }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    if (target <= 0) {
      setDisplay(target);
      return;
    }

    let startTimestamp = null;
    let animationFrame;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Cubic ease-out
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      setDisplay(Math.floor(easeProgress * target));

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      } else {
        setDisplay(target);
      }
    };

    animationFrame = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <>{prefix}{display.toLocaleString()}{suffix}</>;
};

const OwnerRevenue = () => {
  const navigate = useNavigate();
  const [residents, setResidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("MONTH");
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const monthRef = useRef(null);
  const yearRef = useRef(null);
  const yearOptions = useMemo(() => {
    const cy = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => cy - 5 + i);
  }, []);
  const [rentRecords, setRentRecords] = useState([]);
  const [chartMetric, setChartMetric] = useState("COLLECTED");
  const [pgs, setPgs] = useState([]);
  const [selectedPgId, setSelectedPgId] = useState("ALL");
  const isMobile = window.innerWidth < 768;

  const [expenditures, setExpenditures] = useState([]);
  const [viewMode] = useState("month");

  // Expense History
  const [expHistoryPgId, setExpHistoryPgId] = useState("ALL");
  const [expHistoryStatus, setExpHistoryStatus] = useState("ALL");
  const [expHistorySearch, setExpHistorySearch] = useState("");
  const [markingPaidId, setMarkingPaidId] = useState(null);
  const [markPaidForm, setMarkPaidForm] = useState({ paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'CASH' });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    api.get("/owner/pgs")
      .then((res) => {
        setPgs(res.data || []);
      })
      .catch((err) => console.error("Failed to load PGs", err));
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPgId, selectedMonth, selectedYear, filter]);

  // Re-fetch stats whenever the date filter changes so that
  // pending/overdue KPIs reflect the selected month/year
  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPgId, selectedMonth, selectedYear, filter]);



  const loadData = async () => {
    try {
      setLoading(true);
      const params = selectedPgId === "ALL" ? {} : { pgId: selectedPgId };
      // Include viewMode to trigger re-fetch as requested
      const [active, records, reserved, rentRes, expRes] = await Promise.all([
        api.get("/owner/residents", { params }),
        api.get("/owner/residents/records", { params }),
        api.get("/owner/residents/reserved", { params }),
        api.get("/owner/rent?status=PAID", { params }),
        api.get("/owner/expenses", { params, viewMode })
      ]);

      setRentRecords(Array.isArray(rentRes.data) ? rentRes.data : []);
      setExpenditures(Array.isArray(expRes.data) ? expRes.data : []);
      const merged = [
        ...(Array.isArray(active.data) ? active.data : []),
        ...(Array.isArray(records.data) ? records.data : []),
        ...(Array.isArray(reserved.data) ? reserved.data : []),
      ];

      const uniqueResidents = Array.from(
        new Map(merged.map((r) => [r.residentId, r])).values()
      );

      setResidents(uniqueResidents);
    } catch (err) {
      console.error("Owner revenue error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Bug Fix 1: Pass the currently selected month/year to the backend
      // so that revenuePending and revenueOverdue are scoped to the selected period.
      // Backend expects 0-indexed month (matching JS Date.getMonth())
      const params = {
        ...(selectedPgId !== "ALL" ? { pgId: selectedPgId } : {}),
        ...(filter === "MONTH" ? { month: selectedMonth, year: selectedYear } : {}),
        ...(filter === "YEAR"  ? { year: selectedYear } : {}),
      };
      const res = await api.get("/owner/dashboard/stats", { params });
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
      return startOfMonth(new Date(selectedYear, selectedMonth, 1));
    }

    if (filter === "YEAR") {
      return new Date(selectedYear, 0, 1);
    }

    return startOfMonth(now);

  }, [filter, selectedMonth, selectedYear]);

  const toDateFilter = useMemo(() => {
    const today = new Date();

    if (filter === "MONTH") {
      return endOfMonth(new Date(selectedYear, selectedMonth, 1));
    }

    if (filter === "YEAR") {
      return new Date(selectedYear, 11, 31, 23, 59, 59);
    }

    return today;

  }, [filter, selectedMonth, selectedYear]);
  //  MONTH COMPARISON TEMPORARILY DISABLED
  /*
  const previousMonthStart = useMemo(() => {
    return startOfMonth(subMonths(new Date(), 1));
  }, []);
  */

  // Parses date/datetime strings consistently as IST (local time).
  // - Plain date "YYYY-MM-DD" → parsed as local midnight (avoids UTC shift)
  // - DateTime with offset "...+05:30" → natively handled correctly by Date
  // - DateTime without offset "...T19:00:00" → treated as local (IST) time
  const toDate = (value) => {
    if (!value) return null;
    const str = String(value);
    // Plain date string "2026-08-22" — parse as local to avoid UTC midnight shift
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    // DateTime already has timezone offset (e.g. +05:30 or Z) — parse natively
    if (/[Z+\-]\d{2}:\d{2}$/.test(str) || str.endsWith('Z')) {
      return new Date(str);
    }
    // DateTime with no offset "2026-08-21T19:00:00" — treat as local (IST) time
    // Replace the T separator so Date constructor treats it as local
    return new Date(str.replace('T', ' '));
  };

  const isDateInFilter = useCallback(
    (date) => {

      if (!date) return false;

      if (startDate && endDate) {
        return isWithinInterval(date, {
          start: startDate,
          end: endDate
        });
      }

      return isWithinInterval(date, {
        start: fromDate,
        end: toDateFilter
      });

    },
    [fromDate, toDateFilter, startDate, endDate]
  );

  const getRevenueDate = (r) => {
    return toDate(
      r.onboardingPaymentDate || r.createdAt || r.checkinDate
    );
  };


  /* ================= REVENUE ================= */
  // collectionsInRange: all revenue within the selected filter range.
  // Rent comes ONLY from rentRecords to avoid double-counting with onboarding.
  // Deposit damage (checkout deductions) is counted separately as extra income.
  const calculateRevenue = () => {
    let total = 0;

    // 1. Rent from rentRecords only (avoids double-counting with onboarding)
    rentRecords.forEach((rec) => {
      const paidDate = toDate(rec.paidDate);
      if (rec.status === "PAID" && isDateInFilter(paidDate)) {
        total += Number(rec.rentAmount || 0);
      }
    });

    // 2. Deposit damage income (deductions kept at checkout)
    residents.forEach((r) => {
      const checkoutDate = toDate(r.actualCheckoutDate);
      if (isDateInFilter(checkoutDate)) {
        const damage = Number(r.deposit || 0) - Number(r.refundAmount || 0);
        if (damage > 0) total += damage;
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
  // Bug Fix 2: Only count paid rentRecords to avoid double-counting.
  // Previously, residents' monthlyRent was also added (via getRevenueDate / createdAt),
  // which caused double-counting if a first-month rent record already existed.
  // Deposits are handled separately in totalDepositHeld.
  const totalRentCollected = (() => {
    let total = 0;
    rentRecords.forEach((rec) => {
      const paidDate = toDate(rec.paidDate);
      if (rec.status === "PAID" && isDateInFilter(paidDate)) {
        total += Number(rec.rentAmount || 0);
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
    const date = getRevenueDate(r);
    if (!isDateInFilter(date)) return sum;
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

  // totalActiveResidents: count of ALL currently active residents (not date-filtered).
  // We do NOT filter by revenue date here — an active resident is active regardless
  // of when they joined. Date filtering only applies to payments, not headcount.
  const totalActiveResidents = residents.filter((r) => r.status === "ACTIVE").length;

  const avgRevenuePerResident =
    totalActiveResidents > 0
      ? Math.round(collectionsInRange / totalActiveResidents)
      : 0;

  /* ================= CHART DATA ================= */

  const chartData = useMemo(() => {
    const monthlyPotential = stats?.maxPotentialRevenue || 0;

    if (filter === "YEAR") {
      const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyMap = {};
      allMonths.forEach(m => monthlyMap[m] = { revenue: 0, expense: 0 });

      rentRecords.forEach((rec) => {
        const date = toDate(rec.paidDate);
        if (date && date.getFullYear() === selectedYear && rec.status === "PAID") {
          const monthStr = format(date, "MMM");
          if (monthlyMap[monthStr] !== undefined) {
            monthlyMap[monthStr].revenue += Number(rec.rentAmount || 0);
          }
        }
      });

      residents.forEach((r) => {
        const date = toDate(r.actualCheckoutDate);
        if (date && date.getFullYear() === selectedYear) {
          const damage = Number(r.deposit || 0) - Number(r.refundAmount || 0);
          if (damage > 0) {
            const monthStr = format(date, "MMM");
            if (monthlyMap[monthStr] !== undefined) {
              monthlyMap[monthStr].revenue += damage;
            }
          }
        }
      });
      
      expenditures.forEach(exp => {
        const date = toDate(exp.expenseDate || exp.date);  // use toDate() for IST consistency
        if (date && date.getFullYear() === selectedYear) {
            const monthStr = format(date, "MMM");
            if (monthlyMap[monthStr] !== undefined) {
                monthlyMap[monthStr].expense += Number(exp.amount || 0);
            }
        }
      });

      return allMonths.map(m => ({ date: m, revenue: monthlyMap[m].revenue, expense: monthlyMap[m].expense, potential: monthlyPotential }));
    }

    if (filter === "MONTH") {
      const weeks = Array.from({ length: 4 }, () => ({ revenue: 0, expense: 0 }));
      const weekPotential = Math.round(monthlyPotential / 4);

      rentRecords.forEach((rec) => {
        const date = toDate(rec.paidDate);
        if (date && date.getFullYear() === selectedYear && date.getMonth() === selectedMonth && rec.status === "PAID") {
          const day = date.getDate();
          const weekIdx = Math.min(Math.floor((day - 1) / 7), 3);
          weeks[weekIdx].revenue += Number(rec.rentAmount || 0);
        }
      });

      residents.forEach((r) => {
        const date = toDate(r.actualCheckoutDate);
        if (date && date.getFullYear() === selectedYear && date.getMonth() === selectedMonth) {
          const damage = Number(r.deposit || 0) - Number(r.refundAmount || 0);
          if (damage > 0) {
            const day = date.getDate();
            const weekIdx = Math.min(Math.floor((day - 1) / 7), 3);
            weeks[weekIdx].revenue += damage;
          }
        }
      });
      
      expenditures.forEach(exp => {
        const date = toDate(exp.expenseDate || exp.date);  // use toDate() for IST consistency
        if (date && date.getFullYear() === selectedYear && date.getMonth() === selectedMonth) {
            const day = date.getDate();
            const weekIdx = Math.min(Math.floor((day - 1) / 7), 3);
            weeks[weekIdx].expense += Number(exp.amount || 0);
        }
      });

      return weeks.map((w, i) => ({ date: `Week ${i + 1}`, revenue: w.revenue, expense: w.expense, potential: weekPotential }));
    }

    // Default for DAY, WEEK, CUSTOM
    const map = {};

    rentRecords.forEach((rec) => {
      const date = toDate(rec.paidDate);
      if (!isDateInFilter(date) || rec.status !== "PAID") return;
      const key = format(date, "dd MMM");
      if (!map[key]) map[key] = { date: key, revenue: 0, expense: 0, potential: Math.round(monthlyPotential / 30) };
      map[key].revenue += Number(rec.rentAmount || 0);
    });

    residents.forEach((r) => {
      const date = toDate(r.actualCheckoutDate);
      if (!isDateInFilter(date)) return;
      const damage = Number(r.deposit || 0) - Number(r.refundAmount || 0);
      if (damage > 0) {
        const key = format(date, "dd MMM");
        if (!map[key]) map[key] = { date: key, revenue: 0, expense: 0, potential: Math.round(monthlyPotential / 30) };
        map[key].revenue += damage;
      }
    });
    
    expenditures.forEach(exp => {
      const date = toDate(exp.expenseDate || exp.date);  // use toDate() for IST consistency
      if (!isDateInFilter(date)) return;
      const key = format(date, "dd MMM");
      if (!map[key]) map[key] = { date: key, revenue: 0, expense: 0, potential: Math.round(monthlyPotential / 30) };
      map[key].expense += Number(exp.amount || 0);
    });

    return Object.values(map).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [rentRecords, residents, expenditures, isDateInFilter, filter, selectedMonth, selectedYear, stats]);
  /* ================= ANIMATIONS ================= */

  const totalRevenue = totalRentCollected + totalDepositHeld;

  // Potential Revenue scales with the selected period:
  // - MONTH view  → 1 month of potential (monthly bed revenue)
  // - YEAR view   → 12 months of potential (annual bed revenue)
  // - Other views → monthly value (best approximation)
  const monthlyPotential = stats?.maxPotentialRevenue || 0;
  const potentialRevenue = filter === "YEAR" ? monthlyPotential * 12 : monthlyPotential;

  const colRate = potentialRevenue > 0 ? Math.round((totalRentCollected / potentialRevenue) * 100) : 0;

  const totalExpensesAmount = useMemo(() => {
    return expenditures
      .filter(exp => isDateInFilter(toDate(exp.expenseDate || exp.date)))  // use toDate() for IST
      .reduce((sum, exp) => sum + Number(exp.amount), 0);
  }, [expenditures, isDateInFilter]);
  
  // NOTE: Animations have been moved to the <AnimatedNumber /> component 
  // in the JSX to prevent the entire page from re-rendering 60 times a second.

  const isAllPgsEh = expHistoryPgId === 'ALL';
  const filteredExpensesForEh = useMemo(() => expenditures
    .filter(exp => isAllPgsEh || exp.pgId === expHistoryPgId)
    .filter(exp => expHistoryStatus === 'ALL' || (exp.paymentStatus || '').toUpperCase() === expHistoryStatus)
    .filter(exp => {
      if (!expHistorySearch) return true;
      const q = expHistorySearch.toLowerCase();
      return (
        (exp.category || '').toLowerCase().includes(q) ||
        (exp.title || '').toLowerCase().includes(q) ||
        (exp.paidTo || '').toLowerCase().includes(q)
      );
    }), [expenditures, isAllPgsEh, expHistoryPgId, expHistoryStatus, expHistorySearch]);

  const ehTotalTxs = filteredExpensesForEh.length;
  const ehPendingAmt = useMemo(() => filteredExpensesForEh.filter(e => (e.paymentStatus||'').toUpperCase() === 'PENDING').reduce((s, e) => s + (e.amount||0), 0), [filteredExpensesForEh]);
  const ehPaidAmt = useMemo(() => filteredExpensesForEh.filter(e => (e.paymentStatus||'').toUpperCase() !== 'PENDING').reduce((s, e) => s + (e.amount||0), 0), [filteredExpensesForEh]);
  const ehTotalAmt = ehPendingAmt + ehPaidAmt;

  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef(null);
  const getRevenueLabel = () => {

    if (startDate && endDate)
      return `Revenue & Expenditure (${format(startDate, "dd MMM yyyy")} - ${format(endDate, "dd MMM yyyy")})`;

    if (filter === "DAY")
      return startDate
        ? `Revenue & Expenditure of ${format(startDate, "dd MMM yyyy")}`
        : "Revenue & Expenditure of Selected Day";

    if (filter === "WEEK")
      return "Revenue & Expenditure of Current Week";

    if (filter === "MONTH")
      return "Revenue & Expenditure of Current Month";

    if (filter === "YEAR")
      return "Revenue & Expenditure of Current Year";

    return "Revenue & Expenditure Report";
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
      label: "Potential Revenue",
      value: potentialRevenue,
      type: "currency",
    },
    {
      label: "Rent Collected",
      value: totalRentCollected,
      type: "currency",
    },
    {
      label: "Security Deposits Held",
      value: totalDepositHeld,
      type: "currency",
    },
    {
      label: "Total Income",
      value: totalRevenue,
      type: "currency",
    },
    {
      label: "Total Unpaid Rent",
      value: stats?.revenuePending || 0,
      type: "currency",
    },
    {
      label: "Of which is Overdue",
      value: stats?.revenueOverdue || 0,
      type: "currency",
    },
    {
      label: "Future Deposit Refund",
      value: futureDepositRefund,
      type: "currency",
    },
    {
      label: "Collection Rate",
      value: colRate,
      type: "percentage",
    },
    {
      label: "Active Residents",
      value: totalActiveResidents,
      type: "number",
    },
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
    pdf.text("Revenue & Expenditure Report", 20, 20);

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

    pdf.save("RevenueAndExpenditure.pdf");
    setShowExport(false);
  };

  /* ================= EXCEL ================= */
  const exportExcel = () => {

    /* ---------- BUILD DATA ---------- */
    const data = [
      ["Revenue & Expenditure Report"],
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
      "Revenue & Expenditure"
    );

    /* ---------- DOWNLOAD ---------- */
    XLSX.writeFile(
      wb,
      "RevenueExpenditure.xlsx"
    );

    setShowExport(false);
  };

  /* ================= EXPENDITURE EXCEL ================= */
  const exportExpenditureExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedPgId !== "ALL") params.append("pgId", selectedPgId);
      if (startDate) params.append("startDate", format(startDate, "yyyy-MM-dd"));
      if (endDate) params.append("endDate", format(endDate, "yyyy-MM-dd"));

      const response = await api.get(`/owner/expenditures/export?${params.toString()}`, {
        responseType: 'blob'
      });
      saveAs(response.data, "ExpenditureLedger.xlsx");
      setShowExport(false);
    } catch (err) {
      console.error("Failed to export expenditures", err);
    }
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

    <h2>Revenue & Expenditure Report</h2>
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
      if (monthRef.current && !monthRef.current.contains(e.target)) {
        setShowMonthDropdown(false);
      }
      if (yearRef.current && !yearRef.current.contains(e.target)) {
        setShowYearDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);

  }, []);
  return (
    <DashboardLayout
      title="Revenue & Expenditure"
      subtitle="Your complete financial ledger"

      rightAction={
        <div className="dashboard-export-wrapper">

          <button
            className="dashboard-export-btn"
            onClick={() => setShowExport(!showExport)}
          >
            <div className="export-icon-box">
              <i className="bi bi-download"></i>
            </div>
            <span>Export</span>
            <i className="bi bi-chevron-right export-chevron"></i>
          </button>

          {showExport && (
            <div className="dashboard-export-dropdown">
              <button onClick={exportPDF}>Export as PDF</button>
              <button onClick={exportWord}>Export as Word</button>
              <button onClick={exportExcel}>Export Revenue Excel</button>
              <button onClick={exportExpenditureExcel} style={{ color: '#ef4444', fontWeight: '600' }}>Export Expenditure</button>
            </div>
          )}

        </div>
      }
    >

      <div className="owner-revenue-container" ref={exportRef}>
        

        {loading && (
          <div className="owner-revenue-container skeleton-container">
            <div className="skeleton-top-bar">
              <div className="filter-row" style={{ display: 'flex', gap: '16px' }}>
                <div className="skeleton-box skeleton-filter"></div>
                <div className="skeleton-box skeleton-filter"></div>
              </div>
              <div className="skeleton-box skeleton-btn"></div>
            </div>
            
            <div className="skeleton-kpi-grid">
              <div className="skeleton-box skeleton-kpi-card"></div>
              <div className="skeleton-box skeleton-kpi-card"></div>
              <div className="skeleton-box skeleton-kpi-card"></div>
              <div className="skeleton-box skeleton-kpi-card"></div>
            </div>
            
            <div className="skeleton-analytics-grid">
              <div className="skeleton-box skeleton-chart-small"></div>
              <div className="skeleton-box skeleton-chart-large"></div>
            </div>

            <div className="skeleton-expense-history">
              <div className="skeleton-eh-top">
                 <div className="skeleton-box skeleton-eh-title"></div>
                 <div className="skeleton-eh-filters">
                   <div className="skeleton-box skeleton-filter" style={{ flex: 1 }}></div>
                   <div className="skeleton-box skeleton-filter" style={{ flex: 1 }}></div>
                   <div className="skeleton-box skeleton-filter" style={{ flex: 2 }}></div>
                 </div>
              </div>
              
              <div className="skeleton-kpi-grid">
                <div className="skeleton-box skeleton-kpi-card"></div>
                <div className="skeleton-box skeleton-kpi-card"></div>
                <div className="skeleton-box skeleton-kpi-card"></div>
                <div className="skeleton-box skeleton-kpi-card"></div>
              </div>

              <div className="skeleton-eh-table">
                 <div className="skeleton-box skeleton-eh-row"></div>
                 <div className="skeleton-box skeleton-eh-row"></div>
                 <div className="skeleton-box skeleton-eh-row"></div>
                 <div className="skeleton-box skeleton-eh-row"></div>
              </div>
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* FILTER */}
            <div className="top-bar">

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                {pgs.length > 0 && (
                  <select
                    className="rev-pg-filter"
                    value={selectedPgId}
                    onChange={e => setSelectedPgId(e.target.value)}
                  >
                    <option value="ALL">All PGs</option>
                    {pgs.map(pg => <option key={pg.id} value={pg.id}>{pg.name}</option>)}
                  </select>
                )}

                <div className="filter-row">
                  <div className="filter-dropdown-wrapper" ref={monthRef}>
                  <button
                    onClick={() => {
                      setFilter("MONTH");
                      setShowMonthDropdown((p) => !p);
                      setShowYearDropdown(false);
                    }}
                    className={filter === "MONTH" ? "active" : ""}
                  >
                    MONTH
                  </button>
                  {showMonthDropdown && (
                    <div className="filter-dropdown-menu">
                      {MONTH_NAMES.map((m, i) => (
                        <div
                          key={m}
                          className={
                            filter === "MONTH" && i === selectedMonth
                              ? "filter-dropdown-item active"
                              : "filter-dropdown-item"
                          }
                          onClick={() => {
                            setSelectedMonth(i);
                            setFilter("MONTH");
                            setShowMonthDropdown(false);
                          }}
                        >
                          {m}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="filter-dropdown-wrapper" ref={yearRef}>
                  <button
                    onClick={() => {
                      setFilter("YEAR");
                      setShowYearDropdown((p) => !p);
                      setShowMonthDropdown(false);
                    }}
                    className={filter === "YEAR" ? "active" : ""}
                  >
                    YEAR
                  </button>
                  {showYearDropdown && (
                    <div className="filter-dropdown-menu">
                      {yearOptions.map((y) => (
                        <div
                          key={y}
                          className={
                            filter === "YEAR" && y === selectedYear
                              ? "filter-dropdown-item active"
                              : "filter-dropdown-item"
                          }
                          onClick={() => {
                            setSelectedYear(y);
                            setFilter("YEAR");
                            setShowYearDropdown(false);
                          }}
                        >
                          {y}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
              
              <div style={{ flex: 1 }}></div>

              <button 
                className="btn-add-expense" 
                onClick={() => navigate('/owner/revenue/add-expense')}
              >
                + Add Expense
              </button>

            </div>

            {/* KPI GRID */}
            <div className="owner-kpi-grid">
              <KPI
                title="Total Revenue"
                value={<AnimatedNumber prefix="₹" value={totalRevenue} />}
                icon="bi bi-wallet2"
                color="kpi-green"
              />
              <KPI
                title="Rent Collected"
                value={<AnimatedNumber prefix="₹" value={totalRentCollected} />}
                icon="bi bi-wallet2"
                color="kpi-purple"
              />
              <KPI
                title="Deposit Held"
                value={<AnimatedNumber prefix="₹" value={totalDepositHeld} />}
                icon="bi bi-safe"
                color="kpi-green"
              />
              <KPI
                title="Future Deposit Refund"
                value={<AnimatedNumber prefix="₹" value={futureDepositRefund} />}
                icon="bi bi-calendar-check"
                color="kpi-red"
              />
              <KPI
                title="Potential Revenue"
                value={<AnimatedNumber prefix="₹" value={potentialRevenue} />}
                icon="bi bi-house-door"
                color="kpi-purple"
                trend={{ direction: 'up', value: '8.3%' }}
              />
              <KPI
                title="Total Expenses"
                value={<AnimatedNumber prefix="₹" value={totalExpensesAmount} />}
                icon="bi bi-graph-down"
                color="kpi-red"
                trend={{ direction: 'up', value: '5.8%' }}
              />

              <KPI
                title="Total Overdue"
                value={<AnimatedNumber prefix="₹" value={stats?.revenueOverdue || 0} />}
                icon="bi bi-hourglass-split"
                color="kpi-orange"
                trend={{ direction: 'down', value: '100%' }}
              />
              <KPI
                title="Collection Rate"
                value={<AnimatedNumber value={colRate} suffix="%" />}
                icon="bi bi-percent"
                color="kpi-blue"
                trend={{ direction: 'up', value: '15.3%' }}
              />
            </div>


            {/* CHARTS */}
            <div className="analytics-grid">
              <div className="chart-card small-card" style={{ textAlign: 'center' }}>
                <h3>Occupancy Rate</h3>

                <div style={{ position: 'relative', margin: '30px auto 0' }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Occupied", value: occupancyRate, fill: "#6366f1" },
                          { name: "Vacant", value: 100 - occupancyRate, fill: "#e5e7eb" },
                        ].filter(d => d.value > 0)}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        innerRadius={isMobile ? 45 : 55}
                        outerRadius={isMobile ? 65 : 75}
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
                  <h3 style={{ margin: 0 }}>
                    {chartMetric === "COLLECTED" ? "Collected vs Potential" : "Revenue vs Expense"}
                  </h3>
                  <div className="chart-toggle-wrapper">
                    <button
                      className={`chart-toggle-switch ${chartMetric === "REVENUE_EXPENSE" ? "area" : ""}`}
                      onClick={() => setChartMetric(chartMetric === "COLLECTED" ? "REVENUE_EXPENSE" : "COLLECTED")}
                      aria-label="Toggle Chart Metric"
                    >
                      <span className="chart-toggle-thumb"></span>
                    </button>
                    <span className="chart-toggle-label">
                      {chartMetric === "COLLECTED" ? "View Expenses" : "View Potential"}
                    </span>
                  </div>
                </div>

                {chartData.length === 0 ? (

                  <div className="empty-chart">
                    No revenue data for selected dates
                  </div>

                ) : (

                  <ResponsiveContainer width="100%" height={isMobile ? 260 : 300}>
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
                          tick={{ fontSize: 9 }}
                          tickLine={false}
                          interval={0}
                          angle={-90}
                          textAnchor="end"
                          height={70}
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
                        
                        {chartMetric === "COLLECTED" ? (
                          <>
                            <Tooltip formatter={(v, name) => [`₹${v.toLocaleString()}`, name === "revenue" ? "Collected" : "Potential"]} />
                            <Legend wrapperStyle={{ fontSize: isMobile ? 12 : 14 }} />
                            <Bar dataKey="potential" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={36} />
                            <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={36}>
                              {!isMobile && (
                                <LabelList
                                  dataKey="revenue"
                                  content={({ x, y, width, value, index }) => (
                                    <text
                                      x={x + width / 2}
                                      y={y - (index % 2 === 0 ? 8 : 20)}
                                      textAnchor="middle"
                                      fontSize={10}
                                      fill="#4338ca"
                                      fontWeight={600}
                                    >
                                      {`₹${value}`}
                                    </text>
                                  )}
                                />
                              )}
                            </Bar>
                          </>
                        ) : (
                          <>
                            <Tooltip formatter={(v, name) => [`₹${v.toLocaleString()}`, name === "revenue" ? "Revenue" : "Expense"]} />
                            <Legend wrapperStyle={{ fontSize: isMobile ? 12 : 14 }} />
                            <Bar dataKey="revenue" name="Revenue (₹)" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={36} />
                            <Bar dataKey="expense" name="Expense (₹)" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={36} />
                          </>
                        )}
                      </BarChart>
                  </ResponsiveContainer>

                )}
              </div>

            </div>

            {/* BREAKDOWN CHARTS */}
            {(() => {
              // Revenue Breakdown Data
              const revenueBreakdown = [
                { name: 'Rent Collected', value: 0, color: '#4f46e5' },
                { name: 'Onboarding Rent', value: 0, color: '#fbbf24' },
                { name: 'Deposit Deductions', value: 0, color: '#ef4444' }
              ];

              rentRecords.forEach((rec) => {
                if (rec.status === "PAID" && isDateInFilter(toDate(rec.paidDate))) {
                  revenueBreakdown[0].value += Number(rec.rentAmount || 0);
                }
              });

              residents.forEach((r) => {
                if (isDateInFilter(getRevenueDate(r))) {
                  revenueBreakdown[1].value += Number(r.monthlyRent || 0);
                }
                const checkoutDate = toDate(r.actualCheckoutDate);
                if (isDateInFilter(checkoutDate)) {
                  const damage = Number(r.deposit || 0) - Number(r.refundAmount || 0);
                  if (damage > 0) revenueBreakdown[2].value += damage;
                }
              });

              const totalRevenueBreakdown = revenueBreakdown.reduce((acc, curr) => acc + curr.value, 0);

              // Expense Breakdown Data
              const EXPENSE_COLORS = ['#ef4444', '#4f46e5', '#34d399', '#fbbf24', '#8b5cf6', '#ec4899', '#06b6d4'];
              const expenseDataMap = {};
              expenditures.filter(exp => isDateInFilter(new Date(exp.expenseDate || exp.date))).forEach(exp => {
                const cat = (exp.category || 'Other').replace(/_/g, ' ');
                if (!expenseDataMap[cat]) expenseDataMap[cat] = 0;
                expenseDataMap[cat] += Number(exp.amount || 0);
              });
              
              const expenseBreakdown = Object.keys(expenseDataMap).map((key, i) => ({
                name: key.charAt(0).toUpperCase() + key.slice(1).toLowerCase(),
                value: expenseDataMap[key],
                color: EXPENSE_COLORS[i % EXPENSE_COLORS.length]
              }));
              
              const totalExpenseBreakdown = expenseBreakdown.reduce((acc, curr) => acc + curr.value, 0);

              return (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px', marginTop: '24px', marginBottom: '24px' }}>
                  <DonutBreakdownChart 
                    title="Revenue Breakdown" 
                    data={revenueBreakdown} 
                    totalLabel="Total Revenue" 
                    totalValue={totalRevenueBreakdown} 
                  />
                  <DonutBreakdownChart 
                    title="Expense Breakdown" 
                    data={expenseBreakdown} 
                    totalLabel="Total Expenses" 
                    totalValue={totalExpenseBreakdown} 
                  />
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* ===== EXPENSE HISTORY ===== */}
      {(() => {
        const isAllPgs = expHistoryPgId === 'ALL';

        const filteredExpenses = filteredExpensesForEh;

        const handleDeleteExpense = async (expId) => {
          if (!window.confirm("Are you sure you want to delete this expense?")) return;
          try {
            await api.delete(`/owner/expenses/${expId}`);
            // Refresh expenditures
            const params = selectedPgId === 'ALL' ? {} : { pgId: selectedPgId };
            const res = await api.get('/owner/expenses', { params });
            setExpenditures(Array.isArray(res.data) ? res.data : []);
          } catch (err) {
            console.error('Failed to delete expense', err);
            alert("Failed to delete expense");
          }
        };

        const handleMarkPaid = async (expId) => {
          try {
            setUpdatingStatus(true);
            await api.patch(`/owner/expenses/${expId}/status`, {
              paymentStatus: 'PAID',
              paymentDate: markPaidForm.paymentDate,
              paymentMethod: markPaidForm.paymentMethod,
            });
            // Refresh expenditures
            const params = selectedPgId === 'ALL' ? {} : { pgId: selectedPgId };
            const res = await api.get('/owner/expenses', { params });
            setExpenditures(Array.isArray(res.data) ? res.data : []);
            setMarkingPaidId(null);
          } catch (err) {
            console.error('Failed to mark as paid', err);
          } finally {
            setUpdatingStatus(false);
          }
        };

        const ehActivePgs = isAllPgs ? pgs.length : 1;

        return (
          <div className="expense-history-wrapper">
            <div className="expense-history-top-bar">
              <div className="expense-history-title-box">
                <div className="expense-history-icon">
                  <i className="bi bi-receipt-cutoff"></i>
                </div>
                <div>
                  <h2>Expense History</h2>
                  <p>Track all expenses and payments across your PGs</p>
                </div>
              </div>
              <div className="expense-history-filters">
                <select
                  value={expHistoryPgId}
                  onChange={e => setExpHistoryPgId(e.target.value)}
                  className="eh-filter-select"
                >
                  <option value="ALL">All PGs Summary</option>
                  {pgs.map(pg => (
                    <option key={pg.id} value={pg.id}>{pg.name || pg.pgName}</option>
                  ))}
                </select>
                <select
                  value={expHistoryStatus}
                  onChange={e => setExpHistoryStatus(e.target.value)}
                  className="eh-filter-select"
                >
                  <option value="ALL">All Status</option>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                </select>
                <input
                  type="text"
                  placeholder="Search category, title..."
                  className="eh-filter-input"
                  value={expHistorySearch}
                  onChange={e => setExpHistorySearch(e.target.value)}
                />
              </div>
            </div>

            {/* KPI ROW */}
            <div className="expense-history-kpi-row">
              <div className="eh-kpi-card">
                <div className="eh-kpi-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                  <i className="bi bi-arrow-left-right"></i>
                </div>
                <div className="eh-kpi-info">
                  <p>Total Transactions</p>
                  <h3 style={{ color: '#3b82f6' }}><AnimatedNumber value={ehTotalTxs} /></h3>
                  <span>{isAllPgs ? 'Across all PGs' : 'For selected PG'}</span>
                </div>
              </div>
              <div className="eh-kpi-card">
                <div className="eh-kpi-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>
                  <i className="bi bi-hourglass-split"></i>
                </div>
                <div className="eh-kpi-info">
                  <p>Pending Amount</p>
                  <h3 style={{ color: '#f59e0b' }}><AnimatedNumber prefix="₹" value={ehPendingAmt} /></h3>
                  <span>To be paid</span>
                </div>
              </div>
              <div className="eh-kpi-card">
                <div className="eh-kpi-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
                  <i className="bi bi-check-circle"></i>
                </div>
                <div className="eh-kpi-info">
                  <p>Paid Amount</p>
                  <h3 style={{ color: '#10b981' }}><AnimatedNumber prefix="₹" value={ehPaidAmt} /></h3>
                  <span>Successfully cleared</span>
                </div>
              </div>
              <div className="eh-kpi-card">
                <div className="eh-kpi-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
                  <i className="bi bi-calculator"></i>
                </div>
                <div className="eh-kpi-info">
                  <p>Total Amount</p>
                  <h3 style={{ color: '#ef4444' }}><AnimatedNumber prefix="₹" value={ehTotalAmt} /></h3>
                  <span>Total expenses recorded</span>
                </div>
              </div>
              <div className="eh-kpi-card">
                <div className="eh-kpi-icon" style={{ background: '#f0f9ff', color: '#0ea5e9' }}>
                  <i className="bi bi-building"></i>
                </div>
                <div className="eh-kpi-info">
                  <p>Total PGs</p>
                  <h3 style={{ color: '#0ea5e9' }}>{ehActivePgs}</h3>
                  <span>{isAllPgs ? 'Active PGs' : 'Selected PG'}</span>
                </div>
              </div>
            </div>

            <div className="expense-table-container">
              {isAllPgs ? (
                // --- SUMMARY VIEW (Grouped by PG) ---
                <table className="expense-floating-table">
                  <thead>
                    <tr>
                      <th><i className="bi bi-building"></i> PG NAME</th>
                      <th><i className="bi bi-arrow-left-right"></i> TOTAL TRANSACTIONS</th>
                      <th><i className="bi bi-clock-history"></i> PENDING AMOUNT</th>
                      <th><i className="bi bi-check-circle"></i> PAID AMOUNT</th>
                      <th><i className="bi bi-credit-card"></i> TOTAL AMOUNT</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pgs.length === 0 ? (
                      <tr className="eh-row">
                        <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8' }}>
                          No PGs found.
                        </td>
                      </tr>
                    ) : pgs.map(pg => {
                      const pgExps = filteredExpenses.filter(e => e.pgId === pg.id);
                      if (pgExps.length === 0 && expHistoryStatus !== 'ALL') return null;

                      const totalTxs = pgExps.length;
                      const pendingAmt = pgExps.filter(e => (e.paymentStatus||'').toUpperCase() === 'PENDING').reduce((s, e) => s + (e.amount||0), 0);
                      const paidAmt = pgExps.filter(e => (e.paymentStatus||'').toUpperCase() !== 'PENDING').reduce((s, e) => s + (e.amount||0), 0);
                      const totalAmt = pendingAmt + paidAmt;

                      return (
                        <tr key={pg.id} className="eh-row">
                          <td data-label="PG Name">
                            <div className="eh-pg-name-cell">
                              <div className="eh-avatar">{(pg.name || pg.pgName || 'P').charAt(0).toUpperCase()}</div>
                              {pg.name || pg.pgName}
                            </div>
                          </td>
                          <td data-label="Transactions">{totalTxs}</td>
                          <td data-label="Pending" style={{ color: '#f59e0b', fontWeight: 600 }}>₹{pendingAmt.toLocaleString()}</td>
                          <td data-label="Paid" style={{ color: '#10b981', fontWeight: 600 }}>₹{paidAmt.toLocaleString()}</td>
                          <td data-label="Total" style={{ color: '#ef4444', fontWeight: 700 }}>₹{totalAmt.toLocaleString()}</td>
                          <td data-label="Action">
                            <button
                              className="eh-btn-view"
                              onClick={() => setExpHistoryPgId(pg.id)}
                            >
                              View Details →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                // --- DETAILED VIEW (Transactions for 1 PG) ---
                <table className="expense-floating-table">
                  <thead>
                    <tr>
                      <th><i className="bi bi-calendar"></i> DATE</th>
                      <th><i className="bi bi-tag"></i> CATEGORY</th>
                      <th><i className="bi bi-card-text"></i> DESCRIPTION</th>
                      <th><i className="bi bi-person"></i> PAID TO</th>
                      <th><i className="bi bi-currency-rupee"></i> AMOUNT</th>
                      <th><i className="bi bi-check-circle"></i> STATUS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.length === 0 && (
                      <tr className="eh-row">
                        <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8' }}>
                          No expenses found for this PG.
                        </td>
                      </tr>
                    )}
                    {filteredExpenses
                      .sort((a, b) => new Date(b.expenseDate || b.createdAt) - new Date(a.expenseDate || a.createdAt))
                      .map((exp, i) => {
                      const isPending = (exp.paymentStatus || '').toUpperCase() === 'PENDING';
                      const isMarkingThis = markingPaidId === exp.id;

                      return (
                        <Fragment key={exp.id || i}>
                          <tr className="eh-row">
                            <td data-label="Date">
                              <div className="eh-pg-name-cell">
                                <div className="eh-avatar" style={{ background: '#f1f5f9', color: '#64748b' }}>
                                  <i className="bi bi-calendar-event"></i>
                                </div>
                                {exp.expenseDate ? format(new Date(exp.expenseDate), 'dd MMM yyyy') : '—'}
                              </div>
                            </td>
                            <td data-label="Category">{exp.category || '—'}</td>
                            <td data-label="Description">{exp.title || '—'}</td>
                            <td data-label="Paid To">{exp.paidTo || '—'}</td>
                            <td data-label="Amount" style={{ color: '#ef4444', fontWeight: 600 }}>
                              ₹{Number(exp.amount || 0).toLocaleString()}
                            </td>
                            <td data-label="Status">
                              {isPending
                                ? <span className="rev-status-badge rev-status-pending">Pending</span>
                                : <span className="rev-status-badge rev-status-paid">Paid</span>}
                            </td>
                            <td data-label="Action">
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {isPending && (
                                  <button
                                    onClick={() => setMarkingPaidId(isMarkingThis ? null : exp.id)}
                                    className="eh-btn-view"
                                    style={{ background: isMarkingThis ? '#10b981' : '#ecfdf5', color: isMarkingThis ? '#fff' : '#10b981' }}
                                  >
                                    {isMarkingThis ? 'Cancel' : 'Mark Paid'}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  title="Delete Expense"
                                  style={{
                                    background: 'transparent', border: 'none', color: '#ef4444', 
                                    cursor: 'pointer', padding: '4px', fontSize: '14px'
                                  }}
                                >
                                  <i className="bi bi-trash3"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isMarkingThis && (
                            <tr className="eh-row">
                              <td colSpan="7" style={{ padding: '12px 24px', background: '#f8fffe' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Payment Date:</label>
                                  <input
                                    type="date"
                                    value={markPaidForm.paymentDate}
                                    onChange={e => setMarkPaidForm(f => ({ ...f, paymentDate: e.target.value }))}
                                    className="eh-filter-input"
                                    style={{ width: '160px' }}
                                  />
                                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Method:</label>
                                  <select
                                    value={markPaidForm.paymentMethod}
                                    onChange={e => setMarkPaidForm(f => ({ ...f, paymentMethod: e.target.value }))}
                                    className="eh-filter-select"
                                    style={{ width: 'auto' }}
                                  >
                                    {['CASH','UPI','BANK_TRANSFER','CREDIT_CARD','DEBIT_CARD','CHEQUE','NET_BANKING'].map(m => (
                                      <option key={m} value={m}>{m.replace('_',' ')}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleMarkPaid(exp.id)}
                                    disabled={updatingStatus}
                                    style={{
                                      padding: '7px 18px', borderRadius: '6px', border: 'none',
                                      background: '#10b981', color: '#fff', fontWeight: 700,
                                      fontSize: '13px', cursor: 'pointer',
                                    }}
                                  >
                                    {updatingStatus ? 'Saving...' : 'Confirm Paid'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      })()}

    </DashboardLayout>
  );
};

const KPI = ({ title, value, subtitle, trend, icon, color, onClick }) => (
  <div
    className={`kpi-card ${color || ""}`}
    style={{ cursor: onClick ? "pointer" : "default" }}
    onClick={onClick}
  >
    {icon && (
      <div className="kpi-icon">
        <i className={icon}></i>
      </div>
    )}
    <div className="kpi-content">
      <span className="kpi-title">{title}</span>
      <h2 className="kpi-value">{value}</h2>
      {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
    </div>
  </div>
);
export default OwnerRevenue;