import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./routes/PrivateRoute";

// Public pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";

// Admin pages
import DashboardPage from "./pages/admin/DashboardPage";
import UserApprovalPage from "./pages/admin/UserApprovalPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import TournamentManagementPage from "./pages/admin/TournamentManagementPage";
import TournamentDetailPage from "./pages/admin/TournamentDetailPage";

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
import PredictionPage from "./pages/spectator/PredictionPage";
import LeaderboardPage from "./pages/spectator/LeaderboardPage";

// Shared pages
import ProfilePage from "./pages/ProfilePage";

const UnauthorizedPage = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#0A0E1A] text-white">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-red-400 mb-4">403 — Không có quyền truy cập</h1>
      <p className="text-gray-400 mb-6 text-sm">Tài khoản của bạn không có quyền truy cập trang này.</p>
      <a href="/login" className="text-[#D4AF37] hover:underline">Quay về đăng nhập</a>
    </div>
  </div>
);

// Route helpers
const guard = (roles, element) => (
  <PrivateRoute allowedRoles={roles}>{element}</PrivateRoute>
);
const anyAuth = (element) => <PrivateRoute>{element}</PrivateRoute>;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public ──────────────────────────────────────── */}
          <Route path="/" element={<Navigate to="/login" replace />} />
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

          {/* ── Organizer — F5 ──────────────────────────────── */}
          <Route path="/organizer/races"
            element={guard(["OrganizerHead", "OrganizerMember"], <OrganizerRacesPage />)} />
          <Route path="/organizer/races/:raceId"
            element={guard(["OrganizerHead", "OrganizerMember"], <OrganizerRaceDetailPage />)} />
          <Route path="/organizer/results"
            element={guard(["OrganizerHead"], <OrganizerResultsPage />)} />
          {/* OrganizerMember referee assignment alias */}
          <Route path="/organizer/referees"
            element={guard(["OrganizerHead", "OrganizerMember"], <OrganizerRacesPage />)} />

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
          <Route path="/spectator/predictions"
            element={guard(["Spectator"], <PredictionPage />)} />

          {/* ── Leaderboard (any authenticated user) ──────── */}
          <Route path="/leaderboard" element={anyAuth(<LeaderboardPage />)} />

          {/* ── Profile (any authenticated user) ──────────── */}
          <Route path="/profile" element={anyAuth(<ProfilePage />)} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
