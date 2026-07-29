import {useEffect, useState} from "react";
import {useNavigate, Link} from "react-router-dom";
import {useCityFilter} from "../../../context/CityFilterContext";
import api from "../../../api/axios";
import {ArrowRight} from "lucide-react";

const CITIES = [
  {
    name: "Pune",
    image:
      "https://images.unsplash.com/photo-1715678710159-ee67d5bdba85?w=400&q=80",
  },
  {
    name: "Navi Mumbai",
    image:
      "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=400&q=80",
  },
  {
    name: "Kota",
    image:
      "https://plus.unsplash.com/premium_photo-1691031429919-2273f9603be6?w=400&q=80",
  },
  {
    name: "Hyderabad",
    image:
      "https://images.unsplash.com/photo-1551161242-b5af797b7233?w=400&q=80",
  },
  {
    name: "Delhi",
    image:
      "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80",
  },
  {
    name: "Chennai",
    image:
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&q=80",
  },
];

const PopularCities = () => {
  const navigate = useNavigate();
  const {setSelectedCity} = useCityFilter();
  const [counts, setCounts] = useState({});

  useEffect(() => {
    let active = true;
    Promise.all(
      CITIES.map((c) =>
        api
          .get("/public/pgs/count/city", {params: {city: c.name}})
          .then((res) => [c.name, res.data?.count ?? 0])
          .catch(() => [c.name, 0]),
      ),
    ).then((entries) => {
      if (!active) return;
      setCounts(Object.fromEntries(entries));
    });
    return () => {
      active = false;
    };
  }, []);

  // const handleClick = (cityName) => {
  //   setSelectedCity(cityName);
  //   localStorage.setItem("userCity", cityName);
  //   navigate("/pgs");
  // };

  const handleClick = (cityName) => {
    setSelectedCity(cityName);
    localStorage.setItem("userCity", cityName);
    navigate(`/pgs?city=${encodeURIComponent(cityName)}`);
  };

  return (
    <>
      <style>{CSS}</style>
      <section className="pcty-wrap">
        <div className="pcty-header">
          <h2>Popular Cities</h2>
          <Link to="/cities" className="pcty-view-all">
            View all Cities <ArrowRight size={14} />
          </Link>
        </div>
        <div className="pcty-grid">
          {CITIES.map((city) => (
            <button
              key={city.name}
              className="pcty-card"
              onClick={() => handleClick(city.name)}
            >
              <img src={city.image} alt={city.name} loading="lazy" />
              <div className="pcty-overlay" />
              <div className="pcty-text">
                <strong>{city.name}</strong>
                <span>
                  {counts[city.name] != null
                    ? `${counts[city.name]}+ PGs`
                    : "Loading…"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </>
  );
};

export default PopularCities;

const CSS = `
  .pcty-wrap { 
    max-width: 1600px; 
    margin: 0 auto; 
    padding: 24px 32px 56px; 
  }

  .pcty-header { 
    margin-bottom: 22px; 
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .pcty-header h2 { 
    font-family: 'Sora', sans-serif; 
    font-size: 1.6rem; 
    font-weight: 800; 
    color: #0f172a; 
    margin: 0; 
  }
  .pcty-view-all {
    display: inline-flex; align-items: center; gap: 4px;
    color: #4f46e5; font-weight: 700; font-size: 0.88rem; text-decoration: none;
  }

  .pcty-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 14px;
  }

  .pcty-card {
    position: relative;
    aspect-ratio: 3/4;
    border-radius: 16px;
    overflow: hidden;
    border: none;
    padding: 0;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .pcty-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
  }

  .pcty-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
  .pcty-card:hover img { transform: scale(1.08); }

  .pcty-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.65), transparent 60%);
  }

  .pcty-text {
    position: absolute; left: 12px; bottom: 12px;
    display: flex; flex-direction: column; gap: 2px;
    color: #fff; text-align: left;
  }

  .pcty-text strong { font-size: 0.95rem; font-weight: 700; }
  .pcty-text span { font-size: 0.72rem; opacity: 0.9; }

  @media (max-width: 980px) { .pcty-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 560px) { .pcty-wrap { padding: 20px 18px 44px; } .pcty-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; } }
`;
