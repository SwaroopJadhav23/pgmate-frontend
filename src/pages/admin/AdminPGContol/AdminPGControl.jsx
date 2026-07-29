import DashboardLayout from "../../../layouts/DashboardLayout";
import AdminPGVerification from "./AdminPGVerification";
import "./AdminPGControl.css";

const AdminPGControl = () => {
  return (
    <DashboardLayout
      title="PG Management"
      subtitle="Manage PG approval & rejection"
    >
      <AdminPGVerification />
    </DashboardLayout>
  );
};

export default AdminPGControl;