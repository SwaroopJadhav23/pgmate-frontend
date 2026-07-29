import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./layout.css";
import { useState, useEffect } from "react";

const DashboardLayout = ({
  title,
  subtitle,
  rightAction,
  headerContent,
  children,
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  return (
    <div className="dashboard">

      {open && (
        <div
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      <Sidebar open={open} setOpen={setOpen} />

      <div className="main">

        {/* TOPBAR */}
        <Topbar
          title={title}
          subtitle={subtitle}
          rightAction={rightAction}
          onMenu={() => setOpen(!open)}
        />

        {/* ✅ SINGLE CONTENT WRAPPER */}
        <div className="content">

          {/* HEADER */}
          {headerContent && (
            <div className="custom-header">
              {headerContent}
            </div>
          )}

          {/* PAGE BODY */}
          {children}

        </div>

      </div>
    </div>
  );
};

export default DashboardLayout;
