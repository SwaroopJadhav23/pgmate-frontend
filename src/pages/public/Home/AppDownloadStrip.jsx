import { ShieldCheck, Headphones, Lock } from "lucide-react";
import QRCode from "react-qr-code";
import { getApkDownloadUrl } from "../../../utils/apk";

const AppDownloadStrip = () => {
  const apkUrl = getApkDownloadUrl();

  return (
    <>
      <style>{CSS}</style>

      {/* ── APP DOWNLOAD BANNER ── */}
      <section className="adl-banner">
        {/* Left: phone mockup */}
        <div className="adl-phone-mockup" aria-hidden="true">
          <div className="adl-phone-frame">
            <div className="adl-phone-screen">
              <div className="adl-screen-top-bar" />
              <div className="adl-screen-content">
                <div className="adl-screen-search" />
                <div className="adl-screen-card" />
                <div className="adl-screen-card adl-screen-card--short" />
              </div>
            </div>
          </div>
        </div>

        {/* Center: text + store buttons */}
        <div className="adl-banner-center">
          <h3 className="adl-banner-heading">Get the PGMate App</h3>
          <p className="adl-banner-sub">
            Search PGs faster, get instant notifications and save your favorite listings.
          </p>
          <div className="adl-store-row">
            {/* Google Play */}
            <a
              href="https://play.google.com/store/apps/details?id=com.fourise.pgmate"
              target="_blank"
              rel="noopener noreferrer"
              className="adl-store-badge"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                <path d="M3.18 23.76c.37.2.8.2 1.18 0l11.09-6.41-2.54-2.54-9.73 8.95zM.5 1.26C.19 1.62 0 2.13 0 2.77v18.46c0 .64.19 1.15.5 1.51l.08.08 10.34-10.34v-.24L.58 1.18.5 1.26zM20.4 10.59l-2.97-1.71-2.85 2.85 2.85 2.85 2.97-1.71c.85-.49.85-1.79 0-2.28zM4.36.24L15.45 6.65l-2.54 2.54-9.73-8.87c.38-.2.81-.2 1.18-.08z"/>
              </svg>
              <span>
                <small>GET IT ON</small>
                Google Play
              </span>
            </a>

            {/* App Store */}
            <a
              href="https://pgmate.in/apk/pgmate.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="adl-store-badge"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.2 1.3-2.18 3.87.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.35 2.61M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/>
              </svg>
              <span>
                <small>Download on the</small>
                App Store
              </span>
            </a>
          </div>
        </div>

        {/* Right: QR code */}
        <div className="adl-qr-wrap">
          <div className="adl-qr-box">
            <QRCode
              value="https://pgmate.in/apk/pgmate.apk"
              size={110}
              bgColor="#ffffff"
              fgColor="#1e1b4b"
              level="M"
            />
          </div>
          <p className="adl-qr-label">Scan to download APK</p>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="adl-trust">
        <div className="adl-trust-item">
          <ShieldCheck size={20} />
          <div>
            <strong>100% Verified Listings</strong>
            <span>Manually verified properties</span>
          </div>
        </div>
        <div className="adl-trust-item">
          <Headphones size={20} />
          <div>
            <strong>24x7 Support</strong>
            <span>We're here to help anytime</span>
          </div>
        </div>
        <div className="adl-trust-item">
          <Lock size={20} />
          <div>
            <strong>Safe &amp; Secure</strong>
            <span>Your safety is our priority</span>
          </div>
        </div>
      </section>
    </>
  );
};

export default AppDownloadStrip;

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const CSS = `
  /* BANNER */
  .adl-banner {
    max-width: 1280px;
    margin: 0 auto 24px;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    border-radius: 24px;
    padding: 36px 48px;
    display: flex;
    align-items: center;
    gap: 32px;
    color: #fff;
    overflow: hidden;
    position: relative;
    box-shadow: 0 12px 35px rgba(99, 102, 241, 0.15);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .adl-banner:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 45px rgba(99, 102, 241, 0.25);
  }

  /* subtle radial glow for depth */
  .adl-banner::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 260px; height: 260px;
    border-radius: 50%;
    background: rgba(255,255,255,0.07);
    pointer-events: none;
  }

  /* PHONE MOCKUP */
  .adl-phone-mockup {
    flex-shrink: 0;
  }
  .adl-phone-frame {
    width: 62px;
    height: 110px;
    border: 2.5px solid rgba(255,255,255,0.45);
    border-radius: 14px;
    background: rgba(255,255,255,0.12);
    padding: 6px 5px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .adl-phone-screen {
    flex: 1;
    border-radius: 8px;
    background: rgba(255,255,255,0.18);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px;
  }
  .adl-screen-top-bar {
    height: 5px;
    border-radius: 4px;
    background: rgba(255,255,255,0.5);
  }
  .adl-screen-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }
  .adl-screen-search {
    height: 7px;
    border-radius: 4px;
    background: rgba(255,255,255,0.35);
  }
  .adl-screen-card {
    height: 22px;
    border-radius: 4px;
    background: rgba(255,255,255,0.25);
  }
  .adl-screen-card--short {
    height: 14px;
  }

  /* CENTER TEXT */
  .adl-banner-center {
    flex: 1;
    min-width: 0;
  }
  .adl-banner-heading {
    margin: 0 0 6px;
    font-size: 1.35rem;
    font-weight: 800;
    line-height: 1.2;
  }
  .adl-banner-sub {
    margin: 0 0 20px;
    font-size: 0.88rem;
    opacity: 0.9;
    max-width: 360px;
    line-height: 1.5;
  }

  /* STORE BADGES */
  .adl-store-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .adl-store-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.12);
    border: 1.5px solid rgba(255,255,255,0.35);
    color: #fff;
    border-radius: 12px;
    padding: 9px 16px;
    font-size: 0.88rem;
    font-weight: 700;
    text-decoration: none;
    transition: background 0.2s ease, transform 0.15s ease;
    line-height: 1.25;
  }
  .adl-store-badge small {
    display: block;
    font-size: 0.65rem;
    font-weight: 400;
    opacity: 0.85;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .adl-store-badge:hover {
    background: rgba(255,255,255,0.22);
    transform: translateY(-1px);
  }

  /* QR CODE */
  .adl-qr-wrap {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .adl-qr-box {
    background: #fff;
    border-radius: 12px;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  }
  .adl-qr-label {
    margin: 0;
    font-size: 0.72rem;
    opacity: 0.85;
    text-align: center;
    font-weight: 500;
  }

  /* TRUST STRIP */
  .adl-trust {
    max-width: 1280px;
    margin: 0 auto 56px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    padding: 0 32px;
  }
  .adl-trust-item {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #f8f9ff;
    border: 1px solid #eceef9;
    border-radius: 16px;
    padding: 16px 18px;
    color: #4f46e5;
  }
  .adl-trust-item strong {
    display: block;
    font-size: 0.88rem;
    color: #0f172a;
  }
  .adl-trust-item span {
    font-size: 0.76rem;
    color: #64748b;
  }

  /* RESPONSIVE */
  @media (max-width: 760px) {
    .adl-banner {
      flex-direction: column;
      align-items: stretch;
      padding: 28px 20px;
      gap: 20px;
      margin: 0 16px 24px;
    }
    .adl-phone-mockup { display: none; }
    .adl-banner-center { width: 100%; box-sizing: border-box; }
    .adl-banner-sub { max-width: 100%; }
    .adl-store-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    .adl-store-badge {
      width: 100%;
      justify-content: center;
      box-sizing: border-box;
    }
    .adl-qr-wrap {
      width: 100%;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-top: 16px;
      padding-top: 20px;
      border-top: 1px dashed rgba(255, 255, 255, 0.25);
    }
    .adl-qr-label { 
      text-align: center; 
      font-size: 0.85rem; 
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
      letter-spacing: 0.3px;
    }
    .adl-trust { grid-template-columns: 1fr; padding: 0 18px; }
  }
`;