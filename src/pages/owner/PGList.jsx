import {FaHome, FaCamera, FaVideo} from "react-icons/fa";
import {useEffect, useState, useCallback, useRef} from "react";
import {useNavigate} from "react-router-dom";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import "../../CSS/EditPGForm.css";
import "../../CSS/pgList.css";
import FloorManagerContent from "../manager/FloorManagerContent";
import NextStepBanner from "../../components/NextStepBanner";
import {useLocation} from "react-router-dom";
import RulesClausesTable, {DEFAULT_RULES} from "../../components/RulesClausesTable";
import "../../CSS/CreatePGForm.css";
import {PGListingSkeleton} from "../public/Skeleton";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import {
  Wifi,
  ParkingCircle,
  Car,
  Wind,
  ShowerHead,
  Shield,
  UtensilsCrossed,
  Bath,
  Droplets,
  Camera,
  Snowflake,
  Tv,
  WashingMachine,
  Dumbbell,
  BookOpen,
  Bike,
  Bus,
  Zap,
  Flame,
  Sofa,
  Tag,
  Coffee,
  Thermometer,
  Lock,
  Sun,
  Bed,
  Refrigerator,
  Power,
  Archive,
  Sparkles,
  ConciergeBell,
  Globe,
  CalendarCheck,
  Clock,
} from "lucide-react";

/* ===============================
   CONSTANTS
================================ */
const AMENITIES_LIST = [
  "Parking",
  "Wifi",
  "Refrigerator",
  "Almirah",
  "Bed Sheet",
  "CCTV",
  "House Keeping",
  "Pillow",
  "Drinking Water",
  "Reception",
  "Bathroom",
  "Wash",
  "AC",
  "Laundry",
  "Balcony",
  "Attached Bathroom",
  "Kitchen",
  "Security",
  "Gym",
  "Study Area",
  "Common Room",
  "Hot Water",
];
const HOUSE_RULES_LIST = [
  "Entry before 10:00 PM",
  "Government ID mandatory",
  "No Smoking",
  "No Alcohol Consumption",
  "No Loud Music After 9 PM",
  "Visitors Allowed (Day Time Only)",
  "No Overnight Guests",
  "Maintain Cleanliness",
  "Electricity Usage As Per Policy",
  "Damage Charges Applicable",
  "Security Deposit Mandatory",
  "Outside Food Allowed",
  "Management Rules Must Be Followed",
  "Respect Other Residents",
];
const CITY_OPTIONS = [
  "Hyderabad",
  "Bangalore",
  "Mumbai",
  "Delhi",
  "Noida",
  "Pune",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Indore",
  "Bhopal",
  "Lucknow",
  "Chandigarh",
  "Coimbatore",
  "Mysore",
  "Dehradun",
  "Kanpur",
  "Mangalore",
  "Other",
];

const getDisplayStatus = (status) =>
  status === "REAPPLIED" ? "PENDING" : status;
const getBannerMode = (stats) => {
  if (!stats || stats.totalPgs === 0) return null;
  if (stats.totalRooms === 0) return "room";
  if (stats.totalBeds === 0) return "bed";
  return null;
};

/* ================================================
   AMENITY ICONS — Lucide (matches PGListingCard)
================================================ */
const AMENITY_ICONS = {
  // WiFi
  Wifi: Wifi,
  "Wi-Fi": Wifi,
  WiFi: Wifi,
  // Parking
  Parking: ParkingCircle,
  "Car Parking": Car,
  "Bike Parking": Bike,
  // AC / Cooling
  AC: Snowflake,
  "Air Conditioning": Snowflake,
  // Bathroom
  Bathroom: Bath,
  Washroom: Bath,
  "Attached Bathroom": ShowerHead,
  "Attached Ba": ShowerHead,
  "Attached Bath": ShowerHead,
  // Kitchen
  Kitchen: UtensilsCrossed,
  Cooking: UtensilsCrossed,
  // Water
  "Drinking Water": Droplets,
  Water: Droplets,
  // Security
  Security: Shield,
  "Security Guard": Shield,
  CCTV: Camera,
  "Security Camera": Camera,
  // TV
  TV: Tv,
  Television: Tv,
  // Laundry
  "Washing Machine": WashingMachine,
  Laundry: WashingMachine,
  Wash: WashingMachine,
  // Gym
  Gym: Dumbbell,
  // Study
  "Study Room": BookOpen,
  // Transport
  "Bus Stop Nearby": Bus,
  // Power
  "Power Backup": Zap,
  Gas: Flame,
  // Common / Leisure
  "Common Area": Sofa,
  Balcony: Wind,
  Terrace: Sun,
  // Food & Drink
  Coffee: Coffee,
  // Hot water
  Geyser: Thermometer,
  "Hot Water": Thermometer,
  // Storage / Furnishing
  Locker: Lock,
  Almirah: Archive, // cupboard / wardrobe feel
  Furnished: Bed,
  "Bed Sheet": Bed,
  Pillow: Bed, // sleep category
  // Fridge
  Refrigerator: Refrigerator,
  Fridge: Refrigerator,
  // Staff / Services
  Reception: ConciergeBell,
  "House Keeping": Sparkles,
  Housekeeping: Sparkles,
  Cleaning: Sparkles,
  // Misc
  "Electric Backup": Power,
};

const AmenityIcon = ({name}) => {
  const Icon = AMENITY_ICONS[(name || "").trim()] || Tag;
  return (
    <Icon
      size={18}
      style={{color: "#4f46e5", flexShrink: 0, minWidth: 18, minHeight: 18}}
    />
  );
};

const PGList = ({role = "OWNER"}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [pgs, setPgs] = useState([]);
  const [bannerMode, setBannerMode] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editPg, setEditPg] = useState(null);
  const [showFloorManager, setShowFloorManager] = useState(false);
  const [selectedPgId, setSelectedPgId] = useState(null);
  const [indexes, setIndexes] = useState({});
  const [videoList, setVideoList] = useState([]);
  const editVideoInputRef = useRef(null);
  const [imageList, setImageList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedPg, setSelectedPg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [editLocalityOptions, setEditLocalityOptions] = useState([]);
  const [localitySearch, setLocalitySearch] = useState("");
  const [showLocalitySuggestions, setShowLocalitySuggestions] = useState(false);
  const localityInputRef = useRef(null);
  const [actionLoading, setActionLoading] = useState({});

  const [editForm, setEditForm] = useState({
    name: "",
    address: "",
    city: "",
    customCity: "",
    locality: "",
    genderType: "MALE",
    totalFloors: "",
    amenities: [],
    aboutDescription: "",
    houseRules: [],
    customHouseRules: [],
    customRuleInput: "",

    // Rules & Regulations Settings
    policeFormType: "WITH_RULES",
    rentDueDate: "",
    lateFeeAmount: "",
    curfewTime: "",
    noticePeriodDays: "",
    depositRefundDays: "",
    damageCharges: "",
    washingMachineCharges: "",
    foodFacility: "",
    visitorPolicy: "",
    overnightGuestAllowed: "",
    electricityUsage: "",
    breakfastTime: "",
    lunchTime: "",
    dinnerTime: "",
    firstTimeFine: "",
    repeatedFine: "",
    addictionFine: "",
    cleanlinessFine: "",
    acTempMin: "",
    acTempMax: "",
    otherCustomFine: "",
    rulesCustomNote: "",
  });
  const [editRulesClauses, setEditRulesClauses] = useState(
    DEFAULT_RULES.map((r) => ({...r}))
  );

  /* ===============================
     EFFECTS
  ================================ */
  const loadPGs = useCallback(async () => {
    try {
      setLoading(true);
      if (role === "PG_MANAGER") {
        const [pgRes, statsRes] = await Promise.all([
          api.get("/manager/pg/my"),
          api.get("/manager/pg/stats"),
        ]);
        const statsMap = Object.fromEntries(
          (statsRes.data || []).map((s) => [s.pgId, s]),
        );
        setPgs(
          pgRes.data.map((pg) => ({
            ...pg,
            totalRooms: statsMap[pg.id]?.totalRooms ?? null,
            totalBeds: statsMap[pg.id]?.totalBeds ?? null,
            occupiedBeds: statsMap[pg.id]?.occupiedBeds ?? null,
            availableBeds: statsMap[pg.id]?.availableBeds ?? null,
            occupancyPercent: statsMap[pg.id]?.occupancyPercent ?? null,
          })),
        );
      } else {
        const [pgRes, statsRes] = await Promise.all([
          api.get("/owner/pgs"),
          api.get("/owner/pgs/stats"),
        ]);
        const statsMap = Object.fromEntries(
          (statsRes.data || []).map((s) => [s.pgId, s]),
        );
        setPgs(
          pgRes.data.map((pg) => ({
            ...pg,
            totalRooms: statsMap[pg.id]?.totalRooms ?? null,
            totalBeds: statsMap[pg.id]?.totalBeds ?? null,
            occupiedBeds: statsMap[pg.id]?.occupiedBeds ?? null,
            availableBeds: statsMap[pg.id]?.availableBeds ?? null,
            occupancyPercent: statsMap[pg.id]?.occupancyPercent ?? null,
          })),
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [role]);

  const loadDashStats = useCallback(async () => {
    if (role === "PG_MANAGER") return;
    try {
      const res = await api.get("/owner/dashboard/stats");
      setBannerMode(getBannerMode(res.data));
    } catch (err) {
      console.error("Stats error", err);
    }
  }, [role]);

  useEffect(() => {
    loadPGs();
    loadDashStats();
  }, [loadPGs, loadDashStats]);

  useEffect(() => {
    document.body.style.overflow = showEdit ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showEdit]);

  useEffect(() => {
    if (role === "OWNER")
      api
        .get("/owner/subscription/summary")
        .then((res) => setSummary(res.data));
  }, [role]);

  useEffect(() => {
    if (location.state?.openCreate) {
      window.history.replaceState({}, document.title);
      navigate("/owner/pg/create");
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (!editForm.city || editForm.city === "Other") {
      setEditLocalityOptions([]);
      return;
    }
    api
      .get("/public/localities", {params: {city: editForm.city}})
      .then((res) => {
        const seen = new Map();
        (res.data || []).forEach((l) => {
          const k = l.trim().toLowerCase();
          if (!seen.has(k)) seen.set(k, l.trim());
        });
        setEditLocalityOptions([...seen.values()]);
      })
      .catch(() => setEditLocalityOptions([]));
  }, [editForm.city]);

  /* ===============================
     HELPERS
  ================================ */

  const toggleVisibility = async (pgId, current, pg) => {
    if (actionLoading[pgId]) return;
    if (!current && ["PENDING", "REAPPLIED"].includes(pg.approvalStatus)) {
      toast("Your PG is pending admin approval.", {icon: "ℹ️"});
      return;
    }
    if (!current && pg.approvalStatus === "REJECTED") {
      toast("Your PG has been rejected.", {icon: "ℹ️"});
      return;
    }
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to ${current ? "hide" : "make public"} this PG?`,
      icon: "question",
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;
    try {
      setActionLoading((p) => ({...p, [pgId]: true}));
      setPgs((p) =>
        p.map((x) => (x.id === pgId ? {...x, isPublic: !current} : x)),
      );
      if (role === "PG_MANAGER")
        await api.patch(
          `/manager/pg/visibility?pgId=${pgId}&isPublic=${!current}`,
        );
      else await api.put(`/owner/${pgId}/visibility?isPublic=${!current}`);
      toast.success(`PG is now ${!current ? "Public" : "Hidden"}`);
    } catch (err) {
      setPgs((p) =>
        p.map((x) => (x.id === pgId ? {...x, isPublic: current} : x)),
      );
      toast.error(
        err.response?.data?.message || "Failed to update visibility.",
      );
    } finally {
      setActionLoading((p) => ({...p, [pgId]: false}));
    }
  };

  const toggleDailyReservation = async (pgId, current, pg) => {
    if (actionLoading[pgId]) return;
    if (!current && ["PENDING", "REAPPLIED"].includes(pg.approvalStatus)) {
      toast("Cannot enable daily reservation yet.", {icon: "ℹ️"});
      return;
    }
    if (!current && pg.approvalStatus === "REJECTED") {
      toast("PG is rejected.", {icon: "ℹ️"});
      return;
    }
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to ${current ? "disable" : "enable"} daily reservation?`,
      icon: "question",
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;
    try {
      setActionLoading((p) => ({...p, [pgId]: true}));
      setPgs((p) =>
        p.map((x) =>
          x.id === pgId ? {...x, dailyReservationEnabled: !current} : x,
        ),
      );
      await api.put(`/owner/${pgId}/daily-reservation?enabled=${!current}`);
      toast.success(`Daily reservation ${!current ? "Enabled" : "Disabled"}`);
    } catch (err) {
      setPgs((p) =>
        p.map((x) =>
          x.id === pgId ? {...x, dailyReservationEnabled: current} : x,
        ),
      );
      toast.error(
        err.response?.data?.message || "Failed to update reservation status.",
      );
    } finally {
      setActionLoading((p) => ({...p, [pgId]: false}));
    }
  };

  const toggleReservation = async (pgId, current, pg) => {
    if (actionLoading[pgId]) return;
    if (!current && ["PENDING", "REAPPLIED"].includes(pg.approvalStatus)) {
      toast("Cannot enable reservation yet.", {icon: "ℹ️"});
      return;
    }
    if (!current && pg.approvalStatus === "REJECTED") {
      toast("PG is rejected.", {icon: "ℹ️"});
      return;
    }
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to ${current ? "disable" : "enable"} reservation?`,
      icon: "question",
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;
    try {
      setActionLoading((p) => ({...p, [pgId]: true}));
      setPgs((p) =>
        p.map((x) =>
          x.id === pgId ? {...x, reservationEnabled: !current} : x,
        ),
      );
      if (role === "PG_MANAGER")
        await api.patch(
          `/manager/pg/reservation?pgId=${pgId}&enabled=${!current}`,
        );
      else await api.put(`/owner/${pgId}/reservation?enabled=${!current}`);
      toast.success(`Reservation ${!current ? "Enabled" : "Disabled"}`);
    } catch (err) {
      setPgs((p) =>
        p.map((x) => (x.id === pgId ? {...x, reservationEnabled: current} : x)),
      );
      toast.error(
        err.response?.data?.message || "Failed to update reservation status.",
      );
    } finally {
      setActionLoading((p) => ({...p, [pgId]: false}));
    }
  };

  const plan = summary?.planType || "FREE";
  const isLimitReached =
    summary?.pgLimit >= 0 && summary?.pgUsed >= summary?.pgLimit;

  const nextImage = (pgId, total) =>
    setIndexes((p) => ({...p, [pgId]: ((p[pgId] || 0) + 1) % total}));
  const prevImage = (pgId, total) =>
    setIndexes((p) => ({...p, [pgId]: ((p[pgId] || 0) - 1 + total) % total}));

  const moveImage = (index, dir) => {
    const list = [...imageList];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    setImageList(list);
  };

  const removeImage = (index) =>
    setImageList((list) => list.filter((_, i) => i !== index));

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const showApprovalStatus = (pg) => {
    setSelectedPg(pg);
    setShowStatusModal(true);
  };

  const openEditModal = (pg) => {
    setEditPg(pg);
    const staticRules = (pg.houseRules || []).filter((r) =>
      HOUSE_RULES_LIST.includes(r),
    );
    const customRules = (pg.houseRules || []).filter(
      (r) => !HOUSE_RULES_LIST.includes(r),
    );
    const isPredefinedCity = CITY_OPTIONS.includes(pg.city);
    setEditForm({
      name: pg.name,
      address: pg.address,
      city: isPredefinedCity ? pg.city : "Other",
      customCity: isPredefinedCity ? "" : pg.city,
      locality: pg.locality,
      genderType: pg.genderType,
      totalFloors: pg.totalFloors,
      amenities: pg.amenities ?? [],
      aboutDescription: pg.aboutDescription ?? "",
      houseRules: staticRules,
      customHouseRules: customRules,
      customRuleInput: "",

      policeFormType: pg.policeFormType ?? "WITH_RULES",
      rentDueDate: pg.rentDueDate ?? "",
      lateFeeAmount: pg.lateFeeAmount ?? "",
      curfewTime: pg.curfewTime ?? "",
      noticePeriodDays: pg.noticePeriodDays ?? "",
      depositRefundDays: pg.depositRefundDays ?? "",
      damageCharges: pg.damageCharges ?? "",
      washingMachineCharges: pg.washingMachineCharges ?? "",
      foodFacility: pg.foodFacility ?? "",
      visitorPolicy: pg.visitorPolicy ?? "",
      overnightGuestAllowed: pg.overnightGuestAllowed ?? "",
      electricityUsage: pg.electricityUsage ?? "",
      breakfastTime: pg.breakfastTime ?? "",
      lunchTime: pg.lunchTime ?? "",
      dinnerTime: pg.dinnerTime ?? "",
      firstTimeFine: pg.firstTimeFine ?? "",
      repeatedFine: pg.repeatedFine ?? "",
      addictionFine: pg.addictionFine ?? "",
      cleanlinessFine: pg.cleanlinessFine ?? "",
      acTempMin: pg.acTempMin ?? "",
      acTempMax: pg.acTempMax ?? "",
      otherCustomFine: pg.otherCustomFine ?? "",
      rulesCustomNote: pg.rulesCustomNote ?? "",
    });
    try {
      const savedRules = pg.rulesClauses ? JSON.parse(pg.rulesClauses) : null;
      setEditRulesClauses(
        savedRules && savedRules.length
          ? savedRules
          : DEFAULT_RULES.map((r) => ({...r}))
      );
    } catch {
      setEditRulesClauses(DEFAULT_RULES.map((r) => ({...r})));
    }
    setLocalitySearch(pg.locality || "");

    setImageList(
      (pg.imageUrls || []).map((url) => ({type: "existing", src: url})),
    );
    setVideoList(
      (pg.videoUrls || []).map((url) => ({
        id: url,
        type: "existing",
        src: url,
      })),
    );
    setShowEdit(true);
  };

  const handleDelete = async (pg) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This PG will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it",
    });
    if (!result.isConfirmed) return;
    try {
      if (role === "PG_MANAGER") await api.delete(`/manager/pg/${pg.id}`);
      else await api.delete(`/owner/pg/${pg.id}`);
      toast.success("PG deleted successfully.");
      loadPGs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete PG.");
    }
  };

  const handleReapply = async (pg) => {
    const result = await Swal.fire({
      title: "Reapply for Approval?",
      text: "This will resubmit your PG for admin review.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Reapply",
    });
    if (!result.isConfirmed) return;
    try {
      setActionLoading((p) => ({...p, [pg.id]: true}));
      if (role === "PG_MANAGER") await api.post(`/manager/pg/${pg.id}/reapply`);
      else await api.post(`/owner/pg/${pg.id}/reapply`);
      toast.success("Your PG is under review again.");
      loadPGs();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to reapply for approval.",
      );
    } finally {
      setActionLoading((p) => ({...p, [pg.id]: false}));
    }
  };

  /* ===============================
     RENDER
  ================================ */
  return (
    <DashboardLayout
      title="My PGs"
      subtitle="All your properties"
      rightAction={
        <div className="pg-header-right">
          {role === "OWNER" && summary && (
            <div className="subscription-card">
              {!isMobile && (
                <div className="pg-desktop-info">
                  <div className="subscription-top">
                    <div className={`plan-badge plan-${plan.toLowerCase()}`}>
                      {plan}
                    </div>
                    {summary.expiryDate && (
                      <div className="expiry-chip">
                        {formatDate(summary.expiryDate)}
                      </div>
                    )}
                  </div>
                  <div className="subscription-bottom-info">
                    {summary.pgLimit < 0 && (
                      <div className="premium-text"> </div>
                    )}
                    {summary.pgLimit >= 0 && (
                      <div className="usage-text">
                        {summary.pgUsed} / {summary.pgLimit} PGs used
                      </div>
                    )}
                    {summary.planType !== "PREMIUM" && (
                      <button
                        className="upgrade-btn"
                        onClick={() => navigate("/owner/pricing")}
                      >
                        Upgrade Plan
                      </button>
                    )}
                  </div>
                </div>
              )}
              <button
                className={`add-pg-btn ${isLimitReached ? "disabled" : ""}`}
                disabled={isLimitReached}
                onClick={() => navigate("/owner/pg/create")}
              >
                + Add PG
              </button>
            </div>
          )}
        </div>
      }
    >
      {bannerMode && (
        <NextStepBanner
          mode={bannerMode}
          onDismiss={() => setBannerMode(null)}
        />
      )}

      <div className="row g-0">
        {loading ? (
          <PGListingSkeleton count={6} />
        ) : pgs.length > 0 ? (
          pgs.map((pg) => (
            <div key={pg.id} className="col-12 mb-4">
              <div className="pg-card-v2">
                {/* ── LEFT: Image Panel ── */}
                <div className="pgv2-image-panel">
                  <div
                    className={`pgv2-live-badge ${pg.isPublic ? "active" : "inactive"}`}
                  >
                    {pg.isPublic ? "Live" : "Hidden"}
                  </div>
                  {pg.approvalStatus === "APPROVED" && (
                    <div className="pgv2-verified-badge">
                      <i className="bi bi-patch-check-fill"></i> VERIFIED
                    </div>
                  )}
                  {pg.imageUrls?.length ? (
                    <>
                      <img
                        src={pg.imageUrls[indexes[pg.id] || 0]}
                        alt={pg.name}
                        className="pgv2-image"
                      />
                      {pg.imageUrls.length > 1 && (
                        <>
                          <button
                            className="pgv2-slide-btn left"
                            onClick={() =>
                              prevImage(pg.id, pg.imageUrls.length)
                            }
                          >
                            ‹
                          </button>
                          <button
                            className="pgv2-slide-btn right"
                            onClick={() =>
                              nextImage(pg.id, pg.imageUrls.length)
                            }
                          >
                            ›
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="pgv2-no-image">
                      <i
                        className="bi bi-building"
                        style={{fontSize: 40, color: "#cbd5e1"}}
                      ></i>
                      <span>No Image</span>
                    </div>
                  )}
                  <div className="pgv2-image-tags">
                    <span className="pgv2-tag">
                      {pg.genderType === "MALE"
                        ? "♂ Male"
                        : pg.genderType === "FEMALE"
                          ? "♀ Female"
                          : "⚥ Co-ed"}
                    </span>
                  </div>
                </div>

                {/* ── RIGHT: Details Panel ── */}
                <div className="pgv2-details-panel">
                  <div className="pgv2-header">
                    <div className="pgv2-title-block">
                      <div className="pgv2-title-row">
                        <h5 className="pgv2-title">{pg.name}</h5>
                        <div className="pgv2-header-actions">
                          <button
                            className="pgv2-icon-btn edit"
                            title="Edit"
                            onClick={() => openEditModal(pg)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="pgv2-icon-btn delete"
                            title="Delete"
                            onClick={() => handleDelete(pg)}
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </div>
                      </div>
                      <p className="pgv2-location">
                        <i className="bi bi-geo-alt"></i> {pg.city} •{" "}
                        {pg.locality}
                      </p>
                    </div>
                    <span
                      className={`pgv2-status-pill ${getDisplayStatus(pg.approvalStatus)}`}
                    >
                      {getDisplayStatus(pg.approvalStatus)}
                    </span>
                  </div>

                  <div className="pgv2-stats-row">
                    <div className="pgv2-stat">
                      <span className="pgv2-stat-label">TOTAL FLOORS</span>
                      <span className="pgv2-stat-value">
                        {pg.totalFloors ?? "—"}
                      </span>
                    </div>
                    <div className="pgv2-stat">
                      <span className="pgv2-stat-label">TOTAL ROOMS</span>
                      <span className="pgv2-stat-value">
                        {pg.totalRooms ?? "—"}
                      </span>
                    </div>
                    <div className="pgv2-stat">
                      <span className="pgv2-stat-label">TOTAL BEDS</span>
                      <span className="pgv2-stat-value">
                        {pg.totalBeds ?? "—"}
                      </span>
                    </div>
                    <div className="pgv2-stat occupancy">
                      <span className="pgv2-stat-label">OCCUPANCY</span>
                      <span className="pgv2-stat-value">
                        {pg.occupiedBeds ?? "—"}
                        {pg.totalBeds ? (
                          <span className="pgv2-stat-total">
                            {" "}
                            / {pg.totalBeds}
                          </span>
                        ) : (
                          ""
                        )}
                      </span>
                    </div>
                  </div>

                  {/* ── HOUSE RULES + AMENITIES ── */}
                  <div className="pgv2-mid-row">
                    {/* LEFT: House Rules */}
                    {pg.houseRules?.length > 0 && (
                      <div className="pgv2-section pgv2-rules-section">
                        <span className="pgv2-section-title">HOUSE RULES</span>
                        <ul className="pgv2-rules-list">
                          {pg.houseRules.slice(0, 2).map((rule, i) => {
                            const isDenied = rule
                              .toLowerCase()
                              .startsWith("no ");
                            const isLastVisible =
                              i === 1 && pg.houseRules.length > 2;
                            return (
                              <li key={i} className="pgv2-rule-item">
                                <i
                                  className={`bi ${isDenied ? "bi-x-circle-fill pgv2-rule-icon denied" : "bi-check-circle-fill pgv2-rule-icon allowed"}`}
                                ></i>
                                <span className="pgv2-rule-text">
                                  {rule}
                                  {isLastVisible && (
                                    <span className="pgv2-rules-more-side">
                                      +{pg.houseRules.length - 2} more
                                    </span>
                                  )}
                                </span>
                              </li>
                            );
                          })}
                          {pg.houseRules.length === 1 &&
                            pg.houseRules.length > 2 && (
                              <li className="pgv2-rule-item">
                                <span className="pgv2-rules-more-side">
                                  +{pg.houseRules.length - 1} more
                                </span>
                              </li>
                            )}
                        </ul>
                      </div>
                    )}

                    {/* RIGHT: Amenities chips */}
                    {pg.amenities?.length > 0 && (
                      <div className="pgv2-section pgv2-amenities-section">
                        <span className="pgv2-section-title">AMENITIES</span>
                        <div className="pgv2-amenities-row">
                          {pg.amenities.slice(0, 4).map((am, i) => (
                            <div
                              key={i}
                              className="pgv2-amenity-chip"
                              title={am}
                            >
                              <AmenityIcon name={am} />
                              <span className="pgv2-amenity-label">{am}</span>
                            </div>
                          ))}
                          {pg.amenities.length > 4 && (
                            <div
                              className="pgv2-amenity-chip more"
                              title={pg.amenities.slice(4).join(", ")}
                            >
                              +{pg.amenities.length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pgv2-bottom-row">
                    <div className="pgv2-toggles">
                      <div className="pgv2-toggle-row">
                        <div className="pgv2-toggle-icon">
                          <Globe size={16} />
                        </div>
                        <span
                          className="pgv2-toggle-label"
                          data-desc="Visible to everyone"
                        >
                          {pg.isPublic ? "Public" : "Hidden"}
                        </span>
                        {!pg.isPublic &&
                          ["PENDING", "REAPPLIED"].includes(
                            pg.approvalStatus,
                          ) && (
                            <span className="pgv2-toggle-note warn">
                              ⏳ Pending
                            </span>
                          )}
                        {!pg.isPublic && pg.approvalStatus === "REJECTED" && (
                          <span className="pgv2-toggle-note danger">
                            ❌ Rejected
                          </span>
                        )}
                        <label className="pgv2-switch">
                          <input
                            type="checkbox"
                            checked={pg.isPublic ?? false}
                            disabled={actionLoading[pg.id]}
                            onChange={() =>
                              toggleVisibility(pg.id, pg.isPublic, pg)
                            }
                          />
                          <span className="pgv2-slider"></span>
                        </label>
                      </div>
                      <div className="pgv2-toggle-row">
                        <div className="pgv2-toggle-icon">
                          <CalendarCheck size={16} />
                        </div>
                        <span
                          className="pgv2-toggle-label"
                          data-desc="Allow customers to book"
                        >
                          {pg.reservationEnabled
                            ? "Reservation On"
                            : "Reservation Off"}
                        </span>
                        {!pg.reservationEnabled &&
                          ["PENDING", "REAPPLIED"].includes(
                            pg.approvalStatus,
                          ) && (
                            <span className="pgv2-toggle-note warn">
                              ⏳ Pending
                            </span>
                          )}
                        {!pg.reservationEnabled &&
                          pg.approvalStatus === "REJECTED" && (
                            <span className="pgv2-toggle-note danger">
                              ❌ Rejected
                            </span>
                          )}
                        <label className="pgv2-switch">
                          <input
                            type="checkbox"
                            checked={pg.reservationEnabled ?? false}
                            disabled={actionLoading[pg.id]}
                            onChange={() =>
                              toggleReservation(
                                pg.id,
                                pg.reservationEnabled,
                                pg,
                              )
                            }
                          />
                          <span className="pgv2-slider"></span>
                        </label>
                      </div>
                      {role === "OWNER" && (
                        <div className="pgv2-toggle-row">
                          <div className="pgv2-toggle-icon">
                            <Clock size={16} />
                          </div>
                          <span
                            className="pgv2-toggle-label"
                            data-desc="Allow daily booking"
                          >
                            Daily Booking
                          </span>
                          <label className="pgv2-switch">
                            <input
                              type="checkbox"
                              checked={pg.dailyReservationEnabled ?? false}
                              disabled={actionLoading[pg.id]}
                              onChange={() =>
                                toggleDailyReservation(
                                  pg.id,
                                  pg.dailyReservationEnabled,
                                  pg,
                                )
                              }
                            />
                            <span className="pgv2-slider"></span>
                          </label>
                        </div>
                      )}
                    </div>
                    <div className="pgv2-action-btns">
                      <button
                        className="pgv2-btn secondary"
                        onClick={() => {
                          setSelectedPgId(pg.id);
                          setShowFloorManager(true);
                        }}
                      >
                        Manage Floors
                      </button>
                      {pg.approvalStatus === "REJECTED" && (
                        <button
                          className="pgv2-btn success"
                          disabled={actionLoading[pg.id]}
                          onClick={() => handleReapply(pg)}
                        >
                          Reapply
                        </button>
                      )}
                      <button
                        className="pgv2-btn primary"
                        onClick={() => showApprovalStatus(pg)}
                      >
                        View Status
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state-clean">
            <div className="empty-content">
              <div className="empty-icon">
                <FaHome />
              </div>
              <h2>No PGs yet</h2>
              <p>
                You haven't added any PG listings yet. Start by creating your
                first property.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {showEdit && editPg && (
        <div className="modal-backdrop-custom">
          <div className="modal-box">
            <div className="edit-pg-modal-header">
              <h4>Edit PG</h4>
              <button
                type="button"
                className="edit-pg-close-btn"
                onClick={() => {
                  setShowEdit(false);
                  setVideoList([]);
                  setImageList([]);
                }}
                title="Close"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="edit-pg-form-row">
              <div className="edit-pg-form-group">
                <label className="edit-pg-form-label required">PG Name</label>
                <input
                  type="text"
                  className="edit-pg-form-input"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({...editForm, name: e.target.value})
                  }
                  placeholder="Enter PG name"
                />
              </div>
              <div className="edit-pg-form-group">
                <label className="edit-pg-form-label required">City</label>
                <select
                  className="edit-pg-form-select"
                  value={editForm.city}
                  onChange={(e) =>
                    setEditForm({...editForm, city: e.target.value})
                  }
                >
                  <option value="">Select City</option>
                  {CITY_OPTIONS.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                {editForm.city === "Other" && (
                  <input
                    type="text"
                    placeholder="Enter your city"
                    className="edit-pg-form-input mt-2"
                    value={editForm.customCity}
                    onChange={(e) =>
                      setEditForm({...editForm, customCity: e.target.value})
                    }
                  />
                )}
              </div>
            </div>
            <div className="edit-pg-form-row">
              <div className="edit-pg-form-group">
                <label className="edit-pg-form-label">Locality</label>
                <div style={{position: "relative"}}>
                  <input
                    ref={localityInputRef}
                    type="text"
                    className="edit-pg-form-input"
                    placeholder="Type to search or enter a new locality"
                    value={localitySearch}
                    autoComplete="off"
                    onChange={(e) => {
                      const val = e.target.value;
                      setLocalitySearch(val);
                      setEditForm({...editForm, locality: val});
                      setShowLocalitySuggestions(true);
                    }}
                    onFocus={() => setShowLocalitySuggestions(true)}
                    onBlur={() =>
                      // Delay hide so clicks on suggestion list register first
                      setTimeout(() => setShowLocalitySuggestions(false), 150)
                    }
                  />
                  {showLocalitySuggestions &&
                    editLocalityOptions.filter((l) =>
                      l.toLowerCase().includes(localitySearch.toLowerCase()),
                    ).length > 0 && (
                      <ul
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          background: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                          marginTop: "4px",
                          maxHeight: "200px",
                          overflowY: "auto",
                          listStyle: "none",
                          padding: "4px 0",
                          zIndex: 1000,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                        }}
                      >
                        {editLocalityOptions
                          .filter((l) =>
                            l
                              .toLowerCase()
                              .includes(localitySearch.toLowerCase()),
                          )
                          .map((loc) => (
                            <li
                              key={loc}
                              onMouseDown={() => {
                                setLocalitySearch(loc);
                                setEditForm({...editForm, locality: loc});
                                setShowLocalitySuggestions(false);
                              }}
                              style={{
                                padding: "8px 14px",
                                cursor: "pointer",
                                color: "#e2e8f0",
                                fontSize: "0.9rem",
                                transition: "background 0.15s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#334155")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "transparent")
                              }
                            >
                              {loc}
                            </li>
                          ))}
                      </ul>
                    )}
                </div>
              </div>
              <div className="edit-pg-form-group">
                <label className="edit-pg-form-label required">Gender</label>
                <select
                  className="edit-pg-form-select"
                  value={editForm.genderType}
                  onChange={(e) =>
                    setEditForm({...editForm, genderType: e.target.value})
                  }
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="UNISEX">Unisex</option>
                </select>
              </div>
            </div>
            <div className="edit-pg-form-group edit-pg-form-row-single">
              <label className="edit-pg-form-label required">Address</label>
              <textarea
                className="edit-pg-form-textarea"
                value={editForm.address}
                onChange={(e) =>
                  setEditForm({...editForm, address: e.target.value})
                }
                placeholder="Enter full address"
              />
            </div>
            <div className="edit-pg-form-group edit-pg-form-row-single">
              <label className="edit-pg-form-label">About the Property</label>
              <textarea
                className="edit-pg-form-textarea"
                rows={4}
                value={editForm.aboutDescription}
                onChange={(e) =>
                  setEditForm({...editForm, aboutDescription: e.target.value})
                }
                placeholder="Describe your PG..."
              />
            </div>
            <div className="edit-pg-form-row">
              <div className="edit-pg-form-group">
                <label className="edit-pg-form-label required">
                  Total Floors
                </label>
                <input
                  type="number"
                  className="edit-pg-form-input"
                  min={1}
                  value={editForm.totalFloors}
                  onChange={(e) =>
                    setEditForm({...editForm, totalFloors: e.target.value})
                  }
                />
              </div>
            </div>
            <div className="edit-pg-form-group edit-pg-form-row-single">
              <label className="edit-pg-amenities-label">Amenities</label>
              <div className="edit-pg-amenities-grid">
                {AMENITIES_LIST.map((a) => (
                  <label key={a} className="edit-pg-amenity-checkbox">
                    <input
                      type="checkbox"
                      checked={editForm.amenities.includes(a)}
                      onChange={(e) => {
                        const list = e.target.checked
                          ? [...editForm.amenities, a]
                          : editForm.amenities.filter((x) => x !== a);
                        setEditForm({...editForm, amenities: list});
                      }}
                    />
                    <span className="edit-pg-amenity-label">{a}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="edit-pg-form-group edit-pg-form-row-single">
                  <label className="edit-pg-form-label">Include in Police Verification Form</label>
                  <div className="police-form-option-grid police-form-readonly">
                    <div
                      className={`police-form-option ${editForm.policeFormType === "WITH_RULES" ? "selected" : "police-form-dimmed"}`}
                    >
                      <span className="police-form-icon">🛡️📄</span>
                      <span className="police-form-option-title">Police Form with Rules & Regulations</span>
                      <span className="police-form-option-desc">
                        Generate a 2-page document with police verification details and rules & regulations.
                      </span>
                      {editForm.policeFormType === "WITH_RULES" && (
                        <span className="police-form-selected-tag">✓ Selected</span>
                      )}
                    </div>

                    <div
                      className={`police-form-option ${editForm.policeFormType === "ONLY" ? "selected" : "police-form-dimmed"}`}
                    >
                      <span className="police-form-icon">📄</span>
                      <span className="police-form-option-title">Police Form Only</span>
                      <span className="police-form-option-desc">
                        Generate a 1-page document with only police verification details.
                      </span>
                      {editForm.policeFormType === "ONLY" && (
                        <span className="police-form-selected-tag">✓ Selected</span>
                      )}
                    </div>
                  </div>
                  <p className="create-pg-section-subtitle" style={{marginTop: "6px"}}>
                    Chosen during PG creation. Change it from Add New PG or PG Settings.
                  </p>

                  <h3 className="create-pg-section-title" style={{marginTop: "16px"}}>
                    Rules & Regulations
                  </h3>

                  <label className="edit-pg-amenities-label">General Policy Settings</label>
                  <div className="create-pg-form-row create-pg-form-row-3">
                    <div>
                      <label className="create-pg-form-label required">Rent Due Date</label>
                      <select
                        className="create-pg-form-select"
                        value={editForm.rentDueDate}
                        onChange={(e) => setEditForm({...editForm, rentDueDate: e.target.value})}
                      >
                        <option value="">Select Date (1st - 31st)</option>
                        {Array.from({length: 31}, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="create-pg-form-label required">Late Fee Amount (₹)</label>
                      <input
                        type="number"
                        className="create-pg-form-input"
                        placeholder="Enter amount"
                        value={editForm.lateFeeAmount}
                        onChange={(e) => setEditForm({...editForm, lateFeeAmount: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="create-pg-form-label required">Curfew Time / Entry Time</label>
                      <input
                        type="time"
                        className="create-pg-form-input"
                        value={editForm.curfewTime}
                        onChange={(e) => setEditForm({...editForm, curfewTime: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="create-pg-form-label required">Notice Period (Days)</label>
                      <input
                        type="number"
                        className="create-pg-form-input"
                        placeholder="Enter days"
                        value={editForm.noticePeriodDays}
                        onChange={(e) => setEditForm({...editForm, noticePeriodDays: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="create-pg-form-label required">Security Deposit Refund (Days)</label>
                      <input
                        type="number"
                        className="create-pg-form-input"
                        placeholder="Enter days"
                        value={editForm.depositRefundDays}
                        onChange={(e) => setEditForm({...editForm, depositRefundDays: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="create-pg-form-label">Damage Charges (₹)</label>
                      <input
                        type="number"
                        className="create-pg-form-input"
                        placeholder="Enter amount"
                        value={editForm.damageCharges}
                        onChange={(e) => setEditForm({...editForm, damageCharges: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="create-pg-form-label">Washing Machine Charges (₹)</label>
                      <input
                        type="number"
                        className="create-pg-form-input"
                        placeholder="Enter amount"
                        value={editForm.washingMachineCharges}
                        onChange={(e) => setEditForm({...editForm, washingMachineCharges: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="create-pg-form-label required">Food Facility</label>
                      <select
                        className="create-pg-form-select"
                        value={editForm.foodFacility}
                        onChange={(e) => setEditForm({...editForm, foodFacility: e.target.value})}
                      >
                        <option value="">Select Option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="create-pg-form-label required">Visitor Policy</label>
                      <select
                        className="create-pg-form-select"
                        value={editForm.visitorPolicy}
                        onChange={(e) => setEditForm({...editForm, visitorPolicy: e.target.value})}
                      >
                        <option value="">Select Option</option>
                        <option value="Not Allowed">Not Allowed</option>
                        <option value="Day Time Only">Day Time Only</option>
                        <option value="Allowed with Permission">Allowed with Permission</option>
                      </select>
                    </div>
                    <div>
                      <label className="create-pg-form-label required">Overnight Guest Allowed</label>
                      <select
                        className="create-pg-form-select"
                        value={editForm.overnightGuestAllowed}
                        onChange={(e) => setEditForm({...editForm, overnightGuestAllowed: e.target.value})}
                      >
                        <option value="">Select Option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="create-pg-form-label">Electricity Usage</label>
                      <select
                        className="create-pg-form-select"
                        value={editForm.electricityUsage}
                        onChange={(e) => setEditForm({...editForm, electricityUsage: e.target.value})}
                      >
                        <option value="">Select Option</option>
                        <option value="Included in Rent">Included in Rent</option>
                        <option value="Billed Separately">Billed Separately</option>
                      </select>
                    </div>
                  </div>

                  {editForm.foodFacility === "Yes" && (
                    <>
                      <label className="edit-pg-amenities-label">Meal Timings</label>
                      <div className="create-pg-form-row create-pg-form-row-3">
                        <div>
                          <label className="create-pg-form-label">Breakfast Time</label>
                          <input
                            type="time"
                            className="create-pg-form-input"
                            value={editForm.breakfastTime}
                            onChange={(e) => setEditForm({...editForm, breakfastTime: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="create-pg-form-label">Lunch Time</label>
                          <input
                            type="time"
                            className="create-pg-form-input"
                            value={editForm.lunchTime}
                            onChange={(e) => setEditForm({...editForm, lunchTime: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="create-pg-form-label">Dinner Time</label>
                          <input
                            type="time"
                            className="create-pg-form-input"
                            value={editForm.dinnerTime}
                            onChange={(e) => setEditForm({...editForm, dinnerTime: e.target.value})}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <label className="edit-pg-amenities-label">Penalty & Fine Settings</label>
                  <div className="create-pg-form-row create-pg-form-row-3">
                    <div>
                      <label className="create-pg-form-label">First Time Rule Violation Fine (₹)</label>
                      <input
                        type="number"
                        className="create-pg-form-input"
                        placeholder="Enter amount"
                        value={editForm.firstTimeFine}
                        onChange={(e) => setEditForm({...editForm, firstTimeFine: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="create-pg-form-label">Repeated Violation Fine (₹)</label>
                      <input
                        type="number"
                        className="create-pg-form-input"
                        placeholder="Enter amount"
                        value={editForm.repeatedFine}
                        onChange={(e) => setEditForm({...editForm, repeatedFine: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="create-pg-form-label">Addiction / Smoking / Alcohol Fine (₹)</label>
                      <input
                        type="number"
                        className="create-pg-form-input"
                        placeholder="Enter amount"
                        value={editForm.addictionFine}
                        onChange={(e) => setEditForm({...editForm, addictionFine: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="create-pg-form-label">Cleanliness / Garbage Fine (₹)</label>
                      <input
                        type="number"
                        className="create-pg-form-input"
                        placeholder="Enter amount"
                        value={editForm.cleanlinessFine}
                        onChange={(e) => setEditForm({...editForm, cleanlinessFine: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="create-pg-form-label">AC / Cooler Temperature Range (°C)</label>
                      <div className="create-pg-range-row">
                        <input
                          type="number"
                          className="create-pg-form-input"
                          placeholder="16"
                          value={editForm.acTempMin}
                          onChange={(e) => setEditForm({...editForm, acTempMin: e.target.value})}
                        />
                        <span>to</span>
                        <input
                          type="number"
                          className="create-pg-form-input"
                          placeholder="24"
                          value={editForm.acTempMax}
                          onChange={(e) => setEditForm({...editForm, acTempMax: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="create-pg-form-label">Other Custom Fine (₹) (Optional)</label>
                      <input
                        type="number"
                        className="create-pg-form-input"
                        placeholder="Enter amount"
                        value={editForm.otherCustomFine}
                        onChange={(e) => setEditForm({...editForm, otherCustomFine: e.target.value})}
                      />
                    </div>
                  </div>

                  <RulesClausesTable rules={editRulesClauses} onChange={setEditRulesClauses} />

                  <label className="create-pg-form-label" style={{marginTop: "10px", display: "block"}}>
                    Custom Note for Rules (Optional)
                  </label>
                  <textarea
                    className="create-pg-form-input create-pg-form-textarea"
                    placeholder="Enter any additional note or instructions for the rules..."
                    value={editForm.rulesCustomNote}
                    onChange={(e) => setEditForm({...editForm, rulesCustomNote: e.target.value})}
                  />
                </div>

            <div className="edit-pg-form-group edit-pg-form-row-single">
              <label className="edit-pg-amenities-label">House Rules</label>
              <div className="edit-pg-amenities-grid">
                {HOUSE_RULES_LIST.map((rule) => (
                  <label key={rule} className="edit-pg-amenity-checkbox">
                    <input
                      type="checkbox"
                      checked={editForm.houseRules.includes(rule)}
                      onChange={() => {
                        const updated = editForm.houseRules.includes(rule)
                          ? editForm.houseRules.filter((r) => r !== rule)
                          : [...editForm.houseRules, rule];
                        setEditForm({...editForm, houseRules: updated});
                      }}
                    />
                    <span>{rule}</span>
                  </label>
                ))}
              </div>
              <div className="edit-custom-rule-section">
                <div className="edit-custom-rule-input-row">
                  <input
                    type="text"
                    placeholder="Add custom rule"
                    className="edit-pg-form-input edit-custom-rule-input"
                    value={editForm.customRuleInput}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        customRuleInput: e.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    className="edit-add-rule-btn"
                    onClick={() => {
                      if (!editForm.customRuleInput.trim()) return;
                      setEditForm((prev) => ({
                        ...prev,
                        customHouseRules: [
                          ...prev.customHouseRules,
                          prev.customRuleInput.trim(),
                        ],
                        customRuleInput: "",
                      }));
                    }}
                  >
                    + Add
                  </button>
                </div>
                {editForm.customHouseRules.map((rule, i) => (
                  <div key={i} className="edit-custom-rule-chip">
                    {rule}
                    <button
                      type="button"
                      className="edit-remove-rule-btn"
                      onClick={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          customHouseRules: prev.customHouseRules.filter(
                            (_, idx) => idx !== i,
                          ),
                        }))
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="edit-pg-form-group edit-pg-form-row-single">
              <label className="edit-pg-form-label">Property Images</label>
              <div className="edit-pg-file-upload-wrapper">
                <label className="edit-pg-file-upload-label">
                  <span>
                    <FaCamera /> Click to upload more images
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="edit-pg-file-input"
                    onChange={(e) => {
                      const files = Array.from(e.target.files).map((f) => ({
                        type: "new",
                        file: f,
                        src: URL.createObjectURL(f),
                      }));
                      setImageList((prev) => [...prev, ...files]);
                    }}
                  />
                </label>
              </div>
            </div>
            {imageList.length > 0 && (
              <div className="edit-pg-form-group edit-pg-form-row-single">
                <div className="edit-pg-image-preview-grid">
                  {imageList.map((img, i) => (
                    <div key={i} className="edit-pg-image-item">
                      <img src={img.src} alt={`preview-${i}`} />
                      <span className="edit-pg-image-badge">{i + 1}</span>
                      <button
                        type="button"
                        className="edit-pg-image-remove-btn"
                        onClick={() => removeImage(i)}
                      >
                        ×
                      </button>
                      <div className="edit-pg-image-controls">
                        <button
                          type="button"
                          className="edit-pg-image-move-btn"
                          onClick={() => moveImage(i, -1)}
                          disabled={i === 0}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="edit-pg-image-move-btn"
                          onClick={() => moveImage(i, 1)}
                          disabled={i === imageList.length - 1}
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="edit-pg-form-group edit-pg-form-row-single">
              <label className="edit-pg-form-label">
                Property Videos (Max 5)
              </label>
              <label className="edit-pg-file-upload-label">
                <span>
                  <FaVideo /> Upload Videos
                </span>
                <input
                  type="file"
                  multiple
                  accept="video/*"
                  className="edit-pg-file-input"
                  ref={editVideoInputRef}
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    if (videoList.length + files.length > 5) {
                      toast.error("Maximum 5 videos allowed.");
                      return;
                    }
                    setVideoList((prev) => [
                      ...prev,
                      ...files.map((f) => ({
                        id: Date.now() + Math.random(),
                        type: "new",
                        file: f,
                        src: URL.createObjectURL(f),
                      })),
                    ]);
                  }}
                />
              </label>
            </div>
            {videoList.length > 0 && (
              <div className="edit-pg-form-group edit-pg-form-row-single">
                <div className="edit-pg-image-preview-grid">
                  {videoList.map((video) => {
                    const vid = video.id ?? video.src;
                    return (
                      <div
                        key={vid}
                        style={{position: "relative", display: "inline-block"}}
                      >
                        <video
                          key={vid + "_player"}
                          src={video.src}
                          style={{
                            width: "100px",
                            height: "100px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            display: "block",
                            pointerEvents: "none",
                          }}
                        />
                        <button
                          type="button"
                          className="edit-pg-image-remove-btn"
                          style={{
                            position: "absolute",
                            top: "4px",
                            right: "4px",
                            zIndex: 999,
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            if (video.type === "new")
                              URL.revokeObjectURL(video.src);
                            setVideoList((prev) =>
                              prev.filter((v) => (v.id ?? v.src) !== vid),
                            );
                            if (editVideoInputRef.current)
                              editVideoInputRef.current.value = "";
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="edit-pg-form-actions">
              <button
                type="button"
                className="edit-pg-btn-cancel"
                onClick={() => {
                  setShowEdit(false);
                  setVideoList([]);
                  setImageList([]);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="edit-pg-btn-submit"
                disabled={updateLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: updateLoading ? 0.85 : 1,
                }}
                onClick={async () => {
                  setUpdateLoading(true);
                  try {
                    if (
                      editForm.totalFloors === "" ||
                      isNaN(Number(editForm.totalFloors)) ||
                      Number(editForm.totalFloors) < 1
                    ) {
                      toast.error("Enter a valid total floors number.");
                      setUpdateLoading(false);
                      return;
                    }
                    const fd = new FormData();
                    if (
                      editForm.city === "Other" &&
                      !editForm.customCity.trim()
                    ) {
                      toast.error("Please enter your city.");
                      setUpdateLoading(false);
                      return;
                    }
                    let finalCity =
                      editForm.city === "Other"
                        ? editForm.customCity
                        : editForm.city;
                    fd.append("city", finalCity);
                    Object.entries(editForm).forEach(([k, v]) => {
                      if (k === "city" || k === "customCity") return;
                      if (k === "houseRules") {
                        const combined = [
                          ...editForm.houseRules,
                          ...editForm.customHouseRules,
                        ];
                        fd.append("houseRules", combined.join(","));
                      } else if (Array.isArray(v)) {
                        if (k !== "customHouseRules") fd.append(k, v.join(","));
                      } else fd.append(k, v);
                    });
                    fd.append("rulesClauses", JSON.stringify(editRulesClauses));
                    imageList.forEach((img) => {
                      if (img.type === "existing")
                        fd.append("existingImageUrls", img.src);
                      else fd.append("images", img.file);
                    });
                    videoList.forEach((video) => {
                      if (video.type === "existing")
                        fd.append("existingVideoUrls", video.src);
                      else fd.append("videos", video.file);
                    });
                    if (role === "PG_MANAGER") {
                      fd.append("pgId", editPg.id);
                      await api.put(`/manager/pg/update`, fd);
                    } else await api.put(`/owner/pg/${editPg.id}`, fd);
                    Swal.fire({
                      icon: "success",
                      title: "Updated!",
                      text: "PG updated successfully",
                      timer: 2000,
                      showConfirmButton: false,
                    });
                    setShowEdit(false);
                    setVideoList([]);
                    setImageList([]);
                    loadPGs();
                  } catch (err) {
                    Swal.fire({
                      icon: "error",
                      title: "Update Failed",
                      text:
                        err.response?.data?.message || "Something went wrong",
                    });
                  } finally {
                    setUpdateLoading(false);
                  }
                }}
              >
                {updateLoading ? (
                  <>
                    <span
                      style={{
                        width: "15px",
                        height: "15px",
                        border: "2px solid rgba(255,255,255,0.4)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "upg-spin 0.7s linear infinite",
                        flexShrink: 0,
                      }}
                    />
                    Updating...
                  </>
                ) : (
                  "Update PG"
                )}
                <style>{`@keyframes upg-spin{to{transform:rotate(360deg);}}`}</style>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOOR MANAGER */}
      {showFloorManager && (
        <div className="modal-backdrop-custom">
          <div className="modal-box" style={{width: "600px"}}>
            <FloorManagerContent
              role={role}
              preselectedPgId={selectedPgId}
              onCancel={() => setShowFloorManager(false)}
            />
          </div>
        </div>
      )}

      {/* STATUS MODAL */}
      {selectedPg && showStatusModal && (
        <div
          className="modal-backdrop-custom"
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="modal-box"
            style={{maxWidth: "420px"}}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="mb-3">PG Verification Status</h4>
            {["PENDING", "REAPPLIED"].includes(selectedPg.approvalStatus) && (
              <>
                <span className="status-pill PENDING mb-3">PENDING</span>
                <p>
                  Your PG is currently under admin review. Once approved it will
                  become visible to users.
                </p>
              </>
            )}
            {selectedPg.approvalStatus === "APPROVED" && (
              <>
                <span
                  className={`status-pill ${selectedPg.approvalStatus} mb-3`}
                >
                  APPROVED
                </span>
                <p>Your PG is verified and live.</p>
                {selectedPg.adminNote && (
                  <div className="admin-note-inline">
                    <span className="admin-note-icon">⚠️</span>
                    <span className="admin-note-text">
                      <strong>Admin note:</strong> {selectedPg.adminNote}
                    </span>
                  </div>
                )}
              </>
            )}
            {selectedPg.approvalStatus === "REJECTED" && (
              <>
                <span
                  className={`status-pill ${selectedPg.approvalStatus} mb-3`}
                >
                  REJECTED
                </span>
                <p>
                  <strong>Reason:</strong>
                  <br />
                  {selectedPg.rejectionReason || "No reason provided"}
                </p>
              </>
            )}
            <div className="mt-4 text-end">
              <button
                className="btn btn-secondary"
                onClick={() => setShowStatusModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PGList;