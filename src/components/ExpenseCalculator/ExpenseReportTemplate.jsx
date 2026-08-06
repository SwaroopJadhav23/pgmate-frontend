import React from "react";
import {Doughnut} from "react-chartjs-2";
import {Chart as ChartJS, ArcElement, Tooltip, Legend} from "chart.js";
import pgmateLogo from "../../assets/pgmate-withoutbg.png";

ChartJS.register(ArcElement, Tooltip, Legend);

/* ── Helpers ─────────────────────────────────────────────────── */
const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const pct = (n, total) =>
  total > 0 ? ((n / total) * 100).toFixed(1) + "%" : "0%";
const fmtMonth = (monthStr) => {
  if (!monthStr) return "";
  if (/^\d{4}-\d{2}$/.test(monthStr)) {
    const [year, month] = monthStr.split("-");
    return new Date(year, parseInt(month) - 1).toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }
  return monthStr;
};

const CHART_COLORS = ["#8862e0", "#7ecc5c", "#4e7eeb", "#fc9e42", "#8c8e96"];

/* ── KPI Card ── */
const KpiCard = ({label, value, color, icon, bgColor, borderColor}) => (
  <div
    className="ert-kpi-card"
    style={{borderColor: borderColor || color + "33", background: bgColor}}
  >
    <div className="ert-kpi-label" style={{color}}>
      {label}
    </div>
    <div className="ert-kpi-bottom-row">
      <div className="ert-kpi-icon" style={{background: color}}>
        {icon}
      </div>
      <div className="ert-kpi-value" style={{color}}>
        {value}
      </div>
    </div>
  </div>
);

/* ── Metric Chip ── */
const MetricChip = ({label, value, icon, valueColor}) => (
  <div className="ert-metric-chip">
    <div className="ert-metric-icon">{icon}</div>
    <div>
      <div className="ert-metric-label">{label}</div>
      <div
        className="ert-metric-value"
        style={{color: valueColor || "#1e1b4b"}}
      >
        {value}
      </div>
    </div>
  </div>
);

/* ── Main Component ────────────────────────────────────────────── */
const ExpenseReportTemplate = ({data, id}) => {
  const {
    pgName = "",
    reportMonth = "",
    numRooms = 0,
    totalBeds = 0,
    occupiedBeds = 0,
    // Income
    rentCollected = 0,
    securityReceived = 0,
    parkingCharges = 0,
    laundryCharges = 0,
    otherIncome = 0,
    // Expenses
    foodKitchen = 0,
    staffSalary = 0,
    utilities = 0,
    maintenance = 0,
    miscExpenses = 0,
  } = data || {};

  // ── Computed ──
  const totalIncome = [
    rentCollected,
    securityReceived,
    parkingCharges,
    laundryCharges,
    otherIncome,
  ].reduce((s, v) => s + (parseFloat(v) || 0), 0);

  const expenseItems = [
    {label: "Food & Kitchen", value: parseFloat(foodKitchen) || 0},
    {label: "Staff Salary", value: parseFloat(staffSalary) || 0},
    {label: "Utilities", value: parseFloat(utilities) || 0},
    {label: "Maintenance", value: parseFloat(maintenance) || 0},
    {label: "Miscellaneous", value: parseFloat(miscExpenses) || 0},
  ].filter((e) => e.value > 0);

  const totalExpenses = expenseItems.reduce((s, e) => s + e.value, 0);
  const netProfit = totalIncome - totalExpenses;
  const profitMargin =
    totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0;
  const occupied = parseInt(occupiedBeds) || 1; // prevent /0
  const incomePerBed = Math.round(totalIncome / occupied);
  const expPerBed = Math.round(totalExpenses / occupied);
  const profitPerBed = Math.round(netProfit / occupied);

  // ── Largest expense for insight ──
  const largestExp = expenseItems.reduce(
    (a, b) => (a.value > b.value ? a : b),
    {label: "—", value: 0},
  );

  // ── Chart data (top 5 expenses merged into "Other" if >5) ──
  const chartItems =
    expenseItems.length > 5
      ? [
          ...expenseItems.slice(0, 4),
          {
            label: "Other",
            value: expenseItems.slice(4).reduce((s, e) => s + e.value, 0),
          },
        ]
      : expenseItems.length > 0
        ? expenseItems
        : [{label: "No Data", value: 1}];

  const doughnutData = {
    labels: chartItems.map((e) => e.label),
    datasets: [
      {
        data: chartItems.map((e) => e.value),
        backgroundColor: CHART_COLORS.slice(0, chartItems.length),
        borderWidth: 3,
        borderColor: "#ffffff",
        hoverBorderWidth: 4,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: "60%",
    plugins: {
      legend: {display: false},
      tooltip: {
        callbacks: {
          label: (ctx) =>
            ` ${ctx.label}: ${fmt(ctx.raw)} (${pct(ctx.raw, totalExpenses)})`,
        },
      },
    },
    animation: {animateRotate: true, duration: 600},
  };

  const incomeRows = [
    {label: "Rent Collected", value: parseFloat(rentCollected) || 0},
    {
      label: "Security Deposits (Rec.)",
      value: parseFloat(securityReceived) || 0,
    },
    {label: "Parking Charges", value: parseFloat(parkingCharges) || 0},
    {label: "Laundry Charges", value: parseFloat(laundryCharges) || 0},
    {label: "Other Income", value: parseFloat(otherIncome) || 0},
  ];

  // ── SVG icons (inline so html-to-image renders correctly) ──
      const TrendUpSVG = ({color = "#22c55e"}) => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
  const TrendDownSVG = ({color = "#ef4444"}) => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );
  const WalletSVG = ({color = "#ffffff"}) => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
  const ArrowUpSVG = () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#3611c0"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
  const ArrowDownSVG = () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#dc2626"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
  const PersonSVG = () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#16a34a"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );

  return (
    <div className="ert-wrapper" id={id}>
      {/* ── Header ── */}
      <div className="ert-header">
        <div className="ert-header-left">
          <div className="ert-logo-box">
            <img
              src={pgmateLogo}
              alt="PGMate Logo"
              className="ert-logo-image"
            />
          </div>
        </div>
        <div className="ert-header-center">
          <h1 className="ert-report-title">PG EXPENSE REPORT</h1>
          <div className="ert-report-month">
            — {fmtMonth(reportMonth) || "Month"} —
          </div>
        </div>
        <div className="ert-header-right">
          <div className="ert-pg-name">{pgName || "PG Name"}</div>
          <div className="ert-header-stats">
            {numRooms > 0 && <span>{numRooms} Rooms</span>}
            {numRooms > 0 && totalBeds > 0 && (
              <span className="ert-dot">•</span>
            )}
            {totalBeds > 0 && <span>{totalBeds} Beds</span>}
          </div>
          {occupiedBeds > 0 && (
            <div className="ert-occ-stat">
              Occupied Beds: {occupiedBeds}
              {totalBeds > 0 &&
                ` (${Math.round((parseInt(occupiedBeds) / parseInt(totalBeds)) * 100)}%)`}
            </div>
          )}
        </div>
      </div>

      {/* ── Top divider ── */}
      <div className="ert-header-divider" />

      {/* ── KPI Row ── */}
      <div className="ert-kpi-row">
        <KpiCard
          label="TOTAL INCOME"
          value={fmt(totalIncome)}
          color="#197b1a"
          bgColor="#f6fcf5"
          borderColor="#dcedd9"
          icon={<TrendUpSVG color="#ffffff" />}
        />
        <KpiCard
          label="TOTAL EXPENSES"
          value={fmt(totalExpenses)}
          color="#b41010"
          bgColor="#fff4f4"
          borderColor="#f8dbdb"
          icon={<TrendDownSVG color="#ffffff" />}
        />
        <KpiCard
          label="NET PROFIT"
          value={fmt(netProfit)}
          color="#2331bc"
          bgColor="#f4f6ff"
          borderColor="#d8dffa"
          icon={<WalletSVG color="#ffffff" />}
        />
      </div>

      {/* ── Metrics Row ── */}
      <div className="ert-metrics-row">
        <MetricChip
          label="PROFIT MARGIN"
          value={profitMargin + "%"}
          icon={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#3611c0">
              <path d="M11 2v10h10c0 5.5-4.5 10-10 10S1 17.5 1 12 5.5 2 11 2zm2 0v8h8c0-4.4-3.6-8-8-8z" />
            </svg>
          }
          valueColor="#1a1a2e"
        />
        <MetricChip
          label="INCOME PER OCCUPIED BED"
          value={fmt(incomePerBed)}
          icon={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#3611c0">
              <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z" />
            </svg>
          }
          valueColor="#1a1a2e"
        />
        <MetricChip
          label="EXPENSE PER OCCUPIED BED"
          value={fmt(expPerBed)}
          icon={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill="#3611c0" />
              <path
                d="M12 6v12M8 14l4 4 4-4"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          valueColor="#1a1a2e"
        />
        <MetricChip
          label="PROFIT PER OCCUPIED BED"
          value={fmt(profitPerBed)}
          icon={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill="#3611c0" />
              <path
                d="M12 18V6M8 10l4-4 4 4"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          valueColor="#1a1a2e"
        />
      </div>

      {/* ── Middle Grid (Tables + Chart) ── */}
      <div className="ert-mid-grid">
        {/* Income Summary */}
        <div className="ert-table-card">
          <div className="ert-table-heading">
            <span className="ert-table-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#3611c0">
                <path d="M21 7.28V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.37-1-1.72zM20 9v6h-7V9h7zM5 19V5h14v2h-6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6v2H5z" />
                <circle cx="16.5" cy="12" r="1.5" fill="#3611c0" />
              </svg>
            </span>
            INCOME SUMMARY
          </div>
          <table className="ert-table">
            <thead>
              <tr>
                <th>Income Source</th>
                <th className="text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {incomeRows.map((r, i) => (
                <tr key={i}>
                  <td>{r.label}</td>
                  <td className="text-right">
                    {r.value > 0 ? r.value.toLocaleString("en-IN") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td>TOTAL INCOME</td>
                <td className="text-right">{fmt(totalIncome)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Expense Breakdown Donut */}
        <div className="ert-chart-card">
          <div className="ert-table-heading">EXPENSE BREAKDOWN</div>
          <div className="ert-chart-area">
            <div className="ert-doughnut-wrapper">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
            <div className="ert-chart-legend">
              {chartItems.map((e, i) => (
                <div className="ert-legend-item" key={i}>
                  <span
                    className="ert-legend-dot"
                    style={{background: CHART_COLORS[i % CHART_COLORS.length]}}
                  />
                  <span className="ert-legend-label">
                    {e.label}
                    <br />
                    <strong>
                      {fmt(e.value)} ({pct(e.value, totalExpenses)})
                    </strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expense Summary */}
        <div className="ert-table-card">
          <div className="ert-table-heading">
            <span className="ert-table-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#3611c0">
                <rect x="2" y="2" width="20" height="20" rx="4" />
                <path
                  d="M6 8h12M6 12h12M6 16h12"
                  stroke="#fff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            EXPENSE SUMMARY
          </div>
          <table className="ert-table ert-expense-summary-table">
            <thead>
              <tr>
                <th>Category</th>
                <th className="text-center">Amount (₹)</th>
                <th className="text-center">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {expenseItems.length > 0 ? (
                expenseItems.map((e, i) => (
                  <tr key={i}>
                    <td>{e.label}</td>
                    <td className="text-center">
                      {e.value.toLocaleString("en-IN")}
                    </td>
                    <td className="text-center">
                      {pct(e.value, totalExpenses)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center text-muted">
                    No expenses entered
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td>TOTAL EXPENSES</td>
                <td className="text-center">
                  <strong>{fmt(totalExpenses)}</strong>
                </td>
                <td className="text-center">
                  <strong>100%</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Per Bed Analysis */}
        <div className="ert-perbed-card">
          <div className="ert-table-heading">
            PER BED ANALYSIS{" "}
            <span className="ert-perbed-tag">
              (Occupied Beds - {occupiedBeds || 0})
            </span>
          </div>
          <div className="ert-perbed-rows">
            <div className="ert-perbed-row green">
              <span className="ert-perbed-icon-box">
                <PersonSVG />
              </span>{" "}
              Income per Occupied Bed
              <span className="ert-perbed-val green-val">
                {fmt(incomePerBed)}
              </span>
            </div>
            <div className="ert-perbed-row red">
              <span className="ert-perbed-icon-box">
                <ArrowDownSVG />
              </span>{" "}
              Expense per Occupied Bed
              <span className="ert-perbed-val red-val">{fmt(expPerBed)}</span>
            </div>
            <div className="ert-perbed-row blue">
              <span className="ert-perbed-icon-box">
                <ArrowUpSVG />
              </span>{" "}
              Profit per Occupied Bed
              <span className="ert-perbed-val blue-val">
                {fmt(profitPerBed)}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* ── Top Insights ── */}
      <div className="ert-insights-section">
        <div className="ert-insights-heading">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3611c0"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5" />
            <path d="M9 18h6" />
            <path d="M10 22h4" />
          </svg>
          TOP INSIGHTS
        </div>
        <div className="ert-insights-grid">
          <div className="ert-insight-card">
            <div className="ert-insight-icon-box">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3611c0"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
            <div className="ert-insight-text">
              <div className="ert-insight-title">Largest Expense</div>
              <div className="ert-insight-desc">
                {largestExp.label} is your largest expense at{" "}
                {fmt(largestExp.value)}
                {totalExpenses > 0
                  ? ` (${pct(largestExp.value, totalExpenses)} of total expenses)`
                  : ""}
                .
              </div>
            </div>
          </div>

          <div className="ert-insight-card">
            <div className="ert-insight-icon-box">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3611c0"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div className="ert-insight-text">
              <div className="ert-insight-title">Electricity Cost</div>
              <div className="ert-insight-desc">
                Electricity cost per tenant is{" "}
                {occupied > 0
                  ? fmt(Math.round((parseFloat(utilities) || 0) / occupied))
                  : "₹0"}
                .
              </div>
            </div>
          </div>

          <div className="ert-insight-card">
            <div className="ert-insight-icon-box">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3611c0"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div className="ert-insight-text">
              <div className="ert-insight-title">Average Food Cost</div>
              <div className="ert-insight-desc">
                Average food cost per resident is{" "}
                {occupied > 0
                  ? fmt(Math.round((parseFloat(foodKitchen) || 0) / occupied))
                  : "₹0"}
                .
              </div>
            </div>
          </div>

          <div className="ert-insight-card">
            <div className="ert-insight-icon-box">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3611c0"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <div className="ert-insight-text">
              <div className="ert-insight-title">Profit Margin</div>
              <div className="ert-insight-desc">
                Your profit margin is {profitMargin}%
                {parseFloat(profitMargin) >= 30
                  ? " which is healthy."
                  : parseFloat(profitMargin) >= 0
                    ? " which is moderate."
                    : " which is a loss."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="ert-footer">
        <div className="ert-footer-content">
          <div className="ert-footer-text-center">
            <span className="ert-footer-created-by">Created by</span>
            <img
              src={pgmateLogo}
              alt="PGMate Logo"
              className="ert-footer-logo"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseReportTemplate;
