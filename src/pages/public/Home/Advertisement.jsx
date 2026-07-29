import React,{ useEffect, useRef, useState } from "react";
import api from "../../../api/axios";
import EditableText from "../../admin/ManageUI/AdminEditableText";
import { getUIText, saveUIText } from "../../admin/ManageUI/uiText";
import "./Advertisement.css";

const defaultText = [
  { title: "Wake Up Happy", text: "Bright mornings & peaceful stays" },
  { title: "Moments That Matter", text: "Laugh, live & grow together" },
  { title: "Comfort Comes First", text: "Clean, cozy & fully furnished" },
  { title: "Feel at Home", text: "A place you actually enjoy living" },
  { title: "Calm Living", text: "Balanced life, zero stress" },
];
 
const Advertisement = () => {
  const stripRef = useRef(null);
  const [ads, setAds] = useState([]);
  const [texts, setTexts] = useState(defaultText);

  const isAdmin = !!localStorage.getItem("token");
  const editTextMode = localStorage.getItem("ui_text_edit") === "true";

  /* 🔹 LOAD TEXT */
 useEffect(() => {
  (async () => {
    const data = await getUIText("home_ads");
    setTexts(
      Array.isArray(data) && data.length ? data : defaultText
    );
  })();
}, []);


  /* 🔹 LOAD IMAGES */
  useEffect(() => {
    api
      .get("/public/ui-assets?section=home_ads")
      .then((res) => setAds(res.data || []))
      .catch(() => setAds([]));
  }, []);

  /* 🔹 AUTO SCROLL (UNCHANGED) */
useEffect(() => {
  if (!stripRef.current || ads.length === 0) return;

  const el = stripRef.current;
  let rafId;
  let lastTime = 0;

  const speed = 0.4; // smoother

  const scroll = (time) => {
    if (!lastTime) lastTime = time;
    const delta = time - lastTime;

    if (delta > 16) { // ~60fps
      el.scrollLeft += speed;

      if (el.scrollLeft >= el.scrollWidth / 2) {
        el.scrollLeft = 0;
      }

      lastTime = time;
    }

    rafId = requestAnimationFrame(scroll);
  };

  rafId = requestAnimationFrame(scroll);

  return () => {
    cancelAnimationFrame(rafId);
  };
}, [ads]);

  /* 🔹 SAVE TEXT */
  const save = (index, key, value) => {
    if (!(isAdmin && editTextMode)) return;

    const updated = [...texts];
    updated[index] = { ...updated[index], [key]: value };

    setTexts(updated);
    saveUIText("home_ads", updated);
  };

  return (
    <section className="lifestyle-ads container-fluid">
      <div className="container">
        <h2 className="text-center fw-bold mb-2">
          Life is Better with <span>PGMate</span>
        </h2>
        <p className="ads-subtitle">
          Not just a stay. A better way of living.
        </p>
      </div>

      <div className="ads-strip" ref={stripRef}>
        {[...ads, ...ads].map((ad, i) => {
          const index = i % texts.length;
          const content = texts[index];

          return (
            <div className="ads-card" key={i}>
              <div className="img-wrapper">
                <img
                src={ad.imageUrl}
                alt={content.title}
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />

              </div>

              <div className="ads-text">
                <EditableText
                  tag="h5"
                  value={content.title}
                  editable={isAdmin && editTextMode}
                  onSave={(v) => save(index, "title", v)}
                />
                <EditableText
                  tag="p"
                  value={content.text}
                  editable={isAdmin && editTextMode}
                  onSave={(v) => save(index, "text", v)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default React.memo(Advertisement);
