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
  BarChart2
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
  chartData
}, ref) => {
  const ownerProfile = JSON.parse(localStorage.getItem("ownerProfile") || "{}");
  
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

  // We add a tiny bit of dummy data if chartData is empty so it doesn't break
  const safeChartData = chartData && chartData.length > 0 ? chartData : [
    { date: 'Jan', revenue: 0, potential: 0 }
  ];

  return (
    <div className="revenue-export-template-wrapper" ref={ref}>
      {/* HEADER */}
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

      {/* BILL TO & TOTAL SUMMARY */}
      <div className="ret-section-container">
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
      <div className="ret-overview-section">
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
      <div className="ret-analytics-grid">
        <div className="ret-analytics-card">
          <div className="ret-analytics-title">Occupancy Rate</div>
          <div className="ret-donut-container">
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
                  isAnimationActive={false} // CRITICAL FOR HTML2PDF
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
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={safeChartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
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
                    // Approximate width based on value length (e.g. ₹71100 = 6 chars * ~4.5px = ~27px)
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

      {/* FOOTER */}
      <div className="ret-footer">
        <div className="ret-footer-text">
          <div className="ret-footer-icon"><Info size={20} /></div>
          <div>
            <div style={{ color: '#111827', fontWeight: '600', marginBottom: '2px' }}>This is a system generated report.</div>
            <div>For any queries, please contact your administrator.</div>
          </div>
        </div>
        <div className="ret-stamp">
          <div className="ret-stamp-inner" style={{ flexDirection: 'column', lineHeight: '1.2' }}>
            <span>FINANCIAL</span>
            <span>REPORT</span>
          </div>
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100">
            {/* Top arc for PGMATE - smaller radius as text grows outward */}
            <path id="curveTop" d="M 15 50 A 35 35 0 0 1 85 50" fill="transparent" />
            {/* Bottom arc for PGMATE - larger radius as text grows inward */}
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
    </div>
  );
});

export default RevenueExportTemplate;
