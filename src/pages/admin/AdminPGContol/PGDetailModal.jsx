import { FaImage, FaVideo } from "react-icons/fa";
import { useState } from "react";

const PGDetailModal = ({ pgDetail, onClose }) => {

  const [mediaIndex, setMediaIndex] = useState(0);
  const [mediaType, setMediaType] = useState("image");
  const [showMediaViewer, setShowMediaViewer] = useState(false);

  const showValue = (value, fallback = "Not specified") =>
    value && value.length !== 0 ? value : fallback;

  return (
    <>
      {/* ================= PG DETAILS MODAL ================= */}

        <div
        className="modal-backdrop-custom"
        onClick={onClose}
        >
          <div
            className="modal-box"
            style={{ maxWidth: "900px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-custom">
              <h4>PG Details</h4>
            <button
            className="modal-close"
            onClick={onClose}
            >
                ✕
              </button>
            </div>

            <div>
              {!pgDetail ? (
                <div className="text-center p-5">Loading PG Details...</div>
              ) : (
                <>
                  {/* ========= HEADER ========= */}
                  <div className="pg-header">
                    <h3 className="mb-0">{pgDetail.name}</h3>

                    <span
                      className={`badge ${
                        pgDetail.status === "ACTIVE"
                          ? "bg-success"
                          : "bg-secondary"
                      }`}
                    >
                      {pgDetail.status}
                    </span>
                  </div>

                  <p className="fw-semibold mb-1">
                    Owner: {pgDetail.ownerName}
                  </p>

                  <p className="text-muted mb-4">
                    {pgDetail.locality}, {pgDetail.city}
                  </p>

                  {/* ========= MEDIA ========= */}
                  <div className="media-section">
                    {pgDetail.imageUrls?.length ? (
                      <button
                        className="media-view-btn"
                        onClick={() => {
                          setMediaType("image");
                          setMediaIndex(0);
                          setShowMediaViewer(true);
                        }}
                      >
                        <FaImage /> View Images ({pgDetail.imageUrls.length})
                      </button>
                    ) : (
                      <span className="empty-text">No Images Available</span>
                    )}

                    {pgDetail.videoUrls?.length ? (
                      <button
                        className="media-view-btn"
                        onClick={() => {
                          setMediaType("video");
                          setMediaIndex(0);
                          setShowMediaViewer(true);
                        }}
                      >
                        <FaVideo /> View Videos ({pgDetail.videoUrls.length})
                      </button>
                    ) : (
                      <span className="empty-text">No Videos Available</span>
                    )}
                  </div>
                  {/* ========= ABOUT ========= */}
                  <h6 className="section-title mt-4">About Property</h6>

                  <p className="about-text">
                    {showValue(pgDetail.aboutDescription)}
                  </p>

                  {/* ========= ROOM OPTIONS ========= */}
                  <h6 className="section-title mt-4">Room Options</h6>

                  <div className="room-grid">
                    {pgDetail.floors?.flatMap((floor) =>
                      floor.rooms?.map((room) => {
                        const availableBeds =
                          room.beds?.filter((b) => b.status === "AVAILABLE")
                            .length || 0;

                        return (
                          <div key={room.roomId} className="room-card">
                            <h6>{room.sharingType} Sharing</h6>

                            <p>₹{room.monthlyRent}/month</p>

                            <small>
                              Beds: {room.beds?.length || 0}
                              {" • "}
                              Available: {availableBeds}
                            </small>
                          </div>
                        );
                      }),
                    )}
                  </div>

                  {/* ========= AMENITIES ========= */}
                  <h6 className="section-title mt-4">Amenities</h6>

                  <div className="chip-container">
                    {pgDetail.amenities?.length ? (
                      pgDetail.amenities.map((a, i) => (
                        <span key={i} className="chip">
                          {a}
                        </span>
                      ))
                    ) : (
                      <p className="empty-text">Amenities not specified</p>
                    )}
                  </div>

                  {/* ========= HOUSE RULES ========= */}
                  <h6 className="section-title mt-4">House Rules</h6>
                  <ul className="rules-list">
                    {pgDetail.houseRules?.length ? (
                      pgDetail.houseRules.map((r, i) => <li key={i}>{r}</li>)
                    ) : (
                      <p className="empty-text">No house rules specified</p>
                    )}
                  </ul>

                  {/* ========= FLOOR DETAILS ========= */}
                  <h6 className="section-title mt-4">Floor Details</h6>

                  {pgDetail.floors?.length ? (
                    pgDetail.floors.map((floor) => {
                      const totalRooms = floor.rooms?.length || 0;

                      const totalBeds =
                        floor.rooms?.reduce(
                          (sum, r) => sum + (r.beds?.length || 0),
                          0,
                        ) || 0;

                      const availableBeds =
                        floor.rooms?.reduce(
                          (sum, r) =>
                            sum +
                            (r.beds?.filter((b) => b.status === "AVAILABLE")
                              .length || 0),
                          0,
                        ) || 0;

                      const occupiedBeds = totalBeds - availableBeds;

                      const sharingTypes = [
                        ...new Set(floor.rooms?.map((r) => r.sharingType)),
                      ];

                      return (
                        <div
                          key={floor.floorId}
                          className="floor-card detailed"
                        >
                          <h6 className="fw-bold mb-3">
                            Floor {floor.floorNumber}
                          </h6>

                          <div className="floor-stats">
                            <span>
                              <strong>Rooms:</strong> {totalRooms}
                            </span>

                            <span>
                              <strong>Total Beds:</strong> {totalBeds}
                            </span>

                            <span className="available">
                              <strong>Available:</strong> {availableBeds}
                            </span>

                            <span className="occupied">
                              <strong>Occupied:</strong> {occupiedBeds}
                            </span>

                            <span>
                              <strong>Sharing:</strong>{" "}
                              {sharingTypes.length
                                ? sharingTypes.join(", ")
                                : "Not specified"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="empty-text">Floor details not specified</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

      {/* ================= MEDIA VIEWER ================= */}

      {showMediaViewer && (
        <div
          className="modal-backdrop-custom"
          onClick={() => setShowMediaViewer(false)}
        >
          <div
            className="modal-box"
            style={{ maxWidth: "900px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="media-viewer-body">
              <button
                className="media-close"
                onClick={() => setShowMediaViewer(false)}
              >
                ✕
              </button>

              <button
                className="media-nav prev"
                onClick={() => setMediaIndex((i) => Math.max(i - 1, 0))}
              >
                ‹
              </button>

              {mediaType === "image" ? (
                <img
                  src={pgDetail?.imageUrls?.[mediaIndex]}
                  alt={pgDetail?.name || "PG preview"}
                  className="viewer-media"
                />
              ) : (
                <video
                  controls
                  src={pgDetail?.videoUrls?.[mediaIndex]}
                  className="viewer-media"
                />
              )}

              <button
                className="media-nav next"
                onClick={() =>
                  setMediaIndex((i) =>
                    mediaType === "image"
                      ? Math.min(i + 1, pgDetail.imageUrls.length - 1)
                      : Math.min(i + 1, pgDetail.videoUrls.length - 1),
                  )
                }
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default PGDetailModal;