import { useEffect, useMemo, useState, useRef } from "react";
import api from "../../api/axios";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import BedPickerPopup from "./BedPickerPopup";
import { useNavigate } from "react-router-dom";
import { Info, AlertTriangle } from "lucide-react";
import "./reserveSeatModal.css";

// eslint-disable-next-line no-unused-vars
const BedIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v5" />
    <path d="M2 20v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5" />
    <path d="M2 13h20" />
    <path d="M7 13v7" />
    <path d="M17 13v7" />
  </svg>
);


const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

// eslint-disable-next-line no-unused-vars
const FF = "'DM Sans', 'Segoe UI', sans-serif";
const RUPEE = "\u20B9";
const formatMoney = (value) => `${RUPEE}${Number(value || 0).toLocaleString("en-IN")}`;

const ReserveSeatModal = ({ pg, sharingType: initialSharingType, selectedBeds = [], onClose }) => {
  const [user, setUser] = useState(null);
  const [showBedPicker, setShowBedPicker] = useState(false);
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedBedId, setSelectedBedId] = useState("");
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedSharing, setSelectedSharing] = useState(initialSharingType || "");
  const [stayType, setStayType] = useState(pg?.reservationEnabled ? "MONTHLY_BASIC" : "DAILY_BASIC");
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [checkinDate, setCheckinDate] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [errors, setErrors] = useState({});

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const bedRef = useRef(null);
  const checkinDateRef = useRef(null);
  const numberOfDaysRef = useRef(null);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const supportsMonthly = !!pg?.reservationEnabled;
  const supportsDaily = !!pg?.dailyReservationEnabled;
  const isDaily = stayType === "DAILY_BASIC";
  const roomMissingDailyPrice = !!selectedRoom && !Number(selectedRoom?.dailyRent || 0);
  const reservationAmt = Number(pg?.reservationAmount || 0);

  useEffect(() => {
    if (selectedBeds.length > 0 && pg?.floors) {
      const firstBedId = selectedBeds[0];
      let foundBed = null;
      let foundRoom = null;
      let foundFloor = null;

      for (const floor of pg.floors) {
        for (const room of floor.rooms || []) {
          for (const bed of room.beds || []) {
            if (String(bed.bedId) === String(firstBedId)) {
              foundBed = bed;
              foundRoom = room;
              foundFloor = floor;
              break;
            }
          }
          if (foundBed) break;
        }
        if (foundBed) break;
      }

      if (foundBed && foundRoom && foundFloor) {
        setSelectedBedId(firstBedId);
        setSelectedBed(foundBed);
        setSelectedRoomId(foundRoom.roomId);
        setSelectedRoom(foundRoom);
        setSelectedFloorId(foundFloor.floorId);
        setSelectedFloor(foundFloor);
        setSelectedSharing(foundRoom.sharingType);
      }
    }
  }, [selectedBeds, pg]);

  useEffect(() => {
    api
      .get("/users/me")
      .then((res) => {
        if (!res.data.profileCompleted) {
          Swal.fire({ title: "Profile Incomplete", text: "Please complete your profile to reserve a seat", icon: "warning" }).then(() => {
            window.location.href = "/profile";
          });
        } else {
          setUser(res.data);
        }
      })
      .catch(() => {
        toast.error("Unable to load user profile");
        onClose();
      });
  }, [onClose]);

  useEffect(() => {
    if (!supportsMonthly && supportsDaily) {
      setStayType("DAILY_BASIC");
      return;
    }
    if (supportsMonthly && !supportsDaily) {
      setStayType("MONTHLY_BASIC");
    }
  }, [supportsMonthly, supportsDaily]);

  const handleBedConfirm = ({ floor, room, bed, floorId, roomId, bedId, sharingType }) => {
    setSelectedFloor(floor);
    setSelectedFloorId(floorId);
    setSelectedRoom(room);
    setSelectedRoomId(roomId);
    setSelectedBed(bed);
    setSelectedBedId(bedId);
    setSelectedSharing(sharingType);
    setShowBedPicker(false);
    if (errors.bed) setErrors((prev) => ({ ...prev, bed: null }));
  };

  const totalStayAmount = useMemo(() => {
    if (!selectedRoom) return 0;
    if (isDaily) {
      return Number(selectedRoom.dailyRent || 0) * Number(numberOfDays || 0);
    }
    return Number(selectedRoom.monthlyRent || 0) + Number(selectedRoom.deposit || 0);
  }, [selectedRoom, isDaily, numberOfDays]);

  const expectedCheckoutDate = useMemo(() => {
    if (!checkinDate) return "";
    const next = new Date(checkinDate);
    if (isDaily) next.setDate(next.getDate() + Number(numberOfDays || 0));
    else next.setMonth(next.getMonth() + 1);
    return next.toISOString().split("T")[0];
  }, [checkinDate, isDaily, numberOfDays]);

  const selectedBedSummary = useMemo(() => {
    if (!selectedRoom) return [];
    if (isDaily) {
      return [
        { label: "Daily Charge", value: `${formatMoney(selectedRoom.dailyRent)}/day`, tone: "green" },
        { label: "Days", value: `${numberOfDays || 0} day(s)` },
      ];
    }
    return [
      { label: "Monthly Rent", value: `${formatMoney(selectedRoom.monthlyRent)}/mo`, tone: "green" },
      { label: "Deposit", value: formatMoney(selectedRoom.deposit), tone: "amber" },
    ];
  }, [selectedRoom, isDaily, numberOfDays]);

  const handleMockPayment = async () => {
    const result = await Swal.fire({
      title: "Confirm Reservation Payment",
      html: `
        <div style="text-align:left;font-size:14px;line-height:1.7">
          <p>You are paying a <strong>reservation token</strong> to secure your bed.</p>
          <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:10px 14px;margin:10px 0">
            <div style="font-size:11px;font-weight:800;color:#166534;letter-spacing:0.06em">AMOUNT TO PAY</div>
            <div style="font-size:22px;font-weight:900;color:#15803d">${formatMoney(reservationAmt)}</div>
          </div>
          <p style="font-size:12px;color:#64748b">This is a <strong>reservation token</strong>, not your stay amount.</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `Yes, Pay ${formatMoney(reservationAmt)}`,
      cancelButtonText: "Cancel",
      confirmButtonColor: "#6366f1",
    });

    if (!result.isConfirmed) {
      setPaymentConfirmed(false);
      return;
    }

    setPaymentConfirmed(true);

    try {
      const checkinDateStr = checkinDate; // Already in YYYY-MM-DD format
      const stayTypeStr = stayType; // e.g., "MONTHLY_BASIC"

      const checkoutResponse = await api.post(`/user/pgs/${pg.id}/reserve/checkout`, null, {
        params: {
          floorId: selectedFloorId,
          roomId: selectedRoomId,
          bedId: selectedBedId,
          checkinDate: checkinDateStr,
          stayType: stayTypeStr,
          ...(isDaily && { numberOfDays }),
        },
      });

      if (checkoutResponse.data.redirectUrl) {
        // Redirect to PhonePe
        window.location.href = checkoutResponse.data.redirectUrl;
      } else {
        throw new Error("No redirect URL received from server");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error.response?.data?.message || "Failed to initiate payment");
    }
  };

  const submit = async () => {
    const newErrors = {};
    if (!selectedFloorId || !selectedRoomId || !selectedBedId) {
      newErrors.bed = "This field needs to be filled";
    }
    if (!checkinDate) {
      newErrors.checkinDate = "This field needs to be filled";
    }
    if (isDaily) {
      if (!numberOfDays || Number(numberOfDays) <= 0) {
        newErrors.numberOfDays = "This field needs to be filled";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast("Please fill all required fields", { icon: <Info size={18} color="#6366f1" /> });
      
      setTimeout(() => {
        if (newErrors.bed && bedRef.current) {
          bedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (newErrors.checkinDate && checkinDateRef.current) {
          checkinDateRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (newErrors.numberOfDays && numberOfDaysRef.current) {
          numberOfDaysRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);

      return;
    }

    if (isDaily && !Number(selectedRoom?.dailyRent || 0)) {
      toast("Daily pricing is not configured for this room yet. Please choose another bed or switch back to monthly.", { icon: <AlertTriangle size={18} color="#f59e0b" /> });
      return;
    }

    setLoading(true);
    try {
      await handleMockPayment();
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const steps = [
    { done: stayType === "MONTHLY_BASIC" || stayType === "DAILY_BASIC", label: "Stay" },
    { done: !!selectedBedId, label: "Bed" },
    { done: !!checkinDate, label: "Date" },
    { done: paymentConfirmed, label: "Payment" },
  ];

  const stayButtons = [
    supportsMonthly && { key: "MONTHLY_BASIC", label: "Monthly Basic", subLabel: "Monthly rent + deposit" },
    supportsDaily && { key: "DAILY_BASIC", label: "Daily Basic", subLabel: "Daily charge x selected days" },
  ].filter(Boolean);

  return (
    <>
      <div className="reserve-modal-overlay" onClick={onClose}>
        <div className="reserve-modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="reserve-modal-header">
            <div>
              <div className="reserve-modal-title">Reserve Your Bed</div>
              <div className="reserve-modal-subtitle">{pg.name}</div>
            </div>
            <button type="button" onClick={onClose} className="reserve-modal-close">
              <CloseIcon />
            </button>
          </div>
          <div className="reserve-modal-body">


            <div>
              <label className="reserve-form-label">GUEST DETAILS</label>
              <div className="reserve-input-group">
                <input className="reserve-input" value={user.name} disabled />
                <input className="reserve-input" value={user.phone} disabled />
              </div>
            </div>

            <div className="reserve-divider" />

            <div>
              <label className="reserve-form-label">STAY TYPE</label>
              <div style={{ display: "grid", gridTemplateColumns: stayButtons.length > 1 ? "1fr 1fr" : "1fr", gap: 8 }}>
                {stayButtons.map((option) => {
                  const active = stayType === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setStayType(option.key)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 11,
                        border: active ? "1.5px solid #6366f1" : "1.5px solid #dbe2f0",
                        background: active ? "#eef2ff" : "#fff",
                        color: active ? "#4338ca" : "#475569",
                        fontWeight: 800,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ fontSize: 14 }}>{option.label}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: active ? "#6366f1" : "#94a3b8", marginTop: 4 }}>{option.subLabel}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {isDaily && (
              <div ref={numberOfDaysRef}>
                <label className="reserve-form-label">NUMBER OF DAYS</label>
                <input 
                  type="number" 
                  min="1" 
                  className="reserve-input" 
                  style={errors.numberOfDays ? { borderColor: 'red' } : {}}
                  value={numberOfDays} 
                  onChange={(e) => {
                    setNumberOfDays(e.target.value);
                    if (errors.numberOfDays) setErrors((prev) => ({ ...prev, numberOfDays: null }));
                  }} 
                />
                {errors.numberOfDays && <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.numberOfDays}</div>}
              </div>
            )}

            <div className="reserve-divider" />

            <div ref={bedRef}>
              <label className="reserve-form-label">BED SELECTION</label>
              {selectedBedId ? (
                <div>
                  <label className="reserve-form-label">SELECTED BED</label>
                  <div className="reserve-bed-box">
                    <div className="reserve-bed-details">
                      <div className="reserve-bed-item"><div className="reserve-bed-item-label">Floor</div><div className="reserve-bed-item-value">Floor {selectedFloor?.floorNumber}</div></div>
                      <div className="reserve-bed-item"><div className="reserve-bed-item-label">Room</div><div className="reserve-bed-item-value">Room {selectedRoom?.roomNumber}</div></div>
                      <div className="reserve-bed-item"><div className="reserve-bed-item-label">Bed</div><div className="reserve-bed-item-value">Bed {selectedBed?.bedNumber}</div></div>
                      {selectedBedSummary.map((item) => (
                        <div key={item.label} className="reserve-bed-item">
                          <div className="reserve-bed-item-label">{item.label}</div>
                          <div className={`reserve-bed-item-value ${item.tone === "amber" ? "is-amber" : item.tone === "green" ? "is-green" : ""}`}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => setShowBedPicker(true)} className="reserve-bed-change-btn">
                      <EditIcon /> Change
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button 
                    type="button" 
                    onClick={() => setShowBedPicker(true)} 
                    className="reserve-bed-pick-btn"
                    style={errors.bed ? { borderColor: 'red' } : {}}
                  >
                    <BedIcon size={16} /> Pick a Bed from Availability
                  </button>
                  {errors.bed && <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.bed}</div>}
                </div>
              )}

              {isDaily && roomMissingDailyPrice && (
                <div className="reserve-price-warning">
                  <AlertTriangle size={16} color="#ef4444" style={{ marginRight: 6 }} /> Daily pricing is missing for this room.
                </div>
              )}
            </div>

            <div className="reserve-divider" />

            <div ref={checkinDateRef}>
              <label className="reserve-form-label">CHECK-IN DATE</label>
              <input 
                type="date" 
                value={checkinDate} 
                onChange={(e) => {
                  setCheckinDate(e.target.value);
                  if (errors.checkinDate) setErrors((prev) => ({ ...prev, checkinDate: null }));
                }} 
                className="reserve-input" 
                style={errors.checkinDate ? { borderColor: 'red' } : {}}
                min={new Date().toISOString().split("T")[0]} 
              />
              {errors.checkinDate && <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.checkinDate}</div>}
            </div>

            {isDaily && (
              <div>
                <label className="reserve-form-label">NUMBER OF DAYS</label>
                <input 
                  type="number" 
                  min="1" 
                  value={numberOfDays} 
                  onChange={(e) => {
                    setNumberOfDays(Number(e.target.value));
                    if (errors.numberOfDays) setErrors((prev) => ({ ...prev, numberOfDays: null }));
                  }} 
                  className="reserve-input" 
                  style={errors.numberOfDays ? { borderColor: 'red' } : {}}
                />
                {errors.numberOfDays && <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.numberOfDays}</div>}
              </div>
            )}

            <div className="reserve-summary-box">
              <div className="reserve-summary-row"><span>Stay Amount</span><strong>{formatMoney(totalStayAmount)}</strong></div>
              <div className="reserve-summary-row"><span>Reservation Token</span><strong>{formatMoney(reservationAmt)}</strong></div>
              <div className="reserve-summary-row"><span>Expected Checkout</span><strong>{expectedCheckoutDate || "-"}</strong></div>
            </div>

            <div className="reserve-pay-box">
              <div>
                <div className="reserve-pay-label">AMOUNT TO PAY NOW</div>
                <div className="reserve-pay-amount">
                  {formatMoney(reservationAmt)}
                  <span className="reserve-pay-subtext">reservation token</span>
                </div>
              </div>
              <div className="reserve-pay-icon">₹</div>
            </div>

            {totalStayAmount > reservationAmt && (
              <div className="reserve-pay-alert">
                <span>The remaining {formatMoney(totalStayAmount - reservationAmt)} will be collected at the property.</span>
              </div>
            )}

            {paymentConfirmed && (
              <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 10, padding: "9px 13px", fontSize: 13, fontWeight: 700, color: "#16a34a", display: "flex", alignItems: "center", gap: 7 }}>
                Payment initiated. Redirecting to PhonePe...
              </div>
            )}

            <div className="reserve-steps">
              {steps.map(({ done, label }) => (
                <div key={label} className="reserve-step-item">
                  <div className={`reserve-step-line ${done ? "is-done" : "is-pending"}`} />
                  <span className={`reserve-step-label ${done ? "is-done" : "is-pending"}`}>{label}</span>
                </div>
              ))}
            </div>

            <div className="reserve-divider" />

            {/* CHECKBOX — between progress bar and Pay button */}
            <label className={`reserve-terms-label ${agreedToTerms ? "is-agreed" : "not-agreed"}`}>
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="reserve-terms-check"
              />
              <span className="reserve-terms-text">
                I have read and agree to the{" "}
                <button type="button"
                  onClick={() => {
                    onClose();
                    navigate("/terms-and-conditions", {
                      state: { scrollTo: "auto-cancellation" },
                    });
                  }}
                  style={{
                    background: "none", border: "none", padding: 0, margin: 0, color: "#6366f1", fontWeight: 700, cursor: "pointer", font: "inherit",
                  }}>
                  auto-cancellation policy
                </button>
                {" "}and{" "}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/terms-and-conditions", {
                      state: { scrollTo: "no-refund" },
                    });
                  }}
                  style={{
                    background: "none", border: "none", padding: 0, margin: 0, color: "#6366f1", fontWeight: 700, cursor: "pointer", font: "inherit",
                  }}>
                  no-refund policy
                </button>
              </span>
            </label>

            <button type="button" onClick={submit} disabled={loading || !agreedToTerms} className="reserve-submit-btn">
              {loading ? "Reserving..." : "Pay and Confirm"}
            </button>

            <button type="button" onClick={onClose} className="reserve-cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      </div>

      {showBedPicker && (
        <BedPickerPopup
          pg={pg}
          stayType={stayType}
          initialSharingType={selectedSharing || initialSharingType}
          currentBedId={selectedBedId}
          currentRoomId={selectedRoomId}
          onConfirm={handleBedConfirm}
          onClose={() => setShowBedPicker(false)}
        />
      )}
    </>
  );
};

export default ReserveSeatModal;
