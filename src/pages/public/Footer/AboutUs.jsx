import { useState, useEffect } from "react";
import HomeLayout from "../../../layouts/HomeLayouts";
import "./AboutUs.css";
import ApkDownloadModal from "../../../components/ApkModal";

const WORDS = ["Simple", "Safe", "Stress-Free"];

const AboutUs = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeWhatIndex, setActiveWhatIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [showApkModal, setShowApkModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowApkModal(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % WORDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setActiveWhatIndex(0);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWhatIndex((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: "bi-building-check",
      title: "Complete PG Management",
      text: "PGMate provides owners with a powerful dashboard to manage floors, rooms, beds, residents, and payments in one place. Automated tracking, organized records, and simplified operations help reduce manual work and improve overall property management efficiency."
    },
    {
      icon: "bi-search",
      title: "Easy PG Discovery",
      text: "Residents can explore verified PG listings with transparent pricing, detailed room insights, and real photos. With clear amenities and property details available upfront, finding a safe and suitable living space becomes faster and more reliable."
    },
    {
      icon: "bi-shield-lock",
      title: "Secure & Transparent",
      text: "PGMate ensures a secure environment with verified users, role-based access, and protected data handling. Both residents and owners benefit from a transparent platform that builds trust and simplifies communication."
    }
  ];

  return (
    <HomeLayout>
      <ApkDownloadModal show={showApkModal} setShow={setShowApkModal} />

      {/* HERO */}
      <section className="about-hero">
        <div className="about-hero-overlay">
          <div className="container text-center text-white">
            <h1 className="about-hero-title">
              We Help You Live{" "}
              <span key={wordIndex} className="changing-word">
                {WORDS[wordIndex]}
              </span>
            </h1>
            <p className="about-hero-subtitle">
              So you can focus on your life, not your living problems.
            </p>
          </div>
        </div>
      </section>

      {/* WHO WE ARE */}
      <section className="about-content container py-5">

        <div className="row align-items-center mb-5">
          <div className="col-md-6">
            <h2 className="section-title">Who We Are</h2>
            <p className="section-text">
              PGMate was created to simplify the experience of PG living and
              property management. We bring residents and PG owners together
              through a transparent, technology-driven platform.
            </p>
            <p className="section-text">
              For residents, PGMate makes it easier to discover safe,
              well-managed PG accommodations with clear information about
              pricing, amenities, and availability.
            </p>
            <p className="section-text">
              For PG owners, our platform provides powerful tools to manage
              properties, track occupancy, organize residents, and handle
              daily operations more efficiently.
            </p>
          </div>
          <div className="col-md-6">
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d"
              alt="Team collaboration"
              className="img-fluid rounded shadow-lg"
            />
          </div>
        </div>

        {/* MISSION & VISION */}
        <section className="pg-mission-vision container my-5">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="pg-mv-card mission-card">
                <h3>Our <span>Mission</span></h3>
                <p>
                  To simplify PG and co-living experiences through smart
                  technology that helps residents find better living spaces
                  while enabling PG owners to manage properties efficiently.
                </p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="pg-mv-card vision-card">
                <h3>Our <span>Vision</span></h3>
                <p>
                  To become India's most trusted digital platform for PG
                  discovery and management by creating safer, smarter and more
                  transparent shared living ecosystems.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WHAT MAKES PGMate DIFFERENT */}
        <section className="the-what-pro">
          <div className="what-heading-wrap">
            <h2 className="what-main-title">
              What Makes <span>PGMate</span> Different
            </h2>
            <p className="what-subtitle">
              Designed to improve both sides of PG living — residents get
              clarity and comfort while owners get powerful management tools.
            </p>
          </div>

          <div className="container">
            <div className="what-layout">

              {/* NAV */}
              <div className="what-nav">
                {["Find PGs", "Amenities", "Community", "Technology"].map((item, i) => (
                  <button
                    key={i}
                    className={`what-nav-item ${activeWhatIndex === i ? "active" : ""}`}
                    onClick={() => setActiveWhatIndex(i)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {/* CONTENT */}
              <div className="what-steps">
                {[
                  {
                    title: "Find PGs",
                    text: "Residents can explore structured PG listings with detailed room information, pricing transparency, photos and amenities to make confident decisions.",
                    img: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85"
                  },
                  {
                    title: "Amenities",
                    text: "Clear visibility of facilities like WiFi, meals, security, laundry and housekeeping ensures residents understand the living experience before moving in.",
                    img: "https://images.unsplash.com/photo-1556911261-6bd341186b2f"
                  },
                  {
                    title: "Community",
                    text: "PGMate promotes safe, comfortable and transparent living environments where residents feel part of a trusted community.",
                    img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f"
                  },
                  {
                    title: "Technology",
                    text: "Smart dashboards, automation tools and digital records help PG owners manage operations efficiently while improving resident experience.",
                    img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c"
                  }
                ].map((step, i) => (
                  <div
                    key={i}
                    className={`what-step ${activeWhatIndex === i ? "active" : ""}`}
                  >
                    <div className="what-step-inner">
                      <div className="what-step-image">
                        <img src={step.img} alt={step.title} />
                      </div>
                      <div className="what-step-content">
                        <h3>{step.title}</h3>
                        <p>{step.text}</p>
                      </div>
                    </div>

                    {/* DOTS */}
                    <div className="what-dots">
                      {[0, 1, 2, 3].map((dot, i) => (
                        <span
                          key={i}
                          className={activeWhatIndex === i ? "active" : ""}
                          onClick={() => setActiveWhatIndex(i)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* WHY PGMate */}
        <section className="why-pgmate-section">
          <div className="container">
            <h2 className="why-title">
              Why Choose <span>PGMate?</span>
            </h2>
            <div className="why-wrapper">
              {features.map((item, index) => (
                <div
                  key={index}
                  className={`why-card ${activeIndex === index ? "active" : ""}`}
                  onClick={() => setActiveIndex(index)}
                >
                  <div className="why-content">
                    <div className="why-icon">
                      <i className={`bi ${item.icon}`}></i>
                    </div>
                    <h4>{item.title}</h4>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </section>
    </HomeLayout>
  );
};

export default AboutUs;