import { useEffect, useState } from "react";
import EditableText from "../../admin/ManageUI/AdminEditableText";
import { getUIText, saveUIText } from "../../admin/ManageUI/uiText";
import "./HomeStats.css";

const defaultStats = [
  { label: "PGs Onboarded", value: 500, suffix: "+" },
  { label: "Beds Managed", value: 15000, suffix: "+" },
  { label: "Cities Covered", value: 20, suffix: "+" },
  { label: "Digital Management", value: 100, suffix: "%" },
];

const HomeStats = () => {
  const isAdmin = !!localStorage.getItem("token");
  const editTextMode = localStorage.getItem("ui_text_edit") === "true";

  const [stats, setStats] = useState(defaultStats);
  const [counts, setCounts] = useState(defaultStats.map(() => 0));

  /* 🔹 LOAD TEXT */
  useEffect(() => {
  (async () => {
    const data = await getUIText("home_stats");
    if (Array.isArray(data)) {
      setStats(data.length ? data : defaultStats);
      setCounts((data.length ? data : defaultStats).map(() => 0));
    }
  })();
}, []);


  /* 🔹 ANIMATION (UNCHANGED) */
  useEffect(() => {
    const interval = setInterval(() => {
      setCounts((prev) =>
        prev.map((c, i) =>
          c < stats[i].value
            ? c + Math.ceil(stats[i].value / 40)
            : c
        )
      );
    }, 40);

    return () => clearInterval(interval);
  }, [stats]);

  const save = (index, key, value) => {
    if (!(isAdmin && editTextMode)) return;

    const updated = [...stats];
    updated[index] = {
      ...updated[index],
      [key]: key === "value" ? Number(value) || 0 : value,
    };

    setStats(updated);
    saveUIText("home_stats", updated);
  };

  return (
    <section className="pg-stats">
      <div className="container">
        <div className="row g-4">
          {stats.map((s, i) => (
            <div key={i} className="col-12 col-sm-6 col-md-3">
              <div className="stat-card">
                <h2>
                  {Math.min(counts[i], s.value)}
                  <EditableText
                    tag="span"
                    value={s.suffix || "+"}
                    editable={isAdmin && editTextMode}
                    onSave={(v) => save(i, "suffix", v)}
                  />
                </h2>

                <EditableText
                  tag="p"
                  value={s.label}
                  editable={isAdmin && editTextMode}
                  onSave={(v) => save(i, "label", v)}
                />

                {isAdmin && editTextMode && (
                  <EditableText
                    tag="small"
                    value={String(s.value)}
                    editable
                    onSave={(v) => save(i, "value", v)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeStats;
