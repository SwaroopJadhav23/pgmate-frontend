import {useEffect, useState} from "react";
import {useNavigate, Link} from "react-router-dom";
import {Star, Heart, ArrowRight} from "lucide-react";
import api from "../../../api/axios";
import {useCityFilter} from "../../../context/CityFilterContext";

const getMinRent = (pg) => {
  const available = pg.sharingOptions?.filter((s) => s.availableBeds > 0) || [];
  if (!available.length) return null;
  return Math.min(...available.map((s) => s.monthlyRent));
};

const FeaturedPGs = () => {
  const navigate = useNavigate();
  const {selectedCity} = useCityFilter();
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState(new Set());

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get("/public/pgs/paged", {
        params: {city: selectedCity, page: 0, size: 8},
      })
      .then((res) => {
        if (!active) return;
        const content = res.data?.content || [];
        const sorted = [...content].sort(
          (a, b) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0),
        );
        setPgs(sorted.slice(0, 4));
      })
      .catch(() => active && setPgs([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [selectedCity]);

  const toggleLike = (e, id) => {
    e.stopPropagation();
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (!loading && pgs.length === 0) return null;

  return (
    <>
      <style>{CSS}</style>
      <section className="fpg-wrap">
        <div className="fpg-header">
          <h2>Featured PGs in {selectedCity}</h2>
          <Link to="/pgs" className="fpg-view-all">
            View all PGs <ArrowRight size={14} />
          </Link>
        </div>

        <div className="fpg-grid">
          {loading
            ? Array.from({length: 4}).map((_, i) => (
                <div key={i} className="fpg-card fpg-skeleton" />
              ))
            : pgs.map((pg) => {
                const minRent = getMinRent(pg);
                const location = [pg.locality, pg.city]
                  .filter(Boolean)
                  .join(", ");
                return (
                  <div
                    key={pg.id}
                    className="fpg-card"
                    onClick={() => navigate(`/pg/${pg.id}`)}
                  >
                    <div className="fpg-media">
                      {pg.verified && (
                        <span className="fpg-verified">Verified</span>
                      )}
                      <button
                        className="fpg-heart"
                        onClick={(e) => toggleLike(e, pg.id)}
                      >
                        <Heart
                          size={15}
                          fill={likedIds.has(pg.id) ? "#ef4444" : "none"}
                          color={likedIds.has(pg.id) ? "#ef4444" : "#475569"}
                        />
                      </button>
                      {pg.imageUrls?.[0] ? (
                        <img
                          src={pg.imageUrls[0]}
                          alt={pg.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="fpg-noimg">No Image</div>
                      )}
                    </div>
                    <div className="fpg-body">
                      <h3>{pg.name}</h3>
                      <p className="fpg-loc">{location}</p>
                      <div className="fpg-row">
                        <div>
                          <strong>
                            {minRent ? `₹${minRent.toLocaleString()}` : "—"}
                          </strong>
                          <span> /month</span>
                        </div>
                        {pg.totalReviews > 0 && (
                          <div className="fpg-rating">
                            <Star size={12} fill="#f59e0b" color="#f59e0b" />
                            {pg.avgRating?.toFixed(1)} ({pg.totalReviews})
                          </div>
                        )}
                      </div>
                      {pg.amenities?.length > 0 && (
                        <div className="fpg-tags">
                          {pg.amenities.slice(0, 4).map((a) => (
                            <span key={a}>{a}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
        </div>
      </section>
    </>
  );
};

export default FeaturedPGs;

const CSS = `
  .fpg-wrap { max-width: 1280px; margin: 0 auto; padding: 24px 32px 56px; }

  .fpg-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 22px;
  }

  .fpg-header h2 { font-family: 'Sora', sans-serif; font-size: 1.6rem; font-weight: 800; color: #0f172a; margin: 0; }

  .fpg-view-all {
    display: inline-flex; align-items: center; gap: 4px;
    color: #4f46e5; font-weight: 700; font-size: 0.88rem; text-decoration: none;
  }

  .fpg-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
  }

  .fpg-card {
    background: #fff;
    border: 1px solid #ececf3;
    border-radius: 18px;
    overflow: hidden;
    cursor: pointer;
    transition: box-shadow 0.2s, transform 0.2s;
  }

  .fpg-card:hover { box-shadow: 0 14px 30px rgba(15,23,42,0.1); transform: translateY(-2px); }

  .fpg-skeleton { height: 280px; background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 37%,#f1f5f9 63%); background-size: 400% 100%; animation: fpgshimmer 1.4s ease infinite; }
  @keyframes fpgshimmer { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }

  .fpg-media { position: relative; aspect-ratio: 4/3; background: #eef2f8; }
  .fpg-media img { width: 100%; height: 100%; object-fit: cover; }
  .fpg-noimg { display:flex; align-items:center; justify-content:center; height:100%; color:#94a3b8; font-size:0.85rem; }

  .fpg-verified {
    position: absolute; top: 10px; left: 10px;
    background: #16a34a; color: #fff; font-size: 0.65rem; font-weight: 700;
    padding: 4px 9px; border-radius: 999px;
  }

  .fpg-heart {
    position: absolute; top: 8px; right: 8px;
    width: 30px; height: 30px; border-radius: 50%;
    background: rgba(255,255,255,0.92); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }

  .fpg-body { padding: 14px 14px 16px; }
  .fpg-body h3 { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
  .fpg-loc { font-size: 0.78rem; color: #64748b; margin: 0 0 10px; }

  .fpg-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .fpg-row strong { font-size: 1rem; color: #0f172a; }
  .fpg-row span { font-size: 0.75rem; color: #94a3b8; }

  .fpg-rating { display: flex; align-items: center; gap: 4px; font-size: 0.76rem; font-weight: 700; color: #b45309; }

  .fpg-tags { display: flex; gap: 6px; flex-wrap: wrap; }
  .fpg-tags span {
    font-size: 0.68rem; font-weight: 600; color: #475569;
    background: #f1f5f9; border-radius: 999px; padding: 3px 8px;
  }

  @media (max-width: 980px) { .fpg-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .fpg-wrap { padding: 20px 18px 44px; } .fpg-grid { grid-template-columns: 1fr 1fr; gap: 12px; } }
`;
