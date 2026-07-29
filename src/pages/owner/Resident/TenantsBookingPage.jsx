import { useState } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import api from "../../../api/axios";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import ReservedResidents from "./ReservedResidents";
import ConfirmMoveInModal from "./ConfirmMoveInModal";
import "./Resident.css";

const ReservedResidentsPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);

  const reloadList = () => setRefreshKey((prev) => prev + 1);

  return (
    <DashboardLayout
      title="Tenant Bookings"
      subtitle="Manage pending move-ins and reservations"
    >
      <ReservedResidents
        apiPrefix="/owner/residents"
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
            await api.put(`/owner/residents/${id}/deny`);
            toast.success("Reservation Denied.");
            reloadList();
          } catch {
            toast.error("Unable to deny reservation.");
          }
        }}
      />

      <ConfirmMoveInModal
        show={showConfirm}
        resident={selectedResident}
        onClose={() => { setShowConfirm(false); setSelectedResident(null); }}
        onSuccess={() => { setShowConfirm(false); setSelectedResident(null); reloadList(); }}
        apiPrefix="/owner/residents"
      />
    </DashboardLayout>
  );
};

export default ReservedResidentsPage;