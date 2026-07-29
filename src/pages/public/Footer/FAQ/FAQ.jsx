import { useState } from "react";
import HomeLayout from "../../../../layouts/HomeLayouts";
import FAQSection from "./FAQSection";
import useSEO from "../../../../hooks/useSEO";
import "./FAQ.css";

const FAQ = () => {
  const [activeTab, setActiveTab] = useState("user");

  useSEO({
    title: "FAQ | PGMate",
    description: "Find answers to frequently asked questions about PGMate. Learn how to list, manage, and find PGs on India's trusted platform."
  });

  return (
    <HomeLayout noFooterMargin={true}>
      <div className="faq-page-wrapper">
        <div className="faq-page-container">
          <header className="faq-hero">
            <span className="faq-badge">FAQ</span>
            <h1 className="faq-title">How can we help you?</h1>
            <p className="faq-subtitle">
              Browse our frequently asked questions to find answers quickly and get the most out of PGMate.
            </p>
          </header>

          <div className="faq-tabs-container">
            <button 
              className={`faq-tab ${activeTab === "user" ? "active" : ""}`}
              onClick={() => setActiveTab("user")}
            >
              For Users
            </button>
            <button 
              className={`faq-tab ${activeTab === "owner" ? "active" : ""}`}
              onClick={() => setActiveTab("owner")}
            >
              For PG Owners
            </button>
          </div>

          <div className="faq-content-wrapper">
            <FAQSection type={activeTab} />
          </div>
        </div>
      </div>
    </HomeLayout>
  );
};

export default FAQ;
