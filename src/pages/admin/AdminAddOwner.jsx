import DashboardLayout from "../../layouts/DashboardLayout";
import AdminOwnerCreate from "./AdminOwnerCreate";


const AdminAddOwner = () => {
  return (
    <DashboardLayout
      title="Add Owner"
      subtitle="Create a new PG owner"
    >
      <div className="d-flex justify-content-center mt-4">
        <AdminOwnerCreate />
      </div>
    </DashboardLayout>
  );
};

export default AdminAddOwner;
