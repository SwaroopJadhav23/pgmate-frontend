import React,{ useEffect, useRef, useState, useCallback } from "react";
import api from "../../../api/axios";
import "./Textumals.css";

const Textumals = () => {
  const [testimonials, setTestimonials] = useState([]);

  const stripRef = useRef(null);
  const rafRef = useRef(null);
  const isRunningRef = useRef(false);
  const isPausedRef = useRef(false);

  /* BORDER HANDLER */
  const getBorderStyle = (color) => {
    const predefined = [
      "blue",
      "green",
      "orange",
      "purple",
      "yellow",
      "pink",
      "red",
    ];

    if (!color) return {};

    if (predefined.includes(color)) {
      return { className: `border-${color}` };
    }

    return { style: { borderColor: color } };
  };

  /* FETCH */
  useEffect(() => {
    api
      .get("/public/ui-text/user_testimonials")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setTestimonials(res.data);
        }
      })
      .catch(console.error);
  }, []);

  const toggleSnap = useCallback((enable) => {
    const el = stripRef.current;
    if (!el) return;

    el.style.scrollSnapType = enable ? "x mandatory" : "none";
  }, []);

  /* ================= AUTO SCROLL ================= */

  const startScroll = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;

    // 🔥 HARD RESET
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    isRunningRef.current = false;

    toggleSnap(false);

    isRunningRef.current = true;

    const speed = 1.2;

    const scroll = () => {
      if (!isRunningRef.current || !stripRef.current) return;

      if (!isPausedRef.current) {
        el.scrollLeft += speed;

        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }

      rafRef.current = requestAnimationFrame(scroll);
    };

    rafRef.current = requestAnimationFrame(scroll);
  }, [toggleSnap]);

  const stopScroll = useCallback(() => {
    isRunningRef.current = false;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    toggleSnap(true);
  }, [toggleSnap]);

  /* ================= AUTO RECOVERY ================= */

  useEffect(() => {
    if (!testimonials.length) return;

    const timer = setTimeout(() => {
      startScroll();
    }, 500);

    const handleVisibility = () => {
      if (!document.hidden) {
        startScroll();
      }
    };

    const recovery = setInterval(() => {
      if (!rafRef.current && !isPausedRef.current) {
        startScroll();
      }
    }, 3000);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", startScroll);

    return () => {
      clearTimeout(timer);
      stopScroll();
      clearInterval(recovery);

      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", startScroll);
    };

  }, [testimonials, startScroll, stopScroll]);

  // ✅ Manual scroll left function added
  const scrollLeft = () => {
    const el = stripRef.current;
    if (!el) return;
    isPausedRef.current = true;
    el.scrollBy({ left: -360, behavior: "smooth" });
    setTimeout(() => {
      isPausedRef.current = false;
    }, 1000);
  };

  // ✅ Manual scroll right function added
  const scrollRight = () => {
    const el = stripRef.current;
    if (!el) return;
    isPausedRef.current = true;
    el.scrollBy({ left: 360, behavior: "smooth" });
    setTimeout(() => {
      isPausedRef.current = false;
    }, 1000);
  };

  /* ================= UI ================= */

  return (
    <section className="testimonials">
      <div className="container text-center">
        <h2>
          How Residents <span>Use PGMate</span>
        </h2>

        <p className="testimonial-subtitle">
          Real experiences from people who found clarity, comfort, and trust
        </p>
      </div>

      {/* ✅ testimonial-wrapper added to position arrows */}
      <div className="testimonial-wrapper">

        {/* ✅ Left arrow button added */}
        <button className="scroll-arrow scroll-arrow-left" onClick={scrollLeft}>
          ‹
        </button>

        <div
          className="testimonial-strip"
          ref={stripRef}

          /* DESKTOP */
          onMouseEnter={() => (isPausedRef.current = true)}
          onMouseLeave={() => (isPausedRef.current = false)}

          /* MOBILE */
          onTouchStart={() => {
            isPausedRef.current = true;
            stopScroll();
          }}

          onTouchEnd={() => {
            isPausedRef.current = false;
            startScroll();
          }}
        >
          {[...testimonials, ...testimonials].map((t, i) => {
            const border = getBorderStyle(t.color);

            return (
              <div
                key={i}
                className={`testimonial-card ${border.className || ""}`}
                style={border.style}
              >
                <div className="stars">
                  {"★".repeat(t.rating || 5)}
                </div>

                <p className="testimonial-text">"{t.text}"</p>

                <div className="testimonial-user">
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ✅ Right arrow button added */}
        <button className="scroll-arrow scroll-arrow-right" onClick={scrollRight}>
          ›
        </button>

      </div>
    </section>
  );
};

export default React.memo(Textumals);