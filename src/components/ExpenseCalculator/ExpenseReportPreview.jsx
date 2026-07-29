import React from "react";
import {FiEye} from "react-icons/fi";
import ExpenseReportTemplate from "./ExpenseReportTemplate";
import DownloadExpenseReport from "./DownloadExpenseReport";

/**
 * ExpenseReportPreview — Right panel.
 *
 * The template is ALWAYS kept in the DOM so that DownloadExpenseReport can
 * find it by id ("expense-report-printable") at any time — including during
 * the brief isGenerating animation.  The spinner is layered on top via CSS.
 */
const ExpenseReportPreview = ({formData, validateForm, isGenerating}) => (
  <div className="exp-preview-wrapper">
    <div className="exp-preview-header-flex">
      <div className="exp-preview-label">
        <FiEye /> LIVE PREVIEW
      </div>
    </div>

    <div className="exp-preview-container" style={{ position: "relative" }}>
      <div className="exp-scale-wrapper">
        {/* Always in DOM so getElementById never returns null */}
        <ExpenseReportTemplate data={formData} id="expense-report-printable" />
      </div>

        {/* Spinner overlaid on top during generate animation */}
        {isGenerating && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.85)",
              zIndex: 10,
            }}
          >
            <div className="exp-loading-spinner" />
            <div className="exp-loading-text">Calculating Expenses...</div>
          </div>
        )}
    </div>

    <DownloadExpenseReport formData={formData} validateForm={validateForm} />
  </div>
);

export default ExpenseReportPreview;

