import React from "react";
import {
  FiClock,
  FiFileText,
  FiUsers,
  FiEye,
  FiDownload,
  FiCheckCircle,
} from "react-icons/fi";
import {FaWhatsapp, FaRupeeSign} from "react-icons/fa";
import {BsShieldCheck, BsInfinity} from "react-icons/bs";
import ReceiptTemplate from "./ReceiptTemplate";

export const mockReceiptData = {
  pgName: "Green Valley PG & Mess",
  pgAddress: "123, MG Road, Koramangala, Bangalore",
  landlordName: "Ramesh Kumar",
  tenantName: "Aditya Sharma",
  phoneNo: "9876543210",
  rentAmount: "8000",
  electricityCharges: "500",
  waterCharges: "200",
  wifiCharges: "300",
  securityDeposit: "0",
  paymentMode: "Online Transfer",
  fromMonth: "2024-05",
  toMonth: "2024-05",
  receiptDate: "2024-05-01",
  receiptNumber: "RR-9102",
};

const RentReceiptHero = () => {
  const scrollToGenerator = () => {
    document
      .getElementById("generator-workspace")
      ?.scrollIntoView({behavior: "smooth"});
  };

  return (
    <div className="common-hero-section">
      {/* Decorative Floating Icons (instead of food plates) */}
      <div className="common-floating-icon common-icon-1">
        <FiFileText />
      </div>
      <div className="common-floating-icon common-icon-2">
        <FaRupeeSign />
      </div>
      <div className="common-floating-icon common-icon-3">
        <FiCheckCircle />
      </div>
      <div className="common-floating-icon common-icon-4">
        <FiDownload />
      </div>
      <div className="common-floating-icon common-icon-5">
        <BsShieldCheck />
      </div>

      <div className="common-hero-container">
        {/* Left Side Content */}
        <div className="common-hero-left">
          <div className="common-hero-badge">
            100% Free Tool for PG Owners & Tenants
          </div>

          <h1 className="common-hero-title">
            Rent Receipt
            <br />
            <span className="common-hero-highlight">Generator</span>
          </h1>

          <p className="common-hero-subtitle">
            Create professional, accurate and printable rent receipts
            <br />
            for PGs, hostels, and landlords in <strong>under 2 minutes.</strong>
          </p>

          <div className="common-hero-actions">
            <button className="common-btn-primary" onClick={scrollToGenerator}>
              Generate Receipt ➔
            </button>
          </div>
        </div>

        {/* Right Side Mockup */}
        <div className="common-hero-right">
          <div className="common-mockup-wrapper">
            <div className="common-mockup-scale">
              <ReceiptTemplate data={mockReceiptData} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="common-bottom-banner-wrapper">
        <div className="common-bottom-banner">
          <div className="common-banner-item">
            <div className="common-banner-icon">
              <FiClock />
            </div>
            <div className="common-banner-text">
              <strong>Ready in</strong>
              <span>Seconds</span>
            </div>
          </div>
          <div className="common-banner-item">
            <div className="common-banner-icon">
              <BsShieldCheck />
            </div>
            <div className="common-banner-text">
              <strong>100% Accurate</strong>
              <span>Format</span>
            </div>
          </div>
          <div className="common-banner-item">
            <div className="common-banner-icon">
              <FiFileText />
            </div>
            <div className="common-banner-text">
              <strong>Printable</strong>
              <span>PDF</span>
            </div>
          </div>
          <div className="common-banner-item">
            <div className="common-banner-icon">
              <BsInfinity />
            </div>
            <div className="common-banner-text">
              <strong>Unlimited</strong>
              <span>Receipts</span>
            </div>
          </div>
          <div className="common-banner-item">
            <div className="common-banner-icon">
              <FaRupeeSign />
            </div>
            <div className="common-banner-text">
              <strong>100% Free</strong>
              <span>Forever</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentReceiptHero;
