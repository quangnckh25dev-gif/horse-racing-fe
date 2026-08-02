import { X, ExternalLink } from "lucide-react";
import { uploadService } from "../services/upload";

const isPdf = (u) => /\.pdf(\?.*)?$/i.test(String(u || ""));

/**
 * Xem truoc file (anh/PDF) NGAY TRONG web, khong mo tab ngoai.
 * @param {string} url        evidenceUrl/certificate thô (se duoc normalizeUploadUrl)
 * @param {string} title      tieu de modal
 * @param {string} subtitle   ngay kham / trang thai (tuy chon)
 * @param {()=>void} onClose
 */
export default function FilePreviewModal({ url, title = "Preview", subtitle, onClose }) {
  const src = uploadService.normalizeUploadUrl(url);
  if (!src) return null;
  const pdf = isPdf(src);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      role="dialog" aria-modal="true"
    >
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden rounded-2xl bg-sb-s1 border border-sb-border shadow-2xl">
        {/* Header dinh */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-sb-border shrink-0">
          <div className="min-w-0">
            <h3 className="text-sb-tx font-bold truncate">{title}</h3>
            {subtitle && <p className="text-sb-tx-3 text-xs mt-0.5 truncate">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href={src} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-sb-border text-sb-tx-3 hover:text-sb-tx text-xs transition-colors">
              <ExternalLink size={13} /> Open in new tab
            </a>
            <button onClick={onClose} aria-label="Close"
              className="p-1.5 rounded-lg text-sb-tx-3 hover:text-sb-tx hover:bg-sb-s2 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
        {/* Body cuon */}
        <div className="p-3 overflow-auto min-h-0 bg-black/30 flex items-center justify-center">
          {pdf ? (
            <iframe title="file preview" src={src} className="w-full h-[76vh] rounded-lg bg-white" />
          ) : (
            <img src={src} alt="preview" className="max-w-full max-h-[80vh] rounded-lg object-contain" />
          )}
        </div>
      </div>
    </div>
  );
}
