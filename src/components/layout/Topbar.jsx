import { Bell, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const ROLE_LABEL = {
  Admin:      "Quản trị viên",
  HorseOwner: "Chủ ngựa",
  Jockey:     "Nài ngựa",
  Referee:    "Trọng tài",
  Spectator:  "Khán giả",
};

const ROLE_COLOR = {
  Admin:      "text-red-300",
  HorseOwner: "text-blue-300",
  Jockey:     "text-purple-300",
  Referee:    "text-yellow-300",
  Spectator:  "text-gray-400",
};

export default function Topbar({ title }) {
  const { user, role } = useAuth();

  return (
    <header className="h-16 border-b border-gray-800/60 bg-[#070B14]/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
      <h1 className="text-base font-semibold text-white truncate">{title}</h1>
      <div className="flex items-center gap-4 shrink-0">
        <button className="text-gray-600 hover:text-[#D4AF37] transition-colors">
          <Bell size={19} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
            <User size={15} className="text-[#D4AF37]" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm text-white font-medium leading-tight">
              {user?.fullName || user?.username}
            </p>
            <p className={`text-xs leading-tight ${ROLE_COLOR[role] || "text-gray-400"}`}>
              {ROLE_LABEL[role] || role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
