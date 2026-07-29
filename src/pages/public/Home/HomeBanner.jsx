import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EditableText from "../../admin/ManageUI/AdminEditableText";
import { getUIText, saveUIText } from "../../admin/ManageUI/uiText";
import api from "../../../api/axios";
import PGListingCard from "../PGListingCard";
import "./HomeBanner.css";

const HomeBanner = () => {
  const [banners, setBanners] = useState([]);
  const [active, setActive] = useState(0);
  const [featuredPGs, setFeaturedPGs] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [cityOptions, setCityOptions] = useState([]);
  const [bannerLoading, setBannerLoading] = useState(true);

  const navigate = useNavigate();

  const isAdmin = !!localStorage.getItem("token");
  const editTextMode = localStorage.getItem("ui_text_edit") === "true";

  const [text, setText] = useState({
    heading: "Simplifying PG Living Across India",
    subtext:
      "Discover verified PGs or manage your property effortlessly with PGMate - transparent, digital, broker-free.",
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await getUIText("home_banner");
        if (data) setText((prev) => ({ ...prev, ...data }));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    api.get("/public/ui-assets?section=home_banner")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setBanners(res.data);
          setActive(0);
        }
      })
      .catch(() => setBanners([]))
      .finally(() => setBannerLoading(false));
  }, []);

  useEffect(() => {
    api.get("/public/cities")
      .then((res) => setCityOptions(res.data || []))
      .catch(() => setCityOptions([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/public/pgs/paged", {
          params: {
            page: 0,
            size: 8,
            city: selectedCity || undefined,
          },
        });
        setFeaturedPGs(res.data?.content || []);
      } catch {
        setFeaturedPGs([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedCity]);

  useEffect(() => {
    if (!banners.length) return;

    const intervalId = setInterval(() => {
      setActive((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [banners]);

  return (
    <section className="home-hero fade-in">
      <div className="home-pg-section">
        <div className="home-pg-header">
          <div>
            <h3 className="home-pg-title">
              {selectedCity ? `PGs in ${selectedCity}` : "Top PGs Across Cities"}
            </h3>

            <select className="city-dropdown" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
              <option value="">All Cities</option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <button className="home-see-more-top" onClick={() => navigate("/pgs")}>See All</button>
        </div>

        <div className="pg-carousel">
          <div className="home-pg-scroll">
            {!featuredPGs.length && <p style={{ padding: 20, color: "#666" }}>No PGs available right now.</p>}

            {featuredPGs.filter(Boolean).map((pg) => (
              <PGListingCard
                key={pg.id}
                pg={pg}
                imageIndex={0}
                showImageNav={false}
                className="home-carousel-card"
                onNavigate={(item) => navigate(`/pg/${item.id}`)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className={`home-banner ${!bannerLoading ? "fade-in" : ""}`}>
        {banners.map((banner, index) => (
          <div key={index} className={`home-slide ${index === active ? "active" : ""}`} style={{ backgroundImage: `url(${banner.imageUrl})` }} />
        ))}

        <div className="home-banner-content">
          <EditableText
            tag="h1"
            value={text.heading}
            editable={isAdmin && editTextMode}
            onSave={(value) => {
              const updated = { ...text, heading: value };
              setText(updated);
              saveUIText("home_banner", updated);
            }}
          />

          <EditableText
            tag="p"
            value={text.subtext}
            editable={isAdmin && editTextMode}
            onSave={(value) => {
              const updated = { ...text, subtext: value };
              setText(updated);
              saveUIText("home_banner", updated);
            }}
          />

          {banners.length > 1 && (
            <div className="home-dots">
              {banners.map((_, index) => (
                <span key={index} className={index === active ? "active" : ""} onClick={() => setActive(index)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default React.memo(HomeBanner);