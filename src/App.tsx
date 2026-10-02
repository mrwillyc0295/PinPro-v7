/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HelmetProvider } from "react-helmet-async";
import "./lib/mapFix";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalLoader from "./components/GlobalLoader";
import Layout from "./components/Layout";
import { useState, useEffect, lazy, Suspense } from "react";

// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const Profile = lazy(() => import("./pages/Profile"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Messages = lazy(() => import("./pages/Messages"));
const ChatDetail = lazy(() => import("./pages/ChatDetail"));
const NewRequest = lazy(() => import("./pages/NewRequest"));
const Booking = lazy(() => import("./pages/Booking"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Activity = lazy(() => import("./pages/Activity"));
const Settings = lazy(() => import("./pages/Settings"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const Referrals = lazy(() => import("./pages/Referrals"));
const Premium = lazy(() => import("./pages/Premium"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const About = lazy(() => import("./pages/About"));
const Security = lazy(() => import("./pages/Security"));
const Masterminds = lazy(() => import("./pages/Masterminds"));
const PaymentMethods = lazy(() => import("./pages/PaymentMethods"));
const CashOut = lazy(() => import("./pages/CashOut"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const Splash = lazy(() => import("./pages/Splash"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile"));
const OrquestadorNavegacion = lazy(
  () => import("./pages/OrquestadorNavegacion"),
);
const PremiumFilter = lazy(() => import("./pages/PremiumFilter"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminCommunications = lazy(() => import("./pages/AdminCommunications"));
const EmergencyRequest = lazy(() => import("./pages/EmergencyRequest"));
const Tracking = lazy(() => import("./pages/Tracking"));
const TrackingEmergency = lazy(() => import("./pages/TrackingEmergency"));
const ClientReservations = lazy(() => import("./pages/ClientReservations"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const ClientSetupProfile = lazy(() => import("./pages/ClientSetupProfile"));
const MuroRequerimientos = lazy(() => import("./pages/MuroRequerimientos"));
const AuditReport = lazy(() => import("./pages/AuditReport"));
const ProDashboard = lazy(() => import("./pages/ProDashboard"));
const Users = lazy(() => import("./pages/Users"));
const AirdropRewards = lazy(() => import("./pages/AirdropRewards"));
const ExpertAudition = lazy(() => import("./pages/ExpertAudition"));
const MasterBrainMonitor = lazy(() => import("./pages/MasterBrainMonitor"));
const DashboardReferidor = lazy(() => import("./pages/DashboardReferidor"));

import { AdminGuard } from "./components/AdminGuard";

import { RoleGuard } from "./components/RoleGuard";
import { AuthGuard } from "./components/AuthGuard";

import { ViewProvider, useView } from "./contexts/ViewContext";
import EmergencyDespatcher from "./components/professional/EmergencyDespatcher";
import { GlobalBackButton } from "./components/GlobalBackButton";

import { GlobalCallManager } from "./components/GlobalCallManager";

function RootRedirect() {
  const { profile, isAdmin, authState } = useAuth();

  if (authState === "LOADING") {
    return <GlobalLoader />;
  }

  if (authState === "AUTHENTICATED") {
    return <Navigate to="/orquestador" replace />;
  }

  return <Navigate to="/inicio-registro" replace />;
}

function AppContent() {
  const { viewMode } = useView();

  const getContainerWidth = () => {
    return "w-full";
  };

  return (
    <div className="bg-black flex justify-center items-center overflow-hidden h-[100dvh] w-full relative">
      <GlobalCallManager />
      <div
        className={`h-full bg-black relative flex flex-col md:shadow-2xl overflow-hidden seamless-scroll transition-all duration-700 ease-in-out ${getContainerWidth()} pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]`}
      >
        <BrowserRouter>
          <GlobalBackButton />
          <EmergencyDespatcher />
          <Suspense fallback={<GlobalLoader />}>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route
                path="/inicio-registro"
                element={
                  <AuthGuard requireAuth={false}>
                    <Splash />
                  </AuthGuard>
                }
              />
              <Route
                path="/welcome"
                element={<Navigate to="/inicio-registro" replace />}
              />
              <Route
                path="/register"
                element={
                  <AuthGuard requireAuth={false}>
                    <RegisterPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/complete-profile"
                element={
                  <AuthGuard>
                    <CompleteProfile />
                  </AuthGuard>
                }
              />
              <Route path="/orquestador" element={<OrquestadorNavegacion />} />
              <Route
                path="/premium-filter"
                element={
                  <AuthGuard>
                    <PremiumFilter />
                  </AuthGuard>
                }
              />
              <Route
                path="/emergency/:id"
                element={
                  <AuthGuard>
                    <EmergencyRequest />
                  </AuthGuard>
                }
              />
              <Route
                path="/tracking/:id"
                element={
                  <AuthGuard>
                    <TrackingEmergency />
                  </AuthGuard>
                }
              />
              <Route element={<Layout />}>
                <Route
                  path="/mapa"
                  element={
                    <AuthGuard>
                      <RoleGuard allowedRoles={["Cliente", "Profesional"]}>
                        <Home />
                      </RoleGuard>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/perfil-profesional"
                  element={
                    <AuthGuard>
                      <Profile />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/dashboard-cliente"
                  element={
                    <AuthGuard>
                      <RoleGuard allowedRoles={["Cliente"]}>
                        <ClientDashboard />
                      </RoleGuard>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/home"
                  element={
                    <AuthGuard>
                      <RoleGuard allowedRoles={["Cliente", "Profesional"]}>
                        <Home />
                      </RoleGuard>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <AuthGuard>
                      <AdminGuard>
                        <AdminDashboard />
                      </AdminGuard>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/pro/dashboard"
                  element={
                    <AuthGuard>
                      <RoleGuard allowedRoles={["Profesional"]}>
                        <ProDashboard />
                      </RoleGuard>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <AuthGuard>
                      <Users />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminGuard>
                      <AdminDashboard />
                    </AdminGuard>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <AuthGuard>
                      <AdminGuard>
                        <AdminReports />
                      </AdminGuard>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/admin/communications"
                  element={
                    <AuthGuard>
                      <AdminGuard>
                        <AdminCommunications />
                      </AdminGuard>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/admin/expert-audition"
                  element={
                    <AuthGuard>
                      <AdminGuard>
                        <ExpertAudition />
                      </AdminGuard>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/admin/masterbrain"
                  element={
                    <AuthGuard>
                      <AdminGuard>
                        <MasterBrainMonitor />
                      </AdminGuard>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/dashboard-referidor"
                  element={
                    <AuthGuard>
                      <RoleGuard allowedRoles={["Referidor", "Agente"]}>
                        <DashboardReferidor />
                      </RoleGuard>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <AuthGuard>
                      <Profile />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/profile/cliente"
                  element={
                    <AuthGuard>
                      <Profile />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/profile/profesional"
                  element={
                    <AuthGuard>
                      <Profile />
                    </AuthGuard>
                  }
                />
                <Route path="/profile/:id" element={<PublicProfile />} />
                <Route path="/p/:id" element={<PublicProfile />} />
                <Route
                  path="edit-profile"
                  element={
                    <AuthGuard>
                      <EditProfile />
                    </AuthGuard>
                  }
                />
                <Route
                  path="wallet"
                  element={
                    <AuthGuard>
                      <Wallet />
                    </AuthGuard>
                  }
                />
                <Route
                  path="cash-out"
                  element={
                    <AuthGuard>
                      <CashOut />
                    </AuthGuard>
                  }
                />
                <Route
                  path="payment-methods"
                  element={
                    <AuthGuard>
                      <PaymentMethods />
                    </AuthGuard>
                  }
                />
                <Route
                  path="messages"
                  element={
                    <AuthGuard>
                      <Messages />
                    </AuthGuard>
                  }
                />
                <Route
                  path="messages/:id"
                  element={
                    <AuthGuard>
                      <ChatDetail />
                    </AuthGuard>
                  }
                />
                <Route
                  path="new-request"
                  element={
                    <AuthGuard>
                      <RoleGuard allowedRoles={["Cliente"]}>
                        <NewRequest />
                      </RoleGuard>
                    </AuthGuard>
                  }
                />
                <Route
                  path="booking/:id"
                  element={
                    <AuthGuard>
                      <Booking />
                    </AuthGuard>
                  }
                />
                <Route
                  path="notifications"
                  element={
                    <AuthGuard>
                      <Notifications />
                    </AuthGuard>
                  }
                />
                <Route
                  path="activity"
                  element={
                    <AuthGuard>
                      <Activity />
                    </AuthGuard>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <AuthGuard>
                      <Settings />
                    </AuthGuard>
                  }
                />
                <Route path="privacy" element={<PrivacyPolicy />} />
                <Route path="terms" element={<TermsAndConditions />} />
                <Route path="about" element={<About />} />
                <Route
                  path="security"
                  element={
                    <AuthGuard>
                      <Security />
                    </AuthGuard>
                  }
                />
                <Route
                  path="masterminds"
                  element={
                    <AuthGuard>
                      <Masterminds />
                    </AuthGuard>
                  }
                />
                <Route
                  path="referrals"
                  element={
                    <AuthGuard>
                      <Referrals />
                    </AuthGuard>
                  }
                />
                <Route
                  path="premium"
                  element={
                    <AuthGuard>
                      <Premium />
                    </AuthGuard>
                  }
                />
                <Route
                  path="airdrop"
                  element={
                    <AuthGuard>
                      <RoleGuard allowedRoles={["Profesional"]}>
                        <AirdropRewards />
                      </RoleGuard>
                    </AuthGuard>
                  }
                />
                <Route
                  path="tracking"
                  element={
                    <AuthGuard>
                      <Tracking />
                    </AuthGuard>
                  }
                />
                <Route
                  path="client-reservations"
                  element={
                    <AuthGuard>
                      <ClientReservations />
                    </AuthGuard>
                  }
                />
                <Route
                  path="client/dashboard"
                  element={
                    <AuthGuard>
                      <RoleGuard allowedRoles={["Cliente"]}>
                        <ClientDashboard />
                      </RoleGuard>
                    </AuthGuard>
                  }
                />
                <Route
                  path="client/setup"
                  element={
                    <AuthGuard>
                      <RoleGuard allowedRoles={["Cliente"]}>
                        <ClientSetupProfile />
                      </RoleGuard>
                    </AuthGuard>
                  }
                />
                <Route
                  path="muro-requerimientos"
                  element={
                    <AuthGuard>
                      <RoleGuard allowedRoles={["Profesional"]}>
                        <MuroRequerimientos />
                      </RoleGuard>
                    </AuthGuard>
                  }
                />
                <Route
                  path="audit-report"
                  element={
                    <AuthGuard>
                      <AuditReport />
                    </AuthGuard>
                  }
                />
              </Route>
              <Route
                path="*"
                element={<Navigate to="/inicio-registro" replace />}
              />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </div>
    </div>
  );
}

import { SocketProvider } from "./contexts/SocketContext";
import { AnalyticsProvider } from "./contexts/AnalyticsContext";

export default function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary componentName="Ecosistema de PinPro">
        <AnalyticsProvider>
          <AuthProvider>
            <SocketProvider>
              <ViewProvider>
                <AppContent />
              </ViewProvider>
            </SocketProvider>
          </AuthProvider>
        </AnalyticsProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}
