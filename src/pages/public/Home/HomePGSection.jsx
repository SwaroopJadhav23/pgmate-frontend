import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import api from "../../../api/axios";
import PGListingCard from "../PGListingCard";
import "../../../CSS/publicPG.css";
import "./HomePGSection.css";
import PGMateBanner from "./PGMateBanner";
import {PGListingSkeleton} from "../Skeleton";
import LocationModal from "../../../components/LocationModal";
import {useCityFilter} from "../../../context/CityFilterContext";
import WhyChoosePGMate from "./WhyChoosePgMate";
import FeaturedPGs from "./FeaturedPgs";
import PopularCities from "./PopularCities";
import AppDownloadStrip from "./AppDownloadStrip";
import LookingForSection from "./LookingForSection";
import TenantOwnerSplit from "./TenantOwnerSplit";
import Testimonials from "./Testimonials";
import StatsStrip from "./StatsStrip";
import WhyChoosePGMateRow from "./WhyChoosePgMateRow";
import { SORTED_INDIAN_CITIES } from "../../../constants/indianCities";

const HOME_PAGE_SIZE = 15;

const CustomSelect = ({
  id,
  className = "",
  options,
  value,
  onChange,
  isOpen,
  onToggle,
  onClose,
  placeholder,
  disabled = false,
}) => {
  const buttonRef = useRef(null);
  const listRef = useRef(null);

  const selectedOption =
    options.find((option) => option.value === value) || options[0];
  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  );
  const [highlightedIndex, setHighlightedIndex] = useState(selectedIndex);

  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(selectedIndex);
    }
  }, [isOpen, selectedIndex]);

  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const activeOption = listRef.current.querySelector(
      '[data-highlighted="true"]',
    );
    activeOption?.scrollIntoView({block: "nearest"});
  }, [highlightedIndex, isOpen]);

  const selectOption = (nextValue) => {
    onChange(nextValue);
    onClose();
    buttonRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (disabled) return;
    if (!isOpen) {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        onToggle();
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      buttonRef.current?.focus();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % options.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex(
        (prev) => (prev - 1 + options.length) % options.length,
      );
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectOption(options[highlightedIndex].value);
      return;
    }
    if (event.key === "Tab") {
      onClose();
    }
  };

  return (
    <div
      className={`custom-select ${isOpen ? "is-open" : ""} ${disabled ? "is-disabled" : ""} ${className}`.trim()}
    >
      <button
        ref={buttonRef}
        type="button"
        className="custom-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${id}-listbox`}
        onClick={() => !disabled && onToggle()}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      >
        <span
          className={`custom-select__label ${selectedOption?.value === "" ? "is-placeholder" : ""}`}
        >
          {selectedOption?.label || placeholder}
        </span>
        <span className="custom-select__icon" aria-hidden="true">
          <i className="bi bi-chevron-down" />
        </span>
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          id={`${id}-listbox`}
          className="custom-select__menu"
          role="listbox"
          aria-activedescendant={`${id}-option-${highlightedIndex}`}
          tabIndex={-1}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = highlightedIndex === index;
            return (
              <li
                key={`${id}-${option.value || "empty"}-${index}`}
                role="presentation"
              >
                <button
                  id={`${id}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-highlighted={isHighlighted}
                  className={`custom-select__option ${isSelected ? "is-selected" : ""} ${isHighlighted ? "is-highlighted" : ""}`.trim()}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectOption(option.value)}
                >
                  <span>{option.label}</span>
                  {isSelected && (
                    <span className="custom-select__check" aria-hidden="true">
                      <i className="bi bi-check2" />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const citySelectOptions = (cities) => [
  {value: "", label: "All Cities"},
  ...cities.map((city) => ({value: city, label: city})),
];

const localitySelectOptions = (localities) => [
  {value: "", label: "All Localities"},
  ...localities.map((locality) => ({value: locality, label: locality})),
];

const genderOptions = [
  {value: "", label: "Gender"},
  {value: "MALE", label: "Men"},
  {value: "FEMALE", label: "Women"},
  {value: "UNISEX", label: "Unisex"},
];

const stayTypeOptions = [
  {value: "", label: "Stay Type"},
  {value: "COLIVING", label: "Coliving"},
  {value: "STUDENT", label: "Student"},
];

const sharingTypeOptions = [
  {value: "", label: "Sharing"},
  {value: "SINGLE", label: "Private"},
  {value: "DOUBLE", label: "2 Sharing"},
  {value: "TRIPLE", label: "3 Sharing"},
];

const roomTypeOptions = [
  {value: "", label: "Room Type"},
  {value: "AC", label: "AC"},
  {value: "NON_AC", label: "Non-AC"},
];

// const priceOptions = [
//   { value: 30000, label: "Rs 30000" },
//   { value: 20000, label: "Rs 20000" },
//   { value: 15000, label: "Rs 15000" },
//   { value: 10000, label: "Rs 10000" },
//   { value: 8000, label: "Rs 8000" },
// ];

// const sortOptions = [
//   { value: "", label: "Sort" },
//   { value: "LOW_HIGH", label: "Price Low to High" },
//   { value: "HIGH_LOW", label: "Price High to Low" },
// ];

const HomePGSection = ({setShowLocationModal, showLocationModal}) => {
  const navigate = useNavigate();
  const [pgs, setPgs] = useState([]);
  const [selectedPG, setSelectedPG] = useState(null);
  const [pgReviews, setPgReviews] = useState([]);
  const [cityOptions, setCityOptions] = useState(["Pune"]);
  const [localityOptions, setLocalityOptions] = useState([]);
  const [imgIndex, setImgIndex] = useState({});
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const searchWrapRef = useRef(null);
  const dropdownHostRef = useRef(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const {selectedCity, setSelectedCity} = useCityFilter();
  const [isExactCity, setIsExactCity] = useState(false);

  const CITY_MAP = {Bengaluru: "Bangalore", Bombay: "Mumbai", Gurugram: "Mumbai", Gurgaon: "Mumbai"};
  const normalizeCity = (city) => CITY_MAP[city] || city;

  const [filters, setFilters] = useState({
    city: selectedCity,
    locality: "",
    gender: "",
    stayType: "",
    sharingType: "",
    sort: "",
    maxPrice: 30000,
    roomType: "",
  });

  // const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
  //   if (key === "city" || (key === "maxPrice" && value === 30000)) return false;
  //   return value !== "";
  // }).length;

  const citySelectList = useMemo(
    () => citySelectOptions(cityOptions),
    [cityOptions],
  );
  const localitySelectList = useMemo(
    () => localitySelectOptions(localityOptions),
    [localityOptions],
  );

  const prevImg = (pgId) =>
    setImgIndex((prev) => ({
      ...prev,
      [pgId]: Math.max((prev[pgId] || 0) - 1, 0),
    }));
  const nextImg = (pgId, total) =>
    setImgIndex((prev) => ({
      ...prev,
      [pgId]: Math.min((prev[pgId] || 0) + 1, total - 1),
    }));

  useEffect(() => {
    setFilters((prev) => ({...prev, city: selectedCity, locality: ""}));
  }, [selectedCity]);

  useEffect(() => {
    api
      .get("/public/cities")
      .then((res) => {
        const cities = res.data || [];
        const merged = [...new Set([...cities, ...SORTED_INDIAN_CITIES])];
        const sortedCities = merged.filter((city) => city !== "Pune").sort();
        setCityOptions(["Pune", ...sortedCities]);
      })
      .catch(() => {
        const sortedCities = SORTED_INDIAN_CITIES.filter((city) => city !== "Pune").sort();
        setCityOptions(["Pune", ...sortedCities]);
      });
  }, []);

  useEffect(() => {
    if (!filters.city) {
      setLocalityOptions([]);
      return;
    }
    api
      .get("/public/localities", {params: {city: filters.city}})
      .then((res) => setLocalityOptions(res.data || []))
      .catch(() => setLocalityOptions([]));
  }, [filters.city]);

  useEffect(() => {
    if (!searchText.trim()) {
      setSuggestions([]);
      return;
    }
    const query = searchText.toLowerCase();
    const citySuggestions = cityOptions
      .filter((city) => city.toLowerCase().includes(query))
      .map((city) => ({type: "city", label: city}));
    const localitySuggestions = localityOptions
      .filter((locality) => locality.toLowerCase().includes(query))
      .map((locality) => ({
        type: "locality",
        label: `${locality}, ${filters.city}`,
        city: filters.city,
        locality,
      }));
    setSuggestions([...citySuggestions, ...localitySuggestions].slice(0, 8));
  }, [searchText, localityOptions, filters.city]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(event.target)
      )
        setShowSuggestions(false);
      if (
        dropdownHostRef.current &&
        !dropdownHostRef.current.contains(event.target)
      )
        setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  const loadPGs = useCallback(async () => {
    try {
      setLoading(true);

      const query = searchText.trim();

      const params = {
        page: 0,
        size: HOME_PAGE_SIZE,
        gender: filters.gender || undefined,
        stayType: filters.stayType || undefined,
        sharingType: filters.sharingType || undefined,
        roomType: filters.roomType || undefined,
        sort: filters.sort || undefined,
      };

      if (query && !isExactCity) {
        params.search = query;
      } else {
        params.city = filters.city || undefined;
        params.locality = filters.locality || undefined;
        params.maxPrice = filters.maxPrice;
      }

      const res = await api.get("/public/pgs/paged", {params});
      const content = res.data?.content || [];
      setPgs(content);
      setTotalElements(content.length);
    } catch (err) {
      console.error(err);
      setPgs([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [filters, searchText, isExactCity]);

  useEffect(() => {
    if (!isInitialized) return;
    // loadPGs(0, false);
    loadPGs();
  }, [loadPGs, isInitialized]);

  const openReviews = (pg) => {
    api.get(`/public/pg/${pg.id}/reviews`).then((res) => {
      setPgReviews(res.data || []);
      setSelectedPG(pg);
    });
  };

  const resetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      locality: "",
      gender: "",
      stayType: "",
      sharingType: "",
      sort: "",
      maxPrice: 30000,
      roomType: "",
    }));
    setOpenDropdown(null);
  };

  const toggleDropdown = (id) => {
    setOpenDropdown((prev) => (prev === id ? null : id));
  };

  // useEffect(() => {
  //   const savedCity = localStorage.getItem("userCity");
  //   if (savedCity) {
  //     setSelectedCity(savedCity);
  //     setFilters((prev) => ({...prev, city: savedCity}));
  //   }
  //   setIsInitialized(true);
  // }, []);

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  const detectLocation = () => {
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const res = await api.get("/api/location/city", {params: {lat, lng}});
          let city = normalizeCity(res.data);
          localStorage.setItem("userCity", city);
          setSelectedCity(city);
          setFilters((prev) => ({...prev, city}));
          setShowLocationModal(false);
        } catch (err) {
          console.error(err);
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setShowLocationModal(false);
        setDetectingLocation(false);
      },
    );
  };

  return (
    <>
      <LocationModal
        open={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onDetect={detectLocation}
        loading={detectingLocation}
      />

      <section ref={dropdownHostRef} className="home-pg-discovery">
        <div className="home-pg-discovery__search">
          {/* ✅ Banner — all props wired to shared state */}
          <PGMateBanner
            searchText={searchText}
            onSearchChange={setSearchText}
            onSearch={() => {}}
            onExactCitySelect={setIsExactCity}
            gender={filters.gender}
            onGenderChange={(val) =>
              setFilters((prev) => ({
                ...prev,
                gender: val,
              }))
            }
            maxPrice={filters.maxPrice}
            onMaxPriceChange={(val) =>
              setFilters((prev) => ({
                ...prev,
                maxPrice: val,
              }))
            }
          />

          <LookingForSection />

          <div className="home-pg-search-panel" style={{display: "none"}}>
            <div className="home-pg-search-panel__row home-pg-search-panel__row--primary">
              <CustomSelect
                id="city-filter"
                className="home-pg-search-control home-pg-search-control--city"
                options={citySelectList}
                value={filters.city}
                onChange={(nextCity) =>
                  setFilters((prev) => ({
                    ...prev,
                    city: nextCity,
                    locality: "",
                  }))
                }
                isOpen={openDropdown === "city-filter"}
                onToggle={() => toggleDropdown("city-filter")}
                onClose={() => setOpenDropdown(null)}
                placeholder="All Cities"
              />

              <div ref={searchWrapRef} className="home-pg-search-input-wrap">
                <input
                  type="text"
                  className="home-pg-search-input"
                  placeholder="Search PGs, city or locality"
                  value={searchText}
                  onChange={(event) => {
                    setSearchText(event.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      setShowSuggestions(false);
                      loadPGs(0, false);
                    }
                    if (event.key === "Escape") setShowSuggestions(false);
                  }}
                />

                {showSuggestions && suggestions.length > 0 && (
                  <div className="home-pg-autocomplete">
                    {suggestions.map((item, index) => (
                      <button
                        type="button"
                        key={`${item.type}-${item.label}-${index}`}
                        className="home-pg-autocomplete__item"
                        onClick={() => {
                          setShowSuggestions(false);
                          if (item.type === "city") {
                            setSearchText("");
                            setFilters((prev) => ({
                              ...prev,
                              city: item.label,
                              locality: "",
                            }));
                          }
                          if (item.type === "locality") {
                            setSearchText("");
                            setFilters((prev) => ({
                              ...prev,
                              city: item.city,
                              locality: item.locality,
                            }));
                          }
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="home-pg-search-button"
                onClick={() => loadPGs(0, false)}
              >
                <i className="bi bi-search" /> <span>Search</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── MOBILE FILTER BOTTOM SHEET ── */}
        <div className={`filter-bottom-sheet ${isFilterOpen ? "open" : ""}`}>
          <div
            className="filter-sheet-overlay"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="filter-sheet-content">
            <div className="filter-sheet-header">
              <h3>Filters</h3>
              <button
                className="close-sheet"
                onClick={() => setIsFilterOpen(false)}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="filter-sheet-body">
              <div className="filter-group">
                <label>
                  <i className="bi bi-geo-alt" /> Location
                </label>
                <CustomSelect
                  id="locality-filter-mobile"
                  className="home-pg-search-control"
                  options={localitySelectList}
                  value={filters.locality}
                  onChange={(nextLocality) =>
                    setFilters((prev) => ({...prev, locality: nextLocality}))
                  }
                  isOpen={openDropdown === "locality-filter-mobile"}
                  onToggle={() => toggleDropdown("locality-filter-mobile")}
                  onClose={() => setOpenDropdown(null)}
                  placeholder="All Localities"
                />
              </div>
              <div className="filter-group">
                <label>
                  <i className="bi bi-house-heart" /> Stay Preferences
                </label>
                <div className="filter-grid-2">
                  <CustomSelect
                    id="gender-filter-mobile"
                    className="home-pg-search-control"
                    options={genderOptions}
                    value={filters.gender}
                    onChange={(nextGender) =>
                      setFilters((prev) => ({...prev, gender: nextGender}))
                    }
                    isOpen={openDropdown === "gender-filter-mobile"}
                    onToggle={() => toggleDropdown("gender-filter-mobile")}
                    onClose={() => setOpenDropdown(null)}
                    placeholder="Gender"
                  />
                  <CustomSelect
                    id="stay-filter-mobile"
                    className="home-pg-search-control"
                    options={stayTypeOptions}
                    value={filters.stayType}
                    onChange={(nextStayType) =>
                      setFilters((prev) => ({...prev, stayType: nextStayType}))
                    }
                    isOpen={openDropdown === "stay-filter-mobile"}
                    onToggle={() => toggleDropdown("stay-filter-mobile")}
                    onClose={() => setOpenDropdown(null)}
                    placeholder="Stay Type"
                  />
                </div>
              </div>
              <div className="filter-group">
                <label>
                  <i className="bi bi-people" /> Sharing & Room
                </label>
                <div className="filter-grid-2">
                  <CustomSelect
                    id="sharing-filter-mobile"
                    className="home-pg-search-control"
                    options={sharingTypeOptions}
                    value={filters.sharingType}
                    onChange={(nextSharingType) =>
                      setFilters((prev) => ({
                        ...prev,
                        sharingType: nextSharingType,
                      }))
                    }
                    isOpen={openDropdown === "sharing-filter-mobile"}
                    onToggle={() => toggleDropdown("sharing-filter-mobile")}
                    onClose={() => setOpenDropdown(null)}
                    placeholder="Sharing"
                  />
                  <CustomSelect
                    id="room-filter-mobile"
                    className="home-pg-search-control"
                    options={roomTypeOptions}
                    value={filters.roomType}
                    onChange={(nextRoomType) =>
                      setFilters((prev) => ({...prev, roomType: nextRoomType}))
                    }
                    isOpen={openDropdown === "room-filter-mobile"}
                    onToggle={() => toggleDropdown("room-filter-mobile")}
                    onClose={() => setOpenDropdown(null)}
                    placeholder="Room Type"
                  />
                </div>
              </div>
              <div className="filter-group">
                <label>
                  <i className="bi bi-currency-rupee" /> Max Budget: Rs{" "}
                  {filters.maxPrice}
                </label>
                <input
                  type="range"
                  min="5000"
                  max="30000"
                  step="1000"
                  value={filters.maxPrice}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      maxPrice: Number(event.target.value),
                    }))
                  }
                  className="price-slider"
                />
              </div>
              <div className="filter-group">
                <label>
                  <i className="bi bi-sort-down" /> Sort By
                </label>
                <CustomSelect
                  id="sort-filter-mobile"
                  className="home-pg-search-control"
                  options={[
                    {value: "", label: "Default"},
                    {value: "LOW_HIGH", label: "Price Low to High"},
                    {value: "HIGH_LOW", label: "Price High to Low"},
                  ]}
                  value={filters.sort}
                  onChange={(nextSort) =>
                    setFilters((prev) => ({...prev, sort: nextSort}))
                  }
                  isOpen={openDropdown === "sort-filter-mobile"}
                  onToggle={() => toggleDropdown("sort-filter-mobile")}
                  onClose={() => setOpenDropdown(null)}
                  placeholder="Default"
                />
              </div>
            </div>
            <div className="filter-sheet-footer">
              <button className="btn-reset" onClick={resetFilters}>
                Reset
              </button>
              <button
                className="btn-apply"
                onClick={() => {
                  loadPGs(0, false);
                  setOpenDropdown(null);
                  setIsFilterOpen(false);
                }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* ── RESULTS ── */}
        <div id="home-pg-results" className="home-pg-discovery__content">
          <h2 className="home-pg-discovery__title">
            {searchText
              ? `Search results for "${searchText}"`
              : `Available PGs in ${filters.city}`}
          </h2>

          {loading ? (
            <PGListingSkeleton count={15} />
          ) : (
            <>
              {/* <p className="home-pg-discovery__meta">
                Showing <strong>{pgs.length}</strong> of {totalElements} PGs
              </p> */}
              <p className="home-pg-discovery__meta">
                <strong>{pgs.length}</strong> verified PGs near you
              </p>

              <div className="pg-results-grid home-pg-results-grid">
                {pgs.filter(Boolean).map((pg) => (
                  <PGListingCard
                    key={pg.id}
                    pg={pg}
                    imageIndex={imgIndex[pg.id] || 0}
                    onPrevImage={(item) => prevImg(item.id)}
                    onNextImage={(item) =>
                      nextImg(item.id, item.imageUrls?.length)
                    }
                    onNavigate={(item) => navigate(`/pg/${item.id}`)}
                    onOpenReviews={openReviews}
                  />
                ))}
              </div>

              {pgs.length === 0 && (
                <p className="home-pg-discovery__empty">
                  No PGs found in {localStorage.getItem("userCity")}
                </p>
              )}

              {/* {hasMore && pgs.length > 0 && (
                <div className="home-pg-discovery__load-more-wrap">
                  <button
                    className="home-pg-discovery__load-more"
                    onClick={() => loadPGs(page + 1, true)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Loading..." : "Load More"}
                  </button>
                </div>
              )} */}
            </>
          )}
        </div>

        {selectedPG && (
          <div
            className="review-modal-overlay"
            onClick={() => setSelectedPG(null)}
          >
            <div
              className="review-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <h3>Reviews for {selectedPG.name}</h3>
              {pgReviews.length === 0 && (
                <p style={{color: "#94A3B8", margin: 0}}>No reviews yet.</p>
              )}
              {pgReviews.map((review, index) => (
                <div key={index} className="review-card">
                  <strong>{review.userName}</strong>
                  <p>{review.comment}</p>
                </div>
              ))}
              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setSelectedPG(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <TenantOwnerSplit />
        <WhyChoosePGMateRow />
        {/* <FeaturedPGs /> */}
        <PopularCities />
        <AppDownloadStrip />
        <Testimonials />
        <StatsStrip />
      </section>
    </>
  );
};

export default HomePGSection;
