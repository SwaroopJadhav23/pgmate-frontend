import React, {useState, useRef, useEffect, useContext} from "react";
import {jsPDF} from "jspdf";
import * as htmlToImage from "html-to-image";
import {FiDownload, FiImage, FiFileText, FiChevronDown} from "react-icons/fi";
import toast from "react-hot-toast";
import {AuthContext} from "../../context/AuthContext";
import AuthRequiredModal from "../common/AuthRequiredModal";

const DownloadLease = ({formData, validateForm}) => {
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

  const ensureValid = () => {
    const errs = validateForm({setErrors: false});
    if (Object.keys(errs).length > 0) {
      throw new Error("Please fill all required fields before downloading.");
    }
  };

  const captureTemplate = async () => {
    const liveNode = document.getElementById("lease-printable");
    if (!liveNode) throw new Error("Agreement element not found.");

    const clone = liveNode.cloneNode(true);
    clone.removeAttribute("id");

    const wrapper = document.createElement("div");
    wrapper.style.cssText = [
      "position:fixed",
      "top:-9999px",
      "left:0",
      "width:794px",
      "background:#ffffff",
      "z-index:99999",
    ].join(";");
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    await new Promise((r) => setTimeout(r, 150));

    let dataUrl, captureW, captureH;
    try {
      captureW = clone.offsetWidth || 794;
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

  const handleDownloadPDF = async () => {
    setShowDropdown(false);
    if (!isAuthenticated || !["OWNER", "SUPER_ADMIN", "PG_MANAGER"].includes(role)) {
      setPendingDownload("pdf");
      setShowAuthModal(true);
      return;
    }
    
    setLoadingPdf(true);
    try {
      ensureValid();
      const {dataUrl, width, height} = await captureTemplate();

      /* A4 in mm */
      const A4_W_MM = 210;
      const A4_H_MM = 297;

      /* px → mm at 96 dpi */
      const MM_PER_PX = 25.4 / 96;
      const docW_mm = width * MM_PER_PX; // ≈ 209.9 mm for 794 px
      const docH_mm = height * MM_PER_PX;

      /* Scale so image exactly fills A4 width */
      const scale = A4_W_MM / docW_mm;
      const imgW_mm = A4_W_MM;
      const imgH_mm = docH_mm * scale; // total rendered height in mm

      const pgName = formData.pgName || "PG";
      const tenantName = formData.tenantName || "Tenant";

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      /* Slice the image across A4 pages */
      let yOffset = 0;
      let pageIndex = 0;
      while (yOffset < imgH_mm) {
        if (pageIndex > 0) pdf.addPage("a4", "portrait");

        /* Draw the full image but shifted up so the current slice is on-screen */
        pdf.addImage(
          dataUrl,
          "PNG",
          0,
          -yOffset,
          imgW_mm,
          imgH_mm,
          undefined,
          "FAST",
        );

        yOffset += A4_H_MM;
        pageIndex++;
      }

      pdf.save(`Lease-Agreement-${pgName}-${tenantName}.pdf`);
      toast.success("Lease Agreement saved as PDF!");
    } catch (err) {
      console.error("PDF error:", err);
      toast.error(err.message || "Failed to generate PDF.");
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleDownloadImage = async () => {
    setShowDropdown(false);
    if (!isAuthenticated || !["OWNER", "SUPER_ADMIN", "PG_MANAGER"].includes(role)) {
      setPendingDownload("image");
      setShowAuthModal(true);
      return;
    }
    
    setLoadingImg(true);
    try {
      ensureValid();
      const {dataUrl} = await captureTemplate();

      const pgName = formData.pgName || "PG";
      const tenantName = formData.tenantName || "Tenant";

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.download = `Lease-Agreement-${pgName}-${tenantName}.png`;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      toast.success("Lease Agreement saved as Image!");
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
      <div className="lease-download-bar">
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
        featureName="Lease Agreement"
      />
    </>
  );
};

export default DownloadLease;
