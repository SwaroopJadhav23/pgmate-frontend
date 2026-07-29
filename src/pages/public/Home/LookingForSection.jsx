import {Link} from "react-router-dom";
import {Search, LayoutGrid, ArrowRight} from "lucide-react";

const LookingForSection = () => (
  <>
    <style>{CSS}</style>
    <section className="lfs-wrap">
      <Link to="/pgs" className="lfs-card">
        <div className="lfs-icon">
          <Search size={20} />
        </div>
        <div>
          <h3>Looking for a PG?</h3>
          <p>
            Browse verified rooms with real photos, direct owner contact and no
            brokerage.
          </p>
          <span className="lfs-link">
            Browse PGs <ArrowRight size={13} />
          </span>
        </div>
      </Link>

      <Link to="/list-your-property" className="lfs-card">
        <div className="lfs-icon">
          <LayoutGrid size={20} />
        </div>
        <div>
          <h3>Managing a PG?</h3>
          <p>
            Run rent collection, tenants, complaints and occupancy from one
            dashboard.
          </p>
          <span className="lfs-link">
            Explore PG management software <ArrowRight size={13} />
          </span>
        </div>
      </Link>
    </section>
  </>
);

export default LookingForSection;

const CSS = `
  .lfs-wrap {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 32px 32px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .lfs-card {
    display: flex;
    gap: 14px;
    background: #f5f5ff;
    border: 1px solid #e8e8ff;
    border-radius: 16px;
    padding: 18px 20px;
    text-decoration: none;
    transition: box-shadow 0.2s, transform 0.2s;
  }

  .lfs-card:hover { box-shadow: 0 10px 24px rgba(79,70,229,0.1); transform: translateY(-2px); }

  .lfs-icon {
    width: 38px; height: 38px; flex-shrink: 0;
    border-radius: 10px;
    background: #e0e0ff;
    color: #4f46e5;
    display: flex; align-items: center; justify-content: center;
  }

  .lfs-card h3 { margin: 0 0 4px; font-size: 0.95rem; font-weight: 700; color: #0f172a; }
  .lfs-card p { margin: 0 0 6px; font-size: 0.8rem; color: #64748b; line-height: 1.4; }
  .lfs-link { display: inline-flex; align-items: center; gap: 4px; font-size: 0.8rem; font-weight: 700; color: #4f46e5; }

  @media (max-width: 760px) {
    .lfs-wrap { grid-template-columns: 1fr; padding: 0 18px 24px; }
  }
`;
