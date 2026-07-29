import {
  Wifi, Car, Wind, ShowerHead, Shield, UtensilsCrossed, Bath, Droplets,
  Camera, Snowflake, Tv, WashingMachine, Dumbbell, BookOpen, Bike, Bus,
  Zap, Flame, Sofa, Tag, ParkingCircle, Coffee, Thermometer, Lock, Sun,
  Bed, Refrigerator, Power, ArrowRight,
} from "lucide-react";

const AMENITY_ICONS = {
  "WiFi": Wifi, "Parking": ParkingCircle, "Balcony": Wind,
  "Attached Bathroom": ShowerHead, "Security": Shield,
  "Kitchen": UtensilsCrossed, "Bathroom": Bath, "Drinking Water": Droplets,
  "CCTV": Camera, "AC": Snowflake, "Air Conditioning": Snowflake,
  "TV": Tv, "Television": Tv, "Washing Machine": WashingMachine,
  "Laundry": WashingMachine, "Gym": Dumbbell, "Study Room": BookOpen,
  "Bike Parking": Bike, "Bus Stop Nearby": Bus, "Power Backup": Zap,
  "Gas": Flame, "Common Area": Sofa, "Coffee": Coffee,
  "Geyser": Thermometer, "Hot Water": Thermometer, "Locker": Lock,
  "Terrace": Sun, "Furnished": Bed, "Refrigerator": Refrigerator,
  "Fridge": Refrigerator, "Electric Backup": Power, "Car Parking": Car,
};

const PGListingCard = ({
  pg, imageIndex = 0, onPrevImage, onNextImage,
  onNavigate, onOpenReviews, className = "", showImageNav = true,
}) => {
  const availableRents =
    pg.sharingOptions?.filter((s) => s.availableBeds > 0).map((s) => s.monthlyRent) || [];
  const minRent = availableRents.length ? Math.min(...availableRents) : null;
  const discounted = pg.minEffectiveRent;
  const title = pg.name || "Unnamed property";
  const location = [pg.locality, pg.city].filter(Boolean).join(", ");

  const cheapestOption = pg.sharingOptions
    ?.filter((s) => s.availableBeds > 0)
    .sort((a, b) => a.monthlyRent - b.monthlyRent)[0];
  const sharingLabel = cheapestOption?.sharingType
    ? `${cheapestOption.sharingType} Sharing`
    : null;

  const finalAmenities = [
    ...new Set(
      (pg.amenities || []).map(a => {
        if (a === "AC") return "Air Conditioning";
        if (a === "Fridge") return "Refrigerator";
        if (a === "Television") return "TV";
        return a;
      })
    )
  ];

  return (
    <article
      className={`pg-listing-card${pg.sponsored ? " is-sponsored" : ""}${className ? ` ${className}` : ""}`}
      onClick={() => onNavigate?.(pg)}
      style={{ cursor: "pointer" }}
    >
      {/* ── IMAGE ── */}
      <div className="pg-listing-card__media">

        {/* Sponsored badge — top-left, always visible */}
        {pg.sponsored && (
          <div className="pg-listing-card__top-badge">
            <span className="pg-listing-sponsored">
              <i className="bi bi-megaphone-fill" /> Sponsored
            </span>
          </div>
        )}

        {pg.imageUrls?.length ? (
          <img src={pg.imageUrls[imageIndex]} alt={title} loading="lazy" />
        ) : (
          <div className="pg-listing-card__no-image">No Image</div>
        )}

        {showImageNav && pg.imageUrls?.length > 1 && (
          <>
            <button
              type="button"
              className="pg-listing-card__nav pg-listing-card__nav--left"
              onClick={(e) => { e.stopPropagation(); onPrevImage?.(pg); }}
              aria-label="Previous image"
            >
              <i className="bi bi-chevron-left" />
            </button>
            <button
              type="button"
              className="pg-listing-card__nav pg-listing-card__nav--right"
              onClick={(e) => { e.stopPropagation(); onNextImage?.(pg); }}
              aria-label="Next image"
            >
              <i className="bi bi-chevron-right" />
            </button>
          </>
        )}

        {/* ── BOTTOM STRIP: UNISEX LEFT · Rating RIGHT ── */}
        <div className="pg-listing-card__badges">
          {pg.genderType && (
            <span className={`pg-listing-badge ${pg.genderType?.toLowerCase()}`}>
              {pg.genderType}
            </span>
          )}
          {pg.totalReviews > 0 && (
            <span
              className="pg-listing-card__rating-badge"
              onClick={(e) => { e.stopPropagation(); onOpenReviews?.(pg); }}
            >
              <i className="bi bi-star-fill" />
              {pg.avgRating?.toFixed(1)}&nbsp;({pg.totalReviews})
            </span>
          )}
        </div>

      </div>

      {/* ── BODY ── */}
      <div className="pg-listing-card__body">

        {/* HEADER */}
        <div className="pg-listing-card__header">
          <div className="pg-listing-card__title-wrap">
            <h3 title={title}>{title}</h3>
            <p className="pg-listing-card__location">
              <i className="bi bi-geo-alt-fill" />
              <span>{location}</span>
            </p>
          </div>
          {pg.verified && (
            <span className="pg-listing-card__verified" onClick={(e) => e.stopPropagation()}>
              <i className="bi bi-patch-check-fill" /> Verified
            </span>
          )}
        </div>

        {/* AMENITIES */}
        {pg.amenities?.length > 0 && (
          <div className="pg-listing-card__amenities" onClick={(e) => e.stopPropagation()}>
            {finalAmenities.map((amenity, i) => {
              const Icon = AMENITY_ICONS[amenity] || Tag;
              return (
                <div key={i} className="pg-amenity-item">
                  <div className="pg-amenity-icon-box">
                    <Icon size={14} strokeWidth={1.8} />
                  </div>
                  <span className="pg-amenity-label">{amenity}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── FOOTER — price LEFT, View Details RIGHT ── */}
                <div className="pg-listing-card__footer">


          <div className="pg-listing-card__pricing">
            <div className="pg-listing-card__price-row">
              {pg.offerType?.toUpperCase() === "DISCOUNT" && discounted ? (
                <>
                  <strong className="pg-listing-card__price-current">
                    ₹{discounted.toLocaleString()}
                  </strong>
                  <span className="pg-listing-card__price-original">
                    ₹{minRent?.toLocaleString()}
                  </span>
                </>
              ) : (
                <strong className="pg-listing-card__price-current">
                  ₹{minRent?.toLocaleString()}
                </strong>
              )}
              <span className="pg-listing-card__price-unit">/mo</span>
            </div>
            {sharingLabel && (
              <div className="pg-listing-card__price-label">{sharingLabel}</div>
            )}
          </div>

          <button
            type="button"
            className="pg-listing-card__cta-btn"
            onClick={(e) => { e.stopPropagation(); onNavigate?.(pg); }}
          >
            View Details
            <ArrowRight size={12} strokeWidth={2.5} />
          </button>

        </div>

        {/* OFFER ROW — only when offer exists */}
        {(pg.offerTitle || pg.offerPercent > 0) && (
          <div className="pg-listing-card__meta" onClick={(e) => e.stopPropagation()}>
            <div className="pg-listing-card__offer-group">
              {pg.offerTitle && (
                <div className="pg-listing-card__offer-title">{pg.offerTitle}</div>
              )}
              {pg.offerPercent > 0 && (
                <div className="pg-listing-card__offer-chip">
                  <span className="pg-listing-card__offer-icon">%</span>
                  {pg.offerPercent}% OFF
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </article>
  );
};

export default PGListingCard;