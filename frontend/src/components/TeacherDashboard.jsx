import React, { useState, useEffect, useRef } from 'react';

// Same WebSocket URL as AttentionDashboard
const SOCKET_URL = "ws://localhost:8000/ws/attention";
const RAFAY_ID = '099';

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #02040a;
    --surface: rgba(255,255,255,0.03);
    --surface-hover: rgba(255,255,255,0.06);
    --border: rgba(255,255,255,0.07);
    --border-bright: rgba(255,255,255,0.12);
    --text: #f0f2f5;
    --muted: #4a5568;
    --subtle: #718096;
    --teal: #00d4aa;
    --teal-dim: rgba(0,212,170,0.12);
    --amber: #f6ad55;
    --amber-dim: rgba(246,173,85,0.12);
    --red: #fc6060;
    --red-dim: rgba(252,96,96,0.12);
    --blue: #60a5fa;
    --green: #34d399;
    --radius: 14px;
    --radius-lg: 20px;
  }

  html, body { background: var(--bg); font-family: 'Syne', sans-serif; -webkit-font-smoothing: antialiased; color: var(--text); }

  .td-root { min-height: 100vh; background: var(--bg); color: var(--text); position: relative; overflow-x: hidden; font-family: 'Syne', sans-serif; }
  .td-root::after { content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 9999; opacity: 0.4; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"); }

  .blob { position: fixed; border-radius: 50%; filter: blur(120px); pointer-events: none; z-index: 0; animation: blobFade 2s ease forwards; opacity: 0; }
  .blob-1 { width: 700px; height: 700px; top: -250px; left: -200px; background: radial-gradient(circle, rgba(0,212,170,0.07) 0%, transparent 70%); }
  .blob-2 { width: 600px; height: 600px; bottom: -150px; right: -150px; background: radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 70%); animation-delay: 0.4s; }
  @keyframes blobFade { to { opacity: 1; } }

  .td-wrap { max-width: 1000px; margin: 0 auto; padding: 32px 24px; position: relative; z-index: 1; }

  /* HEADER */
  .td-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 28px; margin-bottom: 32px; border-bottom: 1px solid var(--border); animation: slideDown 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  .td-brand { display: flex; align-items: center; gap: 14px; }
  .td-brand-icon { width: 40px; height: 40px; border-radius: 11px; background: linear-gradient(135deg, var(--teal), #0099ff); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; color: #000; box-shadow: 0 0 20px rgba(0,212,170,0.25); }
  .td-brand-name { font-size: 20px; font-weight: 800; letter-spacing: -0.3px; }
  .td-brand-sub { font-size: 11px; color: var(--subtle); margin-top: 3px; font-weight: 500; }

  .td-eyebrow { display: flex; align-items: center; gap: 7px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--teal); font-family: 'DM Mono', monospace; }
  .td-live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--teal); box-shadow: 0 0 8px var(--teal); animation: pulseDot 1.4s ease-in-out infinite; }
  @keyframes pulseDot { 0%,100% { opacity:1; } 50% { opacity:0.25; } }

  .td-class-badge { display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px; border-radius: 10px; background: var(--teal-dim); border: 1px solid rgba(0,212,170,0.2); font-size: 12px; font-weight: 700; color: var(--teal); font-family: 'DM Mono', monospace; letter-spacing: 0.05em; }
  .td-class-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--teal); animation: pulseDot 1.4s infinite; }

  /* STATS */
  .td-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
  .td-stat { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px 22px; position: relative; overflow: hidden; transition: border-color 0.25s, transform 0.2s; }
  .td-stat::before { content: ''; position: absolute; inset: 0; opacity: 0; transition: opacity 0.3s; }
  .td-stat:hover { border-color: var(--border-bright); transform: translateY(-2px); }
  .td-stat:hover::before { opacity: 1; }
  .td-stat.blue::before { background: linear-gradient(135deg, rgba(96,165,250,0.06), transparent); }
  .td-stat.green::before { background: linear-gradient(135deg, rgba(52,211,153,0.06), transparent); }
  .td-stat.red::before { background: linear-gradient(135deg, rgba(252,96,96,0.06), transparent); }
  .td-stat.warn::before { background: linear-gradient(135deg, rgba(246,173,85,0.06), transparent); }
  .td-stat-accent { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; border-radius: 0 0 var(--radius) var(--radius); }
  .td-stat.blue .td-stat-accent { background: linear-gradient(90deg, var(--blue), #818cf8); }
  .td-stat.green .td-stat-accent { background: linear-gradient(90deg, var(--green), var(--teal)); }
  .td-stat.red .td-stat-accent { background: linear-gradient(90deg, var(--red), #fb7185); }
  .td-stat.warn .td-stat-accent { background: linear-gradient(90deg, var(--amber), #fbbf24); }
  .td-stat-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 12px; }
  .td-stat-value { font-size: 38px; font-weight: 800; font-family: 'DM Mono', monospace; letter-spacing: -1.5px; line-height: 1; margin-bottom: 6px; transition: color 0.4s; }
  .td-stat.blue .td-stat-value { color: var(--blue); }
  .td-stat.green .td-stat-value { color: var(--green); }
  .td-stat.red .td-stat-value { color: var(--red); }
  .td-stat.warn .td-stat-value { color: var(--amber); }
  .td-stat-sub { font-size: 11px; color: var(--muted); font-family: 'DM Mono', monospace; }

  /* FEED PANEL */
  .td-feed-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 28px; animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
  .td-feed-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
  .td-feed-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); }
  .td-feed-count { font-size: 10px; font-weight: 700; color: var(--subtle); font-family: 'DM Mono', monospace; background: rgba(255,255,255,0.04); border: 1px solid var(--border); padding: 4px 12px; border-radius: 8px; }

  .td-student-list { display: flex; flex-direction: column; gap: 10px; }

  /* Normal student rows */
  .td-student { display: flex; align-items: center; gap: 16px; padding: 16px 18px; border-radius: var(--radius); border: 1px solid; transition: all 0.2s ease; cursor: default; }
  .td-student.ok { background: rgba(255,255,255,0.02); border-color: var(--border); }
  .td-student.ok:hover { background: var(--surface-hover); border-color: var(--border-bright); }
  .td-student.alert { background: var(--red-dim); border-color: rgba(252,96,96,0.18); }
  .td-student.alert:hover { background: rgba(252,96,96,0.1); border-color: rgba(252,96,96,0.3); }

  /* Rafay live rows */
  .td-student.live-focused {
    background: rgba(0,212,170,0.04);
    border-color: rgba(0,212,170,0.28);
    box-shadow: 0 0 24px rgba(0,212,170,0.06);
  }
  .td-student.live-focused:hover { background: rgba(0,212,170,0.07); border-color: rgba(0,212,170,0.4); }
  .td-student.live-distracted {
    background: rgba(252,96,96,0.05);
    border-color: rgba(252,96,96,0.28);
    animation: alertPulse 2s ease-in-out infinite;
  }
  @keyframes alertPulse { 0%,100% { box-shadow: 0 0 16px rgba(252,96,96,0.06); } 50% { box-shadow: 0 0 32px rgba(252,96,96,0.16); } }

  /* Avatars */
  .td-avatar { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; font-family: 'DM Mono', monospace; flex-shrink: 0; letter-spacing: 0.05em; }
  .td-avatar.ok { background: var(--teal-dim); color: var(--teal); border: 1px solid rgba(0,212,170,0.2); }
  .td-avatar.alert { background: var(--red-dim); color: var(--red); border: 1px solid rgba(252,96,96,0.2); }
  .td-avatar.live-focused { background: rgba(0,212,170,0.15); color: var(--teal); border: 1px solid rgba(0,212,170,0.4); box-shadow: 0 0 12px rgba(0,212,170,0.2); }
  .td-avatar.live-distracted { background: rgba(252,96,96,0.15); color: var(--red); border: 1px solid rgba(252,96,96,0.4); box-shadow: 0 0 12px rgba(252,96,96,0.2); }

  .td-student-info { flex: 1; min-width: 0; }
  .td-student-name { font-size: 14px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; display: flex; align-items: center; gap: 8px; }
  .td-student-id { font-size: 10px; color: var(--muted); font-family: 'DM Mono', monospace; font-weight: 500; letter-spacing: 0.08em; }
  .td-state-text { font-size: 10px; color: var(--subtle); font-family: 'DM Mono', monospace; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }

  /* Live badge next to name */
  .live-name-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 8px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 2px 8px; border-radius: 5px; font-family: 'DM Mono', monospace; background: var(--teal-dim); color: var(--teal); border: 1px solid rgba(0,212,170,0.25); }
  .live-name-badge-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--teal); animation: pulseDot 1.2s infinite; }

  .td-bar-wrap { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
  .td-bar-track { width: 120px; height: 4px; background: rgba(255,255,255,0.07); border-radius: 4px; overflow: hidden; }
  .td-bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1); }
  .td-score-label { font-size: 13px; font-weight: 800; font-family: 'DM Mono', monospace; min-width: 36px; text-align: right; letter-spacing: -0.5px; }
  .td-chip { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 3px 10px; border-radius: 6px; font-family: 'DM Mono', monospace; white-space: nowrap; }
  .td-chip.ok { background: rgba(0,212,170,0.1); color: var(--teal); border: 1px solid rgba(0,212,170,0.18); }
  .td-chip.alert { background: var(--red-dim); color: var(--red); border: 1px solid rgba(252,96,96,0.2); }
  .td-chip.live-focused { background: rgba(0,212,170,0.12); color: var(--teal); border: 1px solid rgba(0,212,170,0.3); }
  .td-chip.live-distracted { background: var(--red-dim); color: var(--red); border: 1px solid rgba(252,96,96,0.3); }

  /* Connecting state */
  .td-chip.connecting { background: rgba(246,173,85,0.12); color: var(--amber); border: 1px solid rgba(246,173,85,0.25); }

  /* KEYFRAMES */
  @keyframes slideUp { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: none; } }
  @keyframes slideDown { from { opacity:0; transform: translateY(-16px); } to { opacity:1; transform: none; } }

  /* RESPONSIVE */
  @media (max-width: 720px) { .td-stats { grid-template-columns: 1fr 1fr; } .td-header { flex-direction: column; align-items: flex-start; gap: 16px; } .td-bar-track { width: 80px; } }
  @media (max-width: 480px) { .td-wrap { padding: 20px 16px; } .td-stats { grid-template-columns: 1fr; } .td-chip { display: none; } }
`;

export default function TeacherDashboard() {
  const [classFocus, setClassFocus]           = useState(82);
  const [distractedStudents, setDistractedStudents] = useState(2);

  // ── Rafay live state (from WebSocket) ──
  const [rafayScore, setRafayScore]   = useState(null);   // null = connecting
  const [rafayState, setRafayState]   = useState('Connecting...');
  const [rafayWsOk,  setRafayWsOk]   = useState(false);
  const socketRef = useRef(null);

  // Class-wide interval (unchanged)
  useEffect(() => {
    const interval = setInterval(() => {
      setClassFocus(Math.floor(Math.random() * (88 - 75 + 1) + 75));
      setDistractedStudents(Math.floor(Math.random() * 4));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket — same endpoint as AttentionDashboard
  useEffect(() => {
    socketRef.current = new WebSocket(SOCKET_URL);

    socketRef.current.onopen = () => {
      setRafayWsOk(true);
      setRafayState('Connection Established.');
    };

    socketRef.current.onerror = () => {
      setRafayWsOk(false);
      setRafayState('Network Error.');
    };

    socketRef.current.onclose = () => {
      setRafayWsOk(false);
      setRafayState('Disconnected.');
    };

    const emojiRx = /[\u{1F600}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setRafayScore(data.focus_score);
        setRafayState(data.student_state.replace(emojiRx, '').trim());
      } catch (e) { console.error('WS parse error:', e); }
    };

    return () => socketRef.current?.close();
  }, []);

  // Static students list (other students)
  const staticStudents = [
    { name: 'Ali Khan',       id: '102', score: 90, focused: true  },
    { name: 'Muneeba Tariq',  id: '105', score: 85, focused: true  },
    { name: 'Hamza Siddiqui',id: '118', score: 35, focused: false },
    { name: 'Sara Ahmed',     id: '121', score: 78, focused: true  },
    { name: 'Bilal Raza',     id: '134', score: 22, focused: false },
  ];

  const activeCount  = 30 - distractedStudents;
  const initials = (name) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Rafay derived values
  const rafayConnecting  = rafayScore === null;
  const rafayFocused     = !rafayConnecting && rafayScore >= 70;
  const rafayBarColor    = rafayConnecting ? 'var(--amber)' : rafayScore >= 75 ? 'var(--teal)' : rafayScore >= 50 ? 'var(--amber)' : 'var(--red)';
  const rafayRowClass    = rafayConnecting ? 'ok' : rafayFocused ? 'live-focused' : 'live-distracted';
  const rafayAvatarClass = rafayConnecting ? 'ok' : rafayFocused ? 'live-focused' : 'live-distracted';
  const rafayChipClass   = rafayConnecting ? 'connecting' : rafayFocused ? 'live-focused' : 'live-distracted';
  const rafayChipLabel   = rafayConnecting ? 'Connecting…' : rafayFocused ? 'Focused' : 'Distracted';

  return (
    <>
      <style>{globalStyles}</style>

      <div className="td-root">
        <div className="blob blob-1" />
        <div className="blob blob-2" />

        <div className="td-wrap">

          {/* ── HEADER ── */}
          <header className="td-header">
            <div className="td-brand">
              <div className="td-brand-icon">S</div>
              <div>
                <div className="td-brand-name">ProctorIQ </div>
                <div className="td-brand-sub">Educator Analytics Panel</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="td-eyebrow">
                <div className="td-live-dot" />
                Live Session
              </div>
              <div className="td-class-badge">
                <span className="td-class-dot" />
                CS-401 · 30 Students
              </div>
            </div>
          </header>

          {/* ── STATS ── */}
          <div className="td-stats">
            <div className="td-stat blue">
              <div className="td-stat-accent" />
              <div className="td-stat-label">Class Avg Focus</div>
              <div className="td-stat-value">{classFocus}%</div>
              <div className="td-stat-sub">above threshold</div>
            </div>
            <div className="td-stat green">
              <div className="td-stat-accent" />
              <div className="td-stat-label">Active Learners</div>
              <div className="td-stat-value">{activeCount}</div>
              <div className="td-stat-sub">of 30 students</div>
            </div>
            <div className={`td-stat ${distractedStudents > 2 ? 'red' : 'warn'}`}>
              <div className="td-stat-accent" />
              <div className="td-stat-label">Needs Attention</div>
              <div className="td-stat-value">{distractedStudents}</div>
              <div className="td-stat-sub">{distractedStudents > 2 ? 'intervention needed' : 'monitoring'}</div>
            </div>
          </div>

          {/* ── STUDENT FEED ── */}
          <div className="td-feed-panel">
            <div className="td-feed-header">
              <span className="td-feed-title">Live Student Feed</span>
              <span className="td-feed-count">{staticStudents.length + 1} shown</span>
            </div>

            <div className="td-student-list">

              {/* ── RAFAY KHALIL — Real-time WebSocket row (pinned first) ── */}
              <div className={`td-student ${rafayRowClass}`}>
                <div className={`td-avatar ${rafayAvatarClass}`}>RK</div>

                <div className="td-student-info">
                  <div className="td-student-name">
                    Rafay Khalil
                    <span className="live-name-badge">
                      <span className="live-name-badge-dot" />
                      LIVE
                    </span>
                  </div>
                  <div className="td-student-id">ID · {RAFAY_ID}</div>
                  <div className="td-state-text">{rafayState}</div>
                </div>

                <div className="td-bar-wrap">
                  <div className="td-bar-track">
                    <div
                      className="td-bar-fill"
                      style={{
                        width: rafayConnecting ? '0%' : `${rafayScore}%`,
                        background: rafayBarColor,
                      }}
                    />
                  </div>
                  <div className="td-score-label" style={{ color: rafayBarColor }}>
                    {rafayConnecting ? '--' : `${rafayScore}%`}
                  </div>
                  <div className={`td-chip ${rafayChipClass}`}>{rafayChipLabel}</div>
                </div>
              </div>

              {/* ── Static students ── */}
              {staticStudents.map((s) => {
                const barColor = s.score >= 75 ? 'var(--teal)' : s.score >= 50 ? 'var(--amber)' : 'var(--red)';
                const type = s.focused ? 'ok' : 'alert';
                return (
                  <div key={s.id} className={`td-student ${type}`}>
                    <div className={`td-avatar ${type}`}>{initials(s.name)}</div>
                    <div className="td-student-info">
                      <div className="td-student-name">{s.name}</div>
                      <div className="td-student-id">ID · {s.id}</div>
                    </div>
                    <div className="td-bar-wrap">
                      <div className="td-bar-track">
                        <div className="td-bar-fill" style={{ width: `${s.score}%`, background: barColor }} />
                      </div>
                      <div className="td-score-label" style={{ color: barColor }}>{s.score}%</div>
                      <div className={`td-chip ${type}`}>{s.focused ? 'Focused' : 'Distracted'}</div>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

        </div>
      </div>
    </>
  );
}