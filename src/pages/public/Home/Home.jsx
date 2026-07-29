import HomeLayout from "../../../layouts/HomeLayouts";
import { useEffect, useState } from "react";
import HomePGSection from "./HomePGSection";
import ApkDownloadModal from "../../../components/ApkModal";
import ListPropertyModal from "./ListPropertyModal";
import DemoVideoModal from "../../../components/DemoVideoModal";

const Home = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  // Show demo video on first login for USER
  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem("justLoggedIn");
    const alreadySeen = localStorage.getItem("demoVideoShown");

    if (justLoggedIn && !alreadySeen) {
      sessionStorage.removeItem("justLoggedIn");
      setShowDemo(true);
    }
  }, []);

  const handleDemoClose = () => {
    setShowDemo(false);
    localStorage.setItem("demoVideoShown", "true");
  };

  // Step 1: APK modal immediately
  useEffect(() => {
    setShowApkModal(true);
  }, []);

  // Step 2: Location modal after 5s — ONLY if not already handled
  useEffect(() => {
    const alreadyHandled = localStorage.getItem("locationPermission");

    if (alreadyHandled) {
      //  Location already handled before — skip location modal
      // but still show list modal if not shown before
      if (!localStorage.getItem("listModalShown")) {
        const t = setTimeout(() => setShowListModal(true), 5000);
        return () => clearTimeout(t);
      }
      return;
    }

    // First time — show location modal after 5s
    // 🔒 LOCATION POPUP DISABLED — uncomment below 2 lines to re-enable
    // const t1 = setTimeout(() => setShowLocationModal(true), 5000);
    // return () => clearTimeout(t1);

    // While location popup disabled, show list modal instead after 5s
    if (!localStorage.getItem("listModalShown")) {
      const t = setTimeout(() => setShowListModal(true), 5000);
      return () => clearTimeout(t);
    }
  }, []);

  const handleLocationClose = (val) => {
    setShowLocationModal(val);

    if (val === false) {
      //  Save location permission if not already saved
      if (!localStorage.getItem("locationPermission")) {
        localStorage.setItem("locationPermission", "dismissed");
      }

      //  Show list modal after 5s if not shown before
      if (!localStorage.getItem("listModalShown")) {
        setTimeout(() => setShowListModal(true), 5000);
      }
    }
  };

  const handleListModalClose = () => {
    setShowListModal(false);
    // ✅ Mark list modal as shown so it never appears again
    localStorage.setItem("listModalShown", "true");
  };

  return (
    <HomeLayout>
      <div className="home-page loaded">
        <DemoVideoModal show={showDemo} onClose={handleDemoClose} />
        <ApkDownloadModal show={showApkModal} setShow={setShowApkModal} />

        {/*  Pass handleListModalClose so we know when it's closed */}
        <ListPropertyModal
          show={showListModal}
          setShow={handleListModalClose}
        />

        <HomePGSection
          setShowLocationModal={handleLocationClose}
          showLocationModal={showLocationModal}
        />
      </div>
    </HomeLayout>
  );
};

export default Home;