import { Menu } from "lucide-react";

const Topbar = ({ title, subtitle, rightAction, onMenu }) => {
  return (
    <header className="topbar">
      {/* LEFT SIDE */}
      <div className="topbar-left">
        {/* HAMBURGER (MOBILE ONLY) */}
        <button className="menu-btn" onClick={onMenu}>
          <Menu size={24} />
        </button>

        <div>
          <h1 className="topbar-title">{title}</h1>
          <p className="topbar-subtitle">{subtitle}</p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      {rightAction && <div className="topbar-action">{rightAction}</div>}
    </header>
  );
};

export default Topbar;
