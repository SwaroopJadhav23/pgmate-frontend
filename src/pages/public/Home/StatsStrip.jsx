import {ShieldCheck, Users, MapPin, Building} from "lucide-react";

const STATS = [
  {icon: ShieldCheck, value: "10K+", label: "Verified PGs"},
  {icon: Users, value: "50K+", label: "Happy Users"},
  {icon: MapPin, value: "25+", label: "Cities"},
  {icon: Building, value: "1L+", label: "Rooms Managed"},
];

const StatsStrip = () => (
  <>
    <style>{CSS}</style>
    <section className="sts-wrap">
      {STATS.map(({icon: Icon, value, label}) => (
        <div key={label} className="sts-item">
          <Icon size={18} />
          <div>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        </div>
      ))}
    </section>
  </>
);

export default StatsStrip;

const CSS = `
  .sts-wrap {
    max-width: 1280px;
    margin: 0 auto;
    padding: 24px 32px 48px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .sts-item {
    display: flex; align-items: center; gap: 12px;
    background: #ffffff; border: 1px solid rgba(229, 231, 235, 0.6); border-radius: 14px;
    padding: 16px 20px; color: #6366f1;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .sts-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06);
  }

  .sts-item strong { display: block; font-size: 1.05rem; font-weight: 800; color: #0f172a; }
  .sts-item span { font-size: 0.74rem; color: #64748b; }

  @media (max-width: 760px) {
    .sts-wrap { grid-template-columns: 1fr 1fr; padding: 20px 18px 36px; }
  }
`;
