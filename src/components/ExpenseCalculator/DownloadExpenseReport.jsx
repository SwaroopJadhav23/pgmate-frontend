import React, {useState, useRef, useEffect, useContext} from "react";
import {jsPDF} from "jspdf";
import * as htmlToImage from "html-to-image";
import {FiDownload, FiImage, FiFileText, FiChevronDown} from "react-icons/fi";
import toast from "react-hot-toast";
import {AuthContext} from "../../context/AuthContext";
import AuthRequiredModal from "../common/AuthRequiredModal";

const DownloadExpenseReport = ({formData, validateForm}) => {
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
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      throw new Error("Please fill all required fields before downloading.");
    }
  };

  /**
   * Convert any Chart.js <canvas> elements inside the node to <img> tags.
   * This prevents blank canvas in html-to-image captures.
   */
  // eslint-disable-next-line
  const convertCanvases = (root) => {
    const canvases = root.querySelectorAll("canvas");
    canvases.forEach((canvas) => {
      const img = document.createElement("img");
      img.src = canvas.toDataURL("image/png");
      img.width = canvas.width;
      img.height = canvas.height;
      img.style.cssText = canvas.style.cssText;
      canvas.parentNode.replaceChild(img, canvas);
    });
  };

  const captureReport = async () => {
    const liveNode = document.getElementById("expense-report-printable");
    if (!liveNode) throw new Error("Report element not found.");

    const clone = liveNode.cloneNode(true);
    clone.removeAttribute("id");
    clone.style.margin = "0"; // Prevent html-to-image shifting bug
    clone.style.transform = "none";
    clone.style.maxWidth = "none";

    // Convert canvases in the LIVE node first (to capture current chart state)
    const liveCanvases = liveNode.querySelectorAll("canvas");
    const cloneCanvases = clone.querySelectorAll("canvas");
    liveCanvases.forEach((canvas, i) => {
      const cloneCanvas = cloneCanvases[i];
      if (cloneCanvas) {
        const img = document.createElement("img");
        img.src = canvas.toDataURL("image/png");
        img.style.width = canvas.offsetWidth + "px";
        img.style.height = canvas.offsetHeight + "px";
        cloneCanvas.parentNode.replaceChild(img, cloneCanvas);
      }
    });

    const wrapper = document.createElement("div");
    wrapper.style.cssText = [
      "position:fixed",
      "top:-9999px",
      "left:0",
      "width:900px",
      "background:#ffffff",
      "z-index:99999",
    ].join(";");
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    await new Promise((r) => setTimeout(r, 200));

    let dataUrl, captureW, captureH;
    try {
      captureW = clone.offsetWidth || 900;
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
      const {dataUrl, width, height} = await captureReport();

      const MM_PER_PX = 25.4 / 96;
      const rW = width * MM_PER_PX;
      const rH = height * MM_PER_PX;

      const pgName = formData.pgName || "PG";
      const month = (formData.reportMonth || "").replace("-", "-");

      const pdf = new jsPDF({
        orientation: rW > rH ? "landscape" : "portrait",
        unit: "mm",
        format: [rW, rH],
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, rW, rH);
      pdf.save(`Expense-Report-${pgName}-${month}.pdf`);
      toast.success("Expense Report saved as PDF!");
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
      const {dataUrl} = await captureReport();

      const pgName = formData.pgName || "PG";
      const month = (formData.reportMonth || "").replace("-", "-");

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.download = `Expense-Report-${pgName}-${month}.png`;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      toast.success("Expense Report saved as Image!");
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
      <div className="exp-download-bar">
        <div className="download-dropdown-container" ref={dropdownRef}>
          <button
            className="btn-download-main exp-download-btn"
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner" /> Generating…
              </>
            ) : (
              <>
                <FiDownload size={18} /> Download Report{" "}
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
        featureName="Expense Report"
      />
    </>
  );
};

export default DownloadExpenseReport;
