import {useEffect, useRef, useState} from "react";
//import {Link, useNavigate} from "react-router-dom";
import {useNavigate} from "react-router-dom";
import {
  ShieldCheck,
  MapPin,
  //ArrowRight,
  Building2,
  Users,
  BadgeCheck,
  //ChevronDown,
  //Star,
} from "lucide-react";
import api from "../../../api/axios";
import {useCityFilter} from "../../../context/CityFilterContext";

const GENDER_OPTIONS = [
  {value: "MALE", label: "Men"},
  {value: "FEMALE", label: "Women"},
  {value: "UNISEX", label: "Unisex"},
];

const BUDGET_OPTIONS = [
  {value: 5000, label: "Under ₹5,000"},
  {value: 8000, label: "₹5,000 - ₹8,000"},
  {value: 12000, label: "₹8,000 - ₹12,000"},
  {value: 18000, label: "₹12,000 - ₹18,000"},
  {value: 25000, label: "₹18,000 - ₹25,000"},
  {value: 30000, label: "Above ₹25,000"},
];

export default function PGMateBanner({
  searchText,
  onSearchChange,
  gender,
  onGenderChange,
  maxPrice,
  onMaxPriceChange,
  onSearch,
  onExactCitySelect,   // new
}) {
  const [pgCount, setPgCount] = useState(null);
  const [cityCount, setCityCount] = useState(null);
  const [cityOptions, setCityOptions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const mounted = useRef(true);
  const searchWrapRef = useRef(null);
  const navigate = useNavigate();

  const {selectedCity, setSelectedCity} = useCityFilter(); // import { useCityFilter } from "../../../context/CityFilterContext";
  const [localityOptions, setLocalityOptions] = useState([]);
  const [checkingMatch, setCheckingMatch] = useState(false);
  const [hasNonCityMatch, setHasNonCityMatch] = useState(true); // assume match until proven otherwise
  const debounceRef = useRef(null);

  // ── Fetch counts + full city list once ──
  useEffect(() => {
    mounted.current = true;
    api
      .get("/public/pgs/count")
      .then((res) => {
        if (mounted.current) setPgCount(res.data?.count ?? null);
      })
      .catch(() => {});
    api
      .get("/public/cities")
      .then((res) => {
        if (mounted.current) {
          const cities = Array.isArray(res.data) ? res.data : [];
          setCityCount(cities.length || null);
          setCityOptions(cities);
        }
      })
      .catch(() => {});
    return () => {
      mounted.current = false;
    };
  }, []);

  // ── Filter cities client-side as the user types ──
  useEffect(() => {
    const q = (searchText || "").trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
      setHasNonCityMatch(true);
      return;
    }

    const cityMatches = cityOptions.filter((c) => c.toLowerCase().includes(q));
    setSuggestions(cityMatches.slice(0, 8));

    if (cityMatches.length > 0) {
      setHasNonCityMatch(true); // city match exists, no need for "coming soon"
      return;
    }

    // No city match — check locality (current city) and PG name before flagging "coming soon"
    const localityMatch = localityOptions.some((l) =>
      l.toLowerCase().includes(q),
    );
    if (localityMatch) {
      setHasNonCityMatch(true);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setCheckingMatch(true);
    debounceRef.current = setTimeout(() => {
      api
        .get("/public/pgs/paged", {params: {search: q, page: 0, size: 1}})
        .then((res) => {
          const found = (res.data?.content || []).length > 0;
          setHasNonCityMatch(found);
        })
        .catch(() => setHasNonCityMatch(false))
        .finally(() => setCheckingMatch(false));
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchText, cityOptions, localityOptions]);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!selectedCity) {
      setLocalityOptions([]);
      return;
    }
    api
      .get("/public/localities", {params: {city: selectedCity}})
      .then((res) => setLocalityOptions(res.data || []))
      .catch(() => setLocalityOptions([]));
  }, [selectedCity]);

  const handleSelectCity = (city) => {
    onSearchChange?.(city);
    onExactCitySelect?.(true); // new prop — tells parent this was an exact city pick
    setSelectedCity(city);
    localStorage.setItem("userCity", city);
    setShowSuggestions(false);
  };

  // ── Search button: build query params and navigate to /pgs ──
  const handleSearch = () => {
    const params = new URLSearchParams();
    const trimmed = (searchText || "").trim();

    if (trimmed) {
      const matchedCity = cityOptions.find(
        (c) => c.toLowerCase() === trimmed.toLowerCase(),
      );
      if (matchedCity) {
        params.set("city", matchedCity);
        localStorage.setItem("userCity", matchedCity);
      } else {
        // Not an exact city match (e.g. a locality name) — pass as free-text search
        params.set("search", trimmed);
      }
    }

    if (gender) params.set("gender", gender);
    if (maxPrice) params.set("maxPrice", String(maxPrice));

    setShowSuggestions(false);
    navigate(`/pgs?${params.toString()}`);
    onSearch?.();
  };

  // eslint-disable-next-line no-unused-vars
  const handlePopularClick = (loc) => {
    onSearchChange?.(loc);
    setShowSuggestions(false);
    // Localities aren't exact city matches, so this always routes via `search`
    const params = new URLSearchParams();
    params.set("search", loc);
    if (gender) params.set("gender", gender);
    if (maxPrice) params.set("maxPrice", String(maxPrice));
    navigate(`/pgs?${params.toString()}`);
    onSearch?.();
  };

  return (
    <>
      <style>{CSS}</style>
      <section className="pgb-wrap">
        <div className="pgb-ticker">
          <div className="pgb-ticker-track">
            <span style={{marginLeft: "9px"}}>
              Explore verified PGs, connect with owners, and move in without the hassle.
            </span>
          </div>
        </div>
        <div className="pgb-bg"></div>
        <div className="pgb-overlay"></div>

        <div className="pgb-content">
          <div className="pgb-left">
            {/* <div className="pgb-badge">🏠 Trusted PG Finder</div> */}

            <h1>
              Find Your Perfect <span>PG Stay</span>
            </h1>

            <p>
              Discover verified PGs, hostels and rooms near your college or
              workplace.
            </p>

            <div className="pgb-stats">
              <div className="pgb-stat">
                <ShieldCheck />
                <div>
                  <strong>{pgCount ? `${pgCount}+` : "10,000+"}</strong>
                  <span>Verified PGs</span>
                </div>
              </div>

              <div className="pgb-stat">
                <Building2 />
                <div>
                  <strong>{cityCount ? `${cityCount}+` : "50+"}</strong>
                  <span>Cities</span>
                </div>
              </div>

              <div className="pgb-stat">
                <Users />
                <div>
                  <strong>25,000+</strong>
                  <span>Residents</span>
                </div>
              </div>
              <div className="pgb-stat">
                <BadgeCheck />
                <div>
                  <strong>100%</strong>
                  <span>Genuine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FLOATING SEARCH */}

      <div className="pgb-search-container">
        <div className="pgb-search-card">
          <div
            className="pgb-field"
            ref={searchWrapRef}
            style={{position: "relative"}}
          >
            <label>Location</label>
            <div className="pgb-input-wrap">
              <MapPin size={15} />
              <input
                value={searchText}
                placeholder="Search city or locality"
                onChange={(e) => {
                  onSearchChange?.(e.target.value);
                  onExactCitySelect?.(false); // free typing again — not an exact pick anymore
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            {showSuggestions && searchText.trim() && (
              <div className="pgb-suggestions">
                {suggestions.length > 0 ? (
                  suggestions.map((city) => (
                    <button
                      key={city}
                      type="button"
                      className="pgb-suggestion-item"
                      onClick={() => handleSelectCity(city)}
                    >
                      <MapPin size={13} />
                      {city}
                    </button>
                  ))
                ) : checkingMatch ? null : hasNonCityMatch ? null : (
                  <div className="pgb-suggestion-empty">
                    <MapPin size={13} />"{searchText.trim()}" isn't available
                    yet — Coming soon!
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pgb-field">
            <label>Gender</label>
            <div className="pgb-select-wrap">
              <Users size={15} />
              <select
                value={gender}
                onChange={(e) => onGenderChange?.(e.target.value)}
              >
                <option value="">All</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pgb-field">
            <label>Budget</label>
            <div className="pgb-select-wrap">
              <span>₹</span>
              <select
                value={maxPrice}
                onChange={(e) => onMaxPriceChange?.(Number(e.target.value))}
              >
                {BUDGET_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button className="pgb-search-btn" onClick={handleSearch}>
            Search PG
          </button>
        </div>
      </div>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

.pgb-wrap {
  position: relative;
  width: 100vw;
  min-height: 480px;
  left: 50%;
  margin-left: -50vw;
  overflow: visible;
  font-family: 'DM Sans', sans-serif;
  display: flex;
  align-items: center;
}

.pgb-ticker {
  position: absolute;
  top: 0;
  right: 0;
  width: 53%;
  background: #6366f1;
  clip-path: polygon(
    0 0,
    100% 0,
    100% 100%,
    0 100%,
    55px 100%
  );
  overflow: hidden;
  z-index: 10;
  padding: 9px 0 9px 48px;  /* extra left pad for the angled cut */
}


.pgb-ticker-track span {
  font-size: clamp(0.82rem, 1.15vw, 1.1rem);
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
  letter-spacing: 0.2px;
  padding-right: 40px;
  flex-shrink: 0;
  white-space: nowrap;
}



@media (max-width: 1000px) {
  .pgb-ticker {
    width: 100%;
  }
}

@media (max-width: 600px) {
  .pgb-ticker { display: none; }
}

.pgb-bg {
  position: absolute;
  inset: 0;
  background-image: url(
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=85"
  );
  background-size: cover;
  background-position: center;
}
.pgb-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      90deg,
      rgba(255,255,255,1) 0%,
      rgba(255,255,255,.96) 32%,
      rgba(255,255,255,.65) 50%,
      rgba(255,255,255,.15) 80%,
      transparent 100%
    );
}

.pgb-content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 70px clamp(24px, 5vw, 80px) 80px;
}
.pgb-left {
  max-width: 620px;
}

.pgb-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #eef2ff;
  color: #4338ca;
  padding: 7px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 22px;
}

.pgb-left h1 {
  font-family: 'Sora', sans-serif;
  font-size: clamp(42px, 5vw, 62px);
  line-height: 1.05;
  letter-spacing: -1.5px;
  margin: 0 0 18px;
  color: #0f172a;
}

.pgb-left h1 span {
  color: #6366f1;
}

.pgb-left p {
  font-size: 18px;
  color: #475569;
  margin-bottom: 35px;
}

.pgb-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  margin-bottom: 35px;
}

.pgb-stat {
  display: flex;
  gap: 10px;
  align-items: center;
}

.pgb-stat svg {
  color: #6366f1;
  width: 22px;
}

.pgb-stat strong {
  display: block;
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
}

.pgb-stat span {
  font-size: 13px;
  color: #64748b;
}

.pgb-search-container{
  position:relative;
  z-index:5;
  width:100%;
  max-width:1600px;
  margin:-70px auto 70px;
  padding:0 clamp(24px, 5vw, 80px);
}

.pgb-search-card{
  display:grid;
  grid-template-columns:minmax(0,4.5fr) minmax(0,1fr) minmax(0,1fr) auto;
  align-items:center;
  background:white;
  padding:18px;
  border-radius:22px;
  box-shadow: 0 25px 60px rgba(15,23,42,.18);
  margin-top: 20px;
}

.pgb-field{
  padding:0 18px;
  border-right:1px solid #e5e7eb;
}

.pgb-field:last-of-type{
  border:none;
}

.pgb-field label{
  display:block;
  font-size:11px;
  font-weight:700;
  text-transform:uppercase;
  color:#94a3b8;
  margin-bottom:6px;
}

.pgb-input-wrap,
.pgb-select-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
}

.pgb-input-wrap input,
.pgb-select-wrap select{
  border:none;
  outline:none;
  font-size:15px;
  width:100%;
  background:transparent;
  color: #0f172a;
}

.pgb-search-btn{
  background:#6366f1;
  color:white;
  border:none;
  padding:16px 32px;
  border-radius:15px;
  font-weight:700;
  cursor:pointer;
  font-size: 15px;
}

.pgb-search-btn:hover {
  background: #4f46e5;
}

.pgb-suggestions {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 12px 30px rgba(15,23,42,0.12);
  z-index: 50;
  max-height: 260px;
  overflow-y: auto;
}

.pgb-suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  padding: 10px 14px;
  border: none;
  background: #fff;
  font-size: 14px;
  color: #0f172a;
  cursor: pointer;
}

.pgb-suggestion-item svg { color: #94a3b8; flex-shrink: 0; }

.pgb-suggestion-item:hover {
  background: #eef2ff;
  color: #4338ca;
}

.pgb-suggestion-item:hover svg { color: #6366f1; }

.pgb-suggestion-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  font-size: 13px;
  color: #94a3b8;
  font-style: italic;
  cursor: default;
}

.pgb-suggestion-empty svg {
  color: #cbd5e1;
  flex-shrink: 0;
}

.pgb-popular {
  margin-top: 25px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  font-size: 14px;
  color: #64748b;
}

.pgb-popular button {
  border: 1px solid #e2e8f0;
  background: white;
  padding: 7px 14px;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
}

.pgb-popular button:hover {
  border-color: #6366f1;
  color: #4338ca;
  background: #eef2ff;
}

.pgb-view-all {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #6366f1;
  font-weight: 700;
  text-decoration: none;
}

@media(max-width:1000px) {
  .pgb-overlay {
    background:
      linear-gradient(
        180deg,
        rgba(255,255,255,.95),
        rgba(255,255,255,.8)
      );
  }
  .pgb-content {
    padding: 40px 25px 70px;
  }
}

@media(max-width:900px){
  .pgb-search-container{
    margin:-100px auto 30px;
    padding:0 20px;
  }

  .pgb-search-card{
    grid-template-columns:1fr;
    gap:15px;
  }

  .pgb-field{
    border-right:none;
    border-bottom:1px solid #eee;
    padding:12px 0;
  }
}

@media(max-width:600px) {
  .pgb-wrap {
    min-height: auto;
  }
  .pgb-left h1 {
    font-size: 38px;
  }
  .pgb-left p {
    font-size: 15px;
  }
  .pgb-stats {
    gap: 20px;
  }
  .pgb-content {
    padding: 28px 18px 50px;
  }
}
`;
