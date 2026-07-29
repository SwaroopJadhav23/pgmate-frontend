import AdminPGVerification from "../admin/AdminPGContol/AdminPGVerification";
import DashboardLayout from "../../layouts/DashboardLayout";
const SubAdminPGControl = () => {
  return (
    <DashboardLayout
      title="PG Management"
      subtitle="Manage PG approval & rejection"
    >
      <AdminPGVerification basePath="/subadmin" />
    </DashboardLayout>
  );
};

export default SubAdminPGControl;