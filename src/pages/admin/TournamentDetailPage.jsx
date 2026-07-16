import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Pencil, Trash2, Loader2, AlertCircle,
  CheckCircle2, Users, Calendar, Flag, Trophy,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { confirmBox } from "../../lib/toast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { tournamentService } from "../../services/tournament";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Draft:     { label: "Nháp",         cls: "bg-sb-s2 text-sb-tx-2 border-sb-border" },
  Open:      { label: "Mở đăng ký",   cls: "bg-sb-info/10 text-sb-info border-sb-info/30" },
  Ongoing:   { label: "Đang diễn ra", cls: "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd" },
  Finished:  { label: "Kết thúc",     cls: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd" },
  Cancelled: { label: "Đã hủy",       cls: "bg-sb-lose/10 text-sb-lose border-sb-lose/30" },
};

const RACE_STATUS_CONFIG = {
  Scheduled:        { label: "Đã lên lịch",  cls: "bg-sb-s2 text-sb-tx-2 border-sb-border" },
  RegistrationOpen: { label: "Mở ĐK ngựa",   cls: "bg-sb-info/10 text-sb-info border-sb-info/30" },
  Ongoing:          { label: "Đang diễn ra", cls: "bg-sb-gold-soft text-sb-gold-2 border-sb-gold-bd" },
  Finished:         { label: "Kết thúc",     cls: "bg-sb-emerald-soft text-sb-emerald-ink border-sb-emerald-bd" },
  Cancelled:        { label: "Đã hủy",       cls: "bg-sb-lose/10 text-sb-lose border-sb-lose/30" },
};

const STATUS_TRANSITIONS = {
  Draft:    [{ label: "Mở đăng ký",    next: "Open",     cls: "bg-sb-info/10 hover:bg-sb-info/20 border border-sb-info/30 text-sb-info" }],
  Open:     [{ label: "Bắt đầu giải",  next: "Ongoing",  cls: "bg-sb-gold-soft hover:bg-sb-gold-soft border border-sb-gold-bd text-sb-gold-2" }],
  Ongoing:  [{ label: "Kết thúc giải", next: "Finished", cls: "bg-sb-emerald-soft hover:bg-sb-emerald-soft border border-sb-emerald-bd text-sb-emerald-ink" }],
  Finished: [],
  Cancelled: [],
};

const CANCEL_STATUSES = ["Draft", "Open", "Ongoing"];
const TRACK_TYPES = ["Flat", "Jump", "Harness"];
const REF_ROLES   = ["Chief", "Assistant"];

const EMPTY_ROUND = { roundName: "", roundOrder: 1, startDate: "", endDate: "", description: "" };
const EMPTY_RACE  = {
  raceName: "", roundId: "", raceDate: "", trackLength: "",
  trackType: "Flat", maxParticipants: "", prizeFirst: "", prizeSecond: "", prizeThird: "",
  // B3: Thời gian mở/đóng cổng đăng ký ngựa và dự đoán
  registrationOpen: "", registrationClose: "",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function TournamentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tournament,   setTournament]   = useState(null);
  const [rounds,       setRounds]       = useState([]);
  const [races,        setRaces]        = useState([]);
  const [refereeList,  setRefereeList]  = useState([]);
  const [activeTab,    setActiveTab]    = useState("info");
  const [isLoading,    setIsLoading]    = useState(true);
  const [errorMsg,     setErrorMsg]     = useState("");

  // Info tab
  const [infoForm,     setInfoForm]     = useState({});
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [infoSaved,    setInfoSaved]    = useState(false);

  // Status
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // Round modal: null | { mode:"create"|"edit", id?, data:{} }
  const [roundModal,    setRoundModal]    = useState(null);
  const [isSavingRound, setIsSavingRound] = useState(false);
  const [roundFormErr,  setRoundFormErr]  = useState("");

  // Race modal: null | { mode:"create"|"edit", id?, data:{} }
  const [raceModal,    setRaceModal]    = useState(null);
  const [isSavingRace, setIsSavingRace] = useState(false);
  const [raceFormErr,  setRaceFormErr]  = useState("");

  // Referee modal: null | { raceId, raceName, assigned:[] }
  const [refModal,    setRefModal]    = useState(null);
  const [refForm,     setRefForm]     = useState({ refereeId: "", role: "Chief" });
  const [isSavingRef, setIsSavingRef] = useState(false);
  const [refErr,      setRefErr]      = useState("");

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setIsLoading(true); setErrorMsg("");
    try {
      const res = await tournamentService.getById(id);
      const t   = res.data;
      setTournament(t);
      setRounds(t.rounds || []);
      setRaces(t.races   || []);
      setInfoForm({
        tournamentName: t.tournamentName || "",
        description:    t.description   || "",
        location:       t.location      || "",
        startDate:      t.startDate?.slice(0, 10) || "",
        endDate:        t.endDate?.slice(0, 10)   || "",
        prizeFund:      t.prizeFund || "",
      });
    } catch (err) {
      setErrorMsg(err.message || "Không thể tải thông tin giải đấu.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Status ───────────────────────────────────────────────────────────────────

  const handleChangeStatus = async (newStatus) => {
    setIsChangingStatus(true);
    try {
      const res = await tournamentService.changeStatus(id, newStatus);
      setTournament(res.data);
    } catch (err) {
      setErrorMsg(err.message || "Đổi trạng thái thất bại.");
    } finally {
      setIsChangingStatus(false);
    }
  };

  // ── Info ─────────────────────────────────────────────────────────────────────

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setIsSavingInfo(true);
    try {
      const res = await tournamentService.update(id, {
        ...infoForm,
        prizeFund: Number(infoForm.prizeFund) || 0,
      });
      setTournament(res.data);
      setInfoSaved(true);
      setTimeout(() => setInfoSaved(false), 2000);
    } catch (err) {
      setErrorMsg(err.message || "Lưu thất bại.");
    } finally {
      setIsSavingInfo(false);
    }
  };

  // ── Rounds ───────────────────────────────────────────────────────────────────

  const handleSaveRound = async (e) => {
    e.preventDefault();
    if (!roundModal.data.roundName) { setRoundFormErr("Vui lòng nhập tên vòng đấu."); return; }
    setIsSavingRound(true); setRoundFormErr("");
    try {
      if (roundModal.mode === "create") {
        const res = await tournamentService.createRound(id, roundModal.data);
        setRounds((prev) =>
          [...prev, res.data].sort((a, b) => a.roundOrder - b.roundOrder)
        );
      } else {
        const res = await tournamentService.updateRound(roundModal.id, roundModal.data);
        setRounds((prev) =>
          prev.map((r) => r.roundId === roundModal.id ? res.data : r)
        );
      }
      setRoundModal(null);
    } catch (err) {
      setRoundFormErr(err.message || "Lưu thất bại.");
    } finally {
      setIsSavingRound(false);
    }
  };

  const handleDeleteRound = async (roundId) => {
    if (!(await confirmBox("Xóa vòng đấu này?", { danger: true }))) return;
    try {
      await tournamentService.deleteRound(roundId);
      setRounds((prev) => prev.filter((r) => r.roundId !== roundId));
    } catch (err) { setErrorMsg(err.message); }
  };

  // ── Races ────────────────────────────────────────────────────────────────────

  const handleSaveRace = async (e) => {
    e.preventDefault();
    if (!raceModal.data.raceName || !raceModal.data.raceDate) {
      setRaceFormErr("Vui lòng điền tên cuộc đua và ngày thi đấu."); return;
    }
    setIsSavingRace(true); setRaceFormErr("");
    try {
      const payload = {
        ...raceModal.data,
        tournamentId:      Number(id),
        roundId:           raceModal.data.roundId ? Number(raceModal.data.roundId) : null,
        trackLength:       Number(raceModal.data.trackLength)     || null,
        maxParticipants:   Number(raceModal.data.maxParticipants) || null,
        prizeFirst:        Number(raceModal.data.prizeFirst)      || 0,
        prizeSecond:       Number(raceModal.data.prizeSecond)     || 0,
        prizeThird:        Number(raceModal.data.prizeThird)      || 0,
        registrationOpen:  raceModal.data.registrationOpen  || null,
        registrationClose: raceModal.data.registrationClose || null,
      };
      if (raceModal.mode === "create") {
        const res = await tournamentService.createRace(payload);
        setRaces((prev) => [...prev, res.data]);
      } else {
        const res = await tournamentService.updateRace(raceModal.id, payload);
        setRaces((prev) =>
          prev.map((r) => r.raceId === raceModal.id ? res.data : r)
        );
      }
      setRaceModal(null);
    } catch (err) {
      setRaceFormErr(err.message || "Lưu thất bại.");
    } finally {
      setIsSavingRace(false);
    }
  };

  const handleDeleteRace = async (raceId) => {
    if (!(await confirmBox("Xóa cuộc đua này?", { danger: true }))) return;
    try {
      await tournamentService.deleteRace(raceId);
      setRaces((prev) => prev.filter((r) => r.raceId !== raceId));
    } catch (err) { setErrorMsg(err.message); }
  };

  // ── Referees ─────────────────────────────────────────────────────────────────

  const openRefModal = async (race) => {
    setRefErr(""); setRefForm({ refereeId: "", role: "Chief" });
    setRefModal({ raceId: race.raceId, raceName: race.raceName, assigned: race.referees || [] });
    if (refereeList.length === 0) {
      try {
        const res = await tournamentService.getAllReferees();
        setRefereeList(res.data || []);
      } catch { /* ignore, user can retry */ }
    }
  };

  const handleAssignRef = async (e) => {
    e.preventDefault();
    if (!refForm.refereeId) { setRefErr("Vui lòng chọn trọng tài."); return; }
    setIsSavingRef(true); setRefErr("");
    try {
      const res = await tournamentService.assignReferee(
        refModal.raceId, Number(refForm.refereeId), refForm.role
      );
      const newRef = res.data;
      setRefModal((prev) => ({ ...prev, assigned: [...prev.assigned, newRef] }));
      setRaces((prev) =>
        prev.map((r) =>
          r.raceId === refModal.raceId
            ? { ...r, referees: [...(r.referees || []), newRef] }
            : r
        )
      );
      setRefForm({ refereeId: "", role: "Chief" });
    } catch (err) { setRefErr(err.message || "Thêm thất bại."); }
    finally { setIsSavingRef(false); }
  };

  const handleRemoveRef = async (refereeId) => {
    try {
      await tournamentService.removeReferee(refModal.raceId, refereeId);
      setRefModal((prev) => ({
        ...prev,
        assigned: prev.assigned.filter((r) => r.refereeId !== refereeId),
      }));
      setRaces((prev) =>
        prev.map((r) =>
          r.raceId === refModal.raceId
            ? { ...r, referees: (r.referees || []).filter((ref) => ref.refereeId !== refereeId) }
            : r
        )
      );
    } catch (err) { setRefErr(err.message || "Xóa thất bại."); }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  if (isLoading) return (
    <AdminLayout title="Chi tiết giải đấu">
      <div className="flex justify-center py-24">
        <Loader2 size={32} className="animate-spin text-[#D4AF37]" />
      </div>
    </AdminLayout>
  );

  if (!tournament) return (
    <AdminLayout title="Chi tiết giải đấu">
      <div className="p-6 text-sb-tx-3">{errorMsg || "Không tìm thấy giải đấu."}</div>
    </AdminLayout>
  );

  const statusCfg   = STATUS_CONFIG[tournament.status]   || STATUS_CONFIG.Draft;
  const transitions = STATUS_TRANSITIONS[tournament.status] || [];
  const canCancel   = CANCEL_STATUSES.includes(tournament.status);

  const TABS = [
    { key: "info",   label: "Thông tin",    icon: Trophy },
    { key: "rounds", label: "Vòng đấu",     icon: Flag },
    { key: "races",  label: "Lịch thi đấu", icon: Calendar },
  ];

  return (
    <AdminLayout title="Chi tiết giải đấu">
      <div className="p-6 max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-start gap-3 mb-6 flex-wrap">
          <button
            onClick={() => navigate("/admin/tournaments")}
            className="text-sb-tx-3 hover:text-[#D4AF37] transition-colors mt-1 shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-sb-tx truncate">{tournament.tournamentName}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.cls}`}>
                {statusCfg.label}
              </span>
            </div>
            {tournament.location && (
              <p className="text-sb-tx-3 text-sm mt-0.5">{tournament.location}</p>
            )}
          </div>
          {/* Status transition buttons */}
          <div className="flex gap-2 shrink-0 flex-wrap">
            {transitions.map((t) => (
              <button
                key={t.next}
                onClick={() => handleChangeStatus(t.next)}
                disabled={isChangingStatus}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${t.cls}`}
              >
                {isChangingStatus ? <Loader2 size={13} className="animate-spin" /> : t.label}
              </button>
            ))}
            {canCancel && (
              <button
                onClick={() => handleChangeStatus("Cancelled")}
                disabled={isChangingStatus}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sb-lose/10 hover:bg-sb-lose/20 border border-sb-lose/30 text-sb-lose transition-all"
              >
                Hủy giải
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-sb-lose/10 border border-sb-lose/30 text-sb-lose text-sm">
            <AlertCircle size={14} className="shrink-0" /> {errorMsg}
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex border-b border-sb-border mb-6 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.key
                  ? "border-[#D4AF37] text-[#D4AF37]"
                  : "border-transparent text-sb-tx-3 hover:text-sb-tx-2"
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════
            TAB: THÔNG TIN
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "info" && (
          <form onSubmit={handleSaveInfo} className="max-w-xl space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">Tên giải đấu</Label>
              <Input
                value={infoForm.tournamentName}
                onChange={(e) => setInfoForm({ ...infoForm, tournamentName: e.target.value })}
                className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">Địa điểm</Label>
              <Input
                value={infoForm.location}
                onChange={(e) => setInfoForm({ ...infoForm, location: e.target.value })}
                className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">Ngày bắt đầu</Label>
                <Input
                  type="date" value={infoForm.startDate}
                  onChange={(e) => setInfoForm({ ...infoForm, startDate: e.target.value })}
                  className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">Ngày kết thúc</Label>
                <Input
                  type="date" value={infoForm.endDate}
                  onChange={(e) => setInfoForm({ ...infoForm, endDate: e.target.value })}
                  className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">Tổng giải thưởng (VNĐ)</Label>
              <Input
                type="number" min="0" value={infoForm.prizeFund}
                onChange={(e) => setInfoForm({ ...infoForm, prizeFund: e.target.value })}
                placeholder="0"
                className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">Mô tả</Label>
              <textarea
                value={infoForm.description}
                onChange={(e) => setInfoForm({ ...infoForm, description: e.target.value })}
                rows={3}
                className="w-full rounded-md bg-sb-s1 border border-sb-border text-sb-tx text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] resize-none placeholder:text-sb-tx-3"
              />
            </div>
            <Button
              type="submit"
              disabled={isSavingInfo}
              className="h-10 px-6 bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A] font-bold text-sm"
            >
              {isSavingInfo ? (
                <Loader2 size={15} className="animate-spin" />
              ) : infoSaved ? (
                <><CheckCircle2 size={15} className="mr-1.5" />Đã lưu</>
              ) : "Lưu thay đổi"}
            </Button>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: VÒNG ĐẤU
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "rounds" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sb-tx-3 text-sm">
                <span className="text-[#D4AF37] font-semibold">{rounds.length}</span> vòng đấu
              </p>
              <Button
                onClick={() => {
                  setRoundFormErr("");
                  setRoundModal({ mode: "create", data: { ...EMPTY_ROUND, roundOrder: rounds.length + 1 } });
                }}
                className="flex items-center gap-1.5 h-8 px-3 bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A] font-semibold text-xs"
              >
                <Plus size={14} /> Thêm vòng
              </Button>
            </div>

            {rounds.length === 0 ? (
              <div className="text-center py-16 text-sb-tx-3">
                <Flag size={40} className="mx-auto mb-3 text-sb-tx-3" />
                <p className="text-sb-tx-3">Chưa có vòng đấu nào. Thêm vòng đấu đầu tiên!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rounds.map((r) => (
                  <div
                    key={r.roundId}
                    className="flex items-center gap-4 bg-sb-s1 border border-sb-border rounded-xl p-4 shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-full bg-sb-gold-soft border border-sb-gold-bd flex items-center justify-center text-sb-gold-2 font-bold text-sm shrink-0">
                      {r.roundOrder}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sb-tx font-medium">{r.roundName}</p>
                      {(r.startDate || r.endDate) && (
                        <p className="text-sb-tx-3 text-xs mt-0.5">
                          {r.startDate?.slice(0, 10)} → {r.endDate?.slice(0, 10)}
                        </p>
                      )}
                      {r.description && (
                        <p className="text-sb-tx-3 text-xs mt-0.5 truncate">{r.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setRoundFormErr("");
                          setRoundModal({
                            mode: "edit", id: r.roundId,
                            data: {
                              roundName:   r.roundName,
                              roundOrder:  r.roundOrder,
                              startDate:   r.startDate?.slice(0, 10) || "",
                              endDate:     r.endDate?.slice(0, 10)   || "",
                              description: r.description || "",
                            },
                          });
                        }}
                        className="p-1.5 text-sb-tx-3 hover:text-sb-info hover:bg-sb-info/10 transition-colors rounded"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteRound(r.roundId)}
                        className="p-1.5 text-sb-tx-3 hover:text-sb-lose hover:bg-sb-lose/10 transition-colors rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: LỊCH THI ĐẤU
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "races" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sb-tx-3 text-sm">
                <span className="text-[#D4AF37] font-semibold">{races.length}</span> cuộc đua
              </p>
              <Button
                onClick={() => { setRaceFormErr(""); setRaceModal({ mode: "create", data: { ...EMPTY_RACE } }); }}
                className="flex items-center gap-1.5 h-8 px-3 bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A] font-semibold text-xs"
              >
                <Plus size={14} /> Thêm cuộc đua
              </Button>
            </div>

            {races.length === 0 ? (
              <div className="text-center py-16 text-sb-tx-3">
                <Calendar size={40} className="mx-auto mb-3" />
                <p>Chưa có cuộc đua nào. Thêm cuộc đua đầu tiên!</p>
              </div>
            ) : (
              <div className="rounded-xl border border-sb-border overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="bg-sb-s2 border-b border-sb-border">
                      {["Tên cuộc đua","Vòng","Ngày thi","Trạng thái","Đường đua","Trọng tài",""].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-sb-tx-3 uppercase tracking-widest">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {races.map((race, idx) => {
                      const round = rounds.find((r) => r.roundId === race.roundId);
                      return (
                        <tr
                          key={race.raceId}
                          className={`border-b border-sb-border hover:bg-sb-info/10/30 transition-colors ${
                            idx % 2 === 0 ? "bg-sb-s1" : "bg-sb-s2/50"
                          }`}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-sb-tx">{race.raceName}</td>
                          <td className="px-4 py-3 text-sm text-sb-tx-3">{round?.roundName || "—"}</td>
                          <td className="px-4 py-3 text-sm text-sb-tx-3 whitespace-nowrap">
                            {race.raceDate?.slice(0, 16).replace("T", " ")}
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              const rs = RACE_STATUS_CONFIG[race.status] || RACE_STATUS_CONFIG.Scheduled;
                              return (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${rs.cls}`}>
                                  {rs.label}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3 text-sm text-sb-tx-3">
                            {race.trackType}{race.trackLength ? ` (${race.trackLength}m)` : ""}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => openRefModal(race)}
                              className="flex items-center gap-1 text-xs text-sb-tx-3 hover:text-sb-info transition-colors"
                            >
                              <Users size={13} />
                              {race.referees?.length || 0} trọng tài
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setRaceFormErr("");
                                  setRaceModal({
                                    mode: "edit", id: race.raceId,
                                    data: {
                                      raceName:          race.raceName,
                                      roundId:           race.roundId || "",
                                      raceDate:          race.raceDate?.slice(0, 16)          || "",
                                      trackLength:       race.trackLength                     || "",
                                      trackType:         race.trackType                       || "Flat",
                                      maxParticipants:   race.maxParticipants                 || "",
                                      prizeFirst:        race.prizeFirst                      || "",
                                      prizeSecond:       race.prizeSecond                     || "",
                                      prizeThird:        race.prizeThird                      || "",
                                      registrationOpen:  race.registrationOpen?.slice(0, 16)  || "",
                                      registrationClose: race.registrationClose?.slice(0, 16) || "",
                                    },
                                  });
                                }}
                                className="p-1.5 text-sb-tx-3 hover:text-sb-info hover:bg-sb-info/10 transition-colors rounded"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteRace(race.raceId)}
                                className="p-1.5 text-sb-tx-3 hover:text-sb-lose hover:bg-sb-lose/10 transition-colors rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
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

      {/* ══ ROUND MODAL ══════════════════════════════════════════════════════════ */}
      {roundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-sb-s1 border border-sb-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-sb-border">
              <h2 className="text-base font-bold text-sb-tx">
                {roundModal.mode === "create" ? "Thêm vòng đấu" : "Sửa vòng đấu"}
              </h2>
              <button onClick={() => setRoundModal(null)} className="text-sb-tx-3 hover:text-sb-tx-2 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleSaveRound} className="p-5 space-y-3">
              {roundFormErr && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-sb-lose/10 border border-sb-lose/30 text-sb-lose text-sm">
                  <AlertCircle size={13} /> {roundFormErr}
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">Tên vòng đấu *</Label>
                <Input
                  value={roundModal.data.roundName}
                  onChange={(e) => setRoundModal((p) => ({ ...p, data: { ...p.data, roundName: e.target.value } }))}
                  placeholder="VD: Vòng loại"
                  className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">Thứ tự</Label>
                <Input
                  type="number" min="1"
                  value={roundModal.data.roundOrder}
                  onChange={(e) => setRoundModal((p) => ({ ...p, data: { ...p.data, roundOrder: e.target.value } }))}
                  className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">Từ ngày</Label>
                  <Input
                    type="date" value={roundModal.data.startDate}
                    onChange={(e) => setRoundModal((p) => ({ ...p, data: { ...p.data, startDate: e.target.value } }))}
                    className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">Đến ngày</Label>
                  <Input
                    type="date" value={roundModal.data.endDate}
                    onChange={(e) => setRoundModal((p) => ({ ...p, data: { ...p.data, endDate: e.target.value } }))}
                    className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">Mô tả</Label>
                <Input
                  value={roundModal.data.description}
                  onChange={(e) => setRoundModal((p) => ({ ...p, data: { ...p.data, description: e.target.value } }))}
                  className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setRoundModal(null)} className="flex-1 h-9 rounded-lg border border-sb-border text-sb-tx-3 hover:text-sb-tx text-sm transition-colors">Hủy</button>
                <Button type="submit" disabled={isSavingRound} className="flex-1 h-9 bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A] font-bold text-sm">
                  {isSavingRound ? <Loader2 size={14} className="animate-spin" /> : "Lưu"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ RACE MODAL ═══════════════════════════════════════════════════════════ */}
      {raceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-sb-s1 border border-sb-border rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-sb-border">
              <h2 className="text-base font-bold text-sb-tx">
                {raceModal.mode === "create" ? "Thêm cuộc đua" : "Sửa cuộc đua"}
              </h2>
              <button onClick={() => setRaceModal(null)} className="text-sb-tx-3 hover:text-sb-tx-2 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleSaveRace} className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              {raceFormErr && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-sb-lose/10 border border-sb-lose/30 text-sb-lose text-sm">
                  <AlertCircle size={13} /> {raceFormErr}
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">Tên cuộc đua *</Label>
                <Input
                  value={raceModal.data.raceName}
                  onChange={(e) => setRaceModal((p) => ({ ...p, data: { ...p.data, raceName: e.target.value } }))}
                  placeholder="VD: Race Opening"
                  className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">Vòng đấu</Label>
                  <select
                    value={raceModal.data.roundId}
                    onChange={(e) => setRaceModal((p) => ({ ...p, data: { ...p.data, roundId: e.target.value } }))}
                    className="w-full h-10 rounded-md bg-sb-s1 border border-sb-border text-sb-tx text-sm px-3 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                  >
                    <option value="">— Không gắn vòng —</option>
                    {rounds.map((r) => <option key={r.roundId} value={r.roundId}>{r.roundName}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">Ngày thi đấu *</Label>
                  <Input
                    type="datetime-local"
                    value={raceModal.data.raceDate}
                    onChange={(e) => setRaceModal((p) => ({ ...p, data: { ...p.data, raceDate: e.target.value } }))}
                    className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">Loại đường đua</Label>
                  <select
                    value={raceModal.data.trackType}
                    onChange={(e) => setRaceModal((p) => ({ ...p, data: { ...p.data, trackType: e.target.value } }))}
                    className="w-full h-10 rounded-md bg-sb-s1 border border-sb-border text-sb-tx text-sm px-3 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                  >
                    {TRACK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">Chiều dài (m)</Label>
                  <Input
                    type="number" min="0"
                    value={raceModal.data.trackLength}
                    onChange={(e) => setRaceModal((p) => ({ ...p, data: { ...p.data, trackLength: e.target.value } }))}
                    placeholder="VD: 1200"
                    className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">Số ngựa tối đa</Label>
                <Input
                  type="number" min="1"
                  value={raceModal.data.maxParticipants}
                  onChange={(e) => setRaceModal((p) => ({ ...p, data: { ...p.data, maxParticipants: e.target.value } }))}
                  placeholder="VD: 10"
                  className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[["prizeFirst","Giải 1 (VNĐ)"],["prizeSecond","Giải 2 (VNĐ)"],["prizeThird","Giải 3 (VNĐ)"]].map(([field, lbl]) => (
                  <div key={field} className="space-y-1.5">
                    <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">{lbl}</Label>
                    <Input
                      type="number" min="0"
                      value={raceModal.data[field]}
                      onChange={(e) => setRaceModal((p) => ({ ...p, data: { ...p.data, [field]: e.target.value } }))}
                      placeholder="0"
                      className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
                    />
                  </div>
                ))}
              </div>

              {/* B3: Thời gian mở / đóng cổng đăng ký */}
              <div className="rounded-lg border border-sb-gold-bd bg-sb-gold-soft p-3 space-y-3">
                <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-widest">
                  Cổng đăng ký ngựa &amp; dự đoán (B3)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">Mở cổng lúc</Label>
                    <Input
                      type="datetime-local"
                      value={raceModal.data.registrationOpen}
                      onChange={(e) => setRaceModal((p) => ({ ...p, data: { ...p.data, registrationOpen: e.target.value } }))}
                      className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">Đóng cổng lúc</Label>
                    <Input
                      type="datetime-local"
                      value={raceModal.data.registrationClose}
                      onChange={(e) => setRaceModal((p) => ({ ...p, data: { ...p.data, registrationClose: e.target.value } }))}
                      className="h-10 bg-sb-s1 border-sb-border text-sb-tx focus-visible:ring-sb-gold focus-visible:border-[#D4AF37]"
                    />
                  </div>
                </div>
                <p className="text-sb-tx-3 text-xs">Khi đến giờ mở, hệ thống tự chuyển status → RegistrationOpen (B5)</p>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setRaceModal(null)} className="flex-1 h-9 rounded-lg border border-sb-border text-sb-tx-3 hover:text-sb-tx text-sm transition-colors">Hủy</button>
                <Button type="submit" disabled={isSavingRace} className="flex-1 h-9 bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A] font-bold text-sm">
                  {isSavingRace ? <Loader2 size={14} className="animate-spin" /> : "Lưu"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ REFEREE MODAL ════════════════════════════════════════════════════════ */}
      {refModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-sb-s1 border border-sb-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-sb-border">
              <div>
                <h2 className="text-base font-bold text-sb-tx">Phân công trọng tài</h2>
                <p className="text-sb-tx-3 text-xs mt-0.5">{refModal.raceName}</p>
              </div>
              <button onClick={() => setRefModal(null)} className="text-sb-tx-3 hover:text-sb-tx-2 text-2xl leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Danh sách đã phân công */}
              <div className="space-y-2">
                <p className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest">
                  Đã phân công ({refModal.assigned.length})
                </p>
                {refModal.assigned.length === 0 ? (
                  <p className="text-sb-tx-3 text-sm">Chưa có trọng tài nào.</p>
                ) : (
                  refModal.assigned.map((ref) => (
                    <div key={ref.refereeId} className="flex items-center justify-between bg-sb-s2 border border-sb-border rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sb-tx text-sm font-medium">{ref.fullName || ref.refereeName}</p>
                        <p className="text-sb-tx-3 text-xs">{ref.role}</p>
                      </div>
                      <button onClick={() => handleRemoveRef(ref.refereeId)} className="text-sb-tx-3 hover:text-sb-lose transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Form thêm trọng tài */}
              <div className="border-t border-sb-border pt-4">
                <p className="text-sb-tx-3 text-xs font-semibold uppercase tracking-widest mb-3">Thêm trọng tài</p>
                {refErr && (
                  <div className="mb-3 flex items-center gap-2 p-2.5 rounded-lg bg-sb-lose/10 border border-sb-lose/30 text-sb-lose text-sm">
                    <AlertCircle size={13} /> {refErr}
                  </div>
                )}
                <form onSubmit={handleAssignRef} className="flex gap-2">
                  <select
                    value={refForm.refereeId}
                    onChange={(e) => setRefForm({ ...refForm, refereeId: e.target.value })}
                    className="flex-1 h-9 rounded-md bg-sb-s1 border border-sb-border text-sb-tx text-sm px-3 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                  >
                    <option value="">Chọn trọng tài...</option>
                    {refereeList
                      .filter((r) => !refModal.assigned.some((a) => a.refereeId === r.refereeId))
                      .map((r) => (
                        <option key={r.refereeId} value={r.refereeId}>
                          {r.fullName || r.badgeNumber}
                        </option>
                      ))
                    }
                  </select>
                  <select
                    value={refForm.role}
                    onChange={(e) => setRefForm({ ...refForm, role: e.target.value })}
                    className="w-28 h-9 rounded-md bg-sb-s1 border border-sb-border text-sb-tx text-sm px-2 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                  >
                    {REF_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <Button type="submit" disabled={isSavingRef} className="h-9 px-3 bg-[#D4AF37] hover:bg-[#b0902c] text-[#0A0E1A] font-bold">
                    {isSavingRef ? <Loader2 size={14} className="animate-spin" /> : <Plus size={16} />}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
