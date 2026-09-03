import React, { forwardRef } from 'react';
import './RevenueExportTemplate.css';
import {
  TrendingUp,
  Wallet,
  Lock,
  RefreshCcw,
  Home,
  TrendingDown,
  Hourglass,
  Percent,
  Info,
  BarChart2,
  Calendar,
  Receipt,
  CheckCircle,
  FileText
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LabelList
} from 'recharts';
import logo from '../../../assets/PGMate.png';

const RevenueExportTemplate = forwardRef(({
  invoiceNo,
  invoiceDate,
  dateRange,
  pgDetails,
  summary,
  overview,
  occupancyRate,
  chartData,
  breakdownData,
  expenseHistoryExport
}, ref) => {
  const ownerProfile = JSON.parse(localStorage.getItem("ownerProfile") || "{}");
  const generatedBy = ownerProfile?.name || 'Admin';
  
  const isAll = pgDetails?.name === 'Owner Dashboard';
  const displayName = isAll ? (ownerProfile?.name ? `${ownerProfile.name}'s Properties` : 'All Properties') : pgDetails?.name;
  
  const displayAddress = isAll 
    ? 'Multiple Properties' 
    : (pgDetails?.address 
        ? `${pgDetails.address}${pgDetails.locality ? `, ${pgDetails.locality}` : ''}${pgDetails.city ? `, ${pgDetails.city}` : ''}`
        : 'Address Not Available');

  const displayPhone = ownerProfile?.phone || 'Not Available';
  const displayEmail = ownerProfile?.email || 'Not Available';

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;
  const vacantRate = Math.max(0, 100 - (occupancyRate || 0));

  const pieData = [
    { name: 'Occupied', value: occupancyRate || 0, color: '#4338ca' },
    { name: 'Vacant', value: vacantRate, color: '#e5e7eb' }
  ];

  const safeChartData = chartData && chartData.length > 0 ? chartData : [
    { date: 'Jan', revenue: 0, potential: 0, expense: 0 }
  ];

  const renderHeader = () => (
    <div className="ret-header">
      <div className="ret-logo-section">
        <div className="ret-logo" style={{ marginBottom: '5px' }}>
          <img src={logo} alt="PGMate Logo" style={{ height: '60px', objectFit: 'contain' }} />
        </div>
        <h1 className="ret-title">REVENUE AND EXPENDITURE INVOICE</h1>
        <p className="ret-subtitle" style={{ marginTop: '4px' }}>Your complete financial snapshot</p>
      </div>
      <div className="ret-invoice-details">
        <div className="ret-invoice-row">
          <div className="ret-invoice-label">INVOICE NO.</div>
          <div className="ret-invoice-colon">:</div>
          <div className="ret-invoice-value">{invoiceNo}</div>
        </div>
        <div className="ret-invoice-row">
          <div className="ret-invoice-label">INVOICE DATE</div>
          <div className="ret-invoice-colon">:</div>
          <div className="ret-invoice-value">{invoiceDate}</div>
        </div>
        <div className="ret-invoice-row" style={{ marginBottom: 0 }}>
          <div className="ret-invoice-label" style={{ borderBottom: 'none' }}>DATE RANGE</div>
          <div className="ret-invoice-colon" style={{ borderBottom: 'none' }}>:</div>
          <div className="ret-invoice-value" style={{ borderBottom: 'none' }}>{dateRange}</div>
        </div>
      </div>
    </div>
  );

  const renderFooter = (pageNo, totalPages) => (
    <div className="ret-footer">
      <div className="ret-footer-body">
        <div className="ret-notes-box">
          <div className="ret-notes-title"><Calendar size={12} /> <span>NOTES</span></div>
          <ul className="ret-notes-content">
            <li><span>This invoice is system generated and does not require a signature.</span></li>
            <li><span>For any queries, please contact your administrator.</span></li>
          </ul>
        </div>
        <div className="ret-stamp">
          <div className="ret-stamp-inner" style={{ flexDirection: 'column', lineHeight: '1.2' }}>
            <span>FINANCIAL</span>
            <span>REPORT</span>
          </div>
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100">
            <path id="curveTop" d="M 15 50 A 35 35 0 0 1 85 50" fill="transparent" />
            <path id="curveBottom" d="M 7 50 A 43 43 0 0 0 93 50" fill="transparent" />
            <text style={{ fontSize: '10px', fontWeight: 'bold', fill: '#4338ca', letterSpacing: '1px' }}>
              <textPath href="#curveTop" startOffset="50%" textAnchor="middle">PGMATE</textPath>
            </text>
            <text style={{ fontSize: '10px', fontWeight: 'bold', fill: '#4338ca', letterSpacing: '1px' }}>
              <textPath href="#curveBottom" startOffset="50%" textAnchor="middle">PGMATE</textPath>
            </text>
            <text x="11" y="53.5" textAnchor="middle" style={{ fontSize: '11px', fill: '#4338ca' }}>★</text>
            <text x="89" y="53.5" textAnchor="middle" style={{ fontSize: '11px', fill: '#4338ca' }}>★</text>
          </svg>
        </div>
      </div>
      <div className="ret-footer-line">
        <div className="ret-footer-thanks">Thank you for your business!</div>
        <div className="ret-footer-pagination">Page {pageNo} of {totalPages}</div>
      </div>
    </div>
  );

  const renderCustomDonut = (title, data, totalLabel, totalValue) => {
    return (
      <div className="ret-breakdown-card">
        <div className="ret-bd-title" style={{ marginBottom: '15px' }}>{title}</div>
        <div className="ret-breakdown-body">
          <div className="ret-donut-svg-container">
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={false}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="ret-donut-center-text">
              <div className="ret-donut-val">{formatCurrency(totalValue)}</div>
              <div className="ret-donut-lbl">{totalLabel}</div>
            </div>
          </div>
          <div className={`ret-breakdown-legend ${data.length > 4 ? 'grid-layout' : 'list-layout'}`}>
            {data.map((item, idx) => {
              const perc = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : 0;
              return (
                <div key={idx} className="ret-bd-legend-item">
                  <div className="ret-bd-legend-header">
                    <div className="ret-bd-legend-dot" style={{ background: item.color }}></div>
                    <div className="ret-bd-legend-name">{item.name}</div>
                  </div>
                  <div className="ret-bd-legend-vals">
                    <span className="ret-bd-perc">{perc}%</span>
                    <span className="ret-bd-amt">{formatCurrency(item.value)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ── Row chunking for Expense History ──────────────────────────────────
  const isAllPgs = expenseHistoryExport?.isAllPgs;
  const ROWS_PAGE2 = isAllPgs ? 3 : 6;       // rows that fit on page 2 (after charts & KPIs)
  const ROWS_PER_PAGE = isAllPgs ? 12 : 20;  // rows per continuation page

  const allEhRows = expenseHistoryExport?.rows || [];
  const page2Rows = allEhRows.slice(0, ROWS_PAGE2);
  const remainingRows = allEhRows.slice(ROWS_PAGE2);

  // Chunk remaining rows into groups of ROWS_PER_PAGE for extra pages
  const extraPageChunks = [];
  for (let i = 0; i < remainingRows.length; i += ROWS_PER_PAGE) {
    extraPageChunks.push(remainingRows.slice(i, i + ROWS_PER_PAGE));
  }
  // Base = 2 (pages 1 & 2) + extra pages
  const totalPages = 2 + extraPageChunks.length;

  // Helper: renders the expense table with given rows
  const renderExpenseTable = (rows) => (
    <div className="ret-eh-table-container">
      <table className="ret-eh-table">
        <thead>
          {expenseHistoryExport?.isAllPgs ? (
            <tr>
              <th>PG NAME</th>
              <th>TOTAL TRANSACTIONS</th>
              <th>PENDING AMOUNT</th>
              <th>PAID AMOUNT</th>
              <th>TOTAL AMOUNT</th>
            </tr>
          ) : (
            <tr>
              <th style={{ textAlign: 'left' }}>DATE</th>
              <th>CATEGORY</th>
              <th>EXPENSE TITLE</th>
              <th>PAID TO</th>
              <th>STATUS</th>
              <th>AMOUNT</th>
            </tr>
          )}
        </thead>
        <tbody>
          {rows.map((row) => (
            expenseHistoryExport?.isAllPgs ? (
              <tr key={row.id}>
                <td>
                  <div className="ret-eh-pg-name">
                    <div className="ret-eh-pg-avatar"><span>{row.name.charAt(0).toUpperCase()}</span></div>
                    <span>{row.name}</span>
                  </div>
                </td>
                <td>{row.totalTxs}</td>
                <td style={{ color: '#d97706', fontWeight: 500 }}>{formatCurrency(row.pendingAmt)}</td>
                <td style={{ color: '#059669', fontWeight: 500 }}>{formatCurrency(row.paidAmt)}</td>
                <td style={{ color: '#be123c', fontWeight: 600 }}>{formatCurrency(row.totalAmt)}</td>
              </tr>
            ) : (
              <tr key={row.id}>
                <td style={{ textAlign: 'left' }}>{row.date ? new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                <td style={{ textTransform: 'capitalize' }}>{row.category}</td>
                <td>{row.title}</td>
                <td>{row.paidTo}</td>
                <td>
                  <span className={`ret-eh-status-badge ${row.status === 'PAID' ? 'paid' : 'pending'}`}>
                    {row.status}
                  </span>
                </td>
                <td style={{ color: '#be123c', fontWeight: 600 }}>{formatCurrency(row.amount)}</td>
              </tr>
            )
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="revenue-export-template-wrapper" ref={ref}>
      {/* PAGE 1 */}
      <div className="ret-page">
        {renderHeader()}
        
        {/* BILL TO & TOTAL SUMMARY */}
        <div className="ret-section-container" style={{ marginTop: '15px' }}>
          <div className="ret-bill-to">
            <div className="ret-section-title">BILL TO</div>
            <div className="ret-bill-title">{displayName}</div>
            <div className="ret-bill-address">
              {displayAddress}
            </div>
            <div className="ret-bill-contact">
              <div>Phone: {displayPhone}</div>
              <div style={{ marginTop: '5px' }}>Email: {displayEmail}</div>
            </div>
          </div>

          <div className="ret-total-summary">
            <div className="ret-summary-header">TOTAL SUMMARY</div>
            <div className="ret-summary-body">
              <div className="ret-summary-main">
                <div className="ret-summary-amount">{formatCurrency(summary.totalRevenue)}</div>
                <div className="ret-summary-label">Total Revenue</div>
              </div>
              <div className="ret-summary-stats">
                <div className="ret-stat-row">
                  <span className="ret-stat-label">Total Expenses</span>
                  <span className="ret-stat-val">{formatCurrency(summary.totalExpenses)}</span>
                </div>
                <div className="ret-stat-row">
                  <span className="ret-stat-label">Total Overdue</span>
                  <span className="ret-stat-val">{formatCurrency(summary.totalOverdue)}</span>
                </div>
                <div className="ret-stat-row">
                  <span className="ret-stat-label">Collection Rate</span>
                  <span className="ret-stat-val">{summary.collectionRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* OVERVIEW */}
        <div className="ret-overview-section" style={{ marginTop: '15px', marginBottom: '15px' }}>
          <div className="ret-overview-title">
            <BarChart2 size={16} /> OVERVIEW
          </div>
          <div className="ret-overview-grid">
            <div className="ret-card">
              <div className="ret-icon-box" style={{ background: '#10b981' }}><TrendingUp size={20} /></div>
              <div className="ret-card-content">
                <div className="ret-card-label">Total Revenue</div>
                <div className="ret-card-value">{formatCurrency(overview.totalRevenue)}</div>
              </div>
            </div>
            <div className="ret-card">
              <div className="ret-icon-box" style={{ background: '#3b82f6' }}><Wallet size={20} /></div>
              <div className="ret-card-content">
                <div className="ret-card-label">Rent Collected</div>
                <div className="ret-card-value">{formatCurrency(overview.rentCollected)}</div>
              </div>
            </div>
            <div className="ret-card">
              <div className="ret-icon-box" style={{ background: '#10b981' }}><Lock size={20} /></div>
              <div className="ret-card-content">
                <div className="ret-card-label">Deposit Held</div>
                <div className="ret-card-value">{formatCurrency(overview.depositHeld)}</div>
              </div>
            </div>
            <div className="ret-card">
              <div className="ret-icon-box" style={{ background: '#ef4444' }}><RefreshCcw size={20} /></div>
              <div className="ret-card-content">
                <div className="ret-card-label">Future Deposit Refund</div>
                <div className="ret-card-value">{formatCurrency(overview.futureRefund)}</div>
              </div>
            </div>
            <div className="ret-card">
              <div className="ret-icon-box" style={{ background: '#8b5cf6' }}><Home size={20} /></div>
              <div className="ret-card-content">
                <div className="ret-card-label">Potential Revenue</div>
                <div className="ret-card-value">{formatCurrency(overview.potentialRevenue)}</div>
              </div>
            </div>
            <div className="ret-card">
              <div className="ret-icon-box" style={{ background: '#ef4444' }}><TrendingDown size={20} /></div>
              <div className="ret-card-content">
                <div className="ret-card-label">Total Expenses</div>
                <div className="ret-card-value">{formatCurrency(overview.totalExpenses)}</div>
              </div>
            </div>
            <div className="ret-card">
              <div className="ret-icon-box" style={{ background: '#f59e0b' }}><Hourglass size={20} /></div>
              <div className="ret-card-content">
                <div className="ret-card-label">Total Overdue</div>
                <div className="ret-card-value">{formatCurrency(overview.totalOverdue)}</div>
              </div>
            </div>
            <div className="ret-card">
              <div className="ret-icon-box" style={{ background: '#6366f1' }}><Percent size={20} /></div>
              <div className="ret-card-content">
                <div className="ret-card-label">Collection Rate</div>
                <div className="ret-card-value">{overview.collectionRate}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* ANALYTICS */}
        <div className="ret-overview-title">
          <TrendingUp size={16} /> ANALYTICS
        </div>
        <div className="ret-analytics-grid" style={{ marginBottom: '15px' }}>
          <div className="ret-analytics-card">
            <div className="ret-analytics-title">Occupancy Rate</div>
            <div className="ret-donut-container" style={{ height: '160px', marginTop: 0 }}>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '60px', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: '800', fontSize: '20px', color: '#3b28cc' }}>
                {occupancyRate || 0}%
              </div>
              <div className="ret-donut-legend">
                <div className="ret-donut-legend-item">
                  <div className="ret-donut-legend-header">
                    <span className="ret-donut-dot" style={{ background: '#3b28cc' }}></span>
                    <span className="ret-donut-legend-text">Occupied</span>
                  </div>
                  <div className="ret-donut-legend-val">{occupancyRate || 0}%</div>
                </div>
                <div className="ret-donut-legend-item">
                  <div className="ret-donut-legend-header">
                    <span className="ret-donut-dot" style={{ background: '#d1d5db' }}></span>
                    <span className="ret-donut-legend-text">Vacant</span>
                  </div>
                  <div className="ret-donut-legend-val">{vacantRate}%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="ret-analytics-card">
            <div className="ret-analytics-title">COLLECTED VS POTENTIAL</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={safeChartData} margin={{ top: 15, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#e5e7eb" />
                <XAxis dataKey="date" axisLine={true} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} dy={10} stroke="#d1d5db" />
                <YAxis axisLine={true} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(value) => `₹${value}`} stroke="#d1d5db" />
                <Tooltip cursor={{ fill: 'transparent' }} isAnimationActive={false} />
                <Legend 
                  iconType="square" 
                  wrapperStyle={{ fontSize: 11, marginTop: '20px', fontWeight: 600 }} 
                  formatter={(value) => <span style={{ color: '#4b5563', display: 'inline-block', transform: 'translateY(-7px)' }}>{value}</span>}
                />
                <Bar dataKey="potential" name="potential" fill="#f59e0b" radius={[2, 2, 0, 0]} barSize={9} isAnimationActive={false} />
                <Bar dataKey="revenue" name="revenue" fill="#3b28cc" radius={[2, 2, 0, 0]} barSize={9} isAnimationActive={false}>
                  <LabelList 
                    dataKey="revenue" 
                    content={(props) => {
                      const { x, y, width, value } = props;
                      if (!value || value <= 0) return null;
                      const textStr = `₹${value}`;
                      const rectWidth = textStr.length * 4.5 + 4; 
                      return (
                        <g transform={`translate(${x + width / 2},${y - 4})`}>
                          <rect x={-rectWidth / 2} y="-9" width={rectWidth} height="11" fill="#ffffff" opacity="0.9" rx="2" />
                          <text x="0" y="0" textAnchor="middle" fill="#3b28cc" fontSize={7.5} fontWeight="700">
                            {textStr}
                          </text>
                        </g>
                      );
                    }} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {renderFooter(1, totalPages)}
      </div>

      <div className="html2pdf__page-break"></div>

      {/* PAGE 2 */}
      <div className="ret-page">
        {renderHeader()}
        
        {/* REVENUE VS EXPENSE BAR CHART */}
        <div className="ret-chart-card">
          <div className="ret-chart-title">REVENUE VS EXPENSE</div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={safeChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#e5e7eb" />
              <XAxis dataKey="date" axisLine={true} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} dy={5} stroke="#d1d5db" />
              <YAxis axisLine={true} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} tickFormatter={(value) => `₹${value}`} stroke="#d1d5db" />
              <Tooltip cursor={{ fill: 'transparent' }} isAnimationActive={false} />
              <Legend 
                iconType="square" 
                wrapperStyle={{ fontSize: 10, marginTop: '10px', fontWeight: 600 }} 
                formatter={(value) => <span style={{ color: '#4b5563', display: 'inline-block', transform: 'translateY(-5px)' }}>{value.charAt(0).toUpperCase() + value.slice(1)} (₹)</span>}
              />
              <Bar dataKey="revenue" fill="#3b28cc" radius={[2, 2, 0, 0]} barSize={12} isAnimationActive={false} />
              <Bar dataKey="expense" fill="#ef4444" radius={[2, 2, 0, 0]} barSize={12} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* BREAKDOWN DONUTS */}
        {breakdownData && (
          <div className="ret-breakdowns-container">
            {renderCustomDonut("Revenue Breakdown", breakdownData.revenueBreakdown, "Total Revenue", breakdownData.totalRevenueBreakdown)}
            {renderCustomDonut("Expense Breakdown", breakdownData.expenseBreakdown, "Total Expenses", breakdownData.totalExpenseBreakdown)}
          </div>
        )}

        {/* EXPENSE HISTORY — KPIs + first chunk of rows on page 2 */}
        {expenseHistoryExport && (
          <div className="ret-eh-section">
            <div className="ret-eh-header-row">
              <div className="ret-eh-title"><Receipt size={14} /> EXPENSE HISTORY</div>
            </div>
            <div className="ret-eh-kpis">
              <div className="ret-eh-kpi-card">
                <div className="ret-eh-kpi-icon"><Receipt size={16} /></div>
                <div className="ret-eh-kpi-content">
                  <div className="ret-eh-kpi-label">TOTAL TRANSACTIONS</div>
                  <div className="ret-eh-kpi-val txs">{expenseHistoryExport.kpis.totalTxs}</div>
                  <div className="ret-eh-kpi-sub">Across all PGs</div>
                </div>
              </div>
              <div className="ret-eh-kpi-card">
                <div className="ret-eh-kpi-icon pending"><Hourglass size={16} /></div>
                <div className="ret-eh-kpi-content">
                  <div className="ret-eh-kpi-label">PENDING AMOUNT</div>
                  <div className="ret-eh-kpi-val pending">{formatCurrency(expenseHistoryExport.kpis.pendingAmt)}</div>
                  <div className="ret-eh-kpi-sub">To be paid</div>
                </div>
              </div>
              <div className="ret-eh-kpi-card">
                <div className="ret-eh-kpi-icon paid"><CheckCircle size={16} /></div>
                <div className="ret-eh-kpi-content">
                  <div className="ret-eh-kpi-label">PAID AMOUNT</div>
                  <div className="ret-eh-kpi-val paid">{formatCurrency(expenseHistoryExport.kpis.paidAmt)}</div>
                  <div className="ret-eh-kpi-sub">Successfully cleared</div>
                </div>
              </div>
              <div className="ret-eh-kpi-card">
                <div className="ret-eh-kpi-icon total"><FileText size={16} /></div>
                <div className="ret-eh-kpi-content">
                  <div className="ret-eh-kpi-label">TOTAL AMOUNT</div>
                  <div className="ret-eh-kpi-val total">{formatCurrency(expenseHistoryExport.kpis.totalAmt)}</div>
                  <div className="ret-eh-kpi-sub">Total expenses recorded</div>
                </div>
              </div>
            </div>
            
            {/* First chunk of table rows */}
            {page2Rows.length > 0 && renderExpenseTable(page2Rows)}
          </div>
        )}

        {renderFooter(2, totalPages)}
      </div>

      {/* PAGE 3, 4, ... — Expense History continuation */}
      {extraPageChunks.map((chunk, chunkIdx) => (
        <React.Fragment key={`extra-page-${chunkIdx}`}>
          <div className="html2pdf__page-break"></div>
          <div className="ret-page">
            {renderHeader()}
            <div className="ret-eh-section" style={{ marginTop: '10px' }}>
              <div className="ret-eh-header-row">
                <div className="ret-eh-title"><Receipt size={14} /> EXPENSE HISTORY (Continued)</div>
              </div>
              {renderExpenseTable(chunk)}
            </div>
            {renderFooter(3 + chunkIdx, totalPages)}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
});

export default RevenueExportTemplate;
