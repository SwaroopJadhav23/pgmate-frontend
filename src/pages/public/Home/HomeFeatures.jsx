import React,{ useEffect, useState } from "react";
import api from "../../../api/axios";
import EditableText from "../../admin/ManageUI/AdminEditableText";
import { getUIText, saveUIText } from "../../admin/ManageUI/uiText";
import "./HomeFeatures.css";

const HomeFeatures = () => {
  const [images, setImages] = useState([]);

  const isAdmin = !!localStorage.getItem("token");
  const editTextMode = localStorage.getItem("ui_text_edit") === "true";

  const [text, setText] = useState({
    f1_title: "Verified & Trusted PGs",
    f1_desc:
      "Every PG listed on PGMate goes through a verification process so you always get reliable and genuine accommodations.",
    f1_l1: "Owner-verified properties",
    f1_l2: "Accurate listings",
    f1_l3: "Safe & trusted stays",

    f2_title: "Transparent Pricing",
    f2_desc:
      "See complete rent details before you move in — no hidden charges, no last-minute surprises.",
    f2_l1: "Clear rent breakup",
    f2_l2: "Deposit visibility",
    f2_l3: "Honest pricing",

    f3_title: "Direct Owner Communication",
    f3_desc:
      "Skip brokers completely and connect directly with PG owners for faster responses and better trust.",
    f3_l1: "WhatsApp & call support",
    f3_l2: "Faster decision making",
    f3_l3: "Zero brokerage",

    f4_title: "Digital PG Management",
    f4_desc:
      "PG owners can manage rooms, beds, residents, and occupancy digitally from a single dashboard.",
    f4_l1: "Room & bed management",
    f4_l2: "Occupancy tracking",
    f4_l3: "Smart dashboards",

    f5_title: "Hassle-Free Living Experience",
    f5_desc:
      "From search to move-in, PGMate ensures a smooth and stress-free experience for residents.",
    f5_l1: "Easy discovery",
    f5_l2: "Smooth onboarding",
    f5_l3: "Comfortable stays",
  });

  /* 🔹 LOAD FEATURE TEXT */
  useEffect(() => {
  (async () => {
    const data = await getUIText("home_features");
    setText((prev) => ({
      ...prev,
      ...(data || {})
    }));
  })();
}, []);


  /* 🔹 LOAD FEATURE IMAGES */
  useEffect(() => {
    api
      .get("/public/ui-assets?section=home_features")
      .then((res) => {
        if (Array.isArray(res.data)) setImages(res.data);
      })
      .catch(() => setImages([]));
  }, []);

  const save = (key, value) => {
    if (!(isAdmin && editTextMode)) return;
    const updated = { ...text, [key]: value };
    setText(updated);
    saveUIText("home_features", updated);
  };

  const renderList = (keys) => (
    <ul>
      {keys.map((k) => (
        <li key={k}>
          ✔{" "}
          <EditableText
            tag="span"
            value={text[k]}
            editable={isAdmin && editTextMode}
            onSave={(v) => save(k, v)}
          />
        </li>
      ))}
    </ul>
  );

  return (
    <section className="home-features container">

      {/* FEATURE 1 */}
      <div className="hf-row">
        <div className="hf-text">
          <EditableText tag="h2" value={text.f1_title} editable={isAdmin && editTextMode} onSave={(v) => save("f1_title", v)} />
          <EditableText tag="p" value={text.f1_desc} editable={isAdmin && editTextMode} onSave={(v) => save("f1_desc", v)} />
          {renderList(["f1_l1", "f1_l2", "f1_l3"])}
        </div>
        <div className="hf-image">
          <img
  src={images[0]?.imageUrl || "/placeholder.jpg"}
   loading="eager"
decoding="async"
  fetchPriority="high"
  draggable="false"
  alt="Verified PG"
  
/>

        </div>
      </div>

      {/* FEATURE 2 */}
      <div className="hf-row reverse">
        <div className="hf-text">
          <EditableText tag="h2" value={text.f2_title} editable={isAdmin && editTextMode} onSave={(v) => save("f2_title", v)} />
          <EditableText tag="p" value={text.f2_desc} editable={isAdmin && editTextMode} onSave={(v) => save("f2_desc", v)} />
          {renderList(["f2_l1", "f2_l2", "f2_l3"])}
        </div>
        <div className="hf-image">
           <img
  src={images[1]?.imageUrl || "/placeholder.jpg"}
   loading="eager"
decoding="async"
  fetchPriority="high"
  draggable="false"
  alt="Transparent Pricing"
/>
        </div>
      </div>

      {/* FEATURE 3 */}
      <div className="hf-row">
        <div className="hf-text">
          <EditableText tag="h2" value={text.f3_title} editable={isAdmin && editTextMode} onSave={(v) => save("f3_title", v)} />
          <EditableText tag="p" value={text.f3_desc} editable={isAdmin && editTextMode} onSave={(v) => save("f3_desc", v)} />
          {renderList(["f3_l1", "f3_l2", "f3_l3"])}
        </div>
        <div className="hf-image">
          <img
  src={images[2]?.imageUrl || "/placeholder.jpg"}
   loading="eager"
decoding="async"
  fetchPriority="high"
  draggable="false"
  alt="Direct Owners"
/>
        </div>
      </div>

      {/* FEATURE 4 */}
      <div className="hf-row reverse">
        <div className="hf-text">
          <EditableText tag="h2" value={text.f4_title} editable={isAdmin && editTextMode} onSave={(v) => save("f4_title", v)} />
          <EditableText tag="p" value={text.f4_desc} editable={isAdmin && editTextMode} onSave={(v) => save("f4_desc", v)} />
          {renderList(["f4_l1", "f4_l2", "f4_l3"])}
        </div>
        <div className="hf-image">
          <img
  src={images[3]?.imageUrl || "/placeholder.jpg"}
  loading="eager"
decoding="async"
  fetchPriority="high"
  draggable="false"
  alt="Digital Management"
/>
        </div>
      </div>

      {/* FEATURE 5 */}
      <div className="hf-row">
        <div className="hf-text">
          <EditableText tag="h2" value={text.f5_title} editable={isAdmin && editTextMode} onSave={(v) => save("f5_title", v)} />
          <EditableText tag="p" value={text.f5_desc} editable={isAdmin && editTextMode} onSave={(v) => save("f5_desc", v)} />
          {renderList(["f5_l1", "f5_l2", "f5_l3"])}
        </div>
        <div className="hf-image">
            <img
  src={images[4]?.imageUrl || "/placeholder.jpg"}
 loading="eager"
  decoding="async"
  fetchPriority="high"
  draggable="false"
  alt="Comfortable Living"
  
/>
        </div>
      </div>

    </section>
  );
};

export default React.memo(HomeFeatures);
