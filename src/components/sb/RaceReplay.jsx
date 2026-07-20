import { useEffect, useRef, useState } from "react";
import { X, Play, RotateCcw, Trophy } from "lucide-react";

const HUES = ["#4ADE9E", "#FFD873", "#7DD3FC", "#FB7185", "#C4B5FD", "#FCA5A5", "#F0ABFC", "#FDBA74"];

// Chuẩn hoá thời gian về seconds: nhận "hh:mm:ss.SSS", "mm:ss.SSS", số seconds, hoặc số.
function toSeconds(v) {
  if (v == null) return null;
  if (typeof v === "number") return v;
  // BE trả kiểu VN "00:01:07,200" → phẩy là dấu thập phân
  const s = String(v).trim().replace(",", ".");
  if (s.includes(":")) {
    const p = s.split(":").map(Number);
    if (p.some(isNaN)) return null;
    if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
    if (p.length === 2) return p[0] * 60 + p[1];
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// Chuẩn hoá 1 kết quả về { name, jockey, ft (finishTime seconds), dq }
function normalize(results) {
  const rows = (results || []).map((r, i) => {
    const dq = Boolean(r.dq || r.dnf || r.isDq || r.isDnf);
    const ft = toSeconds(r.finishTime ?? r.finalTime) ?? (65 + i * 1.5);
    return {
      name: r.horseName || r.name || `Horse #${r.horseId ?? r.entryId ?? i + 1}`,
      jockey: r.jockeyName || r.jockey || "—",
      pos: r.finishPosition ?? r.position ?? null,
      dq,
      ft,
      hue: HUES[i % HUES.length],
      lane: r.laneNumber ?? i + 1,
    };
  });
  return rows;
}

export default function RaceReplay({ raceName, results, bet, onClose }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const stateRef = useRef({ horses: [], running: false, startT: 0, finishOrder: [], maxFt: 80, scale: 8 });
  const [clock, setClock] = useState("00.00s");
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);

  const horses = normalize(results);
  const N = horses.length;

  const draw = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== W * DPR) { cv.width = W * DPR; cv.height = H * DPR; }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const st = stateRef.current;
    const font = getComputedStyle(document.body).fontFamily;

    const now = performance.now();
    const el = (now - st.startT) / 1000;
    const rt = el * st.scale;
    const lw = W < 520 ? 92 : 140, sx = lw + 14, fx = W - 44, lh = (H - 20) / N;

    ctx.clearRect(0, 0, W, H);
    // vạch đích ca-rô
    const sq = Math.max(6, lh / 5);
    for (let yy = 10; yy < H - 10; yy += sq) for (let c = 0; c < 2; c++) {
      ctx.fillStyle = ((Math.floor(yy / sq) + c) % 2 === 0) ? "#E8EEF4" : "#0B0F14";
      ctx.fillRect(fx + c * sq, yy, sq, sq);
    }

    for (let i = 0; i < N; i++) {
      const h = st.horses[i], y = 10 + lh * (i + 0.5);
      if (st.running && h.fin === null) {
        const f = Math.min(1, rt / h.ft); h.f = f;
        if (f >= 1) { h.fin = rt; st.finishOrder.push(h); }
      }
      const f = h.f, x = sx + (fx - sx) * f, size = Math.max(20, Math.min(40, lh * 0.8));
      // nền làn
      ctx.fillStyle = "rgba(255,255,255,.04)";
      ctx.fillRect(6, y - lh / 2 + 3, lw - 12, lh - 6);
      ctx.fillStyle = h.hue;
      ctx.fillRect(12, y - 8, 16, 16);
      ctx.fillStyle = "#0B0F14"; ctx.font = "800 10px " + font; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(h.lane, 20, y);
      ctx.textAlign = "left"; ctx.fillStyle = "#F1F5FA"; ctx.font = "800 12px " + font;
      ctx.fillText(h.name.length > 12 ? h.name.slice(0, 11) + "…" : h.name, 34, y);
      // ngựa (lật ngang cho chạy sang phải)
      const bob = st.running && f < 1 ? Math.sin(el * 16 + i) * 2.4 : 0;
      ctx.save(); ctx.translate(x, y + bob); ctx.scale(-1, 1);
      ctx.font = size + "px " + font; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("🐎", 0, 0); ctx.restore();
      // DQ gạch đỏ
      if (f >= 1 && h.dq) {
        ctx.strokeStyle = "#FB4E4E"; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(x - size * 0.5, y - size * 0.5); ctx.lineTo(x + size * 0.5, y + size * 0.5); ctx.stroke();
        ctx.fillStyle = "#FB4E4E"; ctx.font = "800 10px " + font; ctx.textAlign = "center";
        ctx.fillText("DQ", x, y + size * 0.72);
      }
    }
    setClock(Math.min(rt, st.maxFt).toFixed(2) + "s");
    if (st.running && st.finishOrder.length === N) { st.running = false; setDone(true); }
    rafRef.current = requestAnimationFrame(draw);
  };

  const start = () => {
    const st = stateRef.current;
    st.horses = horses.map((h) => ({ ...h, f: 0, fin: null }));
    st.maxFt = Math.max(...st.horses.map((h) => h.ft), 1);
    st.scale = st.maxFt / 9;   // ~9s replay
    st.finishOrder = [];
    st.running = true;
    st.startT = performance.now();
    setDone(false); setStarted(true);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    draw();
  };

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // bảng xếp place chính thức (theo finishPosition nếu có, else theo finalTime)
  const ranked = [...horses].sort((a, b) => {
    if (a.dq && !b.dq) return 1;
    if (!a.dq && b.dq) return -1;
    if (a.pos != null && b.pos != null) return a.pos - b.pos;
    return a.ft - b.ft;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-sb-s1 border border-sb-border shadow-2xl shadow-black/50 overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-sb-emerald to-transparent shrink-0" />
        {/* Header cố định — nút đóng luôn thấy dù nhiều ngựa */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-sb-border shrink-0">
          <div>
            <h3 className="text-sb-tx font-bold text-sm">Race Replay</h3>
            <p className="text-sb-tx-3 text-xs">{raceName || "Race replay"}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-sb-tx-3 hover:text-sb-tx hover:bg-sb-s2 transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          {/* Vé bet của người xem — vị trí ngựa + tiền wins/thua */}
          {bet && (() => {
            const r = (results || []).find((x) => x.entryId === bet.entryId);
            const pos = r ? (r.finishPosition ?? r.position) : null;
            const dq = r && (r.dq || r.dnf);
            const won = bet.status === "Won";
            const lost = bet.status === "Lost";
            const payout = bet.potentialPayout ?? (Number(bet.amount) * (bet.odds ?? 1));
            return (
              <div className={`mb-3 rounded-xl border p-3.5 flex items-center gap-3 flex-wrap ${
                won ? "bg-sb-emerald-soft border-sb-emerald-bd" : lost ? "bg-sb-lose/10 border-sb-lose/30" : "bg-sb-gold-soft border-sb-gold-bd"
              }`}>
                <span className="text-xl">🎫</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sb-tx font-bold text-sm">
                    Your Ticket: {bet.horseName || `Entry #${bet.entryId}`}
                    <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/20">
                      {bet.betTypeLabel || bet.betType}{bet.targetPosition ? ` · place ${bet.targetPosition}` : ""}
                    </span>
                  </p>
                  <p className="text-sb-tx-2 text-xs mt-0.5">
                    {dq ? "Horse disqualified (DQ/DNF)" : pos != null ? `Finished place ${pos}` : "No result yet"} ·
                    bet {Number(bet.amount).toLocaleString("vi-VN")}₫ × {bet.odds ?? "—"}
                  </p>
                </div>
                <span className={`font-mono font-extrabold text-base tabular-nums shrink-0 ${
                  won ? "text-sb-win" : lost ? "text-sb-lose" : "text-sb-gold-2"
                }`}>
                  {won ? `+${Number(payout).toLocaleString("vi-VN")}₫`
                    : lost ? `−${Number(bet.amount).toLocaleString("vi-VN")}₫`
                    : "Pending Publication"}
                </span>
              </div>
            );
          })()}

          {N === 0 ? (
            <div className="py-16 text-center text-sb-tx-3 text-sm">No results to replay.</div>
          ) : (
            <>
              <div className="relative rounded-xl border border-sb-border overflow-hidden bg-[#0A0E13]" style={{ height: "min(52vh,420px)" }}>
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                <div className="absolute top-2.5 right-3 font-mono text-sm font-extrabold text-sb-gold-2 bg-black/60 border border-sb-gold-bd rounded-lg px-2.5 py-1 tabular-nums">
                  {clock}
                </div>
                {!started && (
                  <button onClick={start}
                    className="absolute inset-0 m-auto w-fit h-fit flex items-center gap-2 px-5 py-3 rounded-xl bg-sb-emerald text-white font-bold text-sm hover:opacity-90 transition-opacity">
                    <Play size={16} /> Start Replay
                  </button>
                )}
              </div>

              {done && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2 text-sb-gold-2 font-bold text-sm">
                    <Trophy size={15} /> Official Results
                  </div>
                  <div className="rounded-xl border border-sb-border divide-y divide-sb-border overflow-hidden">
                    {ranked.map((h, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-sb-s2/40">
                        <span className="w-7 text-center font-mono font-bold text-sb-tx-3">
                          {h.dq ? "✕" : i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                        </span>
                        <span className="flex-1 text-sb-tx font-semibold text-sm">{h.name}</span>
                        <span className="text-sb-tx-3 text-xs">🏇 {h.jockey}</span>
                        <span className="font-mono text-xs text-sb-gold-2 tabular-nums">{h.dq ? "DQ" : h.ft.toFixed(2) + "s"}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={start}
                    className="mt-3 flex items-center gap-2 px-4 h-9 rounded-xl bg-sb-s2 border border-sb-border text-sb-tx-2 hover:text-sb-tx text-sm transition-colors">
                    <RotateCcw size={14} /> Replay
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
