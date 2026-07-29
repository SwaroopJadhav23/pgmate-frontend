import {useState, useEffect} from "react";
import Swal from "sweetalert2";
import {
  Building2,
  Users2,
  MapPinned,
  Star,
  TrendingUp,
  Wifi,
  FileSpreadsheet,
  Filter,
  Users,
  BellRing,
  ShieldCheck,
  Receipt,
  ClipboardList,
  Wrench,
  FileSignature,
  LayoutDashboard,
  BarChart3,
  PlayCircle,
  ArrowRight,
  MessageCircle,
  Mail,
  MessageSquare,
  Smartphone,
  Home,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import {
  FaWhatsapp,
  FaFileExcel,
  FaEnvelope,
  FaSms,
  FaCloud,
  FaGoogleDrive,
} from "react-icons/fa";
import api from "../../../api/axios";
import {digitsOnly, isValidPhone} from "../../../utils/formValidators";
import "./ListYourProperty.css";
import PublicLayout from "../../../layouts/HomeLayouts";
import OwnerTestimonials from "./OwnerTextumals";
import PricingPlans from "../../../components/PricingPlans";
import ApkDownloadModal from "../../../components/ApkModal";
import fourStepsImage from "../../../assets/4_Simple_PG_Steps.png";
import listPgHeroImg from "../../../assets/list_pg_hero.png";
import {Link, useNavigate} from "react-router-dom";

/* ---------------- DATA ---------------- */

/* Fallback values shown until /public/stats resolves (or if it fails) */
const FALLBACK_STATS = {
  pgCount: 400,
  tenantCount: 50000,
  cityCount: 10,
  ownerCount: 500,
  rentCollected: 500000000, // 50 Cr
};

/* Owner rating is curated, not live-computed — always static. */
const STATIC_OWNER_RATING = "4.8/5";

const formatCount = (n) => {
  if (n >= 100000) return `${(n / 100000).toFixed(1).replace(/\.0$/, "")}L+`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
  return `${n}+`;
};

const formatRent = (n) => {
  if (n >= 10000000)
    return `₹${(n / 10000000).toFixed(1).replace(/\.0$/, "")}Cr+`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1).replace(/\.0$/, "")}L+`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
  return `₹${n}`;
};

const loveReasons = [
  {
    icon: TrendingUp,
    title: "Real-time Updates",
    desc: "Instant updates on app & WhatsApp",
  },
  {
    icon: FileSpreadsheet,
    title: "Excel Reports",
    desc: "Dues, income, expense & tenant reports",
  },
  {
    icon: Filter,
    title: "Smart Filters",
    desc: "Category & month filters for dues",
  },
  {icon: Users, title: "All Tenant Details", desc: "Full history in one place"},
  {
    icon: BellRing,
    title: "Automated Reminders",
    desc: "WhatsApp & SMS reminders for dues",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Reliable",
    desc: "Cloud backup, data security 24/7",
  },
];

const powerFeatures = [
  {
    icon: FileSpreadsheet,
    title: "Excel Reports",
    mock: "excel",
    desc: "Download detailed reports for Dues, Income, Expense, Lead, Tenant & Profit-Loss.",
  },
  {
    icon: Filter,
    title: "Smart Filters",
    mock: "filters",
    desc: "Apply Category & Month filters on dues, collection & expenses for accurate insights.",
  },
  {
    icon: Users,
    title: "All Tenant Details",
    mock: "tenant",
    desc: "Access all tenant information, documents, payment history & agreements in one place.",
  },
  {
    icon: Receipt,
    title: "Rent Collection Tracking",
    mock: "rent",
    desc: "Track paid, pending, overdue & upcoming rents with clear status & reminders.",
  },
  {
    icon: ClipboardList,
    title: "Lead & Booking Management",
    mock: "leads",
    desc: "Capture leads, schedule visits, track follow-ups & convert leads into tenants.",
  },
  {
    icon: Building2,
    title: "Multi-PG Management",
    mock: "multi",
    desc: "Manage multiple PGs, branches & properties from a single dashboard.",
  },
  {
    icon: BarChart3,
    title: "Business Analytics",
    mock: "analytics",
    desc: "Monitor occupancy, income, expenses, profit & lead conversion with charts.",
  },
  {
    icon: FileSignature,
    title: "Digital Agreements",
    mock: "agreement",
    desc: "Create, upload & manage rental agreements and important documents digitally.",
  },
  {
    icon: Wrench,
    title: "Maintenance Management",
    mock: "maintenance",
    desc: "Track maintenance requests, assign staff & monitor resolution status.",
  },
  {
    icon: BellRing,
    title: "Automated Reminders",
    mock: "reminders",
    desc: "Send rent due reminders, payment confirmations & important notices automatically.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Reliable",
    mock: "secure",
    desc: "Your data is encrypted, securely stored & accessible anytime from any device.",
  },
  {
    icon: Smartphone,
    title: "Mobile App Access",
    mock: "mobile",
    desc: "Manage your PG business on the go with our Android & iOS mobile app.",
  },
];

const integrations = [
  {icon: FaWhatsapp, label: "WhatsApp", color: "#25D366"},
  {icon: FaFileExcel, label: "Excel", color: "#217346"},
  {icon: FaEnvelope, label: "Email", color: "#4f46e5"},
  {icon: FaSms, label: "SMS", color: "#0891b2"},
  {icon: FaCloud, label: "Cloud Backup", color: "#6b7280"},
  {icon: FaGoogleDrive, label: "Google Drive", color: "#34a853"},
];

// eslint-disable-next-line
const trustBadges = [
  "Verified Owners",
  "Secure Payments",
  "24/7 Support",
  "Pan-India Network",
];

const partnerLogos = [
  "NestPG",
  "UrbanStay",
  "CoLiving+",
  "SpaceHub",
  "StayEase",
  "RoomKart",
  "LivWell",
  "AbodePG",
];

const useToast = () => {
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({type, message});
    setTimeout(() => setToast(null), 4000);
  };

  return {toast, showToast};
};

const Toast = ({toast}) => {
  if (!toast) return null;

  const icons = {
    success: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="10" fill="#10b981" />
        <path
          d="M6 10l3 3 5-5"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    loading: (
      <svg width="20" height="20" viewBox="0 0 20 20" className="toast-spinner">
        <circle
          cx="10"
          cy="10"
          r="8"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        <path
          d="M10 2a8 8 0 0 1 8 8"
          stroke="#4f46e5"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  };

  return (
    <div className={`toast-wrapper toast-${toast.type}`}>
      <div className="toast-icon">{icons[toast.type]}</div>
      <span className="toast-message">{toast.message}</span>
    </div>
  );
};

/* Reusable brand-colored dashboard + phone illustration (laptop mock) */
const DashboardIllustration = ({width = 220, height = 140}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 170 110"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="4" y="16" width="118" height="76" rx="6" fill="#3d3a8c" />
    <rect x="8" y="20" width="110" height="66" rx="4" fill="#2b2870" />
    <rect x="11" y="23" width="104" height="60" rx="3" fill="#f7f8fc" />
    <rect x="0" y="92" width="130" height="8" rx="3" fill="#4a47a3" />
    <rect x="46" y="92" width="38" height="3" rx="1.5" fill="#3d3a8c" />
    <rect x="11" y="23" width="104" height="10" rx="3" fill="#5b52d6" />
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
    <rect x="14" y="37" width="14" height="2.5" rx="1" fill="#9b97e0" />
    <rect x="14" y="43" width="14" height="2.5" rx="1" fill="#c5c3ee" />
    <rect x="14" y="49" width="14" height="2.5" rx="1" fill="#c5c3ee" />
    <rect x="14" y="55" width="14" height="2.5" rx="1" fill="#c5c3ee" />
    <rect x="14" y="61" width="14" height="2.5" rx="1" fill="#c5c3ee" />
    <rect x="14" y="67" width="14" height="2.5" rx="1" fill="#c5c3ee" />
    <rect x="14" y="73" width="14" height="2.5" rx="1" fill="#c5c3ee" />
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
    <rect x="37" y="38" width="14" height="2" rx="1" fill="#c5c3ee" />
    <rect x="37" y="42" width="10" height="4" rx="1" fill="#5b52d6" />
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
    <rect x="77" y="38" width="14" height="2" rx="1" fill="#c5c3ee" />
    <rect x="77" y="42" width="10" height="4" rx="1" fill="#27ae60" />
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
    <rect x="37" y="56" width="18" height="2" rx="1" fill="#c5c3ee" />
    <rect x="40" y="62" width="4" height="14" rx="1" fill="#c5c3ee" />
    <rect x="47" y="58" width="4" height="18" rx="1" fill="#9b97e0" />
    <rect x="54" y="60" width="4" height="16" rx="1" fill="#c5c3ee" />
    <rect x="61" y="55" width="4" height="21" rx="1" fill="#5b52d6" />
    <rect x="68" y="57" width="4" height="19" rx="1" fill="#9b97e0" />
    <rect x="75" y="63" width="4" height="13" rx="1" fill="#c5c3ee" />
    <rect x="82" y="59" width="4" height="17" rx="1" fill="#5b52d6" />
    <rect x="89" y="56" width="4" height="20" rx="1" fill="#9b97e0" />
    <rect x="94" y="55" width="13" height="6" rx="2" fill="#e6f9f0" />
    <text x="96" y="60" fontSize="3.8" fill="#27ae60" fontWeight="700">
      ▲ 12%
    </text>
    <rect x="114" y="34" width="46" height="72" rx="8" fill="#3d3a8c" />
    <rect x="117" y="38" width="40" height="62" rx="5" fill="#f7f8fc" />
    <rect x="130" y="35" width="16" height="4" rx="2" fill="#2b2870" />
    <rect x="117" y="38" width="40" height="9" rx="5" fill="#5b52d6" />
    <rect
      x="120"
      y="41"
      width="16"
      height="2.5"
      rx="1"
      fill="#fff"
      fillOpacity="0.7"
    />
    <rect x="120" y="51" width="10" height="10" rx="2.5" fill="#efedfd" />
    <rect x="133" y="51" width="10" height="10" rx="2.5" fill="#fde8e8" />
    <rect x="146" y="51" width="8" height="10" rx="2.5" fill="#e6f9f0" />
    <rect x="120" y="65" width="30" height="2.5" rx="1" fill="#e3e6f0" />
    <rect x="120" y="70" width="24" height="2.5" rx="1" fill="#e3e6f0" />
    <rect x="120" y="75" width="27" height="2.5" rx="1" fill="#e3e6f0" />
    <rect x="120" y="82" width="32" height="9" rx="3" fill="#5b52d6" />
    <text x="123" y="89" fontSize="4.5" fill="#fff" fontWeight="700">
      PGMate
    </text>
    <rect x="131" y="98" width="16" height="2" rx="1" fill="#c5c3ee" />
  </svg>
);

/* Gradient trophy illustration for the growth band */
const TrophyIllustration = ({size = 70}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="trophyBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a78bfa" />
        <stop offset="100%" stopColor="#5b52d6" />
      </linearGradient>
      <linearGradient id="trophyBase" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#4f46e5" />
      </linearGradient>
    </defs>
    <ellipse cx="40" cy="72" rx="22" ry="4" fill="#4f46e5" opacity="0.12" />
    <path d="M22 16h36v18a18 18 0 0 1-36 0V16z" fill="url(#trophyBody)" />
    <path
      d="M22 20h-8a10 10 0 0 0 10 10"
      stroke="#7c3aed"
      strokeWidth="3.5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M58 20h8a10 10 0 0 1-10 10"
      stroke="#7c3aed"
      strokeWidth="3.5"
      strokeLinecap="round"
      fill="none"
    />
    <rect x="35" y="49" width="10" height="12" fill="url(#trophyBase)" />
    <rect
      x="26"
      y="61"
      width="28"
      height="7"
      rx="2.5"
      fill="url(#trophyBase)"
    />
    <rect x="30" y="68" width="20" height="5" rx="2" fill="#3d3a8c" />
    <path
      d="M40 21l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8L40 21z"
      fill="#fde68a"
    />
  </svg>
);

/* Small illustrative preview shown inside each feature card. All values below
   are sample/mock data for illustration only, not live figures. */
const FeatureMock = ({type}) => {
  switch (type) {
    case "excel":
      return (
        <div className="lyp-mock lyp-mock-excel">
          <FileSpreadsheet size={22} className="lyp-mock-excel-icon" />
          <div className="lyp-mock-bars">
            <span style={{height: "40%"}} />
            <span style={{height: "65%"}} />
            <span style={{height: "50%"}} />
            <span style={{height: "80%"}} />
          </div>
        </div>
      );
    case "filters":
      return (
        <div className="lyp-mock lyp-mock-filters">
          <div className="lyp-mock-row">
            <span>Category</span>
            <em>All</em>
          </div>
          <div className="lyp-mock-row">
            <span>Month</span>
            <em>This month</em>
          </div>
        </div>
      );
    case "tenant":
      return (
        <div className="lyp-mock lyp-mock-tenant">
          <div className="lyp-mock-tenant-head">
            <span className="lyp-mock-avatar" />
            <span className="lyp-mock-tenant-name">Tenant Profile</span>
            <em>Active</em>
          </div>
          <div className="lyp-mock-tenant-tabs">
            <span>Profile</span>
            <span>Docs</span>
            <span>Payments</span>
            <span>History</span>
          </div>
        </div>
      );
    case "rent":
      return (
        <div className="lyp-mock lyp-mock-rent">
          <div className="lyp-mock-rent-row">
            <i className="lyp-dot lyp-dot-green" />
            Paid
          </div>
          <div className="lyp-mock-rent-row">
            <i className="lyp-dot lyp-dot-amber" />
            Pending
          </div>
          <div className="lyp-mock-rent-row">
            <i className="lyp-dot lyp-dot-red" />
            Overdue
          </div>
          <div className="lyp-mock-rent-row">
            <i className="lyp-dot lyp-dot-blue" />
            Upcoming
          </div>
        </div>
      );
    case "leads":
      return (
        <div className="lyp-mock lyp-mock-leads">
          <div className="lyp-mock-row">
            <Clock3 size={13} />
            <span>New Lead</span>
          </div>
          <div className="lyp-mock-row">
            <Clock3 size={13} />
            <span>Follow Ups</span>
          </div>
          <div className="lyp-mock-row">
            <CheckCircle2 size={13} />
            <span>Converted</span>
          </div>
        </div>
      );
    case "multi":
      return (
        <div className="lyp-mock lyp-mock-multi">
          {Array.from({length: 5}).map((_, i) => (
            <Building2
              key={i}
              size={16}
              className={`lyp-multi-b lyp-multi-b-${i}`}
            />
          ))}
        </div>
      );
    case "analytics":
      return (
        <div className="lyp-mock lyp-mock-analytics">
          <div>
            <p className="lyp-mock-analytics-label">Occupancy Rate</p>
            <p className="lyp-mock-analytics-value">92%</p>
          </div>
          <svg viewBox="0 0 36 36" className="lyp-mock-donut">
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="4"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="#4f46e5"
              strokeWidth="4"
              strokeDasharray="70 100"
              strokeLinecap="round"
              transform="rotate(-90 18 18)"
            />
          </svg>
        </div>
      );
    case "agreement":
      return (
        <div className="lyp-mock lyp-mock-agreement">
          <div className="lyp-mock-agreement-row">
            <FileSignature size={14} />
            <span>Rental Agreement</span>
            <em>Signed</em>
          </div>
          <div className="lyp-mock-agreement-line" />
          <div className="lyp-mock-agreement-line short" />
        </div>
      );
    case "maintenance":
      return (
        <div className="lyp-mock lyp-mock-maint">
          <div className="lyp-mock-row">
            <Wrench size={13} />
            <span>New Request</span>
          </div>
          <div className="lyp-mock-row">
            <Clock3 size={13} />
            <span>In Progress</span>
          </div>
          <div className="lyp-mock-row">
            <CheckCircle2 size={13} />
            <span>Resolved</span>
          </div>
        </div>
      );
    case "reminders":
      return (
        <div className="lyp-mock lyp-mock-reminders">
          <span className="lyp-reminder-chip lyp-reminder-green">
            <MessageCircle size={14} />
          </span>
          <span className="lyp-reminder-line" />
          <span className="lyp-reminder-chip lyp-reminder-indigo">
            <Mail size={14} />
          </span>
          <span className="lyp-reminder-line" />
          <span className="lyp-reminder-chip lyp-reminder-blue">
            <MessageSquare size={14} />
          </span>
        </div>
      );
    case "secure":
      return (
        <div className="lyp-mock lyp-mock-secure">
          <ShieldCheck size={30} />
        </div>
      );
    case "mobile":
      return (
        <div className="lyp-mock lyp-mock-mobile">
          <span className="lyp-mock-phone" />
          <span className="lyp-mock-phone lyp-mock-phone-back" />
        </div>
      );
    default:
      return null;
  }
};

/* ── count-up hook ── */
const useCountUp = (target, duration = 1200) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setVal(target);
        clearInterval(timer);
      } else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
};

const ListYourProperty = () => {
  const [form, setForm] = useState({name: "", phone: "", pgName: ""});
  const [loading, setLoading] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);
  const {toast, showToast} = useToast();
  const navigate = useNavigate();

  const [siteStats, setSiteStats] = useState(FALLBACK_STATS);

  useEffect(() => {
    let cancelled = false;

    api
      .get("/public/stats")
      .then((res) => {
        if (cancelled || !res.data) return;
        setSiteStats({
          pgCount: res.data.pgCount ?? FALLBACK_STATS.pgCount,
          tenantCount: res.data.tenantCount ?? FALLBACK_STATS.tenantCount,
          cityCount: res.data.cityCount ?? FALLBACK_STATS.cityCount,
          ownerCount: res.data.ownerCount ?? FALLBACK_STATS.ownerCount,
          rentCollected: res.data.rentCollected ?? FALLBACK_STATS.rentCollected,
        });
      })
      .catch((err) => {
        console.error(
          "Failed to load site stats",
          err.response?.data || err.message,
        );
        // Keep fallback values already set in state
      });

    return () => {
      cancelled = true;
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

  const animPgCount = useCountUp(siteStats.pgCount);
  const animTenantCount = useCountUp(siteStats.tenantCount);
  const animCityCount = useCountUp(siteStats.cityCount);
  const animOwnerCount = useCountUp(siteStats.ownerCount);
  const animRentCollected = useCountUp(siteStats.rentCollected);

  const topStats = [
    {icon: Building2, value: formatCount(animPgCount), label: "PG Properties"},
    {icon: Users2, value: formatCount(animTenantCount), label: "Happy Tenants"},
    {
      icon: MapPinned,
      value: formatCount(animCityCount),
      label: "Cities Covered",
    },
    {icon: Star, value: STATIC_OWNER_RATING, label: "Owner Rating"},
  ];

  const growthStats = [
    {icon: Users2, value: formatCount(animOwnerCount), label: "Happy Owners"},
    {icon: Home, value: formatCount(animTenantCount), label: "Tenants Managed"},
    {icon: Building2, value: formatCount(animPgCount), label: "PG Properties"},
    {
      icon: TrendingUp,
      value: formatRent(animRentCollected),
      label: "Rent Collected",
    },
  ];

  const scrollToForm = () => {
    document
      .getElementById("lyp-get-started")
      ?.scrollIntoView({behavior: "smooth", block: "start"});
  };

  const scrollToFeatures = () => {
    document
      .getElementById("lyp-features")
      ?.scrollIntoView({behavior: "smooth", block: "start"});
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Name Required",
        text: "Please enter the owner name.",
      });
      return;
    }

    if (!isValidPhone(form.phone)) {
      await Swal.fire({
        icon: "warning",
        title: "Invalid Phone",
        text: "Please enter a valid 10-digit mobile number.",
      });
      return;
    }

    if (!form.pgName.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "PG Name Required",
        text: "Please enter the PG name.",
      });
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone,
      pgName: form.pgName.trim(),
    };

    try {
      setLoading(true);
      showToast("loading", "Submitting your enquiry...");

      await api.post("/public/owner-enquiry", payload);

      showToast(
        "success",
        "Enquiry submitted! We'll contact you within 24 hours.",
      );

      setForm({name: "", phone: "", pgName: ""});
    } catch (err) {
      console.error(err.response?.data || err.message);
      await Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: "We could not submit your enquiry. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="list-property-page">
        <Toast toast={toast} />
        <ApkDownloadModal show={showApkModal} setShow={setShowApkModal} />

        {/* ================= HERO — light layout, property photo card ================= */}
        <section className="lyp-hero" style={{position: "relative"}}>
          <div className="lyp-hero-absolute-image">
            <img src={listPgHeroImg} alt="List PG Hero" />
          </div>

          <div className="lyp-hero-float-cards">
            <div className="lyp-float-card lyp-float-occupancy">
              <span className="lyp-float-label">Occupancy Rate</span>
              <span className="lyp-float-value lyp-green">92%</span>
              <span className="lyp-float-sub lyp-green">+12% this month</span>
            </div>

            <div className="lyp-float-card lyp-float-collection">
              <span className="lyp-float-label">Monthly Collection</span>
              <span className="lyp-float-value lyp-blue">
                ₹ 12,45,000{" "}
                <TrendingUp
                  size={20}
                  strokeWidth={3}
                  style={{marginLeft: "8px"}}
                />
              </span>
              <span className="lyp-float-sub lyp-light-blue">
                +10% this month
              </span>
            </div>
          </div>

          <div className="container lyp-hero-grid">
            <div className="lyp-hero-copy">
              <h1>
                List Your PG <br />
                with <span>PGMate</span>
              </h1>
              <p>
                Partner with us to maximize occupancy and simplify PG &amp;
                co-living management across India.
              </p>

              <div className="lyp-hero-cta">
                <button className="lyp-btn-primary" onClick={scrollToForm}>
                  List Your PG Now
                </button>
                <button className="lyp-btn-outline" onClick={scrollToFeatures}>
                  Explore Features <ArrowRight size={16} />
                </button>
              </div>

              <div className="lyp-hero-trust">
                <div className="lyp-avatar-stack">
                  {["R", "A", "N"].map((letter) => (
                    <span key={letter} className="lyp-avatar">
                      {letter}
                    </span>
                  ))}
                </div>
                <div>
                  <p className="lyp-trust-count">400+ Owners trust PGMate</p>
                  <div className="lyp-stars">
                    {Array.from({length: 5}).map((_, i) => (
                      <Star key={i} size={13} fill="#fbbf24" stroke="#fbbf24" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Empty right column for grid layout */}
            <div></div>
          </div>
        </section>

        {/* ================= STATS BAR — inline icon + text row ================= */}
        <section className="lyp-statsbar-wrap">
          <div className="container">
            <div className="lyp-statsbar">
              {topStats.map(({icon: Icon, value, label}, i) => (
                <div className="lyp-stat-item" key={label}>
                  {i !== 0 && <span className="lyp-stat-divider" />}
                  <Icon size={20} className="lyp-stat-icon" />
                  <div>
                    <p className="lyp-stat-value">{value}</p>
                    <p className="lyp-stat-label">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= HOW IT WORKS + FORM ================= */}
        <section className="hiw-section" id="lyp-get-started">
          <div className="container">
            <div className="hiw-header hiw-custom-header">
              <h2 className="hiw-main-heading">
                Start Managing Your PG <br />
                in <span className="hiw-gradient-text">4 Simple Steps</span>
              </h2>
              <p className="hiw-sub-desc">
                Register your property, complete onboarding, and streamline
                bookings, rent collection, tenant management, and daily
                operations with PGMate.
              </p>
            </div>

            <div className="hiw-grid">
              <div className="hiw-image-col">
                <img
                  src={fourStepsImage}
                  alt="List Your PG in 4 Simple Steps"
                  className="hiw-side-image"
                />
              </div>

              <div className="hiw-col hiw-form-col">
                <div className="form-card">
                  <div className="form-card-header">
                    <h4>Get Started</h4>
                    <p>
                      Fill in your details and we'll reach out within 24 hrs
                    </p>
                  </div>

                  <form onSubmit={submit}>
                    <div className="form-field">
                      <label className="field-label">Owner name *</label>
                      <input
                        className="field-input"
                        placeholder="e.g. Rahul Sharma"
                        required
                        autoComplete="name"
                        value={form.name}
                        onChange={(e) =>
                          setForm({...form, name: e.target.value.trimStart()})
                        }
                      />
                    </div>

                    <div className="form-field">
                      <label className="field-label">Phone number *</label>
                      <input
                        className="field-input"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        pattern="[6-9][0-9]{9}"
                        placeholder="e.g. 9876543210"
                        required
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            phone: digitsOnly(e.target.value).slice(0, 10),
                          })
                        }
                      />
                    </div>

                    <div className="form-field">
                      <label className="field-label">PG Name *</label>
                      <input
                        className="field-input"
                        placeholder="e.g. Sunshine PG"
                        required
                        value={form.pgName}
                        onChange={(e) =>
                          setForm({...form, pgName: e.target.value.trimStart()})
                        }
                      />
                    </div>

                    <button className="submit-btn" disabled={loading}>
                      {loading ? "Submitting..." : "Book Demo"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= WHY OWNERS LOVE PGMATE ================= */}
        <section className="lyp-love">
          <div className="container">
            <h3 className="lyp-love-title">Why Owners Love PGMate?</h3>
            <div className="lyp-love-row">
              {loveReasons.map(({icon: Icon, title, desc}) => (
                <div className="lyp-love-item" key={title}>
                  <div className="lyp-love-icon">
                    <Icon size={18} />
                  </div>
                  <div className="lyp-love-text">
                    <h6>{title}</h6>
                    <p>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= PRICING ================= */}
        <div id="lyp-pricing">
          <PricingPlans />
        </div>

        {/* ================= FEATURES GRID ================= */}
        <section className="lyp-features" id="lyp-features">
          <div className="container">
            <div className="lyp-features-grid-header">
              <h3 className="lyp-features-title">
                Powerful Features to Simplify{" "}
                <span className="lyp-indigo">PG Management</span>
              </h3>
            </div>
            <p className="lyp-features-sub">
              Everything you need to run your PG business efficiently,
              transparently and profitably.
            </p>

            <div className="lyp-features-grid">
              {powerFeatures.map(({icon: Icon, title, desc, mock}) => (
                <div className="lyp-feature-card" key={title}>
                  <div className="lyp-feature-head">
                    <div className="lyp-feature-icon">
                      <Icon size={18} />
                    </div>
                    <h6>{title}</h6>
                  </div>
                  <p>{desc}</p>
                  <FeatureMock type={mock} />
                </div>
              ))}
            </div>

            <div className="lyp-growth-band">
              <div className="lyp-growth-copy">
                <TrophyIllustration size={70} />
                <div>
                  <h4>
                    Designed for PG Owners, Built{" "}
                    <span className="lyp-indigo">for Growth</span>
                  </h4>
                  <p>
                    PGMate helps you save time, reduce manual work and grow your
                    PG business effortlessly.
                  </p>
                </div>
              </div>
              <div className="lyp-growth-stats">
                {growthStats.map(({icon: Icon, value, label}) => (
                  <div className="lyp-growth-stat" key={label}>
                    <Icon size={18} />
                    <p className="lyp-growth-value">{value}</p>
                    <p className="lyp-growth-label">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lyp-integrations">
              <span className="lyp-integrations-title">
                Works Seamlessly With
              </span>
              <div className="lyp-integrations-row">
                {integrations.map(({icon: Icon, label, color}, i) => (
                  <span className="lyp-integration-item" key={label}>
                    <Icon size={16} style={{color}} /> {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= DASHBOARD PROMO ================= */}
        <section className="lyp-dash-promo">
          <div className="container lyp-dash-promo-band">
            <div className="lyp-dash-promo-copy">
              <span className="lyp-eyebrow">
                All Your PG Data, At Your Fingertips
              </span>
              <h3>Powerful Dashboard for Smart Decisions</h3>
              <ul className="lyp-dash-list">
                <li>
                  <LayoutDashboard size={16} /> Overview of income, expenses
                  &amp; occupancy
                </li>
                <li>
                  <Wifi size={16} /> Real-time collection &amp; dues tracking
                </li>
                <li>
                  <BarChart3 size={16} /> Beautiful charts &amp;
                  easy-to-understand reports
                </li>
                <li>
                  <Users2 size={16} /> Access anytime on web &amp; mobile
                </li>
              </ul>
              <button
                className="lyp-btn-primary"
                onClick={() => navigate("/for-owners#demo-videos")}
              >
                <PlayCircle size={16} /> View Live Demo
              </button>
            </div>

            <div className="lyp-dash-promo-visual">
              <DashboardIllustration width={300} height={190} />
            </div>

            <div className="lyp-dash-promo-trust">
              <span className="lyp-trust-row-title">
                Trusted by <span className="lyp-indigo">500+</span> PG Owners
                Across India
              </span>
              <div className="lyp-partner-grid">
                {partnerLogos.map((name) => (
                  <span className="lyp-partner-logo" key={name}>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= TESTIMONIALS ================= */}
        <OwnerTestimonials />
      </div>
    </PublicLayout>
  );
};

export default ListYourProperty;
