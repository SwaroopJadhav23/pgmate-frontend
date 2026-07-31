import React, {useState, useEffect, useRef, useContext} from "react";
import {FiRefreshCw} from "react-icons/fi";
import Swal from "sweetalert2";
import ExpenseCalculatorHero from "../../components/ExpenseCalculator/ExpenseCalculatorHero";
import ExpenseCalculatorFeatures from "../../components/ExpenseCalculator/ExpenseCalculatorFeatures";
import ExpenseForm from "../../components/ExpenseCalculator/ExpenseForm";
import ExpenseReportPreview from "../../components/ExpenseCalculator/ExpenseReportPreview";
import "../../components/ExpenseCalculator/ExpenseCalculator.css";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/axios";

const DEFAULT_FORM = {
  pgName: "",
  reportMonth: "",
  numRooms: "",
  totalBeds: "",
  occupiedBeds: "",
  // Income
  rentCollected: "",
  securityReceived: "",
  parkingCharges: "",
  laundryCharges: "",
  otherIncome: "",
  // Expenses
  foodKitchen: "",
  staffSalary: "",
  utilities: "",
  maintenance: "",
  miscExpenses: "",
};

const ExpenseCalculator = () => {
  const { isAuthenticated, role } = useContext(AuthContext);
  const [ownerPGs, setOwnerPGs] = useState([]);
  const [pgStats, setPgStats] = useState([]);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);

  const formRef = useRef(null);
  const previewRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (isAuthenticated && role === "OWNER") {
        try {
          const [pgsRes, statsRes] = await Promise.all([
            api.get("/owner/pgs"),
            api.get("/owner/pgs/stats")
          ]);
          const fetchedPGs = pgsRes.data || [];
          const fetchedStats = statsRes.data || [];
          setOwnerPGs(fetchedPGs);
          setPgStats(fetchedStats);
          
          if (fetchedPGs.length === 1) {
            const pgId = fetchedPGs[0].id;
            const stats = fetchedStats.find(s => s.pgId === pgId) || {};
            setFormData(prev => ({
              ...prev,
              pgName: fetchedPGs[0].name,
              numRooms: stats.totalRooms?.toString() || prev.numRooms,
              totalBeds: stats.totalBeds?.toString() || prev.totalBeds,
              occupiedBeds: stats.occupiedBeds?.toString() || prev.occupiedBeds
            }));
          }
        } catch (error) {
          console.error("Failed to fetch PG data:", error);
        }
      }
    };
    fetchData();
  }, [isAuthenticated, role]);

  const validateForm = () => {
    const e = {};
    if (!formData.pgName.trim()) e.pgName = "PG name is required";
    if (!formData.reportMonth) e.reportMonth = "Report month is required";
    if (!formData.numRooms || parseInt(formData.numRooms) <= 0)
      e.numRooms = "Number of rooms is required";
    if (!formData.totalBeds || parseInt(formData.totalBeds) <= 0)
      e.totalBeds = "Total beds is required";
    if (!formData.occupiedBeds || parseInt(formData.occupiedBeds) < 0) {
      e.occupiedBeds = "Occupied beds is required";
    } else if (parseInt(formData.occupiedBeds) > parseInt(formData.totalBeds)) {
      e.occupiedBeds = "Cannot exceed total beds";
    }

    if (!formData.rentCollected || parseFloat(formData.rentCollected) <= 0)
      e.rentCollected = "Rent collected is required";

    const validateNonNegative = (field, label) => {
      if (formData[field] && parseFloat(formData[field]) < 0) {
        e[field] = `${label} must be a non-negative number`;
      }
    };
    validateNonNegative("securityReceived", "Security received");
    validateNonNegative("parkingCharges", "Parking charges");
    validateNonNegative("laundryCharges", "Laundry charges");
    validateNonNegative("otherIncome", "Other income");
    validateNonNegative("foodKitchen", "Food/Kitchen");
    validateNonNegative("staffSalary", "Staff salary");
    validateNonNegative("utilities", "Utilities");
    validateNonNegative("maintenance", "Maintenance");
    validateNonNegative("miscExpenses", "Misc expenses");
    setErrors(e);
    return e;
  };

  const handleCalculate = () => {
    const currentErrors = validateForm();
    if (Object.keys(currentErrors).length > 0) {
      if (formRef.current) {
        const yOffset = -80;
        const element = formRef.current;
        const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({top: y, behavior: 'smooth'});
      }
      return;
    }
    
    setIsGenerating(true);
    
    if (previewRef.current) {
      const yOffset = -80;
      const element = previewRef.current;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    }

    setTimeout(() => setIsGenerating(false), 900);
  };

  const handleFormChange = (newData) => {
    setFormData(newData);
    const cleared = {...errors};
    Object.keys(newData).forEach((k) => {
      if (newData[k] && cleared[k]) delete cleared[k];
    });
    setErrors(cleared);
  };

  const handleReset = () => {
    Swal.fire({
      title: "Start a New Report?",
      text: "All current unsaved changes will be lost.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#dc2626",
      confirmButtonText: "Yes, start fresh"
    }).then((result) => {
      if (result.isConfirmed) {
        setFormData(DEFAULT_FORM);
        setErrors({});
      }
    });
  };

  return (
    <>
      <ExpenseCalculatorHero />
      <ExpenseCalculatorFeatures />

      <div className="exp-workspace-wrapper">
        <div className="exp-page">
          <div className="workspace-header">
            <h2>
              Expense{" "}
              <span className="workspace-title-highlight">Calculator</span>
            </h2>
            <p>
              Enter your monthly income and expense details. Your report updates
              in real-time.
            </p>
          </div>

          <div className="exp-workspace" id="expense-generator-workspace">
            {/* ── Left: Form ── */}
            <section className="exp-form-section" ref={formRef}>
              <div className="exp-section-card">
                <ExpenseForm
                  formData={formData}
                  onChange={handleFormChange}
                  errors={errors}
                  ownerPGs={ownerPGs}
                  pgStats={pgStats}
                />
                <div className="form-actions-wrapper">
                  <button
                    className="rr-primary-btn"
                    onClick={handleCalculate}
                  >
                    {isGenerating
                      ? "Calculating..."
                      : "Calculate & Generate Report"}
                  </button>
                  <button className="rr-secondary-btn" onClick={handleReset}>
                    <FiRefreshCw /> Reset
                  </button>
                </div>
              </div>
            </section>

            {/* ── Right: Preview + Download ── */}
            <section className="exp-preview-section" ref={previewRef}>
              <ExpenseReportPreview
                formData={formData}
                validateForm={validateForm}
                isGenerating={isGenerating}
              />
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExpenseCalculator;
