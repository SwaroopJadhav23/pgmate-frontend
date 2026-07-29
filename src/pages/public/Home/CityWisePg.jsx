import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import "./CityWisePg.css";

const CityWisePg = () => {
  const [cities, setCities] = useState([]);
  const [activeCity, setActiveCity] = useState(null);
  const navigate = useNavigate();

  /* 🔹 LOAD FROM ADMIN */
  useEffect(() => {
    api
      .get("/public/ui-assets?section=home_citywise")
      .then((res) => {
        setCities(res.data || []);
      })
      .catch(() => setCities([]));
  }, []);
 
  const handleCityClick = (city) => {
    setActiveCity(city.id);
    if (city.link) {
      navigate(city.link);
    }
  };

  /* 🔹 Extract city name from link */
  const getCityName = (link) => {
    if (!link) return "City";
    const match = link.match(/city=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : "City";
  };

  return (
    <section className="citywise-wrapper">
      <h2 className="citywise-title">
        Explore PGs Across <span>Top Cities</span>
      </h2>

      <p className="citywise-subtitle">
        Choose your city to explore verified PGs, hostels & coliving spaces
      </p>

      {/* CITY SCROLLER */}
      <div className="city-scroll">
        {[...cities, ...cities].map((city, index) => (
          <div
            key={`${city.id}-${index}`}
            className={`city-card ${
              activeCity === city.id ? "active" : ""
            }`}
            onClick={() => handleCityClick(city)}
          >
            {/* 🔹 ADMIN IMAGE (NO ICON) */}
            <div className="city-icon">
              <img 
                src={city.imageUrl}
                alt={getCityName(city.link)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "14px"
                }}
              />
            </div>

            <p>{getCityName(city.link)}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default React.memo(CityWisePg);