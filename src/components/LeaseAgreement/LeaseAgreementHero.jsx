import React from "react";
import {FiClock, FiFileText, FiCheckCircle,} from "react-icons/fi";
import {FaFileContract, FaRupeeSign} from "react-icons/fa";
import {BsShieldCheck, BsInfinity} from "react-icons/bs";
import LeaseTemplate from "./LeaseTemplate";

export const mockLeaseData = {
  pgName: "Sunshine PG Accommodation",
  ownerName: "Vikram Singh",
  ownerPhone: "9876543210",
  ownerEmail: "vikram@sunshinepg.com",
  tenantName: "Rahul Verma",
  tenantPhone: "9123456780",
  tenantEmail: "rahul.verma@example.com",
  propertyAddress: "123, Tech Park Road, Sector 45, Gurgaon, Haryana 122003",
  roomBedNumber: "Room 204, Bed A",
  monthlyRent: "12000",
  securityDeposit: "24000",
  startDate: "2024-06-01",
  endDate: "2025-05-31",
  curfewTimings: "11:00 PM",
  guestPolicy: "Allowed during daytime only",
  smokingDrinkingRules: "Strictly Prohibited",
  noticePeriod: "30 Days",
  rentDueDay: "5",
  showTermRent: true,
  showTermDeposit: true,
  showTermPeriod: true,
  showRuleCurfew: true,
  showRuleGuest: true,
  showRuleSmoking: true,
  showRuleNotice: true,
  showRuleGeneral: true,
  selectedRules: ["No loud music after 10 PM", "Keep common areas clean"],
  generalCustomRules: [],
  customTerms: [],
};

const LeaseAgreementHero = () => {
  const scrollToGenerator = () => {
    document
      .getElementById("lease-generator-workspace")
      ?.scrollIntoView({behavior: "smooth"});
  };

  return (
    <div className="common-hero-section">
      {/* Decorative Floating Icons */}
      <div className="common-floating-icon common-icon-1">
        <FaFileContract />
      </div>
      <div className="common-floating-icon common-icon-2">
        <BsShieldCheck />
      </div>
      <div className="common-floating-icon common-icon-3">
        <FiCheckCircle />
      </div>
      <div className="common-floating-icon common-icon-4">
        <FaRupeeSign />
      </div>
      <div className="common-floating-icon common-icon-5">
        <FiFileText />
      </div>

      <div className="common-hero-container">
        {/* Left Side Content */}
        <div className="common-hero-left">
          <div className="common-hero-badge">
            100% Free Tool for PG Owners &amp; Landlords
          </div>

          <h1 className="common-hero-title">
            Lease Agreement
            <br />
            <span className="common-hero-highlight">Maker</span>
          </h1>

          <p className="common-hero-subtitle">
            Create professional, legally structured PG accommodation agreements
            <br />
            with house rules and terms in <strong>under 2 minutes.</strong>
          </p>

          <div className="common-hero-actions">
            <button className="common-btn-primary" onClick={scrollToGenerator}>
              Create Agreement ➔
            </button>
          </div>
        </div>

        {/* Right Side Mockup */}
        <div className="common-hero-right">
          <div className="common-mockup-wrapper">
            <div className="common-mockup-scale">
              <LeaseTemplate data={mockLeaseData} id="lease-hero-preview" />
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
              <strong>Drafts in</strong>
              <span>Minutes</span>
            </div>
          </div>
          <div className="common-banner-item">
            <div className="common-banner-icon">
              <BsShieldCheck />
            </div>
            <div className="common-banner-text">
              <strong>Legally</strong>
              <span>Structured</span>
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
              <span>Agreements</span>
            </div>
          </div>
          <div className="common-banner-item">
            <div className="common-banner-icon">
              <FaFileContract />
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

export default LeaseAgreementHero;
