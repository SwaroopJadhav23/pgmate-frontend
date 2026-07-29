import "../../CSS/filterSidebar.css";

const FilterSidebar = ({
  filters,
  onChange,
  cityOptions = [],
  localityOptions = [],
  cityLocked = false,
  isMobileOpen,
  onClose,
}) => {
  const update = (key, value) => {
    let next = {...filters, [key]: value};

    if (key === "stayType" && value === "COLIVING") {
      next.gender = "UNISEX";
    }

    if (
      key === "stayType" &&
      value !== "COLIVING" &&
      filters.gender === "UNISEX"
    ) {
      next.gender = "";
    }

    if (
      key === "gender" &&
      filters.stayType === "COLIVING" &&
      value !== "UNISEX"
    ) {
      return;
    }

    onChange(next);
  };

  const handleCityChange = (e) => {
    if (cityLocked) return;
    onChange({...filters, city: e.target.value, locality: ""});
  };

  const renderOption = (
    groupName,
    checked,
    label,
    onSelect,
    disabled = false,
  ) => (
    <label
      className={`pg-filter-option${checked ? " is-active" : ""}${disabled ? " is-disabled" : ""}`}
    >
      <input
        type="radio"
        name={groupName}
        checked={checked}
        onChange={onSelect}
        disabled={disabled}
      />
      <span className="pg-filter-option__text">{label}</span>
    </label>
  );

  const isColiving = filters.stayType === "COLIVING";

  return (
    <aside className={`pg-filter-sidebar${isMobileOpen ? " is-open" : ""}`}>
      <div className="pg-filter-sidebar__header">
        <h3>Filters</h3>
        {isMobileOpen && (
          <button
            className="pg-filter-sidebar__close"
            onClick={onClose}
            aria-label="Close filters"
          >
            x
          </button>
        )}
      </div>

      <div className="pg-filter-group">
        <label>City</label>
        <select
          value={filters.city}
          onChange={handleCityChange}
          disabled={cityLocked}
        >
          <option value="">All Cities</option>
          {cityOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {cityLocked && filters.city && (
          <p className="pg-filter-note">Showing results in {filters.city}</p>
        )}
      </div>

      <div className="pg-filter-group">
        <label>Locality</label>
        {!filters.city ? (
          <p className="pg-filter-note">Select a city first</p>
        ) : (
          <div className="pg-filter-options pg-filter-options--scrollable">
            {renderOption(
              "locality",
              filters.locality === "",
              "All localities",
              () => update("locality", ""),
            )}
            {localityOptions.map((l) => (
              <div key={l}>
                {renderOption("locality", filters.locality === l, l, () =>
                  update("locality", l),
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pg-filter-divider" />

      <div className="pg-filter-group">
        <label>Stay Type</label>
        <div className="pg-filter-options">
          {renderOption("stayType", filters.stayType === "", "Any", () =>
            update("stayType", ""),
          )}
          {renderOption(
            "stayType",
            filters.stayType === "COLIVING",
            "Co-living (Unisex)",
            () => update("stayType", "COLIVING"),
          )}
          {renderOption(
            "stayType",
            filters.stayType === "STUDENT",
            "Student PG",
            () => update("stayType", "STUDENT"),
          )}
        </div>
      </div>

      <div className="pg-filter-group">
        <label>Gender</label>
        <div className="pg-filter-options">
          {renderOption(
            "gender",
            filters.gender === "",
            "All",
            () => update("gender", ""),
            isColiving,
          )}
          {renderOption(
            "gender",
            filters.gender === "MALE",
            "Men",
            () => update("gender", "MALE"),
            isColiving,
          )}
          {renderOption(
            "gender",
            filters.gender === "FEMALE",
            "Women",
            () => update("gender", "FEMALE"),
            isColiving,
          )}
          {renderOption("gender", filters.gender === "UNISEX", "Unisex", () =>
            update("gender", "UNISEX"),
          )}
        </div>
        {isColiving && (
          <p className="pg-filter-note">Co-living is Unisex only</p>
        )}
      </div>

      <div className="pg-filter-divider" />

      <div className="pg-filter-group">
        <label>Room Type</label>
        <div className="pg-filter-options">
          {renderOption("sharing", filters.sharingType === "", "All", () =>
            update("sharingType", ""),
          )}
          {renderOption(
            "sharing",
            filters.sharingType === "SINGLE",
            "Private Room",
            () => update("sharingType", "SINGLE"),
          )}
          {renderOption(
            "sharing",
            filters.sharingType === "DOUBLE",
            "2 Sharing",
            () => update("sharingType", "DOUBLE"),
          )}
          {renderOption(
            "sharing",
            filters.sharingType === "TRIPLE",
            "3 Sharing",
            () => update("sharingType", "TRIPLE"),
          )}
          {renderOption(
            "sharing",
            filters.sharingType === "QUADRUPLE",
            "4 Sharing",
            () => update("sharingType", "QUADRUPLE"),
          )}
          {renderOption(
            "sharing",
            filters.sharingType === "CUSTOM",
            "5+ Sharing",
            () => update("sharingType", "CUSTOM"),
          )}
        </div>
      </div>
      <div className="pg-filter-group">
        <label>AC Type</label>
        <div className="pg-filter-options">
          {renderOption("roomType", filters.roomType === "", "All", () =>
            update("roomType", ""),
          )}
          {renderOption("roomType", filters.roomType === "AC", "AC Room ", () =>
            update("roomType", "AC"),
          )}
          {renderOption(
            "roomType",
            filters.roomType === "NON_AC",
            "Non-AC",
            () => update("roomType", "NON_AC"),
          )}
        </div>
      </div>

      <div className="pg-filter-group">
        <div className="pg-filter-price-row">
          <label>Max Price</label>
          <span className="pg-filter-price-value">
            ₹{filters.maxPrice.toLocaleString()}
          </span>
        </div>
        <input
          type="range"
          min="1000"
          max="30000"
          step="500"
          value={filters.maxPrice}
          style={{
            "--range-value": `${((filters.maxPrice - 1000) / 29000) * 100}%`,
          }}
          onChange={(e) => update("maxPrice", Number(e.target.value))}
        />
        <div className="pg-filter-range-labels">
          <span>₹1,000</span>
          <span>₹30,000</span>
        </div>
      </div>

      <div className="pg-filter-divider" />

      <div className="pg-filter-group">
        <label>Sort By</label>
        <div className="pg-filter-options">
          {renderOption("sort", filters.sort === "", "Default", () =>
            update("sort", ""),
          )}
          {renderOption(
            "sort",
            filters.sort === "LOW_HIGH",
            "Price: Low to High",
            () => update("sort", "LOW_HIGH"),
          )}
          {renderOption(
            "sort",
            filters.sort === "HIGH_LOW",
            "Price: High to Low",
            () => update("sort", "HIGH_LOW"),
          )}
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
