import React from "react";
import pgmateLogo from "../../assets/pgmate-withoutbg.png";

/* ── Helpers ─────────────────────────────────────────────────── */
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

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
  }
  return dateStr;
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  // HH:MM → 12-hour format
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
};

const formatAmount = (val) => {
  const n = parseFloat(val) || 0;
  return "₹" + n.toLocaleString("en-IN") + "/-";
};

/* ── Icon SVGs ────────────────────────────────────────────────── */
const UserIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="#6f7af0"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      fill="#6f7af0"
      stroke="#6f7af0"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <path
      d="M9 12l2 2 4-4"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ── Main Template ───────────────────────────────────────────── */
const LeaseTemplate = ({data, id}) => {
  const {
    pgName = "",
    ownerName = "",
    ownerPhone = "",
    ownerEmail = "",
    tenantName = "",
    tenantPhone = "",
    tenantEmail = "",
    propertyAddress = "",
    roomBedNumber = "",
    monthlyRent = "",
    securityDeposit = "",
    startDate = "",
    endDate = "",
    curfewTimings = "",
    guestPolicy = "",
    customGuestPolicies = [],
    smokingDrinkingRules = "",
    customSmokingRules = [],
    selectedRules = [],
    generalCustomRules = [],
    noticePeriod = "",

    rentDueDay = "5",
    showTermRent = true,
    showTermDeposit = true,
    showTermPeriod = true,
    // eslint-disable-next-line
    showTermResidential = true,
    showRuleCurfew = true,
    showRuleGuest = true,
    showRuleSmoking = true,
    showRuleNotice = true,
    showRuleGeneral = true,
    customTerms = [],
  } = data || {};

  const rentNum = parseFloat(monthlyRent) || 0;
  // eslint-disable-next-line
  const depositNum = parseFloat(securityDeposit) || 0;

  let generalRulesList = [];
  if (selectedRules && selectedRules.length > 0) {
    generalRulesList = [...selectedRules];
  }
  if (generalCustomRules && generalCustomRules.length > 0) {
    generalRulesList = [...generalRulesList, ...generalCustomRules];
  }

  const noticePeriodRule = `Either party must give a ${noticePeriod || "30"} day${noticePeriod !== "1" ? "s" : ""} written notice before vacating or terminating the agreement.`;

  const ordinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const standardTerms = [
    showTermRent && (
      <span>
        The tenant agrees to pay a monthly rent of{" "}
        <strong>{formatAmount(monthlyRent)}</strong> on or before the{" "}
        <strong>{ordinal(parseInt(rentDueDay) || 5)}</strong> of every month.
      </span>
    ),
    showTermDeposit && (
      <span>
        A security deposit of <strong>{formatAmount(securityDeposit)}</strong>{" "}
        is held by the owner, refundable at the time of vacating subject to
        deductions for damages or unpaid dues.
      </span>
    ),
    showTermPeriod && (
      <span>
        This agreement is valid from{" "}
        <strong>{formatDate(startDate) || "—"}</strong> to{" "}
        <strong>{formatDate(endDate) || "—"}</strong>, unless mutually extended
        or terminated earlier.
      </span>
    ),

    ...(customTerms || []).map((term, i) => (
      <span key={`custom-${i}`}>{term}</span>
    )),
  ].filter(Boolean);

  const hasHouseRules =
    showRuleCurfew ||
    showRuleGuest ||
    showRuleSmoking ||
    showRuleNotice ||
    showRuleGeneral;

  return (
    <div className="lt-wrapper" id={id}>
      <div className="lt-accent-bar" />

      {/* ── Header ── */}
      <div className="lt-header">
        <div className="lt-header-left">
          <img src={pgmateLogo} alt="PGMate" className="lt-logo" />
        </div>
        <div className="lt-header-center">
          <div className="lt-pg-name-row">
            <div className="lt-name-line"></div>
            <div className="lt-pg-name">{pgName || "[PG Name]"}</div>
            <div className="lt-name-line"></div>
          </div>
          <h1 className="lt-doc-title">PG ACCOMMODATION AGREEMENT</h1>
          <div className="lt-subtitle-row">
            <div className="lt-subtitle">HOUSE RULES & TERMS OF STAY</div>
          </div>
        </div>
      </div>
      <div className="lt-intro-container">
        <p className="lt-intro-text lt-text-center">
          This Agreement is made between the PG Owner/Manager and the Tenant for
          the accommodation provided at the PG premises.
        </p>
      </div>

      {/* ── Section 1: Accommodation Details ── */}
      <div className="lt-section">
        <div className="lt-section-heading">
          <span className="lt-section-num">1.</span>
          <span className="lt-section-title">ACCOMMODATION DETAILS</span>
        </div>
        <table className="lt-details-table">
          <tbody>
            <tr>
              <td className="lt-td-label">PG / Property Name</td>
              <td className="lt-td-value">{pgName || "—"}</td>
            </tr>
            <tr>
              <td className="lt-td-label">Address</td>
              <td className="lt-td-value">{propertyAddress || "—"}</td>
            </tr>
            <tr>
              <td className="lt-td-label">Room / Bed No.</td>
              <td className="lt-td-value">{roomBedNumber || "—"}</td>
            </tr>
            <tr>
              <td className="lt-td-label">Monthly Rent</td>
              <td className="lt-td-value">
                {formatAmount(monthlyRent)} (Rupees {numberToWords(rentNum)})
              </td>
            </tr>
            <tr>
              <td className="lt-td-label">Security Deposit</td>
              <td className="lt-td-value">
                {formatAmount(securityDeposit)} (Refundable, subject to terms)
              </td>
            </tr>
            <tr>
              <td className="lt-td-label">Agreement Start Date</td>
              <td className="lt-td-value">{formatDate(startDate) || "—"}</td>
            </tr>
            <tr>
              <td className="lt-td-label">Agreement End Date</td>
              <td className="lt-td-value">{formatDate(endDate) || "—"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Section 2: House Rules & Policies ── */}
      {hasHouseRules && (
        <div className="lt-section">
          <div className="lt-section-heading">
            <span className="lt-section-num">2.</span>
            <span className="lt-section-title">HOUSE RULES &amp; POLICIES</span>
          </div>
          <div className="lt-rules-structured-list">
            {showRuleCurfew && (
              <div className="lt-subsection">
                <h4 className="lt-subsection-title">Curfew Timings</h4>
                <p className="lt-subsection-text">
                  {curfewTimings
                    ? `All residents must be inside the premises by ${formatTime(curfewTimings)}.`
                    : "—"}
                </p>
              </div>
            )}

            {showRuleGuest && (
              <div className="lt-subsection">
                <h4 className="lt-subsection-title">Guest Policy</h4>
                <p className="lt-subsection-text">{guestPolicy || "—"}</p>
                {customGuestPolicies && customGuestPolicies.length > 0 && (
                  <ul className="lt-custom-rules-list">
                    {customGuestPolicies.map((p, i) => (
                      <li key={i} className="lt-custom-rule-item">
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {showRuleSmoking && (
              <div className="lt-subsection">
                <h4 className="lt-subsection-title">Smoking / Drinking</h4>
                <p className="lt-subsection-text">
                  {smokingDrinkingRules || "—"}
                </p>
                {customSmokingRules && customSmokingRules.length > 0 && (
                  <ul className="lt-custom-rules-list">
                    {customSmokingRules.map((p, i) => (
                      <li key={i} className="lt-custom-rule-item">
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {showRuleNotice && (
              <div className="lt-subsection">
                <h4 className="lt-subsection-title">Notice Period</h4>
                <p className="lt-subsection-text">{noticePeriodRule}</p>
              </div>
            )}

            {showRuleGeneral && (
              <div className="lt-subsection-last">
                <h4 className="lt-subsection-title-last">General Rules</h4>
                <ul className="lt-custom-rules-list-last">
                  {generalRulesList.length > 0 ? (
                    generalRulesList.map((rule, i) => (
                      <li key={i} className="lt-custom-rule-item">
                        {rule}
                      </li>
                    ))
                  ) : (
                    <li>No general rules specified.</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Section 3: Terms & Conditions ── */}
      <div className="lt-section">
        <div className="lt-section-heading">
          <span className="lt-section-num">3.</span>
          <span className="lt-section-title">TERMS &amp; CONDITIONS</span>
        </div>
        <ul className="lt-terms-list">
          {standardTerms.map((term, i) => (
            <li key={i}>{term}</li>
          ))}
        </ul>
      </div>

      {/* ── Section 4: Details Blocks ── */}
      <div className="lt-details-blocks">
        <div className="lt-detail-box">
          <div className="lt-detail-header">
            <UserIcon />
            <span>PG OWNER / MANAGER DETAILS</span>
          </div>
          <table className="lt-inner-table">
            <tbody>
              <tr>
                <td className="lt-inner-label">Name</td>
                <td className="lt-inner-val">{ownerName || "—"}</td>
              </tr>
              <tr>
                <td className="lt-inner-label">Phone</td>
                <td className="lt-inner-val">{ownerPhone || "—"}</td>
              </tr>
              <tr>
                <td className="lt-inner-label">Email</td>
                <td className="lt-inner-val">{ownerEmail || "—"}</td>
              </tr>
              <tr>
                <td className="lt-inner-label">Address</td>
                <td className="lt-inner-val">{propertyAddress || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="lt-detail-box">
          <div className="lt-detail-header">
            <UserIcon />
            <span>TENANT DETAILS</span>
          </div>
          <table className="lt-inner-table">
            <tbody>
              <tr>
                <td className="lt-inner-label">Name</td>
                <td className="lt-inner-val">{tenantName || "—"}</td>
              </tr>
              <tr>
                <td className="lt-inner-label">Phone</td>
                <td className="lt-inner-val">{tenantPhone || "—"}</td>
              </tr>
              <tr>
                <td className="lt-inner-label">Email</td>
                <td className="lt-inner-val">{tenantEmail || "—"}</td>
              </tr>
              <tr>
                <td className="lt-inner-label">Address</td>
                <td className="lt-inner-val">
                  {roomBedNumber
                    ? `${roomBedNumber}, ${pgName}, ${propertyAddress}`
                    : propertyAddress || "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="lt-footer-container">
        <div className="lt-footer">
          <ShieldCheckIcon />
          <div className="lt-footer-text">
            <div className="lt-footer-line1">
              Thank you for being a part of our PG community.
            </div>
            <div className="lt-footer-line2">
              Follow the rules, stay safe &amp; enjoy your stay!
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom accent bar ── */}
      <div className="lt-accent-bar-bottom" />
    </div>
  );
};

export default LeaseTemplate;
