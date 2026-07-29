import {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {
  Building2,
  Users2,
  MessageSquareWarning,
  IndianRupee,
  BellRing,
  BarChart3,
  Bed,
  User,
  Briefcase,
  Building,
  CalendarCheck,
  ShieldCheck,
  Globe,
  Rocket,
  Lock,
  FileLock2,
  EyeOff,
  Smartphone,
  CreditCard,
} from "lucide-react";
import api from "../../../api/axios";
import ApkDownloadModal from "../../../components/ApkModal";
import "./ForOwnersPage.css";

/* ---------------- DATA ---------------- */

const features = [
  {
    icon: Building2,
    title: "Property & room setup",
    desc: "Add rooms, beds, and rent amounts in minutes. Your dashboard updates live as you go.",
  },
  {
    icon: Users2,
    title: "Tenant management",
    desc: "Store tenant profiles, ID proofs, and digital agreements — no paperwork drawer needed.",
  },
  {
    icon: IndianRupee,
    title: "Rent tracking",
    desc: "See who's paid, who's due, and who's overdue at a single glance, every month.",
  },
  {
    icon: BellRing,
    title: "Automatic reminders",
    desc: "Rent and due-date reminders go out on their own — you don't have to chase anyone.",
  },
  {
    icon: MessageSquareWarning,
    title: "Complaint management",
    desc: "Tenants raise issues directly in the app — you track, assign, and resolve them without WhatsApp chaos.",
  },
  {
    icon: BarChart3,
    title: "Revenue insights",
    desc: "Track occupancy and monthly revenue trends across every property you manage.",
  },
];

const featureWords = features.map((f) => f.title);

const demoSteps = [
  {
    title: "Add your PG",
    desc: "See how to list your PG — add your property details, amenities, and photos in just a few steps.",
    video: "/AddPGDemo.mp4",
    poster: "/AddPGDemo.jpg",
  },
  {
    title: "Add rooms & set rent",
    desc: "Learn how to add rooms to your PG, choose the sharing type, and set the monthly rent and deposit.",
    video: "/AddRoomDemo.mp4",
  },
  {
    title: "Add a tenant",
    desc: "See how to add a new tenant to your PG — assign a bed, fill in their details, and set the rent. Simple and done in minutes.",
    video: "/demo.mp4",
  },
  {
    title: "Handle complaints, the easy way",
    desc: "Tenants report issues directly in the app. You get notified, assign it, and mark it resolved — no calls, no WhatsApp threads.",
    video: "/demo.mp4",
  },
  {
    title: "Know your rent status at a glance",
    desc: "See exactly who has paid, who hasn't, and how much you've collected this month — all in one clear view.",
    video: "/demo.mp4",
  },
];

const audiences = [
  {
    icon: User,
    title: "Independent owner",
    desc: "Running a single PG and tired of registers, WhatsApp reminders, and missed rent dates.",
  },
  {
    icon: Building,
    title: "Multi-property owner",
    desc: "Managing several PGs or hostels and need one dashboard instead of five spreadsheets.",
  },
  {
    icon: Briefcase,
    title: "PG manager",
    desc: "Running day-to-day operations for an owner and need a faster way to handle tenants & dues.",
  },
  {
    icon: ShieldCheck,
    title: "Caretaker / on-site staff",
    desc: "Assigned to one PG by the owner — handle bookings, resident check-ins, and complaints without needing WhatsApp back-and-forth.",
  },
  {
    icon: Globe,
    title: "NRI / remote owner",
    desc: "Own a PG in India but manage it from abroad — track rent, occupancy, and complaints entirely online, no visits needed.",
  },
  {
    icon: Rocket,
    title: "First-time PG owner",
    desc: "Just starting out — PGMate walks you through adding your first property, rooms, and tenants step by step.",
  },
];

const compareIcons = [
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
  </svg>,
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M15 8.5c-.83-.78-1.94-1-3-1-2.21 0-4 1.57-4 3.5s1.79 3.5 4 3.5c1.06 0 2.17-.22 3-1" />
    <path d="M12 6v2M12 16v2" />
  </svg>,
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>,
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 20h20M5 20V10l7-7 7 7v10" />
    <path d="M9 20v-5h6v5" />
  </svg>,
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>,
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>,
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>,
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>,
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>,
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>,
];

const compareRows = [
  {
    feature: "Data management",
    old: "Registers, Excel, WhatsApp",
    pg: "Everything stored digitally in one place",
  },
  {
    feature: "Rent collection",
    old: "Manual follow-ups",
    pg: "Automatic reminders sent for you",
  },
  {
    feature: "Documentation",
    old: "Paper agreements & KYC",
    pg: "Digital agreements, stored online",
  },
  {
    feature: "Availability",
    old: "Manual checks",
    pg: "See vacant beds instantly on dashboard",
  },
  {
    feature: "Complaint handling",
    old: "Calls / WhatsApp",
    pg: "Tenants raise issues in app, you track & close",
  },
  {
    feature: "Financials",
    old: "Difficult to track dues",
    pg: "Clear view of pending dues & deposits",
  },
  {
    feature: "Reporting",
    old: "Manual reports",
    pg: "Reports generated automatically",
  },
  {
    feature: "Information flow",
    old: "Scattered files",
    pg: "One place for everything",
  },
  {
    feature: "Operations",
    old: "Owner-dependent",
    pg: "Any staff member can manage easily",
  },
  {
    feature: "Risk / audit",
    old: "High risk, manual errors",
    pg: "Everything logged, less mistakes",
  },
];

const securityPoints = [
  {
    icon: Lock,
    title: "Encrypted storage",
    desc: "All tenant and payment data is encrypted, both in transit and at rest.",
  },
  {
    icon: FileLock2,
    title: "Private documents",
    desc: "ID proofs and agreements stay locked to your account — only you can view them.",
  },
  {
    icon: ShieldCheck,
    title: "Controlled access",
    desc: "Give managers or caretakers limited access without sharing your full account.",
  },
  {
    icon: EyeOff,
    title: "No data sharing",
    desc: "Your tenant and payment information is never sold or shared with third parties.",
  },
  {
    icon: Smartphone,
    title: "Phone verified access",
    desc: "Every account is OTP-verified at signup — no fake or unverifiable logins.",
  },
  {
    icon: CreditCard,
    title: "Secure payment processing",
    desc: "Rent and deposit payments go through authorised, encrypted payment gateways.",
  },
];

const securityWords = securityPoints.map((s) => s.title);

/* ---------------- ANIMATED NUMBER ---------------- */

const AnimatedNumber = ({value}) => {
  const [display, setDisplay] = useState("0");
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const numMatch = value.match(/[\d,]+/);
    if (!numMatch) {
      setDisplay(value);
      return;
    }
    const target = parseInt(numMatch[0].replace(/,/g, ""), 10);
    const prefix = value.slice(0, numMatch.index);
    const suffix = value.slice(numMatch.index + numMatch[0].length);

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const duration = 1200;
          const start = performance.now();

          const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const current = Math.floor(progress * target);
            setDisplay(`${prefix}${current.toLocaleString()}${suffix}`);
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      {threshold: 0.4},
    );

    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value]);

  return <h3 ref={ref}>{display}</h3>;
};

/* ---------------- COMPONENT ---------------- */

const ForOwnersPage = () => {
  const trackRef = useRef(null);
  const navigate = useNavigate();
  const ballRef = useRef(null);
  const fillRef = useRef(null);
  const stepRefs = useRef([]);

  const [rotatingIndex, setRotatingIndex] = useState(0);
  const [featureWordIndex, setFeatureWordIndex] = useState(0);
  const [securityWordIndex, setSecurityWordIndex] = useState(0);
  const [showApkModal, setShowApkModal] = useState(false);

  useEffect(() => {
    setShowApkModal(true);
  }, []);

  const [pgCount, setPgCount] = useState(null);
  const [cityCount, setCityCount] = useState(null);
  const [ownerCount, setOwnerCount] = useState(null);

  useEffect(() => {
    api
      .get("/public/pgs/count")
      .then((res) => setPgCount(res.data?.count ?? null))
      .catch(() => setPgCount(null));

    api
      .get("/public/cities")
      .then((res) =>
        setCityCount(Array.isArray(res.data) ? res.data.length : null),
      )
      .catch(() => setCityCount(null));

    api
      .get("/public/owners/count")
      .then((res) => setOwnerCount(res.data?.count ?? null))
      .catch(() => setOwnerCount(null));
  }, []);

  const stats = [
    {
      value: pgCount !== null ? `${pgCount}+` : "500+",
      label: "PGs onboarded",
    },
    {
      value: ownerCount !== null ? `${ownerCount}+` : "500+",
      label: "Trusted owners",
    },
    {
      value: cityCount !== null ? `${cityCount}+` : "20+",
      label: "Cities covered",
    },
    {value: "100%", label: "Digital management"},
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingIndex((i) => (i + 1) % audiences.length);
      setFeatureWordIndex((i) => (i + 1) % featureWords.length);
      setSecurityWordIndex((i) => (i + 1) % securityWords.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const update = () => {
      const track = trackRef.current;
      const ball = ballRef.current;
      const fill = fillRef.current;
      if (!track || !ball || !fill) return;

      const rect = track.getBoundingClientRect();
      const trackHeight = track.offsetHeight;
      const viewportCenter = window.innerHeight * 0.45;

      let progress = (viewportCenter - rect.top) / trackHeight;
      progress = Math.max(0, Math.min(1, progress));

      const travel = trackHeight * progress;
      ball.style.transform = `translateY(${travel}px)`;
      fill.style.height = `${progress * 100}%`;

      let activeIndex = 0;
      stepRefs.current.forEach((step, i) => {
        if (!step) return;
        const dot = step.querySelector(".demo-dot");
        const dotOffset = dot.getBoundingClientRect().top - rect.top;
        if (travel >= dotOffset - 20) activeIndex = i;
        step.classList.remove("active");
      });
      stepRefs.current[activeIndex]?.classList.add("active");
    };

    window.addEventListener("scroll", update, {passive: true});
    window.addEventListener("resize", update);
    update();

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.replace("#", "");
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({behavior: "smooth", block: "start"});
        }
      }, 300);
    }
  }, []);

  return (
    <div className="for-owners-page">
      <ApkDownloadModal show={showApkModal} setShow={setShowApkModal} />
      {/* HERO */}
      <section className="fo-hero">
        <div className="container">
          <div className="fo-hero-grid">
            <div className="fo-hero-text">
              <span className="fo-badge">For PG Owners</span>
              <h1>Run your PG without the spreadsheets & Registers</h1>
              <p className="fo-hero-sub">
                Tenants, rent, agreements, and bookings — all in one dashboard
                built for PG owners in India.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="btn-outline-grad fo-hero-btn"
                  onClick={() => navigate("/list-your-property")}
                >
                  List your PG →
                </button>
                <button
                  className="btn-primary-grad fo-hero-btn"
                  onClick={() =>
                    document
                      .getElementById("demo-videos")
                      ?.scrollIntoView({behavior: "smooth"})
                  }
                >
                  Watch demo ↓
                </button>
              </div>
            </div>

            <div className="fo-hero-mock fo-dash-mock">
              <div className="fo-dash-layout">
                <aside className="fo-dash-sidebar">
                  <div className="fo-dash-profile">
                    <div className="fo-dash-avatar">
                      <User size={16} strokeWidth={1.8} />
                    </div>
                    <strong>Owner</strong>
                    <span>View Profile</span>
                  </div>

                  <nav className="fo-dash-nav">
                    <div className="fo-dash-nav-item fo-dash-nav-active">
                      <Building2 size={13} strokeWidth={1.8} />
                      Dashboard
                    </div>
                    <div className="fo-dash-nav-item">
                      <Building size={13} strokeWidth={1.8} />
                      My PGs
                    </div>
                    <div className="fo-dash-nav-item">
                      <Building2 size={13} strokeWidth={1.8} />
                      Manage Rooms
                    </div>
                    <div className="fo-dash-nav-item">
                      <BarChart3 size={13} strokeWidth={1.8} />
                      Available Beds
                    </div>
                    <div className="fo-dash-nav-item">
                      <Users2 size={13} strokeWidth={1.8} />
                      Tenants
                    </div>
                    <div className="fo-dash-nav-item">
                      <CalendarCheck size={13} strokeWidth={1.8} />
                      Bookings
                    </div>
                    <div className="fo-dash-nav-item">
                      <IndianRupee size={13} strokeWidth={1.8} />
                      Monthly Rent
                    </div>
                  </nav>

                  <div className="fo-dash-logout">Logout</div>
                </aside>

                <div className="fo-dash-main">
                  <div className="fo-dash-topbar">
                    <div>
                      <h4>Owner Dashboard</h4>
                      <span>Manage your PG operations</span>
                    </div>
                    <div className="fo-dash-topbar-btns">
                      {/* <span className="fo-dash-pill-btn">Language</span> */}
                      <span className="fo-dash-pill-btn fo-dash-pill-btn-dark">
                        Export
                      </span>
                    </div>
                  </div>

                  <div className="fo-dash-content">
                    <div className="fo-dash-content-left">
                      <div className="fo-dash-banner">
                        <div>
                          <h4>
                            Welcome back, <b>Owner</b>
                          </h4>
                          <span>Here's what's happening in your PG today</span>
                        </div>
                        <div className="fo-dash-banner-icon">
                          <Building2 size={18} strokeWidth={1.8} />
                        </div>
                      </div>

                      {/* QUICK ACTION — grid row, icon-on-top like real dashboard */}
                      <div className="fo-dash-quickrow-wrap">
                        <span className="fo-dash-quickrow-label">
                          Quick Action
                        </span>
                        <div className="fo-dash-quickrow">
                          <div className="fo-mock-quick-btn fo-mock-quick-purple fo-dash-quick-btn">
                            <i className="bi bi-plus-circle"></i>
                            Add PG
                          </div>
                          <div className="fo-mock-quick-btn fo-mock-quick-lavender fo-dash-quick-btn">
                            <i className="bi bi-door-open"></i>
                            Add Room
                          </div>
                          <div className="fo-mock-quick-btn fo-mock-quick-green fo-dash-quick-btn">
                            <i className="bi bi-grid"></i>
                            Add Bed
                          </div>
                          <div className="fo-mock-quick-btn fo-mock-quick-orange fo-dash-quick-btn">
                            <i className="bi bi-person-plus"></i>
                            Add Resident
                          </div>
                          <div className="fo-mock-quick-btn fo-mock-quick-red fo-dash-quick-btn">
                            <i className="bi bi-exclamation-circle"></i>
                            Complaints
                          </div>
                        </div>
                      </div>

                      {/* OVERVIEW — icon-on-top cards, matches real dashboard */}
                      <div className="fo-dash-overview-label">Overview</div>
                      <div className="fo-dash-row fo-dash-row-4">
                        <div className="fo-dash-stat-card fo-dash-stat-card-c">
                          <div className="fo-dash-stat-icon fo-dash-stat-icon-purple">
                            <Building2 size={14} strokeWidth={1.8} />
                          </div>
                          <span className="fo-dash-label">Total PGs</span>
                          <strong>4</strong>
                        </div>
                        <div className="fo-dash-stat-card fo-dash-stat-card-c">
                          <div className="fo-dash-stat-icon fo-dash-stat-icon-green">
                            <Bed size={14} strokeWidth={1.8} />
                          </div>
                          <span className="fo-dash-label">Total Beds</span>
                          <strong>86</strong>
                        </div>
                        <div className="fo-dash-stat-card fo-dash-stat-card-c">
                          <div className="fo-dash-stat-icon fo-dash-stat-icon-orange">
                            <Users2 size={14} strokeWidth={1.8} />
                          </div>
                          <span className="fo-dash-label">Total Tenants</span>
                          <strong>52</strong>
                        </div>
                        <div className="fo-dash-stat-card fo-dash-stat-card-c">
                          <div className="fo-dash-stat-icon fo-dash-stat-icon-indigo">
                            <IndianRupee size={14} strokeWidth={1.8} />
                          </div>
                          <span className="fo-dash-label">
                            Revenue (This Mo.)
                          </span>
                          <strong>₹50,000</strong>
                        </div>
                      </div>

                      <div className="fo-dash-row">
                        <div className="fo-dash-card fo-dash-card-grow">
                          <div className="fo-dash-card-head">
                            <span className="fo-dash-label">Revenue pulse</span>
                            <span className="fo-mock-pill fo-mock-pill-green">
                              ▲ 12% this mo.
                            </span>
                          </div>
                          <strong className="fo-dash-amount">₹50,000</strong>
                          <span className="fo-mock-sub">
                            Collected this month
                          </span>
                          <div className="fo-mock-bars">
                            <span style={{height: "30%"}} />
                            <span style={{height: "45%"}} />
                            <span style={{height: "38%"}} />
                            <span style={{height: "60%"}} />
                            <span style={{height: "52%"}} />
                            <span style={{height: "78%"}} />
                          </div>
                          <div className="fo-dash-mini-row">
                            <div className="fo-dash-mini-pill fo-dash-mini-amber">
                              <span>PENDING</span>
                              <strong>₹0</strong>
                            </div>
                            <div className="fo-dash-mini-pill fo-dash-mini-red">
                              <span>OVERDUE</span>
                              <strong>₹0</strong>
                            </div>
                          </div>
                        </div>

                        <div className="fo-dash-card fo-dash-card-grow">
                          <div className="fo-dash-card-head">
                            <span className="fo-dash-label">
                              Bed health score
                            </span>
                            <span className="fo-mock-pill fo-mock-pill-amber">
                              Moderate
                            </span>
                          </div>
                          <div className="fo-mock-donut">
                            <div className="fo-mock-donut-ring">
                              <span>58</span>
                            </div>
                            <div className="fo-mock-donut-meta">
                              <p>
                                Turnover rate <b>19%/mo</b>
                              </p>
                              <p>
                                Beds due service <b>0</b>
                              </p>
                              <p>
                                Long-vacant <b>0</b>
                              </p>
                            </div>
                          </div>
                          <div className="fo-dash-tip">
                            A few beds have been vacant. Consider running
                            promotions.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="fo-stats">
        <div className="container">
          <div className="row g-4">
            {stats.map((s, i) => (
              <div key={i} className="col-6 col-md-3">
                <div className="fo-stat-card">
                  <AnimatedNumber key={s.value} value={s.value} />
                  <p>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="fo-section">
        <div className="container">
          <div className="fo-eyebrow">What you get</div>
          <h2 className="fo-title">
            Everything your PG needs, one place{" "}
            <span className="fo-rotating-word-wrapper">
              <span className="fo-rotating-word" key={featureWordIndex}>
                {featureWords[featureWordIndex]}
              </span>
            </span>
          </h2>
          <p className="fo-sub">
            From the first room you add to the last rent reminder you send.
          </p>

          <div className="row g-4 mt-2">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="col-12 col-sm-6 col-lg-4">
                  <div className="fo-feature-card">
                    <div className="fo-feature-icon">
                      <Icon size={22} strokeWidth={1.8} />
                    </div>
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section className="fo-section fo-section-alt">
        <div className="container">
          <div className="fo-eyebrow">Your data, protected</div>
          <h2 className="fo-title">
            Owner trust starts with{" "}
            <span className="fo-rotating-word-wrapper">
              <span className="fo-rotating-word" key={securityWordIndex}>
                {securityWords[securityWordIndex]}
              </span>
            </span>
          </h2>
          <p className="fo-sub">
            Tenant records, agreements, and payment details — encrypted,
            access-controlled, and never shared with third parties.
          </p>

          <div className="fo-security-grid" style={{marginTop: "32px"}}>
            {securityPoints.map((sp, i) => {
              const Icon = sp.icon;
              return (
                <div key={i} className="fo-security-card">
                  <div className="fo-security-icon">
                    <Icon size={22} strokeWidth={1.8} />
                  </div>
                  <h3>{sp.title}</h3>
                  <p>{sp.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DEMO VIDEOS */}
      <section className="fo-section" id="demo-videos">
        <div className="container">
          <div className="fo-eyebrow">See it in action</div>
          <h2 className="fo-title">Watch how owners use PGMate</h2>
          <p className="fo-sub">
            Four short clips, each under two minutes — covering exactly what
            you'll do in your first week.
          </p>

          <div className="demo-track" ref={trackRef}>
            <div className="demo-string">
              <div className="demo-string-fill" ref={fillRef} />
            </div>
            <div className="demo-ball" ref={ballRef} />

            <div className="demo-steps">
              {demoSteps.map((s, i) => (
                <div
                  key={i}
                  className="demo-step"
                  ref={(el) => (stepRefs.current[i] = el)}
                >
                  <div className="demo-dot">{i + 1}</div>
                  <div className="demo-text">
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                  <div className="demo-video">
                    <video
                      src={s.video}
                      controls
                      muted
                      preload="metadata"
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "inherit",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <div className="demo-dur">{s.tag}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHO IS THIS FOR */}
      <section className="fo-section fo-section-alt">
        <div className="container">
          <div className="fo-eyebrow">Built for</div>
          <h2 className="fo-title">
            Who PGMate is for{" "}
            <span className="fo-rotating-word-wrapper">
              <span className="fo-rotating-word" key={rotatingIndex}>
                {audiences[rotatingIndex].title}
              </span>
            </span>
          </h2>

          <div className="row g-4 mt-2">
            {audiences.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className="col-12 col-md-4">
                  <div className="fo-audience-card">
                    <div className="fo-audience-icon">
                      <Icon size={24} strokeWidth={1.8} />
                    </div>
                    <h3>{a.title}</h3>
                    <p>{a.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMPARE */}
      <section className="fo-section">
        <div className="container">
          {/* BANNER HEADER */}
          <div className="fo-cv2-banner">
            {/* LEFT — clipboard + books */}
            <div className="fo-cv2-banner-left">
              <svg
                width="240"
                height="160"
                viewBox="0 0 160 110"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="10"
                  y="72"
                  width="72"
                  height="14"
                  rx="3"
                  fill="#4a47a3"
                />
                <rect
                  x="6"
                  y="58"
                  width="76"
                  height="16"
                  rx="3"
                  fill="#6c63d6"
                />
                <rect
                  x="12"
                  y="46"
                  width="68"
                  height="14"
                  rx="3"
                  fill="#9b97e0"
                />
                <line
                  x1="22"
                  y1="46"
                  x2="22"
                  y2="60"
                  stroke="#fff"
                  strokeWidth="1"
                  strokeOpacity="0.3"
                />
                <line
                  x1="38"
                  y1="58"
                  x2="38"
                  y2="74"
                  stroke="#fff"
                  strokeWidth="1"
                  strokeOpacity="0.3"
                />
                <rect
                  x="74"
                  y="38"
                  width="6"
                  height="42"
                  rx="2"
                  fill="#f5a623"
                  transform="rotate(-15 74 38)"
                />
                <polygon
                  points="74,76 80,76 77,86"
                  fill="#ffd580"
                  transform="rotate(-15 74 38)"
                />
                <rect
                  x="74"
                  y="38"
                  width="6"
                  height="6"
                  rx="1"
                  fill="#e8e8e8"
                  transform="rotate(-15 74 38)"
                />
                <rect
                  x="44"
                  y="8"
                  width="68"
                  height="78"
                  rx="6"
                  fill="#f7f8fc"
                  stroke="#d1cee1"
                  strokeWidth="1.5"
                />
                <rect
                  x="62"
                  y="4"
                  width="32"
                  height="10"
                  rx="5"
                  fill="#6c63d6"
                />
                <rect
                  x="54"
                  y="26"
                  width="48"
                  height="3"
                  rx="1.5"
                  fill="#d1cee1"
                />
                <rect
                  x="54"
                  y="34"
                  width="40"
                  height="3"
                  rx="1.5"
                  fill="#d1cee1"
                />
                <rect
                  x="54"
                  y="42"
                  width="44"
                  height="3"
                  rx="1.5"
                  fill="#d1cee1"
                />
                <rect
                  x="54"
                  y="50"
                  width="36"
                  height="3"
                  rx="1.5"
                  fill="#d1cee1"
                />
                <rect
                  x="54"
                  y="58"
                  width="42"
                  height="3"
                  rx="1.5"
                  fill="#d1cee1"
                />
                <circle cx="52" cy="27.5" r="5" fill="#27ae60" />
                <polyline
                  points="49.5,27.5 51.5,29.5 54.5,25"
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="52" cy="35.5" r="5" fill="#27ae60" />
                <polyline
                  points="49.5,35.5 51.5,37.5 54.5,33"
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="52" cy="43.5" r="5" fill="#e74c3c" />
                <line
                  x1="50"
                  y1="41.5"
                  x2="54"
                  y2="45.5"
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line
                  x1="54"
                  y1="41.5"
                  x2="50"
                  y2="45.5"
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="22" cy="88" r="10" fill="#e74c3c" />
                <line
                  x1="19"
                  y1="85"
                  x2="25"
                  y2="91"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="25"
                  y1="85"
                  x2="19"
                  y2="91"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* CENTER */}
            <div className="fo-cv2-banner-center">
              <h2 className="fo-cv2-banner-title">Registers vs. PGMate</h2>
              <p className="fo-cv2-banner-sub">
                See how PGMate makes PG management smarter, faster &amp;
                hassle-free
              </p>
            </div>

            {/* RIGHT — laptop + phone */}
            <div className="fo-cv2-banner-right">
              <svg
                width="280"
                height="160"
                viewBox="0 0 170 110"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <text x="128" y="16" fontSize="13" fill="#f5a623">
                  ✦
                </text>
                <text x="148" y="30" fontSize="7" fill="#f5a623">
                  ✦
                </text>
                <rect
                  x="4"
                  y="16"
                  width="118"
                  height="76"
                  rx="6"
                  fill="#3d3a8c"
                />
                <rect
                  x="8"
                  y="20"
                  width="110"
                  height="66"
                  rx="4"
                  fill="#2b2870"
                />
                <rect
                  x="11"
                  y="23"
                  width="104"
                  height="60"
                  rx="3"
                  fill="#f7f8fc"
                />
                <rect
                  x="0"
                  y="92"
                  width="130"
                  height="8"
                  rx="3"
                  fill="#4a47a3"
                />
                <rect
                  x="46"
                  y="92"
                  width="38"
                  height="3"
                  rx="1.5"
                  fill="#3d3a8c"
                />
                <rect
                  x="11"
                  y="23"
                  width="104"
                  height="10"
                  rx="3"
                  fill="#5b52d6"
                />
                <rect
                  x="15"
                  y="26"
                  width="28"
                  height="3.5"
                  rx="1.5"
                  fill="#fff"
                  fillOpacity="0.6"
                />
                <rect
                  x="98"
                  y="26"
                  width="14"
                  height="3.5"
                  rx="1.5"
                  fill="#fff"
                  fillOpacity="0.35"
                />
                <rect x="11" y="33" width="20" height="50" fill="#efedfd" />
                <rect
                  x="14"
                  y="37"
                  width="14"
                  height="2.5"
                  rx="1"
                  fill="#9b97e0"
                />
                <rect
                  x="14"
                  y="43"
                  width="14"
                  height="2.5"
                  rx="1"
                  fill="#c5c3ee"
                />
                <rect
                  x="14"
                  y="49"
                  width="14"
                  height="2.5"
                  rx="1"
                  fill="#c5c3ee"
                />
                <rect
                  x="14"
                  y="55"
                  width="14"
                  height="2.5"
                  rx="1"
                  fill="#c5c3ee"
                />
                <rect
                  x="14"
                  y="61"
                  width="14"
                  height="2.5"
                  rx="1"
                  fill="#c5c3ee"
                />
                <rect
                  x="14"
                  y="67"
                  width="14"
                  height="2.5"
                  rx="1"
                  fill="#c5c3ee"
                />
                <rect
                  x="14"
                  y="73"
                  width="14"
                  height="2.5"
                  rx="1"
                  fill="#c5c3ee"
                />
                <rect
                  x="34"
                  y="35"
                  width="36"
                  height="14"
                  rx="2.5"
                  fill="#fff"
                  stroke="#e3e6f0"
                  strokeWidth="0.5"
                />
                <rect
                  x="37"
                  y="38"
                  width="14"
                  height="2"
                  rx="1"
                  fill="#c5c3ee"
                />
                <rect
                  x="37"
                  y="42"
                  width="10"
                  height="4"
                  rx="1"
                  fill="#5b52d6"
                />
                <rect
                  x="74"
                  y="35"
                  width="36"
                  height="14"
                  rx="2.5"
                  fill="#fff"
                  stroke="#e3e6f0"
                  strokeWidth="0.5"
                />
                <rect
                  x="77"
                  y="38"
                  width="14"
                  height="2"
                  rx="1"
                  fill="#c5c3ee"
                />
                <rect
                  x="77"
                  y="42"
                  width="10"
                  height="4"
                  rx="1"
                  fill="#27ae60"
                />
                <rect
                  x="34"
                  y="53"
                  width="76"
                  height="28"
                  rx="2.5"
                  fill="#fff"
                  stroke="#e3e6f0"
                  strokeWidth="0.5"
                />
                <rect
                  x="37"
                  y="56"
                  width="18"
                  height="2"
                  rx="1"
                  fill="#c5c3ee"
                />
                <rect
                  x="40"
                  y="62"
                  width="4"
                  height="14"
                  rx="1"
                  fill="#c5c3ee"
                />
                <rect
                  x="47"
                  y="58"
                  width="4"
                  height="18"
                  rx="1"
                  fill="#9b97e0"
                />
                <rect
                  x="54"
                  y="60"
                  width="4"
                  height="16"
                  rx="1"
                  fill="#c5c3ee"
                />
                <rect
                  x="61"
                  y="55"
                  width="4"
                  height="21"
                  rx="1"
                  fill="#5b52d6"
                />
                <rect
                  x="68"
                  y="57"
                  width="4"
                  height="19"
                  rx="1"
                  fill="#9b97e0"
                />
                <rect
                  x="75"
                  y="63"
                  width="4"
                  height="13"
                  rx="1"
                  fill="#c5c3ee"
                />
                <rect
                  x="82"
                  y="59"
                  width="4"
                  height="17"
                  rx="1"
                  fill="#5b52d6"
                />
                <rect
                  x="89"
                  y="56"
                  width="4"
                  height="20"
                  rx="1"
                  fill="#9b97e0"
                />
                <rect
                  x="94"
                  y="55"
                  width="13"
                  height="6"
                  rx="2"
                  fill="#e6f9f0"
                />
                <text
                  x="96"
                  y="60"
                  fontSize="3.8"
                  fill="#27ae60"
                  fontWeight="700"
                >
                  ▲ 12%
                </text>
                <rect
                  x="114"
                  y="34"
                  width="46"
                  height="72"
                  rx="8"
                  fill="#3d3a8c"
                />
                <rect
                  x="117"
                  y="38"
                  width="40"
                  height="62"
                  rx="5"
                  fill="#f7f8fc"
                />
                <rect
                  x="130"
                  y="35"
                  width="16"
                  height="4"
                  rx="2"
                  fill="#2b2870"
                />
                <rect
                  x="117"
                  y="38"
                  width="40"
                  height="9"
                  rx="5"
                  fill="#5b52d6"
                />
                <rect
                  x="120"
                  y="41"
                  width="16"
                  height="2.5"
                  rx="1"
                  fill="#fff"
                  fillOpacity="0.7"
                />
                <rect
                  x="120"
                  y="51"
                  width="10"
                  height="10"
                  rx="2.5"
                  fill="#efedfd"
                />
                <rect
                  x="133"
                  y="51"
                  width="10"
                  height="10"
                  rx="2.5"
                  fill="#fde8e8"
                />
                <rect
                  x="146"
                  y="51"
                  width="8"
                  height="10"
                  rx="2.5"
                  fill="#e6f9f0"
                />
                <rect
                  x="120"
                  y="65"
                  width="30"
                  height="2.5"
                  rx="1"
                  fill="#e3e6f0"
                />
                <rect
                  x="120"
                  y="70"
                  width="24"
                  height="2.5"
                  rx="1"
                  fill="#e3e6f0"
                />
                <rect
                  x="120"
                  y="75"
                  width="27"
                  height="2.5"
                  rx="1"
                  fill="#e3e6f0"
                />
                <rect
                  x="120"
                  y="82"
                  width="32"
                  height="9"
                  rx="3"
                  fill="#5b52d6"
                />
                <text
                  x="123"
                  y="89"
                  fontSize="4.5"
                  fill="#fff"
                  fontWeight="700"
                >
                  PGMate
                </text>
                <rect
                  x="131"
                  y="98"
                  width="16"
                  height="2"
                  rx="1"
                  fill="#c5c3ee"
                />
              </svg>
            </div>
          </div>

          <div className="fo-cv2-wrap">
            {/* HEADER PILLS */}
            <div className="fo-cv2-head">
              <div className="fo-cv2-cell-feat-head">Feature</div>
              <div className="fo-cv2-cell-old-head">
                <span className="fo-cv2-head-icon fo-cv2-head-icon-red">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </span>
                Traditional way
              </div>
              <div className="fo-cv2-cell-pg-head">
                <span className="fo-cv2-head-icon fo-cv2-head-icon-green">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                PGMate
              </div>
            </div>

            {/* ROWS */}
            <div className="fo-cv2-rows-wrap">
              {compareRows.map((r, i) => (
                <div key={i} className="fo-cv2-row">
                  <div className="fo-cv2-cell-feat">
                    <span className="fo-cv2-row-icon">{compareIcons[i]}</span>
                    <span className="fo-cv2-row-label">{r.feature}</span>
                  </div>
                  <div className="fo-cv2-cell-old">
                    <span className="fo-cv2-dot fo-cv2-dot-red">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </span>
                    {r.old}
                  </div>
                  <div className="fo-cv2-cell-pg">
                    <span className="fo-cv2-dot fo-cv2-dot-green">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    {r.pg}
                  </div>
                </div>
              ))}
            </div>

            {/* FOOTER */}
            <div className="fo-cv2-footer">
              <div className="fo-cv2-footer-old">
                <span className="fo-cv2-dot fo-cv2-dot-red fo-cv2-dot-lg">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </span>
                <div>
                  <strong>Traditional way</strong>
                  <p>Time-consuming, error-prone &amp; hard to manage</p>
                </div>
              </div>
              <div className="fo-cv2-footer-vs">VS</div>
              <div className="fo-cv2-footer-pg">
                <span className="fo-cv2-dot fo-cv2-dot-green fo-cv2-dot-lg">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <div>
                  <strong>PGMate</strong>
                  <p>Smart, automated &amp; built for modern PG owners</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="fo-cta-band">
        <div className="container">
          <div className="fo-cta-left">
            <div className="fo-cta-icon-wrap">
              <CalendarCheck size={22} strokeWidth={1.6} />
            </div>
            <div>
              <h2>Ready to simplify your PG management?</h2>
              <p>
                Book a free demo — we'll walk you through the owner dashboard
                live. No commitment needed.
              </p>
            </div>
          </div>
          <div className="fo-cta-btns">
            <button
              className="btn-outline-grad btn-outline-on-dark"
              onClick={() => navigate("/list-your-property")}
            >
              List your PG →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ForOwnersPage;
