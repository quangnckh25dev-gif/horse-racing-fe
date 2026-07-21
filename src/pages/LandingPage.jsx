import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/auth";
import { spectatorService } from "../services/spectator";
import { leaderboardService } from "../services/leaderboard";
import "./landing.css";

// value = enum BE (GET /api/auth/register-roles)
const ROLES = [
  { value: "HorseOwner", label: "Horse Owner" },
  { value: "Jockey",     label: "Jockey (Jockey)" },
  { value: "Referee",    label: "Referee" },
  { value: "Spectator",  label: "Spectator" },
  { value: "Organizer",  label: "Organizer" },
];

const EMPTY_LOGIN = { username: "", password: "" };
const EMPTY_REG = { fullName: "", username: "", phone: "", email: "", password: "", role: "" };

const RACE_STATUS = {
  Scheduled:        { label: "Scheduled",  cls: "lp-b-sched" },
  RegistrationOpen: { label: "Registration Open",   cls: "lp-b-open" },
  Ongoing:          { label: "Live",     cls: "lp-b-live" },
  Finished:         { label: "Finished",  cls: "lp-b-fin" },
  Cancelled:        { label: "Cancelled",       cls: "lp-b-fin" },
};

const fmtVND = (n) => (n == null ? null : Number(n).toLocaleString("vi-VN") + " ₫");

const HOW = [
  { ic: "📝", t: "Create Account", d: "Select the Spectator role and create an account in one minute." },
  { ic: "💰", t: "Top Up Demo Wallet",        d: "Demo wallet only. Add demo funds to get started; no real money is used." },
  { ic: "🏇", t: "Bet and Watch Races", d: "Choose WIN/PLACE/SHOW/EXACT bets and replay the race after publication." },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  // ── modals ──
  const [authOpen, setAuthOpen] = useState(false);

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

  // Close modal bằng Esc
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setAuthOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Race Calendar + BXH hiện thẳng trên trang chủ (đồng bộ với /races) → tải ngay khi vào
  useEffect(() => {
    let alive = true;
    spectatorService.getRaces()
      .then((r) => { if (alive) setRaces(r.data || []); })
      .catch(() => { if (alive) setRaces([]); });
    Promise.all([
      leaderboardService.getGlobalJockeyLeaderboard(),
      leaderboardService.getGlobalHorseLeaderboard(),
    ])
      .then(([j, h]) => { if (alive) setLb({ jockey: j.data || [], horse: h.data || [] }); })
      .catch(() => { if (alive) setLb({ jockey: [], horse: [] }); });
    return () => { alive = false; };
  }, []);

  const scrollTo = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setBusy(true); clearNotes();
    try {
      const res = await authService.login(loginForm);
      login(res.data.user, res.data.accessToken, remember);
      navigate("/dashboard");
    } catch (err) { setNote(err.message || "Login failed."); }
    finally { setBusy(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setBusy(true); clearNotes();
    try {
      // BE đọc roleName (không phải role) → tránh mặc định Spectator
      const { role, ...rest } = regForm;
      await authService.register({ ...rest, roleName: role });
      setRegForm(EMPTY_REG);
      setTab("login");
      setOkNote("Registration successful! Your account needs Admin approval before login.");
    } catch (err) { setNote(err.message || "Registration failed."); }
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
            <button onClick={() => scrollTo("lp-races")}>Races</button>
            <button onClick={() => scrollTo("lp-lb")}>Rankings</button>
            {user ? (
              <button className="lp-nav-cta" onClick={() => navigate("/dashboard")}>Go to Dashboard</button>
            ) : (
              <button className="lp-nav-cta" onClick={() => openAuth("login")}>Login</button>
            )}
          </nav>
        </header>

        <section className="lp-hero">
          <div className="lp-kicker">Official Racing League - Summer 2026</div>
          <h1 className="lp-title"><span>SUMMER</span><span className="lp-g">CUP 2026</span></h1>
          <p className="lp-sub">
            Fast tracks, real-time odds, and rankings updated every round.
            Pick your horse and enter the race.
          </p>
          <div className="lp-cta">
            <button className="lp-btn lp-btn-bet" onClick={() => openAuth("register")}>Join now →</button>
            <button className="lp-btn lp-btn-ghost" onClick={() => scrollTo("lp-races")}>View Race Schedule</button>
          </div>
        </section>

        <div className="lp-scrolldown" onClick={() => window.scrollTo({ top: window.innerHeight - 4, behavior: "smooth" })}>↓</div>
      </div>

      {/* ══ STATS BAND ══ */}
      <section className="lp-band">
        <div className="lp-band-inner">
          {[
            { n: "4", l: "Bet Types", s: "WIN · PLACE · SHOW · EXACT" },
            { n: "35Tr", l: "Total Prize", s: "per race" },
            { n: "6", l: "Role", s: "in the racing system" },
            { n: "24/7", l: "Leaderboard", s: "real-time updates" },
          ].map((x, i) => (
            <div className="lp-stat" key={i}>
              <div className="lp-stat-n">{x.n}</div>
              <div className="lp-stat-l">{x.l}</div>
              <div className="lp-stat-s">{x.s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ LỊCH THI ĐẤU (đồng bộ với /races) ══ */}
      <section id="lp-races" className="lp-sec">
        <div className="lp-sec-eyebrow">Race Schedule</div>
        <h2 className="lp-sec-h">Season Races</h2>
        <div className="lp-inline-list">
          {races === null ? (
            <div className="lp-empty">Loading...</div>
          ) : races.length === 0 ? (
            <div className="lp-empty">No races yet</div>
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
        <div className="lp-inline-cta">
          <button className="lp-btn lp-btn-bet" onClick={() => openAuth("login")}>Login to Bet &gt;</button>
        </div>
      </section>

      {/* ══ BẢNG XẾP HẠNG ══ */}
      <section id="lp-lb" className="lp-sec lp-sec-alt">
        <div className="lp-sec-eyebrow">Leaderboard</div>
        <h2 className="lp-sec-h">Season Top Performers</h2>
        <div className="lp-inline-list">
          <div className="lp-mtabs lp-tabs-center">
            <button data-on={lbTab === "jockey"} onClick={() => setLbTab("jockey")}>🏇 Jockey</button>
            <button data-on={lbTab === "horse"} onClick={() => setLbTab("horse")}>🐴 Racehorse</button>
          </div>
          {lb === null ? (
            <div className="lp-empty">Loading...</div>
          ) : (lb[lbTab] || []).length === 0 ? (
            <div className="lp-empty">No leaderboard data yet</div>
          ) : lb[lbTab].slice(0, 8).map((it, i) => (
            <div className="lp-lbrow" key={it.entityId ?? i}>
              <span className="lp-lbrank">{i < 3 ? ["🥇","🥈","🥉"][i] : it.rank ?? i + 1}</span>
              <span className="lp-lbname">{it.name ?? "—"}</span>
              <span className="lp-lbwin">{it.totalWins ?? 0} wins</span>
              <span className="lp-lbpts">{it.points ?? 0}đ</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="lp-sec">
        <div className="lp-sec-eyebrow">Start in 3 Steps</div>
        <h2 className="lp-sec-h">Join betting and follow races</h2>
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
            <h3>Ready to enter the track?</h3>
            <p>Create a Spectator account and start betting today with a demo wallet.</p>
          </div>
          <div className="lp-ctaband-btns">
            <button className="lp-btn lp-btn-bet" onClick={() => openAuth("register")}>Register Now</button>
            <button className="lp-btn lp-btn-ghost" onClick={() => scrollTo("lp-lb")}>View Rankings</button>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="lp-footer">
        <div className="lp-brand">
          <div className="lp-logo" style={{ width: 28, height: 28, fontSize: 15 }}>🏇</div>
          <div><div className="lp-bt">HORSERACING VN</div><div className="lp-bs">Project demo - No real money</div></div>
        </div>
        <div className="lp-footer-links">
          <button onClick={() => scrollTo("lp-races")}>Races</button>
          <button onClick={() => scrollTo("lp-lb")}>Rankings</button>
          <button onClick={() => openAuth("login")}>Login</button>
        </div>
      </footer>

      {/* ══════════ POPUP: AUTH ══════════ */}
      {authOpen && (
        <div className="lp-ov" onClick={(e) => e.target === e.currentTarget && setAuthOpen(false)}>
          <div className="lp-modal" role="dialog" aria-modal="true">
            <button className="lp-x" onClick={() => setAuthOpen(false)} aria-label="Close">✕</button>
            <div className="lp-mlogo">🏇</div>
            <h3>{tab === "login" ? "Login" : "Create Account"}</h3>
            <div className="lp-msub">HorseRacing VN · Season 2026</div>

            <div className="lp-mtabs">
              <button data-on={tab === "login"} onClick={() => switchTab("login")}>Login</button>
              <button data-on={tab === "register"} onClick={() => switchTab("register")}>Register</button>
            </div>

            {note && <div className="lp-mnote">{note}</div>}
            {okNote && <div className="lp-mnote lp-mok">{okNote}</div>}

            {tab === "login" ? (
              <form className="lp-form" onSubmit={handleLogin}>
                <div className="lp-field">
                  <label>Username</label>
                  <input placeholder="e.g. spectator1" required autoComplete="username"
                    value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} />
                </div>
                <div className="lp-field">
                  <label>Password</label>
                  <input type="password" placeholder="••••••" required autoComplete="current-password"
                    value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
                </div>
                <div className="lp-mrow">
                  <label><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me</label>
                  <a onClick={() => navigate("/forgot-password")}>Forgot Password?</a>
                </div>
                <button className="lp-mbtn" type="submit" disabled={busy}>{busy ? "Logging in..." : "Login"}</button>
                <div className="lp-mswitch">No account yet? <a onClick={() => switchTab("register")}>Register Now</a></div>
              </form>
            ) : (
              <form className="lp-form" onSubmit={handleRegister}>
                <div className="lp-field">
                  <label>Full Name</label>
                  <input placeholder="John Doe" required
                    value={regForm.fullName} onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })} />
                </div>
                <div className="lp-frow">
                  <div className="lp-field">
                    <label>Username</label>
                    <input placeholder="username" required autoComplete="username"
                      value={regForm.username} onChange={(e) => setRegForm({ ...regForm, username: e.target.value })} />
                  </div>
                  <div className="lp-field">
                    <label>Phone Number</label>
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
                  <label>Password</label>
                  <input type="password" placeholder="••••••" required autoComplete="new-password"
                    value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} />
                </div>
                <div className="lp-field">
                  <label>Role</label>
                  <select required value={regForm.role} onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}>
                    <option value="" disabled>— Select Role —</option>
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <button className="lp-mbtn" type="submit" disabled={busy}>{busy ? "Creating account..." : "Create Account"}</button>
                <div className="lp-mswitch">Already have an account? <a onClick={() => switchTab("login")}>Login</a></div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
