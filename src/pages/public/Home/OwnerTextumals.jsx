import { useEffect, useState } from "react";
import api from "../../../api/axios";
import "./OwnerTextumals.css";

const Star = ({ filled }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill={filled ? "#f5b301" : "none"}
    stroke="#f5b301"
    strokeWidth="1.5"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
  </svg>
);

const Stars = ({ rating = 5 }) => (
  <div className="owner-testimonial-stars">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} filled={n <= rating} />
    ))}
  </div>
);

const Avatar = ({ name, avatar }) => {
  if (avatar) {
    return <img className="owner-testimonial-avatar" src={avatar} alt={name} />;
  }
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return <div className="owner-testimonial-avatar owner-testimonial-avatar-fallback">{initials}</div>;
};

const OwnerTestimonials = () => {
  const [ownerTestimonials, setOwnerTestimonials] = useState([]);

  useEffect(() => {
    api
      .get("/public/ui-text/owner_testimonials")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setOwnerTestimonials(res.data);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <section className="owner-testimonials">
      <div className="owner-testimonials-inner">
        <div className="owner-testimonials-left">
          <h2>
            What Owners <span>Have to Say</span>
          </h2>

          <div className="owner-testimonial-grid">
            {ownerTestimonials.slice(0, 3).map((t, i) => (
              <div className="owner-testimonial-card" key={t.id || i}>
                <div className="owner-testimonial-card-top">
                  <Stars rating={t.rating} />
                  <span className="owner-testimonial-quote-icon">&rdquo;</span>
                </div>

                <p className="owner-testimonial-text">{t.text}</p>

                <div className="owner-testimonial-user">
                  <Avatar name={t.name} avatar={t.avatar} />
                  <div className="owner-testimonial-user-meta">
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="owner-testimonials-promo">
          <div className="owner-promo-text">
            <h3>
              Manage Your PG <br /> On The Go
            </h3>
            <p>Mobile App for Owners</p>

            <div className="owner-promo-badges">
              <span className="owner-promo-badge" role="button" aria-label="Get it on Google Play">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 2.5c-.3.3-.5.7-.5 1.2v16.6c0 .5.2.9.5 1.2l.1.1L13 12 3.1 2.4 3 2.5z" />
                  <path d="M16.5 15.5L13 12l3.5-3.5 4 2.3c1 .6 1 1.9 0 2.5l-4 2.2z" />
                  <path d="M13 12L3 2.4c.2-.1.5-.2.7-.2.3 0 .6.1.9.2l10.9 6.2L13 12z" />
                  <path d="M13 12l2.5 3.5-10.9 6.2c-.3.1-.6.2-.9.2-.2 0-.5-.1-.7-.2L13 12z" />
                </svg>
                <span>
                  <small>GET IT ON</small>
                  <b>Google Play</b>
                </span>
              </span>

              <span className="owner-promo-badge" role="button" aria-label="Download on the App Store">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 12.5c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.5-.15-2.9.85-3.6.85-.75 0-1.9-.83-3.1-.8-1.6.02-3.1.93-3.9 2.35-1.7 2.9-.44 7.2 1.2 9.55.8 1.15 1.75 2.44 3 2.4 1.2-.05 1.65-.77 3.1-.77 1.45 0 1.85.77 3.1.75 1.3-.02 2.1-1.17 2.9-2.32.9-1.33 1.27-2.6 1.3-2.67-.03-.01-2.5-.96-2.5-3.86z" />
                  <path d="M14.7 5.7c.67-.8 1.12-1.9 1-3-.95.04-2.1.64-2.78 1.44-.62.7-1.16 1.85-1.02 2.94 1.07.08 2.16-.55 2.8-1.38z" />
                </svg>
                <span>
                  <small>Download on the</small>
                  <b>App Store</b>
                </span>
              </span>
            </div>
          </div>

          <div className="owner-promo-phone">
            <div className="owner-promo-phone-frame">
              <div className="owner-promo-phone-screen">
                <div className="owner-promo-phone-header">PGMate</div>
                <div className="owner-promo-phone-stat">
                  <span>₹1,24,800</span>
                  <small>This Month</small>
                </div>
                <div className="owner-promo-phone-bar" />
                <div className="owner-promo-phone-bar short" />
                <div className="owner-promo-phone-bar shorter" />
                <div className="owner-promo-phone-stat">
                  <span>₹12,45,900</span>
                  <small>Total Collected</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OwnerTestimonials;