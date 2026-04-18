import React, { useEffect, useState, useRef, useCallback } from 'react';

const SOCKET_URL = "wss://neurolearn-pro-production.up.railway.app/ws/attention";
const STUDENT_NAME = "Rafay Khalil";

// ─── THEME TOKENS ──────────────────────────────────────────────────────────
const makeStyles = (dark) => `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:           ${dark ? '#02040a'                    : '#f4f6fb'};
    --bg2:          ${dark ? '#060c18'                    : '#eef1f8'};
    --surface:      ${dark ? 'rgba(255,255,255,0.03)'     : 'rgba(0,0,0,0.04)'};
    --surface2:     ${dark ? 'rgba(255,255,255,0.06)'     : 'rgba(0,0,0,0.07)'};
    --border:       ${dark ? 'rgba(255,255,255,0.07)'     : 'rgba(0,0,0,0.10)'};
    --border2:      ${dark ? 'rgba(255,255,255,0.13)'     : 'rgba(0,0,0,0.18)'};
    --text:         ${dark ? '#f0f2f5'                    : '#0d1117'};
    --text2:        ${dark ? '#94a3b8'                    : '#4a5568'};
    --text3:        ${dark ? '#4a5568'                    : '#94a3b8'};
    --teal:         #00d4aa;
    --teal-dim:     rgba(0,212,170,0.12);
    --amber:        #f6ad55;
    --amber-dim:    rgba(246,173,85,0.12);
    --red:          #fc6060;
    --red-dim:      rgba(252,96,96,0.12);
    --blue:         #60a5fa;
    --blue-dim:     rgba(96,165,250,0.10);
    --purple:       #a78bfa;
    --r:            14px;
    --rlg:          20px;
  }

  html, body { background: var(--bg); color: var(--text); font-family: 'Syne', sans-serif; -webkit-font-smoothing: antialiased; transition: background 0.3s, color 0.3s; }

  .syn-root { min-height: 100vh; background: var(--bg); color: var(--text); position: relative; overflow-x: hidden; font-family: 'Syne', sans-serif; transition: background 0.3s; }

  /* grain */
  .syn-root::after { content:''; position:fixed; inset:0; pointer-events:none; z-index:9998; opacity:${dark?'0.35':'0.15'};
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E"); }

  /* blobs */
  .blob { position:fixed; border-radius:50%; filter:blur(130px); pointer-events:none; z-index:0; animation:blobIn 2s ease forwards; opacity:0; }
  .blob-1 { width:700px; height:700px; top:-260px; left:-200px; background:radial-gradient(circle, ${dark?'rgba(0,212,170,0.07)':'rgba(0,212,170,0.09)'} 0%, transparent 70%); }
  .blob-2 { width:600px; height:600px; bottom:-160px; right:-160px; background:radial-gradient(circle, ${dark?'rgba(96,165,250,0.06)':'rgba(96,165,250,0.08)'} 0%, transparent 70%); animation-delay:.4s; }
  @keyframes blobIn { to { opacity:1; } }

  .syn-wrap { max-width:1180px; margin:0 auto; padding:32px 24px; position:relative; z-index:1; }

  /* ── HEADER ── */
  .hdr { display:flex; justify-content:space-between; align-items:center; padding-bottom:28px; margin-bottom:28px; border-bottom:1px solid var(--border); animation:dn .5s cubic-bezier(.16,1,.3,1) both; }
  .brand { display:flex; align-items:center; gap:14px; }
  .brand-ico { width:40px; height:40px; border-radius:11px; background:linear-gradient(135deg,var(--teal),#0099ff); display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:800; color:#000; box-shadow:0 0 20px rgba(0,212,170,0.25); flex-shrink:0; }
  .brand-name { font-size:20px; font-weight:800; letter-spacing:-.3px; }
  .brand-status { display:flex; align-items:center; gap:6px; margin-top:4px; }
  .sdot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  .sdot.live { background:var(--teal); box-shadow:0 0 8px var(--teal); animation:pulse 2s infinite; }
  .sdot.warn { background:var(--amber); box-shadow:0 0 8px var(--amber); animation:pulse 1.2s infinite; }
  .sdot.crit { background:var(--red); box-shadow:0 0 10px var(--red); animation:pulse .6s infinite; }
  .sdot.off  { background:var(--text3); }
  .stxt { font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; font-family:'DM Mono',monospace; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.2} }

  .hdr-actions { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  .btn { padding:9px 18px; border-radius:9px; font-size:12px; font-weight:700; cursor:pointer; border:none; transition:all .2s; font-family:'Syne',sans-serif; }
  .btn-ghost { background:var(--surface); color:var(--text); border:1px solid var(--border); }
  .btn-ghost:hover { background:var(--surface2); border-color:var(--border2); }
  .btn-danger { background:var(--red-dim); color:var(--red); border:1px solid rgba(252,96,96,.2); }
  .btn-danger:hover { background:rgba(252,96,96,.2); }
  .btn-teal { background:var(--teal-dim); color:var(--teal); border:1px solid rgba(0,212,170,.25); }
  .btn-teal:hover { background:rgba(0,212,170,.2); }

  /* ── BANNER (tab hidden / camera off) ── */
  .smart-banner { display:flex; align-items:center; gap:12px; padding:12px 18px; border-radius:11px; margin-bottom:18px; font-size:13px; font-weight:600; animation:slideIn .3s ease; }
  .sb-tab  { background:var(--amber-dim); border:1px solid rgba(246,173,85,.25); color:var(--amber); }
  .sb-cam  { background:var(--blue-dim);  border:1px solid rgba(96,165,250,.25);  color:var(--blue); }
  .sb-mob  { background:var(--red-dim);   border:1px solid rgba(252,96,96,.25);   color:var(--red); animation:pulse-border 1.5s infinite; }
  @keyframes pulse-border { 0%,100%{box-shadow:0 0 0 0 rgba(252,96,96,.2)} 50%{box-shadow:0 0 0 6px rgba(252,96,96,0)} }
  @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }

  /* ── STATS ── */
  .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; animation:up .5s cubic-bezier(.16,1,.3,1) .1s both; }
  .stat-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:22px 20px; position:relative; overflow:hidden; transition:border-color .25s,transform .2s; cursor:default; }
  .stat-card::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(0,212,170,.05),transparent); opacity:0; transition:opacity .3s; }
  .stat-card:hover { border-color:var(--border2); transform:translateY(-2px); }
  .stat-card:hover::before { opacity:1; }
  .slabel { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--text3); margin-bottom:10px; }
  .sval { font-size:30px; font-weight:800; font-family:'DM Mono',monospace; letter-spacing:-1px; transition:color .4s; }
  .ssub { font-size:11px; color:var(--text3); margin-top:6px; }

  /* ── CAMERA OFF MODE ── */
  .cam-off-panel { background:var(--surface); border:1px solid var(--border); border-radius:var(--rlg); padding:28px; margin-bottom:20px; animation:up .5s cubic-bezier(.16,1,.3,1) .15s both; }
  .cam-off-inner { display:flex; align-items:center; gap:28px; }
  .cam-icon { width:80px; height:80px; border-radius:16px; background:var(--blue-dim); border:1px solid rgba(96,165,250,.2); display:flex; align-items:center; justify-content:center; font-size:36px; flex-shrink:0; }
  .cam-off-text h3 { font-size:16px; font-weight:700; margin-bottom:6px; }
  .cam-off-text p { font-size:13px; color:var(--text2); line-height:1.6; max-width:520px; }
  .cam-off-mode-bar { display:flex; gap:10px; margin-top:16px; flex-wrap:wrap; }
  .mode-pill { padding:6px 14px; border-radius:8px; font-size:11px; font-weight:700; font-family:'DM Mono',monospace; letter-spacing:.06em; text-transform:uppercase; }
  .mp-active { background:var(--teal-dim); color:var(--teal); border:1px solid rgba(0,212,170,.25); }
  .mp-inactive { background:var(--surface2); color:var(--text3); border:1px solid var(--border); }

  /* ── FOCUS PANEL ── */
  .focus-panel { background:var(--surface); border:1px solid var(--border); border-radius:var(--rlg); padding:28px; margin-bottom:20px; animation:up .5s cubic-bezier(.16,1,.3,1) .15s both; }
  .panel-hdr { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
  .ptitle { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.12em; color:var(--text3); }
  .score-row { display:flex; align-items:center; gap:40px; }
  .ring-track { fill:none; stroke:${dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.07)'}; stroke-width:6; }
  .ring-fill { fill:none; stroke-width:6; stroke-linecap:round; transition:stroke-dashoffset .7s cubic-bezier(.34,1.56,.64,1),stroke .4s; }
  .ring-val { font-family:'DM Mono',monospace; font-size:28px; font-weight:500; transition:fill .4s; }
  .ring-lbl { font-size:10px; fill:var(--text3); font-family:'Syne',sans-serif; }
  .history-col { flex:1; }
  .htitle { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--text3); margin-bottom:14px; }
  .spark-bars { display:flex; align-items:flex-end; gap:3px; height:64px; }
  .spark-bar { flex:1; min-width:4px; border-radius:3px 3px 0 0; transition:height .4s cubic-bezier(.34,1.56,.64,1),background .4s; }
  .spark-time { display:flex; justify-content:space-between; margin-top:8px; font-size:10px; color:var(--text3); font-family:'DM Mono',monospace; }

  /* ── TELE PANEL ── */
  .tele-panel { background:var(--surface); border:1px solid var(--border); border-radius:var(--rlg); padding:28px; margin-bottom:20px; transition:border-color .3s,box-shadow .3s; animation:up .5s cubic-bezier(.16,1,.3,1) .2s both; }
  .tele-panel.crit { border-color:rgba(252,96,96,.35); box-shadow:0 0 40px rgba(252,96,96,.07); }
  .tele-panel.warn { border-color:rgba(246,173,85,.3); box-shadow:0 0 30px rgba(246,173,85,.06); }
  .tele-grid { display:grid; grid-template-columns:1fr 1fr; gap:32px; }
  .tcol-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.12em; color:var(--text3); margin-bottom:18px; }
  .trow { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border); font-size:13px; }
  .trow:last-child { border-bottom:none; }
  .tkey { color:var(--text2); }
  .tval { font-family:'DM Mono',monospace; font-size:12px; color:var(--text); }
  .badge { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:10px; font-weight:700; font-family:'DM Mono',monospace; }
  .badge-g { background:var(--teal-dim); color:var(--teal); border:1px solid rgba(0,212,170,.2); }
  .badge-b { background:var(--blue-dim); color:var(--blue); border:1px solid rgba(96,165,250,.2); }
  .badge-r { background:var(--red-dim); color:var(--red); border:1px solid rgba(252,96,96,.2); }
  .bdot { width:5px; height:5px; border-radius:50%; background:currentColor; animation:pulse 1.5s infinite; }

  /* matrix */
  .matrix-term { background:#010208; border:1px solid rgba(0,212,170,.12); border-radius:12px; padding:20px; height:200px; overflow:hidden; font-family:'DM Mono',monospace; color:var(--teal); font-size:12px; line-height:1.7; box-shadow:inset 0 0 30px rgba(0,212,170,.03); }

  /* alert banners */
  .alert-banner { margin-top:20px; padding:13px 18px; border-radius:10px; display:flex; align-items:center; gap:10px; font-size:13px; font-weight:600; animation:slideIn .3s ease; }
  .ab-crit { background:var(--red-dim); border:1px solid rgba(252,96,96,.25); color:var(--red); }
  .ab-warn { background:var(--amber-dim); border:1px solid rgba(246,173,85,.25); color:var(--amber); }

  /* ── LOGS ── */
  .logs-panel { background:var(--surface); border:1px solid var(--border); border-radius:var(--rlg); padding:24px 28px; animation:up .5s cubic-bezier(.16,1,.3,1) .25s both; }
  .logs-hdr { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
  .logs-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.12em; color:var(--text3); }
  .log-item { display:flex; align-items:flex-start; gap:16px; padding:11px 0; border-bottom:1px solid var(--border); font-size:13px; animation:slideIn .3s ease; }
  .log-item:last-child { border-bottom:none; }
  .ltime { font-family:'DM Mono',monospace; font-size:11px; color:var(--text3); white-space:nowrap; padding-top:1px; }
  .lname { font-weight:700; color:var(--text); margin-right:6px; }
  .lactv { color:var(--text2); }
  .empty-state { text-align:center; padding:36px 0; color:var(--text3); font-size:13px; }
  .empty-ico { font-size:28px; margin-bottom:10px; opacity:.25; }

  /* ── SUMMARY ── */
  .sum-overlay { position:fixed; inset:0; z-index:9000; background:rgba(0,0,0,.8); backdrop-filter:blur(16px); display:flex; align-items:center; justify-content:center; padding:20px; animation:fadeIn .3s ease; }
  .sum-card { background:${dark?'#060b14':'#ffffff'}; border:1px solid var(--border2); border-radius:24px; padding:48px 40px; width:100%; max-width:440px; text-align:center; animation:up .5s cubic-bezier(.16,1,.3,1) both; }
  .sum-icon { font-size:42px; margin-bottom:20px; }
  .sum-title { font-size:28px; font-weight:800; margin-bottom:8px; }
  .sum-sub { color:var(--text2); font-size:14px; margin-bottom:32px; }
  .sum-box { background:var(--surface); border:1px solid var(--border); border-radius:var(--r); margin-bottom:28px; overflow:hidden; }
  .sum-row { display:flex; justify-content:space-between; align-items:center; padding:14px 20px; border-bottom:1px solid var(--border); }
  .sum-row:last-child { border-bottom:none; }
  .sum-key { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text2); }
  .sum-val { font-size:18px; font-weight:800; font-family:'DM Mono',monospace; color:var(--teal); }
  .btn-full { width:100%; padding:14px; border:none; border-radius:10px; cursor:pointer; font-family:'Syne',sans-serif; font-size:14px; font-weight:700; background:linear-gradient(135deg,var(--teal) 0%,#0099ff 100%); color:#000; transition:opacity .2s,transform .15s; }
  .btn-full:hover { opacity:.88; transform:translateY(-1px); }

  /* ── KEYFRAMES ── */
  @keyframes up   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
  @keyframes dn   { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:none} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }

  /* ── RESPONSIVE ── */
  @media(max-width:900px){ .stats-grid{grid-template-columns:1fr 1fr} .tele-grid{grid-template-columns:1fr;gap:20px} .score-row{flex-direction:column;gap:24px} .history-col{width:100%} .cam-off-inner{flex-direction:column;gap:16px} }
  @media(max-width:600px){ .syn-wrap{padding:20px 16px} .hdr{flex-direction:column;align-items:flex-start;gap:16px} .hdr-actions{width:100%;justify-content:space-between} .sum-card{padding:32px 24px} .tele-panel{padding:20px} }
`;

// ─── FOCUS RING ────────────────────────────────────────────────────────────
const FocusRing = ({ score, cameraOff }) => {
  const r = 54, circ = 2 * Math.PI * r;
  const filled = circ * (cameraOff ? 0.5 : score / 100);
  const color = cameraOff ? 'var(--blue)' : score >= 80 ? 'var(--teal)' : score >= 50 ? 'var(--amber)' : 'var(--red)';
  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      <circle className="ring-track" cx="65" cy="65" r={r} />
      <circle className="ring-fill" cx="65" cy="65" r={r}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ * 0.25} style={{ stroke: color }} />
      <text x="65" y="60" textAnchor="middle" dominantBaseline="middle" className="ring-val" style={{ fill: color }}>
        {cameraOff ? '--' : score}
      </text>
      <text x="65" y="79" textAnchor="middle" className="ring-lbl">
        {cameraOff ? 'CAM OFF' : 'FOCUS %'}
      </text>
    </svg>
  );
};

// ─── SPARKLINE ─────────────────────────────────────────────────────────────
const Sparkline = ({ history }) => {
  const pts = history.slice(-30);
  return (
    <div className="history-col">
      <div className="htitle">Session Trend</div>
      <div className="spark-bars">
        {pts.length === 0
          ? Array.from({ length: 24 }).map((_, i) => <div key={i} className="spark-bar" style={{ height: '4px', background: 'var(--border)' }} />)
          : pts.map((p, i) => {
              const h = Math.max(4, (p.score / 100) * 64);
              const bg = p.score >= 80 ? 'var(--teal)' : p.score >= 50 ? 'var(--amber)' : 'var(--red)';
              return <div key={i} className="spark-bar" style={{ height: `${h}px`, background: bg, opacity: 0.5 + (i / pts.length) * 0.5 }} />;
            })}
      </div>
      <div className="spark-time">
        <span>{pts.length > 0 ? pts[0].time : '--:--:--'}</span>
        <span>{pts.length > 0 ? pts[pts.length - 1].time : '--:--:--'}</span>
      </div>
    </div>
  );
};

// ─── STAT BOX ──────────────────────────────────────────────────────────────
const StatBox = ({ label, value, color, sub }) => (
  <div className="stat-card">
    <div className="slabel">{label}</div>
    <div className="sval" style={{ color: color || 'var(--text)' }}>{value}</div>
    {sub && <div className="ssub">{sub}</div>}
  </div>
);

// ─── SUMMARY ───────────────────────────────────────────────────────────────
const SummaryScreen = ({ xp, maxStreak, sessionHistory, onReset }) => {
  const avg = sessionHistory.length > 0
    ? Math.round(sessionHistory.reduce((a, b) => a + b.score, 0) / sessionHistory.length) : 0;
  const grade = avg >= 85 ? 'Excellent' : avg >= 70 ? 'Good' : avg >= 50 ? 'Fair' : 'Needs Work';
  return (
    <div className="sum-overlay">
      <div className="sum-card">
        <div className="sum-icon">⚡</div>
        <div className="sum-title">Session Complete</div>
        <div className="sum-sub">Analytics recorded for {STUDENT_NAME}</div>
        <div className="sum-box">
          <div className="sum-row"><span className="sum-key">Session XP</span><span className="sum-val">+{xp}</span></div>
          <div className="sum-row"><span className="sum-key">Avg Focus</span><span className="sum-val">{avg}%</span></div>
          <div className="sum-row"><span className="sum-key">Peak Flow</span><span className="sum-val">{maxStreak}s</span></div>
          <div className="sum-row"><span className="sum-key">Rating</span><span className="sum-val" style={{ fontSize: '14px' }}>{grade}</span></div>
        </div>
        <button className="btn-full" onClick={onReset}>Return to Dashboard →</button>
      </div>
    </div>
  );
};

// ─── MAIN ──────────────────────────────────────────────────────────────────
const AttentionDashboard = () => {
  const [isDark, setIsDark] = useState(true);
  const [currentScore, setCurrentScore] = useState(100);
  const [isDistracted, setIsDistracted] = useState(false);
  const [studentState, setStudentState] = useState("Initializing...");
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [xp, setXp] = useState(120);
  const [showSummary, setShowSummary] = useState(false);
  const [isMatrixMode, setIsMatrixMode] = useState(false);
  const [matrixData, setMatrixData] = useState("");
  const [incidentLogs, setIncidentLogs] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);

  // Smart feature states
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [cameraError, setCameraError] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [tabHiddenCount, setTabHiddenCount] = useState(0);
  const [mobileDetected, setMobileDetected] = useState(false);
  const [clock, setClock] = useState(new Date().toLocaleTimeString());

  const socketRef = useRef(null);
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  const isCritical = studentState.includes("Sleep") || studentState.includes("Spoof") || studentState.includes("Not Detected");
  const isMobileAlert = studentState.toLowerCase().includes("mobile") || studentState.toLowerCase().includes("phone");
  const statusClass = isCritical || isMobileAlert ? 'crit' : isDistracted ? 'warn' : cameraEnabled ? 'live' : 'off';
  const statusLabel = cameraEnabled
    ? (isCritical ? '[ ALARM STATE ]' : isMobileAlert ? '[ MOBILE DETECTED ]' : isDistracted ? 'Distraction Detected' : studentState)
    : 'Camera Privacy Mode';
  const statusColor = (isCritical || isMobileAlert) ? 'var(--red)' : isDistracted ? 'var(--amber)' : cameraEnabled ? 'var(--teal)' : 'var(--blue)';
  const scoreColor = currentScore >= 80 ? 'var(--teal)' : currentScore >= 50 ? 'var(--amber)' : 'var(--red)';

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  // Tab visibility detection
  useEffect(() => {
    const handle = () => {
      if (document.hidden) {
        setIsTabHidden(true);
        setTabHiddenCount(c => c + 1);
      } else {
        setIsTabHidden(false);
      }
    };
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, []);

  // Matrix
  useEffect(() => {
    if (!isMatrixMode) return;
    const id = setInterval(() => {
      const h1 = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      const h2 = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      const lat = (Math.random() * 5 + 2).toFixed(2);
      const line = `> [SYS_OK] YAW:${(Math.random()*.4).toFixed(3)} PITCH:${(Math.random()*.6).toFixed(3)}\n` +
                   `> [ALLOC] 0x${h1}→0x${h2} LAT:${lat}ms\n` +
                   `> [INFER] Conf:${(Math.random()*99+1).toFixed(1)}% Thread:Active\n`;
      setMatrixData(p => (p + line).split('\n').slice(-18).join('\n'));
    }, 400);
    return () => clearInterval(id);
  }, [isMatrixMode]);

  // WebSocket + camera
  useEffect(() => {
    if (showSummary) return;

    socketRef.current = new WebSocket(SOCKET_URL);
    socketRef.current.onopen  = () => setStudentState("Connection Established.");
    socketRef.current.onerror = () => setStudentState("Network Error.");

    if (cameraEnabled) {
      navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
        .then(stream => {
          if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
          setCameraError(false);
        })
        .catch(() => { setCameraError(true); setCameraEnabled(false); setStudentState("Camera Access Denied."); });
    }

    const emojiRx = /[\u{1F600}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setCurrentScore(data.focus_score);
        const cs = data.student_state.replace(emojiRx, '').trim();
        setStudentState(cs);
        setIsDistracted(data.focus_score < 70);
        setMobileDetected(cs.toLowerCase().includes('mobile') || cs.toLowerCase().includes('phone'));
        if (data.incident_logs) setIncidentLogs(data.incident_logs);
        setSessionHistory(prev => [...prev, { time: new Date().toLocaleTimeString(), score: data.focus_score, state: cs }]);
        if (data.focus_score >= 80) {
          setStreak(prev => { const n = prev + 1; setMaxStreak(m => n > m ? n : m); if (n % 50 === 0) setXp(x => x + 100); return n; });
        } else if (data.focus_score < 50) { setStreak(0); }
      } catch(e) { console.error(e); }
    };

    let interval;
    if (cameraEnabled) {
      interval = setInterval(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN && videoRef.current?.readyState >= 2) {
          const ctx = canvasRef.current.getContext('2d');
          ctx.drawImage(videoRef.current, 0, 0, 320, 240);
          socketRef.current.send(canvasRef.current.toDataURL('image/jpeg', 0.5));
        }
      }, 150);
    }

    return () => { if (interval) clearInterval(interval); socketRef.current?.close(); };
  }, [showSummary, cameraEnabled]);

  const exportCSV = () => {
    const emojiRx = /[\u{1F600}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
    let csv = `data:text/csv;charset=utf-8,Session Report: ${STUDENT_NAME}\n\nTime,Activity\n`;
    incidentLogs.forEach(l => { csv += `${l.time},${l.activity.replace(emojiRx,'').trim()}\n`; });
    const a = Object.assign(document.createElement('a'), { href: encodeURI(csv), download: `Synapse_${STUDENT_NAME.replace(' ','_')}.csv` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  if (showSummary) return (
    <>
      <style>{makeStyles(isDark)}</style>
      <div className="syn-root">
        <SummaryScreen xp={xp} maxStreak={maxStreak} sessionHistory={sessionHistory} onReset={() => window.location.reload()} />
      </div>
    </>
  );

  return (
    <>
      <style>{makeStyles(isDark)}</style>
      <div className="syn-root">
        <div className="blob blob-1" /><div className="blob blob-2" />

        <video ref={videoRef} width="320" height="240" autoPlay playsInline muted
          style={{ position:'absolute', opacity:0, pointerEvents:'none', zIndex:-10 }} />
        <canvas ref={canvasRef} width="320" height="240"
          style={{ position:'absolute', opacity:0, pointerEvents:'none', zIndex:-10 }} />

        <div className="syn-wrap">

          {/* ── HEADER ── */}
          <header className="hdr">
            <div className="brand">
              <div className="brand-ico">S</div>
              <div>
                <div className="brand-name">Synapse</div>
                <div className="brand-status">
                  <div className={`sdot ${statusClass}`} />
                  <span className="stxt" style={{ color: statusColor }}>{statusLabel}</span>
                </div>
              </div>
            </div>
            <div className="hdr-actions">
              <button className="btn btn-ghost" onClick={() => setIsDark(d => !d)}>
                {isDark ? '☀ Light' : '◑ Dark'}
              </button>
              <button className={`btn ${cameraEnabled ? 'btn-ghost' : 'btn-teal'}`}
                onClick={() => { setCameraEnabled(c => !c); setCameraError(false); }}>
                {cameraEnabled ? '📷 Cam On' : '🔒 Cam Off'}
              </button>
              <button className="btn btn-ghost" onClick={() => setIsMatrixMode(m => !m)}>
                {isMatrixMode ? 'Standard' : 'Matrix'}
              </button>
              <button className="btn btn-danger" onClick={() => setShowSummary(true)}>End Session</button>
            </div>
          </header>

          {/* ── SMART BANNERS ── */}
          {isTabHidden && (
            <div className="smart-banner sb-tab">
              ⚠️ <strong>Tab Switch Detected</strong> — You left this tab ({tabHiddenCount}× this session). Return to session to resume tracking.
            </div>
          )}
          {!cameraEnabled && (
            <div className="smart-banner sb-cam">
              🔒 <strong>Privacy Mode Active</strong> — Camera is off. Focus tracking is paused; session timer and XP continue.
            </div>
          )}
          {mobileDetected && cameraEnabled && (
            <div className="smart-banner sb-mob">
              📱 <strong>Mobile Device Detected</strong> — Please put your phone away to resume focused session.
            </div>
          )}

          {/* ── STATS ── */}
          <div className="stats-grid">
            <StatBox label="Cognitive Score" value={cameraEnabled ? `${currentScore}%` : '--'} color={cameraEnabled ? scoreColor : 'var(--blue)'} sub="Real-time" />
            <StatBox label="Flow Streak" value={`${streak}s`} color="var(--text)" sub="Current run" />
            <StatBox label="Peak Flow" value={`${maxStreak}s`} color="var(--blue)" sub="Session best" />
            <StatBox label="Session XP" value={xp} color="var(--amber)" sub={xp >= 220 ? '⚡ Bonus active' : 'Accumulating'} />
          </div>

          {/* ── CAMERA OFF PANEL ── */}
          {!cameraEnabled ? (
            <div className="cam-off-panel">
              <div className="cam-off-inner">
                <div className="cam-icon">🔒</div>
                <div className="cam-off-text">
                  <h3>Privacy Mode — Camera Disabled</h3>
                  <p>Your camera is currently off. We respect your privacy. You can re-enable camera tracking at any time using the button above. While in privacy mode, basic session tracking (XP, time, tab monitoring) continues normally.</p>
                  <div className="cam-off-mode-bar">
                    <span className="mode-pill mp-active">✓ Session Timer</span>
                    <span className="mode-pill mp-active">✓ Tab Monitor</span>
                    <span className="mode-pill mp-active">✓ XP Tracking</span>
                    <span className="mode-pill mp-inactive">✗ Focus Score</span>
                    <span className="mode-pill mp-inactive">✗ Mobile Detect</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── FOCUS PANEL ── */
            <div className="focus-panel">
              <div className="panel-hdr">
                <span className="ptitle">Attention Monitor</span>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'11px', color:'var(--text3)' }}>{clock}</span>
              </div>
              <div className="score-row">
                <FocusRing score={currentScore} cameraOff={false} />
                <Sparkline history={sessionHistory} />
              </div>
            </div>
          )}

          {/* ── TELEMETRY ── */}
          <div className={`tele-panel ${isCritical || isMobileAlert ? 'crit' : isDistracted ? 'warn' : ''}`}>
            {isMatrixMode ? (
              <div className="matrix-term"><pre>{matrixData}</pre></div>
            ) : (
              <div className="tele-grid">
                <div>
                  <div className="tcol-title">System Telemetry</div>
                  <div className="trow"><span className="tkey">Engine</span>
                    <span className="badge badge-g"><span className="bdot" />Active / WSS</span></div>
                  <div className="trow"><span className="tkey">Vision Protocol</span><span className="tval">YOLOv8 Nano</span></div>
                  <div className="trow"><span className="tkey">Avg Latency</span><span className="tval">~12ms</span></div>
                  <div className="trow"><span className="tkey">Tab Switches</span>
                    <span className={`badge ${tabHiddenCount > 0 ? 'badge-r' : 'badge-g'}`}>{tabHiddenCount}×</span></div>
                </div>
                <div>
                  <div className="tcol-title">Session Identity</div>
                  <div className="trow"><span className="tkey">Subject</span><span className="tval">{STUDENT_NAME}</span></div>
                  <div className="trow"><span className="tkey">Camera</span>
                    <span className={`badge ${cameraEnabled ? 'badge-g' : 'badge-b'}`}>
                      {cameraEnabled ? <><span className="bdot" />Active</> : 'Privacy Mode'}
                    </span></div>
                  <div className="trow"><span className="tkey">Recording</span>
                    <span className={`badge ${cameraEnabled ? 'badge-g' : 'badge-b'}`}>
                      {cameraEnabled ? <><span className="bdot" />Live</> : 'Paused'}
                    </span></div>
                  <div className="trow"><span className="tkey">Incidents</span><span className="tval">{incidentLogs.length}</span></div>
                </div>
              </div>
            )}

            {isMobileAlert && cameraEnabled && (
              <div className="alert-banner ab-crit">
                <span>📱</span>
                <span>MOBILE DETECTED — Please put your phone away immediately.</span>
              </div>
            )}
            {isCritical && !isMobileAlert && (
              <div className="alert-banner ab-crit">
                <span>🚨</span><span>CRITICAL ALERT — {studentState}</span>
              </div>
            )}
            {!isCritical && !isMobileAlert && isDistracted && cameraEnabled && (
              <div className="alert-banner ab-warn">
                <span>⚠️</span><span>Disruption detected. Refocus required immediately.</span>
              </div>
            )}
          </div>

          {/* ── LOGS ── */}
          <div className="logs-panel">
            <div className="logs-hdr">
              <span className="logs-title">Incident Logs</span>
              {incidentLogs.length > 0 && (
                <button className="btn btn-ghost" style={{ padding:'6px 14px', fontSize:'11px' }} onClick={exportCSV}>Export CSV ↓</button>
              )}
            </div>
            {incidentLogs.length === 0 ? (
              <div className="empty-state"><div className="empty-ico">◎</div>No incidents recorded in current session.</div>
            ) : (
              incidentLogs.map((log, i) => {
                const clean = log.activity.replace(/[\u{1F600}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,'').trim();
                return (
                  <div key={i} className="log-item">
                    <span className="ltime">{log.time}</span>
                    <span><span className="lname">{STUDENT_NAME}</span><span className="lactv">— {clean}</span></span>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default AttentionDashboard;