import { saveAs } from 'file-saver';

// Helper: Convert URL or imported image to Base64 data URI for offline Word compatibility
const getBase64FromUrl = async (url) => {
  if (!url) return null;
  if (typeof url === 'string' && url.startsWith('data:')) return url;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
};

export const exportRevenueWord = async ({
  invoiceNo,
  invoiceDate,
  dateRange,
  pgDetails,
  summary = {},
  overview = {},
  occupancyRate = 0,
  chartData = [],
  breakdownData = null,
  expenseHistoryExport = null,
  logoUrl = null,
}) => {
  const ownerProfile = JSON.parse(localStorage.getItem('ownerProfile') || '{}');

  const isAll = pgDetails?.name === 'Owner Dashboard';
  const displayName = isAll
    ? ownerProfile?.name
      ? `${ownerProfile.name}'s Properties`
      : 'All Properties'
    : pgDetails?.name || 'Property';

  const displayAddress = isAll
    ? 'Multiple Properties'
    : pgDetails?.address
    ? `${pgDetails.address}${pgDetails.locality ? `, ${pgDetails.locality}` : ''}${
        pgDetails.city ? `, ${pgDetails.city}` : ''
      }`
    : 'Address Not Available';

  const displayPhone = ownerProfile?.phone || 'Not Available';
  const displayEmail = ownerProfile?.email || 'Not Available';

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;
  const vacantRate = Math.max(0, 100 - (occupancyRate || 0));

  const safeChartData =
    chartData && chartData.length > 0
      ? chartData
      : [{ date: 'Current', revenue: 0, potential: 0, expense: 0 }];

  // Convert logo to base64 if available
  const logoBase64 = await getBase64FromUrl(logoUrl);

  // Status badge styling helper for Word
  const getStatusBadgeHtml = (status) => {
    const s = (status || '').toUpperCase();
    let bg = '#dcfce7';
    let color = '#15803d';
    let text = 'PAID';

    if (s === 'PENDING') {
      bg = '#fef3c7';
      color = '#b45309';
      text = 'PENDING';
    } else if (s === 'PARTIALLY_PAID') {
      bg = '#e0f2fe';
      color = '#0369a1';
      text = 'PARTIALLY PAID';
    } else if (s === 'CANCELLED') {
      bg = '#f3f4f6';
      color = '#4b5563';
      text = 'CANCELLED';
    }

    return `<span style="background-color: ${bg}; color: ${color}; padding: 3px 8px; border-radius: 4px; font-size: 8pt; font-weight: bold; display: inline-block;">${text}</span>`;
  };

  // Build Revenue Breakdown Rows
  const revenueBreakdownRows =
    breakdownData?.revenueBreakdown?.map((item) => {
      const total = breakdownData.totalRevenueBreakdown || 0;
      const perc = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
      return `
        <tr>
          <td style="padding: 6px 10px; border-bottom: 1px solid #f1f5f9; font-size: 9pt;">
            <span style="display:inline-block; width:8px; height:8px; background-color:${item.color || '#3b82f6'}; border-radius:50%; margin-right:6px;"></span>
            ${item.name}
          </td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #f1f5f9; text-align: center; font-size: 9pt; color: #64748b;">${perc}%</td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 9pt; font-weight: 600; color: #111827;">${formatCurrency(item.value)}</td>
        </tr>
      `;
    }).join('') || '<tr><td colspan="3" style="text-align:center; padding:10px; color:#94a3b8;">No revenue breakdown recorded</td></tr>';

  // Build Expense Breakdown Rows
  const expenseBreakdownRows =
    breakdownData?.expenseBreakdown?.map((item) => {
      const total = breakdownData.totalExpenseBreakdown || 0;
      const perc = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
      return `
        <tr>
          <td style="padding: 6px 10px; border-bottom: 1px solid #f1f5f9; font-size: 9pt;">
            <span style="display:inline-block; width:8px; height:8px; background-color:${item.color || '#ef4444'}; border-radius:50%; margin-right:6px;"></span>
            ${item.name}
          </td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #f1f5f9; text-align: center; font-size: 9pt; color: #64748b;">${perc}%</td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 9pt; font-weight: 600; color: #111827;">${formatCurrency(item.value)}</td>
        </tr>
      `;
    }).join('') || '<tr><td colspan="3" style="text-align:center; padding:10px; color:#94a3b8;">No expense breakdown recorded</td></tr>';

  // Build Collected vs Potential Chart Table Rows
  const collectedVsPotentialRows = safeChartData.map((item) => {
    const colRate = item.potential > 0 ? Math.round((item.revenue / item.potential) * 100) : 0;
    return `
      <tr>
        <td style="padding: 6px 10px; border-bottom: 1px solid #f1f5f9; font-size: 9pt; font-weight: 600; color: #1e293b;">${item.date}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 9pt; color: #f59e0b; font-weight: 500;">${formatCurrency(item.potential)}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 9pt; color: #3b28cc; font-weight: 600;">${formatCurrency(item.revenue)}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 9pt; color: #059669; font-weight: 600;">${colRate}%</td>
      </tr>
    `;
  }).join('');

  // Build Revenue vs Expense Chart Table Rows
  const revenueVsExpenseRows = safeChartData.map((item) => {
    const net = (item.revenue || 0) - (item.expense || 0);
    const netColor = net >= 0 ? '#059669' : '#be123c';
    return `
      <tr>
        <td style="padding: 6px 10px; border-bottom: 1px solid #f1f5f9; font-size: 9pt; font-weight: 600; color: #1e293b;">${item.date}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 9pt; color: #3b28cc; font-weight: 600;">${formatCurrency(item.revenue)}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 9pt; color: #ef4444; font-weight: 600;">${formatCurrency(item.expense)}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 9pt; color: ${netColor}; font-weight: 700;">${formatCurrency(net)}</td>
      </tr>
    `;
  }).join('');

  // Build Expense History Table Rows
  const isAllPgs = expenseHistoryExport?.isAllPgs;
  const ehRows = expenseHistoryExport?.rows || [];

  let expenseHistoryTableHtml = '';
  if (isAllPgs) {
    const rowsHtml = ehRows.length > 0 ? ehRows.map((row) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 9pt; font-weight: 600; color: #0f172a;">${row.name}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 9pt; color: #475569;">${row.totalTxs}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 9pt; color: #d97706; font-weight: 500;">${formatCurrency(row.pendingAmt)}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 9pt; color: #059669; font-weight: 500;">${formatCurrency(row.paidAmt)}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 9.5pt; color: #be123c; font-weight: 700;">${formatCurrency(row.totalAmt)}</td>
      </tr>
    `).join('') : '<tr><td colspan="5" style="text-align:center; padding:15px; color:#94a3b8;">No PG expenses recorded</td></tr>';

    expenseHistoryTableHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 10px; border: 1px solid #e2e8f0;">
        <thead>
          <tr style="background-color: #3b28cc; color: #ffffff;">
            <th style="padding: 9px 10px; text-align: left; font-size: 8.5pt; font-weight: 700; letter-spacing: 0.5px;">PG NAME</th>
            <th style="padding: 9px 10px; text-align: center; font-size: 8.5pt; font-weight: 700; letter-spacing: 0.5px;">TRANSACTIONS</th>
            <th style="padding: 9px 10px; text-align: right; font-size: 8.5pt; font-weight: 700; letter-spacing: 0.5px;">PENDING AMOUNT</th>
            <th style="padding: 9px 10px; text-align: right; font-size: 8.5pt; font-weight: 700; letter-spacing: 0.5px;">PAID AMOUNT</th>
            <th style="padding: 9px 10px; text-align: right; font-size: 8.5pt; font-weight: 700; letter-spacing: 0.5px;">TOTAL AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
  } else {
    const rowsHtml = ehRows.length > 0 ? ehRows.map((row) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 9pt; color: #475569;">
          ${row.date ? new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 9pt; text-transform: capitalize; color: #1e293b; font-weight: 500;">
          ${row.category || '-'}
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 9pt; color: #334155;">
          ${row.title || '-'}
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 9pt; color: #64748b;">
          ${row.paidTo || '-'}
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          ${getStatusBadgeHtml(row.status)}
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 9.5pt; color: #be123c; font-weight: 700;">
          ${formatCurrency(row.amount)}
        </td>
      </tr>
    `).join('') : '<tr><td colspan="6" style="text-align:center; padding:15px; color:#94a3b8;">No expense transactions recorded</td></tr>';

    expenseHistoryTableHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 10px; border: 1px solid #e2e8f0;">
        <thead>
          <tr style="background-color: #3b28cc; color: #ffffff;">
            <th style="padding: 9px 10px; text-align: left; font-size: 8.5pt; font-weight: 700; letter-spacing: 0.5px;">DATE</th>
            <th style="padding: 9px 10px; text-align: left; font-size: 8.5pt; font-weight: 700; letter-spacing: 0.5px;">CATEGORY</th>
            <th style="padding: 9px 10px; text-align: left; font-size: 8.5pt; font-weight: 700; letter-spacing: 0.5px;">TITLE</th>
            <th style="padding: 9px 10px; text-align: left; font-size: 8.5pt; font-weight: 700; letter-spacing: 0.5px;">PAID TO</th>
            <th style="padding: 9px 10px; text-align: center; font-size: 8.5pt; font-weight: 700; letter-spacing: 0.5px;">STATUS</th>
            <th style="padding: 9px 10px; text-align: right; font-size: 8.5pt; font-weight: 700; letter-spacing: 0.5px;">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
  }

  // Spacer paragraph for robust Word layout rendering
  const tableSpacer = '<p style="margin: 0; padding: 0; mso-line-height-rule: exactly; font-size: 16pt; line-height: 16pt;">&nbsp;</p>';

  // Full HTML for MS Word
  const htmlDocument = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>Revenue & Expenditure Invoice</title>
    <!--[if gte mso 9]>
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      @page Section1 {
        size: A4 portrait;
        margin: 1.2cm 1.5cm 1.5cm 1.5cm;
        mso-header-margin: 0.5in;
        mso-footer-margin: 0.5in;
        mso-footer: f1;
      }
      div.Section1 {
        page: Section1;
      }
      body {
        font-family: 'Segoe UI', Calibri, Arial, sans-serif;
        color: #1f2937;
        background-color: #ffffff;
        margin: 0;
        padding: 0;
      }
      h1, h2, h3, h4, p { margin: 0; padding: 0; }
      table { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      .page-break { page-break-before: always; mso-special-character: line-break; }
    </style>
  </head>
  <body>
    <div class="Section1">

    <!-- ==================== HEADER ==================== -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 3.5pt solid #6366f1; padding-bottom: 12px; margin-bottom: 20px;">
      <tr>
        <td width="55%" valign="top">
          <div style="margin-bottom: 10px;">
            ${
              logoBase64
                ? `<img src="${logoBase64}" height="46" alt="PGMate Logo" style="display: block; object-fit: contain;"/>`
                : `<div style="font-size: 22pt; font-weight: 800; color: #4338ca;">PGMate</div>`
            }
          </div>
          <div style="font-size: 13.5pt; font-weight: 800; color: #0f172a; letter-spacing: 0.3px; text-transform: uppercase; line-height: 1.25;">
            REVENUE AND EXPENDITURE<br/>INVOICE
          </div>
          <div style="font-size: 8.5pt; color: #6b7280; margin-top: 5px;">
            Your complete financial snapshot
          </div>
        </td>
        <td width="45%" valign="top" align="right">
          <table cellpadding="0" cellspacing="0" style="font-size: 8.5pt; border-collapse: collapse; text-align: left; margin-left: auto; width: 100%; max-width: 280px;">
            <tr>
              <td width="75" valign="top" style="font-weight: 700; color: #374151; border-bottom: 1px solid #e5e7eb; padding: 6px 0; text-transform: uppercase; line-height: 1.3;">
                INVOICE<br/>NO.
              </td>
              <td width="15" valign="top" align="center" style="color: #374151; font-weight: 700; border-bottom: 1px solid #e5e7eb; padding: 6px 0;">:</td>
              <td valign="top" style="color: #0f172a; font-weight: 700; border-bottom: 1px solid #e5e7eb; padding: 6px 0 6px 8px; line-height: 1.3;">
                ${invoiceNo}
              </td>
            </tr>
            <tr>
              <td width="75" valign="top" style="font-weight: 700; color: #374151; border-bottom: 1px solid #e5e7eb; padding: 6px 0; text-transform: uppercase; line-height: 1.3;">
                INVOICE<br/>DATE
              </td>
              <td width="15" valign="top" align="center" style="color: #374151; font-weight: 700; border-bottom: 1px solid #e5e7eb; padding: 6px 0;">:</td>
              <td valign="top" style="color: #0f172a; font-weight: 700; border-bottom: 1px solid #e5e7eb; padding: 6px 0 6px 8px; line-height: 1.3;">
                ${invoiceDate}
              </td>
            </tr>
            <tr>
              <td width="75" valign="top" style="font-weight: 700; color: #374151; padding: 6px 0; text-transform: uppercase; line-height: 1.3;">
                DATE<br/>RANGE
              </td>
              <td width="15" valign="top" align="center" style="color: #374151; font-weight: 700; padding: 6px 0;">:</td>
              <td valign="top" style="color: #0f172a; font-weight: 700; padding: 6px 0 6px 8px; line-height: 1.3;">
                ${dateRange}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    ${tableSpacer}

    <!-- ==================== BILL TO & TOTAL SUMMARY ==================== -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <!-- BILL TO -->
        <td width="46%" valign="top" style="background-color: #f9f8ff; border: 1px solid #e0e7ff; border-radius: 8px; padding: 14px 18px;">
          <div style="color: #3b28cc; font-size: 8.5pt; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px;">BILL TO</div>
          <div style="font-size: 12.5pt; font-weight: 700; color: #111827; margin-bottom: 6px;">${displayName}</div>
          <div style="font-size: 9pt; color: #4b5563; line-height: 1.4; margin-bottom: 10px;">${displayAddress}</div>
          <table cellpadding="2" cellspacing="0" style="font-size: 8.5pt; color: #64748b;">
            <tr><td style="font-weight: 600; color: #374151;">Phone:</td><td>${displayPhone}</td></tr>
            <tr><td style="font-weight: 600; color: #374151;">Email:</td><td>${displayEmail}</td></tr>
          </table>
        </td>

        <td width="4%">&nbsp;</td>

        <!-- TOTAL SUMMARY -->
        <td width="50%" valign="top" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background-color: #3b28cc; color: #ffffff; padding: 10px 14px; font-size: 9pt; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
                TOTAL SUMMARY
              </td>
            </tr>
          </table>
          <div style="padding: 12px 14px; background-color: #ffffff;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" valign="middle">
                  <div style="font-size: 19pt; font-weight: 800; color: #111827; line-height: 1.2;">
                    ${formatCurrency(summary.totalRevenue)}
                  </div>
                  <div style="font-size: 8pt; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px;">
                    Total Revenue
                  </div>
                </td>
                <td width="50%" valign="middle" style="border-left: 1px solid #f1f5f9; padding-left: 14px;">
                  <table width="100%" cellpadding="2" cellspacing="0" style="font-size: 8.5pt;">
                    <tr>
                      <td style="color: #64748b;">Total Expenses:</td>
                      <td align="right" style="font-weight: 700; color: #ef4444;">${formatCurrency(summary.totalExpenses)}</td>
                    </tr>
                    <tr>
                      <td style="color: #64748b;">Total Overdue:</td>
                      <td align="right" style="font-weight: 700; color: #f59e0b;">${formatCurrency(summary.totalOverdue)}</td>
                    </tr>
                    <tr>
                      <td style="color: #64748b;">Collection Rate:</td>
                      <td align="right" style="font-weight: 700; color: #3b28cc;">${summary.collectionRate}%</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </div>
        </td>
      </tr>
    </table>

    <!-- ==================== OVERVIEW (8 KPI CARDS) ==================== -->
    <p style="margin-top: 24pt; margin-bottom: 8pt; font-size: 11pt; font-weight: 800; color: #3b28cc; letter-spacing: 0.5px; text-transform: uppercase;">
      📊 OVERVIEW
    </p>
    <table width="100%" cellpadding="6" cellspacing="6">
      <tr>
        <td width="25%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: 3pt solid #10b981; border-radius: 6px; padding: 10px;">
          <div style="font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase;">TOTAL REVENUE</div>
          <div style="font-size: 12.5pt; font-weight: 800; color: #0f172a; margin-top: 3px;">${formatCurrency(overview.totalRevenue)}</div>
        </td>
        <td width="25%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: 3pt solid #3b82f6; border-radius: 6px; padding: 10px;">
          <div style="font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase;">RENT COLLECTED</div>
          <div style="font-size: 12.5pt; font-weight: 800; color: #0f172a; margin-top: 3px;">${formatCurrency(overview.rentCollected)}</div>
        </td>
        <td width="25%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: 3pt solid #10b981; border-radius: 6px; padding: 10px;">
          <div style="font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase;">DEPOSIT HELD</div>
          <div style="font-size: 12.5pt; font-weight: 800; color: #0f172a; margin-top: 3px;">${formatCurrency(overview.depositHeld)}</div>
        </td>
        <td width="25%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: 3pt solid #ef4444; border-radius: 6px; padding: 10px;">
          <div style="font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase;">FUTURE DEPOSIT REFUND</div>
          <div style="font-size: 12.5pt; font-weight: 800; color: #0f172a; margin-top: 3px;">${formatCurrency(overview.futureRefund)}</div>
        </td>
      </tr>
      <tr>
        <td width="25%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: 3pt solid #8b5cf6; border-radius: 6px; padding: 10px;">
          <div style="font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase;">POTENTIAL REVENUE</div>
          <div style="font-size: 12.5pt; font-weight: 800; color: #0f172a; margin-top: 3px;">${formatCurrency(overview.potentialRevenue)}</div>
        </td>
        <td width="25%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: 3pt solid #ef4444; border-radius: 6px; padding: 10px;">
          <div style="font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase;">TOTAL EXPENSES</div>
          <div style="font-size: 12.5pt; font-weight: 800; color: #0f172a; margin-top: 3px;">${formatCurrency(overview.totalExpenses)}</div>
        </td>
        <td width="25%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: 3pt solid #f59e0b; border-radius: 6px; padding: 10px;">
          <div style="font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase;">TOTAL OVERDUE</div>
          <div style="font-size: 12.5pt; font-weight: 800; color: #0f172a; margin-top: 3px;">${formatCurrency(overview.totalOverdue)}</div>
        </td>
        <td width="25%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: 3pt solid #6366f1; border-radius: 6px; padding: 10px;">
          <div style="font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase;">COLLECTION RATE</div>
          <div style="font-size: 12.5pt; font-weight: 800; color: #0f172a; margin-top: 3px;">${overview.collectionRate}%</div>
        </td>
      </tr>
    </table>

    <!-- ==================== ANALYTICS ==================== -->
    <p style="margin-top: 24pt; margin-bottom: 8pt; font-size: 11pt; font-weight: 800; color: #3b28cc; letter-spacing: 0.5px; text-transform: uppercase;">
      📈 ANALYTICS & MONTHLY TRENDS
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <!-- OCCUPANCY RATE -->
        <td width="34%" valign="top" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px;">
          <div style="font-size: 8.5pt; font-weight: 700; color: #1e293b; text-transform: uppercase; margin-bottom: 8px;">OCCUPANCY RATE</div>
          <div style="text-align: center; padding: 8px 0;">
            <div style="font-size: 26pt; font-weight: 800; color: #3b28cc; line-height: 1;">${occupancyRate || 0}%</div>
            <div style="font-size: 7.5pt; color: #6b7280; margin-top: 4px;">Bed Occupancy</div>
          </div>
          <table width="100%" cellpadding="3" cellspacing="0" style="margin-top: 6px; font-size: 8.5pt; border-top: 1px solid #f1f5f9;">
            <tr>
              <td><span style="display:inline-block; width:8px; height:8px; background:#3b28cc; border-radius:50%; margin-right:4px;"></span>Occupied</td>
              <td align="right" style="font-weight: 700; color: #3b28cc;">${occupancyRate || 0}%</td>
            </tr>
            <tr>
              <td><span style="display:inline-block; width:8px; height:8px; background:#d1d5db; border-radius:50%; margin-right:4px;"></span>Vacant</td>
              <td align="right" style="font-weight: 700; color: #64748b;">${vacantRate}%</td>
            </tr>
          </table>
        </td>

        <td width="3%">&nbsp;</td>

        <!-- COLLECTED VS POTENTIAL TABLE -->
        <td width="63%" valign="top" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #f8fafc; border-bottom: 1px solid #e5e7eb; padding: 8px 12px; font-size: 8.5pt; font-weight: 700; color: #1e293b; text-transform: uppercase;">
            COLLECTED VS POTENTIAL MONTHLY
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f1f5f9; color: #475569; font-size: 8pt; font-weight: 700;">
                <th style="padding: 6px 10px; text-align: left;">PERIOD</th>
                <th style="padding: 6px 10px; text-align: right;">POTENTIAL</th>
                <th style="padding: 6px 10px; text-align: right;">COLLECTED</th>
                <th style="padding: 6px 10px; text-align: right;">RATE</th>
              </tr>
            </thead>
            <tbody>
              ${collectedVsPotentialRows}
            </tbody>
          </table>
        </td>
      </tr>
    </table>

    <!-- ==================== REVENUE VS EXPENSE COMPARISON ==================== -->
    <p style="margin-top: 24pt; margin-bottom: 8pt; font-size: 11pt; font-weight: 800; color: #3b28cc; letter-spacing: 0.5px; text-transform: uppercase;">
      📊 REVENUE VS EXPENSE COMPARISON
    </p>
    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f1f5f9; color: #475569; font-size: 8pt; font-weight: 700;">
            <th style="padding: 6px 10px; text-align: left;">PERIOD</th>
            <th style="padding: 6px 10px; text-align: right;">TOTAL REVENUE</th>
            <th style="padding: 6px 10px; text-align: right;">TOTAL EXPENSE</th>
            <th style="padding: 6px 10px; text-align: right;">NET BALANCE</th>
          </tr>
        </thead>
        <tbody>
          ${revenueVsExpenseRows}
        </tbody>
      </table>
    </div>

    <!-- ==================== CATEGORY BREAKDOWNS ==================== -->
    <p style="margin-top: 24pt; margin-bottom: 8pt; font-size: 11pt; font-weight: 800; color: #3b28cc; letter-spacing: 0.5px; text-transform: uppercase;">
      📑 FINANCIAL BREAKDOWNS
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <!-- REVENUE BREAKDOWN -->
        <td width="48%" valign="top" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #3b28cc; color: #ffffff; padding: 8px 12px; font-size: 8.5pt; font-weight: 700; text-transform: uppercase;">
            REVENUE BREAKDOWN (TOTAL: ${formatCurrency(breakdownData?.totalRevenueBreakdown)})
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8fafc; font-size: 8pt; color: #64748b; font-weight: 700;">
                <th style="padding: 6px 10px; text-align: left;">CATEGORY</th>
                <th style="padding: 6px 10px; text-align: center;">SHARE</th>
                <th style="padding: 6px 10px; text-align: right;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${revenueBreakdownRows}
            </tbody>
          </table>
        </td>

        <td width="4%">&nbsp;</td>

        <!-- EXPENSE BREAKDOWN -->
        <td width="48%" valign="top" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #ef4444; color: #ffffff; padding: 8px 12px; font-size: 8.5pt; font-weight: 700; text-transform: uppercase;">
            EXPENSE BREAKDOWN (TOTAL: ${formatCurrency(breakdownData?.totalExpenseBreakdown)})
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8fafc; font-size: 8pt; color: #64748b; font-weight: 700;">
                <th style="padding: 6px 10px; text-align: left;">CATEGORY</th>
                <th style="padding: 6px 10px; text-align: center;">SHARE</th>
                <th style="padding: 6px 10px; text-align: right;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${expenseBreakdownRows}
            </tbody>
          </table>
        </td>
      </tr>
    </table>

    <div class="page-break"></div>

    <!-- ==================== EXPENSE HISTORY ==================== -->
    <p style="margin-top: 24pt; margin-bottom: 10pt; font-size: 11.5pt; font-weight: 800; color: #3b28cc; letter-spacing: 0.5px; text-transform: uppercase;">
      🧾 EXPENSE HISTORY
    </p>

    <!-- 4 EXPENSE KPIS -->
    ${
      expenseHistoryExport?.kpis
        ? `
      <table width="100%" cellpadding="6" cellspacing="6">
        <tr>
          <td width="25%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
            <div style="font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase;">TOTAL TRANSACTIONS</div>
            <div style="font-size: 14pt; font-weight: 800; color: #3b82f6; margin-top: 2px;">${expenseHistoryExport.kpis.totalTxs}</div>
            <div style="font-size: 7.5pt; color: #94a3b8;">Across recorded expenses</div>
          </td>
          <td width="25%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
            <div style="font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase;">PENDING AMOUNT</div>
            <div style="font-size: 14pt; font-weight: 800; color: #d97706; margin-top: 2px;">${formatCurrency(expenseHistoryExport.kpis.pendingAmt)}</div>
            <div style="font-size: 7.5pt; color: #94a3b8;">To be cleared</div>
          </td>
          <td width="25%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
            <div style="font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase;">PAID AMOUNT</div>
            <div style="font-size: 14pt; font-weight: 800; color: #059669; margin-top: 2px;">${formatCurrency(expenseHistoryExport.kpis.paidAmt)}</div>
            <div style="font-size: 7.5pt; color: #94a3b8;">Successfully cleared</div>
          </td>
          <td width="25%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
            <div style="font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase;">TOTAL AMOUNT</div>
            <div style="font-size: 14pt; font-weight: 800; color: #be123c; margin-top: 2px;">${formatCurrency(expenseHistoryExport.kpis.totalAmt)}</div>
            <div style="font-size: 7.5pt; color: #94a3b8;">Total recorded</div>
          </td>
        </tr>
      </table>
      ${tableSpacer}
    `
        : ''
    }

    <!-- EXPENSE TABLE -->
    ${expenseHistoryTableHtml}

    ${tableSpacer}

    <!-- ==================== NOTES & INSTRUCTIONS ==================== -->
    <div style="border-top: 1px solid #e5e7eb; padding-top: 14px;">
      <div style="font-size: 8.5pt; font-weight: 700; color: #374151; text-transform: uppercase; margin-bottom: 4px;">
        📝 NOTES & INSTRUCTIONS
      </div>
      <ul style="margin: 0; padding-left: 18px; font-size: 8.5pt; color: #64748b; line-height: 1.5;">
        <li>This financial statement is system generated and verified by PGMate Property Management.</li>
        <li>For any ledger reconciliations, dispute resolution, or inquiries, please contact your administrative team.</li>
      </ul>
    </div>

    <!-- ==================== MSO NATIVE PAGE FOOTER (OFF-CANVAS FOR WORD ENGINE) ==================== -->
    <table id="hrdftrtbl" border="0" cellspacing="0" cellpadding="0" style="margin:0in 0in 0in 900in; width:1px; height:1px; overflow:hidden; position:absolute; z-index:-1;">
      <tr>
        <td>
          <div style="mso-element:footer" id="f1">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1.5pt solid #6366f1; padding-top: 8px;">
              <tr>
                <td style="font-size: 9pt; color: #64748b; font-weight: 700;">
                  Thank you for your business!
                </td>
                <td align="right" style="font-size: 9pt; color: #64748b; font-weight: 500;">
                  PGMate Financial Services &copy; ${new Date().getFullYear()}
                </td>
              </tr>
            </table>
          </div>
        </td>
      </tr>
    </table>

    </div> <!-- Close Section1 -->

  </body>
  </html>
  `;

  // Create document Blob with Microsoft Word MIME type and UTF-8 BOM
  const blob = new Blob(['\ufeff', htmlDocument], {
    type: 'application/msword;charset=utf-8',
  });

  const sanitizedFileName = `Revenue_Expenditure_Invoice_${invoiceNo || 'Report'}.doc`;
  saveAs(blob, sanitizedFileName);
};
