import { useState, useEffect, useContext, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import NotificationBell from "../components/NotificationBell";
import { AuthContext } from "../context/AuthContext";
import "./layout.css";

const OwnerLayout = () => {
  const [open, setOpen] = useState(false);
  const [topbarProps, setTopbarProps] = useState({});
  const { subscriptionExpired } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  /* ✅ ROUTE GUARD (primary, reliable): while subscription expired,
     owner may only be on /owner/dashboard or /owner/pricing.
     Any other route — however reached (sidebar link, back button,
     typed URL, or a button we didn't catch) — bounces to pricing. */
  useEffect(() => {
    if (!subscriptionExpired) return;
    const allowed =
      location.pathname === "/owner/dashboard" ||
      location.pathname.startsWith("/owner/pricing");
    if (!allowed) {
      navigate("/owner/pricing", { replace: true });
    }
  }, [subscriptionExpired, location.pathname, navigate]);

  /* ✅ Click interceptor (secondary, instant): stops the doomed
     navigation before it even starts, avoiding a flash of the
     blocked page prior to the route guard kicking in. */
  useEffect(() => {
    const content = contentRef.current;
    if (!content || !subscriptionExpired || location.pathname === "/owner/pricing") return;

    const handler = (e) => {
      const target = e.target.closest(
        "button, [role='button'], .dash-chart-card, .dash-stat-box, .dash-quick-btn, [data-clickable-card]"
      );
      if (!target || target.closest("[data-allow-expired='true']")) return;

      e.preventDefault();
      e.stopPropagation();
      navigate("/owner/pricing");
    };

    content.addEventListener("click", handler, true); // capture phase
    return () => content.removeEventListener("click", handler, true);
  }, [subscriptionExpired, navigate, location.pathname]);

  return (
    <div className="dashboard">
      {open && (
        <div className="sidebar-overlay" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar mounts ONCE — never re-mounts on page change */}
      <Sidebar open={open} setOpen={setOpen} />

      <div className="main">
        {/* ✅ Topbar includes NotificationBell on the right */}
        <Topbar
          title={topbarProps.title}
          subtitle={topbarProps.subtitle}
          rightAction={
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {topbarProps.rightAction}
              <NotificationBell />
            </div>
          }
          onMenu={() => setOpen((prev) => !prev)}
        />

        <div className="content" ref={contentRef}>
          <Outlet context={{ setTopbarProps }} />
        </div>
      </div>
    </div>
  );
};

export default OwnerLayout;