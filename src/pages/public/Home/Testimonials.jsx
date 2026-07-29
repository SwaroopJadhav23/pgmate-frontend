import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Aniket Sharma",
    location: "Hinjewadi, Pune",
    rating: 5,
    quote: "Found a great PG near my office. The process was smooth and hassle-free!",
  },
  {
    name: "Priya Patil",
    location: "Baner, Pune",
    rating: 5,
    quote: "PGMate software made managing my PG so easy. Rent collection is now stress-free!",
  },
  {
    name: "Rahul Mehta",
    location: "Kothrud, Pune",
    rating: 5,
    quote: "No brokerage, direct contact and verified listings. Highly recommended!",
  },
  {
    name: "Sneha Desai",
    location: "Wakad, Pune",
    rating: 5,
    quote: "The interface is beautiful and finding a female-only PG was surprisingly quick.",
  },
  {
    name: "Vikram Singh",
    location: "Viman Nagar, Pune",
    rating: 4,
    quote: "Great platform! Found a PG with food included in just a few clicks.",
  },
  {
    name: "Neha Gupta",
    location: "Kharadi, Pune",
    rating: 5,
    quote: "Love how I can check the amenities beforehand. No more surprises when I visit the PG.",
  },
  {
    name: "Aditya Verma",
    location: "Kalyani Nagar, Pune",
    rating: 5,
    quote: "As a PG owner, getting genuine leads is crucial. PGMate delivered exactly that.",
  }
];

const Testimonials = () => {
  return (
    <>
      <style>{CSS}</style>
      <section className="tst-wrap">
        <h2>What Our Users Say</h2>

        <div className="tst-marquee">
          <div className="tst-track">
            {/* Render two sets of testimonials for seamless looping */}
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div key={i} className="tst-card">
                <Quote size={20} className="tst-quote-icon" />
                <p>{t.quote}</p>
                <div className="tst-footer">
                  <div className="tst-avatar">{t.name.charAt(0)}</div>
                  <div className="tst-user-info">
                    <strong>{t.name}</strong>
                    <span>{t.location}</span>
                  </div>
                  <div className="tst-stars">
                    {Array.from({ length: t.rating }).map((_, s) => (
                      <Star key={s} size={14} fill="#f59e0b" color="#f59e0b" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Testimonials;

const CSS = `
  .tst-wrap { max-width: 1280px; margin: 0 auto; padding: 60px 20px; text-align: center; overflow: hidden; font-family: 'Inter', sans-serif; }
  .tst-wrap h2 { font-size: 32px; font-weight: 800; color: #111827; margin: 0 0 40px; }

  .tst-marquee {
    position: relative;
    width: 100%;
    overflow: hidden;
    padding: 10px 0 30px;
    mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
    -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
  }

  .tst-track {
    display: flex;
    gap: 24px;
    width: max-content;
    animation: scrollMarquee 40s linear infinite;
  }

  .tst-marquee:hover .tst-track {
    animation-play-state: paused;
  }

  @keyframes scrollMarquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(calc(-50% - 12px)); }
  }

  .tst-card {
    background: #ffffff;
    border: 1px solid rgba(229, 231, 235, 0.6);
    border-radius: 20px;
    padding: 24px;
    width: 320px;
    text-align: left;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.03);
    flex-shrink: 0;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .tst-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.06);
  }

  .tst-quote-icon { color: #818cf8; margin-bottom: 12px; }
  .tst-card p { font-size: 15px; color: #4b5563; line-height: 1.6; margin: 0 0 20px; min-height: 72px; }

  .tst-footer { display: flex; align-items: center; gap: 12px; margin-top: auto; }
  .tst-avatar {
    width: 42px; height: 42px; border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; font-weight: 700;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    font-size: 16px;
  }

  .tst-user-info { display: flex; flex-direction: column; }
  .tst-user-info strong { font-size: 15px; color: #111827; margin-bottom: 2px; font-weight: 700; }
  .tst-user-info span { font-size: 13px; color: #6b7280; }
  .tst-stars { margin-left: auto; display: flex; gap: 3px; }

  @media (max-width: 768px) {
    .tst-wrap h2 { font-size: 26px; }
    .tst-card { width: 280px; padding: 20px; }
    .tst-card p { min-height: auto; }
  }
`;
