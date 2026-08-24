import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/axios";
import TenantOnboardingForm from "./TenantOnboardingForm";

const GlobalTenantOnboarding = () => {
  const { token, role } = useContext(AuthContext);
  const [pendingOnboardingData, setPendingOnboardingData] = useState(null);

  useEffect(() => {
    // Only fetch if a normal USER is logged in
    if (!token || role !== "USER") {
      setPendingOnboardingData(null);
      return;
    }

    const fetchBookingsForOnboarding = () => {
      api.get("/residents/my-pgs")
        .then((res) => {
          const pgs = res.data || [];
          const pendingOnboarding = pgs.find(p => p.status === "PENDING_TENANT_DETAILS");
          if (pendingOnboarding) {
            setPendingOnboardingData(pendingOnboarding);
          } else {
            setPendingOnboardingData(null);
          }
        })
        .catch(() => {});
    };

    fetchBookingsForOnboarding();

    // Listen to bookingsUpdated event to re-check
    window.addEventListener("bookingsUpdated", fetchBookingsForOnboarding);
    return () => window.removeEventListener("bookingsUpdated", fetchBookingsForOnboarding);
  }, [token, role]);

  if (!pendingOnboardingData) return null;

  return (
    <TenantOnboardingForm
      show={true}
      residentId={pendingOnboardingData.residentId || pendingOnboardingData.id}
      prefill={pendingOnboardingData}
      onClose={() => setPendingOnboardingData(null)}
      onSuccess={() => {
        setPendingOnboardingData(null);
        window.dispatchEvent(new Event("bookingsUpdated"));
        // Optionally refresh the page if they were on a booking-related tab
        if (window.location.pathname.includes('/my-pg')) {
          window.location.reload();
        }
      }}
    />
  );
};

export default GlobalTenantOnboarding;
