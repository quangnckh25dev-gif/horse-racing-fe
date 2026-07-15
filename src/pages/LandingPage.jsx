import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/auth";
import { spectatorService } from "../services/spectator";
import { leaderboardService } from "../services/leaderboard";
import "./landing.css";

// value = enum BE (GET /api/auth/register-roles)
const ROLES = [
  { value: "HorseOwner", label: "Chủ ngựa" },
  { value: "Jockey",     label: "Nài ngựa (Kỵ sĩ)" },
  { value: "Referee",    label: "Trọng tài" },
  { value: "Spectator",  label: "Khán giả" },
  { value: "Organizer",  label: "Ban tổ chức" },
];

const EMPTY_LOGIN = { username: "", password: "" };
const EMPTY_REG = { fullName: "", username: "", phone: "", email: "", password: "", role: "" };

const RACE_STATUS = {
  Scheduled:        { label: "Sắp diễn ra",  cls: "lp-b-sched" },
  RegistrationOpen: { label: "Mở đăng ký",   cls: "lp-b-open" },
  Ongoing:          { label: "Đang đua",     cls: "lp-b-live" },
  Finished:         { label: "Đã kết thúc",  cls: "lp-b-fin" },
  Cancelled:        { label: "Đã huỷ",       cls: "lp-b-fin" },
};

const fmtVND = (n) => (n == null ? null : Number(n).toLocaleString("vi-VN") + " ₫");

const HOW = [
  { ic: "📝", t: "Đăng ký tài khoản", d: "Chọn vai trò Khán giả và tạo tài khoản chỉ trong 1 phút." },
  { ic: "💰", t: "Nạp ví demo",        d: "Ví mô phỏng — nạp tiền demo để bắt đầu, không dùng tiền thật." },
  { ic: "🏇", t: "Đặt cược & xem đua", d: "Chọn kèo WIN/PLACE/SHOW/EXACT rồi xem lại đường đua khi công bố." },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // ── modals ──
  const [authOpen, setAuthOpen] = useState(false);
  const [racesOpen, setRacesOpen] = useState(false);
  const [lbOpen, setLbOpen] = useState(false);

  // ── auth form ──
  const [tab, setTab] = useState("login");
  const [note, setNote] = useState("");
  const [okNote, setOkNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN);
  const [regForm, setRegForm] = useState(EMPTY_REG);

  // ── data for popups ──
  const [races, setRaces] = useState(null);
  const [lb, setLb] = useState(null);
  const [lbTab, setLbTab] = useState("jockey");

  const clearNotes = () => { setNote(""); setOkNote(""); };
  const switchTab = (t) => { setTab(t); clearNotes(); };
  const openAuth = (t) => { setTab(t || "login"); clearNotes(); setAuthOpen(true); };

  // Đóng modal bằng Esc
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { setAuthOpen(false); setRacesOpen(false); setLbOpen(false); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const loadRaces = useCallback(async () => {
    setRacesOpen(true);
    if (races) return;
    try { const r = await spectatorService.getRaces(); setRaces(r.data || []); }
    catch { setRaces([]); }
  }, [races]);

  const loadLb = useCallback(async () => {
    setLbOpen(true);
    if (lb) return;
    try {
      const [j, h] = await Promise.all([
        leaderboardService.getGlobalJockeyLeaderboard(),
        leaderboardService.getGlobalHorseLeaderboard(),
      ]);
      setLb({ jockey: j.data || [], horse: h.data || [] });
    } catch { setLb({ jockey: [], horse: [] }); }
  }, [lb]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setBusy(true); clearNotes();
    try {
      const res = await authService.login(loginForm);
      login(res.data.user, res.data.accessToken, remember);
      navigate("/dashboard");
    } catch (err) { setNote(err.message || "Đăng nhập thất bại."); }
    finally { setBusy(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setBusy(true); clearNotes();
    try {
      await authService.register(regForm);
      setRegForm(EMPTY_REG);
      setTab("login");
      setOkNote("Đăng ký thành công! Tài khoản cần Admin duyệt trước khi đăng nhập.");
    } catch (err) { setNote(err.message || "Đăng ký thất bại."); }
    finally { setBusy(false); }
  };

  return (
    <div className="lp">

      {/* ══ HERO ══ */}
      <div className="lp-hero-wrap">
        <div className="lp-bgfallback" />
        <video className="lp-bg" autoPlay muted loop playsInline poster="/bg-horse.png">
          <source src="/horse.mp4" type="video/mp4" />
        </video>
        <div className="lp-scrim" />
        <div className="lp-grain" />

        <header className="lp-topbar">
          <div className="lp-brand">
            <div className="lp-logo">🏇</div>
            <div>
              <div className="lp-bt">HORSERACING VN</div>
              <div className="lp-bs">Season 2026</div>
            </div>
          </div>
          <nav className="lp-nav">
            <button onClick={loadRaces}>Cuộc đua</button>
            <button onClick={loadLb}>Xếp hạng</button>
            <button className="lp-nav-cta" onClick={() => openAuth("login")}>Đăng nhập</button>
          </nav>
        </header>

        <section className="lp-hero">
          <div className="lp-kicker">Giải đua chính thức · Mùa Hè 2026</div>
          <h1 className="lp-title"><span>SUMMER</span><span className="lp-g">CUP 2026</span></h1>
          <p className="lp-sub">
            Đường đua tốc độ, tỉ lệ cược thời gian thực, bảng xếp hạng cập nhật từng vòng.
            Chọn ngựa của bạn và bước vào cuộc đua.
          </p>
          <div className="lp-cta">
            <button className="lp-btn lp-btn-bet" onClick={() => openAuth("register")}>Tham gia ngay →</button>
            <button className="lp-btn lp-btn-ghost" onClick={loadRaces}>Xem lịch đua</button>
          </div>
        </section>

        <div className="lp-scrolldown" onClick={() => window.scrollTo({ top: window.innerHeight - 4, behavior: "smooth" })}>↓</div>
      </div>

      {/* ══ STATS BAND ══ */}
      <section className="lp-band">
        <div className="lp-band-inner">
          {[
            { n: "4", l: "Loại cược", s: "WIN · PLACE · SHOW · EXACT" },
            { n: "35Tr", l: "Tổng giải thưởng", s: "cho mỗi vòng đua" },
            { n: "6", l: "Vai trò", s: "trong hệ thống giải đua" },
            { n: "24/7", l: "Bảng xếp hạng", s: "cập nhật realtime" },
          ].map((x, i) => (
            <div className="lp-stat" key={i}>
              <div className="lp-stat-n">{x.n}</div>
              <div className="lp-stat-l">{x.l}</div>
              <div className="lp-stat-s">{x.s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="lp-sec">
        <div className="lp-sec-eyebrow">Bắt đầu trong 3 bước</div>
        <h2 className="lp-sec-h">Tham gia cá cược &amp; theo dõi đua</h2>
        <div className="lp-how">
          {HOW.map((s, i) => (
            <div className="lp-how-card" key={i}>
              <div className="lp-how-n">{i + 1}</div>
              <div className="lp-how-ic">{s.ic}</div>
              <div className="lp-how-t">{s.t}</div>
              <div className="lp-how-d">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA BAND ══ */}
      <section className="lp-ctaband">
        <div className="lp-ctaband-inner">
          <div>
            <h3>Sẵn sàng vào sân đua?</h3>
            <p>Tạo tài khoản Khán giả và đặt cược ngay hôm nay — hoàn toàn bằng ví demo.</p>
          </div>
          <div className="lp-ctaband-btns">
            <button className="lp-btn lp-btn-bet" onClick={() => openAuth("register")}>Đăng ký ngay</button>
            <button className="lp-btn lp-btn-ghost" onClick={loadLb}>Xem bảng xếp hạng</button>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="lp-footer">
        <div className="lp-brand">
          <div className="lp-logo" style={{ width: 28, height: 28, fontSize: 15 }}>🏇</div>
          <div><div className="lp-bt">HORSERACING VN</div><div className="lp-bs">Đồ án · Không dùng tiền thật</div></div>
        </div>
        <div className="lp-footer-links">
          <button onClick={loadRaces}>Cuộc đua</button>
          <button onClick={loadLb}>Xếp hạng</button>
          <button onClick={() => openAuth("login")}>Đăng nhập</button>
        </div>
      </footer>

      {/* ══════════ POPUP: AUTH ══════════ */}
      {authOpen && (
        <div className="lp-ov" onClick={(e) => e.target === e.currentTarget && setAuthOpen(false)}>
          <div className="lp-modal" role="dialog" aria-modal="true">
            <button className="lp-x" onClick={() => setAuthOpen(false)} aria-label="Đóng">✕</button>
            <div className="lp-mlogo">🏇</div>
            <h3>{tab === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}</h3>
            <div className="lp-msub">HorseRacing VN · Mùa giải 2026</div>

            <div className="lp-mtabs">
              <button data-on={tab === "login"} onClick={() => switchTab("login")}>Đăng nhập</button>
              <button data-on={tab === "register"} onClick={() => switchTab("register")}>Đăng ký</button>
            </div>

            {note && <div className="lp-mnote">{note}</div>}
            {okNote && <div className="lp-mnote lp-mok">{okNote}</div>}

            {tab === "login" ? (
              <form className="lp-form" onSubmit={handleLogin}>
                <div className="lp-field">
                  <label>Tên đăng nhập</label>
                  <input placeholder="vd: spectator1" required autoComplete="username"
                    value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} />
                </div>
                <div className="lp-field">
                  <label>Mật khẩu</label>
                  <input type="password" placeholder="••••••" required autoComplete="current-password"
                    value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
                </div>
                <div className="lp-mrow">
                  <label><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Ghi nhớ đăng nhập</label>
                  <a onClick={() => navigate("/forgot-password")}>Quên mật khẩu?</a>
                </div>
                <button className="lp-mbtn" type="submit" disabled={busy}>{busy ? "Đang đăng nhập…" : "Đăng nhập"}</button>
                <div className="lp-mswitch">Chưa có tài khoản? <a onClick={() => switchTab("register")}>Đăng ký ngay</a></div>
              </form>
            ) : (
              <form className="lp-form" onSubmit={handleRegister}>
                <div className="lp-field">
                  <label>Họ và tên</label>
                  <input placeholder="Nguyễn Văn A" required
                    value={regForm.fullName} onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })} />
                </div>
                <div className="lp-frow">
                  <div className="lp-field">
                    <label>Tên đăng nhập</label>
                    <input placeholder="username" required autoComplete="username"
                      value={regForm.username} onChange={(e) => setRegForm({ ...regForm, username: e.target.value })} />
                  </div>
                  <div className="lp-field">
                    <label>Số điện thoại</label>
                    <input type="tel" placeholder="09xx xxx xxx"
                      value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} />
                  </div>
                </div>
                <div className="lp-field">
                  <label>Email</label>
                  <input type="email" placeholder="email@gmail.com" required
                    value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} />
                </div>
                <div className="lp-field">
                  <label>Mật khẩu</label>
                  <input type="password" placeholder="••••••" required autoComplete="new-password"
                    value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} />
                </div>
                <div className="lp-field">
                  <label>Vai trò</label>
                  <select required value={regForm.role} onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}>
                    <option value="" disabled>— Chọn vai trò —</option>
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <button className="lp-mbtn" type="submit" disabled={busy}>{busy ? "Đang tạo tài khoản…" : "Tạo tài khoản"}</button>
                <div className="lp-mswitch">Đã có tài khoản? <a onClick={() => switchTab("login")}>Đăng nhập</a></div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ══════════ POPUP: CUỘC ĐUA ══════════ */}
      {racesOpen && (
        <div className="lp-ov" onClick={(e) => e.target === e.currentTarget && setRacesOpen(false)}>
          <div className="lp-modal lp-modal-wide" role="dialog" aria-modal="true">
            <button className="lp-x" onClick={() => setRacesOpen(false)} aria-label="Đóng">✕</button>
            <h3>Lịch thi đấu</h3>
            <div className="lp-msub">Các vòng đua trong hệ thống</div>
            <div className="lp-list">
              {races === null ? (
                <div className="lp-empty">Đang tải…</div>
              ) : races.length === 0 ? (
                <div className="lp-empty">Chưa có vòng đua nào</div>
              ) : races.map((r) => {
                const st = RACE_STATUS[r.status] || RACE_STATUS.Scheduled;
                return (
                  <div className="lp-race" key={r.raceId}>
                    <div className="lp-race-ic">🏁</div>
                    <div className="lp-race-main">
                      <div className="lp-race-name">{r.raceName}</div>
                      <div className="lp-race-meta">
                        {(r.raceDate || r.startTime) && <span>{new Date(r.raceDate || r.startTime).toLocaleString("vi-VN")}</span>}
                        {r.trackLength && <span>· {r.trackLength}m</span>}
                        {fmtVND(r.prizePool || r.prizeFirst) && <span className="lp-race-prize">· 🏆 {fmtVND(r.prizePool || r.prizeFirst)}</span>}
                      </div>
                    </div>
                    <span className={`lp-badge ${st.cls}`}>{st.label}</span>
                  </div>
                );
              })}
            </div>
            <button className="lp-mbtn" onClick={() => openAuth("register")}>Đăng ký để đặt cược</button>
          </div>
        </div>
      )}

      {/* ══════════ POPUP: XẾP HẠNG ══════════ */}
      {lbOpen && (
        <div className="lp-ov" onClick={(e) => e.target === e.currentTarget && setLbOpen(false)}>
          <div className="lp-modal lp-modal-wide" role="dialog" aria-modal="true">
            <button className="lp-x" onClick={() => setLbOpen(false)} aria-label="Đóng">✕</button>
            <h3>Bảng xếp hạng</h3>
            <div className="lp-msub">Top xuất sắc nhất mùa giải</div>
            <div className="lp-mtabs">
              <button data-on={lbTab === "jockey"} onClick={() => setLbTab("jockey")}>🏇 Nài ngựa</button>
              <button data-on={lbTab === "horse"} onClick={() => setLbTab("horse")}>🐴 Ngựa đua</button>
            </div>
            <div className="lp-list">
              {lb === null ? (
                <div className="lp-empty">Đang tải…</div>
              ) : (lb[lbTab] || []).length === 0 ? (
                <div className="lp-empty">Chưa có dữ liệu xếp hạng</div>
              ) : lb[lbTab].map((it, i) => (
                <div className="lp-lbrow" key={it.entityId ?? i}>
                  <span className="lp-lbrank">{i < 3 ? ["🥇","🥈","🥉"][i] : it.rank ?? i + 1}</span>
                  <span className="lp-lbname">{it.name ?? "—"}</span>
                  <span className="lp-lbwin">{it.totalWins ?? 0} thắng</span>
                  <span className="lp-lbpts">{it.points ?? 0}đ</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
