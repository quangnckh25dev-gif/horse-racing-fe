import { useState, useEffect, useCallback } from "react";
import {
  AlertCircle, Loader2, Trophy, Calendar, X, Plus,
  RefreshCw, CheckCircle2, Clock, XCircle, Send,
  Flag, ClipboardList, Activity, FileWarning,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { confirmBox } from "../../lib/toast";
import { entryService } from "../../services/entry";
import { horseService } from "../../services/horse";
import { spectatorService } from "../../services/spectator";
import { invitationService } from "../../services/invitation";
import { complaintService } from "../../services/complaint";

// Status Ä‘áº§y Ä‘á»§ theo flow: Pending Organizer Approval â†’ Approved/waiting for jockey â†’ Ready to Race
const ENTRY_STATUS = {
  Pending:  { label: "Pending Organizer Approval",       color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40", borderCls: "border-l-gold-glow",  icon: Clock },
  Approved: { label: "Approved Â· waiting for jockey", color: "bg-blue-500/20 text-blue-300 border-blue-500/40",     borderCls: "border-l-blue-glow",  icon: CheckCircle2 },
  Ready:    { label: "Ready to Race",   color: "bg-green-500/20 text-green-300 border-green-500/40",   borderCls: "border-l-green-glow", icon: CheckCircle2 },
  Rejected: { label: "Rejected",              color: "bg-red-500/20 text-red-300 border-red-500/40",         borderCls: "border-l-red-glow",   icon: XCircle },
  Withdrawn:{ label: "Withdrawn",               color: "bg-sb-s2 text-sb-tx-3 border-sb-border",               borderCls: "",                    icon: XCircle },
};

// BE tráº£ registrationStatus; entry Approved + Ä‘Ã£ cÃ³ jockey xÃ¡c nháº­n = ready to race
const entryStatusOf = (e) => {
  const raw = e.registrationStatus || e.status || "Pending";
  if (raw === "Approved" && (e.jockeyConfirmed || e.jockeyName)) return "Ready";
  return raw;
};

const activeHorse = (horse) => {
  const status = String(horse.status || horse.healthStatus || "").toLowerCase();
  return horse.active !== false && status !== "inactive" && status !== "injured";
};

const raceMaxSlots = (race) => race.maxParticipants || race.maxEntries || race.maxHorses || 0;
const jockeyLabel = (j) => j.fullName || j.username || `Jockey #${j.jockeyId}`;
const jockeyWinRate = (j) => {
  const races = Number(j.totalRaces || 0);
  if (!races) return "0%";
  return `${Math.round((Number(j.totalWins || 0) / races) * 100)}%`;
};

const selectCls = "w-full bg-[#070B14] border border-sb-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/60 transition-all";
const inputCls  = "w-full bg-[#070B14] border border-sb-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/60 transition-all";
const labelCls  = "block text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-1.5";

const COMPLAINT_STATUS = {
  Pending: { label: "Pending Referee Review", cls: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" },
  Resolved: { label: "Resolved", cls: "bg-green-500/20 text-green-300 border-green-500/40" },
  Rejected: { label: "Rejected", cls: "bg-red-500/20 text-red-300 border-red-500/40" },
  Forwarded: { label: "Forwarded to Organizer", cls: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
};

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
  const [inviteForm, setInviteForm]     = useState({ jockeyId: "", dealAmount: "", note: "" });
  const [formLoading, setFormLoading]   = useState(false);
  const [formError, setFormError]       = useState("");
  const [activeTab, setActiveTab]       = useState("upcoming");
  const [actionLoading, setActionLoading] = useState("");
  const [entryFilter, setEntryFilter] = useState("all");
  const [raceSlots, setRaceSlots] = useState({});
  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [showComplaint, setShowComplaint] = useState(null);
  const [complaintForm, setComplaintForm] = useState({ reason: "", evidenceUrl: "" });

  const [jockeys, setJockeys] = useState([]);

  const loadRaces = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [racesRes, horsesRes, jockeysRes] = await Promise.all([
        spectatorService.getRaces(),
        horseService.getMyHorses(),
        entryService.getJockeys().catch(() => ({ data: [] })),
      ]);
      const openRaces = (racesRes.data || []).filter((r) => r.status === "RegistrationOpen");
      setRaces(racesRes.data || []);
      // Horse Ä‘ang active (BE tráº£ active/statusLabel, khÃ´ng cÃ³ field status)
      setHorses((horsesRes.data || []).filter(activeHorse));
      setJockeys(jockeysRes.data || []);

      const slotPairs = await Promise.all(openRaces.map((race) =>
        spectatorService.getRaceEntries(race.raceId)
          .then((res) => [race.raceId, (res.data || []).filter((e) => !["Rejected", "Withdrawn"].includes(entryStatusOf(e))).length])
          .catch(() => [race.raceId, 0])
      ));
      setRaceSlots(Object.fromEntries(slotPairs));
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

  const loadComplaints = useCallback(async () => {
    setComplaintsLoading(true);
    try {
      const res = await complaintService.getMyRaceComplaints();
      setComplaints(res.data || []);
    } catch {
      setComplaints([]);
    } finally {
      setComplaintsLoading(false);
    }
  }, []);

  useEffect(() => { loadRaces(); }, [loadRaces]);
  useEffect(() => { if (activeTab === "entries") loadMyEntries(); }, [activeTab, loadMyEntries]);
  useEffect(() => { if (activeTab === "complaints") loadComplaints(); }, [activeTab, loadComplaints]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerForm.horseId) { setFormError("Please select a horse"); return; }
    setFormLoading(true); setFormError("");
    try {
      await entryService.registerForRace(showRegister.raceId, { horseId: Number(registerForm.horseId) });
      setShowRegister(null);
      setRegisterForm({ horseId: "" });
      // Chuyá»ƒn sang tab "My Registrations" Ä‘á»ƒ tháº¥y ngay registrations má»›i (tráº¡ng thÃ¡i Pending Organizer Approval)
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
    const dealAmount = Number(String(inviteForm.dealAmount).replace(/,/g, ""));
    if (!Number.isFinite(dealAmount) || dealAmount <= 0) { setFormError("Deal amount must be greater than 0"); return; }
    setFormLoading(true); setFormError("");
    try {
      // BE cáº§n jockeyId (sá»‘) + message
      await invitationService.sendInvitation(showInvite.entryId, {
        jockeyId: Number(inviteForm.jockeyId),
        dealAmount,
        message: inviteForm.note?.trim() || undefined,
      });
      setShowInvite(null);
      setInviteForm({ jockeyId: "", dealAmount: "", note: "" });
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

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (!complaintForm.reason.trim()) { setFormError("Reason is required"); return; }
    setFormLoading(true); setFormError("");
    try {
      await complaintService.createRaceComplaint({
        raceId: showComplaint.raceId,
        entryId: showComplaint.entryId,
        reason: complaintForm.reason.trim(),
        evidenceUrl: complaintForm.evidenceUrl.trim() || undefined,
      });
      setShowComplaint(null);
      setComplaintForm({ reason: "", evidenceUrl: "" });
      setActiveTab("complaints");
      loadComplaints();
    } catch (err) {
      setFormError(err.message || "Failed to submit race complaint");
    } finally {
      setFormLoading(false);
    }
  };

  const raceOfEntry = (entry) => races.find((race) => Number(race.raceId) === Number(entry.raceId));
  const canComplainEntry = (entry) => raceOfEntry(entry)?.status === "Finished";

  const upcomingRaces = races.filter((r) => r.status === "RegistrationOpen");
  const pendingEntries  = myEntries.filter((e) => entryStatusOf(e) === "Pending").length;
  const approvedEntries = myEntries.filter((e) => entryStatusOf(e) === "Approved").length;
  const readyEntries    = myEntries.filter((e) => entryStatusOf(e) === "Ready").length;
  const filteredEntries = myEntries.filter((entry) => entryFilter === "all" || entryStatusOf(entry) === entryFilter);
  const entryFilterLabel = {
    all: "All",
    Pending: "Pending Approval",
    Approved: "Approved Without Jockey",
    Ready: "Ready With Jockey",
  }[entryFilter];

  return (
    <AdminLayout title="Race Registration">

      {/* â”€â”€ Page Header Banner â”€â”€ */}
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
              {complaints.length > 0 && <span className="stat-pill text-purple-300">{complaints.length} complaints</span>}
            </div>
          </div>
          <button onClick={loadRaces}
            className="flex items-center gap-2 px-3 py-2 bg-sb-s2 border border-sb-border rounded-xl text-sb-tx-3 hover:text-sb-tx text-sm transition-all shrink-0">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* â”€â”€ Tab bar â”€â”€ */}
        <div className="flex gap-1 bg-sb-s2 p-1 rounded-xl border border-sb-border w-fit">
          {[
            { id: "upcoming", label: "Races upcoming", icon: Flag },
            { id: "entries",  label: "My Registrations",  icon: ClipboardList },
            { id: "complaints", label: "Race Complaints", icon: FileWarning },
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

        {/* â”€â”€ Error â”€â”€ */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-300 text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* â”€â”€ Tab: Upcoming Races â”€â”€ */}
        {activeTab === "upcoming" ? (
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
              {upcomingRaces.map((race, idx) => {
                const currentSlots = raceSlots[race.raceId] ?? 0;
                const maxSlots = raceMaxSlots(race);
                const full = maxSlots > 0 && currentSlots >= maxSlots;
                return (
                <div key={race.raceId}
                  className="group bg-[#0d1117] border border-sb-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 card-hover border-l-blue-glow animate-fade-in-up"
                  style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Flag size={17} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                      <h3 className="text-white font-bold">{race.raceName}</h3>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-purple-500/20 text-purple-300 border-purple-500/40">Registration Open</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {(race.raceDate || race.startTime) && (
                        <span className="flex items-center gap-1 text-sb-tx-3 text-xs">
                          <Calendar size={10} /> {new Date(race.raceDate || race.startTime).toLocaleString("vi-VN")}
                        </span>
                      )}
                      {race.trackType && <span className="stat-pill"><Activity size={10} /> {race.trackType}</span>}
                      {maxSlots > 0 && <span className={`stat-pill ${full ? "text-red-300" : "text-green-300"}`}>{currentSlots} / {maxSlots} slots</span>}
                      {(race.trackLength || race.distance) && <span className="stat-pill">ðŸ“ {race.trackLength || race.distance}m</span>}
                      {(race.prizePool || race.prizeFirst) && <span className="text-xs font-bold text-[#D4AF37] neon-gold">ðŸ’° {Number(race.prizePool || race.prizeFirst).toLocaleString("vi-VN")} VND</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => { setRegisterForm({ horseId: "" }); setFormError(""); setShowRegister(race); }}
                    disabled={horses.length === 0 || full}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c49b2e] text-[#0A0E1A] font-bold rounded-xl text-sm transition-colors disabled:opacity-40 shrink-0 btn-gold-glow">
                    <Plus size={14} /> {full ? "Full" : "Register"}
                  </button>
                </div>
                );
              })}
            </div>
          )
        ) : null}

        {/* â”€â”€ Tab: My Entries â”€â”€ */}
        {activeTab === "entries" && (
          <>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "all", label: "All", count: myEntries.length },
              { key: "Pending", label: "Pending Approval", count: pendingEntries },
              { key: "Approved", label: "Approved Without Jockey", count: approvedEntries },
              { key: "Ready", label: "Ready With Jockey", count: readyEntries },
            ].map((item) => (
              <button key={item.key} onClick={() => setEntryFilter(item.key)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  entryFilter === item.key
                    ? "bg-[#D4AF37] text-[#0A0E1A] border-[#D4AF37]"
                    : "bg-sb-s2 text-sb-tx-3 border-sb-border hover:text-sb-tx"
                }`}>
                {item.label} <span className="opacity-70">({item.count})</span>
              </button>
            ))}
          </div>

          {entriesLoading ? (
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
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-sb-s2 border border-sb-border flex items-center justify-center mb-4">
                <ClipboardList size={24} className="text-sb-tx-2" />
              </div>
              <p className="text-white font-semibold mb-1">No {entryFilterLabel.toLowerCase()} registrations</p>
              <p className="text-sb-tx-3 text-sm">Registrations matching this filter will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry, idx) => {
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
                          {entry.horseName  && <span className="stat-pill">ðŸ´ {entry.horseName}</span>}
                          {entry.jockeyName
                            ? <span className="stat-pill text-green-400">ðŸ‡ {entry.jockeyName} {entry.jockeyConfirmed ? "âœ“" : ""}</span>
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
                            onClick={() => { setInviteForm({ jockeyId: "", dealAmount: "", note: "" }); setFormError(""); setShowInvite(entry); }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600/15 border border-purple-600/30 text-purple-300 hover:bg-purple-600/25 rounded-xl text-xs font-bold transition-all">
                            <Send size={12} /> Invite Jockey
                          </button>
                        )}
                        {canComplainEntry(entry) && (
                          <button
                            onClick={() => {
                              setComplaintForm({ reason: "", evidenceUrl: "" });
                              setFormError("");
                              setShowComplaint(entry);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-orange-600/15 border border-orange-600/30 text-orange-300 hover:bg-orange-600/25 rounded-xl text-xs font-bold transition-all">
                            <FileWarning size={12} /> Complaint
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
          )}
          </>
        )}

        {activeTab === "complaints" && (
          complaintsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-24 shimmer rounded-xl" style={{ animationDelay: `${i * 70}ms` }} />)}
            </div>
          ) : complaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-center mb-4">
                <FileWarning size={24} className="text-orange-400/40" />
              </div>
              <p className="text-white font-semibold mb-1">No race complaints</p>
              <p className="text-sb-tx-3 text-sm">Complaints submitted after finished races will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((item, idx) => {
                const cfg = COMPLAINT_STATUS[item.status] || COMPLAINT_STATUS.Pending;
                return (
                  <div key={item.complaintId}
                    className="bg-[#0d1117] border border-sb-border rounded-xl p-5 animate-fade-in-up"
                    style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                        <FileWarning size={17} className="text-orange-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <h3 className="text-white font-bold">{item.raceName || `Race #${item.raceId}`}</h3>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.cls}`}>{cfg.label}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-xs text-sb-tx-3">
                          <span className="stat-pill">{item.horseName || `Entry #${item.entryId}`}</span>
                          {item.createdAt && <span>{new Date(item.createdAt).toLocaleString("vi-VN")}</span>}
                        </div>
                        <p className="mt-3 text-sm text-sb-tx-2">{item.reason}</p>
                        {item.evidenceUrl && (
                          <a href={item.evidenceUrl} target="_blank" rel="noreferrer"
                            className="mt-2 inline-flex text-xs font-semibold text-[#D4AF37] hover:underline">
                            View evidence
                          </a>
                        )}
                        {item.refereeNote && <p className="mt-2 text-xs text-blue-300">Referee note: {item.refereeNote}</p>}
                        {item.organizerNote && <p className="mt-1 text-xs text-purple-300">Organizer note: {item.organizerNote}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* â”€â”€ Register Modal â”€â”€ */}
      {showRegister && (
        <Modal title={`Register: ${showRegister.raceName}`} onClose={() => setShowRegister(null)}>
          {formError && (
            <div className="mb-3 flex items-center gap-2 p-3 bg-red-950/50 border border-red-900/50 rounded-xl text-red-300 text-sm">
              <AlertCircle size={13} /> {formError}
            </div>
          )}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className={labelCls}>Choose Horse *</label>
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

      {/* â”€â”€ Invite Jockey Modal â”€â”€ */}
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
              {/* Dropdown gá»­i Ä‘Ãºng jockeyId (khÃ´ng pháº£i userId) â€” háº¿t lá»—i "KhÃ´ng tÃ¬m tháº¥y jockey" */}
              <select value={inviteForm.jockeyId}
                onChange={(e) => setInviteForm((p) => ({ ...p, jockeyId: e.target.value }))}
                required className={selectCls}>
                <option value="">Choose a jockey</option>
                {jockeys.map((j) => (
                  <option key={j.jockeyId} value={j.jockeyId}>
                    {jockeyLabel(j)}{j.totalWins != null ? ` · ${j.totalWins} wins` : ""}
                  </option>
                ))}
              </select>
              {jockeys.length === 0 && <p className="text-sb-tx-3 text-xs mt-1">No jockeys in the system.</p>}
            </div>
            {inviteForm.jockeyId && (() => {
              const selected = jockeys.find((j) => String(j.jockeyId) === String(inviteForm.jockeyId));
              if (!selected) return null;
              return (
                <div className="grid grid-cols-4 gap-2 rounded-xl border border-purple-500/20 bg-purple-500/10 p-3">
                  {[
                    ["Races", selected.totalRaces ?? 0],
                    ["Wins", selected.totalWins ?? 0],
                    ["Losses", selected.totalLosses ?? Math.max(Number(selected.totalRaces || 0) - Number(selected.totalWins || 0), 0)],
                    ["Win Rate", jockeyWinRate(selected)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-sb-tx-3 text-[10px] uppercase font-bold">{label}</p>
                      <p className="text-white text-sm font-black tabular-nums">{value}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div>
              <label className={labelCls}>Deal Amount *</label>
              <input
                value={inviteForm.dealAmount}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^\d]/g, "");
                  setInviteForm((p) => ({ ...p, dealAmount: digits ? Number(digits).toLocaleString("vi-VN") : "" }));
                }}
                placeholder="1,000,000"
                className={inputCls}
              />
              <p className="text-sb-tx-3 text-xs mt-1">This amount is paid when the jockey accepts.</p>
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

      {showComplaint && (
        <Modal title="Submit Race Complaint" accentColor="rgb(249,115,22)" onClose={() => setShowComplaint(null)}>
          <p className="text-sb-tx-3 text-sm mb-4">
            Complaint for <span className="text-white font-semibold">{showComplaint.raceName || `Race #${showComplaint.raceId}`}</span>
            {showComplaint.horseName ? ` - ${showComplaint.horseName}` : ""}
          </p>
          {formError && (
            <div className="mb-3 flex items-center gap-2 p-3 bg-red-950/50 border border-red-900/50 rounded-xl text-red-300 text-sm">
              <AlertCircle size={13} /> {formError}
            </div>
          )}
          <form onSubmit={handleCreateComplaint} className="space-y-4">
            <div>
              <label className={labelCls}>Reason *</label>
              <textarea
                value={complaintForm.reason}
                onChange={(e) => setComplaintForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Explain why you disagree with the race result..."
                rows={4}
                className={inputCls + " resize-none"}
              />
            </div>
            <div>
              <label className={labelCls}>Evidence URL</label>
              <input
                value={complaintForm.evidenceUrl}
                onChange={(e) => setComplaintForm((p) => ({ ...p, evidenceUrl: e.target.value }))}
                placeholder="https://..."
                className={inputCls}
              />
              <p className="text-sb-tx-3 text-xs mt-1">Attach an image or file link if available.</p>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowComplaint(null)}
                className="flex-1 py-2.5 rounded-xl border border-sb-border text-sb-tx-3 hover:text-sb-tx text-sm transition-colors">Cancel</button>
              <button type="submit" disabled={formLoading}
                className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                {formLoading && <Loader2 size={14} className="animate-spin" />}
                Submit
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}

