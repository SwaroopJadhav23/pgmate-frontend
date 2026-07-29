import whyChoose from "../../../assets/why_choose_pgmate_400.png";

// eslint-disable-next-line no-lone-blocks
{/* 
import {ShieldCheck, Users, Ban, ImageIcon, Lock} from "lucide-react";

const ITEMS = [
  {
    icon: ShieldCheck,
    title: "100% Verified PGs",
    desc: "Every PG is verified for quality and authenticity.",
  },
  {
    icon: Users,
    title: "Direct Owner Contact",
    desc: "Connect directly with owners. No middlemen.",
  },
  {
    icon: Ban,
    title: "No Brokerage",
    desc: "Zero brokerage. Save more on your stay.",
  },
  {
    icon: ImageIcon,
    title: "Real Photos & Details",
    desc: "Real photos, honest info and transparent pricing.",
  },
  {
    icon: Lock,
    title: "Secure & Reliable",
    desc: "Your data and payments are safe with us.",
  },
];

const WhyChoosePGMateRow = () => (
  <>
    <style>{CSS}</style>
    <section className="wcr-wrap">
      <h2>Why Choose PGMate?</h2>
      <div className="wcr-row">
        {ITEMS.map(({icon: Icon, title, desc}) => (
          <div key={title} className="wcr-item">
            <div className="wcr-icon">
              <Icon size={18} />
            </div>
            <strong>{title}</strong>
            <span>{desc}</span>
          </div>
        ))}
      </div>
    </section>
  </>
);

export default WhyChoosePGMateRow;

const CSS = `
  .wcr-wrap { max-width: 1280px; margin: 0 auto; padding: 40px 32px; text-align: center; }
  .wcr-wrap h2 { font-family: 'Sora', sans-serif; font-size: 1.6rem; font-weight: 800; color: #0f172a; margin: 0 0 28px; }

  .wcr-row { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .wcr-item { flex: 1; min-width: 150px; display: flex; flex-direction: column; align-items: center; }

  .wcr-icon {
    width: 40px; height: 40px; border-radius: 50%;
    background: #eef2ff; color: #4f46e5;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 10px;
  }

  .wcr-item strong { font-size: 0.84rem; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
  .wcr-item span { font-size: 0.74rem; color: #64748b; line-height: 1.4; max-width: 170px; }

  @media (max-width: 900px) {
    .wcr-row { justify-content: space-around; }
    .wcr-item { flex: 0 1 45%; }
  }
`;
*/}






const WhyChoosePGMateRow = () => (
  <>
    <style>{CSS}</style>
    <section className="wcr-wrap">
      <img
        src={whyChoose}
        alt="Why Choose PGMate — verified PGs, direct owner contact, no brokerage, real photos, secure & reliable"
        className="wcr-img"
      />
    </section>
  </>
);

export default WhyChoosePGMateRow;

const CSS = `
  .wcr-wrap {
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
    padding: 40px 32px;
    text-align: center;
  }

 .wcr-img {
  width: 100%;
  max-width: 1600px;
  height: auto;
  aspect-ratio: 3 / 1;
  display: block;
  margin: 0 auto;
  object-fit: contain;
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.35), 0 8px 20px rgba(0, 0, 0, 0.25);   
}
  @media (max-width: 600px) {
    .wcr-wrap {
      padding: 30px 18px;
    }
  }
`;