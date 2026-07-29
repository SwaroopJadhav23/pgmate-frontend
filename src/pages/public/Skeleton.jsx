import "./Skeleton.css";

export const PGListingSkeleton = ({ count = 6 }) => {
  return (
    <div className="pg-results-grid home-pg-results-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="pg-listing-card skeleton-card">
          
          {/* IMAGE */}
          <div className="skeleton-image" />

          {/* BODY */}
          <div className="skeleton-body">
            
            {/* TITLE */}
            <div className="skeleton-line skeleton-title" />

            {/* LOCATION */}
            <div className="skeleton-line skeleton-location" />

            {/* DIVIDER */}
            <div className="skeleton-divider" />

            {/* PRICE */}
            <div className="skeleton-line skeleton-price" />
          </div>
        </div>
      ))}
    </div>
  );
};


// TABLE SKELETON
export const TableSkeleton = ({ rows = 5, cols = 10 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j}>
              <div className="skeleton-line skeleton-table-cell" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

// ✅ MOBILE OWNER CARD SKELETON
export const OwnerCardSkeleton = ({ count = 4 }) => {
  return (
    <div className="owners-card-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="owner-card skeleton-card">

          {/* Top */}
          <div className="owner-card-top">
            <div className="skeleton-avatar" />
            <div className="owner-card-info">
              <div className="skeleton-pill w-60" />
              <div className="skeleton-pill w-40 mt-2" />
            </div>
          </div>

          {/* Row */}
          <div className="owner-card-row">
            <div className="skeleton-pill w-70" />
            <div className="skeleton-pill w-40" />
          </div>

          {/* Stats */}
          <div className="owner-card-stats">
            <div className="skeleton-pill w-50" />
            <div className="skeleton-pill w-40" />
          </div>

          {/* Actions */}
          <div className="owner-card-actions">
            <div className="skeleton-btn" />
            <div className="skeleton-btn" />
            <div className="skeleton-btn" />
          </div>

        </div>
      ))}
    </div>
  );
};

export const UniversalCardSkeleton = ({ count = 4 }) => {
  return (
    <div className="pg-card-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="pg-card skeleton-card">

          {/* Top section */}
          <div className="pg-card-body">

            <div className="pg-card-top">
              <div style={{ flex: 1 }}>
                <div className="skeleton-line skeleton-title w-60" />
                <div className="skeleton-line skeleton-sub w-40 mt-2" />
              </div>

              {/* Right badge */}
              <div className="skeleton-badge" />
            </div>

            {/* Meta row */}
            <div className="pg-card-meta">
              <div className="skeleton-pill w-30" />
              <div className="skeleton-pill w-30" />
            </div>

            {/* Toggle / extra row */}
            <div className="pg-card-meta mt-2">
              <div className="skeleton-pill w-40" />
              <div className="skeleton-pill w-40" />
            </div>

            {/* Buttons */}
           <div className="pg-card-actions single">
            <div className="skeleton-btn full" />
          </div>

          </div>
        </div>
      ))}
    </div>
  );
};