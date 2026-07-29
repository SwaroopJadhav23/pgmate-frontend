import React from "react";
import ReceiptTemplate from "./ReceiptTemplate";
import DownloadReceipt from "./DownloadReceipt";

/**
 * ReceiptPreview — Right panel.
 * Shows a scaled-down live preview of the receipt.
 *
 * The template is ALWAYS kept in the DOM so that DownloadReceipt can find
 * it by id ("receipt-printable") at any time — including during the brief
 * isGenerating animation.  The spinner is layered on top via CSS.
 */
const ReceiptPreview = ({
  formData,
  receiptNumber,
  savedReceipt,
  onReceiptSaved,
  validateForm,
  isGenerating,
}) => {
  const displayData = {
    ...formData,
    receiptNumber: receiptNumber || "PENDING",
  };

  return (
    <div className="rr-preview-content">
      {/* Scaled preview container — template always mounted */}
      <div className="receipt-preview-container" style={{ position: "relative" }}>
        <div className="receipt-scale-wrapper">
          {/* Always in DOM so getElementById never returns null */}
          <ReceiptTemplate data={displayData} id="receipt-printable" />
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
              <div className="receipt-loading-spinner" />
              <div className="receipt-loading-text">
                Generating Professional Receipt...
              </div>
            </div>
          )}
      </div>

      {/* Download buttons below the card */}
      <DownloadReceipt
        formData={formData}
        savedReceipt={savedReceipt}
        onReceiptSaved={onReceiptSaved}
        validateForm={validateForm}
      />
    </div>
  );
};

export default ReceiptPreview;

