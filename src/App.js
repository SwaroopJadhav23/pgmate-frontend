import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./auth/Login";
import ProtectedRoute from "./routes/ProtectedRoute";
import Home from "./pages/public/Home/Home";
import PGDetail from "./pages/public/PGDetail";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOwners from "./pages/admin/AdminOwners";
import AdminAddOwner from "./pages/admin/AdminAddOwner";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import CreatePG from "./pages/owner/CreatePG";
import PGList from "./pages/owner/PGList";
import RoomManager from "./pages/owner/RoomManager";
import FAQ from "./pages/public/Footer/FAQ/FAQ";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";
import "./styles/CommonTools.css";
import OwnerAvailableBeds from "./pages/owner/OwnerAvailableBeds";
import OwnerHelpSection from "./pages/owner/OwnerHelpSection";

import ListYourProperty from "./pages/public/Home/ListYourProperty";
import AdminEnquiries from "./pages/admin/AdminEnquiries";
import ManageUI from "./pages/admin/ManageUI/ManageUI";
import AboutUs from "./pages/public/Footer/AboutUs";
import ContactUs from "./pages/public/Footer/ContactUs";
import HowItWorks from "./pages/public/Footer/HowItWorks";
import PrivacyPolicy from "./pages/public/Footer/PrivacyPolicy";
import TermsAndConditions from "./pages/public/Footer/Terms&Conditions";
import Disclaimers from "./pages/public/Footer/Disclaimers";
import PublicPGList from "./pages/public/PublicPGList";
import OwnerEnquiries from "./pages/owner/OwnerEnquiries";
import PublicLayout from "./layouts/PublicLayout";
import OwnerLayout from "./layouts/Ownerlayout";

import ScrollToTop from "./ScroolToTop";
import AllPGs from "./pages/admin/AdminPGContol/AllPGs";
import AdminLocalityManager from "./pages/admin/AdminPGContol/AdminLocalityManager";
import OwnerVerification from "./pages/owner/OwnerVerification";
import PublicSignup from "./auth/PublicSignup";
import ForgotPassword from "./auth/ForgotPassword";
import AdminUsers from "./pages/admin/AdminUsers";
import { AuthProvider } from "./context/AuthContext";
import Profile from "./auth/Profile";
import OwnerProfile from "./auth/OwnerProfile";
import MyPg from "./pages/Users/MyPg";
import OwnerDashboardProfile from "./pages/owner/OwnerDashboardProfile";
import OwnerReferralPage from "./pages/owner/OwnerReferralPage";
import UserReferralPage from "./pages/Users/UserReferralPage";
import ResidentsOverview from "./pages/owner/Resident/ResidentsOverview";
import TenantsBookingPage from "./pages/owner/Resident/TenantsBookingPage";
import RefundPolicy from "./pages/public/Footer/RefundPolicy";
import OfferManager from "./pages/owner/OfferManager";
import AdminReservations from "./pages/admin/AdminReservations";
import AdminVerification from "./pages/admin/AdminVerification";
import AdminOffers from "./pages/admin/AdminOffers";
import AdminVerificationPayments from "./pages/admin/AdminVerificationPayments";
import OwnerSponsorship from "./pages/owner/OwnerSponsorshipPage";
import OwnerRevenue from "./pages/owner/OwnerRevenue";
import AdminPlanDashboard from "./pages/admin/AdminPlanDashboard";
import AdminRevenue from "./pages/admin/AdminRevenue";

import AdminReferralDashboard from "./pages/admin/AdminReferralDashboard";
import AdminPriorityControl from "./pages/admin/AdminPriorityControl/AdminPriorityControl";

import OwnerPricingPage from "./pages/owner/OwnerPricingPage";
import OwnerPaymentStatus from "./pages/owner/OwnerPaymentStatus";
import ReservationPaymentStatus from "./pages/public/ReservationPaymentStatus";
import OwnerFeatureUnlockPaymentStatus from "./pages/owner/OwnerFeatureUnlockPaymentStatus";
import AdminPGControl from "./pages/admin/AdminPGContol/AdminPGControl";
import SubAdminManagement from "./pages/admin/SubAdmin/SubAdminManagement";
import SubAdminDashboard from "./pages/subadmin/SubAdminDashboard";
import SubAdminAddOwner from "./pages/subadmin/SubAdminAddOwner";
import SubAdminOwnerEnquiries from "./pages/subadmin/SubAdminOwnerEnquiries";
import SubAdminVerification from "./pages/subadmin/SubAdminVerification";
import OwnerManagers from "./pages/owner/manager/OwnerManagers";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerEnquiries from "./pages/manager/ManagerEnquiries";
import ManagerHelpSection from "./pages/manager/ManagerHelpSection";
import ManagerPGList from "./pages/manager/ManagerPGList";
import FloorManagerPage from "./pages/manager/FloorManagerPage";
import ManagerRoomPage from "./pages/manager/ManagerRoomPage";
import ManagerAvailableBeds from "./pages/manager/ManagerAvailableBeds";
import ManagerResidentsOverview from "./pages/manager/residents/ManagerResidentsOverview";
import ManagerResidentRecords from "./pages/manager/residents/ManagerResidentRecords";
import OwnerResidentRecords from "./pages/owner/OwnerResidentRecords";
import SubAdminPGControl from "./pages/subadmin/SubAdminPGControl";
import AdminOwnerPasswordReset from "./pages/admin/AdminOwnerPasswordReset";
import AdminEnquiriesPage from "./pages/admin/AdminEnquiriesPage";
import AdminContactMessages from "./pages/admin/AdminContactMessages";
import SubAdminEnquiriesPage from "./pages/subadmin/SubAdminEnquiriesPage";
import AdminWithdrawalDashboard from "./pages/admin/AdminWithdrawalDashboard";
import OwnerPurchaseHistory from "./pages/owner/OwnerPurchaseHistory";
import AdminPurchaseHistory from "./pages/admin/AdminPurchaseHistory";
import MonthlyRentOverview from "./pages/owner/MonthlyRentRecord/MonthlyRentOverview";
import AdminProfile from "./pages/admin/AdminProfile";
import SubAdminAllPGs from "./pages/subadmin/SubAdminAllPGs";
import MyComplaints from "./pages/Users/MyComplaints";
import OwnerComplaints from "./pages/owner/OwnerComplaints";
import AdminComplaints from "./pages/admin/AdminComplaints";
import WhatsAppReminders from "./pages/owner/WhatsAppReminders";
import AddResidentModal from "./pages/owner/Resident/AddResidentModal";
import ForOwnersPage from "./pages/public/Home/ForOwnersPage";
import Cities from "./pages/public/Home/Cities";
import Tools from "./pages/Tools/Tools";
import MenuGenerator from "./pages/MenuGenerator/MenuGenerator";
import FoodMenuGenerator from "./pages/FoodMenuGenerator/FoodMenuGenerator";
import RentReceiptGenerator from "./pages/RentReceiptGenerator/RentReceiptGenerator";
import LeaseAgreementGenerator from "./pages/LeaseAgreementGenerator/LeaseAgreementGenerator";
import ExpenseCalculator from "./pages/ExpenseCalculator/ExpenseCalculator";
import NotFound from "./pages/NotFound/NotFound";
import AdminDeletionRequests from "./pages/admin/AdminDeletionRequests";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: "global-toast",
          }}
        />
        <ScrollToTop />
        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<Home />} />
          <Route path="/tools" element={<PublicLayout><Tools /></PublicLayout>} />
          <Route path="/tools/menu-generator" element={<PublicLayout><MenuGenerator /></PublicLayout>} />
          <Route path="/tools/food-menu-generator" element={<PublicLayout><FoodMenuGenerator /></PublicLayout>} />
          <Route path="/tools/rent-receipt-generator" element={<PublicLayout><RentReceiptGenerator /></PublicLayout>} />
          <Route path="/tools/lease-agreement-generator" element={<PublicLayout><LeaseAgreementGenerator /></PublicLayout>} />
          <Route path="/tools/expense-calculator" element={<PublicLayout><ExpenseCalculator /></PublicLayout>} />
          <Route path="*" element={<NotFound />} />
          <Route
            path="/pg/:id"
            element={
              <PublicLayout>
                <PGDetail />
              </PublicLayout>
            }
          />
          <Route
            path="/my-complaints"
            element={
              <ProtectedRoute role="USER">
                <MyComplaints />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-complaints/new"
            element={
              <ProtectedRoute role="USER">
                <MyComplaints />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-pg"
            element={
              <ProtectedRoute role="USER">
                <MyPg />
              </ProtectedRoute>
            }
          />
          <Route element={<ProtectedRoute role="OWNER"><OwnerLayout /></ProtectedRoute>}>
            <Route path="/owner/complaints" element={<OwnerComplaints />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/list-your-property" element={<ListYourProperty />} />
          <Route
            path="/for-owners"
            element={
              <PublicLayout>
                <ForOwnersPage />
              </PublicLayout>
            }
          />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route
            path="/terms-and-conditions"
            element={<TermsAndConditions />}
          />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/disclaimers" element={<Disclaimers />} />
          <Route
            path="/pgs"
            element={
              <PublicLayout>
                <PublicPGList />
              </PublicLayout>
            }
          />

          <Route path="/cities" element={<Cities />} />

          <Route path="/signup" element={<PublicSignup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute role="USER">
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/referrals"
            element={
              <ProtectedRoute role="USER">
                <UserReferralPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/profile"
            element={
              <ProtectedRoute role="OWNER">
                <OwnerProfile />
              </ProtectedRoute>
            }
          />
          {/* OWNERks */}
          <Route
            path="/owner/dashboard"
            element={
              <ProtectedRoute role="OWNER">
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/ownerRevenue"
            element={
              <ProtectedRoute role="OWNER">
                <OwnerRevenue />
              </ProtectedRoute>
            }
          />{" "}
          <Route
            path="/owner/dashboard/profile"
            element={
              <ProtectedRoute role="OWNER">
                <OwnerDashboardProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/verification"
            element={
              <ProtectedRoute role="OWNER">
                <OwnerVerification />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/sponsorship"
            element={
              <ProtectedRoute role="OWNER">
                <OwnerSponsorship />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/pg/create"
            element={
              <ProtectedRoute role="OWNER">
                <CreatePG />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/pricing"
            element={
              <ProtectedRoute role="OWNER">
                <OwnerPricingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/payment-status"
            element={<OwnerPaymentStatus />}
          />
          <Route
            path="/reservation/payment-status"
            element={<ReservationPaymentStatus />}
          />
          <Route
            path="/owner/feature-payment-status"
            element={<OwnerFeatureUnlockPaymentStatus />}
          />
          <Route
            path="/owner/pgs"
            element={
              <ProtectedRoute role="OWNER">
                <PGList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/offers"
            element={
              <ProtectedRoute role="OWNER">
                <OfferManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/rooms"
            element={
              <ProtectedRoute role="OWNER">
                <RoomManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/residents"
            element={
              <ProtectedRoute role="OWNER">
                <ResidentsOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/residents/add"
            element={
              <ProtectedRoute role="OWNER">
                <AddResidentModal apiPrefix="/owner/residents" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/bookings"
            element={
              <ProtectedRoute role="OWNER">
                <TenantsBookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/rent"
            element={
              <ProtectedRoute role="OWNER">
                <MonthlyRentOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/available-beds"
            element={
              <ProtectedRoute role="OWNER">
                <OwnerAvailableBeds />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/referrals"
            element={
              <ProtectedRoute role="OWNER">
                <OwnerReferralPage />
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="/owner/rent-reminders"
            element={
              <ProtectedRoute role="OWNER">
                <RentReminderSettings />
              </ProtectedRoute>
            }
          /> */}
          <Route
            path="/owner/whatsapp-reminders"
            element={
              <ProtectedRoute role="OWNER">
                <WhatsAppReminders />
              </ProtectedRoute>
            }
          />
          {/* ADMIN */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/owners"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminOwners />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminComplaints />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pg-control"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminPGControl />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/all-pgs"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AllPGs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/locality-manager"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminLocalityManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/priority-control"
            element={<AdminPriorityControl />}
          />
          <Route
            path="/admin/verifications"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminVerification />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/offers"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminOffers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/feature-transactions"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminVerificationPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/verification-payments"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminVerificationPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/admin-enquiries"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminEnquiriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/contact-messages"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminContactMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/deletion-requests"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminDeletionRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/checkout-records"
            element={
              <ProtectedRoute role="OWNER">
                <OwnerResidentRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/floors"
            element={
              <ProtectedRoute role="OWNER">
                <FloorManagerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/enquiries"
            element={
              <ProtectedRoute role="OWNER">
                <OwnerEnquiries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/help"
            element={
              <ProtectedRoute role="OWNER">
                <OwnerHelpSection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/purchase-history"
            element={
              <ProtectedRoute role="OWNER">
                <OwnerPurchaseHistory />
              </ProtectedRoute>
            }
          />
          {/* ADMIN */}
          <Route
            path="/admin/add"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminAddOwner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/owner-enquiries"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminEnquiries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sub-admins"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <SubAdminManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/referrals"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminReferralDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/owner-password-reset"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminOwnerPasswordReset />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/plans"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminPlanDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/adminRevenue" element={<AdminRevenue />} />
          <Route
            path="/admin/reservations"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminReservations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/withdrawals"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminWithdrawalDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-ui"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <ManageUI />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/purchase-history"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <AdminPurchaseHistory />
              </ProtectedRoute>
            }
          />
          {/* Sub Admin Routes */}
          <Route
            path="/subadmin/dashboard"
            element={
              <ProtectedRoute role="SUB_ADMIN">
                <SubAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subadmin/add-owner"
            element={
              <ProtectedRoute role="SUB_ADMIN">
                <SubAdminAddOwner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subadmin/owner-enquiries"
            element={
              <ProtectedRoute role="SUB_ADMIN">
                <SubAdminOwnerEnquiries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subadmin/verifications"
            element={
              <ProtectedRoute role="SUB_ADMIN">
                <SubAdminVerification />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subadmin/pg-control"
            element={
              <ProtectedRoute role="SUB_ADMIN">
                <SubAdminPGControl />
              </ProtectedRoute>
            }
          />
          <Route path="/subadmin/all-pgs" element={<SubAdminAllPGs />} />
          <Route
            path="/subadmin/contact-messages"
            element={
              <ProtectedRoute role="SUB_ADMIN">
                <AdminContactMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subadmin/admin-enquiries"
            element={
              <ProtectedRoute role="SUB_ADMIN">
                <SubAdminEnquiriesPage />
              </ProtectedRoute>
            }
          />
          {/* Manager/Caretaker Routes */}
          <Route
            path="/owner/managers"
            element={
              <ProtectedRoute role="OWNER">
                <OwnerManagers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute role="PG_MANAGER">
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/enquiries"
            element={
              <ProtectedRoute role="PG_MANAGER">
                <ManagerEnquiries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/help"
            element={
              <ProtectedRoute role="PG_MANAGER">
                <ManagerHelpSection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/pgs"
            element={
              <ProtectedRoute role="PG_MANAGER">
                <ManagerPGList />
              </ProtectedRoute>
            }
          />
          {/* <Route
  path="/manager/floors"
  element={
    <ProtectedRoute role="PG_MANAGER">
      <FloorManagerPage />
    </ProtectedRoute>
  }
/> */}
          <Route
            path="/manager/rooms"
            element={
              <ProtectedRoute role="PG_MANAGER">
                <ManagerRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="manager/beds"
            element={
              <ProtectedRoute role="PG_MANAGER">
                <ManagerAvailableBeds />
              </ProtectedRoute>
            }
          />
          <Route
            path="manager/residents"
            element={
              <ProtectedRoute role="PG_MANAGER">
                <ManagerResidentsOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="manager/residents/records"
            element={
              <ProtectedRoute role="PG_MANAGER">
                <ManagerResidentRecords />
              </ProtectedRoute>
            }
          />

          <Route
            path="manager/residents/add"
            element={
              <ProtectedRoute role="PG_MANAGER">
                <AddResidentModal apiPrefix="/manager/residents" />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;