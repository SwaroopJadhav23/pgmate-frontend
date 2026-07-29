import {FaRocket, FaLock} from "react-icons/fa";
import {NavLink, useNavigate} from "react-router-dom";
import {useEffect, useState, useRef, useContext} from "react";
import {AuthContext} from "../context/AuthContext";
import api from "../api/axios";
import {useLocation} from "react-router-dom";
import "./layout.css";
import "./sidebar-owner-manager.css";
import {
  LayoutDashboard,
  Building,
  Bed,
  Users,
  FileText,
  LogOut,
  UserCog,
  PlusCircle,
  X,
  ClipboardList,
  MessageSquare,
  Wallet,
  Key,
  Gift,
  Mail,
  MapPin,
  UserX,
} from "lucide-react";



const Sidebar = ({open, setOpen}) => {
  const [managerAccessBlocked, setManagerAccessBlocked] = useState(false);
  // ✅ Dismissible expiry NOTICE — closing this only hides the popup.
  // subscriptionExpired itself (from context) stays true so card clicks still redirect.
  const [showExpiryNotice, setShowExpiryNotice] = useState(false);

  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const panelTitle =
    role === "SUPER_ADMIN"
      ? "Admin Panel"
      : role === "SUB_ADMIN"
        ? "Sub-Admin Panel"
        : role === "PG_MANAGER"
          ? "Manager Panel"
          : "";

  const {
    owner,
    logout: authLogout,
    subscriptionExpired,
    refreshSubscriptionStatus,
  } = useContext(AuthContext);
  const sidebarRef = useRef(null);
  const location = useLocation();

  /* Logout — single source of truth, clears both state + storage once */
  const logout = () => {
    authLogout();
    localStorage.clear();
    navigate("/login");
  };



  /* Close sidebar on mobile */
  const closeMobile = () => {
    if (window.innerWidth <= 768) {
      setOpen(false);
    }
  };
  useEffect(() => {
    const sidebar = sidebarRef.current;

    const saveScroll = () => {
      localStorage.setItem("sidebarScroll", sidebar.scrollTop);
    };

    sidebar?.addEventListener("scroll", saveScroll);

    return () => {
      sidebar?.removeEventListener("scroll", saveScroll);
    };
  }, []);
  useEffect(() => {
    const sidebar = sidebarRef.current;
    const saved = localStorage.getItem("sidebarScroll");

    if (sidebar && saved) {
      sidebar.scrollTop = parseInt(saved);
    }
  }, [location]);

  useEffect(() => {
    if (role !== "PG_MANAGER") return;
    api
      .get("/manager/dashboard/owner-subscription-status")
      .then((res) => {
        if (!res.data?.active) {
          setManagerAccessBlocked(true);
        }
      })
      .catch(() => {});
  }, [role]);

  useEffect(() => {
    if (role !== "OWNER") return;
    refreshSubscriptionStatus().then((active) => {
      if (!active) setShowExpiryNotice(true);
    });
  }, [role, refreshSubscriptionStatus]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);



  return (
    <>
      {/* ✅ OWNER EXPIRY NOTICE — dismissible, does NOT block dashboard */}
      {showExpiryNotice &&
        subscriptionExpired &&
        role === "OWNER" &&
        location.pathname !== "/owner/pricing" && (
          <div
            className="expiry-blocker-overlay"
            onClick={() => setShowExpiryNotice(false)}
          >
            <div
              className="expiry-blocker-box"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="expiry-blocker-close"
                aria-label="Close"
                onClick={() => setShowExpiryNotice(false)}
              >
                ✕
              </button>
              <div className="expiry-blocker-icon">
                <svg
                  width="42"
                  height="42"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 2h12M6 22h12M8 2c0 4 4 6 4 8s-4 4-4 8M16 2c0 4-4 6-4 8s4 4 4 8"
                    stroke="#F97316"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.5 4h7l-1 4h-5l-1-4zM8.5 20h7l-1-4h-5l-1 4z"
                    fill="#FDBA74"
                    opacity="0.5"
                  />
                </svg>
              </div>
              <h2>Your Subscription Has Expired</h2>
              <p>
                Your plan has expired and your PG listings have been hidden from
                the public. Renew or upgrade your plan to restore access and
                make your listings live again.
              </p>
              <button
                className="expiry-blocker-btn"
                onClick={() => {
                  setShowExpiryNotice(false);
                  navigate("/owner/pricing");
                }}
              >
                <FaRocket /> Upgrade / Renew Plan
              </button>
            </div>
          </div>
        )}

      {/* ✅ MANAGER ACCESS BLOCKER */}
      {managerAccessBlocked && role === "PG_MANAGER" && (
        <div className="expiry-blocker-overlay">
          <div className="expiry-blocker-box">
            <div className="expiry-blocker-icon">
              <FaLock />
            </div>
            <h2>Access Temporarily Unavailable</h2>
            <p>
              Your dashboard access is currently restricted. Please get in touch
              with your PG owner for further details and assistance.
            </p>
            <button
              className="expiry-blocker-btn"
              style={{background: "#334155"}}
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {open && (
        <div className="sidebar-overlay" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`sidebar 
        ${open ? "open" : ""} 
        ${role === "OWNER" ? "owner-theme" : ""} 
        ${role === "PG_MANAGER" ? "manager-theme" : ""}`}
      >
        <button className="sidebar-close" onClick={() => setOpen(false)}>
          <X size={22} />
        </button>

        <div className="sidebar-top" ref={sidebarRef}>
          {role === "OWNER" && owner && (
            <NavLink
              to="/owner/dashboard/profile"
              className="sidebar-profile"
              onClick={closeMobile}
            >
              <img
                src={
                  owner.photoUrl ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                alt="Owner"
                className="sidebar-avatar"
              />

              <div style={{width: "100%"}}>
                <div className="sidebar-owner-name">{owner.name}</div>
                <div className="sidebar-profile-sub">View Profile</div>
              </div>
            </NavLink>
          )}

          {panelTitle && <div className="sidebar-logo">{panelTitle}</div>}

          <nav className="sidebar-menu">
            {role === "OWNER" && (
              <>
                <NavItem
                  icon={<LayoutDashboard size={18} />}
                  to="/owner/dashboard"
                  label="Dashboard"
                  close={closeMobile}
                  subscriptionExpired={subscriptionExpired}
                />
                <NavItem
                  icon={<Building size={18} />}
                  to="/owner/pgs"
                  label="My PGs"
                  close={closeMobile}
                  subscriptionExpired={subscriptionExpired}
                />
                <NavItem
                  icon={<Building size={18} />}
                  to="/owner/rooms"
                  label="Manage Rooms"
                  close={closeMobile}
                  subscriptionExpired={subscriptionExpired}
                />
                <NavItem
                  icon={<Bed size={18} />}
                  to="/owner/available-beds"
                  label="Available Beds"
                  close={closeMobile}
                  subscriptionExpired={subscriptionExpired}
                />
                <NavItem
                  icon={<Users size={18} />}
                  to="/owner/residents"
                  label="Tenants"
                  close={closeMobile}
                  subscriptionExpired={subscriptionExpired}
                />
                <NavItem
                  icon={<ClipboardList size={18} />}
                  to="/owner/bookings"
                  label="Bookings"
                  close={closeMobile}
                  subscriptionExpired={subscriptionExpired}
                />
                <NavItem
                  icon={<FileText size={18} />}
                  to="/owner/rent"
                  label="Dues"
                  close={closeMobile}
                  subscriptionExpired={subscriptionExpired}
                />
                <NavItem
                  icon={<FileText size={18} />}
                  to="/owner/whatsapp-reminders"
                  label="WhatsApp Rent Reminders"
                  close={closeMobile}
                  subscriptionExpired={subscriptionExpired}
                />
                <NavItem
                  icon={<LayoutDashboard size={18} />}
                  to="/owner/ownerRevenue"
                  label="Revenue"
                  close={closeMobile}
                  subscriptionExpired={subscriptionExpired}
                />
                <NavItem
                  icon={<Gift size={18} />}
                  to="/owner/pricing"
                  label="Subscription"
                  close={closeMobile}
                  subscriptionExpired={subscriptionExpired}
                />
                <NavItem
                  icon={<FileText size={18} />}
                  to="/owner/checkout-records"
                  label="Checkout Records"
                  close={closeMobile}
                  subscriptionExpired={subscriptionExpired}
                />
                <NavItem
                  icon={<FileText size={18} />}
                  to="/owner/enquiries"
                  label="Enquiries"
                  close={closeMobile}
                  subscriptionExpired={subscriptionExpired}
                />
                <NavItem
                  icon={<MessageSquare size={18} />}
                  to="/owner/complaints"
                  label="Complaints"
                  close={closeMobile}
                  subscriptionExpired={subscriptionExpired}
                />
                <NavItem
                  icon={<Users size={18} />}
                  to="/owner/managers"
                  label="Caretakers"
                  close={closeMobile}
                  subscriptionExpired={subscriptionExpired}
                />
                <NavItem
                  icon={<Gift size={18} />}
                  to="/owner/offers"
                  label="Offers"
                  close={closeMobile}
                  subscriptionExpired={subscriptionExpired}
                />
                <NavItem
                  icon={<Gift size={18} />}
                  to="/owner/sponsorship"
                  label="Sponsorship"
                  close={closeMobile}
                  subscriptionExpired={subscriptionExpired}
                />
                <NavItem
                  icon={<Gift size={18} />}
                  to="/owner/referrals"
                  label="Refer & Earn"
                  close={closeMobile}
                  subscriptionExpired={subscriptionExpired}
                />
                <NavItem
                  icon={<FileText size={18} />}
                  to="/owner/verification"
                  label="PG Verification"
                  close={closeMobile}
                  subscriptionExpired={subscriptionExpired}
                />
                <NavItem
                  icon={<FileText size={18} />}
                  to="/owner/purchase-history"
                  label="Purchase History"
                  close={closeMobile}
                  subscriptionExpired={subscriptionExpired}
                />
                <NavItem
                  icon={<FileText size={18} />}
                  to="/owner/help"
                  label="Help & Support"
                  close={closeMobile}
                  subscriptionExpired={subscriptionExpired}
                />
                <NavItem
                  icon={<UserCog size={18} />}
                  to="/owner/dashboard/profile"
                  label="Profile Settings"
                  close={closeMobile}
                  subscriptionExpired={subscriptionExpired}
                />


              </>
            )}

            {role === "SUPER_ADMIN" && (
              <>
                <NavItem
                  icon={<LayoutDashboard size={18} />}
                  to="/admin/dashboard"
                  label="Dashboard"
                  close={closeMobile}
                />
                <NavItem
                  icon={<LayoutDashboard size={18} />}
                  to="/admin/adminRevenue"
                  label="Revenue"
                  close={closeMobile}
                />
                <NavItem
                  icon={<UserCog size={18} />}
                  to="/admin/owners"
                  label="PG Owners"
                  close={closeMobile}
                />
                <NavItem
                  icon={<Building size={18} />}
                  to="/admin/pg-control"
                  label="PG Management"
                  close={closeMobile}
                />
                <NavItem
                  icon={<Building size={18} />}
                  to="/admin/all-pgs"
                  label="All PGs"
                />
                <NavItem
                  icon={<MapPin size={18} />}
                  to="/admin/locality-manager"
                  label="Locality Manager"
                  close={closeMobile}
                />
                <NavItem
                  icon={<FileText size={18} />}
                  to="/admin/verifications"
                  label="PG Verifications"
                  close={closeMobile}
                />
                <NavItem
                  icon={<Gift size={18} />}
                  to="/admin/offers"
                  label="Offers"
                  close={closeMobile}
                />
                <NavItem
                  icon={<Wallet size={18} />}
                  to="/admin/feature-transactions"
                  label="Feature Transactions"
                  close={closeMobile}
                />
                <NavItem
                  icon={<Gift size={18} />}
                  to="/admin/priority-control"
                  label="PG Priority Control"
                  close={closeMobile}
                />
                <NavItem
                  icon={<Building size={18} />}
                  to="/admin/plans"
                  label="Subscription Plans"
                  close={closeMobile}
                />
                <NavItem
                  icon={<Users size={18} />}
                  to="/admin/users"
                  label="Users"
                  close={closeMobile}
                />
                <NavItem
                  icon={<UserX size={18} />}
                  to="/admin/deletion-requests"
                  label="Deletion Requests"
                  close={closeMobile}
                />
                <NavItem
                  icon={<Users size={18} />}
                  to="/admin/sub-admins"
                  label="Sub Admins"
                  close={closeMobile}
                />
                <NavItem
                  icon={<FileText size={18} />}
                  to="/admin/owner-enquiries"
                  label="Owner Enquiries"
                  close={closeMobile}
                />
                <NavItem
                  icon={<MessageSquare size={18} />}
                  to="/admin/admin-enquiries"
                  label="PG Enquiries"
                  close={closeMobile}
                />
                <NavItem
                  icon={<Mail size={18} />}
                  to="/admin/contact-messages"
                  label="Contact Messages"
                  close={closeMobile}
                />
                <NavItem
                  icon={<Gift size={18} />}
                  to="/admin/reservations"
                  label="Reservations"
                  close={closeMobile}
                />
                <NavItem
                  icon={<Gift size={18} />}
                  to="/admin/referrals"
                  label="Referral Management"
                  close={closeMobile}
                />
                <NavItem
                  icon={<Wallet size={18} />}
                  to="/admin/withdrawals"
                  label="Withdrawals"
                  close={closeMobile}
                />
                <NavItem
                  icon={<FileText size={18} />}
                  to="/admin/purchase-history"
                  label="Purchase History"
                  close={closeMobile}
                />
                <NavItem
                  icon={<Key size={18} />}
                  to="/admin/owner-password-reset"
                  label="Account Control"
                  close={closeMobile}
                />
                <NavItem
                  icon={<MessageSquare size={18} />}
                  to="/admin/complaints"
                  label="Tenant Complaints"
                  close={closeMobile}
                />
                <NavItem
                  icon={<FileText size={18} />}
                  to="/admin/manage-ui"
                  label="Manage UI"
                  close={closeMobile}
                />
                <NavItem
                  icon={<UserCog size={18} />}
                  to="/admin/profile"
                  label="Profile"
                  close={closeMobile}
                />


              </>
            )}

            {role === "SUB_ADMIN" && (
              <>
                <NavItem
                  icon={<LayoutDashboard size={18} />}
                  to="/subadmin/dashboard"
                  label="Dashboard"
                  close={closeMobile}
                />
                <NavItem
                  icon={<Building size={18} />}
                  to="/subadmin/pg-control"
                  label="PG Management"
                  close={closeMobile}
                />
                <NavItem
                  icon={<Building size={18} />}
                  to="/subadmin/all-pgs"
                  label="All PGs"
                  close={closeMobile}
                />
                <NavItem
                  icon={<FileText size={18} />}
                  to="/subadmin/verifications"
                  label="PG Verifications"
                  close={closeMobile}
                />
                <NavItem
                  icon={<FileText size={18} />}
                  to="/subadmin/owner-enquiries"
                  label="Owner Enquiries"
                  close={closeMobile}
                />
                <NavItem
                  icon={<MessageSquare size={18} />}
                  to="/subadmin/admin-enquiries"
                  label="PG Enquiries"
                  close={closeMobile}
                />
                <NavItem
                  icon={<PlusCircle size={18} />}
                  to="/subadmin/add-owner"
                  label="Add Owner"
                  close={closeMobile}
                />
                <NavItem
                  icon={<Mail size={18} />}
                  to="/subadmin/contact-messages"
                  label="Contact Messages"
                  close={closeMobile}
                />


              </>
            )}

            {role === "PG_MANAGER" && (
              <>
                <NavItem
                  icon={<LayoutDashboard size={18} />}
                  to="/manager/dashboard"
                  label="Dashboard"
                  close={closeMobile}
                />
                <NavItem
                  icon={<FileText size={18} />}
                  to="/manager/pgs"
                  label="PGs"
                  close={closeMobile}
                />
                <NavItem
                  icon={<Bed size={18} />}
                  to="/manager/rooms"
                  label="Rooms"
                  close={closeMobile}
                />
                <NavItem
                  icon={<Bed size={18} />}
                  to="/manager/beds"
                  label="Available Beds"
                  close={closeMobile}
                />
                <NavItem
                  icon={<Users size={18} />}
                  to="/manager/residents"
                  label="Tenants"
                  close={closeMobile}
                />
                <NavItem
                  icon={<FileText size={18} />}
                  to="/manager/enquiries"
                  label="Enquiries"
                  close={closeMobile}
                />
                <NavItem
                  icon={<ClipboardList size={18} />}
                  to="/manager/residents/records"
                  label="Checkout Records"
                  close={closeMobile}
                />
                <NavItem
                  icon={<FileText size={18} />}
                  to="/manager/help"
                  label="Help & Support"
                  close={closeMobile}
                />


              </>
            )}
          </nav>
        </div>

        <button className="logout-btn" onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>
    </>
  );
};

/* NAV ITEM COMPONENT */
const NavItem = ({icon, to, label, close, subscriptionExpired}) => {
  const navigate = useNavigate();
  const allowed = to === "/owner/dashboard" || to === "/owner/pricing";

  const handleClick = (e) => {
    if (subscriptionExpired && !allowed) {
      e.preventDefault();
      close?.();
      navigate("/owner/pricing");
      return;
    }
    close?.();
  };

  return (
    <NavLink
      to={to}
      end
      onClick={handleClick}
      className={({isActive}) =>
        isActive ? "sidebar-link active" : "sidebar-link"
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};

export default Sidebar;
