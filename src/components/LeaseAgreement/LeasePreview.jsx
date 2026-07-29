import React from "react";
import {FiEye} from "react-icons/fi";
import LeaseTemplate from "./LeaseTemplate";
import DownloadLease from "./DownloadLease";

/**
 * LeasePreview — Right panel.
 *
 * The template is ALWAYS kept in the DOM so that DownloadLease can find
 * it by id ("lease-printable") at any time — including during the brief
 * isGenerating animation.  The spinner is layered on top via CSS.
 */
const LeasePreview = ({formData, validateForm, isGenerating}) => (
  <div className="lease-preview-wrapper">
    <div className="lease-preview-header-flex">
      <div className="lease-preview-label">
        <FiEye /> LIVE PREVIEW
      </div>
    </div>

    <div className="lease-preview-container" style={{ position: "relative" }}>
      <div className="lease-scale-wrapper">
        {/* Always in DOM so getElementById never returns null */}
        <LeaseTemplate data={formData} id="lease-printable" />
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
            <div className="lease-loading-spinner" />
            <div className="lease-loading-text">Generating Agreement...</div>
          </div>
        )}
    </div>

    <DownloadLease formData={formData} validateForm={validateForm} />
  </div>
);

export default LeasePreview;

