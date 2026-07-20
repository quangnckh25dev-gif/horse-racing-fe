// Toast tối giản thay cho window.alert (hộp trắng "localhost cho biết" rất xấu).
// Gọi trực tiếp toast(msg) hoặc để nguyên alert(...) — main.jsx đã override.

let holder = null;

function ensureHolder() {
  if (holder) return holder;
  holder = document.createElement("div");
  holder.id = "sb-toasts";
  holder.style.cssText =
    "position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:9999;" +
    "display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;max-width:92vw;";
  document.body.appendChild(holder);
  return holder;
}

export function toast(message, type) {
  // Đoán loại theo nội dung nếu không truyền: có "thành công/thanh cong" → success
  const t = type || (/thành công|thanh cong|đã |da /i.test(String(message)) ? "success" : "error");
  const colors = t === "success"
    ? "background:#0E3A2E;border:1px solid #14543F;color:#7CE7A2;"
    : "background:#301316;border:1px solid #5B2427;color:#FCA5A5;";
  const el = document.createElement("div");
  el.style.cssText =
    colors +
    "font:600 13px/1.5 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;" +
    "padding:11px 16px;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.45);" +
    "pointer-events:auto;max-width:520px;display:flex;gap:8px;align-items:flex-start;" +
    "opacity:0;transform:translateY(-8px);transition:opacity .2s,transform .2s;";
  el.innerHTML = `<span style="flex-shrink:0">${t === "success" ? "✅" : "⚠️"}</span><span>${String(message)}</span>`;
  ensureHolder().appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = "1"; el.style.transform = "translateY(0)"; });
  const ttl = Math.min(7000, 2600 + String(message).length * 30);
  setTimeout(() => {
    el.style.opacity = "0"; el.style.transform = "translateY(-8px)";
    setTimeout(() => el.remove(), 250);
  }, ttl);
}

// Ghi đè alert toàn app → mọi alert(...) hiện thành toast tối, không còn hộp trắng.
export function installToastAlert() {
  window.alert = (msg) => toast(msg);
}

// Hộp xác nhận dark thay cho window.confirm (hộp trắng OK/Cancel của trình duyệt).
// Dùng: if (!(await confirmBox("Delete cái này?"))) return;
export function confirmBox(message, { okText = "Confirm", cancelText = "Cancel", danger = false } = {}) {
  return new Promise((resolve) => {
    const ov = document.createElement("div");
    ov.style.cssText =
      "position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;" +
      "background:rgba(4,7,12,.55);padding:20px;";
    const okBg = danger ? "#DC2626" : "#10B981";
    ov.innerHTML = `
      <div style="width:100%;max-width:400px;background:#121822;border:1px solid #28323F;border-radius:16px;
        box-shadow:0 24px 64px rgba(0,0,0,.5);overflow:hidden;
        font:14px/1.55 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#EAEEF4;
        transform:translateY(10px) scale(.98);opacity:0;transition:opacity .18s,transform .18s;" data-card>
        <div style="height:3px;background:linear-gradient(90deg,${okBg},transparent)"></div>
        <div style="padding:20px 22px 6px;display:flex;gap:12px;align-items:flex-start">
          <span style="font-size:22px;flex-shrink:0">${danger ? "🗑️" : "❓"}</span>
          <p style="margin:2px 0 0;white-space:pre-wrap">${String(message)}</p>
        </div>
        <div style="display:flex;gap:10px;padding:18px 22px 20px">
          <button data-no style="flex:1;padding:10px;border-radius:11px;border:1px solid #28323F;background:transparent;
            color:#9AA7B8;font:700 13px system-ui;cursor:pointer">${cancelText}</button>
          <button data-ok style="flex:1;padding:10px;border-radius:11px;border:0;background:${okBg};
            color:#fff;font:700 13px system-ui;cursor:pointer">${okText}</button>
        </div>
      </div>`;
    const done = (val) => {
      const card = ov.querySelector("[data-card]");
      card.style.opacity = "0"; card.style.transform = "translateY(10px) scale(.98)";
      setTimeout(() => ov.remove(), 160);
      document.removeEventListener("keydown", onKey);
      resolve(val);
    };
    const onKey = (e) => { if (e.key === "Escape") done(false); if (e.key === "Enter") done(true); };
    ov.addEventListener("click", (e) => { if (e.target === ov) done(false); });
    ov.querySelector("[data-no]").onclick = () => done(false);
    ov.querySelector("[data-ok]").onclick = () => done(true);
    document.addEventListener("keydown", onKey);
    document.body.appendChild(ov);
    requestAnimationFrame(() => {
      const card = ov.querySelector("[data-card]");
      card.style.opacity = "1"; card.style.transform = "translateY(0) scale(1)";
      ov.querySelector("[data-ok]").focus();
    });
  });
}
