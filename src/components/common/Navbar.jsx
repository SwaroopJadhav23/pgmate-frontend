import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useContext, useRef } from "react";
import "../common/nav.css";
import { AuthContext } from "../../context/AuthContext";
import pgmateLogo from "../../assets/PGMate.png";

import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import api from "../../api/axios";
import { useCityFilter } from "../../context/CityFilterContext";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // eslint-disable-next-line no-unused-vars
  const { selectedCity, setSelectedCity } = useCityFilter();
  const [cityStateMap, setCityStateMap] = useState({});
  const [dbCities, setDbCities] = useState([]); // actual cities from DB
  const location = useLocation();
  // eslint-disable-next-line no-unused-vars
  const isHome = location.pathname === "/";
  // const locationAllowed = !!localStorage.getItem("locationPermission");
  const [locationAllowed, setLocationAllowed] = useState(
    !!localStorage.getItem("locationPermission"),
  );

  const [navSearchText, setNavSearchText] = useState(
    localStorage.getItem("userCity") || "",
  );
  // eslint-disable-next-line no-unused-vars
  const [navDropdown, setNavDropdown] = useState([]); // list of {type, label, city?, state?}
  // eslint-disable-next-line no-unused-vars
  const [showNavDropdown, setShowNavDropdown] = useState(false);
  // const [cityStateMap, setCityStateMap] = useState({});
  const navSearchRef = useRef(null);

  // eslint-disable-next-line no-unused-vars
  const [showExport, setShowExport] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const exportRef = useRef(null);

  const navigate = useNavigate();
  const { token, role, logout } = useContext(AuthContext);

  const closeMenu = () => setMenuOpen(false);

  const roleUpper = (role || "").toUpperCase();
  const showExportBtn = roleUpper === "OWNER" || roleUpper === "PG_MANAGER";
  const apiPrefix = roleUpper === "PG_MANAGER" ? "/manager" : "/owner";

  useEffect(() => {
    const check = () =>
      setLocationAllowed(!!localStorage.getItem("locationPermission"));
    window.addEventListener("storage", check);
    // Also poll every second for same-tab changes
    const interval = setInterval(check, 1000);
    return () => {
      window.removeEventListener("storage", check);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!locationAllowed) return;

    // Load from cache instantly
    const cached = localStorage.getItem("cityStateMap");
    if (cached) {
      try {
        setCityStateMap(JSON.parse(cached));
      } catch { }
    }

    api
      .get("/public/city-states")
      .then((res) => {
        const map = res.data || {};
        setCityStateMap(map);
        localStorage.setItem("cityStateMap", JSON.stringify(map));
      })
      .catch(() => { });
  }, [locationAllowed]);

  useEffect(() => {
    api
      .get("/public/cities")
      .then((res) => {
        setDbCities(res.data || []);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest(".pg-profile")) setShowProfileMenu(false);
      if (!e.target.closest(".export-wrapper")) setShowExport(false);

      if (navSearchRef.current && !navSearchRef.current.contains(e.target))
        setShowNavDropdown(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  // useEffect(() => {
  //   if (!navSearchText.trim()) {
  //     setNavDropdown([]);
  //     return;
  //   }
  //   const q = navSearchText.toLowerCase();
  //   const results = [];

  //   // Group cities by state from the dynamic map
  //   Object.entries(cityStateMap).forEach(([city, state]) => {
  //     if (city.toLowerCase().includes(q) || state.toLowerCase().includes(q)) {
  //       results.push({city, state});
  //     }
  //   });

  //   // setNavDropdown(results.slice(0, 10));
  //   setNavDropdown(results);
  // }, [navSearchText, cityStateMap]);

  useEffect(() => {
    if (!navSearchText.trim()) {
      setNavDropdown([]);
      return;
    }
    const q = navSearchText.toLowerCase();
    const seen = new Set();
    const results = [];

    dbCities.forEach((dbCity) => {
      const state = cityStateMap[dbCity] || "";
      const matches =
        dbCity.toLowerCase().includes(q) || state.toLowerCase().includes(q);

      if (matches && !seen.has(dbCity)) {
        seen.add(dbCity);
        results.push({ city: dbCity, state });
      }
    });

    setNavDropdown(results.slice(0, 12));
  }, [navSearchText, dbCities, cityStateMap]);

  useEffect(() => {
    if (selectedCity) {
      setNavSearchText(selectedCity);
    }
  }, [selectedCity]);

  const handleLogout = () => {
    setShowProfileMenu(false);
    logout();
    navigate("/");
  };

  const fetchStats = async () => {
    try {
      const res = await api.get(`${apiPrefix}/dashboard/stats`);
      return res.data;
    } catch {
      return null;
    }
  };

  const exportPDF = async () => {
    const stats = await fetchStats();
    if (!stats) return;
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("Owner Dashboard Report", 20, 20);
    let y = 40;
    [
      ["Total PGs", stats.totalPgs ?? 0],
      ["Total Beds", stats.totalBeds ?? 0],
      ["Available Beds", stats.availableBeds ?? 0],
      ["Total Floors", stats.totalFloors ?? 0],
      ["Total Rooms", stats.totalRooms ?? 0],
      ["Occupied Beds", stats.occupiedBeds ?? 0],
    ].forEach(([l, v]) => {
      pdf.setFontSize(12);
      pdf.text(l, 25, y);
      pdf.text(String(v), pdf.internal.pageSize.getWidth() - 25, y, {
        align: "right",
      });
      y += 10;
    });
    pdf.save("OwnerDashboard.pdf");
    setShowExport(false);
  };

  const exportExcel = async () => {
    const stats = await fetchStats();
    if (!stats) return;
    const data = [
      ["Owner Dashboard Report"],
      [],
      ["Metric", "Value"],
      ["Total PGs", stats.totalPgs ?? 0],
      ["Total Beds", stats.totalBeds ?? 0],
      ["Available Beds", stats.availableBeds ?? 0],
      ["Total Floors", stats.totalFloors ?? 0],
      ["Total Rooms", stats.totalRooms ?? 0],
      ["Occupied Beds", stats.occupiedBeds ?? 0],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [{ wch: 40 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dashboard");
    XLSX.writeFile(wb, "OwnerDashboard.xlsx");
    setShowExport(false);
  };

  const exportWord = async () => {
    const stats = await fetchStats();
    if (!stats) return;
    const html = `<html><body style="font-family:Calibri;padding:40px">
      <h2>Owner Dashboard Report</h2>
      <table border="1" cellpadding="10" cellspacing="0" width="100%">
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Total PGs</td><td>${stats.totalPgs ?? 0}</td></tr>
        <tr><td>Total Beds</td><td>${stats.totalBeds ?? 0}</td></tr>
        <tr><td>Available Beds</td><td>${stats.availableBeds ?? 0}</td></tr>
        <tr><td>Total Floors</td><td>${stats.totalFloors ?? 0}</td></tr>
        <tr><td>Total Rooms</td><td>${stats.totalRooms ?? 0}</td></tr>
        <tr><td>Occupied Beds</td><td>${stats.occupiedBeds ?? 0}</td></tr>
      </table></body></html>`;
    saveAs(
      new Blob(["\ufeff", html], { type: "application/msword" }),
      "OwnerDashboard.doc",
    );
    setShowExport(false);
  };

  return (
    <nav className="pg-navbar">
      <div className="pg-nav-container">
        {/* ── LOGO ── */}
        <Link to="/" className="pg-logo-img" onClick={closeMenu}>
          <img src={pgmateLogo} alt="PGMate" />
        </Link>

        {/* ── NAVBAR CITY SEARCH (home only, after location allowed) ── */}
        {/* Disabled: commented out as per request. Keeping design/markup intact below for future re-enable.
        {isHome && locationAllowed && (
          <div ref={navSearchRef} style={{position: "relative"}}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#F3F4F6",
                borderRadius: "50px",
                padding: "7px 14px",
                width: "220px",
              }}
            >
              <i
                className="bi bi-geo-alt"
                style={{color: "#6366F1", fontSize: "13px"}}
              />
              <input
                type="text"
                placeholder={`Search city...`}
                value={navSearchText}
                onChange={(e) => {
                  setNavSearchText(e.target.value);
                  setShowNavDropdown(true);
                }}
                onFocus={() => {
                  if (navDropdown.length) setShowNavDropdown(true);
                }}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "0.82rem",
                  color: "#111827",
                  width: "100%",
                }}
              />
              {navSearchText && (
                <button
                  onClick={() => {
                    setNavSearchText("");
                    setNavDropdown([]);
                  }}
                  style={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    color: "#9CA3AF",
                    padding: 0,
                    fontSize: "12px",
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {showNavDropdown && navDropdown.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  background: "#fff",
                  borderRadius: "12px",
                  boxShadow: "0 8px 28px rgba(0,0,0,0.13)",
                  zIndex: 999,
                  minWidth: "220px",
                  maxHeight: "280px",
                  overflowY: "auto",
                  padding: "6px",
                }}
              >
                {navDropdown.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedCity(item.city);
                      localStorage.setItem("userCity", item.city);
                      localStorage.setItem("userLocality", "");
                      setNavSearchText(item.city);
                      setShowNavDropdown(false);
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      color: "#374151",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1px",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#EEF2FF")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span style={{fontWeight: 600}}>{item.city}</span>
                    <span style={{fontSize: "0.72rem", color: "#9CA3AF"}}>
                      {item.state}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        */}

        {/* ── DESKTOP NAV LINKS ── */}
        <ul className="pg-nav-links-center">
          {/* <li>
            <NavLink
              to="/"
              className={({isActive}) =>
                `pg-center-link ${isActive ? "active" : ""}`
              }
            >
              Home
            </NavLink>
          </li> */}
          <li>
            <NavLink
              to="/pgs"
              className={({ isActive }) =>
                `pg-center-link ${isActive ? "active" : ""}`
              }
            >
              Browse PGs
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/cities"
              className={({ isActive }) =>
                `pg-center-link ${isActive ? "active" : ""}`
              }
            >
              Cities
            </NavLink>
          </li>
          {/* Hide "For Owners" only when a logged-in USER, same rule as the
              "List your PG" button. */}
          {!(token && roleUpper === "USER") && (
            <li>
              <NavLink
                to="/for-owners"
                className={({ isActive }) =>
                  `pg-center-link ${isActive ? "active" : ""}`
                }
              >
                For Owners
              </NavLink>
            </li>
          )}
          {/* Free Tools are Owner-only; hide from a logged-in USER (Tenant),
              same rule as "For Owners". */}
          {!(token && roleUpper === "USER") && (
            <li>
              <NavLink
                to="/tools"
                className={({ isActive }) =>
                  `pg-center-link ${isActive ? "active" : ""}`
                }
              >
                Free Tools <span className="pg-new-badge">New</span>
              </NavLink>
            </li>
          )}
          <li>
            <NavLink
              to="/contact-us"
              className={({ isActive }) =>
                `pg-center-link ${isActive ? "active" : ""}`
              }
            >
              Contact
            </NavLink>
          </li>

          {token && roleUpper === "USER" && (
            <li>
              <NavLink
                to="/about-us"
                className={({isActive}) =>
                  `pg-center-link ${isActive ? "active" : ""}`
                }
              >
                About Us
              </NavLink>
            </li>
          )}
        </ul>

        {/* ── HAMBURGER ── */}
        <div
          className="pg-hamburger"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Menu"
        >
          <i className={`bi ${menuOpen ? "bi-x-lg" : "bi-list"}`}></i>
        </div>

        {/* ── OVERLAY ── */}
        {menuOpen && <div className="pg-nav-overlay" onClick={closeMenu}></div>}

        {/* ── MOBILE MENU ── */}
        <ul
          className={`pg-nav-menu ${menuOpen ? "active" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <li className="pg-mobile-close" onClick={closeMenu}>
            ✕
          </li>

          {/* Nav links */}
          <li>
            <NavLink to="/" className="pg-menu-link" onClick={closeMenu}>
              <i className="bi bi-house"></i> Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/pgs" className="pg-menu-link" onClick={closeMenu}>
              <i className="bi bi-star-half"></i> Browse PGs
            </NavLink>
          </li>
          <li>
            <NavLink to="/cities" className="pg-menu-link" onClick={closeMenu}>
              <i className="bi bi-geo-alt"></i> Cities
            </NavLink>
          </li>
          {!(token && roleUpper === "USER") && (
            <li>
              <NavLink to="/tools" className="pg-menu-link" onClick={closeMenu}>
                <i className="bi bi-tools"></i> Free Tools{" "}
                <span className="pg-new-badge" style={{ marginLeft: "auto" }}>
                  New
                </span>
              </NavLink>
            </li>
          )}
          {!(token && roleUpper === "USER") && (
            <li>
              <NavLink
                to="/for-owners"
                className="pg-menu-link"
                onClick={closeMenu}
              >
                <i className="bi bi-building"></i> For Owners
              </NavLink>
            </li>
          )}

          <li>
            <NavLink
              to="/contact-us"
              className="pg-menu-link"
              onClick={closeMenu}
            >
              <i className="bi bi-envelope"></i> Contact
            </NavLink>
          </li>

          {token && roleUpper === "USER" && (
            <li>
              <NavLink
                to="/about-us"
                className="pg-menu-link"
                onClick={closeMenu}
              >
                <i className="bi bi-info-circle"></i> About Us
              </NavLink>
            </li>
          )}

          {/* ── Mobile auth ── */}
          <li className="mobile-only mobile-auth">
            {!token ? (
              <Link
                to="/login"
                className="mobile-login-btn"
                onClick={closeMenu}
              >
                <i className="bi bi-person"></i>
                Login / Sign up
              </Link>
            ) : (
              <>
                {roleUpper === "USER" && (
                  <NavLink
                    to="/profile"
                    className="pg-menu-link"
                    onClick={closeMenu}
                  >
                    <i className="bi bi-person"></i> Profile
                  </NavLink>
                )}
                {roleUpper === "OWNER" && (
                  <>
                    <NavLink
                      to="/owner/dashboard"
                      className="pg-menu-link"
                      onClick={closeMenu}
                    >
                      <i className="bi bi-speedometer2"></i> Dashboard
                    </NavLink>
                    <NavLink
                      to="/owner/profile"
                      className="pg-menu-link"
                      onClick={closeMenu}
                    >
                      <i className="bi bi-person"></i> Profile
                    </NavLink>
                  </>
                )}
                {roleUpper === "SUPER_ADMIN" && (
                  <NavLink
                    to="/admin/dashboard"
                    className="pg-menu-link"
                    onClick={closeMenu}
                  >
                    <i className="bi bi-speedometer2"></i> Dashboard
                  </NavLink>
                )}
                {roleUpper === "SUB_ADMIN" && (
                  <NavLink
                    to="/subadmin/dashboard"
                    className="pg-menu-link"
                    onClick={closeMenu}
                  >
                    <i className="bi bi-speedometer2"></i> Dashboard
                  </NavLink>
                )}
                {roleUpper === "PG_MANAGER" && (
                  <NavLink
                    to="/manager/dashboard"
                    className="pg-menu-link"
                    onClick={closeMenu}
                  >
                    <i className="bi bi-speedometer2"></i> Dashboard
                  </NavLink>
                )}
                <button onClick={handleLogout} className="mobile-logout">
                  <i className="bi bi-box-arrow-right"></i> Logout
                </button>
              </>
            )}
          </li>

          {/* ── Mobile Export ── */}
          {showExportBtn && (
            <li className="mobile-only">
              <div className="pg-mobile-export">
                <button className="pg-mobile-export-item" onClick={exportPDF}>
                  <i className="bi bi-file-earmark-pdf"></i> Export PDF
                </button>
                <button className="pg-mobile-export-item" onClick={exportWord}>
                  <i className="bi bi-file-earmark-word"></i> Export Word
                </button>
                <button className="pg-mobile-export-item" onClick={exportExcel}>
                  <i className="bi bi-file-earmark-spreadsheet"></i> Export
                  Excel
                </button>
              </div>
            </li>
          )}

          {/* ── Mobile CTA (menu-link style) ── */}
          {roleUpper !== "USER" && (
            <li className="mobile-only">
              <Link
                to="/list-your-property"
                className="pg-mobile-cta"
                onClick={closeMenu}
              >
                <i className="bi bi-building-add"></i>
                List My PG
              </Link>
            </li>
          )}
        </ul>

        {/* ── RIGHT SIDE (desktop) ── */}
        <div className="pg-nav-right">
          <div id="google_translate_element" style={{ display: "none" }}></div>

          {!token ? (
            <Link to="/login" className="pg-login-btn desktop-only">
              <i className="bi bi-person"></i> Login
            </Link>
          ) : (
            <div
              className="pg-profile desktop-only"
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileMenu((prev) => !prev);
              }}
            >
              <div className="pg-avatar">
                <i className="bi bi-person-fill"></i>
              </div>
              {showProfileMenu && (
                <div className="pg-profile-menu">
                  {roleUpper === "USER" && (
                    <NavLink
                      to="/profile"
                      className="pg-menu-link"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <i className="bi bi-speedometer2"></i> Dashboard
                    </NavLink>
                  )}
                  {roleUpper === "OWNER" && (
                    <>
                      <NavLink
                        to="/owner/dashboard"
                        className="pg-menu-link"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <i className="bi bi-speedometer2"></i> Dashboard
                      </NavLink>
                      <NavLink
                        to="/owner/profile"
                        className="pg-menu-link"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <i className="bi bi-person"></i> Profile
                      </NavLink>
                    </>
                  )}
                  {roleUpper === "SUPER_ADMIN" && (
                    <NavLink
                      to="/admin/dashboard"
                      className="pg-menu-link"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <i className="bi bi-speedometer2"></i> Dashboard
                    </NavLink>
                  )}
                  {roleUpper === "SUB_ADMIN" && (
                    <NavLink
                      to="/subadmin/dashboard"
                      className="pg-menu-link"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <i className="bi bi-speedometer2"></i> Dashboard
                    </NavLink>
                  )}
                  {roleUpper === "PG_MANAGER" && (
                    <NavLink
                      to="/manager/dashboard"
                      className="pg-menu-link"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <i className="bi bi-speedometer2"></i> Dashboard
                    </NavLink>
                  )}
                  <button onClick={handleLogout} className="mobile-logout">
                    <i className="bi bi-box-arrow-right"></i> Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Hide "List your PG" only when a logged-in USER. Guests (no token)
              and all other roles still see it. */}
          {!(token && roleUpper === "USER") && (
            <Link
              to="/list-your-property"
              className="pg-list-pg-btn desktop-only"
            >
              List Your PG
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
