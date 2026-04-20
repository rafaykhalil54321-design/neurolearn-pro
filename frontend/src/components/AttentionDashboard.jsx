import React, { useEffect, useState, useRef } from 'react';

// CONFIGURATION
const SOCKET_URL = "wss://neurolearn-pro-production.up.railway.app/ws/attention";
const STUDENT_NAME = "Rafay Khalil";

// ─── ANIMATED BACKGROUND ───────────────────────────────────────────────────
const AnimatedBG = ({ score }) => {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let frame = 0;
    let W, H;
    let pts = [];

    const GRID = 65;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      pts = Array.from({ length: 70 }, () => ({
        x:     Math.random() * W,
        y:     Math.random() * H,
        vx:    (Math.random() - 0.5) * 0.5,
        vy:    (Math.random() - 0.5) * 0.5,
        r:     Math.random() * 2 + 0.8,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Score-reactive accent
      const accentR = score >= 80 ? '0,229,184' : score >= 50 ? '251,191,36' : '248,113,113';

      // Base background
      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, W, H);

      // Grid lines — score-tinted
      ctx.lineWidth = 1;
      for (let x = 0; x <= W; x += GRID) {
        const a = 0.055 + 0.035 * Math.sin(frame * 0.005 + x * 0.01);
        ctx.strokeStyle = `rgba(${accentR},${a})`;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y <= H; y += GRID) {
        const a = 0.055 + 0.035 * Math.sin(frame * 0.005 + y * 0.01);
        ctx.strokeStyle = `rgba(${accentR},${a})`;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Grid intersection dots
      for (let x = 0; x <= W; x += GRID) {
        for (let y = 0; y <= H; y += GRID) {
          const pulse = Math.sin(frame * 0.012 + x * 0.008 + y * 0.008);
          const a = 0.10 + pulse * 0.09;
          ctx.beginPath();
          ctx.arc(x, y, 1.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${accentR},${a})`;
          ctx.fill();
        }
      }

      // Particles + connections
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.phase += 0.02;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const alpha = 0.38 + Math.sin(p.phase) * 0.28;

        pts.forEach(q => {
          const dx = p.x - q.x, dy = p.y - q.y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 130 && d > 0) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${accentR},${(1 - d / 130) * 0.16})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        });

        ctx.shadowColor = `rgba(${accentR},0.7)`;
        ctx.shadowBlur  = 7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${accentR},${alpha})`;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Ambient glow top-left
      const g1 = ctx.createRadialGradient(W * 0.1, H * 0.15, 0, W * 0.1, H * 0.15, W * 0.45);
      g1.addColorStop(0, `rgba(${accentR},0.065)`);
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

      // Ambient glow bottom-right
      const g2 = ctx.createRadialGradient(W * 0.9, H * 0.85, 0, W * 0.9, H * 0.85, W * 0.4);
      g2.addColorStop(0, 'rgba(96,165,250,0.05)');
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [score]);

  return (
    <canvas
      ref={ref}
      style={{
        position: 'fixed', inset: 0,
        width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none', display: 'block',
      }}
    />
  );
};

// ─── GLOBAL STYLES ─────────────────────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #080c14;
    --bg-2: #0c1220;
    --surface: rgba(255,255,255,0.028);
    --surface-2: rgba(255,255,255,0.05);
    --surface-hover: rgba(255,255,255,0.06);
    --border: rgba(255,255,255,0.065);
    --border-bright: rgba(255,255,255,0.13);
    --text: #e8ecf4;
    --text-2: #a0aec0;
    --muted: #4a5568;
    --subtle: #64748b;

    --teal: #00e5b8;
    --teal-2: #00c4a0;
    --teal-dim: rgba(0,229,184,0.1);
    --teal-glow: rgba(0,229,184,0.2);

    --amber: #fbbf24;
    --amber-dim: rgba(251,191,36,0.1);

    --red: #f87171;
    --red-dim: rgba(248,113,113,0.1);

    --blue: #60a5fa;
    --blue-dim: rgba(96,165,250,0.1);

    --purple: #a78bfa;

    --radius: 12px;
    --radius-lg: 18px;
    --radius-xl: 24px;

    --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
    --shadow-md: 0 4px 20px rgba(0,0,0,0.4);
    --shadow-lg: 0 8px 40px rgba(0,0,0,0.5);
  }

  html, body {
    font-family: 'Outfit', sans-serif;
    -webkit-font-smoothing: antialiased;
    background: var(--bg);
    color: var(--text);
  }

  .syn-root {
    min-height: 100vh;
    background: transparent;
    color: var(--text);
    position: relative;
    overflow-x: hidden;
  }

  /* Grain overlay */
  .syn-root::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9999;
    opacity: 0.22;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
  }

  .syn-wrap {
    max-width: 1220px;
    margin: 0 auto;
    padding: 28px 28px 48px;
    position: relative;
    z-index: 1;
  }

  /* ── HEADER ── */
  .syn-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 24px;
    margin-bottom: 28px;
    border-bottom: 1px solid var(--border);
    animation: fadeSlideDown 0.55s cubic-bezier(0.16,1,0.3,1) both;
  }

  /* LOGO */
  .brand { display: flex; align-items: center; gap: 14px; }
  .logo-mark { width: 44px; height: 44px; position: relative; flex-shrink: 0; }
  .logo-mark svg { width: 44px; height: 44px; }
  .brand-text { display: flex; flex-direction: column; gap: 3px; }
  .brand-name {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.3px;
    color: var(--text);
    line-height: 1;
    font-family: 'Outfit', sans-serif;
  }
  .brand-tagline {
    font-size: 10px;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    line-height: 1;
  }

  /* Status pill */
  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 13px 5px 9px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border: 1px solid;
    transition: all 0.3s ease;
    backdrop-filter: blur(8px);
  }
  .status-pill.live {
    background: rgba(0,229,184,0.08);
    border-color: rgba(0,229,184,0.25);
    color: var(--teal);
  }
  .status-pill.warn {
    background: rgba(251,191,36,0.08);
    border-color: rgba(251,191,36,0.25);
    color: var(--amber);
  }
  .status-pill.crit {
    background: rgba(248,113,113,0.08);
    border-color: rgba(248,113,113,0.3);
    color: var(--red);
  }
  .status-pill.sleep {
    background: rgba(167,139,250,0.08);
    border-color: rgba(167,139,250,0.3);
    color: var(--purple);
  }
  .status-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }
  .status-dot.pulse      { animation: pulseDot 1.8s infinite; }
  .status-dot.pulse-fast { animation: pulseDot 0.7s infinite; }
  @keyframes pulseDot { 0%,100%{opacity:1} 50%{opacity:0.2} }

  .header-right { display: flex; align-items: center; gap: 10px; }

  .subject-chip {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 14px;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border);
    border-radius: 100px;
    font-size: 12px;
    color: var(--text-2);
    backdrop-filter: blur(8px);
    font-family: 'Outfit', sans-serif;
  }
  .subject-avatar {
    width: 20px; height: 20px; border-radius: 50%;
    background: linear-gradient(135deg, var(--teal-2), var(--blue));
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 700; color: #000; flex-shrink: 0;
  }

  .btn {
    padding: 8px 16px;
    border-radius: 9px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid;
    transition: all 0.18s;
    font-family: 'Outfit', sans-serif;
    letter-spacing: 0.01em;
    backdrop-filter: blur(8px);
  }
  .btn-ghost {
    background: rgba(255,255,255,0.04);
    color: var(--text-2);
    border-color: var(--border);
  }
  .btn-ghost:hover {
    background: rgba(255,255,255,0.08);
    border-color: var(--border-bright);
    color: var(--text);
    transform: translateY(-1px);
  }
  .btn-danger {
    background: rgba(248,113,113,0.08);
    color: var(--red);
    border-color: rgba(248,113,113,0.2);
  }
  .btn-danger:hover {
    background: rgba(248,113,113,0.16);
    transform: translateY(-1px);
  }

  /* ── MAIN GRID ── */
  .main-grid {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 18px;
    margin-bottom: 18px;
  }

  /* ── SCORE CARD ── */
  .score-card {
    background: rgba(8,12,20,0.72);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 28px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    animation: fadeSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both;
    transition: border-color 0.3s, box-shadow 0.3s;
    position: relative;
    overflow: hidden;
  }
  .score-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--teal-glow), transparent);
    opacity: 0.6;
  }
  .score-card.warn  { border-color: rgba(251,191,36,0.22); }
  .score-card.crit  { border-color: rgba(248,113,113,0.28); box-shadow: 0 0 40px rgba(248,113,113,0.06); }
  .score-card.sleep { border-color: rgba(167,139,250,0.28); box-shadow: 0 0 40px rgba(167,139,250,0.06); }

  .score-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
    align-self: flex-start;
    width: 100%;
  }

  .ring-wrap { position: relative; }
  .ring-svg { display: block; }
  .ring-track     { fill: none; stroke: rgba(255,255,255,0.04); stroke-width: 7; }
  .ring-bg-fill   { fill: none; stroke-width: 7; stroke-linecap: round; opacity: 0.08; }
  .ring-fill      { fill: none; stroke-width: 7; stroke-linecap: round; transition: stroke-dashoffset 0.8s cubic-bezier(0.34,1.56,0.64,1), stroke 0.4s; }
  .ring-val       { font-family: 'JetBrains Mono', monospace; font-weight: 500; transition: fill 0.4s; }
  .ring-pct       { font-family: 'Outfit', sans-serif; font-weight: 400; }

  .state-badge {
    width: 100%;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 11px;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-align: center;
    border: 1px solid;
    transition: all 0.3s;
  }
  .state-badge.ok     { background: var(--teal-dim);              border-color: rgba(0,229,184,0.2);   color: var(--teal); }
  .state-badge.warn   { background: var(--amber-dim);             border-color: rgba(251,191,36,0.2);  color: var(--amber); }
  .state-badge.crit   { background: var(--red-dim);               border-color: rgba(248,113,113,0.2); color: var(--red); }
  .state-badge.sleep  { background: rgba(167,139,250,0.1);        border-color: rgba(167,139,250,0.2); color: var(--purple); }
  .state-badge.mobile { background: rgba(96,165,250,0.1);         border-color: rgba(96,165,250,0.2);  color: var(--blue); }

  /* ── METRICS COLUMN ── */
  .metrics-col { display: flex; flex-direction: column; gap: 18px; }
  .metrics-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }

  .metric-card {
    background: rgba(8,12,20,0.72);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 18px 20px;
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
    animation: fadeSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
    position: relative;
    overflow: hidden;
  }
  .metric-card:hover {
    border-color: var(--border-bright);
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.25);
  }
  .metric-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
    margin-bottom: 10px;
    display: flex; align-items: center; gap: 6px;
  }
  .metric-icon { font-size: 11px; opacity: 0.6; }
  .metric-value {
    font-size: 28px;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: -0.5px;
    line-height: 1;
    transition: color 0.4s;
  }
  .metric-sub { font-size: 10px; color: var(--muted); margin-top: 6px; font-family: 'JetBrains Mono', monospace; }
  .metric-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: var(--border); overflow: hidden; }
  .metric-bar-fill { height: 100%; border-radius: 1px; transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1), background 0.4s; }

  /* ── SPARKLINE PANEL ── */
  .spark-panel {
    background: rgba(8,12,20,0.5);
    backdrop-filter: blur(12px);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px 22px;
    flex: 1;
  }
  .spark-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 16px;
  }
  .spark-title {
    font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--muted); font-family: 'JetBrains Mono', monospace;
  }
  .spark-range { font-size: 10px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
  .spark-bars { display: flex; align-items: flex-end; gap: 2.5px; height: 60px; }
  .spark-bar {
    flex: 1; min-width: 3px;
    border-radius: 2px 2px 0 0;
    transition: height 0.4s cubic-bezier(0.34,1.56,0.64,1), background 0.4s;
  }
  .spark-time {
    display: flex; justify-content: space-between;
    margin-top: 8px; font-size: 10px; color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
  }

  /* ── TELEMETRY PANEL ── */
  .tele-panel {
    background: rgba(8,12,20,0.72);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 26px 28px;
    margin-bottom: 18px;
    transition: border-color 0.3s, box-shadow 0.3s;
    animation: fadeSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s both;
  }
  .tele-panel.crit  { border-color: rgba(248,113,113,0.3); box-shadow: 0 0 50px rgba(248,113,113,0.05); }
  .tele-panel.warn  { border-color: rgba(251,191,36,0.25); box-shadow: 0 0 40px rgba(251,191,36,0.04); }
  .tele-panel.sleep { border-color: rgba(167,139,250,0.28); box-shadow: 0 0 40px rgba(167,139,250,0.05); }

  .tele-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 22px;
  }
  .tele-title {
    font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
  }
  .tele-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; }
  .tele-col { padding: 0 24px; border-right: 1px solid var(--border); }
  .tele-col:first-child { padding-left: 0; }
  .tele-col:last-child  { border-right: none; }
  .tele-col-title {
    font-size: 9px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
    color: var(--muted); font-family: 'JetBrains Mono', monospace;
    margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid var(--border);
  }
  .tele-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 12px;
  }
  .tele-row:last-child { border-bottom: none; }
  .tele-key { color: var(--subtle); font-size: 11px; }
  .tele-val { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text); }

  .badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 2px 9px; border-radius: 100px;
    font-size: 10px; font-weight: 600;
    font-family: 'JetBrains Mono', monospace; border: 1px solid;
  }
  .badge-teal   { background: var(--teal-dim);          border-color: rgba(0,229,184,0.2);    color: var(--teal); }
  .badge-amber  { background: var(--amber-dim);          border-color: rgba(251,191,36,0.2);   color: var(--amber); }
  .badge-red    { background: var(--red-dim);            border-color: rgba(248,113,113,0.2);  color: var(--red); }
  .badge-blue   { background: var(--blue-dim);           border-color: rgba(96,165,250,0.2);   color: var(--blue); }
  .badge-purple { background: rgba(167,139,250,0.1);     border-color: rgba(167,139,250,0.2);  color: var(--purple); }
  .badge-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; animation: pulseDot 1.5s infinite; }

  /* MATRIX */
  .matrix-term {
    background: #010208;
    border: 1px solid rgba(0,229,184,0.1);
    border-radius: 10px; padding: 18px 20px; height: 180px; overflow: hidden;
    font-family: 'JetBrains Mono', monospace; color: var(--teal);
    font-size: 11px; line-height: 1.75;
    box-shadow: inset 0 0 40px rgba(0,229,184,0.02);
  }

  /* ALERT BANNERS */
  .alert-banner {
    margin-top: 18px; padding: 12px 16px; border-radius: 9px;
    display: flex; align-items: center; gap: 10px;
    font-size: 12px; font-weight: 600;
    animation: slideIn 0.3s cubic-bezier(0.16,1,0.3,1);
    font-family: 'JetBrains Mono', monospace; letter-spacing: 0.03em;
    backdrop-filter: blur(8px);
  }
  .alert-crit   { background: var(--red-dim);             border: 1px solid rgba(248,113,113,0.22); color: var(--red); }
  .alert-warn   { background: var(--amber-dim);           border: 1px solid rgba(251,191,36,0.22);  color: var(--amber); }
  .alert-sleep  { background: rgba(167,139,250,0.08);     border: 1px solid rgba(167,139,250,0.22); color: var(--purple); }
  .alert-mobile { background: var(--blue-dim);            border: 1px solid rgba(96,165,250,0.22);  color: var(--blue); }
  @keyframes slideIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }

  /* ── LOGS ── */
  .logs-panel {
    background: rgba(8,12,20,0.72);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 22px 26px;
    animation: fadeSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.25s both;
  }
  .logs-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid var(--border);
  }
  .logs-title {
    font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
  }
  .logs-count {
    font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--muted);
    background: var(--surface-2); border: 1px solid var(--border);
    border-radius: 6px; padding: 2px 8px;
  }
  .log-item {
    display: flex; align-items: flex-start; gap: 16px;
    padding: 10px 0; border-bottom: 1px solid var(--border);
    font-size: 12px; animation: slideIn 0.25s ease;
  }
  .log-item:last-child { border-bottom: none; }
  .log-time {
    font-family: 'JetBrains Mono', monospace; font-size: 10px;
    color: var(--muted); white-space: nowrap; padding-top: 2px; min-width: 72px;
  }
  .log-type-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
  .log-name     { font-weight: 600; color: var(--text); margin-right: 5px; font-size: 12px; }
  .log-activity { color: var(--subtle); font-size: 12px; }

  .empty-state {
    text-align: center; padding: 32px 0; color: var(--muted);
    font-size: 12px; font-family: 'JetBrains Mono', monospace;
  }
  .empty-icon { font-size: 22px; margin-bottom: 10px; opacity: 0.2; }

  /* ── SUMMARY ── */
  .summary-overlay {
    position: fixed; inset: 0; z-index: 9000;
    background: rgba(0,0,0,0.85); backdrop-filter: blur(20px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
    animation: fadeIn 0.3s ease;
  }
  .summary-card {
    background: rgba(8,12,20,0.96);
    border: 1px solid var(--border-bright);
    border-radius: var(--radius-xl);
    padding: 44px 38px; width: 100%; max-width: 420px; text-align: center;
    animation: fadeSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
    position: relative; overflow: hidden;
    backdrop-filter: blur(20px);
  }
  .summary-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--teal), transparent);
    opacity: 0.4;
  }
  .sum-icon  { font-size: 36px; margin-bottom: 18px; }
  .sum-title { font-size: 26px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.3px; }
  .sum-sub   { color: var(--subtle); font-size: 13px; margin-bottom: 28px; }
  .sum-box {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); margin-bottom: 24px; overflow: hidden; text-align: left;
  }
  .sum-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 13px 18px; border-bottom: 1px solid var(--border);
  }
  .sum-row:last-child { border-bottom: none; }
  .sum-key {
    font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--subtle); font-family: 'JetBrains Mono', monospace;
  }
  .sum-val { font-size: 16px; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: var(--teal); }
  .btn-full {
    width: 100%; padding: 13px; border: none; border-radius: 10px;
    cursor: pointer; font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 600;
    background: linear-gradient(135deg, var(--teal), #0088ff);
    color: #000; transition: opacity 0.2s, transform 0.15s;
  }
  .btn-full:hover { opacity: 0.88; transform: translateY(-1px); }

  /* KEYFRAMES */
  @keyframes fadeSlideUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
  @keyframes fadeSlideDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:none} }
  @keyframes fadeIn        { from{opacity:0} to{opacity:1} }

  /* RESPONSIVE */
  @media (max-width: 960px) {
    .main-grid { grid-template-columns: 1fr; }
    .score-card { flex-direction: row; align-items: flex-start; }
    .tele-grid { grid-template-columns: 1fr 1fr; }
    .tele-col:nth-child(2) { border-right: none; }
    .tele-col:nth-child(3) { grid-column: 1/-1; padding: 16px 0 0; border-right: none; border-top: 1px solid var(--border); }
    .metrics-row { grid-template-columns: 1fr 1fr 1fr; }
  }
  @media (max-width: 700px) {
    .syn-wrap { padding: 16px 16px 36px; }
    .syn-header { flex-direction: column; align-items: flex-start; gap: 14px; }
    .header-right { width: 100%; justify-content: space-between; }
    .metrics-row { grid-template-columns: 1fr 1fr; }
    .tele-grid { grid-template-columns: 1fr; }
    .tele-col { padding: 14px 0; border-right: none; border-bottom: 1px solid var(--border); }
    .tele-col:last-child { border-bottom: none; }
    .summary-card { padding: 32px 22px; }
  }
`;

// ─── LOGO SVG ──────────────────────────────────────────────────────────────
const SynapseLogo = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="44" height="44" rx="12" fill="url(#logoGrad)" />
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%"   stopColor="#00e5b8" />
        <stop offset="100%" stopColor="#0088ff" />
      </linearGradient>
    </defs>
    <circle cx="22" cy="22" r="4"   fill="#000" opacity="0.85" />
    <circle cx="22" cy="10" r="2.2" fill="#000" opacity="0.7" />
    <circle cx="32" cy="16" r="2.2" fill="#000" opacity="0.7" />
    <circle cx="32" cy="28" r="2.2" fill="#000" opacity="0.7" />
    <circle cx="22" cy="34" r="2.2" fill="#000" opacity="0.7" />
    <circle cx="12" cy="28" r="2.2" fill="#000" opacity="0.7" />
    <circle cx="12" cy="16" r="2.2" fill="#000" opacity="0.7" />
    <line x1="22" y1="18"   x2="22" y2="12.2"  stroke="#000" strokeWidth="1.2" opacity="0.55" />
    <line x1="25.4" y1="19.8" x2="30.1" y2="17.2" stroke="#000" strokeWidth="1.2" opacity="0.55" />
    <line x1="25.4" y1="24.2" x2="30.1" y2="26.8" stroke="#000" strokeWidth="1.2" opacity="0.55" />
    <line x1="22" y1="26"   x2="22" y2="31.8"  stroke="#000" strokeWidth="1.2" opacity="0.55" />
    <line x1="18.6" y1="24.2" x2="13.9" y2="26.8" stroke="#000" strokeWidth="1.2" opacity="0.55" />
    <line x1="18.6" y1="19.8" x2="13.9" y2="17.2" stroke="#000" strokeWidth="1.2" opacity="0.55" />
    <circle cx="22" cy="22" r="8" stroke="#000" strokeWidth="0.8" opacity="0.25" strokeDasharray="2 2" />
  </svg>
);

// ─── FOCUS RING ────────────────────────────────────────────────────────────
const FocusRing = ({ score, stateClass }) => {
  const r = 68;
  const circ = 2 * Math.PI * r;
  const filled = circ * (score / 100);
  const color = stateClass === 'sleep' ? 'var(--purple)'
    : score >= 80 ? 'var(--teal)'
    : score >= 50 ? 'var(--amber)'
    : 'var(--red)';

  return (
    <svg className="ring-svg" width="170" height="170" viewBox="0 0 170 170">
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <circle className="ring-track"   cx="85" cy="85" r={r} />
      <circle className="ring-bg-fill" cx="85" cy="85" r={r}
        strokeDasharray={`${circ} 0`} strokeDashoffset={circ * 0.25}
        style={{ stroke: color }} />
      <circle className="ring-fill" cx="85" cy="85" r={r}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ * 0.25}
        style={{ stroke: color }} />
      <text x="85" y="78"  textAnchor="middle" dominantBaseline="middle"
        className="ring-val" fontSize="36" style={{ fill: color }}>{score}</text>
      <text x="85" y="100" textAnchor="middle"
        className="ring-pct" fontSize="11" fill="var(--muted)">FOCUS SCORE</text>
    </svg>
  );
};

// ─── SPARKLINE ────────────────────────────────────────────────────────────
const Sparkline = ({ history }) => {
  const pts = history.slice(-36);
  return (
    <div className="spark-panel">
      <div className="spark-header">
        <span className="spark-title">Session Trend</span>
        <span className="spark-range">
          {pts.length > 0 ? `${pts.length} samples` : 'Awaiting data'}
        </span>
      </div>
      <div className="spark-bars">
        {pts.length === 0
          ? Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="spark-bar" style={{ height: '3px', background: 'var(--border)' }} />
            ))
          : pts.map((p, i) => {
              const h  = Math.max(3, (p.score / 100) * 60);
              const bg = p.score >= 80 ? 'var(--teal)' : p.score >= 50 ? 'var(--amber)' : 'var(--red)';
              return (
                <div key={i} className="spark-bar"
                  style={{ height: `${h}px`, background: bg, opacity: 0.35 + (i / pts.length) * 0.65 }} />
              );
            })}
      </div>
      <div className="spark-time">
        <span>{pts.length > 0 ? pts[0].time : '--:--'}</span>
        <span>{pts.length > 0 ? pts[pts.length - 1].time : '--:--'}</span>
      </div>
    </div>
  );
};

// ─── METRIC CARD ─────────────────────────────────────────────────────────
const MetricCard = ({ label, icon, value, color, sub, barPct, delay }) => (
  <div className="metric-card" style={{ animationDelay: delay }}>
    <div className="metric-label">
      <span className="metric-icon">{icon}</span>
      {label}
    </div>
    <div className="metric-value" style={{ color: color || 'var(--text)' }}>{value}</div>
    {sub && <div className="metric-sub">{sub}</div>}
    {barPct !== undefined && (
      <div className="metric-bar">
        <div className="metric-bar-fill"
          style={{ width: `${Math.min(100, barPct)}%`, background: color || 'var(--teal)' }} />
      </div>
    )}
  </div>
);

// ─── DETECT STATE HELPERS ─────────────────────────────────────────────────
const detectSleep    = s => s.toLowerCase().includes('sleep')        || s.toLowerCase().includes('drowsy');
const detectMobile   = s => s.toLowerCase().includes('mobile')       || s.toLowerCase().includes('phone')  || s.toLowerCase().includes('device') || s.toLowerCase().includes('cell');
const detectNotFound = s => s.toLowerCase().includes('not detected') || s.toLowerCase().includes('no face');
const detectSpoofing = s => s.toLowerCase().includes('spoof')        || s.toLowerCase().includes('mask');

// ─── SUMMARY SCREEN ───────────────────────────────────────────────────────
const SummaryScreen = ({ xp, maxStreak, sessionHistory, onReset }) => {
  const avg = sessionHistory.length > 0
    ? Math.round(sessionHistory.reduce((a, b) => a + b.score, 0) / sessionHistory.length) : 0;
  const grade = avg >= 85 ? 'Excellent' : avg >= 70 ? 'Good' : avg >= 50 ? 'Fair' : 'Needs Work';
  return (
    <div className="summary-overlay">
      <div className="summary-card">
        <div className="sum-icon">⚡</div>
        <div className="sum-title">Session Complete</div>
        <div className="sum-sub">Analytics recorded — {STUDENT_NAME}</div>
        <div className="sum-box">
          <div className="sum-row"><span className="sum-key">Session XP</span><span className="sum-val">+{xp}</span></div>
          <div className="sum-row"><span className="sum-key">Avg Focus</span><span className="sum-val">{avg}%</span></div>
          <div className="sum-row"><span className="sum-key">Peak Flow</span><span className="sum-val">{maxStreak}s</span></div>
          <div className="sum-row"><span className="sum-key">Rating</span><span className="sum-val" style={{ fontSize: '13px' }}>{grade}</span></div>
        </div>
        <button className="btn-full" onClick={onReset}>Return to Dashboard →</button>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
const AttentionDashboard = () => {
  const [currentScore,   setCurrentScore]   = useState(100);
  const [isDistracted,   setIsDistracted]   = useState(false);
  const [studentState,   setStudentState]   = useState("System Standby...");
  const [streak,         setStreak]         = useState(0);
  const [maxStreak,      setMaxStreak]      = useState(0);
  const [xp,             setXp]             = useState(120);
  const [showSummary,    setShowSummary]    = useState(false);
  const [isMatrixMode,   setIsMatrixMode]   = useState(false);
  const [matrixData,     setMatrixData]     = useState("");
  const [incidentLogs,   setIncidentLogs]   = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);

  const socketRef = useRef(null);
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  // Derived state detection
  const isSleeping  = detectSleep(studentState);
  const isMobile    = detectMobile(studentState);
  const isNotFound  = detectNotFound(studentState);
  const isSpoofing  = detectSpoofing(studentState);
  const isCritical  = isNotFound || isSpoofing;

  const stateClass = isSleeping  ? 'sleep'
    : isMobile   ? 'mobile'
    : isCritical ? 'crit'
    : isDistracted ? 'warn'
    : 'ok';

  const pillClass = isSleeping  ? 'sleep'
    : isMobile   ? 'live'
    : isCritical ? 'crit'
    : isDistracted ? 'warn'
    : 'live';

  const statusLabel = isSleeping  ? 'SLEEP DETECTED'
    : isMobile   ? 'MOBILE DEVICE'
    : isSpoofing ? 'SPOOFING ALERT'
    : isNotFound ? 'SUBJECT ABSENT'
    : isDistracted ? 'DISTRACTED'
    : studentState.replace('System Standby...', 'LIVE MONITORING');

  const scoreColor = isSleeping ? 'var(--purple)'
    : currentScore >= 80 ? 'var(--teal)'
    : currentScore >= 50 ? 'var(--amber)'
    : 'var(--red)';

  // Matrix generator
  useEffect(() => {
    if (!isMatrixMode) return;
    const id = setInterval(() => {
      const h1  = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      const h2  = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      const lat = (Math.random() * 5 + 2).toFixed(2);
      const line = `> [SYS_OK] YAW:${(Math.random()*0.4).toFixed(3)} PITCH:${(Math.random()*0.6).toFixed(3)}\n` +
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
    socketRef.current.onopen  = () => setStudentState("Connection Established");
    socketRef.current.onerror = () => setStudentState("Network Error");

    navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
      .then(stream => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
      })
      .catch(() => setStudentState("Camera Authentication Failed"));

    const emojiRx = /[\u{1F600}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;

    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setCurrentScore(data.focus_score);
        const cleanState = data.student_state.replace(emojiRx, '').trim();
        setStudentState(cleanState);
        setIsDistracted(data.focus_score < 70);
        if (data.incident_logs) setIncidentLogs(data.incident_logs);
        setSessionHistory(prev => [...prev, {
          time:  new Date().toLocaleTimeString(),
          score: data.focus_score,
          state: cleanState
        }]);
        if (data.focus_score >= 80) {
          setStreak(prev => {
            const n = prev + 1;
            setMaxStreak(m => n > m ? n : m);
            if (n % 50 === 0) setXp(x => x + 100);
            return n;
          });
        } else if (data.focus_score < 50) {
          setStreak(0);
        }
      } catch (e) { console.error("Parse error:", e); }
    };

    const interval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN && videoRef.current?.readyState >= 2) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        socketRef.current.send(canvasRef.current.toDataURL('image/jpeg', 0.5));
      }
    }, 150);

    return () => { clearInterval(interval); socketRef.current?.close(); };
  }, [showSummary]);

  const exportSessionData = () => {
    const emojiRx = /[\u{1F600}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
    let csv = `data:text/csv;charset=utf-8,Session Report: ${STUDENT_NAME}\n\nTime,Activity\n`;
    incidentLogs.forEach(log => { csv += `${log.time},${log.activity.replace(emojiRx, '').trim()}\n`; });
    const link = Object.assign(document.createElement("a"), {
      href: encodeURI(csv), download: `Synapse_${STUDENT_NAME.replace(' ', '_')}.csv`
    });
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const getLogDotColor = (activity) => {
    const a = activity.toLowerCase();
    if (a.includes('sleep') || a.includes('drowsy')) return 'var(--purple)';
    if (a.includes('mobile') || a.includes('phone'))  return 'var(--blue)';
    if (a.includes('spoof')  || a.includes('not detected')) return 'var(--red)';
    return 'var(--amber)';
  };

  // ── SUMMARY ──
  if (showSummary) return (
    <>
      <style>{globalStyles}</style>
      <div className="syn-root">
        <AnimatedBG score={currentScore} />
        <SummaryScreen xp={xp} maxStreak={maxStreak} sessionHistory={sessionHistory}
          onReset={() => window.location.reload()} />
      </div>
    </>
  );

  // ── MAIN DASHBOARD ──
  return (
    <>
      <style>{globalStyles}</style>
      <div className="syn-root">

        {/* Animated canvas background */}
        <AnimatedBG score={currentScore} />

        {/* Hidden camera elements */}
        <video ref={videoRef} width="320" height="240" autoPlay playsInline muted
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -10 }} />
        <canvas ref={canvasRef} width="320" height="240"
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -10 }} />

        <div className="syn-wrap">

          {/* ── HEADER ── */}
          <header className="syn-header">
            <div className="brand">
              <div className="logo-mark"><SynapseLogo /></div>
              <div className="brand-text">
                <div className="brand-name">Synapse</div>
                <div className="brand-tagline">Cognitive Attention Platform</div>
              </div>
            </div>

            <div className="header-right">
              <div className={`status-pill ${pillClass}`}>
                <div className={`status-dot ${isCritical ? 'pulse-fast' : 'pulse'}`} />
                {statusLabel}
              </div>
              <div className="subject-chip">
                <div className="subject-avatar">
                  {STUDENT_NAME.split(' ').map(n => n[0]).join('')}
                </div>
                {STUDENT_NAME}
              </div>
              <button className="btn btn-ghost" onClick={() => setIsMatrixMode(m => !m)}>
                {isMatrixMode ? 'Standard' : 'Matrix'}
              </button>
              <button className="btn btn-danger" onClick={() => setShowSummary(true)}>
                End Session
              </button>
            </div>
          </header>

          {/* ── MAIN GRID ── */}
          <div className="main-grid">

            {/* Score Card */}
            <div className={`score-card ${stateClass}`}>
              <div className="score-label">Attention Monitor</div>
              <FocusRing score={currentScore} stateClass={stateClass} />
              <Sparkline history={sessionHistory} />
              <div className={`state-badge ${stateClass}`}>
                {isSleeping   ? '💤 Sleep Detected'
                : isMobile    ? '📱 Mobile Usage Detected'
                : isSpoofing  ? '⚠ Spoofing Alert'
                : isNotFound  ? '⊘ Subject Not Detected'
                : isDistracted? '◈ Distraction Detected'
                : '◉ ' + (studentState.includes('Established') ? 'Active & Focused' : studentState)}
              </div>
            </div>

            {/* Metrics column */}
            <div className="metrics-col">
              <div className="metrics-row">
                <MetricCard label="Cognitive Score" icon="◎"
                  value={`${currentScore}%`} color={scoreColor}
                  sub="Real-time" barPct={currentScore} delay="0.12s" />
                <MetricCard label="Flow Streak" icon="⚡"
                  value={`${streak}s`} color="var(--text)"
                  sub="Current run" barPct={(streak / Math.max(maxStreak, 1)) * 100} delay="0.16s" />
                <MetricCard label="Session XP" icon="◈"
                  value={xp} color="var(--amber)"
                  sub={xp >= 220 ? 'Bonus active' : 'Accumulating'} delay="0.2s" />
              </div>
              <div className="metrics-row">
                <MetricCard label="Peak Flow" icon="▲"
                  value={`${maxStreak}s`} color="var(--blue)"
                  sub="Session best" delay="0.14s" />
                <MetricCard label="Incidents" icon="◉"
                  value={incidentLogs.length}
                  color={incidentLogs.length > 0 ? 'var(--amber)' : 'var(--text)'}
                  sub="This session" delay="0.18s" />
                <MetricCard label="Data Points" icon="≡"
                  value={sessionHistory.length}
                  color="var(--subtle)" sub="Samples" delay="0.22s" />
              </div>
            </div>
          </div>

          {/* ── TELEMETRY PANEL ── */}
          <div className={`tele-panel ${isSleeping ? 'sleep' : isMobile ? '' : isCritical ? 'crit' : isDistracted ? 'warn' : ''}`}>
            <div className="tele-header">
              <span className="tele-title">System Telemetry</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--muted)' }}>
                {new Date().toLocaleTimeString()}
              </span>
            </div>

            {isMatrixMode ? (
              <div className="matrix-term"><pre>{matrixData}</pre></div>
            ) : (
              <div className="tele-grid">
                <div className="tele-col">
                  <div className="tele-col-title">Engine</div>
                  <div className="tele-row">
                    <span className="tele-key">Status</span>
                    <span className="badge badge-teal"><span className="badge-dot" />Active / WSS</span>
                  </div>
                  <div className="tele-row">
                    <span className="tele-key">Vision</span>
                    <span className="tele-val">YOLOv8 Nano</span>
                  </div>
                  <div className="tele-row">
                    <span className="tele-key">Latency</span>
                    <span className="tele-val">~12ms</span>
                  </div>
                  <div className="tele-row">
                    <span className="tele-key">Interval</span>
                    <span className="tele-val">150ms</span>
                  </div>
                </div>
                <div className="tele-col">
                  <div className="tele-col-title">Session</div>
                  <div className="tele-row">
                    <span className="tele-key">Subject</span>
                    <span className="tele-val">{STUDENT_NAME}</span>
                  </div>
                  <div className="tele-row">
                    <span className="tele-key">Auth</span>
                    <span className="badge badge-teal">Verified</span>
                  </div>
                  <div className="tele-row">
                    <span className="tele-key">Recording</span>
                    <span className="badge badge-teal"><span className="badge-dot" />Active</span>
                  </div>
                  <div className="tele-row">
                    <span className="tele-key">Duration</span>
                    <span className="tele-val">{Math.round(sessionHistory.length * 0.15)}s</span>
                  </div>
                </div>
                <div className="tele-col">
                  <div className="tele-col-title">Detection State</div>
                  <div className="tele-row">
                    <span className="tele-key">Attention</span>
                    <span className={`badge ${currentScore >= 80 ? 'badge-teal' : currentScore >= 50 ? 'badge-amber' : 'badge-red'}`}>
                      {currentScore}%
                    </span>
                  </div>
                  <div className="tele-row">
                    <span className="tele-key">Sleep</span>
                    <span className={`badge ${isSleeping ? 'badge-purple' : 'badge-teal'}`}>
                      {isSleeping ? 'DETECTED' : 'Clear'}
                    </span>
                  </div>
                  <div className="tele-row">
                    <span className="tele-key">Mobile</span>
                    <span className={`badge ${isMobile ? 'badge-blue' : 'badge-teal'}`}>
                      {isMobile ? 'DETECTED' : 'Clear'}
                    </span>
                  </div>
                  <div className="tele-row">
                    <span className="tele-key">Spoofing</span>
                    <span className={`badge ${isSpoofing ? 'badge-red' : 'badge-teal'}`}>
                      {isSpoofing ? 'ALERT' : 'Clear'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isSleeping && (
              <div className="alert-banner alert-sleep">
                <span>💤</span>
                <span>SLEEP DETECTED — Student appears to be asleep. Immediate attention required.</span>
              </div>
            )}
            {isMobile && !isSleeping && (
              <div className="alert-banner alert-mobile">
                <span>📱</span>
                <span>MOBILE USAGE — Mobile device detected in frame. Student is using a phone.</span>
              </div>
            )}
            {isCritical && !isSleeping && !isMobile && (
              <div className="alert-banner alert-crit">
                <span>⚠</span>
                <span>CRITICAL ALERT — {studentState}</span>
              </div>
            )}
            {!isCritical && !isSleeping && !isMobile && isDistracted && (
              <div className="alert-banner alert-warn">
                <span>◈</span>
                <span>DISTRACTION DETECTED — Refocus required immediately.</span>
              </div>
            )}
          </div>

          {/* ── INCIDENT LOGS ── */}
          <div className="logs-panel">
            <div className="logs-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="logs-title">Incident Logs</span>
                <span className="logs-count">{incidentLogs.length}</span>
              </div>
              {incidentLogs.length > 0 && (
                <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: '11px' }}
                  onClick={exportSessionData}>Export CSV ↓</button>
              )}
            </div>
            {incidentLogs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">◎</div>
                No incidents recorded in current session.
              </div>
            ) : (
              incidentLogs.map((log, i) => {
                const clean = log.activity.replace(/[\u{1F600}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
                return (
                  <div key={i} className="log-item">
                    <span className="log-time">{log.time}</span>
                    <div className="log-type-dot" style={{ background: getLogDotColor(clean) }} />
                    <span>
                      <span className="log-name">{STUDENT_NAME}</span>
                      <span className="log-activity">— {clean}</span>
                    </span>
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