import { useEffect, useState } from "react";
import "./ApkModal.css";
import { getApkDownloadUrl } from "../utils/apk";

// TODO: replace with real Play Store link once app is published
const PLAYSTORE_URL = "market://details?id=com.fourise.pgmate";
const PLAYSTORE_WEB_URL = "https://play.google.com/store/apps/details?id=com.fourise.pgmate";

const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ verticalAlign: "middle", marginRight: 6 }}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const MobileIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ verticalAlign: "middle", marginRight: 6 }}
  >
    <rect x="5" y="2" width="14" height="20" rx="3" />
    <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
  </svg>
);

const ApkDownloadModal = ({ show, setShow }) => {
  // eslint-disable-next-line
  const [activeStep, setActiveStep] = useState(0);

  const isAndroid = /Android/i.test(navigator.userAgent);

  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 2000);
    return () => clearInterval(interval);
  }, [show]);

  const handleDownload = () => {
    if (isAndroid) {
      const fallbackTimer = setTimeout(() => {
        window.location.href = PLAYSTORE_WEB_URL;
      }, 1500);
      window.addEventListener("pagehide", () => clearTimeout(fallbackTimer), { once: true });
      window.location.href = PLAYSTORE_URL;
    } else {
      window.open(PLAYSTORE_WEB_URL, "_blank");
    }
    setShow(false);
  };

  const handleClose = () => {
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="apk-overlay">
      <div className="apk-card">
        <div className="apk-pill-icon">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="5" y="2" width="14" height="20" rx="3" />
            <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2.5" />
          </svg>
        </div>
        <span className="apk-pill-label">Get PGMate App</span>
        <button className="apk-primary" onClick={handleDownload}>
          {isAndroid ? (
            <>
              <DownloadIcon />
              Download
            </>
          ) : (
            <>
              <MobileIcon />
              Get App
            </>
          )}
        </button>
        <button className="apk-close" onClick={handleClose}>✕</button>
      </div>
    </div>
  );
};

export default ApkDownloadModal;