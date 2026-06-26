import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AdminLayout({ children, title = "" }) {
  return (
    <div className="flex h-screen text-gray-900 overflow-hidden bg-mesh">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">
        <Topbar title={title} />

        {/* Main content */}
        <main className="relative flex-1 overflow-y-auto" style={{ background: "#F3F4F6" }}>
          {/* Subtle ambient */}
          <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-blue-400/[0.03] rounded-full blur-[120px] pointer-events-none" />

          {/* Page content */}
          <div className="page-content relative z-10 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
