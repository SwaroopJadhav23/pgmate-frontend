import DashboardLayout from "../../layouts/DashboardLayout";
import PricingPlans from "../../components/PricingPlans";

const OwnerPricingPage = () => {
  return (
    <DashboardLayout
      title="Subscription Plans"
      subtitle="Manage your current plan and upgrade anytime"
    >
      <PricingPlans />
    </DashboardLayout>
  );
};

export default OwnerPricingPage;