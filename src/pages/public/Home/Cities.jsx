import {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {motion, AnimatePresence, useReducedMotion} from "framer-motion";
import {
  Search, X, Flame, MapPin, ShieldCheck, ChevronLeft, ChevronRight,
  ArrowRight, Clock, ChevronDown, GraduationCap,  Users,
  ShieldOff, Headset,
} from "lucide-react";
import HomeLayout from "../../../layouts/HomeLayouts";
import api from "../../../api/axios";
import PGListingCard from "../PGListingCard";
import "../../../CSS/publicPG.css";
import "./Cities.css";
import Swal from "sweetalert2";

import mumbaiImg from "../../../assets/Mumbai.jpg";
import bangaloreImg from "../../../assets/Bangalore.jpg";
import hyderabadImg from "../../../assets/Hyderabad.jpg";
import chennaiImg from "../../../assets/chennai.jpg";
import puneImg from "../../../assets/Pune.jpg";
import everyCityImg from "../../../assets/Every_city.jpg";

const FALLBACK_IMG = everyCityImg;

const RECENT_KEY = "pgmate_recent_cities";

// Hero city slides — each entry pairs its background image with the
// exact word shown in the headline, so they're always in sync.
const HERO_CITY_SLIDES = [
  {word: "Mumbai", image: mumbaiImg},
  {word: "Bangalore", image: bangaloreImg},
  {word: "Hyderabad", image: hyderabadImg},
  {word: "Chennai", image: chennaiImg},
  {word: "Pune", image: puneImg},
  {word: "every city", image: everyCityImg},
];
const HERO_SLIDE_INTERVAL = 3000; // ms between slide + word changes

// How many of the busiest cities get their own "Top Spaces in ..." row.
const MAX_CAROUSEL_CITIES = 4;
const CAROUSEL_PG_SIZE = 8;

const FAQS = [
  {
    q: "How do I know a PG listing is verified?",
    a: "Every PG on PGMate goes through a verification check before it goes live, covering ownership, photos, and amenity accuracy. Look for the verified badge on a listing's detail page.",
  },
  {
    q: "Can I filter PGs by gender or budget?",
    a: "Yes. Open any city and use the filter panel to narrow results by gender preference, budget range, sharing type, and more.",
  },
  {
    q: "My city isn't listed — what now?",
    a: "We're adding new cities every month. Use the \"List Your PG\" button below to get notified, or check back soon — new cities go live regularly.",
  },
];

// "I'm a..." persona pills. There's no dedicated persona field on the
// backend, so each one maps to the closest real filter we have (gender) —
// Couple has no equivalent yet, so it just browses the city.
const PERSONAS = [
  {key: "male", label: "Male", Icon: GraduationCap, gender: "MALE"},
  {key: "female", label: "Female", Icon: GraduationCap, gender: "FEMALE"},
  {key: "unisex", label: "Unisex", Icon: Users, gender: "UNISEX"},
];

const ZERO_BADGES = [
  {Icon: ShieldOff, title: "Zero Spam", desc: "No calls without your consent"},
  {Icon: ShieldCheck, title: "Verified Listings", desc: "Every PG checked before it goes live"},
  {Icon: Headset, title: "24/7 Support", desc: "Real help, any time you need it"},
];

/* Counts a number up from 0 to `value` once it's visible, instead of
   just popping in — used for the trust stat bar. */
const useCountUp = (value, duration = 900) => {
  const [display, setDisplay] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (value === null || value === undefined) return;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    let raf;
    const start = performance.now();
    const to = value;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(to * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => raf && cancelAnimationFrame(raf);
  }, [value, duration, reduceMotion]);

  return display;
};

const fadeUp = {
  hidden: {opacity: 0, y: 22},
  show: {opacity: 1, y: 0, transition: {duration: 0.5, ease: [0.22, 1, 0.36, 1]}},
};

const staggerParent = {
  hidden: {},
  show: {transition: {staggerChildren: 0.06}},
};

/* "Top Spaces in [City]" — a horizontally-scrolling row of real PG cards
   for one city, with left/right arrow controls. */
const CityPGCarousel = ({cityName}) => {
  const navigate = useNavigate();
  const trackRef = useRef(null);
  const dragState = useRef({down: false, startX: 0, startScroll: 0, moved: false});
  const [pgs, setPgs] = useState([]);
  const [imgIndex, setImgIndex] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get("/public/pgs/paged", {
        params: {page: 0, size: CAROUSEL_PG_SIZE, city: cityName},
      })
      .then((res) => {
        if (cancelled) return;
        setPgs(res.data?.content || []);
      })
      .catch(() => {
        if (!cancelled) setPgs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cityName]);

  const prevImg = (pgId) =>
    setImgIndex((prev) => ({...prev, [pgId]: Math.max((prev[pgId] || 0) - 1, 0)}));
  const nextImg = (pgId, total) =>
    setImgIndex((prev) => ({...prev, [pgId]: Math.min((prev[pgId] || 0) + 1, total - 1)}));

  const scrollByCard = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector(".city-carousel-card");
    const step = card ? card.offsetWidth + 16 : 280;
    track.scrollBy({left: dir * step * 2, behavior: "smooth"});
  };

  // Click-and-drag scrolling on desktop (touch already scrolls natively).
  const onPointerDown = (e) => {
    const track = trackRef.current;
    if (!track) return;
    dragState.current = {down: true, startX: e.clientX, startScroll: track.scrollLeft, moved: false};
    // Note: do NOT add the is-dragging class here. It sets
    // pointer-events:none on every child (including buttons/links), so
    // adding it on pointerdown — before we know if this is a click or a
    // drag — could disable the button mid-click and silently swallow it.
    // The class is only added once real movement confirms an actual drag.
  };

  const onPointerMove = (e) => {
    const state = dragState.current;
    const track = trackRef.current;
    if (!state.down || !track) return;
    const dx = e.clientX - state.startX;
    if (Math.abs(dx) > 8 && !state.moved) {
      state.moved = true;
      track.classList.add("is-dragging");
    }
    if (state.moved) {
      track.scrollLeft = state.startScroll - dx;
    }
  };

  const endDrag = () => {
    const track = trackRef.current;
    dragState.current.down = false;
    track?.classList.remove("is-dragging");
  };

  // Suppress the click-through to a card right after a genuine drag —
  // but never swallow a click that landed directly on an interactive
  // element (button/link).
  const onTrackClickCapture = (e) => {
    if (dragState.current.moved) {
      const isInteractive = e.target.closest("button, a");
      dragState.current.moved = false;
      if (!isInteractive) {
        e.stopPropagation();
      }
    }
  };

  if (!loading && pgs.length === 0) return null;

  return (
    <motion.section
      className="cities-pg-carousel"
      initial="hidden"
      whileInView="show"
      viewport={{once: true, amount: 0.15}}
      variants={fadeUp}
    >
      <div className="cities-pg-carousel__head">
        <h2>
          Top spaces in <span>{cityName}</span>
        </h2>
        <div className="cities-pg-carousel__actions">
          <button
            className="cities-pg-carousel__nav"
            onClick={() => scrollByCard(-1)}
            aria-label={`Scroll left through ${cityName} spaces`}
          >
            <ChevronLeft size={16} strokeWidth={2.25} />
          </button>
          <button
            className="cities-pg-carousel__nav"
            onClick={() => scrollByCard(1)}
            aria-label={`Scroll right through ${cityName} spaces`}
          >
            <ChevronRight size={16} strokeWidth={2.25} />
          </button>
          <button
            className="cities-pg-carousel__viewall"
            onClick={() => navigate(`/pgs?city=${encodeURIComponent(cityName)}`)}
          >
            View all <ArrowRight size={14} strokeWidth={2.25} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="cities-pg-carousel__track">
          {Array.from({length: 4}).map((_, i) => (
            <div key={i} className="city-carousel-card city-carousel-skel" />
          ))}
        </div>
      ) : (
        <div
          className="cities-pg-carousel__track"
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onClickCapture={onTrackClickCapture}
        >
          {pgs.map((pg) => (
            <div key={pg.id} className="city-carousel-card">
              <PGListingCard
                pg={pg}
                imageIndex={imgIndex[pg.id] || 0}
                onPrevImage={(item) => prevImg(item.id)}
                onNextImage={(item) => nextImg(item.id, item.imageUrls?.length)}
                onNavigate={(item) => navigate(`/pg/${item.id}`)}
              />
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
};

const Cities = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [carouselPage, setCarouselPage] = useState({});

  // Wishlist modal state
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [wishlistCity, setWishlistCity] = useState("");
  const [wishlistEmail, setWishlistEmail] = useState("");
  const [isSubmittingWishlist, setIsSubmittingWishlist] = useState(false);

  const [cities, setCities] = useState([]);
  const [dbCityCount, setDbCityCount] = useState(null);
  const [stateMap, setStateMap] = useState({});
  const [counts, setCounts] = useState({});
  const [totalCount, setTotalCount] = useState(null);
  const [recentCities, setRecentCities] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [heroBgIndex, setHeroBgIndex] = useState(0);
  const totalCountDisplay = useCountUp(totalCount);
  const cityCountDisplay = useCountUp(dbCityCount); // was: cities.length

  const getCityName = (link, fallback) => {
    if (!link) return (fallback || "City").trim();
    const match = link.match(/city=([^&]+)/);
    const raw = match ? decodeURIComponent(match[1]) : fallback || "City";
    return raw.trim();
  };

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      if (Array.isArray(stored)) setRecentCities(stored);
    } catch {
      // quiet fail for non-critical analytics
    }
  }, []);

  const handleWishlistSubmit = async (e) => {
    e.preventDefault();
    if (!wishlistCity.trim() || !wishlistEmail.trim()) return;
    setIsSubmittingWishlist(true);
    try {
      await api.post("/public/cities/wishlist", {
        city: wishlistCity,
        email: wishlistEmail,
      });
      Swal.fire({
        icon: "success",
        title: "Added to Wishlist",
        text: "We will notify you once we launch in your city!",
        confirmButtonColor: "#4f46e5",
      });
      setIsWishlistModalOpen(false);
      setWishlistCity("");
      setWishlistEmail("");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to add to wishlist. Please try again later.",
        confirmButtonColor: "#4f46e5",
      });
    } finally {
      setIsSubmittingWishlist(false);
    }
  };

  // Auto-rotate the hero slide — image + word move together, always in sync.
  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setHeroBgIndex((prev) => (prev + 1) % HERO_CITY_SLIDES.length);
    }, HERO_SLIDE_INTERVAL);
    return () => clearInterval(id);
  }, [reduceMotion]);

  useEffect(() => {
    api
      .get("/public/ui-assets?section=home_citywise")
      .then((res) => {
        const raw = res.data || [];
        if (raw.length) {
          const seen = new Set();
          const deduped = [];
          raw.forEach((c) => {
            const name = getCityName(c.link, c.name);
            const key = name.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            deduped.push({id: c.id, name, image: c.imageUrl || FALLBACK_IMG});
          });
          setCities(deduped);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    api
      .get("/public/cities")
      .then((res) => {
        const list = res.data || [];
        setDbCityCount(list.length); // NEW — true count, isolated from card list
        setCities((prev) => {
          const have = new Set(prev.map((c) => c.name.toLowerCase()));
          const extra = list
            .filter((name) => name && !have.has(String(name).toLowerCase()))
            .map((name, i) => ({id: `plain-${i}`, name, image: FALLBACK_IMG}));
          return [...prev, ...extra];
        });
      })
      .catch((err) => {
        console.error("cities fetch failed:", err);
        setDbCityCount(null);
      });

    api
      .get("/public/city-states")
      .then((res) => setStateMap(res.data || {}))
      .catch(() => {});

    api
      .get("/public/pgs/count")
      .then((res) => setTotalCount(res.data?.count ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!cities.length) return;
    let cancelled = false;

    cities.forEach((city) => {
      if (counts[city.name] !== undefined) return;
      api
        .get("/public/pgs/count/city", {params: {city: city.name}})
        .then((res) => {
          if (cancelled) return;
          setCounts((prev) => ({...prev, [city.name]: res.data?.count ?? 0}));
        })
        .catch(() => {
          if (!cancelled) setCounts((prev) => ({...prev, [city.name]: 0}));
        });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.name.toLowerCase().includes(q));
  }, [cities, search]);

  const popularSet = useMemo(() => {
    const withCounts = cities.filter((c) => counts[c.name] > 0);
    const sorted = [...withCounts].sort((a, b) => (counts[b.name] || 0) - (counts[a.name] || 0));
    return new Set(sorted.slice(0, 3).map((c) => c.name));
  }, [cities, counts]);

  const quickChips = useMemo(() => cities.slice(0, 6), [cities]);

  const carouselCities = useMemo(() => {
    const withCounts = cities.filter((c) => counts[c.name] > 0);
    const sorted = [...withCounts].sort((a, b) => (counts[b.name] || 0) - (counts[a.name] || 0));
    const seen = new Set();
    const result = [];
    for (const c of sorted) {
      const key = c.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(c.name);
      if (result.length === MAX_CAROUSEL_CITIES) break;
    }
    return result;
  }, [cities, counts]);

  const handleCityClick = (cityName) => {
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      const cityData = cities.find((c) => c.name === cityName);
      const next = [
        {name: cityName, image: cityData?.image || FALLBACK_IMG},
        ...stored.filter((c) => c.name !== cityName),
      ].slice(0, 4);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      setRecentCities(next);
    } catch {
      // localStorage may be unavailable — nice-to-have, not critical.
    }
    
    const params = new URLSearchParams({city: cityName});
    if (selectedPersona) {
      const activePersona = PERSONAS.find(p => p.key === selectedPersona);
      if (activePersona?.gender) params.set("gender", activePersona.gender);
    }
    navigate(`/pgs?${params.toString()}`);
  };

  const handlePersonaSelect = (persona) => {
    setSelectedPersona((prev) => (prev === persona.key ? null : persona.key));
  };

  return (
    <HomeLayout>
      <motion.div
        className="cities-page"
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        transition={{duration: 0.4}}
      >
        <section className="cities-hero">
          <div className="cities-hero-bg">
            <AnimatePresence>
              <motion.div
                key={heroBgIndex}
                className="cities-hero-bg-slide"
                style={{backgroundImage: `url(${HERO_CITY_SLIDES[heroBgIndex].image})`}}
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0}}
                transition={{duration: 1.2, ease: "easeInOut"}}
              />
            </AnimatePresence>
            <div className="cities-hero-bg-overlay" />
            {/* Map-pin constellation — signature motif tying the hero to
                "find a place on a map", echoed again in the city-card pin. */}
            <svg className="cities-pin-field" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <circle className="cities-pin-dot d1" cx="12" cy="28" r="0.9" />
              <circle className="cities-pin-dot d2" cx="88" cy="20" r="0.7" />
              <circle className="cities-pin-dot d3" cx="92" cy="70" r="1" />
              <circle className="cities-pin-dot d4" cx="8" cy="76" r="0.8" />
              <circle className="cities-pin-dot d5" cx="50" cy="10" r="0.6" />
            </svg>
          </div>

          <motion.div
            className="cities-hero-inner"
            initial="hidden"
            animate="show"
            variants={staggerParent}
          >
            {/* <motion.span className="cities-eyebrow" variants={fadeUp}>
              <Building2 size={13} strokeWidth={2.5} />
              PGMate coverage
            </motion.span> */}

            <motion.h1 variants={fadeUp}>
  Find your perfect PG in{" "}
  <span className="cities-rotate-wrap">
    <AnimatePresence mode="wait">
  <motion.span
    key={heroBgIndex}
    className="cities-rotate-word"
    initial={{opacity: 0, y: 14}}
    animate={{opacity: 1, y: 0}}
    exit={{opacity: 0, y: -14}}
    transition={{duration: 0.35, ease: "easeOut"}}
  >
    {HERO_CITY_SLIDES[heroBgIndex].word}
  </motion.span>
</AnimatePresence>
  </span>
</motion.h1>

            <motion.p variants={fadeUp} style={{fontWeight: 700}}>
  Verified PGs, hostels & coliving spaces
  {dbCityCount ? ` across ${dbCityCount} cities` : ""} and growing.
  Pick a city to see what's available near you.
</motion.p>

            <motion.div className="cities-persona-row" variants={fadeUp}>
              <span className="cities-persona-label">I'm a</span>
              {PERSONAS.map((p) => (
                <button
                  key={p.key}
                  className={`cities-persona-pill${selectedPersona === p.key ? " active" : ""}`}
                  onClick={() => handlePersonaSelect(p)}
                >
                  <p.Icon size={15} strokeWidth={2.25} />
                  {p.label}
                </button>
              ))}
            </motion.div>

            <motion.div className="cities-search" variants={fadeUp}>
              <Search size={18} strokeWidth={2} className="cities-search-icon" />
              <input
                type="text"
                placeholder="Search for a city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && search.trim()) {
                    handleCityClick(filtered.length > 0 ? filtered[0].name : search.trim());
                  }
                }}
              />
              <AnimatePresence>
                {search && (
                  <motion.button
                    className="cities-search-clear"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    initial={{opacity: 0, scale: 0.6}}
                    animate={{opacity: 1, scale: 1}}
                    exit={{opacity: 0, scale: 0.6}}
                    transition={{duration: 0.15}}
                  >
                    <X size={13} strokeWidth={2.5} />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>

            {!search && quickChips.length > 0 && (
              <motion.div className="cities-quick-chips" variants={fadeUp}>
                {quickChips.map((c) => (
                  <button key={c.id} className="cities-chip" onClick={() => handleCityClick(c.name)}>
                    {c.name}
                  </button>
                ))}
              </motion.div>
            )}

            <motion.div className="cities-stats" variants={fadeUp}>
              <div className="cities-stat">
                {totalCount !== null ? (
                  <strong>{totalCountDisplay.toLocaleString()}+</strong>
                ) : (
                  <span className="cities-stat-skel" />
                )}
                <span>PGs listed</span>
              </div>
              <div className="cities-stat-divider" />
              <div className="cities-stat">
                {dbCityCount ? <strong>{cityCountDisplay}</strong> : <span className="cities-stat-skel" />}
                <span>Cities covered</span>
              </div>
              <div className="cities-stat-divider" />
              <div className="cities-stat">
                <strong>
                  <ShieldCheck size={15} strokeWidth={2.25} />
                  Verified
                </strong>
                <span>Every PG checked</span>
              </div>
            </motion.div>
          </motion.div>
        </section>

        <motion.section
          className="cities-zero-row"
          initial="hidden"
          whileInView="show"
          viewport={{once: true, amount: 0.3}}
          variants={staggerParent}
        >
          {ZERO_BADGES.map((b) => (
            <motion.div key={b.title} className="cities-zero-item" variants={fadeUp}>
              <div className="cities-zero-icon">
                <b.Icon size={20} strokeWidth={2} />
              </div>
              <div>
                <h4>{b.title}</h4>
                <p>{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.section>

        {recentCities.length > 0 && (
          <motion.section
            className="cities-recent"
            initial="hidden"
            whileInView="show"
            viewport={{once: true, amount: 0.3}}
            variants={fadeUp}
          >
            <h3>
              <Clock size={15} strokeWidth={2.25} /> Recently viewed
            </h3>
            <div className="cities-recent-chips">
              {recentCities.map((c) => (
                <button key={c.name} className="cities-recent-chip" onClick={() => handleCityClick(c.name)}>
                  <img
                    src={c.image}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMG;
                    }}
                  />
                  {c.name}
                </button>
              ))}
            </div>
          </motion.section>
        )}

        <section className="cities-grid-section">
          {loading ? (
            <div className="cities-grid">
              {Array.from({length: 8}).map((_, i) => (
                <div key={i} className="city-card-skel" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="cities-empty">
              <MapPin size={36} strokeWidth={1.75} />
              <h3>No cities match "{search}"</h3>
              <p>Try a different spelling, or browse the full list below.</p>
              <button onClick={() => setSearch("")}>Clear search</button>
            </div>
          ) : (
            <motion.div
              className="cities-grid"
              initial="hidden"
              animate="show"
              variants={staggerParent}
            >
              {filtered.map((city) => {
                const count = counts[city.name];
                const isPopular = popularSet.has(city.name);
                return (
                  <motion.button
                    key={city.id}
                    className="city-card"
                    variants={fadeUp}
                    whileHover={reduceMotion ? undefined : {y: -6}}
                    transition={{duration: 0.2}}
                    onClick={() => handleCityClick(city.name)}
                  >
                    <div className="city-card-img">
                      <img
                        src={city.image}
                        alt={city.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_IMG;
                        }}
                      />
                      <span className="city-card-overlay" />
                      {isPopular && (
                        <span className="city-card-badge">
                          <Flame size={11} strokeWidth={2.5} /> Popular
                        </span>
                      )}
                    </div>
                    <div className="city-card-body">
                      <h3>{city.name}</h3>
                      <div className="city-card-meta">
                        {stateMap[city.name] && (
                          <span className="city-card-state">
                            <MapPin size={12} strokeWidth={2.25} />
                            {stateMap[city.name]}
                          </span>
                        )}
                        {count !== undefined && (
                          <span className="city-card-count">
                            {count > 0 ? `${count} PG${count === 1 ? "" : "s"}` : "Coming soon"}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="city-card-arrow">
                      <ArrowRight size={14} strokeWidth={2.25} />
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </section>

        {carouselCities.map((cityName) => (
          <CityPGCarousel key={cityName} cityName={cityName} />
        ))}

        <motion.section
          className="cities-faq"
          initial="hidden"
          whileInView="show"
          viewport={{once: true, amount: 0.1}}
          variants={fadeUp}
        >
          <h2>Frequently asked</h2>
          <div className="cities-faq-list">
            {FAQS.map((item, i) => (
              <div key={i} className={`cities-faq-item ${openFaq === i ? "open" : ""}`}>
                <button
                  className="cities-faq-question"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={16} strokeWidth={2.25} />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{height: 0, opacity: 0}}
                      animate={{height: "auto", opacity: 1}}
                      exit={{height: 0, opacity: 0}}
                      transition={{duration: 0.25, ease: "easeInOut"}}
                      style={{ overflow: "hidden" }}
                    >
                      <p className="cities-faq-answer">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="cities-cta"
          initial="hidden"
          whileInView="show"
          viewport={{once: true, amount: 0.3}}
          variants={fadeUp}
        >
          <div className="cities-cta-inner">
            <div>
              <h2>Don't see your city yet?</h2>
              <p>
                We're adding new cities every month. List your PG with us and be the first
                one live when we launch in your area.
              </p>
            </div>
            <button onClick={() => setIsWishlistModalOpen(true)}>WishList Your City</button>
          </div>
        </motion.section>
      </motion.div>

      {/* Wishlist Modal */}
      <AnimatePresence>
        {isWishlistModalOpen && (
          <div className="cities-wishlist-modal-overlay">
            <motion.div
              className="cities-wishlist-modal"
              initial={{opacity: 0, scale: 0.95, y: 20}}
              animate={{opacity: 1, scale: 1, y: 0}}
              exit={{opacity: 0, scale: 0.95, y: 20}}
            >
              <button
                className="cities-wishlist-close"
                onClick={() => setIsWishlistModalOpen(false)}
              >
                <X size={20} />
              </button>
              <h2>Wishlist Your City</h2>
              <p>Tell us where you want us next, and we'll keep you posted.</p>
              
              <form onSubmit={handleWishlistSubmit}>
                <div className="cities-wishlist-form-group">
                  <label>City Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Jaipur" 
                    value={wishlistCity}
                    onChange={(e) => setWishlistCity(e.target.value)}
                    required 
                  />
                </div>
                <div className="cities-wishlist-form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="you@example.com" 
                    value={wishlistEmail}
                    onChange={(e) => setWishlistEmail(e.target.value)}
                    required 
                  />
                </div>
                <button type="submit" className="cities-wishlist-submit" disabled={isSubmittingWishlist}>
                  {isSubmittingWishlist ? "Submitting..." : "Submit Wishlist"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </HomeLayout>
  );
};

export default Cities;