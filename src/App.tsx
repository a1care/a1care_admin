import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ModulePlaceholderPage } from "@/pages/ModulePlaceholderPage";
import { AdminManagementPage } from "@/pages/AdminManagementPage";
import { AppManagementPage } from "@/pages/AppManagementPage";
import { SystemSettingsPage } from "@/pages/SystemSettingsPage";
import { ServiceCategoriesPage } from "@/pages/ServiceCategoriesPage";
import { ServiceSubServicesPage } from "@/pages/ServiceSubServicesPage";
import { ServiceChildServicesPage } from "@/pages/ServiceChildServicesPage";
import { UserManagementPage } from "@/pages/UserManagementPage";
import { BookingOperationsPage } from "@/pages/BookingOperationsPage";
import { OPBookingsPage } from "@/pages/OPBookingsPage";
import { DoctorStaffManagementPage } from "@/pages/DoctorStaffManagementPage";
import { TicketsPage } from "@/pages/TicketsPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { SubscriptionManagementPage } from "@/pages/SubscriptionManagementPage";
import { SuperAdminWalletPage } from "@/pages/SuperAdminWalletPage";
import { PayoutsPage } from "@/pages/PayoutsPage";
import { CouponsPage } from "@/pages/CouponsPage";
import { ReferralsPage } from "@/pages/ReferralsPage";
import ReviewsPage from "./pages/ReviewsPage";
import KYCVerificationPage from "./pages/KYCVerificationPage";
import { HealthVaultAuditPage } from "./pages/HealthVaultAuditPage";
import { PaymentLogsPage } from "./pages/PaymentLogsPage";
import PaymentLogDetailsPage from "./pages/PaymentLogDetailsPage";
import { HealthPackagesPage } from "./pages/HealthPackagesPage";
import { HealthPackageDetailsPage } from "./pages/HealthPackageDetailsPage";
import { HealthPackageFormPage } from "./pages/HealthPackageFormPage";
import { ServiceVerticalsPage } from "./pages/ServiceVerticalsPage";
import { AppBannerManagementPage } from "./pages/AppBannerManagementPage";
import DeletionRequestsPage from "./pages/DeletionRequestsPage";
import { CommissionReportPage } from "./pages/CommissionReportPage";
import { EmailTemplatesPage } from "./pages/EmailTemplatesPage";
import CMSManagementPage from "./pages/CMSManagementPage";
import KnowledgeBaseManagementPage from "./pages/KnowledgeBaseManagementPage";
import KnowledgeBaseDetailsPage from "./pages/KnowledgeBaseDetailsPage";
import KnowledgeBaseFormPage from "./pages/KnowledgeBaseFormPage";
import ServiceableAreasPage from "./pages/ServiceableAreasPage";
import { ConfirmationProvider } from "@/context/ConfirmationContext";
import { UserDetailsPage } from "@/pages/UserDetailsPage";
import { ServiceBookingDetailPage } from "@/pages/ServiceBookingDetailPage";
import { OPBookingDetailsPage } from "@/pages/OPBookingDetailsPage";

export default function App() {
  return (
    <BrowserRouter>
      <ConfirmationProvider>
        <Toaster position="top-left" richColors closeButton />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />

              <Route path="/service-management" element={<Navigate to="/service-portfolio" replace />} />
              <Route path="/service-portfolio" element={<ServiceVerticalsPage />} />
              <Route path="/service-categories" element={<ServiceCategoriesPage />} />
              <Route path="/service-subcategories" element={<ServiceSubServicesPage />} />
              <Route path="/service-child-services" element={<ServiceChildServicesPage />} />
              <Route path="/health-packages" element={<HealthPackagesPage />} />
              <Route path="/health-packages/create" element={<HealthPackageFormPage />} />
              <Route path="/health-packages/edit/:id" element={<HealthPackageFormPage />} />
              <Route path="/health-packages/:id" element={<HealthPackageDetailsPage />} />

              {/* Finance & Analytics */}
              <Route path="/partner-revenue-model" element={<SubscriptionManagementPage />} />
              <Route path="/payouts" element={<PayoutsPage />} />
              <Route path="/commission-report" element={<CommissionReportPage />} />
              <Route path="/super-admin-wallet" element={<SuperAdminWalletPage />} />
              <Route path="/coupons" element={<CouponsPage />} />
              <Route path="/referrals" element={<ReferralsPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/kyc-verification" element={<KYCVerificationPage />} />

              {/* User Management Section */}
              <Route path="/manage-patients" element={<UserManagementPage category="patient" />} />
              <Route path="/manage-patients/:id" element={<UserDetailsPage category="patient" />} />
              <Route path="/manage-doctors" element={<DoctorStaffManagementPage />} />
              <Route path="/manage-doctors/:id" element={<UserDetailsPage category="doctor" />} />
              <Route path="/service-providers" element={<DoctorStaffManagementPage />} />
              <Route path="/manage-nurses" element={<UserManagementPage category="nurse" />} />
              <Route path="/manage-nurses/:id" element={<UserDetailsPage category="nurse" />} />
              <Route path="/manage-ambulances" element={<UserManagementPage category="ambulance" />} />
              <Route path="/manage-ambulances/:id" element={<UserDetailsPage category="ambulance" />} />
              <Route path="/manage-rentals" element={<UserManagementPage category="rental" />} />
              <Route path="/manage-rentals/:id" element={<UserDetailsPage category="rental" />} />
              <Route path="/manage-labs" element={<UserManagementPage category="lab" />} />
              <Route path="/manage-labs/:id" element={<UserDetailsPage category="lab" />} />
              <Route path="/manage-services" element={<UserManagementPage category="service" />} />
              <Route path="/manage-services/:id" element={<UserDetailsPage category="service" />} />

              {/* Compatibility Redirects */}
              <Route path="/patients" element={<Navigate to="/manage-patients" replace />} />
              <Route path="/doctors" element={<Navigate to="/manage-doctors" replace />} />

              {/* Operations */}
              <Route path="/bookings" element={<BookingOperationsPage />} />
              <Route path="/bookings/services/:id" element={<ServiceBookingDetailPage />} />
              <Route path="/op-bookings" element={<OPBookingsPage />} />
              <Route path="/op-bookings/:id" element={<OPBookingDetailsPage />} />
              <Route path="/support-tickets" element={<TicketsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />

              {/* Super Admin Restricted */}
              <Route element={<ProtectedRoute allowRoles={["super_admin"]} />}>
                <Route path="/admin-management" element={<AdminManagementPage />} />
                <Route path="/audit-health-vault" element={<HealthVaultAuditPage />} />
                <Route path="/settings" element={<Navigate to="/manage-system-config" replace />} />
                <Route path="/manage-customer-app" element={<AppManagementPage appKey="user_app" />} />
                <Route path="/manage-provider-app" element={<AppManagementPage appKey="provider_app" />} />
                <Route path="/manage-system-config" element={<SystemSettingsPage />} />
                <Route path="/app-banners/:type" element={<AppBannerManagementPage />} />
                <Route path="/payment-logs" element={<PaymentLogsPage />} />
                <Route path="/payment-logs/:id" element={<PaymentLogDetailsPage />} />
                <Route path="/deletion-requests" element={<DeletionRequestsPage />} />
                <Route path="/manage-email-templates" element={<EmailTemplatesPage />} />
                <Route path="/cms-management/:type" element={<CMSManagementPage />} />
                <Route path="/knowledge-base" element={<KnowledgeBaseManagementPage />} />
                <Route path="/knowledge-base/create" element={<KnowledgeBaseFormPage />} />
                <Route path="/knowledge-base/edit/:id" element={<KnowledgeBaseFormPage />} />
                <Route path="/knowledge-base/:id" element={<KnowledgeBaseDetailsPage />} />
                <Route path="/serviceable-areas" element={<ServiceableAreasPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ConfirmationProvider>
    </BrowserRouter>
  );
}
