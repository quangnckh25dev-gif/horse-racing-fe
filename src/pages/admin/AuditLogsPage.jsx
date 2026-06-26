import { useState, useEffect, useCallback } from "react";
import {
  FileText, Loader2, AlertCircle, RefreshCw, Search,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { adminService } from "../../services/admin";

const ACTION_COLOR = {
  CREATE: "bg-green-500/20 text-green-300 border-green-500/40",
  UPDATE: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  DELETE: "bg-red-500/20 text-red-300 border-red-500/40",
  LOGIN:  "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  LOGOUT: "bg-gray-500/20 text-gray-400 border-gray-500/40",
};

export default function AuditLogsPage() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await adminService.getAuditLogs();
      setLogs(res.data || []);
    } catch (e) {
      setError(e.message || "Không thể tải audit logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.action?.toLowerCase().includes(q) ||
      l.entityType?.toLowerCase().includes(q) ||
      l.performedBy?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout title="Audit Logs">
      <div className="page-header">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl opacity-[0.07] pointer-events-none select-none">📋</div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
              <FileText size={14} className="text-[#D4AF37]" />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Admin</span>
          </div>
          <h1 className="text-2xl font-black text-white leading-tight">Audit Logs</h1>
          <p className="text-gray-500 text-sm mt-1">Lịch sử hoạt động hệ thống</p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-300 text-sm">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo hành động, người thực hiện..."
              className="w-full bg-[#0d1117] border border-gray-800/60 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#D4AF37]/40"
            />
          </div>
          <button onClick={load}
            className="flex items-center gap-2 px-3 py-2.5 bg-white/[0.04] border border-gray-700/60 rounded-xl text-gray-400 hover:text-white text-sm transition-all shrink-0">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-[#D4AF37]" size={28} />
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 p-5 border-b border-white/[0.06]">
              <div className="w-6 h-6 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                <FileText size={12} className="text-[#D4AF37]" />
              </div>
              <h3 className="font-bold text-sm text-white">Nhật ký hoạt động</h3>
              <span className="ml-auto text-xs text-gray-500">{filtered.length} bản ghi</span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <FileText size={28} className="text-gray-700 mx-auto mb-3" />
                <p className="text-white font-semibold">{search ? "Không tìm thấy kết quả" : "Chưa có audit log nào"}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {["Thời gian", "Người thực hiện", "Hành động", "Đối tượng", "Mô tả"].map((h) => (
                        <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wider font-semibold px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filtered.map((log, i) => {
                      const actionCls = ACTION_COLOR[log.action?.toUpperCase()] || ACTION_COLOR.UPDATE;
                      return (
                        <tr key={log.logId || i} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                            {log.createdAt
                              ? new Date(log.createdAt).toLocaleString("vi-VN")
                              : "—"}
                          </td>
                          <td className="px-5 py-3 text-white font-medium">{log.performedBy || log.userId || "—"}</td>
                          <td className="px-5 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${actionCls}`}>
                              {log.action || "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-400">{log.entityType || "—"}{log.entityId ? ` #${log.entityId}` : ""}</td>
                          <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{log.description || log.details || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
