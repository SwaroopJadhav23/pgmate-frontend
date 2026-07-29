import { useState } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import api from "../../../api/axios";
import Swal from "sweetalert2";
import ReservedResidents from "../../owner/Resident/ReservedResidents";
import ConfirmMoveInModal from "../../owner/Resident/ConfirmMoveInModal";
import "../../owner/Resident/Resident.css";

const CaretakerTenantsBookingPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);

  const reloadList = () => setRefreshKey((prev) => prev + 1);

  return (
    <DashboardLayout
      title="Tenant Bookings"
      subtitle="Manage 
       and reservations"
    >
      <ReservedResidents
        apiPrefix="/manager/residents"
        refreshKey={refreshKey}
        onConfirm={(resident) => {
          setSelectedResident(resident);
          setShowConfirm(true);
        }}
        onDenied={async (id) => {
          const result = await Swal.fire({
            title: "Deny Reservation?",
            text: "This will cancel the resident reservation.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Deny",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#ef4444",
          });

          if (!result.isConfirmed) return;

          try {
            await api.put(`/manager/residents/${id}/deny`);
            Swal.fire({ icon: "success", title: "Reservation Denied", timer: 1500, showConfirmButton: false });
            reloadList();
          } catch {
            Swal.fire({ icon: "error", title: "Failed", text: "Unable to deny reservation" });
          }
        }}
      />

      <ConfirmMoveInModal
        show={showConfirm}
        resident={selectedResident}
        onClose={() => { setShowConfirm(false); setSelectedResident(null); }}
        onSuccess={() => { setShowConfirm(false); setSelectedResident(null); reloadList(); }}
        apiPrefix="/manager/residents"
      />
    </DashboardLayout>
  );
};

export default CaretakerTenantsBookingPage;