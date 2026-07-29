import "./HowItWorks.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import HomeLayout from "../../../layouts/HomeLayouts";
const HowItWorks = () => {
const [activeTab, setActiveTab] = useState("owner");

 

useEffect(() => {
  const path = document.getElementById("stepsPath");
  const dot = document.querySelector(".steps-dot");
  const section = document.querySelector(".how-steps-pro");

  if (!path || !dot || !section) return;

  const pathLength = path.getTotalLength();
  path.style.strokeDasharray = pathLength;
  path.style.strokeDashoffset = pathLength;

  const handleScroll = () => {
    const rect = section.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    const progress = Math.min(
      Math.max((windowHeight - rect.top) / rect.height, 0),
      1
    );

    const drawLength = pathLength * progress;
    path.style.strokeDashoffset = pathLength - drawLength;

    const point = path.getPointAtLength(drawLength);
    dot.setAttribute("cx", point.x);
    dot.setAttribute("cy", point.y);
  };

  window.addEventListener("scroll", handleScroll);

  return () => window.removeEventListener("scroll", handleScroll);
}, []);


  return (
    <HomeLayout>
    <div className="how-page">
      {/* HERO */}
      <section className="how-hero">
        <div className="how-hero-overlay"></div>
        <div className="how-hero-content container">
          <h1>How PGMate Works</h1>
          <p>
            Simple steps to list, manage, and grow your PG business effortlessly
          </p>
        </div>
      </section>

      {/* STEPS */}
     <section className="how-steps-pro">
  <div className="container steps-container">

    

    {/* SVG CURVED LINE */}
     <svg
      className="steps-svg"
      viewBox="0 0 1200 1600"
      preserveAspectRatio="none"
    >
      <path
        id="stepsPath"
        d="M600 100 
           C 1000 300, 200 500, 600 750
           C 1000 1000, 200 1200, 600 1450"
        className="steps-path"
      />

      <circle
        r="10"
        className="steps-dot"
      />
    </svg>

    {/* STEP 1 */}
<div className="step-row">
  <div className="step-img">
    <img
      src="https://images.unsplash.com/photo-1501183638710-841dd1904471"
      alt="List PG"
    />
  </div>
  <div className="step-content">
    <div className="step-icon">
      <i className="bi bi-house-add-fill"></i>
    </div>
    <h3>List Your PG</h3>
    <p>
      Easily register your PG property in just a few steps. Add rooms, beds,
      amenities, pricing details, house rules, and high-quality photos to
      showcase your property professionally.
    </p>
   
  </div>
</div>



{/* STEP 2 */}

<div className="step-row reverse">
  <div className="step-img">
    <img
      src="https://images.unsplash.com/photo-1492724441997-5dc865305da7"
      alt="Manage Residents"
    />
  </div>
  <div className="step-content">
    <div className="step-icon">
      <i className="bi bi-people-fill"></i>
    </div>
    <h3>Manage Residents</h3>
    <p>
      Seamlessly manage resident check-ins, bed allocations, rent tracking,
      and documentation from one powerful dashboard.
    </p>
    <p>
      Stay updated with real-time occupancy insights, automate reminders,
      and maintain complete transparency with digital records — all without
      manual paperwork.
    </p>
  </div>
</div>



{/* STEP 3 */}

<div className="step-row">
  <div className="step-img">
    <img
      src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d"
      alt="Grow"
    />
  </div>
  <div className="step-content">
    <div className="step-icon">
      <i className="bi bi-graph-up-arrow"></i>
    </div>
    <h3>Grow & Optimize</h3>
    <p>
      Track performance metrics, monitor revenue trends, and reduce
      vacancies with smart analytics designed for PG owners.
    </p>
    <p>
      Use automated tools and data-driven insights to optimize pricing,
      improve occupancy rates, and scale your PG business confidently.
    </p>
  </div>
</div>



  </div>
</section>


      {/* OWNER & RESIDENT FLOW */}
{/* OWNER & RESIDENT FLOW */}
<section className="how-flow">
  <div className="container">

    {/* Toggle Buttons */}
    <div className="flow-toggle">
      <button
        className={activeTab === "owner" ? "active" : ""}
        onClick={() => setActiveTab("owner")}
      >
        <i className="bi bi-building"></i> PG Owners
      </button>

      <button
        className={activeTab === "resident" ? "active" : ""}
        onClick={() => setActiveTab("resident")}
      >
        <i className="bi bi-person-heart"></i> Residents
      </button>
    </div>

    {/* Content Card */}
    <div className="flow-content-card">

      {activeTab === "owner" && (
        <div className="flow-content animate-slide">

          <div className="flow-image">
            <img src="Owner.png" alt="PG Owner" />
          </div>

          <div className="flow-text-content">
            <h4>Powerful Tools for PG Owners</h4>
            <p className="flow-sub">
              Manage your entire PG business from one smart dashboard.
            </p>

            <ul>
              <li><i className="bi bi-check-circle-fill"></i> Easy onboarding</li>
              <li><i className="bi bi-check-circle-fill"></i> Room & bed management</li>
              <li><i className="bi bi-check-circle-fill"></i> Rent tracking</li>
              <li><i className="bi bi-check-circle-fill"></i> Automated reminders</li>
              <li><i className="bi bi-check-circle-fill"></i> Real-time analytics</li>
            </ul>
          </div>

        </div>
      )}

      {activeTab === "resident" && (
        <div className="flow-content animate-slide">

          <div className="flow-image">
            <img src="User.png" alt="Resident" />
          </div>

          <div className="flow-text-content">
            <h4>Comfort & Transparency for Residents</h4>
            <p className="flow-sub">
              Discover verified PG stays with complete clarity.
            </p>

            <ul>
              <li><i className="bi bi-check-circle-fill"></i> Verified listings</li>
              <li><i className="bi bi-check-circle-fill"></i> Transparent pricing</li>
              <li><i className="bi bi-check-circle-fill"></i> Secure documentation</li>
              <li><i className="bi bi-check-circle-fill"></i> Safe stays</li>
              <li><i className="bi bi-check-circle-fill"></i> Hassle-free living</li>
            </ul>
          </div>

        </div>
      )}

    </div>

  </div>
</section>


      {/* CTA */}
   
    <section className="how-cta-pro">
        <div className="container">
        <div className="cta-pro-card">
        <span className="cta-badge">PG Owners</span>
         <h3>Ready to List Your PG?</h3>

         <p>
            Join <strong>PGMate</strong> and manage your PG effortlessly with
            smart tools, better occupancy, automated tracking, and complete
            control — all in one place.
        </p>

        <Link to="/list-your-property" className="cta-pro-btn">
        List Your PG
        <i className="bi bi-arrow-right ms-2"></i>
        </Link>
        </div>
        </div>
    </section>

    </div>
    </HomeLayout>
  );
};

export default HowItWorks;
