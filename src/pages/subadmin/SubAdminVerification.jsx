import AdminVerification from "../admin/AdminVerification";

const SubAdminVerification = () => {
  return <AdminVerification basePath="/subadmin/verifications" showAmountControl={false} />;
};

export default SubAdminVerification;