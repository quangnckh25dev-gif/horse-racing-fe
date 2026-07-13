import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./landing.css";

const ROLES = [
  "Chủ ngựa",
  "Nài ngựa (Kỵ sĩ)",
  "Trọng tài",
  "Khán giả",
  "Ban tổ chức",
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [tab, setTab] = useState("login"); // 'login' | 'register'
  const [note, setNote] = useState(false);

  const openAuth = (t) => {
    setTab(t || "login");
    setNote(false);
    setAuthOpen(true);
  };
  const closeAuth = () => setAuthOpen(false);

  // Đóng modal bằng Esc
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setAuthOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    setNote(true); // demo — sẽ nối authService.login()/register() khi có BE
  };

  return (
    <div className="lp">
      {/* Nền: video ngựa thật */}
      <div className="lp-bgfallback" />
      <video className="lp-bg" autoPlay muted loop playsInline poster="/bg-horse.png">
        <source src="/horse.mp4" type="video/mp4" />
      </video>
      <div className="lp-scrim" />
      <div className="lp-grain" />

      {/* Top bar */}
      <div className="lp-topbar">
        <div className="lp-brand">
          <div className="lp-logo">🏇</div>
          <div>
            <div className="lp-bt">HORSERACING VN</div>
            <div className="lp-bs">Season 2026</div>
          </div>
        </div>
        <nav className="lp-nav">
          <button onClick={() => navigate("/races")}>Cuộc đua</button>
          <button onClick={() => openAuth("login")}>Đặt cược</button>
          <button onClick={() => navigate("/leaderboard")}>Xếp hạng</button>
          <button onClick={() => openAuth("login")}>Đăng nhập</button>
        </nav>
      </div>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-kicker">Giải đua chính thức · Mùa Hè 2026</div>
        <h1 className="lp-title">
          <span>SUMMER</span>
          <span className="lp-g">CUP 2026</span>
        </h1>
        <p className="lp-sub">
          Đường đua tốc độ, tỉ lệ cược thời gian thực, bảng xếp hạng cập nhật
          từng vòng. Chọn ngựa của bạn và bước vào cuộc đua.
        </p>
        <div className="lp-cta">
          <button className="lp-btn lp-btn-bet" onClick={() => openAuth("login")}>
            Vào sân đua →
          </button>
          <button className="lp-btn lp-btn-ghost" onClick={() => navigate("/races")}>
            Xem lịch đua
          </button>
        </div>
      </section>

      {/* Popup Đăng nhập / Đăng ký */}
      {authOpen && (
        <div className="lp-ov" onClick={(e) => e.target === e.currentTarget && closeAuth()}>
          <div className="lp-modal" role="dialog" aria-modal="true">
            <button className="lp-x" onClick={closeAuth} aria-label="Đóng">✕</button>
            <div className="lp-mlogo">🏇</div>
            <h3>{tab === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}</h3>
            <div className="lp-msub">HorseRacing VN · Mùa giải 2026</div>

            <div className="lp-mtabs">
              <button data-on={tab === "login"} onClick={() => { setTab("login"); setNote(false); }}>
                Đăng nhập
              </button>
              <button data-on={tab === "register"} onClick={() => { setTab("register"); setNote(false); }}>
                Đăng ký
              </button>
            </div>

            {note && (
              <div className="lp-mnote">Bản demo giao diện — chưa nối API thật.</div>
            )}

            {tab === "login" ? (
              <form className="lp-form" onSubmit={submit}>
                <div className="lp-field">
                  <label>Tên đăng nhập</label>
                  <input placeholder="vd: spectator1" required />
                </div>
                <div className="lp-field">
                  <label>Mật khẩu</label>
                  <input type="password" placeholder="••••••" required />
                </div>
                <div className="lp-mrow">
                  <label><input type="checkbox" /> Ghi nhớ đăng nhập</label>
                  <a>Quên mật khẩu?</a>
                </div>
                <button className="lp-mbtn" type="submit">Đăng nhập</button>
                <div className="lp-mswitch">
                  Chưa có tài khoản?{" "}
                  <a onClick={() => { setTab("register"); setNote(false); }}>Đăng ký ngay</a>
                </div>
              </form>
            ) : (
              <form className="lp-form" onSubmit={submit}>
                <div className="lp-field">
                  <label>Họ và tên</label>
                  <input placeholder="Nguyễn Văn A" required />
                </div>
                <div className="lp-frow">
                  <div className="lp-field">
                    <label>Tên đăng nhập</label>
                    <input placeholder="username" required />
                  </div>
                  <div className="lp-field">
                    <label>Số điện thoại</label>
                    <input type="tel" placeholder="09xx xxx xxx" />
                  </div>
                </div>
                <div className="lp-field">
                  <label>Email</label>
                  <input type="email" placeholder="email@gmail.com" required />
                </div>
                <div className="lp-field">
                  <label>Mật khẩu</label>
                  <input type="password" placeholder="••••••" required />
                </div>
                <div className="lp-field">
                  <label>Vai trò</label>
                  <select required defaultValue="">
                    <option value="" disabled>— Chọn vai trò —</option>
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <button className="lp-mbtn" type="submit">Tạo tài khoản</button>
                <div className="lp-mswitch">
                  Đã có tài khoản?{" "}
                  <a onClick={() => { setTab("login"); setNote(false); }}>Đăng nhập</a>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
