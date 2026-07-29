import {
  ShieldCheck,
  Camera,
  MessageCircle,
  BadgePercent,
  Star,
  Lock,
} from "lucide-react";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verified Listings",
    desc: "Every property is personally verified for your safety.",
  },
  {
    icon: Camera,
    title: "Real Photos",
    desc: "See actual room images before visiting.",
  },
  {
    icon: MessageCircle,
    title: "Direct Contact",
    desc: "Connect directly with owners. No middlemen.",
  },
  {
    icon: BadgePercent,
    title: "No Brokerage",
    desc: "Zero brokerage. Save money on unnecessary fees.",
  },
  {
    icon: Star,
    title: "Reviews & Ratings",
    desc: "Read genuine reviews from real residents like you.",
  },
  {
    icon: Lock,
    title: "Safe & Secure",
    desc: "Verified owners and secure listings for peace of mind.",
  },
];

const WhyChoosePGMate = () => (
  <>
    <style>{CSS}</style>
    <section className="wcp-wrap">
      <h2>Why Choose PGMate?</h2>
      <div className="wcp-grid">
        {FEATURES.map(({icon: Icon, title, desc}) => (
          <div key={title} className="wcp-card">
            <div className="wcp-icon">
              <Icon size={20} />
            </div>
            <h3>{title}</h3>
            <p>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  </>
);

export default WhyChoosePGMate;

const CSS = `
  .wcp-wrap {
    max-width: 1600px;
    margin: 0 auto;
    padding: 56px 32px;
  }

  .wcp-wrap h2 {
    text-align: center;
    font-family: 'Sora', sans-serif;
    font-size: 1.9rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 32px;
  }

  .wcp-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
  }

  .wcp-card {
    background: #f8f9ff;
    border: 1px solid #eceef9;
    border-radius: 18px;
    padding: 26px 22px;
    transition: box-shadow 0.2s, transform 0.2s;
  }

  .wcp-card:hover {
    box-shadow: 0 12px 28px rgba(79, 70, 229, 0.1);
    transform: translateY(-2px);
  }

  .wcp-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: #eef2ff;
    color: #4f46e5;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 14px;
  }

  .wcp-card h3 {
    font-size: 1.02rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 6px;
  }

  .wcp-card p {
    font-size: 0.86rem;
    color: #64748b;
    line-height: 1.5;
    margin: 0;
  }

  @media (max-width: 900px) {
    .wcp-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 560px) {
    .wcp-wrap { padding: 40px 18px; }
    .wcp-grid { grid-template-columns: 1fr; }
  }
`;
