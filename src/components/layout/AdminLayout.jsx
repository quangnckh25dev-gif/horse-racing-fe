import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AdminLayout({ children, title = "" }) {
  return (
    <div className="flex h-screen bg-[#0A0E1A] text-white overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">
        <Topbar title={title} />

        {/* Main content with dot grid */}
        <main className="relative flex-1 overflow-y-auto">
          {/* Dot grid background */}
          <div className="absolute inset-0 bg-dot-grid pointer-events-none opacity-60" />

          {/* Ambient glow corners */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/[0.025] rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/[0.02] rounded-full blur-[100px] pointer-events-none" />

          {/* Actual page content */}
          <div className="relative z-10 animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
