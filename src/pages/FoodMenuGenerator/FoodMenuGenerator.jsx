import React, { useState, useContext, useRef } from "react";
import MenuEditor from "../../components/MenuGenerator/MenuEditor";
import MenuPreview from "../../components/MenuGenerator/MenuPreview";
import FoodMenuHero from "../../components/MenuGenerator/FoodMenuHero";
import FoodMenuDemo from "../../components/MenuGenerator/FoodMenuDemo";
import "../../components/MenuGenerator/FoodMenuGenerator.css";
import { jsPDF } from "jspdf";
import * as htmlToImage from "html-to-image";
import { saveMenu } from "../../services/menuService";
import toast from "react-hot-toast";
import {
  FiImage,
  FiFileText,
  FiEye,
  FiDownload,
  FiChevronDown,
  FiRefreshCw,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import AuthRequiredModal from "../../components/common/AuthRequiredModal";
import Swal from "sweetalert2";

/* ── helpers ────────────────────────────────────────────────── */
const createEmptyMeals = () => ({
  breakfast: [{ id: Date.now() + Math.random(), name: "", isVeg: true }],
  lunch:     [{ id: Date.now() + Math.random(), name: "", isVeg: true }],
  snacks:    [{ id: Date.now() + Math.random(), name: "", isVeg: true }],
  dinner:    [{ id: Date.now() + Math.random(), name: "", isVeg: true }],
});

const defaultActiveMeals = {
  breakfast: true,
  lunch:     true,
  snacks:    true,
  dinner:    true,
};

const DAY_NAMES = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const buildInitialDays = () =>
  DAY_NAMES.map((name, i) => ({
    id: i + 1,
    name,
    activeMeals: { ...defaultActiveMeals },
    meals: createEmptyMeals(),
  }));

const DEFAULT_MEAL_CONFIGS = [
  { id: "breakfast", name: "Breakfast", time: "08:00 AM - 10:00 AM", enabled: true },
  { id: "lunch",     name: "Lunch",     time: "01:00 PM - 03:00 PM", enabled: true },
  { id: "snacks",    name: "Snacks",    time: "05:00 PM - 06:00 PM", enabled: true },
  { id: "dinner",    name: "Dinner",    time: "08:00 PM - 10:00 PM", enabled: true },
];

/* ── component ───────────────────────────────────────────────── */
const FoodMenuGenerator = () => {
  const { isAuthenticated, role } = useContext(AuthContext);

  // form state
  const [pgName,      setPgName]      = useState("");
  const [address,     setAddress]     = useState("");
  const [theme,       setTheme]       = useState("option1");
  const [days,        setDays]        = useState(buildInitialDays);
  const [mealConfigs, setMealConfigs] = useState(DEFAULT_MEAL_CONFIGS);

  // ui state
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingPdf,   setLoadingPdf]   = useState(false);
  const [loadingImg,   setLoadingImg]   = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAuthModal,setShowAuthModal]= useState(false);
  const [pendingDownload, setPendingDownload] = useState(null);

  // eslint-disable-next-line no-unused-vars
  const [saving, setSaving] = useState(false);

  // refs
  const dropdownRef       = useRef(null);
  const previewSectionRef = useRef(null);
  const captureRef        = useRef(null);
  const pgNameRef         = useRef(null);
  const addressRef        = useRef(null);

  // responsive zoom
  const [previewZoom, setPreviewZoom] = useState(0.48);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        if (window.innerWidth <= 360)  setPreviewZoom(0.32);
        else if (window.innerWidth <= 480)  setPreviewZoom(0.38);
        else if (window.innerWidth <= 768)  setPreviewZoom(0.58);
        else setPreviewZoom(0.48);
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // close dropdown on outside click
  React.useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // retry download after login
  React.useEffect(() => {
    if (
      isAuthenticated &&
      ["OWNER", "SUPER_ADMIN", "PG_MANAGER"].includes(role) &&
      pendingDownload
    ) {
      if (pendingDownload === "pdf")   handleDownloadPDF();
      if (pendingDownload === "image") handleDownloadImage();
      setPendingDownload(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, role, pendingDownload]);

  /* ── validation ── */
  const validateForm = () => {
    if (!pgName.trim()) {
      toast.error("Please fill in the PG Name.");
      pgNameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      pgNameRef.current?.focus();
      return false;
    }
    if (!address.trim()) {
      toast.error("Please fill in the Address.");
      addressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      addressRef.current?.focus();
      return false;
    }
    const hasMeals = days.some((day) =>
      Object.values(day.meals).some((items) =>
        items.some((item) => item.name.trim() !== "")
      )
    );
    if (!hasMeals) {
      toast.error("Please add at least one meal item.");
      return false;
    }
    return true;
  };

  /* ── generate ── */
  const handleGenerate = () => {
    if (!validateForm()) return;

    setIsGenerating(true);

    // scroll to preview so user sees the spinner
    setTimeout(() => {
      previewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);

    setTimeout(() => {
      setIsGenerating(false);
    }, 1500);
  };

  /* ── reset ── */
  const handleReset = () => {
    Swal.fire({
      title: "Start a New Menu?",
      text: "All current unsaved changes will be lost.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#dc2626",
      confirmButtonText: "Yes, start fresh",
    }).then((result) => {
      if (result.isConfirmed) {
        setPgName("");
        setAddress("");
        setTheme("option1");
        setDays(buildInitialDays());
        setMealConfigs([...DEFAULT_MEAL_CONFIGS]);
      }
    });
  };

  /* ── capture (off-screen hidden node) ── */
  const captureMenuNode = async () => {
    // Target the a4-menu-container directly — it is exactly 794×1123px
    const node = captureRef.current?.querySelector(".a4-menu-container");
    if (!node) throw new Error("a4-menu-container not found in capture node.");

    // Temporarily remove overflow:hidden so html-to-image can see all content
    const savedOverflow = node.style.overflow;
    node.style.overflow = "visible";

    // Two frames so fonts/images fully paint
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));

    const dataUrl = await htmlToImage.toPng(node, {
      quality:         1.0,
      pixelRatio:      3,   // 3× → 2382×3369px — crisp when printed
      backgroundColor: "#ffffff",
      width:           794,
      height:          1123,
      cacheBust:       true,
    });

    // Restore
    node.style.overflow = savedOverflow;

    return { dataUrl };
  };

  /* ── download PDF ── */
  const handleDownloadPDF = async () => {
    setShowDropdown(false);
    if (!validateForm()) return;

    if (!isAuthenticated || !["OWNER", "SUPER_ADMIN", "PG_MANAGER"].includes(role)) {
      setPendingDownload("pdf");
      setShowAuthModal(true);
      return;
    }

    setLoadingPdf(true);
    try {
      const { dataUrl } = await captureMenuNode();

      // A4 portrait in mm: 210 × 297
      const pdf = new jsPDF({
        orientation: "portrait",
        unit:        "mm",
        format:      "a4",
      });

      // Fill the full A4 page with the image
      pdf.addImage(dataUrl, "PNG", 0, 0, 210, 297);
      pdf.save(`${pgName.replace(/\s+/g, "-")}-Food-Menu.pdf`);
      toast.success("Food Menu downloaded as PDF!");
    } catch (err) {
      console.error("PDF error:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setLoadingPdf(false);
    }
  };

  /* ── download Image ── */
  const handleDownloadImage = async () => {
    setShowDropdown(false);
    if (!validateForm()) return;

    if (!isAuthenticated || !["OWNER", "SUPER_ADMIN", "PG_MANAGER"].includes(role)) {
      setPendingDownload("image");
      setShowAuthModal(true);
      return;
    }

    setLoadingImg(true);
    try {
      const { dataUrl } = await captureMenuNode();
      const link = document.createElement("a");
      link.download = `${pgName.replace(/\s+/g, "-")}-Food-Menu.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Food Menu downloaded as Image!");
    } catch (err) {
      console.error("Image error:", err);
      toast.error("Failed to generate image. Please try again.");
    } finally {
      setLoadingImg(false);
    }
  };

  /* ── save (unused on UI but kept) ── */
  // eslint-disable-next-line no-unused-vars
  const handleSaveMenu = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const sanitizedDays = days.map(({ name, meals }) => ({
        name,
        meals: {
          breakfast: meals.breakfast.map(({ name: n, isVeg }) => ({ name: n, isVeg })),
          lunch:     meals.lunch.map(({ name: n, isVeg }) => ({ name: n, isVeg })),
          snacks:    meals.snacks.map(({ name: n, isVeg }) => ({ name: n, isVeg })),
          dinner:    meals.dinner.map(({ name: n, isVeg }) => ({ name: n, isVeg })),
        },
      }));
      const result = await saveMenu({ pgName, address, dateRange: "", days: sanitizedDays, mealConfigs });
      toast.success(`Menu saved! (ID: ${result.id})`);
    } catch (err) {
      toast.error(err.message || "Failed to save menu.");
    } finally {
      setSaving(false);
    }
  };

  /* ── render ── */
  return (
    <>
      <FoodMenuHero />

      <FoodMenuDemo selectedTheme={theme} setSelectedTheme={setTheme} />

      <div className="food-menu-workspace-wrapper" id="generator-workspace">
        <div className="food-menu-page">
          <div className="workspace-header">
            <h2>
              Food Menu <span className="workspace-title-highlight">Generator</span>
            </h2>
            <p>Create beautiful weekly food menus in seconds and instantly share them with your residents.</p>
          </div>

          <div className="food-menu-workspace">
            {/* ── Left: Editor ── */}
            <section className="menu-editor-section">
              <div className="section-card menu-form-card-aligned">
                <MenuEditor
                  pgName={pgName}         setPgName={setPgName}
                  address={address}       setAddress={setAddress}
                  days={days}             setDays={setDays}
                  mealConfigs={mealConfigs} setMealConfigs={setMealConfigs}
                  theme={theme}           setTheme={setTheme}
                  pgNameRef={pgNameRef}
                  addressRef={addressRef}
                />
                <div className="form-actions-wrapper">
                  <button onClick={handleGenerate} className="menu-primary-btn">
                    {isGenerating ? "Generating…" : "Generate Menu"}
                  </button>
                  <button className="menu-secondary-btn" onClick={handleReset}>
                    <FiRefreshCw /> New Menu
                  </button>
                </div>
              </div>
            </section>

            {/* ── Right: Preview ── */}
            <section className="menu-preview-section" ref={previewSectionRef}>
              <div className="menu-preview-wrapper">
                <div className="preview-header-row">
                  <h2 className="preview-title">
                    <span className="menu-btn-icon-wrapper">
                      <FiEye /> Live Preview
                    </span>
                  </h2>
                </div>

                {/* preview card */}
                <div className="menu-preview-card">
                  {/* spinner overlay */}
                  {isGenerating && (
                    <div className="preview-generating-overlay">
                      <span className="preview-gen-spinner" />
                      <p className="preview-loading-text">Generating your menu…</p>
                    </div>
                  )}

                  <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div 
                      className="menu-scale-wrapper" 
                      style={{ 
                        width: "794px", 
                        height: "1123px", 
                        transform: `scale(${previewZoom})`, 
                        transformOrigin: "center center" 
                      }}
                    >
                      <MenuPreview
                        id="generator-printable-menu-area"
                        pgName={pgName}
                        address={address}
                        days={days}
                        mealConfigs={mealConfigs}
                        isGenerating={isGenerating}
                        theme={theme}
                      />
                    </div>
                  </div>
                </div>

                {/* download bar */}
                <div className="menu-download-bar">
                  <div className="download-dropdown-container" ref={dropdownRef}>
                    <button
                      className="menu-download-btn"
                      onClick={() => setShowDropdown((v) => !v)}
                      disabled={loadingImg || loadingPdf}
                    >
                      {loadingImg || loadingPdf ? (
                        <>
                          <span
                            className="preview-gen-spinner"
                            style={{ width: 16, height: 16, borderWidth: 2, display: "inline-block", marginRight: 8 }}
                          />
                          Downloading…
                        </>
                      ) : (
                        <>
                          <FiDownload /> Download Menu{" "}
                          <FiChevronDown className={showDropdown ? "rotate-icon" : ""} />
                        </>
                      )}
                    </button>

                    {showDropdown && (
                      <div className="download-dropdown-menu-box">
                        <button className="dropdown-item-top" onClick={handleDownloadImage}>
                          <FiImage /> Export as Image (PNG)
                        </button>
                        <button className="dropdown-item-bottom" onClick={handleDownloadPDF}>
                          <FiFileText /> Export as Document (PDF)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingDownload(null); }}
        featureName="Food Menu"
      />

      {/* ── Hidden off-screen full-size node used for download capture ── */}
      <div
        aria-hidden="true"
        style={{
          position:      "fixed",
          top:           0,
          left:          "-9999px",
          width:         "794px",
          height:        "1123px",
          overflow:      "visible",
          pointerEvents: "none",
          zIndex:        -1,
        }}
      >
        <div ref={captureRef} style={{ width: "794px", height: "1123px" }}>
          <MenuPreview
            id="capture-menu-area"
            pgName={pgName}
            address={address}
            days={days}
            mealConfigs={mealConfigs}
            isGenerating={false}
            theme={theme}
          />
        </div>
      </div>
    </>
  );
};

export default FoodMenuGenerator;
