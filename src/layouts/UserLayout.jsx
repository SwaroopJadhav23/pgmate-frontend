import { useContext, useEffect,  useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
  User as UserIcon,
  ClipboardList,
  Gift,
  AlertCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";
import "./UserLayout.css";

const USER_NAV_ITEMS = [
  { to: "/profile",       label: "Profile",      icon: UserIcon     },
  { to: "/my-pg",         label: "My Bookings",  icon: ClipboardList },
  { to: "/user/referrals",label: "Refer & Earn", icon: Gift          },
  { to: "/my-complaints", label: "Complaint",    icon: AlertCircle  },
];

const UserLayout = ({ children, hideWelcome }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/users/me")
      .then((res) => setUserProfile(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);
  
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const closeMobile = () => {
    if (window.innerWidth <= 900) setSidebarOpen(false);
  };

  return (
    <>
      <div className="user-topbar">
        <div className="user-topbar-logo" onClick={() => setSidebarOpen(true)} style={{cursor:"pointer"}}>
  <Menu size={20} className="user-topbar-menu-icon" />
</div>
        <button
  className="user-topbar-avatar-btn"
  onClick={() => navigate("/")}
>
  <UserIcon size={18} />
</button>
      </div>
      <div className="user-shell">

        {sidebarOpen && (
          <div className="user-sb-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        <aside className={`user-sb${sidebarOpen ? " user-sb--open" : ""}`}>
          <button className="user-sb-close" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>

          <div className="user-sb-profile">
            <img
              className="user-sb-avatar"
              src={
                userProfile?.profilePicUrl ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt="User"
            />
            <div className="user-sb-name">{userProfile?.name || "User"}</div>
          </div>

          <nav className="user-sb-menu">
            {USER_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `user-sb-link${isActive ? " user-sb-link--active" : ""}`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <button className="user-sb-logout" onClick={() => setShowLogoutConfirm(true)}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </aside>

        {showLogoutConfirm && (
          <div className="user-logout-overlay" onClick={() => setShowLogoutConfirm(false)}>
            <div className="user-logout-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Log out?</h3>
              <p>Really want to logout?</p>
              <div className="user-logout-modal-actions">
                <button className="user-logout-cancel" onClick={() => setShowLogoutConfirm(false)}>
                  Cancel
                </button>
                <button className="user-logout-confirm" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="user-shell-main">
          <button
  className="user-shell-menu-btn"
  onClick={() => setSidebarOpen(true)}
>
  <Menu size={16} />
  <span>Menu</span>
</button>

          {!hideWelcome && (
            <div className="user-welcome-banner">
              <h2>
                Welcome back,{" "}
                <span className="user-welcome-name">
                  {userProfile?.name?.split(" ")[0] || "there"}
                </span>
              </h2>
              <p>Manage your profile, bookings, referrals and more</p>
            </div>
          )}

         {children}
        </div>
      </div>
    </>
  );
};

export default UserLayout;