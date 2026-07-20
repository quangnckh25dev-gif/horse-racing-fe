import { useEffect, useState } from "react";
import { X, FileText, Trophy, Loader2, Paperclip } from "lucide-react";
import { raceResultService } from "../../services/raceResult";
import { spectatorService } from "../../services/spectator";

export default function MinutesViewer({ raceId, raceName, onClose }) {
  const [minutes, setMinutes] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      const [minutesRes, resultsRes] = await Promise.all([
        raceResultService.getMinutes(raceId).catch(() => ({ data: null })),
        spectatorService.getRaceResults(raceId).catch(() => ({ data: [] })),
      ]);

      if (!alive) return;

      setMinutes(minutesRes?.data || null);
      const rows = (resultsRes?.data || [])
        .map((row) => ({ ...row, pos: row.finishPosition ?? row.position }))
        .sort((a, b) => (a.pos || 99) - (b.pos || 99));
      setResults(rows);
      setLoading(false);
    })();

    return () => { alive = false; };
  }, [raceId]);

  const infoRows = [
    ["Điều kiện thời tiết", minutes?.weatherCondition],
    ["Điều kiện đường đua", minutes?.trackCondition],
    ["Nội dung biên bản", minutes?.content],
    ["Ghi chú thêm", minutes?.notes],
  ].filter(([, value]) => value);

  const fileUrl = minutes?.minutesFileUrl || "";
  let localImg = null;
  try {
    localImg = localStorage.getItem(`minutes-img-${raceId}`)
      || (fileUrl ? localStorage.getItem(`minutes-file-${fileUrl}`) : null);
  } catch {
    localImg = null;
  }
  const imageSrc = localImg || (fileUrl.startsWith("data:image/") ? fileUrl : null);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
      onClick={(event) => event.target === event.currentTarget && onClose?.()}
    >
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-sb-s1 border border-sb-border shadow-2xl shadow-black/50 overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-sb-gold to-transparent shrink-0" />

        <div className="flex items-center justify-between px-5 py-3.5 border-b border-sb-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={16} className="text-sb-gold-2 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sb-tx font-bold text-sm truncate">Biên bản cuộc đua</h3>
              <p className="text-sb-tx-3 text-xs truncate">{raceName || `Race #${raceId}`}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-sb-tx-3 hover:text-sb-tx hover:bg-sb-s2 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-sb-gold" size={26} />
            </div>
          ) : (
            <>
              {!minutes ? (
                <p className="text-sb-tx-3 text-sm text-center py-4">
                  Chưa có biên bản cho vòng đua này.
                </p>
              ) : (
                <>
                  {infoRows.map(([label, value]) => (
                    <div key={label} className="bg-sb-s2 rounded-xl p-3.5 border border-sb-border">
                      <p className="text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
                      <p className="text-sb-tx text-sm whitespace-pre-wrap">{value}</p>
                    </div>
                  ))}

                  {imageSrc ? (
                    <div>
                      <p className="text-sb-tx-3 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                        Ảnh biên bản đã ký
                      </p>
                      <img
                        src={imageSrc}
                        alt="Biên bản ký tay"
                        className="w-full rounded-xl border border-sb-border max-h-[420px] object-contain bg-sb-s2"
                      />
                    </div>
                  ) : minutes.minutesFileUrl ? (
                    <div className="flex items-start gap-2 bg-sb-gold-soft border border-sb-gold-bd rounded-xl p-3">
                      <Paperclip size={15} className="text-sb-gold-2 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sb-gold-2 text-sm truncate">{minutes.minutesFileUrl}</p>
                        <p className="text-sb-tx-3 text-xs mt-0.5">
                          Chỉ đang có tên file demo, chưa có ảnh thật trong trình duyệt này.
                          Referee cần chọn lại ảnh rồi lưu biên bản.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              {results.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sb-gold-2 font-bold text-sm">
                    <Trophy size={14} /> Kết quả chính thức
                  </div>
                  <div className="rounded-xl border border-sb-border divide-y divide-sb-border overflow-hidden">
                    {results.map((result, index) => {
                      const dq = result.dq || result.dnf;
                      return (
                        <div key={result.resultId || index} className="flex items-center gap-3 px-4 py-2.5 bg-sb-s2/40">
                          <span className="w-7 text-center font-mono font-bold text-sb-tx-3">
                            {dq ? "x" : (result.pos ?? index + 1)}
                          </span>
                          <span className="flex-1 text-sb-tx font-semibold text-sm">
                            {result.horseName || `Ngựa #${result.horseId}`}
                          </span>
                          <span className="text-sb-tx-3 text-xs">{result.jockeyName || "-"}</span>
                          <span className="font-mono text-xs text-sb-gold-2">
                            {dq ? "DQ" : (result.finalTime || result.finishTime || "-")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
