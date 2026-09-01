import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { MapPin, Home, MessageSquareMore } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import api from "../../api/axios";
import "../../CSS/pgDetail.css";
import Swal from "sweetalert2";
import ReserveSeatModal from "./ReserveSeatModal";
import EnquiryForm from "./EnquiryForm";
import BedPickerPopup from "./BedPickerPopup";
import PGListingCard from "./PGListingCard";
import { PGListingSkeleton } from "./Skeleton";
import { Tag } from "lucide-react";
import { AMENITY_ICONS } from "../../constants/Amenityicons";
import ApkDownloadModal from "../../components/ApkModal";
import ReviewSection from "./ReviewSection";

/* ══════════════════════════════
   OFFER COLOR PALETTE
══════════════════════════════ */
const OFFER_PALETTES = [
  {
    bg: "linear-gradient(135deg,#f59e0b,#d97706)",
    shadow: "0 6px 20px rgba(245,158,11,0.45)",
    shadowLg: "0 8px 28px rgba(245,158,11,0.58)",
  },
  {
    bg: "linear-gradient(135deg,#0891b2,#0e7490)",
    shadow: "0 6px 20px rgba(8,145,178,0.4)",
    shadowLg: "0 8px 28px rgba(8,145,178,0.55)",
  },
  {
    bg: "linear-gradient(135deg,#7c3aed,#6d28d9)",
    shadow: "0 6px 20px rgba(124,58,237,0.42)",
    shadowLg: "0 8px 28px rgba(124,58,237,0.56)",
  },
  {
    bg: "linear-gradient(135deg,#be185d,#db2777)",
    shadow: "0 6px 20px rgba(190,24,93,0.4)",
    shadowLg: "0 8px 28px rgba(190,24,93,0.54)",
  },
  {
    bg: "linear-gradient(135deg,#059669,#047857)",
    shadow: "0 6px 20px rgba(5,150,105,0.4)",
    shadowLg: "0 8px 28px rgba(5,150,105,0.54)",
  },
  {
    bg: "linear-gradient(135deg,#2563eb,#1d4ed8)",
    shadow: "0 6px 20px rgba(37,99,235,0.4)",
    shadowLg: "0 8px 28px rgba(37,99,235,0.54)",
  },
];

const getOfferPalette = (pgId) => {
  if (!pgId) return OFFER_PALETTES[0];
  const hash = String(pgId)
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return OFFER_PALETTES[hash % OFFER_PALETTES.length];
};

/* ══════════════════════════════
   MODAL REVIEW IMAGE CAROUSEL
══════════════════════════════ */
// eslint-disable-next-line no-unused-vars
const ModalReviewCarousel = ({ images, onZoom }) => {
  const [idx, setIdx] = useState(0);
  if (!images?.length) return null;

  return (
    <div
      style={{
        position: "relative",
        marginTop: "10px",
        borderRadius: "12px",
        overflow: "hidden",
        background: "#0f172a",
      }}
    >
      <div
        style={{ position: "relative", cursor: "zoom-in" }}
        onClick={() => onZoom(images, idx)}
      >
        <img
          src={images[idx]}
          alt={`Review ${idx + 1}`}
          style={{
            width: "100%",
            height: "200px",
            objectFit: "cover",
            display: "block",
            borderRadius: "12px",
          }}
        />
        <span
          style={{
            position: "absolute",
            bottom: "8px",
            right: "10px",
            background: "rgba(0,0,0,0.5)",
            color: "#fff",
            fontSize: "11px",
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: "20px",
            backdropFilter: "blur(6px)",
            pointerEvents: "none",
          }}
        >
          🔍 Tap to zoom
        </span>
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIdx((idx - 1 + images.length) % images.length);
            }}
            style={{
              position: "absolute",
              top: "50%",
              left: "8px",
              transform: "translateY(-50%)",
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff",
              fontSize: "16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(8px)",
              zIndex: 2,
            }}
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIdx((idx + 1) % images.length);
            }}
            style={{
              position: "absolute",
              top: "50%",
              right: "8px",
              transform: "translateY(-50%)",
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff",
              fontSize: "16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(8px)",
              zIndex: 2,
            }}
          >
            ›
          </button>

          <div
            style={{
              position: "absolute",
              bottom: "8px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "5px",
              zIndex: 2,
            }}
          >
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setIdx(i);
                }}
                style={{
                  width: i === idx ? "16px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  border: "none",
                  background: i === idx ? "#fff" : "rgba(255,255,255,0.45)",
                  padding: 0,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              fontSize: "11px",
              fontWeight: 600,
              padding: "3px 8px",
              borderRadius: "20px",
              backdropFilter: "blur(6px)",
              pointerEvents: "none",
            }}
          >
            {idx + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

/* ══════════════════════════════
   COMPONENT
══════════════════════════════ */
const PGDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pg, setPg] = useState(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [sharingType, setSharingType] = useState("");
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [nearbyPGs, setNearbyPGs] = useState([]);
  const [showReserve, setShowReserve] = useState(false);
  const [selectedBeds, setSelectedBeds] = useState([]);
  const [showAvailability, setShowAvailability] = useState(false);
  const [me, setMe] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [showApkModal, setShowApkModal] = useState(false);

  useEffect(() => {
    setShowApkModal(true);
  }, []);

  const token = localStorage.getItem("token") || null;
  const role = localStorage.getItem("role") || null;
  const isUser = !!token && role === "USER";
  const [loading, setLoading] = useState(true);
  const [nearbyLoading, setNearbyLoading] = useState(true);

  useEffect(() => {
    if (!isUser) return;
    api
      .get("/users/me")
      .then((res) => setMe(res.data))
      .catch(() => {
        localStorage.clear();
        setMe(null);
        navigate("/login");
      });
  }, [isUser, navigate]);

  useEffect(() => {
    const fetchPG = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/public/pg-details/${id}`);
        setPg(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPG();
  }, [id]);

  useEffect(() => {
    setImgIndex(0);
  }, [pg?.id]);

  useEffect(() => {
    if (!pg?.sharingOptions?.length) return;
    const cheapest = [...pg.sharingOptions].sort(
      (a, b) => a.monthlyRent - b.monthlyRent,
    )[0];
    const initType =
      cheapest.sharingType === "CUSTOM"
        ? `CUSTOM_${cheapest.totalBeds}`
        : cheapest.sharingType;
    setSharingType(initType);
  }, [pg?.sharingOptions]);

  useEffect(() => {
    if (!pg?.id) return;
    const fetchNearby = async () => {
      try {
        setNearbyLoading(true);
        const res = await api.get(`/public/pg/${pg.id}/nearby`);
        setNearbyPGs(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setNearbyLoading(false);
      }
    };
    fetchNearby();
  }, [pg?.id]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [id]);

  const openReserve = async () => {
    if (!token) {
      navigate("/login", { state: { from: `/pg/${id}` } });
      return;
    }
    if (role === "OWNER" || role === "SUPER_ADMIN" || role === "PG_MANAGER" || role === "SUB_ADMIN") {
      Swal.fire({
        title: "Reservation Not Allowed",
        text: "You are logged in as an Owner or Admin. Please log in as a normal User to reserve a bed.",
        icon: "warning",
        confirmButtonText: "Got it",
        confirmButtonColor: "#5B5BD6",
      });
      return;
    }
    try {
      const res = await api.get("/user/pgs/my-active-reservation");
      if (res.data === true) {
        Swal.fire({
          title: "Already Reserved",
          html: `<div style="text-align:center;padding:10px 0 5px"><div style="width:64px;height:64px;margin:0 auto 16px;border-radius:50%;background:linear-gradient(135deg,#fef3c7,#fde68a);display:flex;align-items:center;justify-content:center;"><span style="font-size:28px">⚠️</span></div><p style="font-size:15px;margin-bottom:8px">You already have a <strong style="color:#5B5BD6">reserved PG</strong>.</p><p style="font-size:13px;color:#64748b">Please cancel your existing booking before reserving another property.</p></div>`,
          confirmButtonText: "Got it",
          confirmButtonColor: "#5B5BD6",
          background: "#fff",
          width: 420,
        });
        return;
      }
      setShowReserve(true);
    } catch {
      Swal.fire("Error", "Unable to verify reservation status", "error");
    }
  };

  if (loading) {
    return <div className="pg-loading">Loading…</div>;
  }

  if (!pg) return null;

  const hasAC = pg?.floors?.some((f) =>
    f.rooms?.some((r) => r.roomType === "AC"),
  );

  const finalAmenities = [
    ...(pg.amenities || []),
    ...(hasAC ? ["Air Conditioning"] : []),
  ];

  const images = pg.imageUrls || [];
  const videos = pg.videoUrls || [];
  const media = [
    ...images.map((url) => ({ type: "image", url })),
    ...videos.map((url) => ({ type: "video", url })),
  ];

  const sharingGroups = pg.sharingOptions || [];

  const filteredRooms = sharingType.startsWith("CUSTOM_")
    ? sharingGroups.filter(
      (r) =>
        r.sharingType === "CUSTOM" &&
        r.totalBeds === Number(sharingType.split("_")[1]),
    )
    : sharingGroups.filter((r) => r.sharingType === sharingType);

  const TYPE_ORDER = ["SINGLE", "DOUBLE", "TRIPLE", "QUADRUPLE"];
  const customTypes = sharingGroups
    .filter((r) => r.sharingType === "CUSTOM")
    .map((r) => `CUSTOM_${r.totalBeds}`)
    .filter((v, i, a) => a.indexOf(v) === i);
  const availableTypes = TYPE_ORDER.filter((t) =>
    sharingGroups.some((r) => r.sharingType === t),
  );

  const isDiscount = pg.offerType === "DISCOUNT";

  const priceSource = filteredRooms.length > 0 ? filteredRooms : sharingGroups;

  const minPrice =
    priceSource.length > 0
      ? Math.min(
        ...priceSource.map((r) =>
          isDiscount && pg.offerPercent > 0
            ? r.monthlyRent - (r.monthlyRent * pg.offerPercent) / 100
            : r.monthlyRent,
        ),
      )
      : null;

  const sharingLabel = (t) => {
    if (t === "SINGLE") return <><i className="fa-solid fa-door-closed"></i> Private</>;
    if (t === "DOUBLE") return <><i className="fa-solid fa-bed"></i> Double</>;
    if (t === "TRIPLE") return <><i className="fa-solid fa-bed"></i> Triple</>;
    if (t === "QUADRUPLE") return <><i className="fa-solid fa-bed"></i> 4 Sharing</>;
    if (t.startsWith("CUSTOM_")) return <><i className="fa-solid fa-bed"></i> {t.split("_")[1]} Sharing</>;
    if (t === "CUSTOM") {
      const customRoom = sharingGroups.find((r) => r.sharingType === "CUSTOM");
      return customRoom?.totalBeds ? <><i className="fa-solid fa-bed"></i> {customRoom.totalBeds} Sharing</> : <><i className="fa-solid fa-bed"></i> Custom</>;
    }
    return t;
  };

  const roomLabel = (t) => {
    if (t === "SINGLE") return "Private Room";
    if (t === "DOUBLE") return "Double Sharing";
    if (t === "TRIPLE") return "Triple Sharing";
    if (t === "QUADRUPLE") return "4 Sharing";
    if (t.startsWith("CUSTOM_")) return `${t.split("_")[1]} Sharing`;
    if (t === "CUSTOM") {
      const customRoom = sharingGroups.find((r) => r.sharingType === "CUSTOM");
      return customRoom?.totalBeds ? `${customRoom.totalBeds} Sharing` : "Custom Sharing";
    }
    return t;
  };

  const offerPalette = getOfferPalette(pg.id);

  return (
    <div className="pg-detail-layout">
      <ApkDownloadModal show={showApkModal} setShow={setShowApkModal} />

      {/* ══ HEADER ══ */}
      <header className="pg-header">
        <div className="pg-header-name-row">
          <h1 className="pg-name">{pg.name}</h1>
          {pg.verified && (
            <span className="pg-verified-badge">
              <i className="bi bi-patch-check-fill"></i> Verified
            </span>
          )}
        </div>
      </header>

      {/* ══ TOP GRID ══ */}
      <div className="pg-top">
        <div className="slider">
          {pg.sponsored && imgIndex === 0 && (
            <div className="sponsored-ribbon-wrap">
              <div className="sponsored-ribbon">SPONSORED</div>
            </div>
          )}

          {media.length > 0 &&
            (media[imgIndex].type === "video" ? (
              <video
                src={media[imgIndex].url}
                controls
                className="pg-slider-video"
              />
            ) : (
              <img
                src={media[imgIndex].url}
                alt={pg.name}
                className="pg-slider-image"
              />
            ))}

          {media.length > 1 && (
            <>
              <button
                onClick={() =>
                  setImgIndex((imgIndex - 1 + media.length) % media.length)
                }
              >
                ‹
              </button>
              <button
                onClick={() => setImgIndex((imgIndex + 1) % media.length)}
              >
                ›
              </button>
              <div className="slider-counter">
                {imgIndex + 1} / {media.length}
              </div>
              <div className="slider-dots">
                {media.map((_, i) => (
                  <button
                    key={i}
                    className={`slider-dot ${i === imgIndex ? "active" : ""}`}
                    onClick={() => setImgIndex(i)}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {pg.offerPercent > 0 && (
          <div
            className="offer-circle-badge"
            style={{
              "--ocb-bg": offerPalette.bg,
              "--ocb-shadow": offerPalette.shadow,
              "--ocb-shadow-lg": offerPalette.shadowLg,
            }}
          >
            {pg.offerTitle && (
              <span className="ocb-title">{pg.offerTitle}</span>
            )}
            <span className="ocb-value">{pg.offerPercent}</span>
            <span className="ocb-unit">OFF</span>
          </div>
        )}

        {/* BOOKING CARD */}
        <aside className="booking-card">
          <div className="bc-starts-from">
            <div className="bc-label">STARTS FROM</div>
            <div className="bc-price">
              <span className="bc-price-amount">
                ₹{minPrice?.toLocaleString() ?? "—"}
              </span>
              <span className="bc-price-unit">/mo</span>
            </div>
          </div>

          <div className="bc-divider" />

          {(availableTypes.length > 0 || customTypes.length > 0) && (
            <div>
              <div className="bc-label">SHARING TYPE</div>
              <div className="bc-tabs">
                {[...availableTypes, ...customTypes].map((t) => (
                  <button
                    key={t}
                    className={`bc-tab ${sharingType === t ? "active" : ""}`}
                    onClick={() => setSharingType(t)}
                  >
                    {sharingLabel(t)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="bc-label">ROOM PRICING</div>
            {filteredRooms.length > 0 ? (
              <div className="bc-rooms">
                {filteredRooms.map((r, i) => (
                  <div key={i} className="bc-room-row">
                    <span className="bc-room-name">
                      {r.sharingType === "CUSTOM"
                        ? `${r.totalBeds} Sharing`
                        : roomLabel(r.sharingType)}
                    </span>
                    <div className="bc-room-price-block">
                      <span className="bc-room-price">
                        ₹
                        {isDiscount && pg.offerPercent > 0
                          ? Math.round(
                            r.monthlyRent -
                            (r.monthlyRent * pg.offerPercent) / 100,
                          ).toLocaleString()
                          : r.monthlyRent.toLocaleString()}
                        {isDiscount && pg.offerPercent > 0 && (
                          <span className="bc-room-old">
                            ₹{r.monthlyRent.toLocaleString()}
                          </span>
                        )}
                      </span>
                      {r.deposit > 0 && (
                        <div className="bc-room-deposit">
                          Deposit ₹{r.deposit.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bc-no-room">No rooms for this sharing type</div>
            )}
          </div>

          {pg.reservationAmount > 0 && (
            <div className="bc-token">
              <span className="bc-token-icon"><i className="fa-solid fa-lock"></i></span>
              <div>
                <div className="bc-token-label">RESERVATION TOKEN</div>
                <div className="bc-token-amount">
                  ₹{pg.reservationAmount.toLocaleString()}
                  <span className="bc-token-note">to secure your bed</span>
                </div>
              </div>
            </div>
          )}

          <div className="bc-divider" />

          {(pg.reservationEnabled || pg.dailyReservationEnabled) &&
            pg.reservationAmount > 0 && (
              <button className="bc-reserve-btn" onClick={openReserve}>
                <i className="fa-solid fa-bolt"></i> Reserve Bed
              </button>
            )}

          <div className="bc-actions">
            <button
              className="bc-avail-btn"
              onClick={() => setShowAvailability(true)}
            >
              <i className="fa-solid fa-bed"></i> Availability
            </button>
            <button
              className="bc-enquiry-btn"
              onClick={() => setShowEnquiry(true)}
            >
              <FaWhatsapp size={16} /> WhatsApp
            </button>
          </div>

          <div className="bc-disclaimer-group">
            <div className="bc-disclaimer">
              <span className="bc-disclaimer-icon">i</span>
              <p>Prices are indicative — confirm final pricing with owner.</p>
            </div>

            {!((pg.reservationEnabled || pg.dailyReservationEnabled) && pg.reservationAmount > 0) && (
              <div className="bc-disclaimer bc-disclaimer-warning">
                <span className="bc-disclaimer-icon warning">!</span>
                <p>Reservation may be temporarily closed (bed full / paused by owner).</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* BED PICKER */}
      {showAvailability && (
        <BedPickerPopup
          pg={pg}
          mode="availability"
          onClose={() => setShowAvailability(false)}
          onConfirm={async ({ bedId }) => {
            setShowAvailability(false);
            if (!token) {
              navigate("/login", { state: { from: `/pg/${id}` } });
              return;
            }
            if (role === "OWNER" || role === "SUPER_ADMIN" || role === "PG_MANAGER" || role === "SUB_ADMIN") {
              Swal.fire({
                title: "Reservation Not Allowed",
                text: "You are logged in as an Owner or Admin. Please log in as a normal User to reserve a bed.",
                icon: "warning",
                confirmButtonText: "Got it",
                confirmButtonColor: "#5B5BD6",
              });
              return;
            }
            try {
              const res = await api.get("/user/pgs/my-active-reservation");
              if (res.data === true) {
                Swal.fire({
                  title: "Already Reserved",
                  html: `<div style="text-align:center;padding:10px 0 5px"><div style="width:64px;height:64px;margin:0 auto 16px;border-radius:50%;background:linear-gradient(135deg,#fef3c7,#fde68a);display:flex;align-items:center;justify-content:center;"><span style="font-size:28px">⚠️</span></div><p style="font-size:15px;margin-bottom:8px">You already have a <strong style="color:#5B5BD6">reserved PG</strong>.</p><p style="font-size:13px;color:#64748b">Please cancel your existing booking before reserving another property.</p></div>`,
                  confirmButtonText: "Got it",
                  confirmButtonColor: "#5B5BD6",
                  background: "#fff",
                  width: 420,
                });
                return;
              }
              setSelectedBeds([bedId]);
              setShowReserve(true);
            } catch {
              Swal.fire("Error", "Unable to verify reservation status", "error");
            }
          }}
        />
      )}

      {/* ══ LOCATION STRIP ══ */}
      <div className="pg-location-strip">
        <a
          className="pls-card pls-clickable"
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pg.name}, ${pg.locality}, ${pg.city}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in Google Maps"
        >
          <div className="pls-icon"><MapPin size={18} strokeWidth={2} /></div>
          <div className="pls-text">
            <span className="pls-label">LOCATION</span>
            <span className="pls-value">{pg.locality}, {pg.city}</span>
          </div>
          <span className="pls-map-hint"><i className="bi bi-box-arrow-up-right"></i></span>
        </a>
        {pg.address && (
          <a
            className="pls-card pls-clickable"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pg.name}, ${pg.address}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in Google Maps"
          >
            <div className="pls-icon"><Home size={18} strokeWidth={2} /></div>
            <div className="pls-text">
              <span className="pls-label">FULL ADDRESS</span>
              <span className="pls-value">{pg.address}</span>
            </div>
            <span className="pls-map-hint"><i className="bi bi-box-arrow-up-right"></i></span>
          </a>
        )}
      </div>

      {/* ══ ABOUT ══ */}
      <section className="content-card">
        <h2 className="section-title">About the Property</h2>
        <p className="property-description">
          {pg.aboutDescription?.trim().length > 0 ? (
            pg.aboutDescription
          ) : (
            <>
              Well maintained <strong>{pg.genderType}</strong> PG designed for
              comfortable and secure living.
            </>
          )}
        </p>
      </section>

      {/* ══ ROOM DETAILS ══ */}
      <section className="content-card">
        <h2 className="section-title">Room Details</h2>
        <div className="room-cards">
          {[...TYPE_ORDER, ...customTypes].map((t) => {
            const rents = sharingGroups
              .filter((r) =>
                t.startsWith("CUSTOM_")
                  ? r.sharingType === "CUSTOM" &&
                  r.totalBeds === Number(t.split("_")[1])
                  : r.sharingType === t,
              )
              .map((r) => r.monthlyRent);
            if (!rents.length) return null;
            return (
              <div key={t} className="room-card">
                <h4 className="room-name">{roomLabel(t)}</h4>
                <p className="room-price">
                  From{" "}
                  <strong>
                    ₹
                    {Math.min(
                      ...rents.map((r) =>
                        isDiscount && pg.offerPercent > 0
                          ? r - (r * pg.offerPercent) / 100
                          : r,
                      ),
                    ).toLocaleString()}
                  </strong>{" "}
                  / month
                </p>
                <p className="room-deposit">Deposit applies (varies by room)</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══ AMENITIES ══ */}
      <section className="content-card">
        <h2 className="section-title">Amenities</h2>
        {pg.amenities?.length > 0 ? (
          <div className="amenities-v4-grid">
            {finalAmenities.map((amenity, i) => {
              const Icon = AMENITY_ICONS[amenity] || Tag;
              return (
                <div key={i} className="amenity-v4-tile">
                  <div className="amenity-v4-icon-box">
                    <Icon size={22} strokeWidth={1.6} />
                  </div>
                  <span className="amenity-v4-label">{amenity}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="no-amenities">No amenities listed</p>
        )}
      </section>

      {/* ══ HOUSE RULES ══ */}
      <section className="content-card house-rules-card">
        <h2 className="section-title">House Rules</h2>
        {pg.houseRules?.length > 0 ? (
          <div className="house-rules-grid">
            {pg.houseRules.map((rule, i) => (
              <div key={i} className="house-rule-item-modern">
                <span className="rule-icon">✔</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-rules-box">No house rules specified</div>
        )}
      </section>

      {/* ══ REVIEWS ══ */}
      <ReviewSection pgId={id} me={me} isUser={isUser} />

      {/* ══ NEARBY ══ */}
      <section className="content-card">
        <h2 className="section-title">Nearby in {pg.locality || pg.city}</h2>
        {nearbyLoading ? (
          <PGListingSkeleton count={3} />
        ) : nearbyPGs.length > 0 ? (
          <div className="pg-results-grid">
            {nearbyPGs.map((pgItem) => (
              <PGListingCard
                key={pgItem.id}
                pg={pgItem}
                imageIndex={0}
                showImageNav={false}
                onNavigate={(item) => navigate(`/pg/${item.id}`)}
              />
            ))}
          </div>
        ) : (
          <p style={{ color: "#64748b" }}>
            No nearby PGs found in this locality
          </p>
        )}
      </section>

      {/* ══ ENQUIRY ══ */}
      {showEnquiry && (
        <EnquiryForm
          pgId={pg.id}
          pgName={pg.name}
          sharingType={sharingType}
          roomTypeName={`Sharing: ${sharingType}`}
          onClose={() => setShowEnquiry(false)}
        />
      )}

      {/* ══ RESERVE MODAL ══ */}
      {showReserve && (
        <ReserveSeatModal
          pg={pg}
          sharingType={sharingType}
          selectedBeds={selectedBeds}
          onClose={() => {
            setShowReserve(false);
            setSelectedBeds([]);
          }}
        />
      )}

      {/* ══ IMAGE LIGHTBOX ══ */}
      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}>
            ✕
          </button>

          {lightbox.images.length > 1 && (
            <button
              className="lightbox-prev"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox((lb) => ({
                  ...lb,
                  index: (lb.index - 1 + lb.images.length) % lb.images.length,
                }));
              }}
            >
              ‹
            </button>
          )}

          <div
            className="lightbox-img-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.images[lightbox.index]}
              alt="Review"
              className="lightbox-img"
            />
            {lightbox.images.length > 1 && (
              <div className="lightbox-counter">
                {lightbox.index + 1} / {lightbox.images.length}
              </div>
            )}
          </div>

          {lightbox.images.length > 1 && (
            <button
              className="lightbox-next"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox((lb) => ({
                  ...lb,
                  index: (lb.index + 1) % lb.images.length,
                }));
              }}
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PGDetail;