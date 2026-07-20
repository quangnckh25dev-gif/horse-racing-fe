import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import PrivateRoute from "./routes/PrivateRoute";

// Public pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import PublicLayout from "./components/layout/PublicLayout";
import AdminLayout from "./components/layout/AdminLayout";
import LandingPage from "./pages/LandingPage";

// Admin pages
import DashboardPage from "./pages/admin/DashboardPage";
import UserApprovalPage from "./pages/admin/UserApprovalPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import TournamentManagementPage from "./pages/admin/TournamentManagementPage";
import TournamentDetailPage from "./pages/admin/TournamentDetailPage";
import AuditLogsPage from "./pages/admin/AuditLogsPage";
import SystemConfigsPage from "./pages/admin/SystemConfigsPage";
import DepositRequestsPage from "./pages/admin/DepositRequestsPage";

// Organizer pages
import OrganizerRacesPage from "./pages/organizer/OrganizerRacesPage";
import OrganizerRaceDetailPage from "./pages/organizer/OrganizerRaceDetailPage";
import OrganizerResultsPage from "./pages/organizer/OrganizerResultsPage";

// HorseOwner pages
import HorsesPage from "./pages/owner/HorsesPage";
import RaceRegistrationPage from "./pages/owner/RaceRegistrationPage";
import OwnerInvitationsPage from "./pages/owner/OwnerInvitationsPage";

// Jockey pages
import JockeyInvitationsPage from "./pages/jockey/JockeyInvitationsPage";

// Referee pages
import RefereeRacesPage from "./pages/referee/RefereeRacesPage";
import RefereeRaceDetailPage from "./pages/referee/RefereeRaceDetailPage";

// Spectator pages
import RaceSchedulePage from "./pages/spectator/RaceSchedulePage";
import WalletPage from "./pages/spectator/WalletPage";
import BettingPage from "./pages/spectator/BettingPage";
import LeaderboardPage from "./pages/spectator/LeaderboardPage";

// Shared pages
import ProfilePage from "./pages/ProfilePage";

const UnauthorizedPage = () => (
  <div className="flex h-screen w-full items-center justify-center text-gray-900" style={{ background: "#FAFAF5" }}>
    <div className="text-center">
      <h1 className="text-4xl font-bold text-red-500 mb-4">403 — Không có quyền truy cập</h1>
      <p className="text-gray-500 mb-6 text-sm">Tài khoản của bạn không có quyền truy cập trang này.</p>
      <a href="/login" className="text-[#D4AF37] hover:underline font-semibold">Quay về đăng nhập</a>
    </div>
  </div>
);

// Route helpers
const guard = (roles, element) => (
  <PrivateRoute allowedRoles={roles}>{element}</PrivateRoute>
);
const anyAuth = (element) => <PrivateRoute>{element}</PrivateRoute>;

// Leaderboard: no auth required — shows sidebar layout when logged in, public nav when not
function LeaderboardRoute() {
  const { user } = useAuth();
  return user
    ? <AdminLayout title="Bảng xếp hạng"><LeaderboardPage /></AdminLayout>
    : <PublicLayout><LeaderboardPage /></PublicLayout>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public (no auth required) ───────────────────── */}
          <Route path="/" element={<LandingPage />} />
          {/* /races đã gộp vào trang chủ (trang chủ hiện đủ lịch đua + BXH) */}
          <Route path="/races" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* ── Any authenticated user ───────────────────────── */}
          <Route path="/dashboard"       element={anyAuth(<DashboardPage />)} />
          <Route path="/change-password" element={anyAuth(<ChangePasswordPage />)} />

          {/* ── Admin — F1 ──────────────────────────────────── */}
          <Route path="/admin/users/pending"  element={guard(["Admin"], <UserApprovalPage />)} />
          <Route path="/admin/users"          element={guard(["Admin"], <UserManagementPage />)} />
          <Route path="/admin/tournaments"    element={guard(["Admin"], <TournamentManagementPage />)} />
          <Route path="/admin/tournaments/:id" element={guard(["Admin"], <TournamentDetailPage />)} />
          <Route path="/admin/audit-logs"     element={guard(["Admin"], <AuditLogsPage />)} />
          <Route path="/admin/configs"        element={guard(["Admin"], <SystemConfigsPage />)} />
          <Route path="/admin/deposit-requests" element={guard(["Admin"], <DepositRequestsPage />)} />

          {/* ── Organizer — F5 ──────────────────────────────── */}
          <Route path="/organizer/races"
            element={guard(["Organizer"], <OrganizerRacesPage />)} />
          <Route path="/organizer/races/:raceId"
            element={guard(["Organizer"], <OrganizerRaceDetailPage />)} />
          <Route path="/organizer/results"
            element={guard(["Organizer"], <OrganizerResultsPage />)} />
          <Route path="/organizer/referees"
            element={guard(["Organizer"], <OrganizerRacesPage />)} />

          {/* ── HorseOwner — F2 ─────────────────────────────── */}
          <Route path="/owner/horses"
            element={guard(["HorseOwner"], <HorsesPage />)} />
          <Route path="/owner/race-registration"
            element={guard(["HorseOwner"], <RaceRegistrationPage />)} />
          <Route path="/owner/invitations"
            element={guard(["HorseOwner"], <OwnerInvitationsPage />)} />

          {/* ── Jockey ──────────────────────────────────────── */}
          <Route path="/jockey/invitations"
            element={guard(["Jockey"], <JockeyInvitationsPage />)} />

          {/* ── Referee — F3 ────────────────────────────────── */}
          <Route path="/referee/races"
            element={guard(["Referee"], <RefereeRacesPage />)} />
          <Route path="/referee/races/:raceId"
            element={guard(["Referee"], <RefereeRaceDetailPage />)} />

          {/* ── Spectator — F4 ──────────────────────────────── */}
          <Route path="/spectator/schedule"
            element={guard(["Spectator"], <RaceSchedulePage />)} />
          <Route path="/spectator/wallet"
            element={guard(["Spectator"], <WalletPage />)} />
          <Route path="/spectator/betting"
            element={guard(["Spectator"], <BettingPage />)} />

          {/* ── Leaderboard (public — no login required) ──── */}
          <Route path="/leaderboard" element={<LeaderboardRoute />} />

          {/* ── Profile (any authenticated user) ──────────── */}
          <Route path="/profile" element={anyAuth(<ProfilePage />)} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
