import React from "react";
import {useNavigate} from "react-router-dom";
import {
  FiZap,
  FiArrowRight,
  FiFileText,
  FiTarget,
  FiShield,
  FiTrendingUp,
  FiChevronRight,
} from "react-icons/fi";
import {
  FaUtensils,
  FaReceipt,
  FaFileContract,
  FaCalculator,
  FaRegBuilding,
  FaUsers,
  FaRupeeSign,
  FaRegBell,
  FaChartBar,
} from "react-icons/fa";
import {BsShieldCheck} from "react-icons/bs";
import {useScrollReveal} from "../../hooks/useScrollReveal";
import useSEO from "../../hooks/useSEO";
import heroIllustration from "../../assets/hero-illustration.png";
import bannerImg from "../../assets/banner.png";
import saveTimeImg from "../../assets/save_time.png";
import professionalImg from "../../assets/professional.png";
import alwaysAvailableImg from "../../assets/always_available.png";
import privateImg from "../../assets/100_percent_private.png";
import "./Tools.css";

const Tools = () => {
  useScrollReveal();
  useSEO({
    title: "Smart PG Tools | PGMate",
    description: "Manage your PG efficiently with our suite of smart tools including menu generators, rent receipt creators, lease agreement generators, and expense calculators."
  });
  const navigate = useNavigate();

  return (
    <div className="tools-page">
      {/* Hero Section */}
      <div className="tools-hero-wrapper">
        <div className="tools-hero-container">
          <section className="tools-hero">
            <div className="tools-hero-content">
              <h1 className="tools-hero-title reveal-on-scroll">
                Manage your PG
                <br />
                with <span className="text-accent">Smart Tools</span>
              </h1>
              <p className="tools-hero-desc reveal-on-scroll delay-100">
                Generate menus, create rent receipts, draft lease
                <br />
                agreements, and calculate expenses instantly
              </p>
              <div className="tools-hero-buttons reveal-on-scroll delay-200">
                <button
                  className="btn-explore"
                  onClick={() =>
                    document
                      .querySelector(".tools-workflow-section")
                      ?.scrollIntoView({behavior: "smooth"})
                  }
                >
                  Discover &darr;
                </button>
                <button
                  className="btn-tools"
                  onClick={() =>
                    document
                      .querySelector(".tools-main")
                      ?.scrollIntoView({behavior: "smooth"})
                  }
                >
                  Tools &rarr;
                </button>
              </div>
            </div>
            <div className="tools-hero-image-container reveal-on-scroll delay-300">
              <img
                src={heroIllustration}
                alt="PG Tools Illustration"
                className="tools-hero-image"
              />
            </div>
          </section>

          <div className="tools-hero-features-banner reveal-on-scroll delay-400">
            <div className="feature-item">
              <div className="feature-icon-circle">
                <BsShieldCheck size={24} className="feature-icon" />
              </div>
              <div className="feature-text">
                <span className="feature-title">Better Security</span>
                <span className="feature-subtitle">
                  Your PG data is 100% safe
                </span>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon-circle">
                <FiZap size={24} className="feature-icon" />
              </div>
              <div className="feature-text">
                <span className="feature-title">Instant Creation</span>
                <span className="feature-subtitle">
                  Generate docs in seconds
                </span>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon-circle">
                <FiFileText size={24} className="feature-icon" />
              </div>
              <div className="feature-text">
                <span className="feature-title">Print Ready</span>
                <span className="feature-subtitle">Professional & branded</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tools Section */}
      <section className="tools-main">
        <div className="tools-main-container">
          <div className="tools-section-header reveal-on-scroll">
            <span className="tools-section-label">TOOLS FOR PG OWNERS</span>
            <h2 className="tools-section-title">
              Everything you need to manage
              <br />
              your <span className="text-accent">PG business,</span> in one
              place
            </h2>
            <p className="tools-section-subtitle">
              Simple, smart and powerful tools to save time, reduce paperwork,
              <br />
              and stay in control of your PG operations.
            </p>
          </div>

          <div className="tools-grid">
            {/* Menu Generator Card */}
            <div
              className="tool-card reveal-on-scroll delay-100"
              onClick={() => navigate("/tools/food-menu-generator")}
            >
              <div className="tool-card-body">
                <div className="tool-card-icon-wrapper">
                  <FaUtensils className="tool-card-icon" />
                </div>
                <div className="tool-card-text">
                  <h3 className="tool-card-title">Food Menu Generator</h3>
                  <p className="tool-card-desc">
                    Generate balanced weekly meal plans for your PG — Veg,
                    Non-Veg, or Mixed. Download and print instantly.
                  </p>
                </div>
              </div>
              <div className="tool-card-footer">
                Open Tool <FiArrowRight size={16} className="arrow-icon" />
              </div>
            </div>

            {/* Rent Receipt Generator Card */}
            <div
              className="tool-card reveal-on-scroll delay-200"
              onClick={() => navigate("/tools/rent-receipt-generator")}
            >
              <div className="tool-card-body">
                <div className="tool-card-icon-wrapper">
                  <FaReceipt className="tool-card-icon" />
                </div>
                <div className="tool-card-text">
                  <h3 className="tool-card-title">Rent Receipt Maker</h3>
                  <p className="tool-card-desc">
                    Create professional rent receipts for your tenants in
                    seconds. Export as a branded PDF instantly.
                  </p>
                </div>
              </div>
              <div className="tool-card-footer">
                Open Tool <FiArrowRight size={16} className="arrow-icon" />
              </div>
            </div>

            {/* Lease Agreement Generator Card */}
            <div
              className="tool-card reveal-on-scroll delay-300"
              onClick={() => navigate("/tools/lease-agreement-generator")}
            >
              <div className="tool-card-body">
                <div className="tool-card-icon-wrapper">
                  <FaFileContract className="tool-card-icon" />
                </div>
                <div className="tool-card-text">
                  <h3 className="tool-card-title">Lease Agreement Creator</h3>
                  <p className="tool-card-desc">
                    Draft comprehensive PG accommodation agreements with
                    integrated house rules and conditions.
                  </p>
                </div>
              </div>
              <div className="tool-card-footer">
                Open Tool <FiArrowRight size={16} className="arrow-icon" />
              </div>
            </div>

            {/* Expense Calculator Card */}
            <div
              className="tool-card reveal-on-scroll delay-400"
              onClick={() => navigate("/tools/expense-calculator")}
            >
              <div className="tool-card-body">
                <div className="tool-card-icon-wrapper">
                  <FaCalculator className="tool-card-icon" />
                </div>
                <div className="tool-card-text">
                  <h3 className="tool-card-title">Expense Calculator</h3>
                  <p className="tool-card-desc">
                    Track your PG's income and expenses. Generate visual reports
                    and business insights instantly.
                  </p>
                </div>
              </div>
              <div className="tool-card-footer">
                Open Tool <FiArrowRight size={16} className="arrow-icon" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="tools-benefits">
        <div className="benefits-header reveal-on-scroll">
          <span className="benefits-label">
            WHY CHOOSE PGMATE TOOLS
          </span>
          <h2 className="benefits-title">
            Why use <span className="text-accent">PGMate Tools?</span>
          </h2>
          <p className="benefits-subtitle">
            Powerful tools built for PG owners. Save time, stay organized,
            <br />
            and grow your business with confidence.
          </p>
        </div>

        <div className="benefits-grid">
          <div className="benefit-item reveal-on-scroll delay-100">
            <div className="benefit-illustration-wrapper">
              <img src={saveTimeImg} alt="Save Time" className="benefit-illustration" />
            </div>
            <h4 className="benefit-item-title">Save Time</h4>
            <p className="benefit-item-desc">
              Automate your daily operational tasks and focus on what really
              matters — growth.
            </p>
          </div>

          <div className="benefit-item reveal-on-scroll delay-200">
            <div className="benefit-illustration-wrapper">
              <img src={professionalImg} alt="Professional" className="benefit-illustration" />
            </div>
            <h4 className="benefit-item-title">Professional</h4>
            <p className="benefit-item-desc">
              Generate clean, branded, print-ready documents in seconds.
            </p>
          </div>

          <div className="benefit-item reveal-on-scroll delay-300">
            <div className="benefit-illustration-wrapper">
              <img src={alwaysAvailableImg} alt="Always Available" className="benefit-illustration" />
            </div>
            <h4 className="benefit-item-title">Always Available</h4>
            <p className="benefit-item-desc">
              Access our toolkit anytime, from any device, for free.
            </p>
          </div>

          <div className="benefit-item reveal-on-scroll delay-400">
            <div className="benefit-illustration-wrapper">
              <img src={privateImg} alt="100% Private" className="benefit-illustration" />
            </div>
            <h4 className="benefit-item-title">100% Private</h4>
            <p className="benefit-item-desc">
              Your data stays on your device. Secure, offline-capable
              generation.
            </p>
          </div>
        </div>
      </section>

      {/* Streamline Operations Workflow Section */}
      <section className="tools-workflow-section">
        <div className="workflow-container">
          <div className="workflow-content">
            <span className="workflow-label">ALL-IN-ONE SOLUTION</span>
            <h2 className="workflow-title">
              Streamline your PG operations from start{" "}
              <span className="text-accent">to finish.</span>
            </h2>

            <div className="workflow-features">
              <div className="wf-feature">
                <div className="wf-feature-icon-box">
                  <FiTarget />
                </div>
                <div className="wf-feature-text">
                  <h4>Everything in One Place</h4>
                  <p>
                    All essential tools to run your PG business, in one
                    platform.
                  </p>
                </div>
              </div>
              <div className="wf-feature">
                <div className="wf-feature-icon-box">
                  <FiShield />
                </div>
                <div className="wf-feature-text">
                  <h4>Built for PG Owners</h4>
                  <p>Designed specifically for PG and rental business needs.</p>
                </div>
              </div>
              <div className="wf-feature">
                <div className="wf-feature-icon-box">
                  <FiTrendingUp />
                </div>
                <div className="wf-feature-text">
                  <h4>Save Time, Grow More</h4>
                  <p>
                    Automate tasks, stay organized, and focus on what matters
                    most.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="workflow-steps-graphic">
            <div className="wf-steps-grid">
              <div className="wf-step step-1">
                <div className="wf-conn-arrow">
                  <FiChevronRight />
                </div>
                <div className="wf-step-badge">01</div>
                <div className="wf-step-card">
                  <div className="wf-step-icon">
                    <FaRegBuilding />
                  </div>
                  <h4>Setup</h4>
                  <p>Add your property, rooms, and set rent details.</p>
                </div>
              </div>
              <div className="wf-step step-2">
                <div className="wf-conn-arrow">
                  <FiChevronRight />
                </div>
                <div className="wf-step-badge">02</div>
                <div className="wf-step-card">
                  <div className="wf-step-icon">
                    <FaUsers />
                  </div>
                  <h4>Manage</h4>
                  <p>Add tenants, agreements, and keep everything organized.</p>
                </div>
              </div>
              <div className="wf-step step-3">
                <div className="conn-path-u-turn"></div>
                <div className="conn-path-return"></div>
                <div className="conn-path-u-turn-left">
                  <div className="wf-conn-arrow conn-arrow-snake">
                    <FiChevronRight />
                  </div>
                </div>
                <div className="wf-step-badge">03</div>
                <div className="wf-step-card">
                  <div className="wf-step-icon">
                    <FaRupeeSign />
                  </div>
                  <h4>Track & Collect</h4>
                  <p>Track rent, payments, and dues in real-time.</p>
                </div>
              </div>
              <div className="wf-step step-empty"></div>
              <div className="wf-step step-4">
                <div className="wf-conn-arrow">
                  <FiChevronRight />
                </div>
                <div className="wf-step-badge">04</div>
                <div className="wf-step-card">
                  <div className="wf-step-icon">
                    <FaRegBell />
                  </div>
                  <h4>Stay Updated</h4>
                  <p>
                    Send reminders, manage issues, and communicate with tenants.
                  </p>
                </div>
              </div>
              <div className="wf-step step-5">
                <div className="wf-step-badge">05</div>
                <div className="wf-step-card">
                  <div className="wf-step-icon">
                    <FaChartBar />
                  </div>
                  <h4>Get Insights</h4>
                  <p>
                    View reports, revenue analytics, and grow your PG business.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="workflow-banner-image-container">
          <img
            src={bannerImg}
            alt="Powerful tools. Simple workflow. Better management."
            className="workflow-banner-img"
          />
        </div>
      </section>
    </div>
  );
};

export default Tools;
