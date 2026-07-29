import React from "react";
import {
  FiClock,
  FiFileText,
  FiUsers,
  FiEye,
} from "react-icons/fi";
import {FaWhatsapp} from "react-icons/fa";
import {
  BsTag,
  BsInfinity,
} from "react-icons/bs";
import dalImg from "../../assets/dal.png";
import menuCardHeroImg from "../../assets/menu_card_hero.png";
import raitaImg from "../../assets/raita.png";
import rotiImg from "../../assets/roti.png";
import saladImg from "../../assets/salad.png";
import mintChutneyImg from "../../assets/mint_chutney.png";
import biryaniImg from "../../assets/biryani.png";
export const mockMenuData = {
  pgName: "Green Valley PG & Mess",
  address: "123, MG Road, Koramangala, Bangalore",
  days: [
    {
      id: 1,
      name: "Monday",
      activeMeals: {breakfast: true, lunch: true, snacks: true, dinner: true},
      meals: {
        breakfast: [
          {id: 1, name: "Poha", isVeg: true},
          {id: 2, name: "Banana", isVeg: true},
        ],
        lunch: [
          {id: 3, name: "Dal Tadka", isVeg: true},
          {id: 4, name: "Rice", isVeg: true},
          {id: 5, name: "Cucumber Salad", isVeg: true},
        ],
        snacks: [{id: 6, name: "Tea & Biscuits", isVeg: true}],
        dinner: [
          {id: 7, name: "Chicken Curry", isVeg: false},
          {id: 8, name: "Roti", isVeg: true},
        ],
      },
    },
    {
      id: 2,
      name: "Tuesday",
      activeMeals: {breakfast: true, lunch: true, snacks: true, dinner: true},
      meals: {
        breakfast: [
          {id: 11, name: "Upma", isVeg: true},
          {id: 12, name: "Boiled Egg", isVeg: false},
        ],
        lunch: [
          {id: 13, name: "Veg Biryani", isVeg: true},
          {id: 14, name: "Raita", isVeg: true},
        ],
        snacks: [
          {id: 15, name: "Samosa", isVeg: true},
          {id: 16, name: "Green Chutney", isVeg: true},
        ],
        dinner: [
          {id: 17, name: "Paneer Butter Masala", isVeg: true},
          {id: 18, name: "Roti", isVeg: true},
        ],
      },
    },
    {
      id: 3,
      name: "Wednesday",
      activeMeals: {breakfast: true, lunch: true, snacks: true, dinner: true},
      meals: {
        breakfast: [
          {id: 21, name: "Paratha", isVeg: true},
          {id: 22, name: "Curd", isVeg: true},
        ],
        lunch: [
          {id: 23, name: "Rajma", isVeg: true},
          {id: 24, name: "Rice", isVeg: true},
          {id: 25, name: "Onion Salad", isVeg: true},
        ],
        snacks: [{id: 26, name: "Fruit Bowl", isVeg: true}],
        dinner: [
          {id: 27, name: "Egg Curry", isVeg: false},
          {id: 28, name: "Roti", isVeg: true},
        ],
      },
    },
    {
      id: 4,
      name: "Thursday",
      activeMeals: {breakfast: true, lunch: true, snacks: true, dinner: true},
      meals: {
        breakfast: [
          {id: 31, name: "Dosa", isVeg: true},
          {id: 32, name: "Coconut Chutney", isVeg: true},
        ],
        lunch: [
          {id: 33, name: "Veg Pulao", isVeg: true},
          {id: 34, name: "Raita", isVeg: true},
        ],
        snacks: [{id: 35, name: "Tea & Biscuits", isVeg: true}],
        dinner: [
          {id: 37, name: "Dal Fry", isVeg: true},
          {id: 38, name: "Roti", isVeg: true},
        ],
      },
    },
    {
      id: 5,
      name: "Friday",
      activeMeals: {breakfast: true, lunch: true, snacks: true, dinner: true},
      meals: {
        breakfast: [
          {id: 41, name: "Bread Toast", isVeg: true},
          {id: 42, name: "Jam", isVeg: true},
        ],
        lunch: [
          {id: 43, name: "Chole", isVeg: true},
          {id: 44, name: "Rice", isVeg: true},
          {id: 45, name: "Salad", isVeg: true},
        ],
        snacks: [
          {id: 46, name: "Pakora", isVeg: true},
          {id: 47, name: "Ketchup", isVeg: true},
        ],
        dinner: [
          {id: 48, name: "Chicken Curry", isVeg: false},
          {id: 49, name: "Roti", isVeg: true},
        ],
      },
    },
    {
      id: 6,
      name: "Saturday",
      activeMeals: {breakfast: true, lunch: true, snacks: true, dinner: true},
      meals: {
        breakfast: [
          {id: 51, name: "Idli", isVeg: true},
          {id: 52, name: "Sambar", isVeg: true},
        ],
        lunch: [
          {id: 53, name: "Veg Curry", isVeg: true},
          {id: 54, name: "Rice", isVeg: true},
          {id: 55, name: "Salad", isVeg: true},
        ],
        snacks: [
          {id: 56, name: "Buttermilk", isVeg: true},
          {id: 57, name: "Roasted Peanuts", isVeg: true},
        ],
        dinner: [
          {id: 58, name: "Paneer Curry", isVeg: true},
          {id: 59, name: "Roti", isVeg: true},
        ],
      },
    },
    {
      id: 7,
      name: "Sunday",
      activeMeals: {breakfast: true, lunch: true, snacks: true, dinner: true},
      meals: {
        breakfast: [
          {id: 61, name: "Aloo Paratha", isVeg: true},
          {id: 62, name: "Curd", isVeg: true},
        ],
        lunch: [
          {id: 63, name: "Veg Biryani", isVeg: true},
          {id: 64, name: "Raita", isVeg: true},
        ],
        snacks: [{id: 66, name: "Fruit Bowl", isVeg: true}],
        dinner: [
          {id: 68, name: "Mutton Curry", isVeg: false},
          {id: 69, name: "Roti", isVeg: true},
        ],
      },
    },
  ],
};

export const mockMealConfigs = [
  {
    id: "breakfast",
    name: "BREAKFAST",
    time: "08:00 AM - 10:00 AM",
    enabled: true,
  },
  {id: "lunch", name: "LUNCH", time: "01:00 PM - 03:00 PM", enabled: true},
  {id: "snacks", name: "SNACKS", time: "05:00 PM - 06:00 PM", enabled: true},
  {id: "dinner", name: "DINNER", time: "08:00 PM - 10:00 PM", enabled: true},
];

const FoodMenuHero = () => {
  const scrollToGenerator = () => {
    document
      .getElementById("generator-workspace")
      ?.scrollIntoView({behavior: "smooth"});
  };

  const scrollToDemo = () => {
    document.getElementById("view-demo")?.scrollIntoView({behavior: "smooth"});
  };

  return (
    <div className="fm-hero-section">
      {/* Decorative Floating Plates */}
      <img
        src={dalImg}
        alt="Delicious Bowl of Dal Tadka"
        className="fm-floating-plate fm-plate-dal"
      />
      <img
        src={raitaImg}
        alt="Fresh Cooling Raita"
        className="fm-floating-plate fm-plate-raita"
      />
      <img
        src={rotiImg}
        alt="Warm Fresh Indian Roti"
        className="fm-floating-plate fm-plate-roti"
      />

      <img
        src={saladImg}
        alt="Healthy Cucumber and Tomato Salad"
        className="fm-floating-plate fm-plate-salad"
      />
      <img
        src={mintChutneyImg}
        alt="Spicy Mint Green Chutney"
        className="fm-floating-plate fm-plate-mint"
      />
      <img
        src={biryaniImg}
        alt="Aromatic Chicken Biryani"
        className="fm-floating-plate fm-plate-biryani"
      />

      <div className="fm-hero-container">
        {/* Left Side Content */}
        <div className="fm-hero-left">
          <div className="fm-hero-badge">
            100% Free Tool for PG Owners & Mess Caterers
          </div>

          <h1 className="fm-hero-title">
            Weekly Food
            <br />
            Menu <span className="fm-hero-highlight">Generator</span>
          </h1>

          <p className="fm-hero-subtitle">
            Create professional, organized weekly food menus
            <br />
            for PGs, hostels, and messes in <strong>under 2 minutes.</strong>
          </p>

          <div className="fm-hero-actions">
            <button className="fm-btn-primary" onClick={scrollToGenerator}>
              Generate Weekly Menu ➔
            </button>
            <button className="fm-btn-secondary" onClick={scrollToDemo}>
              <FiEye /> View Demo
            </button>
          </div>
        </div>

        {/* Right Side Mockup */}
        <div className="fm-hero-right">
          <img 
            src={menuCardHeroImg} 
            alt="Menu Generator Mockup" 
            className="fm-hero-mockup-img" 
          />
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="fm-bottom-banner-wrapper">
        <div className="fm-bottom-banner">
          <div className="fm-banner-item">
            <div className="fm-banner-icon">
              <FiClock />
            </div>
            <div className="fm-banner-text">
              <strong>Ready in</strong>
              <span>2 Minutes</span>
            </div>
          </div>
          <div className="fm-banner-item">
            <div className="fm-banner-icon">
              <FaWhatsapp />
            </div>
            <div className="fm-banner-text">
              <strong>WhatsApp</strong>
              <span>Friendly</span>
            </div>
          </div>
          <div className="fm-banner-item">
            <div className="fm-banner-icon">
              <FiFileText />
            </div>
            <div className="fm-banner-text">
              <strong>Printable</strong>
              <span>PDF</span>
            </div>
          </div>
          <div className="fm-banner-item">
            <div className="fm-banner-icon">
              <BsInfinity />
            </div>
            <div className="fm-banner-text">
              <strong>Unlimited</strong>
              <span>Menus</span>
            </div>
          </div>
          <div className="fm-banner-item">
            <div className="fm-banner-icon">
              <FiUsers />
            </div>
            <div className="fm-banner-text">
              <strong>Loved by PG</strong>
              <span>Owners</span>
            </div>
          </div>
          <div className="fm-banner-item">
            <div className="fm-banner-icon">
              <BsTag />
            </div>
            <div className="fm-banner-text">
              <strong>100% Free</strong>
              <span>Forever</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodMenuHero;
