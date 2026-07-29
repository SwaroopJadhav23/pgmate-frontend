import React, {useState, useRef, useEffect, useContext} from "react";
import {jsPDF} from "jspdf";
import * as htmlToImage from "html-to-image";
import {createReceipt} from "../../services/receiptService";
import {FiDownload, FiImage, FiFileText, FiChevronDown} from "react-icons/fi";
import toast from "react-hot-toast";
import {AuthContext} from "../../context/AuthContext";
import AuthRequiredModal from "../common/AuthRequiredModal";

const DownloadReceipt = ({
  formData,
  onReceiptSaved,
  validateForm,
  savedReceipt,
}) => {
  const {isAuthenticated, role} = useContext(AuthContext);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingDownload, setPendingDownload] = useState(null);

  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingImg, setLoadingImg] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (isAuthenticated && ["OWNER", "SUPER_ADMIN", "PG_MANAGER"].includes(role) && pendingDownload) {
      if (pendingDownload === "pdf") {
        handleDownloadPDF();
      } else if (pendingDownload === "image") {
        handleDownloadImage();
      }
      setPendingDownload(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, role, pendingDownload]);

  /* ── Helpers ── */
  const formatMonth = (monthStr) => {
    if (!monthStr) return "";
    if (/^\d{4}-\d{2}$/.test(monthStr)) {
      const [year, month] = monthStr.split("-");
      return new Date(year, parseInt(month, 10) - 1).toLocaleString("en-IN", {
        month: "long",
        year: "numeric",
      });
    }
    return monthStr;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split("-");
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  /* ── Save receipt to backend (only once per session) ── */
  const ensureSaved = async () => {
    if (savedReceipt) return savedReceipt;

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      throw new Error("Please fill all required fields before downloading.");
    }

    const rent = parseFloat(formData.rentAmount) || 0;
    const elec = parseFloat(formData.electricityCharges) || 0;
    const water = parseFloat(formData.waterCharges) || 0;
    const wifi = parseFloat(formData.wifiCharges) || 0;
    const security = parseFloat(formData.securityDeposit) || 0;
    const total = rent + elec + water + wifi + security;

    const payload = {
      tenantName: formData.tenantName,
      landlordName: formData.landlordName,
      pgName: formData.pgName,
      pgAddress: formData.pgAddress,
      amount: total,
      paymentMode: formData.paymentMode,
      forMonth: `${formatMonth(formData.fromMonth)} to ${formatMonth(formData.toMonth)}`,
      receiptDate: formatDate(formData.receiptDate),
      roomNumber: null,
      remarks: null,
    };

    const result = await createReceipt(payload);
    onReceiptSaved(result);
    // Wait for React to re-render with the new receipt number
    await new Promise((r) => setTimeout(r, 500));
    return result;
  };

  /**
   * Capture strategy:
   *  1. Clone the live receipt DOM node — always has current React-rendered data.
   *  2. Append it to document.body at top:-9999px / left:0 so the browser paints it.
   *  3. Capture with html-to-image at 2× resolution.
   *  4. Remove the clone.
   *
   * Positioning at left:0 (not left:-9999px) is critical — browsers skip painting
   * elements that are too far outside the viewport in both axes.
   */
  const captureReceipt = async () => {
    const liveNode = document.getElementById("receipt-printable");
    if (!liveNode)
      throw new Error("Receipt element not found. Please try again.");

    // Clone the live DOM so we always get current content
    const clone = liveNode.cloneNode(true);
    clone.removeAttribute("id"); // avoid duplicate IDs in document

    const wrapper = document.createElement("div");
    wrapper.style.cssText = [
      "position:fixed",
      "top:-9999px",
      "left:0", // horizontal position must be 0 for browser to paint
      "width:800px",
      "background:#ffffff",
      "z-index:99999",
    ].join(";");
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // Let the browser paint the new element
    await new Promise((r) => setTimeout(r, 100));

    let dataUrl, captureW, captureH;
    try {
      captureW = clone.offsetWidth || 800;
      captureH = clone.offsetHeight || clone.scrollHeight;

      dataUrl = await htmlToImage.toPng(clone, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width: captureW,
        height: captureH,
      });
    } finally {
      document.body.removeChild(wrapper);
    }

    return {dataUrl, width: captureW, height: captureH};
  };

  /* ── Download as PDF (A4, portrait) ── */
  const handleDownloadPDF = async () => {
    setShowDropdown(false);
    if (!isAuthenticated || !["OWNER", "SUPER_ADMIN", "PG_MANAGER"].includes(role)) {
      setPendingDownload("pdf");
      setShowAuthModal(true);
      return;
    }
    
    setLoadingPdf(true);
    try {
      const receipt = await ensureSaved();
      const {dataUrl, width, height} = await captureReceipt();

      // A4: 210 × 297 mm  |  10 mm margin on all sides
      const A4_W = 210;
      const A4_H = 297;
      const MARGIN = 10;

      // Convert pixels → mm (96 dpi)
      const MM_PER_PX = 25.4 / 96;
      const rW = width * MM_PER_PX;
      const rH = height * MM_PER_PX;

      const availW = A4_W - MARGIN * 2;
      const availH = A4_H - MARGIN * 2;
      const scale = Math.min(availW / rW, availH / rH, 1);

      const imgW = rW * scale;
      const imgH = rH * scale;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      pdf.addImage(dataUrl, "PNG", MARGIN, MARGIN, imgW, imgH);
      pdf.save(`Rent-Receipt-${receipt.receiptNumber}.pdf`);

      toast.success(`Receipt ${receipt.receiptNumber} saved as PDF!`);
    } catch (err) {
      console.error("PDF error:", err);
      toast.error(err.message || "Failed to generate PDF.");
    } finally {
      setLoadingPdf(false);
    }
  };

  /* ── Download as PNG ── */
  const handleDownloadImage = async () => {
    setShowDropdown(false);
    if (!isAuthenticated || !["OWNER", "SUPER_ADMIN", "PG_MANAGER"].includes(role)) {
      setPendingDownload("image");
      setShowAuthModal(true);
      return;
    }

    setLoadingImg(true);
    try {
      const receipt = await ensureSaved();
      const {dataUrl} = await captureReceipt();

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.download = `Rent-Receipt-${receipt.receiptNumber}.png`;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      toast.success(`Receipt ${receipt.receiptNumber} saved as Image!`);
    } catch (err) {
      console.error("Image error:", err);
      toast.error(err.message || "Failed to generate image.");
    } finally {
      setLoadingImg(false);
    }
  };

  const isLoading = loadingPdf || loadingImg;

  return (
    <>
      <div className="receipt-download-bar">
        <div className="download-dropdown-container" ref={dropdownRef}>
          <button
            className="btn-download-main"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown((prev) => !prev);
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner" /> Generating…
              </>
            ) : (
              <>
                <FiDownload size={18} /> Download{" "}
                <FiChevronDown
                  className={`dropdown-icon ${showDropdown ? "open" : ""}`}
                />
              </>
            )}
          </button>

          {showDropdown && !isLoading && (
            <div className="download-dropdown-menu">
              <button className="dropdown-item" onClick={handleDownloadImage}>
                <FiImage size={16} /> Download as Image (PNG)
              </button>
              <button className="dropdown-item" onClick={handleDownloadPDF}>
                <FiFileText size={16} /> Download as PDF
              </button>
            </div>
          )}
        </div>
      </div>
      
      <AuthRequiredModal 
        isOpen={showAuthModal} 
        onClose={() => {
          setShowAuthModal(false);
          setPendingDownload(null);
        }}
        featureName="Rent Receipt"
      />
    </>
  );
};

export default DownloadReceipt;
