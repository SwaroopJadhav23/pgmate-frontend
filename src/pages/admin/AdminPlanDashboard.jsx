import { FaTag } from "react-icons/fa";
import { useEffect, useState } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import "./AdminPlanDashboard.css";
import "../../components/PricingPlans.css";
import Swal from "sweetalert2";
import { Users, User, Briefcase, Infinity as InfinityIcon, Building, Gift, Check } from "lucide-react";

const AdminPlanDashboard = () => {
  const [plans, setPlans]           = useState([]);
  const [editModal, setEditModal]   = useState(null);
  const [offerModal, setOfferModal] = useState(null);
  const [offerForm, setOfferForm]   = useState({});
  const [editForm, setEditForm]     = useState({});
  const [newFeature, setNewFeature] = useState("");
  const [saving, setSaving]         = useState(false);


  useEffect(() => { loadPlans(); }, []);

  const loadPlans = async () => {
    const res = await api.get("/admin/plans");
    setPlans(res.data);
  };

const showAlert = (msg, type = "success") => {
  Swal.fire({
    icon: type,
    title:
      type === "success"
        ? "Success"
        : type === "warning"
        ? "Warning"
        : "Error",
    text: msg,
    confirmButtonColor: "#f59e0b", 
  });
};
  /* ── EDIT ── */
  const openEdit  = (plan) => { setEditForm({ ...plan }); setNewFeature(""); setEditModal(plan); };
  const closeEdit = () => { setEditModal(null); setEditForm({}); };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/plans/${editModal.planType}`, editForm);
  showAlert("Plan updated successfully.", "success");
      closeEdit(); loadPlans();
    } catch (err) {
  showAlert(err.response?.data?.message || "Failed to save changes.", "error");
}
    finally { setSaving(false); }
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setEditForm({ ...editForm, features: [...(editForm.features || []), newFeature.trim()] });
    setNewFeature("");
  };

  const removeFeature = (i) => {
    const f = [...editForm.features];
    f.splice(i, 1);
    setEditForm({ ...editForm, features: f });
  };

  /* ── OFFER ── */
const openOffer = (plan) => {
  setOfferForm({
    offerTitle: plan.offerTitle || "",   
    offerDiscountAmount: plan.offerDiscountAmount || "",
    offerDiscountPercent: plan.offerDiscountPercent || "",
    offerValidUntil: Array.isArray(plan.offerValidUntil)
      ? `${plan.offerValidUntil[0]}-${String(plan.offerValidUntil[1]).padStart(2,"0")}-${String(plan.offerValidUntil[2]).padStart(2,"0")}`
      : plan.offerValidUntil || "",
  });
  setOfferModal(plan);
};
  const closeOffer = () => { setOfferModal(null); setOfferForm({}); };

 const applyOffer = async () => {
  const amt = Number(offerForm.offerDiscountAmount) || 0;
  const pct = Number(offerForm.offerDiscountPercent) || 0;

  if (!amt && !pct) {
    showAlert("Enter either discount amount or percent.", "warning");
    return;
  }

  if (amt && pct) {
    showAlert("Choose amount OR percent, not both.", "warning");
    return;
  }

  if (!offerForm.offerValidUntil) {
    showAlert("Select offer expiry date.", "warning");
    return;
  }

  setSaving(true);

  try {
    await api.patch(`/admin/plans/${offerModal.planType}/offer`, null, {
      params: {
        discountAmount: amt || null,
        discountPercent: pct || null,
        validUntil: offerForm.offerValidUntil,
        offerTitle: offerForm.offerTitle || null,
      },
    });

    showAlert("Offer applied successfully.", "success");
    closeOffer();
    loadPlans();

  } catch (err) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      "Something went wrong";

    showAlert(message, "warning");
  } finally {
    setSaving(false);
  }
};

const removeOffer = async (planType) => {
  try {
    await api.delete(`/admin/plans/${planType}/offer`);
    showAlert("Offer removed.", "success");
    loadPlans();
  } catch (err) {
    showAlert("Failed to remove offer.", "warning");
  }
};
 const toggleStatus = async (planType, active) => {
  try {
    await api.patch(`/admin/plans/${planType}/status?active=${!active}`);
    showAlert(`Plan ${!active ? "activated" : "deactivated"}.`, "success");
    loadPlans();
  } catch {
    showAlert("Failed to toggle status.", "warning");
  }
};

  const formatDate = (val) => {
    if (!val) return "—";
    if (Array.isArray(val))
      return new Date(val[0], val[1]-1, val[2]).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
    return new Date(val).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
  };

  return (
    <DashboardLayout title="Plan Management" subtitle="Manage pricing, limits, features and offers">


      {/* ═══════════════════════════════
          EDIT MODAL
      ═══════════════════════════════ */}
      {editModal && (
        <div className="apd-overlay" onClick={(e) => e.target === e.currentTarget && closeEdit()}>
          <div className="apd-modal">
            <div className="apd-modal-header">
              <div>
                <div className="apd-modal-eyebrow">EDIT PLAN</div>
                <h3 className="apd-modal-title">{editModal.planType}</h3>
              </div>
              <button className="apd-close" onClick={closeEdit}>✕</button>
            </div>

            <div className="apd-modal-body">
              <div className="apd-field-grid">
                <div className="apd-field">
                  <label>Plan Title</label>
                  <input value={editForm.title||""} onChange={(e)=>setEditForm({...editForm,title:e.target.value})} placeholder="e.g. Basic"/>
                </div>
                <div className="apd-field">
                  <label>Yearly Price (₹)</label>
                  <div className="apd-input-prefix">
                    <span>₹</span>
                    <input type="number" maxLength="10" value={editForm.yearlyPrice||0} onChange={(e)=>setEditForm({...editForm,yearlyPrice:Number(e.target.value)})}/>
                  </div>
                </div>
                <div className="apd-field">
                  <label>PG Limit <span className="apd-hint">(-1 = Unlimited)</span></label>
                  <input type="number" maxLength="10" value={editForm.pgLimit??0} onChange={(e)=>setEditForm({...editForm,pgLimit:Number(e.target.value)})}/>
                </div>
                <div className="apd-field">
                  <label>Display Order</label>
                  <input type="number" maxLength="10" value={editForm.displayOrder??0} onChange={(e)=>setEditForm({...editForm,displayOrder:Number(e.target.value)})}/>
                </div>
              </div>

              <div className="apd-section">
                <div className="apd-section-label">Plan Features</div>
                <div className="apd-feature-input">
                  <input
                    value={newFeature}
                    onChange={(e)=>setNewFeature(e.target.value)}
                    onKeyDown={(e)=>e.key==="Enter"&&addFeature()}
                    placeholder="Type a feature and press Add…"
                  />
                  <button className="apd-btn apd-btn--sm apd-btn--outline" onClick={addFeature}>Add</button>
                </div>
                <div className="apd-tags">
                  {(editForm.features||[]).map((f,i)=>(
                    <span key={i} className="apd-tag">{f}<button onClick={()=>removeFeature(i)}>✕</button></span>
                  ))}
                  {(editForm.features||[]).length===0 && <span className="apd-no-features">No features added yet</span>}
                </div>
              </div>
            </div>

            <div className="apd-modal-footer">
              <button className="apd-btn apd-btn--ghost"   onClick={closeEdit}>Cancel</button>
              <button className="apd-btn apd-btn--primary" onClick={saveEdit} disabled={saving}
                style={{ display:"flex", alignItems:"center", gap:"8px", opacity: saving ? 0.85 : 1 }}>
                {saving ? (
                  <>
                    <span style={{
                      width:"15px", height:"15px",
                      border:"2px solid rgba(255,255,255,0.4)",
                      borderTopColor:"#fff",
                      borderRadius:"50%",
                      display:"inline-block",
                      animation:"apd-spin 0.7s linear infinite",
                      flexShrink:0,
                    }}/>
                    Saving…
                  </>
                ) : "Save Changes"}
              </button>
              <style>{`@keyframes apd-spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════
          OFFER MODAL
      ═══════════════════════════════ */}
      {offerModal && (
        <div className="apd-overlay" onClick={(e)=>e.target===e.currentTarget&&closeOffer()}>
          <div className="apd-modal apd-modal--offer">
            <div className="apd-modal-header">
              <div>
                <div className="apd-modal-eyebrow offer-eyebrow">PROMOTIONAL OFFER</div>
                <h3 className="apd-modal-title">{offerModal.planType} Plan</h3>
              </div>
              <button className="apd-close" onClick={closeOffer}>✕</button>
            </div>

            <div className="apd-modal-body">
              <div className="apd-offer-notice">
                <span>⚡</span>
                <span>Set either a fixed amount or a percentage discount — not both simultaneously.</span>
              </div>
              <div className="apd-field-grid">
                <div className="apd-field">
                  <label>Discount Amount (₹)</label>
                  <div className="apd-input-prefix">
                    <span>₹</span>
                    <input type="number" maxLength="10" value={offerForm.offerDiscountAmount||""} placeholder="e.g. 500"
                      onChange={(e)=>setOfferForm({...offerForm,offerDiscountAmount:e.target.value?Number(e.target.value):"",offerDiscountPercent:""})}/>
                  </div>
                </div>
                <div className="apd-field">
                  <label>Discount Percent (%)</label>
                  <div className="apd-input-prefix">
                    <span>%</span>
                    <input type="number" maxLength="10" value={offerForm.offerDiscountPercent||""} placeholder="e.g. 20"
                      onChange={(e)=>setOfferForm({...offerForm,offerDiscountPercent:e.target.value?Number(e.target.value):"",offerDiscountAmount:""})}/>
                  </div>
                </div>
                <div className="apd-field">
                  <label>Offer Title</label>
                  <input
                    value={offerForm.offerTitle || ""}
                    placeholder="e.g. Festive Offer"
                    onChange={(e) =>
                      setOfferForm({ ...offerForm, offerTitle: e.target.value })
                    }
                  />
                </div>
                <div className="apd-field">
                  <label>Offer Valid Until</label>
                  <input type="date" value={offerForm.offerValidUntil||""} onChange={(e)=>setOfferForm({...offerForm,offerValidUntil:e.target.value})}/>
                </div>
              </div>

              {offerModal.offerActive && (
                <div className="apd-current-offer">
                  <div className="apd-current-offer-label">Current Active Offer</div>
                  <div className="apd-current-offer-row">
                    <span className="apd-plan-card-offer">
                      {offerModal.offerDiscountAmount?`₹${offerModal.offerDiscountAmount} OFF`:`${offerModal.offerDiscountPercent}% OFF`}
                    </span>
                    <span className="apd-offer-expiry">Valid until {formatDate(offerModal.offerValidUntil)}</span>
                    <button className="apd-btn apd-btn--danger apd-btn--sm" onClick={()=>{removeOffer(offerModal.planType);closeOffer();}}>
                      Remove Offer
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="apd-modal-footer">
              <button className="apd-btn apd-btn--ghost" onClick={closeOffer}>Cancel</button>
              <button className="apd-btn apd-btn--amber" onClick={applyOffer} disabled={saving}
                style={{ display:"flex", alignItems:"center", gap:"8px", opacity: saving ? 0.85 : 1 }}>
                {saving ? (
                  <>
                    <span style={{
                      width:"15px", height:"15px",
                      border:"2px solid rgba(255,255,255,0.4)",
                      borderTopColor:"#fff",
                      borderRadius:"50%",
                      display:"inline-block",
                      animation:"apd-spin 0.7s linear infinite",
                      flexShrink:0,
                    }}/>
                    Applying…
                  </>
                ) : "Apply Offer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════
          PLAN CARDS
      ═══════════════════════════════ */}
      <div className="apd-page-header">
        <span className="apd-page-count">{plans.length} plan{plans.length!==1?"s":""} configured</span>
      </div>

      <div className="apd-plans-grid">
        {plans.map((p, idx) => {
          let finalPrice = p.yearlyPrice;
          let hasValidOffer = false;
          let discountLabel = "";
          const today = new Date();

          if (p.offerActive && p.offerValidUntil && new Date(p.offerValidUntil) >= today) {
            hasValidOffer = true;
            if (p.offerDiscountAmount) {
              finalPrice = p.yearlyPrice - p.offerDiscountAmount;
              discountLabel = `${p.offerTitle || "Special Offer"} – Save ₹${p.offerDiscountAmount.toLocaleString()}`;
            } else if (p.offerDiscountPercent) {
              finalPrice = p.yearlyPrice - (p.yearlyPrice * p.offerDiscountPercent) / 100;
              discountLabel = `${p.offerTitle || "Special Offer"} – ${p.offerDiscountPercent}% OFF`;
            }
          }
          if (finalPrice < 0) finalPrice = 0;

          return (
            <div key={p.planType} className="pricing-card-wrapper" style={{ margin: "0 auto", width: "100%", maxWidth: "300px" }}>
              <div
                className={`pricing-card ${!p.active ? "card-disabled" : ""} ${hasValidOffer ? "card-offer" : ""}`}
                style={{ "--card-index": idx, display: "flex", flexDirection: "column", height: "100%" }}
              >
                {!p.active && <div className="badge badge-current" style={{background: "#dc2626"}}>Inactive</div>}
                {p.active && <div className="badge badge-current" style={{background: "#16a34a"}}>Active</div>}

                <div className="card-top-section" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <div className="card-top">
                    <div className={`plan-head-row head-${p.planType.toLowerCase()}`}>
                      <span className={`plan-icon icon-${p.planType.toLowerCase()}`}>
                        {p.planType === "BASIC" ? <User size={28} /> : p.planType === "PRO" ? <Briefcase size={28} /> : <InfinityIcon size={28} />}
                      </span>
                      <h3 className={`plan-name name-${p.planType.toLowerCase()}`}>{p.title || p.planType}</h3>
                    </div>
                    <p className="plan-tagline" style={{textAlign: "center"}}>
                      {p.planType === "BASIC" ? "For individual PG owners" : p.planType === "PRO" ? "For growing PG businesses" : "For professional operators"}
                    </p>
                  </div>

                  <div className="plan-price-block">
                    {hasValidOffer && (
                      <span className="price-original">₹{p.yearlyPrice.toLocaleString()}</span>
                    )}
                    <div className="price-main">
                      <span className="price-currency">₹</span>
                      <span className="price-amount">{Math.round(finalPrice).toLocaleString()}</span>
                      <span className="price-cycle">/year</span>
                    </div>
                  </div>

                  {hasValidOffer && (
                    <div className={`offer-strip offer-${p.planType.toLowerCase()}`}>
                      <Gift size={16} style={{marginRight: "4px"}} />
                      {discountLabel}
                    </div>
                  )}

                  <div className={`plan-shaded-box box-${p.planType.toLowerCase()}`} style={{ marginTop: "auto", marginBottom: "14px" }}>
                    <div className="plan-row"><Building size={16} /> {p.pgLimit < 0 ? "Unlimited PGs" : `${p.pgLimit} PG${p.pgLimit !== 1 ? "s" : ""}`}</div>
                    <div className="plan-row"><Users size={16} /> Unlimited Tenants</div>
                    <div className="plan-row"><User size={16} /> {p.planType === "PRO" ? "Unlimited Staff Logins" : "5 Staff Logins"}</div>
                  </div>

                  <div style={{borderTop: "1px dashed #e2e8f0", paddingTop: "14px", marginBottom: "14px"}}></div>

                  <ul className="plan-features" style={{marginBottom: "20px"}}>
                    {(p.features || []).map((f, i) => (
                      <li key={i}>
                        <span className={`feat-icon check-${p.planType.toLowerCase()}`}><Check size={16} /></span>
                        <span dangerouslySetInnerHTML={{__html: f}}></span>
                      </li>
                    ))}
                    <li style={{marginTop: "10px", opacity: 0.6}}>
                        <span className={`feat-icon`}><Check size={16} /></span>
                        <span>Order #{p.displayOrder}</span>
                    </li>
                  </ul>

                  <div className="apd-plan-card-spacer" style={{flex: 1}} />
                  <div style={{borderTop: "1px dashed #e2e8f0", paddingTop: "14px", marginTop: "auto"}}></div>
                  
                  <div className="apd-plan-card-actions">
                    <button className="apd-action-btn" onClick={()=>openEdit(p)}>✎ Edit</button>
                    <button className="apd-action-btn apd-action-btn--offer" onClick={()=>openOffer(p)}><FaTag /> Offer</button>
                    <button
                      className={`apd-action-btn ${p.active?"apd-action-btn--deact":"apd-action-btn--act"}`}
                      onClick={()=>toggleStatus(p.planType,p.active)}
                    >
                      {p.active?"⏸ Pause":"▶ Activate"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </DashboardLayout>
  );
};

export default AdminPlanDashboard;