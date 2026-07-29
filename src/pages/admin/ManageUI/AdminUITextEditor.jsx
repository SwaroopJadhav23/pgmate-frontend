const getLabel = (key) => {
  if (key === "heading") return "Title";
  if (key === "subtext") return "Subtitle";

  if (key.endsWith("_title")) return "Title";
  if (key.endsWith("_desc")) return "Subtitle";
  if (key.endsWith("_l1")) return "Point 1";
  if (key.endsWith("_l2")) return "Point 2";
  if (key.endsWith("_l3")) return "Point 3";

  return key;
};

const AdminUITextEditor = ({ data, onChange }) => {
  if (!data) return null;

  /* ARRAY (ads, stats) */
  if (Array.isArray(data)) {
    return data.map((item, i) => (
      <div key={i} className="card p-3 mb-3">
        <h6>Item {i + 1}</h6>
        {Object.keys(item).map((key) => (
          <div key={key} className="mb-2">
            <label>{getLabel(key)}</label>
            <input
              className="form-control"
              value={item[key]}
              onChange={(e) => {
                const updated = [...data];
                updated[i] = { ...updated[i], [key]: e.target.value };
                onChange(updated);
              }}
            />
          </div>
        ))}
      </div>
    ));
  }

  /* SIMPLE OBJECT (banner) */
  return Object.keys(data).map((key) => (
    <div key={key} className="mb-3">
      <label>{getLabel(key)}</label>
      <textarea
        className="form-control"
        rows={key === "subtext" ? 3 : 2}
        value={data[key]}
        onChange={(e) =>
          onChange({ ...data, [key]: e.target.value })
        }
      />
    </div>
  ));
};

export default AdminUITextEditor;
