import React from "react";
import expenseReportStepsImg from "../../assets/expense_report_steps.png";

const ExpenseCalculatorFeatures = () => {
  return (
    <div className="seo-features-wrapper">
      <div className="seo-content-section seo-features-section">
        <div className="seo-block">
          <h2 className="seo-title">How to Calculate & Generate Reports?</h2>
          <p className="seo-subtitle">
            Easily track your PG's income and expenses in 3 simple steps.
          </p>
          <div className="seo-image-wrapper" style={{ marginTop: '30px' }}>
            <img src={expenseReportStepsImg} alt="Expense Report Steps" style={{ width: '100%', height: 'auto' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCalculatorFeatures;
