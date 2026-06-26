import { useState, useEffect, useCallback } from "react";
import {
  Settings, Loader2, AlertCircle, RefreshCw,
  Edit2, Save, X, CheckCircle2,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { adminService } from "../../services/admin";

export default function SystemConfigsPage() {
  const [configs, setConfigs]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [editing, setEditing]     = useState(null); // configKey being edited
  const [editVal, setEditVal]     = useState("");
  const [saving, setSaving]       = useState(false);
  const [success, setSuccess]     = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await adminService.getConfigs();
      setConfigs(res.data || []);
    } catch (e) {
      setError(e.message || "Không thể tải cấu hình hệ thống");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (cfg) => {
    setEditing(cfg.configKey || cfg.key);
    setEditVal(cfg.configValue ?? cfg.value ?? "");
    setSuccess("");
  };

  const cancelEdit = () => { setEditing(null); setEditVal(""); };

  const handleSave = async (cfg) => {
    const key = cfg.configKey || cfg.key;
    setSaving(true); setError("");
    try {
      await adminService.updateConfig(key, editVal);
      setSuccess(`Đã lưu cấu hình "${key}"`);
      setEditing(null);
      load();
    } catch (e) {
      setError(e.message || "Lưu cấu hình thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Cấu hình hệ thống">
      <div className="page-header">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl opacity-[0.07] pointer-events-none select-none">⚙️</div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
              <Settings size={14} className="text-[#D4AF37]" />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Admin</span>
          </div>
          <h1 className="text-2xl font-black text-white leading-tight">Cấu hình hệ thống</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý các thông số cấu hình toàn cục</p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-300 text-sm">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-950/30 border border-green-900/50 rounded-xl text-green-300 text-sm">
            <CheckCircle2 size={14} className="shrink-0" /> {success}
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={load}
            className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-gray-700/60 rounded-xl text-gray-400 hover:text-white text-sm transition-all">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-[#D4AF37]" size={28} />
          </div>
        ) : configs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Settings size={28} className="text-gray-700 mx-auto mb-3" />
            <p className="text-white font-semibold">Chưa có cấu hình nào</p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 p-5 border-b border-white/[0.06]">
              <div className="w-6 h-6 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                <Settings size={12} className="text-[#D4AF37]" />
              </div>
              <h3 className="font-bold text-sm text-white">Danh sách cấu hình</h3>
              <span className="ml-auto text-xs text-gray-500">{configs.length} mục</span>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {configs.map((cfg, i) => {
                const key = cfg.configKey || cfg.key;
                const isEditing = editing === key;
                return (
                  <div key={key || i} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm font-mono">{key}</p>
                      {cfg.description && (
                        <p className="text-gray-500 text-xs mt-0.5">{cfg.description}</p>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          value={editVal}
                          onChange={(e) => setEditVal(e.target.value)}
                          className="h-8 w-36 rounded-lg bg-[#0A0E1A]/80 border border-[#D4AF37]/40 text-white text-sm px-2.5 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave(cfg);
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                        <button onClick={() => handleSave(cfg)} disabled={saving}
                          className="h-8 w-8 rounded-lg bg-[#D4AF37] hover:bg-[#c49b2e] flex items-center justify-center text-[#0A0E1A] transition-colors disabled:opacity-50">
                          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        </button>
                        <button onClick={cancelEdit}
                          className="h-8 w-8 rounded-lg bg-white/[0.04] border border-gray-700 hover:border-gray-500 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-data text-sm text-[#D4AF37] font-semibold">
                          {cfg.configValue ?? cfg.value ?? "—"}
                        </span>
                        <button onClick={() => startEdit(cfg)}
                          className="h-8 w-8 rounded-lg bg-white/[0.04] border border-gray-700 hover:border-[#D4AF37]/40 hover:text-[#D4AF37] flex items-center justify-center text-gray-500 transition-colors">
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
