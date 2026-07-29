import jsPDF from "jspdf";

const BRAND = "#4f46e5";
const DARK = "#1e1b4b";
const GRAY = "#6b7280";
const TABLE_HEAD = [30, 41, 133]; // dark navy-blue for table header
const GREEN_BG = [220, 252, 231];
const GREEN_TXT = [21, 128, 61];
const AMBER_BG = [254, 249, 195];
const AMBER_TXT = [146, 64, 14];
const CARD_BG = [248, 249, 255];
const CARD_BORDER = [224, 231, 255];

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const rupee = (val) => `Rs. ${Number(val || 0).toLocaleString("en-IN")}`;

// ── Helper: load an image from /public and convert to a data URL ──
const loadImageAsDataURL = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve({
        dataUrl: canvas.toDataURL("image/png"),
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = reject;
    img.src = src;
  });

// Builds a readable "From" address string out of whatever PG fields exist
const buildPgAddress = (pg) => {
  const parts = [pg.pgLocality, pg.pgCity].filter(Boolean);
  const line1 = pg.pgAddress || null;
  const line2 = parts.length ? parts.join(", ") : null;
  return [line1, line2].filter(Boolean);
};

// Derives a Paid / Pending label for a charge line, from data already on `pg`
const getRentStatus = (pg) =>
  pg.onboardingPaymentAmount && pg.onboardingPaymentAmount > 0 ? "Paid" : "Pending";

const getDepositStatus = (pg) =>
  pg.reservationAmount && pg.reservationAmount > 0 ? "Paid" : "Pending";

export const generateBookingInvoice = async (pg) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const MARGIN = 18;
  const invoiceNo = `INV-${(pg.residentId || pg.id || "").toString().slice(-8).toUpperCase()}`;

  // ── Header band ──────────────────────────────────────────
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, W, 42, "F");

  try {
    const { dataUrl, width, height } = await loadImageAsDataURL("/logo1.png");
    const logoH = 42;
    const logoW = (width / height) * logoH;
    doc.addImage(dataUrl, "PNG", MARGIN - 24, 1, logoW, logoH);
  } catch (err) {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Pgmate", MARGIN, 18);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Booking Invoice", MARGIN, 37);

  // Invoice number — big "INVOICE" title with the number below it (left-aligned block)
  const invoiceBlockX = W - MARGIN - 42;
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", invoiceBlockX, 20);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`NO: ${invoiceNo}`, invoiceBlockX, 28);

  let y = 50;

  // ── Status chip ────────────────────────────────────────────
  const status = pg.status || "ACTIVE";
  const statusMap = {
    ACTIVE: { bg: GREEN_BG, txt: GREEN_TXT },
    RESERVED: { bg: AMBER_BG, txt: AMBER_TXT },
    EXITED: { bg: [241, 245, 249], txt: [71, 85, 105] },
    CANCELLED: { bg: [254, 226, 226], txt: [153, 27, 27] },
  };
  const sc = statusMap[status] || statusMap.ACTIVE;

  doc.setFillColor(...sc.bg);
  doc.roundedRect(MARGIN, y, 28, 8, 2, 2, "F");
  doc.setTextColor(...sc.txt);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(status, MARGIN + 14, y + 5.5, { align: "center" });

  y += 16;

  // ── Bill To / From cards ───────────────────────────────────
  const cardW = (W - MARGIN * 2 - 10) / 2;
  const cardX1 = MARGIN;
  const cardX2 = MARGIN + cardW + 10;

  const billToLines = [
    { text: pg.name || "—", size: 13, bold: true, color: DARK, gap: 7.5 },
    { text: pg.phone || "—", size: 10, bold: false, color: GRAY, gap: 6 },
    { text: pg.email || "—", size: 10, bold: false, color: GRAY, gap: 6 },
  ];

  const fromLines = [
    { text: pg.pgName || "—", size: 13, bold: true, color: DARK, gap: 7.5 },
    ...buildPgAddress(pg).map((text) => ({ text, size: 10, bold: false, color: GRAY, gap: 6 })),
    { text: pg.ownerPhone || "—", size: 10, bold: false, color: GRAY, gap: 6 },
  ];

  const cardHeight = (lines) => 16 + lines.reduce((sum, l) => sum + l.gap, 0);
  const cardH = Math.max(cardHeight(billToLines), cardHeight(fromLines));

  const drawCard = (x, label, lines) => {
    doc.setFillColor(...CARD_BG);
    doc.setDrawColor(...CARD_BORDER);
    doc.roundedRect(x, y, cardW, cardH, 3, 3, "FD");

    doc.setTextColor(79, 70, 229);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(label, x + 6, y + 10);

    let cy = y + 19;
    lines.forEach((l) => {
      doc.setTextColor(l.color);
      doc.setFontSize(l.size);
      doc.setFont("helvetica", l.bold ? "bold" : "normal");
      doc.text(l.text, x + 6, cy);
      cy += l.gap;
    });
  };

  drawCard(cardX1, "Bill To", billToLines);
  drawCard(cardX2, "From", fromLines);
  y += cardH + 8;

  // ── Section: PG Details ───────────────────────────────────
  const sectionHeader = (label, yy) => {
    doc.setFillColor(238, 242, 255);
    doc.rect(MARGIN, yy, W - MARGIN * 2, 7, "F");
    doc.setTextColor(79, 70, 229);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text(label, MARGIN + 3, yy + 5);
    return yy + 12;
  };

  y = sectionHeader("PG DETAILS", y);

  const thirdW = (W - MARGIN * 2) / 3;
  const detailCol = (label, value, x, yy) => {
    doc.setTextColor(GRAY);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text(label, x, yy);
    doc.setTextColor(BRAND);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.text(String(value || "—"), x, yy + 6);
  };
  detailCol("PG Name", pg.pgName, MARGIN + 3, y);
  detailCol("Room / Bed", `Room ${pg.roomNumber} — Bed ${pg.bedNumber}`, MARGIN + thirdW + 3, y);
  detailCol("Stay Type", pg.stayType === "DAILY_BASIC" ? "Daily Basic" : "Monthly Basic", MARGIN + thirdW * 2 + 3, y);
  y += 16;

  // ── Section: Charges table ────────────────────────────────
  doc.setTextColor(79, 70, 229);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("CHARGES", MARGIN + 3, y);
  y += 4;

  const tableX = MARGIN;
  const tableW = W - MARGIN * 2;
  const colDesc = tableX;
  const colPrice = tableX + tableW * 0.34;
  const colStatus = tableX + tableW * 0.58;
  const colTotal = tableX + tableW * 0.8;
  const rowH = 10;

  // header row
  doc.setFillColor(...TABLE_HEAD);
  doc.rect(tableX, y, tableW, rowH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("Description", colDesc + 3, y + 6.5);
  doc.text("Price", colPrice, y + 6.5);
  doc.text("Status", colStatus, y + 6.5);
  doc.text("Total", colTotal, y + 6.5);
  y += rowH;

  const statusChip = (label, x, yy) => {
    const isPaid = label === "Paid";
    const [bg, txt] = isPaid ? [GREEN_BG, GREEN_TXT] : [AMBER_BG, AMBER_TXT];
    const w = 17;
    doc.setFillColor(...bg);
    doc.roundedRect(x, yy - 4.4, w, 5.8, 1.5, 1.5, "F");
    doc.setTextColor(...txt);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(label, x + w / 2, yy - 0.7, { align: "center" });
  };

  let rowIndex = 0;
  const chargeRow = (desc, price, status, total) => {
    // subtle zebra striping
    if (rowIndex % 2 === 1) {
      doc.setFillColor(248, 249, 255);
      doc.rect(tableX, y, tableW, rowH, "F");
    }
    doc.setDrawColor(...CARD_BORDER);
    doc.line(tableX, y + rowH, tableX + tableW, y + rowH);
    doc.setTextColor(DARK);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.text(desc, colDesc + 3, y + 6.8);
    doc.text(rupee(price), colPrice, y + 6.8);
    statusChip(status, colStatus, y + 6.8);
    doc.setFont("helvetica", "bold");
    doc.text(rupee(total), colTotal, y + 6.8);
    y += rowH;
    rowIndex++;
  };

  let grandTotal = 0;

  if (pg.stayType === "DAILY_BASIC") {
    const dailyTotal = (pg.dailyRent || 0) * (pg.numberOfDays || 0);
    chargeRow(`Daily Rent (${pg.numberOfDays || 0} day(s))`, pg.dailyRent, getRentStatus(pg), dailyTotal);
    grandTotal += dailyTotal;
  } else {
    chargeRow("Monthly Rent", pg.monthlyRent, getRentStatus(pg), pg.monthlyRent);
    grandTotal += pg.monthlyRent || 0;
  }

  chargeRow("Deposit", pg.deposit, getDepositStatus(pg), pg.deposit);
  grandTotal += pg.deposit || 0;

  // Grand total row
  doc.setFillColor(238, 242, 255);
  doc.rect(tableX, y, tableW, rowH + 1, "F");
  doc.setDrawColor(...CARD_BORDER);
  doc.line(tableX, y, tableX + tableW, y);
  doc.setTextColor(BRAND);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total", colDesc + 3, y + 7);
  doc.text(rupee(grandTotal), colTotal, y + 7);
  y += rowH + 1 + 12;

  // ── Thank you card ──────────────────────────────────────────
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(MARGIN, 255, W - MARGIN * 2, 16, 3, 3, "F");
  doc.setTextColor(79, 70, 229);
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.text("Thank you for using PGMate!", MARGIN + 6, 263);
  doc.setTextColor(GRAY);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on ${formatDate(new Date())}`, MARGIN + 6, 268.5);

  // ── Footer bar ───────────────────────────────────────────────
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 282, W, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.textWithLink("www.pgmate.in", MARGIN, 291, { url: "https://www.pgmate.in" });
  const emailText = "support.pgmate@gmail.com";
  const emailWidth = doc.getTextWidth(emailText);
  doc.textWithLink(emailText, W - MARGIN - emailWidth, 291, {
    url: "mailto:support.pgmate@gmail.com",
  });

  const fileName = `PgLinker_Invoice_${invoiceNo}.pdf`;
  doc.save(fileName);
};