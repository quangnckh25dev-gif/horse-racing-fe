import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AdminLayout({ children, title = "" }) {
  return (
    // `dark` bật bộ token sportsbook tối cho toàn bộ khu vực đăng nhập
    <div className="dark flex h-screen overflow-hidden bg-sb-bg text-sb-tx">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">
        <Topbar title={title} />

        <main className="flex-1 overflow-y-auto bg-sb-bg">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
