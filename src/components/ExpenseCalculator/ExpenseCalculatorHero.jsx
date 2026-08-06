import React from "react";
import {FiClock, FiFileText, FiTrendingUp, FiPieChart} from "react-icons/fi";
import {FaRupeeSign, FaCalculator} from "react-icons/fa";
import { BsArrowRight } from 'react-icons/bs';
import ExpenseReportTemplate from "./ExpenseReportTemplate";

export const mockExpenseData = {
  pgName: "Sunshine PG Accommodation",
  reportMonth: "2024-05",
  numRooms: "15",
  totalBeds: "30",
  occupiedBeds: "28",
  rentCollected: "224000",
  securityReceived: "16000",
  parkingCharges: "2500",
  laundryCharges: "1200",
  otherIncome: "500",
  foodKitchen: "45000",
  staffSalary: "25000",
  utilities: "18500",
  maintenance: "5000",
  miscExpenses: "2500",
};

const ExpenseCalculatorHero = () => {
  const scrollToGenerator = () => {
    document
      .getElementById("exp-generator-workspace")
      ?.scrollIntoView({behavior: "smooth"});
  };

  return (
    <div className="common-hero-section">
      {/* Decorative Floating Icons */}
      <div className="common-floating-icon common-icon-1">
        <FiPieChart />
      </div>
      <div className="common-floating-icon common-icon-2">
        <FaRupeeSign />
      </div>
      <div className="common-floating-icon common-icon-3">
        <FiTrendingUp />
      </div>
      <div className="common-floating-icon common-icon-4">
        <FaCalculator />
      </div>
      <div className="common-floating-icon common-icon-5">
        <FiFileText />
      </div>

      <div className="common-hero-container">
        {/* Left Side Content */}
        <div className="common-hero-left">
          <div className="common-hero-badge">
            100% Free Tool for PG Owners &amp; Managers
          </div>

          <h1 className="common-hero-title">
            Expense
            <br />
            <span className="common-hero-highlight">Calculator</span>
          </h1>

          <p className="common-hero-subtitle">
            Track your PG's income, expenses, and net profit with visual charts
            <br />
            and printable monthly reports in <strong>under 2 minutes.</strong>
          </p>

          <div className="common-hero-actions">
            <button className="common-btn-primary" onClick={scrollToGenerator}>
              Calculate Expenses ➔
            </button>
          </div>
        </div>

        {/* Right Side Mockup */}
        <div className="common-hero-right">
          <div className="common-mockup-wrapper exp-mockup-wrapper">
            <div className="common-mockup-scale">
              <ExpenseReportTemplate
                data={mockExpenseData}
                id="exp-hero-preview"
              />
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
              <strong>Calculates in</strong>
              <span>Seconds</span>
            </div>
          </div>
          <div className="common-banner-item">
            <div className="common-banner-icon">
              <FiPieChart />
            </div>
            <div className="common-banner-text">
              <strong>Visual</strong>
              <span>Charts</span>
            </div>
          </div>
          <div className="common-banner-item">
            <div className="common-banner-icon">
              <FiFileText />
            </div>
            <div className="common-banner-text">
              <strong>Printable</strong>
              <span>PDF Reports</span>
            </div>
          </div>
          <div className="common-banner-item">
            <div className="common-banner-icon">
              <FiTrendingUp />
            </div>
            <div className="common-banner-text">
              <strong>Net Profit</strong>
              <span>Analysis</span>
            </div>
          </div>
          <div className="common-banner-item">
            <div className="common-banner-icon">
              <FaCalculator />
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

export default ExpenseCalculatorHero;
