import {useEffect, useState, useCallback, useRef} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {FiFilter} from "react-icons/fi";
import api from "../../api/axios";
import FilterSidebar from "./FilterSidebar";
import PGListingCard from "./PGListingCard";
import "../../CSS/publicPG.css";
import {PGListingSkeleton} from "./Skeleton";
import ApkDownloadModal from "../../components/ApkModal";
import {useCityFilter} from "../../context/CityFilterContext";

const PUBLIC_PAGE_SIZE = 15;

const PublicPGList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [pgs, setPgs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [cityOptions, setCityOptions] = useState([]);
  const [localityOptions, setLocalityOptions] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  // const [cityLocked, setCityLocked] = useState(false);
  const cityLocked = false;
  const [selectedPG, setSelectedPG] = useState(null);
  const [pgReviews, setPgReviews] = useState([]);
  const [imgIndex, setImgIndex] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);
  const {setSelectedCity} = useCityFilter();

  const [filters, setFilters] = useState({
    city: "Pune",
    locality: "",
    gender: "",
    stayType: "",
    sharingType: "",
    roomType: "",
    sort: "",
    maxPrice: 30000,
  });

  const searchDebounceRef = useRef(null);
  const lastFetchKey = useRef(null);

  useEffect(() => {
    setShowApkModal(true);
  }, []);

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

  // useEffect(() => {
  //   const city = searchParams.get("city");
  //   const locality = searchParams.get("locality");
  //   if (city) {
  //     setFilters((prev) => ({...prev, city, locality: locality || ""}));
  //     setCityLocked(true);
  //   }
  // }, [searchParams]);

  // useEffect(() => {
  //   const city = searchParams.get("city");
  //   const locality = searchParams.get("locality");
  //   const gender = searchParams.get("gender");
  //   const maxPrice = searchParams.get("maxPrice");
  //   setFilters((prev) => ({
  //     ...prev,
  //     city: city || prev.city,
  //     locality: locality || "",
  //     gender: gender || "",
  //     maxPrice: maxPrice ? Number(maxPrice) : prev.maxPrice,
  //   }));
  //   if (city) {
  //     setCityLocked(true);
  //   }
  // }, [searchParams]);

  // AFTER
  // useEffect(() => {
  //   const city = searchParams.get("city");
  //   const locality = searchParams.get("locality");
  //   const gender = searchParams.get("gender");
  //   const maxPrice = searchParams.get("maxPrice");
  //   const search = searchParams.get("search");

  //   setFilters((prev) => ({
  //     ...prev,
  //     city: city || prev.city,
  //     locality: locality || "",
  //     gender: gender || "",
  //     maxPrice: maxPrice ? Number(maxPrice) : prev.maxPrice,
  //   }));

  //   if (search) {
  //     setSearchQuery(search);
  //   }
  //   // City stays editable on this page even when arriving with ?city= —
  //   // intentionally not locking it anymore.
  // }, [searchParams]);

  useEffect(() => {
    const city = searchParams.get("city");
    const locality = searchParams.get("locality");
    const gender = searchParams.get("gender");
    const maxPrice = searchParams.get("maxPrice");
    const search = searchParams.get("search");

    setFilters((prev) => ({
      ...prev,
      city: city || prev.city,
      locality: locality || "",
      gender: gender || "",
      maxPrice: maxPrice ? Number(maxPrice) : prev.maxPrice,
    }));

    if (city) {
      setSelectedCity(city);
      localStorage.setItem("userCity", city);
    }

    if (search) {
      setSearchQuery(search);
    }

    setIsInitialized(true);
  }, [searchParams, setSelectedCity]);

  useEffect(() => {
    api
      .get("/public/cities")
      .then((res) => setCityOptions(res.data || []))
      .catch(() => {});
  }, []);

  // useEffect(() => {
  //   api
  //     .get("/public/localities", {
  //       params: {city: filters.city || undefined},
  //     })
  //     .then((res) => setLocalityOptions(res.data || []))
  //     .catch(() => {});
  // }, [filters.city]);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/public/localities", {
        params: {city: filters.city || undefined},
      })
      .then((res) => {
        if (!cancelled) setLocalityOptions(res.data || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [filters.city]);

  const fetchPGs = useCallback(
    async (currentFilters, currentSearch, nextPage = 0, append = false) => {
      const fetchKey = JSON.stringify({
        ...currentFilters,
        q: currentSearch,
        page: nextPage,
        append,
      });

      if (fetchKey === lastFetchKey.current) return;
      lastFetchKey.current = fetchKey;

      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setIsLoading(true);
        }

        const params = {
          page: nextPage,
          size: PUBLIC_PAGE_SIZE,
        };

        if (currentFilters.city) params.city = currentFilters.city;
        if (currentFilters.locality) params.locality = currentFilters.locality;
        if (currentFilters.gender) params.gender = currentFilters.gender;
        if (currentFilters.stayType) params.stayType = currentFilters.stayType;
        if (currentFilters.sharingType)
          params.sharingType = currentFilters.sharingType;
        if (currentFilters.roomType) params.roomType = currentFilters.roomType;
        if (currentFilters.sort) params.sort = currentFilters.sort;
        if (currentFilters.maxPrice) params.maxPrice = currentFilters.maxPrice;
        if (currentSearch?.trim()) params.search = currentSearch.trim();

        const res = await api.get("/public/pgs/paged", {params});
        const content = res.data?.content || [];
        const totalPages = res.data?.totalPages || 0;

        setPgs((prev) => (append ? [...prev, ...content] : content));
        setPage(nextPage);
        setHasMore(nextPage + 1 < totalPages);
        setTotalCount(res.data?.totalElements || 0);
      } catch {
        if (!append) {
          setPgs([]);
          setTotalCount(0);
        }
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isInitialized) return;
    lastFetchKey.current = null;
    fetchPGs(filters, searchQuery, 0, false);
  }, [filters, searchQuery, isInitialized, fetchPGs]);

  useEffect(() => {
    if (!isInitialized) return;
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      lastFetchKey.current = null;
      fetchPGs(filters, searchQuery, 0, false);
    }, 350);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchQuery, filters, isInitialized, fetchPGs]);

  const openReviews = (pg) => {
    api.get(`/public/pgs/${pg.id}/reviews`).then((res) => {
      setPgReviews(res.data || []);
      setSelectedPG(pg);
    });
  };

  // useEffect(() => {
  //   const savedCity = localStorage.getItem("userCity");
  //   const savedLocality = localStorage.getItem("userLocality");
  //   if (savedCity) {
  //     setFilters((prev) => ({
  //       ...prev,
  //       city: savedCity,
  //       locality: savedLocality || "",
  //     }));
  //   }
  //   setIsInitialized(true);
  // }, []);

  // ADD THIS — save city whenever it changes
  // useEffect(() => {
  //   if (filters.city) {
  //     localStorage.setItem("userCity", filters.city);
  //   }
  // }, [filters.city]);

  // ADD THIS — save locality whenever it changes
  // useEffect(() => {
  //   localStorage.setItem("userLocality", filters.locality || "");
  // }, [filters.locality]);

  return (
    <div className="pg-page-layout">
      <ApkDownloadModal show={showApkModal} setShow={setShowApkModal} />

      {showFilter && (
        <button
          className="pg-filter-backdrop"
          onClick={() => setShowFilter(false)}
          aria-label="Close filters"
        />
      )}

      <div className="pg-filter-sidebar-slot">
        <FilterSidebar
          filters={filters}
          onChange={setFilters}
          cityOptions={cityOptions}
          localityOptions={localityOptions}
          cityLocked={cityLocked}
          isMobileOpen={showFilter}
          onClose={() => setShowFilter(false)}
        />
      </div>

      <main className="pg-page-content">
        <div className="pg-mobile-toolbar">
          <button
            className="pg-mobile-filter-btn"
            onClick={() => setShowFilter(true)}
          >
            <FiFilter size={15} /> Filter
          </button>
        </div>

        <div className="pg-page-header">
          <h2>Available PGs{filters.city ? ` in ${filters.city}` : ""}</h2>
          {totalCount > 0 && !isLoading && (
            <p className="pg-results-meta">
              {totalCount} propert{totalCount === 1 ? "y" : "ies"} found
            </p>
          )}
        </div>

        <div className="pg-search-bar">
          <i className="bi bi-search pg-search-icon" />
          <input
            type="text"
            className="pg-search-input"
            placeholder="Search by PG name or locality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="pg-search-clear"
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>

        {isLoading ? (
          <PGListingSkeleton count={9} />
        ) : (
          <div className="pg-results-grid">
            {pgs.filter(Boolean).map((pg) => (
              <PGListingCard
                key={pg.id}
                pg={pg}
                imageIndex={imgIndex[pg.id] || 0}
                onPrevImage={(item) => prevImg(item.id)}
                onNextImage={(item) => nextImg(item.id, item.imageUrls?.length)}
                onNavigate={(item) => navigate(`/pg/${item.id}`)}
                onOpenReviews={openReviews}
              />
            ))}
          </div>
        )}

        {!isLoading && pgs.length === 0 && (
          <div className="pg-empty">No PGs found matching your filters.</div>
        )}

        {!isLoading && hasMore && pgs.length > 0 && (
          <div className="public-load-more-wrap">
            <button
              className="public-load-more-btn"
              onClick={() => fetchPGs(filters, searchQuery, page + 1, true)}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </main>

      {selectedPG && (
        <div
          className="review-modal-overlay"
          onClick={() => setSelectedPG(null)}
        >
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reviews for {selectedPG.name}</h3>
            {pgReviews.length === 0 && (
              <p style={{color: "#94A3B8", fontSize: 13, margin: 0}}>
                No reviews yet.
              </p>
            )}
            {pgReviews.map((r, i) => (
              <div key={i} className="review-card">
                <strong>{r.userName}</strong>
                <div style={{fontSize: 12, margin: "4px 0", color: "#A16207"}}>
                  {"*".repeat(r.rating)}
                </div>
                <p>{r.comment}</p>
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
    </div>
  );
};

export default PublicPGList;
