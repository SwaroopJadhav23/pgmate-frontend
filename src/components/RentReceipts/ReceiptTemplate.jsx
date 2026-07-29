import React from "react";
import pgmateLogo from "../../assets/pgmate-withoutbg.png";

function numberToWords(num) {
  if (!num || isNaN(num) || num === 0) return "Zero";
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function toWords(n) {
    if (n < 20) return a[n];
    if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " and " + toWords(n % 100) : "")
      );
    if (n < 100000)
      return (
        toWords(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + toWords(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        toWords(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 !== 0 ? " " + toWords(n % 100000) : "")
      );
    return (
      toWords(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + toWords(n % 10000000) : "")
    );
  }
  return toWords(num) + " Only";
}

const formatMonth = (monthString) => {
  if (!monthString) return "";
  // Only reformat if it's a raw YYYY-MM month picker value
  if (/^\d{4}-\d{2}$/.test(monthString)) {
    const [year, month] = monthString.split("-");
    const date = new Date(year, month - 1);
    return date.toLocaleString("default", {month: "long", year: "numeric"});
  }
  // Already formatted — return as-is
  return monthString;
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  // Only reformat if it's a raw YYYY-MM-DD date input value
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  }
  // Already formatted — return as-is
  return dateString;
};

const formatAmount = (amount) => {
  if (!amount || isNaN(amount)) return "0";
  return Number(amount).toLocaleString("en-IN", {maximumFractionDigits: 2});
};

/**
 * ReceiptTemplate — The printable receipt layout.
 * Used inside ReceiptPreview and when generating the PDF.
 */
const ReceiptTemplate = ({data, id}) => {
  const {
    receiptNumber = "RCPT/2024/1256",
    tenantName = "",
    landlordName = "",
    phoneNo = "",
    pgName = "",
    pgAddress = "",
    rentAmount = "",
    electricityCharges = "",
    waterCharges = "",
    wifiCharges = "",
    securityDeposit = "",
    paymentMode = "",
    fromMonth = "",
    toMonth = "",
    receiptDate = "",
  } = data || {};

  const rent = parseFloat(rentAmount) || 0;
  const elec = parseFloat(electricityCharges) || 0;
  const water = parseFloat(waterCharges) || 0;
  const wifi = parseFloat(wifiCharges) || 0;
  const security = parseFloat(securityDeposit) || 0;

  const total = rent + elec + water + wifi + security;

  return (
    <div className="receipt-template" id={id}>
      {/* Header */}
      <div className="receipt-header-new receipt-header-col">
        <div className="receipt-header-left">
          <img src={pgmateLogo} alt="PGMate" className="receipt-logo-new" />
        </div>
        <h1
          className={`receipt-title-new ${pgName ? "receipt-title-mb4" : "receipt-title-mb0"}`}
        >
          RENT RECEIPT
        </h1>
        {pgName && <h2 className="receipt-pg-name">{pgName}</h2>}
      </div>

      {/* Table 1: Info */}
      <table className="receipt-table info-table">
        <tbody>
          <tr>
            <td className="col-label" style={{ width: '25%' }}>Owner Name</td>
            <td className="col-value" colSpan="3" style={{ width: '75%' }}>
              {landlordName || " "}
            </td>
          </tr>
          <tr>
            <td className="col-label">Receipt No.</td>
            <td className="col-value">{receiptNumber}</td>
            <td className="col-label">Date</td>
            <td className="col-value">{formatDate(receiptDate)}</td>
          </tr>
        </tbody>
      </table>

      {/* Acknowledgment Text */}
      <div className="receipt-text-body">
        This is to acknowledge the receipt from{" "}
        <span className="receipt-blank-line receipt-blank-line-180">
          {tenantName || " "}
        </span>{" "}
        (tenant) of the sum of Rupees{" "}
        <span className="receipt-blank-line receipt-blank-line-120">
          {formatAmount(total)}/-
        </span>{" "}
        towards house rent for the month of{" "}
        <span className="receipt-blank-line receipt-blank-line-120">
          {formatMonth(fromMonth) || " "}
        </span>{" "}
        to{" "}
        <span className="receipt-blank-line receipt-blank-line-120">
          {formatMonth(toMonth) || " "}
        </span>
        , towards the property bearing the address{" "}
        <span className="receipt-blank-line receipt-blank-line-250">
          {pgAddress || " "}
        </span>
        .
      </div>

      {/* Table 2: Breakdown */}
      <table className="receipt-table breakdown-table">
        <tbody>
          <tr>
            <td className="col-label text-center" style={{ width: '25%' }}>Payment Mode</td>
            <td className="col-value" colSpan="3" style={{ width: '75%' }}>
              {paymentMode || " "}
            </td>
          </tr>
          <tr>
            <td className="col-label text-center empty-bg" rowSpan="6"></td>
            <td className="col-value" colSpan="2">Rent & Maintenance</td>
            <td className="col-value num-col">{formatAmount(rent)}</td>
          </tr>
          <tr>
            <td className="col-value" colSpan="2">Electricity Charges</td>
            <td className="col-value num-col">{formatAmount(elec)}</td>
          </tr>
          <tr>
            <td className="col-value" colSpan="2">Water Charges</td>
            <td className="col-value num-col">{formatAmount(water)}</td>
          </tr>
          <tr>
            <td className="col-value" colSpan="2">Wi-Fi Charges</td>
            <td className="col-value num-col">{formatAmount(wifi)}</td>
          </tr>
          <tr>
            <td className="col-value" colSpan="2">Security Deposit (Refundable)</td>
            <td className="col-value num-col">{formatAmount(security)}</td>
          </tr>
          <tr>
            <td className="col-label" colSpan="2">
              <strong>Total Amount to be Received</strong>
            </td>
            <td className="col-label num-col">
              <strong>{formatAmount(total)}</strong>
            </td>
          </tr>
          <tr>
            <td className="col-label text-center" rowSpan="3">
              Amount in Words
            </td>
            <td className="col-value" colSpan="2">Amount Received</td>
            <td className="col-value num-col">{formatAmount(total)}</td>
          </tr>
          <tr>
            <td className="col-value" colSpan="3">
              {numberToWords(total)}
            </td>
          </tr>
          <tr>
            <td className="col-value" colSpan="2">Balance Due</td>
            <td className="col-value num-col">0.00</td>
          </tr>
        </tbody>
      </table>

      {/* Table 3: Receiver Info */}
      <table className="receipt-table receiver-table">
        <tbody>
          <tr>
            <td className="col-label" style={{ width: '25%' }}>Received By</td>
            <td className="col-value" colSpan="3" style={{ width: '75%' }}>{tenantName || " "}</td>
          </tr>
          <tr>
            <td className="col-label">Address</td>
            <td className="col-value" colSpan="3">{pgAddress || " "}</td>
          </tr>
          <tr>
            <td className="col-label">Phone No.</td>
            <td className="col-value" colSpan="3">{phoneNo || " "}</td>
          </tr>
        </tbody>
      </table>

      {/* Important Note */}
      <div className="receipt-note-box">
        <p className="note-title">
          <strong>Important Note:</strong>
        </p>
        <p className="note-text">
          30 days of notice is mandatory before vacating the premises.
        </p>
      </div>

      {/* Footer / Generated By */}
      <div className="receipt-footer-branding-wrapper">
        <div className="receipt-footer-branding-content">
          <span className="receipt-footer-branding-text">Generated by</span>
          <img
            src={pgmateLogo}
            alt="PGMate"
            className="receipt-footer-branding-img"
          />
        </div>
      </div>
    </div>
  );
};

export default ReceiptTemplate;
