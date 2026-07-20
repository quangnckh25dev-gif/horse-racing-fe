import { useState, useEffect, useCallback } from "react";
import {
  AlertCircle, Loader2, Trophy, Calendar, X, Plus,
  RefreshCw, CheckCircle2, Clock, XCircle, Send,
  Flag, ClipboardList,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { confirmBox } from "../../lib/toast";
import { entryService } from "../../services/entry";
import { horseService } from "../../services/horse";
import { spectatorService } from "../../services/spectator";
import { invitationService } from "../../services/invitation";

// Status đầy đủ theo flow: Pending Organizer Approval → Approved/waiting for jockey → Ready to Race
const ENTRY_STATUS = {
  Pending:  { label: "Pending Organizer Approval",       color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40", borderCls: "border-l-gold-glow",  icon: Clock },
  Approved: { label: "Approved · waiting for jockey", color: "bg-blue-500/20 text-blue-300 border-blue-500/40",     borderCls: "border-l-blue-glow",  icon: CheckCircle2 },
  Ready:    { label: "Ready to Race",   color: "bg-green-500/20 text-green-300 border-green-500/40",   borderCls: "border-l-green-glow", icon: CheckCircle2 },
  Rejected: { label: "Rejected",              color: "bg-red-500/20 text-red-300 border-red-500/40",         borderCls: "border-l-red-glow",   icon: XCircle },
  Withdrawn:{ label: "Withdrawn",               color: "bg-sb-s2 text-sb-tx-3 border-sb-border",               borderCls: "",                    icon: XCircle },
};

// BE trả registrationStatus; entry Approved + đã có jockey xác nhận = ready to race
const entryStatusOf = (e) => {
  const raw = e.registrationStatus || e.status || "Pending";
  if (raw === "Approved" && (e.jockeyConfirmed || e.jockeyName)) return "Ready";
  return raw;
};

const selectCls = "w-full bg-[#070B14] border border-sb-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/60 transition-all";
const inputCls  = "w-full bg-[#070B14] border border-sb-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/60 transition-all";
const labelCls  = "block text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-1.5";

function Modal({ title, accentColor = "#D4AF37", onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
      <div className="bg-[#0d1117] border border-sb-border rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
        <div className="h-0.5 w-full rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
        <div className="flex items-center justify-between px-6 py-4 border-b border-sb-border">
          <h3 className="text-white font-bold">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-sb-tx-3 hover:text-sb-tx hover:bg-sb-s1/5 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function RaceRegistrationPage() {
  const [races, setRaces]           = useState([]);
  const [horses, setHorses]         = useState([]);
  const [myEntries, setMyEntries]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [error, setError]           = useState("");
  const [showRegister, setShowRegister] = useState(null);
  const [showInvite, setShowInvite]     = useState(null);
  const [registerForm, setRegisterForm] = useState({ horseId: "" });
  const [inviteForm, setInviteForm]     = useState({ jockeyId: "", note: "" });
  const [formLoading, setFormLoading]   = useState(false);
  const [formError, setFormError]       = useState("");
  const [activeTab, setActiveTab]       = useState("upcoming");
  const [actionLoading, setActionLoading] = useState("");

  const [jockeys, setJockeys] = useState([]);

  const loadRaces = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [racesRes, horsesRes, jockeysRes] = await Promise.all([
        spectatorService.getRaces(),
        horseService.getMyHorses(),
        entryService.getJockeys().catch(() => ({ data: [] })),
      ]);
      setRaces(racesRes.data || []);
      // Horse đang active (BE trả active/statusLabel, không có field status)
      setHorses((horsesRes.data || []).filter((h) => h.active !== false));
      setJockeys(jockeysRes.data || []);
    } catch (e) {
      setError(e.message || "Unable to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMyEntries = useCallback(async () => {
    setEntriesLoading(true);
    try {
      const res = await entryService.getMyEntries();
      setMyEntries(res.data || []);
    } catch {
      setMyEntries([]);
    } finally {
      setEntriesLoading(false);
    }
  }, []);

  useEffect(() => { loadRaces(); }, [loadRaces]);
  useEffect(() => { if (activeTab === "entries") loadMyEntries(); }, [activeTab, loadMyEntries]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerForm.horseId) { setFormError("Please select a horse"); return; }
    setFormLoading(true); setFormError("");
    try {
      await entryService.registerForRace(showRegister.raceId, { horseId: Number(registerForm.horseId) });
      setShowRegister(null);
      setRegisterForm({ horseId: "" });
      // Chuyển sang tab "My Registrations" để thấy ngay registrations mới (trạng thái Pending Organizer Approval)
      setActiveTab("entries");
      loadMyEntries();
    } catch (err) {
      setFormError(err.message || "Registration failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.jockeyId) { setFormError("Please select a jockey"); return; }
    setFormLoading(true); setFormError("");
    try {
      // BE cần jockeyId (số) + message
      await invitationService.sendInvitation(showInvite.entryId, {
        jockeyId: Number(inviteForm.jockeyId),
        message: inviteForm.note?.trim() || undefined,
      });
      setShowInvite(null);
      setInviteForm({ jockeyId: "", note: "" });
      loadMyEntries();
    } catch (err) {
      setFormError(err.message || "Failed to send invitation");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = async (raceId, entryId) => {
    if (!(await confirmBox("Confirm canceling registration?", { okText: "Cancel Registration", danger: true }))) return;
    setActionLoading(entryId);
    try {
      await entryService.cancelEntry(raceId, entryId);
      loadMyEntries();
    } catch (err) {
      alert(err.message || "Cancellation failed");
    } finally {
      setActionLoading("");
    }
  };

  const upcomingRaces = races.filter((r) => r.status === "RegistrationOpen");
  const pendingEntries  = myEntries.filter((e) => entryStatusOf(e) === "Pending").length;
  const approvedEntries = myEntries.filter((e) => entryStatusOf(e) === "Approved").length;
  const readyEntries    = myEntries.filter((e) => entryStatusOf(e) === "Ready").length;

  return (
    <AdminLayout title="Race Registration">

      {/* ── Page Header Banner ── */}
      <div className="page-header">
        <div className="absolute right-0 top-0 w-72 h-full bg-gradient-to-l from-orange-500/[0.04] to-transparent pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <ClipboardList size={14} className="text-orange-400" />
              </div>
              <span className="text-[10px] font-bold text-sb-tx-3 uppercase tracking-widest">Horse Owner</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">Race Registration</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="stat-pill"><span className="text-white font-bold">{upcomingRaces.length}</span> races upcoming</span>
              {pendingEntries > 0 && (
                <span className="stat-pill text-yellow-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-dot inline-block" /> {pendingEntries} pending organizer approval
                </span>
              )}
              {approvedEntries > 0 && <span className="stat-pill text-blue-400">{approvedEntries} waiting for jockey</span>}
              {readyEntries > 0 && <span className="stat-pill text-green-400">{readyEntries} ready to race</span>}
            </div>
          </div>
          <button onClick={loadRaces}
            className="flex items-center gap-2 px-3 py-2 bg-sb-s2 border border-sb-border rounded-xl text-sb-tx-3 hover:text-sb-tx text-sm transition-all shrink-0">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* ── Tab bar ── */}
        <div className="flex gap-1 bg-sb-s2 p-1 rounded-xl border border-sb-border w-fit">
          {[
            { id: "upcoming", label: "Races upcoming", icon: Flag },
            { id: "entries",  label: "My Registrations",  icon: ClipboardList },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-[#D4AF37] text-[#0A0E1A] shadow-[0_0_14px_rgba(212,175,55,0.25)]"
                  : "text-sb-tx-3 hover:text-sb-tx hover:bg-sb-s2"
              }`}>
              <tab.icon size={13} /> {tab.label}
            </button>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-300 text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* ── Tab: Upcoming Races ── */}
        {activeTab === "upcoming" && (
          loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 shimmer rounded-xl" style={{ animationDelay: `${i * 70}ms` }} />)}
            </div>
          ) : upcomingRaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-center mb-4 animate-float">
                <Trophy size={24} className="text-orange-400/30" />
              </div>
              <p className="text-white font-semibold mb-1">No upcoming races</p>
              <p className="text-sb-tx-3 text-sm">Check back later for new races</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingRaces.map((race, idx) => (
                <div key={race.raceId}
                  className="group bg-[#0d1117] border border-sb-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 card-hover border-l-blue-glow animate-fade-in-up"
                  style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Flag size={17} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                      <h3 className="text-white font-bold">{race.raceName}</h3>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-blue-500/20 text-blue-300 border-blue-500/40">Scheduled</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {(race.raceDate || race.startTime) && (
                        <span className="flex items-center gap-1 text-sb-tx-3 text-xs">
                          <Calendar size={10} /> {new Date(race.raceDate || race.startTime).toLocaleString("vi-VN")}
                        </span>
                      )}
                      {(race.trackLength || race.distance) && <span className="stat-pill">📏 {race.trackLength || race.distance}m</span>}
                      {(race.maxParticipants || race.maxEntries) && <span className="stat-pill">👥 {race.maxParticipants || race.maxEntries} slots</span>}
                      {(race.prizePool || race.prizeFirst) && <span className="text-xs font-bold text-[#D4AF37] neon-gold">💰 {Number(race.prizePool || race.prizeFirst).toLocaleString("vi-VN")} VND</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => { setRegisterForm({ horseId: "" }); setFormError(""); setShowRegister(race); }}
                    disabled={horses.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold rounded-xl text-sm transition-colors disabled:opacity-40 shrink-0 btn-gold-glow">
                    <Plus size={14} /> Register
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Tab: My Entries ── */}
        {activeTab === "entries" && (
          entriesLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 shimmer rounded-xl" style={{ animationDelay: `${i * 70}ms` }} />)}
            </div>
          ) : myEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-sb-s2 border border-sb-border flex items-center justify-center mb-4 animate-float">
                <ClipboardList size={24} className="text-sb-tx-2" />
              </div>
              <p className="text-white font-semibold mb-1">No registrations yet</p>
              <p className="text-sb-tx-3 text-sm">Switch to the Upcoming Races tab to register</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myEntries.map((entry, idx) => {
                const status = entryStatusOf(entry);
                const cfg = ENTRY_STATUS[status] || ENTRY_STATUS.Pending;
                const StatusIcon = cfg.icon;
                const isBusy = actionLoading === entry.entryId;

                return (
                  <div key={entry.entryId}
                    className={`group bg-[#0d1117] border border-sb-border rounded-xl overflow-hidden card-hover ${cfg.borderCls} animate-fade-in-up`}
                    style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Status icon */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-white/[0.06] ${
                        status === "Pending" ? "bg-yellow-500/10 text-yellow-400" :
                        status === "Approved" ? "bg-blue-500/10 text-blue-400" :
                        status === "Ready" ? "bg-green-500/10 text-green-400" :
                        "bg-red-500/10 text-red-400"
                      }`}>
                        <StatusIcon size={17} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                          <h3 className="text-white font-bold">{entry.raceName || `Races #${entry.raceId}`}</h3>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${cfg.color}`}>
                            {status === "Pending" && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 live-dot" />}
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {entry.horseName  && <span className="stat-pill">🐴 {entry.horseName}</span>}
                          {entry.jockeyName
                            ? <span className="stat-pill text-green-400">🏇 {entry.jockeyName} {entry.jockeyConfirmed ? "✓" : ""}</span>
                            : status === "Approved"
                              ? <span className="text-blue-300 text-xs italic">No jockey yet - send an invitation</span>
                              : <span className="text-sb-tx-2 text-xs italic">No jockey yet</span>
                          }
                          {entry.rejectReason && status === "Rejected" && (
                            <span className="text-red-300 text-xs">Reason: {entry.rejectReason}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {status === "Approved" && (
                          <button
                            onClick={() => { setInviteForm({ jockeyId: "", note: "" }); setFormError(""); setShowInvite(entry); }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600/15 border border-purple-600/30 text-purple-300 hover:bg-purple-600/25 rounded-xl text-xs font-bold transition-all">
                            <Send size={12} /> Invite Jockey
                          </button>
                        )}
                        {status === "Pending" && (
                          <button onClick={() => handleCancel(entry.raceId, entry.entryId)} disabled={isBusy}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-600/10 border border-red-600/20 text-red-400 hover:bg-red-600/20 rounded-xl text-xs transition-all disabled:opacity-50">
                            {isBusy ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* ── Register Modal ── */}
      {showRegister && (
        <Modal title={`Register: ${showRegister.raceName}`} onClose={() => setShowRegister(null)}>
          {formError && (
            <div className="mb-3 flex items-center gap-2 p-3 bg-red-950/50 border border-red-900/50 rounded-xl text-red-300 text-sm">
              <AlertCircle size={13} /> {formError}
            </div>
          )}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className={labelCls}>Choose Horse tham gia *</label>
              <select value={registerForm.horseId} onChange={(e) => setRegisterForm((p) => ({ ...p, horseId: e.target.value }))} required className={selectCls}>
                <option value="">-- Choose Horse --</option>
                {horses.map((h) => <option key={h.horseId} value={h.horseId}>{h.horseName}</option>)}
              </select>
              {horses.length === 0 && <p className="text-red-400 text-xs mt-1.5">You have no active horses</p>}
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowRegister(null)}
                className="flex-1 py-2.5 rounded-xl border border-sb-border text-sb-tx-3 hover:text-sb-tx text-sm transition-colors">Cancel</button>
              <button type="submit" disabled={formLoading || horses.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                {formLoading && <Loader2 size={14} className="animate-spin" />} Register
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Invite Jockey Modal ── */}
      {showInvite && (
        <Modal title="Invite Jockey" accentColor="rgb(147,51,234)" onClose={() => setShowInvite(null)}>
          <p className="text-sb-tx-3 text-sm mb-4">
            Send a jockey invitation for registration <span className="text-white font-semibold">{showInvite.raceName || `#${showInvite.raceId}`}</span>
          </p>
          {formError && (
            <div className="mb-3 flex items-center gap-2 p-3 bg-red-950/50 border border-red-900/50 rounded-xl text-red-300 text-sm">
              <AlertCircle size={13} /> {formError}
            </div>
          )}
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className={labelCls}>Select Jockey *</label>
              {/* Dropdown gửi đúng jockeyId (không phải userId) — hết lỗi "Không tìm thấy jockey" */}
              <select value={inviteForm.jockeyId}
                onChange={(e) => setInviteForm((p) => ({ ...p, jockeyId: e.target.value }))}
                required className={selectCls}>
                <option value="">-- Select Jockey --</option>
                {jockeys.map((j) => (
                  <option key={j.jockeyId} value={j.jockeyId}>
                    {j.fullName || j.username}{j.totalWins != null ? ` · ${j.totalWins} wins` : ""}
                  </option>
                ))}
              </select>
              {jockeys.length === 0 && <p className="text-sb-tx-3 text-xs mt-1">No jockeys in the system.</p>}
            </div>
            <div>
              <label className={labelCls}>Note (optional)</label>
              <textarea value={inviteForm.note} onChange={(e) => setInviteForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="e.g. Please join this weekend race..." rows={3} className={inputCls + " resize-none"} />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowInvite(null)}
                className="flex-1 py-2.5 rounded-xl border border-sb-border text-sb-tx-3 hover:text-sb-tx text-sm transition-colors">Cancel</button>
              <button type="submit" disabled={formLoading}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                {formLoading && <Loader2 size={14} className="animate-spin" />}
                <Send size={14} /> Send Invitation
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}
