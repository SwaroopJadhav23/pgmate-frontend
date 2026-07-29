import { useEffect, useRef } from "react";
import "./DemoVideoModal.css";

const PlayIcon = () => (
  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 2.5a.5.5 0 0 1 .765-.424l10 5.5a.5.5 0 0 1 0 .848l-10 5.5A.5.5 0 0 1 3 13.5v-11z" />
  </svg>
);

const DemoVideoModal = ({ show, onClose }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (show && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    if (!show && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [show]);

  // Close on Escape
  useEffect(() => {
    if (!show) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      className="demo-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Quick Tour"
    >
      <div className="demo-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="demo-header">
          <span className="demo-title-pill">
            <PlayIcon />
            Quick Tour
          </span>
          <button
            className="demo-close"
            onClick={onClose}
            aria-label="Close tour"
          >
            ✕
          </button>
        </div>

        {/* Video */}
        <div className="demo-video-wrap">
          <video
            ref={videoRef}
            src="/demo.mp4"
            muted
            autoPlay
            controls
            playsInline
            className="demo-video"
          />
        </div>

        {/* Footer */}
        <div className="demo-footer">
          <p className="demo-footer-text">
            See how <strong>PGMate</strong> helps you find the perfect PG
          </p>
          <button className="demo-skip" onClick={onClose}>
            Skip for now
          </button>
        </div>

      </div>
    </div>
  );
};

export default DemoVideoModal;