import "./LocationModal.css";

const LocationModal = ({ open, onClose, onDetect, loading }) => {
  if (!open) return null;

  const handleDetect = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      onClose();
      return;
    }

    // ✅ Use maximumAge to return cached position instantly if available
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // ✅ Save to localStorage so it's never asked again
        localStorage.setItem("locationPermission", "granted");
        localStorage.setItem("userLat", latitude);
        localStorage.setItem("userLng", longitude);
        // ✅ Close modal immediately before any async work
        onClose();
        // ✅ Pass coords up if parent needs them
        if (onDetect) onDetect(latitude, longitude);
      },
      (error) => {
        console.error("Location error:", error);
        localStorage.setItem("locationPermission", "denied");
        onClose();
      },
      {
        enableHighAccuracy: false, // ✅ false = much faster (uses network/cell tower)
        timeout: 8000,             // ✅ 8s max wait
        maximumAge: 5 * 60 * 1000 // ✅ reuse cached position up to 5 min old
      }
    );
  };

  return (
    <div className="location-overlay">
      <div className="location-card">

        <button className="location-close" onClick={onClose}>✕</button>

        <div className="location-icon-wrap">
          <svg className="location-pin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="10" r="4" fill="#6366f1"/>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#6366f1" opacity="0.25"/>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="none" stroke="#6366f1" strokeWidth="1.5"/>
            <circle cx="12" cy="9" r="2.5" fill="#fff"/>
          </svg>
        </div>

        <div className="location-top">
          <h2>Enable Location</h2>
          <p>Find PGs near you instantly</p>
        </div>

        <div className="location-pills">
          <div className="location-pill"><span>⚡</span> Fast results</div>
          <div className="location-pill"><span>📍</span> Nearby PGs</div>
        </div>

        {/* ✅ Use internal handleDetect instead of prop onDetect */}
        <button
          className="location-primary"
          onClick={handleDetect}
          disabled={loading}
        >
          {loading ? "Detecting..." : "Use My Location"}
        </button>

        <button className="location-skip" onClick={onClose}>
          Skip for now
        </button>

      </div>
    </div>
  );
};

export default LocationModal;