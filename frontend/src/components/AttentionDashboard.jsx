import React, { useEffect, useState, useRef, useCallback } from 'react';

const SOCKET_URL = "ws://localhost:8000/ws/attention";
const STUDENT_NAME = "Rafay Khalil";
const STUDENT_ID_DISPLAY = "099";

// ══════════════════════════════════════════════════════════════
//  THEME TOKENS — Enhanced with fixed light mode
// ══════════════════════════════════════════════════════════════
export const THEME = {
  dark:    '#080c14',
  surface: 'rgba(8,12,20,0.76)',
  glass:   'rgba(12,18,32,0.82)',
  border:  'rgba(255,255,255,0.07)',
  borderB: 'rgba(255,255,255,0.13)',
  text:    '#e8ecf4',
  text2:   '#a0aec0',
  muted:   '#4a5568',
  subtle:  '#64748b',
  teal:    '#00e5b8',
  tealDim: 'rgba(0,229,184,0.10)',
  amber:   '#fbbf24',
  ambDim:  'rgba(251,191,36,0.10)',
  red:     '#f87171',
  redDim:  'rgba(248,113,113,0.10)',
  blue:    '#60a5fa',
  blueDim: 'rgba(96,165,250,0.10)',
  purple:  '#a78bfa',
  purDim:  'rgba(167,139,250,0.10)',
  green:   '#34d399',
  r:       '12px',
  rlg:     '18px',
  rxl:     '22px',
};

// ══════════════════════════════════════════════════════════════
//  ANIMATED BACKGROUND
// ══════════════════════════════════════════════════════════════
const AnimatedBG = ({ score, isDark }) => {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let id, frame = 0, W, H, pts = [];
    const GRID = 65;
    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      pts = Array.from({ length: 70 }, () => ({
        x: Math.random()*W, y: Math.random()*H,
        vx: (Math.random()-0.5)*0.18, vy: (Math.random()-0.5)*0.18,
        r: Math.random()*2+0.8, phase: Math.random()*Math.PI*2,
      }));
    };
    resize();
    window.addEventListener('resize', resize);
    const draw = () => {
      frame++;
      ctx.clearRect(0,0,W,H);
      const aR = score>=80 ? '0,229,184' : score>=50 ? '251,191,36' : '248,113,113';
      ctx.fillStyle = isDark ? '#080c14' : '#eef2f7';
      ctx.fillRect(0,0,W,H);
      ctx.lineWidth = 1;
      for (let x=0; x<=W; x+=GRID) {
        const a = (isDark?0.055:0.05)+0.025*Math.sin(frame*0.0022+x*0.01);
        ctx.strokeStyle=`rgba(${aR},${a})`;
        ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
      }
      for (let y=0; y<=H; y+=GRID) {
        const a = (isDark?0.055:0.05)+0.025*Math.sin(frame*0.0022+y*0.01);
        ctx.strokeStyle=`rgba(${aR},${a})`;
        ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
      }
      for (let x=0; x<=W; x+=GRID) for (let y=0; y<=H; y+=GRID) {
        const p=Math.sin(frame*0.005+x*0.008+y*0.008);
        ctx.beginPath(); ctx.arc(x,y,1.4,0,Math.PI*2);
        ctx.fillStyle=`rgba(${aR},${(isDark?0.10:0.09)+p*0.07})`; ctx.fill();
      }
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy; p.phase+=0.007;
        if(p.x<0)p.x=W; if(p.x>W)p.x=0;
        if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        const alpha=(isDark?0.38:0.28)+Math.sin(p.phase)*0.22;
        pts.forEach(q=>{
          const dx=p.x-q.x,dy=p.y-q.y,d=Math.sqrt(dx*dx+dy*dy);
          if(d<130&&d>0){
            ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y);
            ctx.strokeStyle=`rgba(${aR},${(1-d/130)*(isDark?0.16:0.12)})`;
            ctx.lineWidth=0.8; ctx.stroke();
          }
        });
        ctx.shadowColor=`rgba(${aR},0.7)`; ctx.shadowBlur=7;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(${aR},${alpha})`; ctx.fill(); ctx.shadowBlur=0;
      });
      const g1=ctx.createRadialGradient(W*0.1,H*0.15,0,W*0.1,H*0.15,W*0.45);
      g1.addColorStop(0,`rgba(${aR},${isDark?0.065:0.055})`); g1.addColorStop(1,'transparent');
      ctx.fillStyle=g1; ctx.fillRect(0,0,W,H);
      const g2=ctx.createRadialGradient(W*0.9,H*0.85,0,W*0.9,H*0.85,W*0.4);
      g2.addColorStop(0,`rgba(96,165,250,${isDark?0.05:0.045})`); g2.addColorStop(1,'transparent');
      ctx.fillStyle=g2; ctx.fillRect(0,0,W,H);
      id=requestAnimationFrame(draw);
    };
    draw();
    return ()=>{ cancelAnimationFrame(id); window.removeEventListener('resize',resize); };
  }, [score, isDark]);
  return <canvas ref={ref} style={{position:'fixed',inset:0,width:'100%',height:'100%',zIndex:0,pointerEvents:'none',display:'block'}} />;
};

// ══════════════════════════════════════════════════════════════
//  SHARED CSS — Enhanced with fixed light mode & new features
// ══════════════════════════════════════════════════════════════
const makeStyles = (isDark) => `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

  :root {
    /* Core backgrounds */
    --bg: ${isDark ? '#080c14' : '#eef2f7'};
    --bg2: ${isDark ? '#0d1220' : '#e4eaf3'};
    --surface: ${isDark ? 'rgba(255,255,255,0.028)' : 'rgba(0,40,80,0.04)'};
    --surface2: ${isDark ? 'rgba(255,255,255,0.055)' : 'rgba(0,40,80,0.07)'};
    --panel: ${isDark ? 'rgba(8,12,20,0.82)' : 'rgba(240,245,255,0.90)'};
    --panel2: ${isDark ? 'rgba(13,18,32,0.88)' : 'rgba(228,234,248,0.95)'};
    /* Borders */
    --border: ${isDark ? 'rgba(255,255,255,0.072)' : 'rgba(0,40,100,0.10)'};
    --borderB: ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,40,100,0.18)'};
    /* Text — FIXED light mode contrast */
    --text: ${isDark ? '#e8ecf4' : '#0f172a'};
    --text2: ${isDark ? '#a0aec0' : '#334155'};
    --muted: ${isDark ? '#4a5568' : '#64748b'};
    --subtle: ${isDark ? '#64748b' : '#475569'};
    /* Accent colors */
    --teal: #00e5b8;
    --tealDim: rgba(0,229,184,0.10);
    --tealGlow: rgba(0,229,184,0.20);
    --tealBorder: rgba(0,229,184,0.28);
    --amber: #fbbf24;
    --ambDim: rgba(251,191,36,0.10);
    --ambBorder: rgba(251,191,36,0.28);
    --red: #f87171;
    --redDim: rgba(248,113,113,0.10);
    --redBorder: rgba(248,113,113,0.28);
    --blue: #60a5fa;
    --blueDim: rgba(96,165,250,0.10);
    --purple: #a78bfa;
    --purDim: rgba(167,139,250,0.10);
    --green: #34d399;
    /* Radii */
    --r: 12px;
    --rlg: 18px;
    --rxl: 22px;
    /* Shadows */
    --shadow-sm: 0 2px 8px rgba(0,0,0,${isDark?'0.3':'0.08'});
    --shadow-md: 0 4px 20px rgba(0,0,0,${isDark?'0.4':'0.10'});
    --shadow-lg: 0 12px 40px rgba(0,0,0,${isDark?'0.5':'0.14'});
  }

  html, body {
    font-family: 'Outfit', sans-serif;
    -webkit-font-smoothing: antialiased;
    background: var(--bg);
    color: var(--text);
    transition: background 0.4s, color 0.3s;
  }

  .syn-root {
    min-height: 100vh;
    background: transparent;
    color: var(--text);
    position: relative;
    overflow-x: hidden;
    transition: color .3s;
  }

  /* Film grain overlay */
  .syn-root::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9999;
    opacity: ${isDark ? '0.18' : '0.07'};
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
  }

  .syn-wrap {
    max-width: 1280px;
    margin: 0 auto;
    padding: 28px 28px 56px;
    position: relative;
    z-index: 1;
  }

  /* Page transitions */
  .page-enter  { animation: pageIn  0.38s cubic-bezier(.16,1,.3,1) both; }
  .page-exit   { animation: pageOut 0.28s cubic-bezier(.4,0,1,1) both; }
  @keyframes pageIn  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
  @keyframes pageOut { from{opacity:1} to{opacity:0;transform:translateY(-10px)} }

  /* ── HEADER ── */
  .syn-hdr {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 22px;
    margin-bottom: 26px;
    border-bottom: 1px solid var(--border);
    animation: fsD .55s cubic-bezier(.16,1,.3,1) both;
  }
  .brand { display: flex; align-items: center; gap: 14px; }
  .logo-mk { width: 44px; height: 44px; position: relative; flex-shrink: 0; }
  .logo-mk svg { width: 44px; height: 44px; }
  .brand-txt { display: flex; flex-direction: column; gap: 3px; }
  .brand-name {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -.3px;
    color: var(--text);
    line-height: 1;
    background: linear-gradient(135deg, var(--teal), var(--blue));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .brand-tag {
    font-size: 10px;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: var(--muted);
    line-height: 1;
  }

  /* Recording indicators */
  .rec-indicators { display: flex; align-items: center; gap: 8px; }
  .ind-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border: 1px solid;
    backdrop-filter: blur(8px);
    transition: all 0.2s;
  }
  .ind-rec { background: var(--redDim); color: var(--red); border-color: rgba(248,113,113,0.3); }
  .ind-cam { background: var(--tealDim); color: var(--teal); border-color: rgba(0,229,184,0.3); }
  /* TASK 2: MIC indicator pill */
  .ind-mic { background: var(--ambDim); color: var(--amber); border-color: rgba(251,191,36,0.3); }

  /* Status pill */
  .spill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 16px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: .08em;
    text-transform: uppercase;
    border: 1px solid;
    transition: all .3s;
    backdrop-filter: blur(8px);
  }
  .spill.live  { background: rgba(0,229,184,.09); border-color: rgba(0,229,184,.28); color: var(--teal); }
  .spill.warn  { background: rgba(251,191,36,.09); border-color: rgba(251,191,36,.28); color: var(--amber); }
  .spill.crit  { background: rgba(248,113,113,.09); border-color: rgba(248,113,113,.32); color: var(--red); }
  .spill.sleep { background: rgba(167,139,250,.09); border-color: rgba(167,139,250,.32); color: var(--purple); }
  .sdot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
  .sdot.p  { animation: pdot 1.8s infinite; }
  .sdot.pf { animation: pdot .7s infinite; }
  @keyframes pdot { 0%,100%{opacity:1} 50%{opacity:.2} }

  .hdr-r { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }

  /* Buttons */
  .btn {
    padding: 8px 16px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid;
    transition: all .18s cubic-bezier(.16,1,.3,1);
    font-family: 'Outfit', sans-serif;
    backdrop-filter: blur(8px);
    white-space: nowrap;
    position: relative;
    overflow: hidden;
  }
  .btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0);
    transition: background .15s;
  }
  .btn:active::after { background: rgba(255,255,255,0.06); }
  .btn-g {
    background: var(--surface);
    color: var(--text2);
    border-color: var(--border);
  }
  .btn-g:hover { background: var(--surface2); border-color: var(--borderB); color: var(--text); transform: translateY(-1px); box-shadow: var(--shadow-sm); }
  .btn-d { background: rgba(248,113,113,.08); color: var(--red); border-color: rgba(248,113,113,.22); }
  .btn-d:hover { background: rgba(248,113,113,.16); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(248,113,113,.12); }
  .btn-t { background: rgba(0,229,184,.08); color: var(--teal); border-color: rgba(0,229,184,.24); }
  .btn-t:hover { background: rgba(0,229,184,.16); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,229,184,.12); }
  .btn-p { background: rgba(167,139,250,.08); color: var(--purple); border-color: rgba(167,139,250,.24); }
  .btn-p:hover { background: rgba(167,139,250,.16); transform: translateY(-1px); }

  /* Window controls */
  .win-ctrl { position: fixed; top: 16px; right: 16px; z-index: 5000; display: flex; gap: 6px; }
  .win-btn {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--panel);
    backdrop-filter: blur(16px);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 13px;
    color: var(--text2);
    transition: all .18s;
    user-select: none;
    box-shadow: var(--shadow-sm);
  }
  .win-btn:hover { background: var(--surface2); border-color: var(--borderB); color: var(--text); transform: translateY(-1px); box-shadow: var(--shadow-md); }
  .win-btn:active { transform: translateY(0); }

  /* ── LIVE ALERTS TOAST ── */
  .toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9998;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
    max-width: 380px;
  }
  .toast {
    background: var(--panel);
    border: 1px solid var(--red);
    padding: 14px 18px;
    border-radius: 14px;
    animation: toastIn .4s cubic-bezier(.16,1,.3,1) both;
    backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: var(--shadow-lg);
    pointer-events: auto;
  }
  .toast.toast-warn  { border-color: var(--amber); }
  .toast.toast-info  { border-color: var(--teal); }
  .toast-ico { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
  .toast-ico.crit { background: var(--redDim); color: var(--red); }
  .toast-ico.warn { background: var(--ambDim); color: var(--amber); }
  .toast-ico.info { background: var(--tealDim); color: var(--teal); }
  .toast-body { flex: 1; }
  .toast-txt  { font-family: 'Outfit', sans-serif; font-size: 12.5px; font-weight: 600; color: var(--text); line-height: 1.4; }
  .toast-time { font-size: 10px; color: var(--muted); font-family: 'JetBrains Mono', monospace; margin-top: 3px; }
  .toast-close { width: 20px; height: 20px; border-radius: 50%; background: var(--surface); border: 1px solid var(--border); cursor: pointer; font-size: 10px; color: var(--muted); display: flex; align-items: center; justify-content: center; flex-shrink: 0; pointer-events: auto; transition: all .15s; }
  .toast-close:hover { background: var(--surface2); color: var(--text); }
  @keyframes toastIn { from{opacity:0;transform:translateX(24px) scale(.96)} to{opacity:1;transform:none} }

  /* ── ACTIVITY PANEL ── */
  .act-panel {
    background: var(--panel);
    backdrop-filter: blur(22px);
    -webkit-backdrop-filter: blur(22px);
    border: 1px solid var(--border);
    border-radius: var(--rxl);
    padding: 18px 24px;
    margin-bottom: 18px;
    animation: fsU .5s cubic-bezier(.16,1,.3,1) .28s both;
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
    box-shadow: var(--shadow-sm);
    position: relative;
    overflow: hidden;
  }
  .act-panel::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--tealGlow), transparent);
    opacity: .5;
  }
  .act-panel-title { font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); font-family: 'JetBrains Mono', monospace; white-space: nowrap; }
  .act-divider { width: 1px; height: 32px; background: var(--border); flex-shrink: 0; }
  .act-item { display: flex; flex-direction: column; gap: 3px; }
  .act-lbl { font-size: 10px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
  .act-val { font-size: 14px; font-weight: 700; color: var(--text); font-family: 'JetBrains Mono', monospace; white-space: nowrap; }
  .act-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: .06em;
    text-transform: uppercase;
    border: 1px solid;
    transition: all .3s;
  }
  .act-status-badge.active     { background: var(--tealDim); color: var(--teal); border-color: rgba(0,229,184,.28); }
  .act-status-badge.suspicious { background: var(--redDim);  color: var(--red);  border-color: rgba(248,113,113,.28); animation: pdot .8s infinite; }
  .act-status-badge.warning    { background: var(--ambDim);  color: var(--amber); border-color: rgba(251,191,36,.28); }

  /* ── FOCUS SCORE CONFIDENCE BAR (new) ── */
  .confidence-bar-wrap { width: 100%; }
  .confidence-lbl { display: flex; justify-content: space-between; font-size: 10px; color: var(--muted); font-family: 'JetBrains Mono', monospace; margin-bottom: 4px; }
  .confidence-track { height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
  .confidence-fill { height: 100%; border-radius: 2px; transition: width .6s cubic-bezier(.34,1.56,.64,1), background .4s; }

  /* FOOTER */
  .footer-clean {
    text-align: center;
    padding-top: 48px;
    padding-bottom: 40px;
    color: var(--muted);
    font-size: 12px;
    font-family: 'Outfit', sans-serif;
    font-weight: 500;
    letter-spacing: .05em;
    border-top: 1px solid var(--border);
    margin-top: 8px;
  }
  .footer-inner { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
  .footer-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--border); }

  /* ── MAIN GRID ── */
  .main-grid { display: grid; grid-template-columns: 300px 1fr; gap: 18px; margin-bottom: 18px; }

  /* ── SCORE CARD ── */
  .score-card {
    background: var(--panel);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid var(--border);
    border-radius: var(--rxl);
    padding: 28px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    animation: fsU .5s cubic-bezier(.16,1,.3,1) .1s both;
    transition: border-color .3s, box-shadow .3s;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  .score-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--tealGlow), transparent);
    opacity: .6;
  }
  .score-card.warn  { border-color: rgba(251,191,36,.24); box-shadow: 0 0 30px rgba(251,191,36,.04); }
  .score-card.crit  { border-color: rgba(248,113,113,.30); box-shadow: 0 0 40px rgba(248,113,113,.06); }
  .score-card.sleep { border-color: rgba(167,139,250,.30); box-shadow: 0 0 40px rgba(167,139,250,.06); }
  .sc-lbl { font-size: 10px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); font-family: 'JetBrains Mono', monospace; align-self: flex-start; width: 100%; }
  .ring-track { fill: none; stroke: ${isDark ? 'rgba(255,255,255,0.045)' : 'rgba(0,40,100,0.07)'}; stroke-width: 7; }
  .ring-bgf   { fill: none; stroke-width: 7; stroke-linecap: round; opacity: .08; }
  .ring-fill  { fill: none; stroke-width: 7; stroke-linecap: round; transition: stroke-dashoffset .8s cubic-bezier(.34,1.56,.64,1), stroke .4s; }
  .ring-val   { font-family: 'JetBrains Mono', monospace; font-weight: 600; transition: fill .4s; }
  .ring-pct   { font-family: 'Outfit', sans-serif; font-weight: 400; }

  .s-badge {
    width: 100%;
    padding: 9px 14px;
    border-radius: 10px;
    font-size: 11px;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 500;
    letter-spacing: .04em;
    text-align: center;
    border: 1px solid;
    transition: all .3s;
  }
  .s-badge.ok     { background: var(--tealDim);  border-color: rgba(0,229,184,.22); color: var(--teal); }
  .s-badge.warn   { background: var(--ambDim);   border-color: rgba(251,191,36,.22); color: var(--amber); }
  .s-badge.crit   { background: var(--redDim);   border-color: rgba(248,113,113,.22); color: var(--red); }
  .s-badge.sleep  { background: var(--purDim);   border-color: rgba(167,139,250,.22); color: var(--purple); }
  .s-badge.mobile { background: var(--blueDim);  border-color: rgba(96,165,250,.22); color: var(--blue); }

  /* ── ATTENTION HEATMAP (new feature) ── */
  .heatmap-panel {
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px;
  }
  .heatmap-lbl { font-size: 9px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); font-family: 'JetBrains Mono', monospace; margin-bottom: 8px; }
  .heatmap-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 2px; }
  .heatmap-cell {
    height: 16px;
    border-radius: 3px;
    transition: background .4s;
  }

  /* ── METRICS ── */
  .mc { display: flex; flex-direction: column; gap: 18px; }
  .mr { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
  .mcard {
    background: var(--panel);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border);
    border-radius: var(--rlg);
    padding: 18px 20px;
    transition: border-color .2s, transform .2s, box-shadow .2s;
    animation: fsU .5s cubic-bezier(.16,1,.3,1) both;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  .mcard:hover { border-color: var(--borderB); transform: translateY(-2px); box-shadow: var(--shadow-md); }
  .mcard::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: var(--border); }
  .mlbl {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  .mico { font-size: 11px; opacity: .6; }
  .mval { font-size: 28px; font-weight: 700; font-family: 'JetBrains Mono', monospace; letter-spacing: -.5px; line-height: 1; transition: color .4s; }
  .msub { font-size: 10px; color: var(--muted); margin-top: 6px; font-family: 'JetBrains Mono', monospace; }
  .mbar { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: var(--border); overflow: hidden; }
  .mbarf { height: 100%; border-radius: 1px; transition: width .6s cubic-bezier(.34,1.56,.64,1), background .4s; }
  .mcard-trend { position: absolute; top: 14px; right: 14px; font-size: 10px; font-family: 'JetBrains Mono', monospace; }
  .trend-up   { color: var(--teal); }
  .trend-down { color: var(--red); }
  .trend-flat { color: var(--muted); }

  /* ── DUAL PANEL GRID ── */
  .dual-panel-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 18px; }

  /* ── TIMELINE ── */
  .tl-container {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-top: 16px;
    max-height: 240px;
    overflow-y: auto;
    padding-right: 10px;
  }
  .tl-container::-webkit-scrollbar { width: 4px; }
  .tl-container::-webkit-scrollbar-thumb { background: var(--borderB); border-radius: 4px; }
  .tl-item { display: flex; gap: 16px; position: relative; padding-bottom: 18px; animation: fsU .4s ease; }
  .tl-item:last-child { padding-bottom: 0; }
  .tl-line { position: absolute; left: 4px; top: 14px; bottom: 0; width: 1px; background: var(--border); }
  .tl-item:last-child .tl-line { display: none; }
  .tl-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--borderB); border: 2px solid var(--panel); position: relative; z-index: 2; margin-top: 3px; flex-shrink: 0; }
  .tl-dot.red   { background: var(--red); box-shadow: 0 0 8px rgba(248,113,113,0.4); }
  .tl-dot.amber { background: var(--amber); }
  .tl-dot.teal  { background: var(--teal); }
  .tl-content { display: flex; flex-direction: column; gap: 3px; }
  .tl-time { font-size: 10px; font-family: 'JetBrains Mono', monospace; color: var(--muted); }
  .tl-msg  { font-size: 13px; color: var(--text); font-weight: 500; }

  /* ── CHART ── */
  .chart-panel {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: var(--rxl);
    padding: 22px 26px;
    display: flex;
    flex-direction: column;
    height: 320px;
    box-shadow: var(--shadow-sm);
  }
  .chart-area { flex: 1; position: relative; margin-top: 10px; }
  .chart-svg  { width: 100%; height: 100%; overflow: visible; }
  .chart-line { fill: none; stroke: var(--red); stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; }
  .chart-fill { fill: url(#chartGrad); opacity: 0.6; }

  /* ── SPARKLINE ── */
  .sp-panel {
    background: ${isDark ? 'rgba(8,12,20,0.5)' : 'rgba(225,232,248,0.7)'};
    backdrop-filter: blur(12px);
    border: 1px solid var(--border);
    border-radius: var(--rlg);
    padding: 18px 20px;
    flex: 1;
  }
  .sp-hdr   { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .sp-ttl   { font-size: 10px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
  .sp-rng   { font-size: 10px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
  .sp-bars  { display: flex; align-items: flex-end; gap: 2.5px; height: 60px; }
  .sp-bar   { flex: 1; min-width: 3px; border-radius: 2px 2px 0 0; transition: height .4s cubic-bezier(.34,1.56,.64,1), background .4s; }
  .sp-time  { display: flex; justify-content: space-between; margin-top: 8px; font-size: 10px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }

  /* ── TELEMETRY ── */
  .tele {
    background: var(--panel);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid var(--border);
    border-radius: var(--rxl);
    padding: 26px 28px;
    margin-bottom: 18px;
    transition: border-color .3s, box-shadow .3s;
    animation: fsU .5s cubic-bezier(.16,1,.3,1) .2s both;
    box-shadow: var(--shadow-sm);
  }
  .tele.crit  { border-color: rgba(248,113,113,.3); box-shadow: 0 0 50px rgba(248,113,113,.05); }
  .tele.warn  { border-color: rgba(251,191,36,.25); box-shadow: 0 0 40px rgba(251,191,36,.04); }
  .tele.sleep { border-color: rgba(167,139,250,.28); box-shadow: 0 0 40px rgba(167,139,250,.05); }
  .tele-hdr  { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
  .tele-ttl  { font-size: 10px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
  .tele-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; }
  .tc { padding: 0 24px; border-right: 1px solid var(--border); }
  .tc:first-child { padding-left: 0; }
  .tc:last-child  { border-right: none; }
  .tc-ttl { font-size: 9px; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; color: var(--muted); font-family: 'JetBrains Mono', monospace; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid var(--border); }
  .tr { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 12px; }
  .tr:last-child { border-bottom: none; }
  .tk { color: var(--subtle); font-size: 11px; }
  .tv { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text); }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
    border: 1px solid;
  }
  .bg-t { background: var(--tealDim); border-color: rgba(0,229,184,.22); color: var(--teal); }
  .bg-a { background: var(--ambDim);  border-color: rgba(251,191,36,.22); color: var(--amber); }
  .bg-r { background: var(--redDim);  border-color: rgba(248,113,113,.22); color: var(--red); }
  .bg-b { background: var(--blueDim); border-color: rgba(96,165,250,.22);  color: var(--blue); }
  .bg-p { background: var(--purDim);  border-color: rgba(167,139,250,.22); color: var(--purple); }
  .bdot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; animation: pdot 1.5s infinite; }

  /* Matrix terminal */
  .matrix-tm {
    background: ${isDark ? '#010208' : '#0a1628'};
    border: 1px solid rgba(0,229,184,.12);
    border-radius: 10px;
    padding: 18px 20px;
    height: 180px;
    overflow: hidden;
    font-family: 'JetBrains Mono', monospace;
    color: var(--teal);
    font-size: 11px;
    line-height: 1.75;
    box-shadow: inset 0 0 40px rgba(0,229,184,.02);
  }

  /* Alert banners */
  .al-ban {
    margin-top: 18px;
    padding: 13px 18px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    font-weight: 600;
    animation: si .3s cubic-bezier(.16,1,.3,1);
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: .03em;
    backdrop-filter: blur(8px);
  }
  .al-c { background: var(--redDim);  border: 1px solid rgba(248,113,113,.24); color: var(--red); }
  .al-w { background: var(--ambDim);  border: 1px solid rgba(251,191,36,.24);  color: var(--amber); }
  .al-s { background: var(--purDim);  border: 1px solid rgba(167,139,250,.24); color: var(--purple); }
  .al-m { background: var(--blueDim); border: 1px solid rgba(96,165,250,.24);  color: var(--blue); }
  @keyframes si { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }

  /* ── INCIDENT LOGS ── */
  .logs {
    background: var(--panel);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid var(--border);
    border-radius: var(--rxl);
    padding: 22px 26px;
    animation: fsU .5s cubic-bezier(.16,1,.3,1) .25s both;
    box-shadow: var(--shadow-sm);
  }
  .logs-hdr {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--border);
  }
  .logs-ttl { font-size: 10px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
  .logs-cnt {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--muted);
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 2px 8px;
  }
  .log-row {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 10px 12px;
    border-radius: 8px;
    margin: 0 -12px;
    font-size: 12px;
    animation: si .25s ease;
    transition: background .15s;
  }
  .log-row:hover { background: var(--surface); }
  .log-sep { height: 1px; background: var(--border); margin: 0; }
  .lt  { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--muted); white-space: nowrap; padding-top: 2px; min-width: 72px; }
  .ldot{ width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
  .ln  { font-weight: 600; color: var(--text); margin-right: 5px; font-size: 12px; }
  .la  { color: var(--subtle); font-size: 12px; }
  .empty { text-align: center; padding: 36px 0; color: var(--muted); font-size: 12px; font-family: 'JetBrains Mono', monospace; }
  .ei { font-size: 24px; margin-bottom: 10px; opacity: .2; }

  /* ── RISK GAUGE (new) ── */
  .risk-gauge { width: 100%; }
  .risk-gauge-track { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; position: relative; }
  .risk-gauge-fill { height: 100%; border-radius: 3px; transition: width .6s cubic-bezier(.34,1.56,.64,1), background .4s; }
  .risk-gauge-markers { display: flex; justify-content: space-between; margin-top: 5px; font-size: 9px; font-family: 'JetBrains Mono', monospace; color: var(--muted); }

  /* ── CONNECTION STATUS BANNER (new) ── */
  .conn-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 18px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
    margin-bottom: 18px;
    animation: si .3s ease;
    letter-spacing: .04em;
  }
  .conn-banner.connecting { background: var(--ambDim); border: 1px solid var(--ambBorder); color: var(--amber); }
  .conn-banner.connected  { background: var(--tealDim); border: 1px solid var(--tealBorder); color: var(--teal); }
  .conn-banner.error      { background: var(--redDim);  border: 1px solid var(--redBorder);  color: var(--red); }

  /* ── SUMMARY / END-SESSION SCREEN ── */
  .sum-ov {
    position: fixed;
    inset: 0;
    z-index: 9000;
    background: rgba(0,0,0,.88);
    backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fI .3s ease;
  }
  .sum-card {
    background: ${isDark ? 'rgba(8,12,20,0.96)' : 'rgba(235,242,255,0.97)'};
    border: 1px solid var(--borderB);
    border-radius: var(--rxl);
    padding: 44px 40px;
    width: 100%;
    max-width: 520px;
    text-align: center;
    animation: fsU .5s cubic-bezier(.16,1,.3,1) both;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(20px);
    box-shadow: var(--shadow-lg);
  }
  .sum-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--teal), transparent);
    opacity: .5;
  }
  .sum-card::after {
    content: '';
    position: absolute;
    top: -60px; left: 50%;
    transform: translateX(-50%);
    width: 220px; height: 120px;
    background: radial-gradient(ellipse, rgba(0,229,184,0.15) 0%, transparent 70%);
    pointer-events: none;
  }
  .si { font-size: 44px; margin-bottom: 20px; animation: bounceIn .6s cubic-bezier(.16,1,.3,1) .1s both; }
  @keyframes bounceIn { from{opacity:0;transform:scale(.5)} 50%{transform:scale(1.1)} to{opacity:1;transform:scale(1)} }
  .st { font-size: 28px; font-weight: 700; margin-bottom: 6px; letter-spacing: -.3px; color: var(--text); }
  .ss { color: var(--subtle); font-size: 14px; margin-bottom: 30px; }
  .sum-grade-banner {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 22px;
    border-radius: 100px;
    font-size: 13px;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: .06em;
    text-transform: uppercase;
    margin-bottom: 26px;
    border: 1px solid;
  }
  .sum-grade-banner.exc  { background: rgba(0,229,184,.1);   color: var(--teal);   border-color: rgba(0,229,184,.3); }
  .sum-grade-banner.good { background: rgba(96,165,250,.1);  color: var(--blue);   border-color: rgba(96,165,250,.3); }
  .sum-grade-banner.fair { background: rgba(251,191,36,.1);  color: var(--amber);  border-color: rgba(251,191,36,.3); }
  .sum-grade-banner.poor { background: rgba(248,113,113,.1); color: var(--red);    border-color: rgba(248,113,113,.3); }
  .sb { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); margin-bottom: 24px; overflow: hidden; text-align: left; }
  .sr { display: flex; justify-content: space-between; align-items: center; padding: 13px 18px; border-bottom: 1px solid var(--border); }
  .sr:last-child { border-bottom: none; }
  .sk { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .1em; color: var(--subtle); font-family: 'JetBrains Mono', monospace; }
  .sv { font-size: 16px; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: var(--teal); }
  .sum-highlights { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 20px; }
  .sum-hl { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 14px 12px; text-align: center; }
  .sum-hl-val { font-size: 24px; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: var(--teal); }
  .sum-hl-lbl { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); font-family: 'JetBrains Mono', monospace; margin-top: 5px; }
  .btn-full { width: 100%; padding: 13px; border: none; border-radius: 11px; cursor: pointer; font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 600; background: linear-gradient(135deg, var(--teal), #0088ff); color: #000; transition: opacity .2s, transform .15s; }
  .btn-full:hover { opacity: .88; transform: translateY(-1px); }

  /* ── QUICK STATS ROW (new) ── */
  .quick-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 18px;
    animation: fsU .5s cubic-bezier(.16,1,.3,1) .32s both;
  }
  .qs-card {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: var(--rlg);
    padding: 16px 18px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: var(--shadow-sm);
    transition: all .2s;
  }
  .qs-card:hover { border-color: var(--borderB); transform: translateY(-1px); }
  .qs-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
  .qs-info { display: flex; flex-direction: column; gap: 2px; }
  .qs-val { font-size: 20px; font-weight: 700; font-family: 'JetBrains Mono', monospace; line-height: 1; color: var(--text); }
  .qs-lbl { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); font-family: 'JetBrains Mono', monospace; }

  /* Keyframes */
  @keyframes fsU { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
  @keyframes fsD { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:none} }
  @keyframes fI  { from{opacity:0} to{opacity:1} }

  /* ── RESPONSIVE ── */
  @media(max-width:1060px) {
    .quick-stats { grid-template-columns: 1fr 1fr 1fr; }
  }
  @media(max-width:960px) {
    .main-grid { grid-template-columns: 1fr; }
    .dual-panel-grid { grid-template-columns: 1fr; }
    .tele-grid { grid-template-columns: 1fr 1fr; }
    .tc:nth-child(2) { border-right: none; }
    .tc:nth-child(3) { grid-column: 1/-1; padding: 16px 0 0; border-right: none; border-top: 1px solid var(--border); }
    .mr { grid-template-columns: 1fr 1fr; }
    .sum-highlights { grid-template-columns: 1fr 1fr 1fr; }
    .quick-stats { grid-template-columns: 1fr 1fr; }
  }
  @media(max-width:700px) {
    .syn-wrap { padding: 16px 16px 36px; }
    .syn-hdr  { flex-direction: column; align-items: flex-start; gap: 14px; }
    .hdr-r    { width: 100%; justify-content: flex-start; }
    .rec-indicators { display: none; }
    .mr { grid-template-columns: 1fr 1fr; }
    .tele-grid { grid-template-columns: 1fr; }
    .tc { padding: 14px 0; border-right: none; border-bottom: 1px solid var(--border); }
    .tc:last-child { border-bottom: none; }
    .sum-card  { padding: 32px 22px; }
    .win-ctrl  { top: 10px; right: 10px; }
    .sum-highlights { grid-template-columns: 1fr 1fr; }
    .quick-stats { grid-template-columns: 1fr; }
  }
`;

// ══════════════════════════════════════════════════════════════
//  ENHANCED LOGO
// ══════════════════════════════════════════════════════════════
const Logo = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <defs>
      <linearGradient id="lg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00e5b8"/>
        <stop offset="100%" stopColor="#0088ff"/>
      </linearGradient>
    </defs>
    <rect width="44" height="44" rx="12" fill="url(#lg)"/>
    <circle cx="22" cy="22" r="4.5" fill="#000" opacity=".8"/>
    <circle cx="22" cy="10" r="2.4" fill="#000" opacity=".7"/>
    <circle cx="32" cy="16" r="2.4" fill="#000" opacity=".7"/>
    <circle cx="32" cy="28" r="2.4" fill="#000" opacity=".7"/>
    <circle cx="22" cy="34" r="2.4" fill="#000" opacity=".7"/>
    <circle cx="12" cy="28" r="2.4" fill="#000" opacity=".7"/>
    <circle cx="12" cy="16" r="2.4" fill="#000" opacity=".7"/>
    <line x1="22" y1="17.5" x2="22" y2="12.4" stroke="#000" strokeWidth="1.3" opacity=".55"/>
    <line x1="25.6" y1="19.8" x2="30.1" y2="17.3" stroke="#000" strokeWidth="1.3" opacity=".55"/>
    <line x1="25.6" y1="24.2" x2="30.1" y2="26.7" stroke="#000" strokeWidth="1.3" opacity=".55"/>
    <line x1="22" y1="26.5" x2="22" y2="31.6" stroke="#000" strokeWidth="1.3" opacity=".55"/>
    <line x1="18.4" y1="24.2" x2="13.9" y2="26.7" stroke="#000" strokeWidth="1.3" opacity=".55"/>
    <line x1="18.4" y1="19.8" x2="13.9" y2="17.3" stroke="#000" strokeWidth="1.3" opacity=".55"/>
    <circle cx="22" cy="22" r="8.5" stroke="#000" strokeWidth=".8" opacity=".22" strokeDasharray="2 2"/>
  </svg>
);

// ══════════════════════════════════════════════════════════════
//  FOCUS RING — Enhanced with pulse effect
// ══════════════════════════════════════════════════════════════
const FocusRing = ({ score, stateClass }) => {
  const r = 68, circ = 2 * Math.PI * r, filled = circ * (score / 100);
  const color = stateClass === 'sleep' ? 'var(--purple)'
    : score >= 80 ? 'var(--teal)'
    : score >= 50 ? 'var(--amber)'
    : 'var(--red)';
  return (
    <svg width="170" height="170" viewBox="0 0 170 170">
      <defs>
        <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color}/>
          <stop offset="100%" stopColor={color} stopOpacity=".5"/>
        </linearGradient>
      </defs>
      <circle className="ring-track" cx="85" cy="85" r={r}/>
      <circle className="ring-bgf" cx="85" cy="85" r={r}
        strokeDasharray={`${circ} 0`} strokeDashoffset={circ * .25}
        style={{ stroke: color }}/>
      <circle className="ring-fill" cx="85" cy="85" r={r}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ * .25}
        style={{ stroke: color }}/>
      <text x="85" y="76" textAnchor="middle" dominantBaseline="middle"
        className="ring-val" fontSize="36" style={{ fill: color }}>{score}</text>
      <text x="85" y="100" textAnchor="middle" className="ring-pct"
        fontSize="11" fill="var(--muted)">FOCUS SCORE</text>
    </svg>
  );
};

// ══════════════════════════════════════════════════════════════
//  ATTENTION HEATMAP — New feature: last 48 score cells
// ══════════════════════════════════════════════════════════════
const AttentionHeatmap = ({ history }) => {
  const cells = history.slice(-48);
  const getColor = (score) => {
    if (score >= 80) return `rgba(0,229,184,${0.25 + (score - 80) / 100})`;
    if (score >= 50) return `rgba(251,191,36,${0.2 + (score - 50) / 120})`;
    return `rgba(248,113,113,${0.2 + (100 - score) / 160})`;
  };
  return (
    <div className="heatmap-panel">
      <div className="heatmap-lbl">Attention Heatmap (48 samples)</div>
      <div className="heatmap-grid">
        {Array.from({ length: 48 }, (_, i) => {
          const entry = cells[i];
          const bg = entry ? getColor(entry.score) : 'var(--border)';
          return (
            <div key={i} className="heatmap-cell"
              style={{ background: bg }}
              title={entry ? `${entry.time}: ${entry.score}%` : 'No data'}/>
          );
        })}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
//  SUSPICIOUS ACTIVITY TREND CHART
// ══════════════════════════════════════════════════════════════
const SuspiciousTrendsChart = ({ history }) => {
  const pts = history.slice(-30).map(h => Math.min(100, Math.max(0, 100 - h.score)));
  const maxPts = 30;
  const getPath = () => {
    if (pts.length === 0) return "";
    const w = 1000, h = 200, dx = w / (maxPts - 1);
    let path = `M 0 ${h - (pts[0] / 100) * h}`;
    pts.forEach((p, i) => { path += ` L ${i * dx} ${h - (p / 100) * h}`; });
    return path;
  };
  const getFill = () => {
    if (pts.length === 0) return "";
    const w = 1000, h = 200, dx = w / (maxPts - 1);
    let path = `M 0 ${h} L 0 ${h - (pts[0] / 100) * h}`;
    pts.forEach((p, i) => { path += ` L ${i * dx} ${h - (p / 100) * h}`; });
    path += ` L ${(pts.length - 1) * dx} ${h} Z`;
    return path;
  };
  const avgRisk = pts.length > 0 ? Math.round(pts.reduce((a, b) => a + b, 0) / pts.length) : 0;
  return (
    <div className="chart-panel">
      <div className="tele-hdr" style={{ marginBottom: 0 }}>
        <span className="tele-ttl">Suspicious Activity Trends</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', color: 'var(--muted)' }}>Avg Risk</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', fontWeight: 700, color: avgRisk > 50 ? 'var(--red)' : avgRisk > 20 ? 'var(--amber)' : 'var(--teal)' }}>{avgRisk}%</span>
        </div>
      </div>
      <div className="chart-area">
        {pts.length === 0 ? (
          <div className="empty" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Waiting for data points...
          </div>
        ) : (
          <svg className="chart-svg" viewBox="0 0 1000 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--red)" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="var(--red)" stopOpacity="0.0"/>
              </linearGradient>
            </defs>
            <path className="chart-fill" d={getFill()}/>
            <path className="chart-line" d={getPath()}/>
          </svg>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
//  SPARKLINE
// ══════════════════════════════════════════════════════════════
const Sparkline = ({ history }) => {
  const pts = history.slice(-36);
  return (
    <div className="sp-panel">
      <div className="sp-hdr">
        <span className="sp-ttl">Session Trend</span>
        <span className="sp-rng">{pts.length > 0 ? `${pts.length} samples` : 'Awaiting data'}</span>
      </div>
      <div className="sp-bars">
        {pts.length === 0
          ? Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="sp-bar" style={{ height: '3px', background: 'var(--border)' }}/>
            ))
          : pts.map((p, i) => {
              const h = Math.max(3, (p.score / 100) * 60);
              const bg = p.score >= 80 ? 'var(--teal)' : p.score >= 50 ? 'var(--amber)' : 'var(--red)';
              return <div key={i} className="sp-bar" style={{ height: `${h}px`, background: bg, opacity: .35 + (i / pts.length) * .65 }}/>;
            })
        }
      </div>
      <div className="sp-time">
        <span>{pts.length > 0 ? pts[0].time : '--:--'}</span>
        <span>{pts.length > 0 ? pts[pts.length - 1].time : '--:--'}</span>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
//  METRIC CARD — Enhanced with trend indicator
// ══════════════════════════════════════════════════════════════
const MCard = ({ label, icon, value, color, sub, barPct, delay, trend }) => (
  <div className="mcard" style={{ animationDelay: delay }}>
    {trend !== undefined && (
      <div className={`mcard-trend ${trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : 'trend-flat'}`}>
        {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
      </div>
    )}
    <div className="mlbl"><span className="mico">{icon}</span>{label}</div>
    <div className="mval" style={{ color: color || 'var(--text)' }}>{value}</div>
    {sub && <div className="msub">{sub}</div>}
    {barPct !== undefined && (
      <div className="mbar">
        <div className="mbarf" style={{ width: `${Math.min(100, barPct)}%`, background: color || 'var(--teal)' }}/>
      </div>
    )}
  </div>
);

// ══════════════════════════════════════════════════════════════
//  TOAST NOTIFICATIONS — Enhanced with close button
// ══════════════════════════════════════════════════════════════
const ToastNotifications = ({ alerts, onClose }) => (
  <div className="toast-container">
    {alerts.map(a => (
      <div key={a.id} className={`toast ${a.level === 'warn' ? 'toast-warn' : a.level === 'info' ? 'toast-info' : ''}`}>
        <div className={`toast-ico ${a.level || 'crit'}`}>{a.icon || '⚠'}</div>
        <div className="toast-body">
          <div className="toast-txt">{a.msg}</div>
          <div className="toast-time">{a.time}</div>
        </div>
        <button className="toast-close" onClick={() => onClose(a.id)}>✕</button>
      </div>
    ))}
  </div>
);

// ══════════════════════════════════════════════════════════════
//  ACTIVITY PANEL
// ══════════════════════════════════════════════════════════════
const ActivityPanel = ({ lastActivity, statusLabel, isSuspicious, sessionTime }) => {
  const statusCls = isSuspicious ? 'suspicious' : 'active';
  return (
    <div className="act-panel">
      <span className="act-panel-title">Live Activity</span>
      <div className="act-divider"/>
      <div className="act-item">
        <span className="act-lbl">Last Event</span>
        <span className="act-val">{lastActivity || 'No events yet'}</span>
      </div>
      <div className="act-divider"/>
      <div className="act-item">
        <span className="act-lbl">Status</span>
        <span className={`act-status-badge ${statusCls}`}>
          <span className="sdot p"/>
          {isSuspicious ? 'Suspicious' : statusLabel}
        </span>
      </div>
      <div className="act-divider"/>
      <div className="act-item">
        <span className="act-lbl">Session Time</span>
        <span className="act-val">{sessionTime}</span>
      </div>
      <div className="act-divider"/>
      <div className="act-item">
        <span className="act-lbl">Recording</span>
        <span className="ind-pill ind-rec" style={{ fontSize: '10px', padding: '4px 10px' }}>
          <span className="sdot p"/>ON
        </span>
      </div>
      <div className="act-item" style={{ marginLeft: '2px' }}>
        <span className="act-lbl">Camera</span>
        <span className="ind-pill ind-cam" style={{ fontSize: '10px', padding: '4px 10px' }}>
          <span className="sdot p"/>ACTIVE
        </span>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
//  QUICK STATS — New feature: top-level summary bar
// ══════════════════════════════════════════════════════════════
const QuickStats = ({ score, logs, hist, sessionClock }) => {
  const avg = hist.length > 0 ? Math.round(hist.reduce((a, b) => a + b.score, 0) / hist.length) : 0;
  const peakFocus = hist.length > 0 ? Math.max(...hist.map(h => h.score)) : 0;
  return (
    <div className="quick-stats">
      <div className="qs-card">
        <div className="qs-icon" style={{ background: 'var(--tealDim)' }}>◎</div>
        <div className="qs-info">
          <div className="qs-val" style={{ color: 'var(--teal)' }}>{avg}%</div>
          <div className="qs-lbl">Session Avg</div>
        </div>
      </div>
      <div className="qs-card">
        <div className="qs-icon" style={{ background: 'var(--blueDim)' }}>▲</div>
        <div className="qs-info">
          <div className="qs-val" style={{ color: 'var(--blue)' }}>{peakFocus}%</div>
          <div className="qs-lbl">Peak Focus</div>
        </div>
      </div>
      <div className="qs-card">
        <div className="qs-icon" style={{ background: logs.length > 0 ? 'var(--ambDim)' : 'var(--tealDim)' }}>◉</div>
        <div className="qs-info">
          <div className="qs-val" style={{ color: logs.length > 0 ? 'var(--amber)' : 'var(--teal)' }}>{logs.length}</div>
          <div className="qs-lbl">Incidents</div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
//  CONNECTION STATUS BANNER — New feature
// ══════════════════════════════════════════════════════════════
const ConnectionBanner = ({ status }) => {
  if (!status || status === 'connected') return null;
  const cfg = {
    connecting: { cls: 'connecting', icon: '◌', msg: 'Connecting to AI proctoring engine...' },
    error:      { cls: 'error',      icon: '✕', msg: 'Connection failed — Check backend server at localhost:8000' },
  }[status] || null;
  if (!cfg) return null;
  return (
    <div className={`conn-banner ${cfg.cls}`}>
      <span className="sdot p"/>
      <span>{cfg.icon}</span>
      <span>{cfg.msg}</span>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
//  STATE DETECTORS
// ══════════════════════════════════════════════════════════════
const dSleep  = s => s.toLowerCase().includes('sleep')        || s.toLowerCase().includes('drowsy');
const dMobile = s => s.toLowerCase().includes('mobile')       || s.toLowerCase().includes('phone') || s.toLowerCase().includes('device') || s.toLowerCase().includes('cell');
const dNoFace = s => s.toLowerCase().includes('not detected') || s.toLowerCase().includes('no face');
const dSpoof  = s => s.toLowerCase().includes('spoof')        || s.toLowerCase().includes('mask');
// TASK 1: Detector for multi-face / proxy alert state
const dProxy  = s => s.toLowerCase().includes('multiple') || s.toLowerCase().includes('proxy');

// ══════════════════════════════════════════════════════════════
//  ENHANCED SUMMARY SCREEN
// ══════════════════════════════════════════════════════════════
const Summary = ({ xp, maxStreak, sessionHistory, logs, isDark, onReset }) => {
  const avg       = sessionHistory.length > 0 ? Math.round(sessionHistory.reduce((a, b) => a + b.score, 0) / sessionHistory.length) : 0;
  const grade     = avg >= 85 ? 'Excellent' : avg >= 70 ? 'Good' : avg >= 50 ? 'Fair' : 'Needs Work';
  const gradeCls  = avg >= 85 ? 'exc' : avg >= 70 ? 'good' : avg >= 50 ? 'fair' : 'poor';
  const gradeIcon = avg >= 85 ? '🏆' : avg >= 70 ? '✅' : avg >= 50 ? '⚠️' : '❌';
  const totalTime = Math.round(sessionHistory.length * 0.15);
  const peakFocus = sessionHistory.length > 0 ? Math.max(...sessionHistory.map(h => h.score)) : 0;
  return (
    <div className="sum-ov">
      <AnimatedBG score={avg} isDark={isDark}/>
      <div className="sum-card">
        <div className="si">⚡</div>
        <div className="st">Session Complete</div>
        <div className="ss">Analytics recorded — {STUDENT_NAME}</div>
        <div className={`sum-grade-banner ${gradeCls}`}>
          <span>{gradeIcon}</span>
          {grade} Performance
        </div>
        <div className="sum-highlights">
          <div className="sum-hl">
            <div className="sum-hl-val" style={{ color: 'var(--teal)' }}>{avg}%</div>
            <div className="sum-hl-lbl">Avg Focus</div>
          </div>
          <div className="sum-hl">
            <div className="sum-hl-val" style={{ color: 'var(--blue)' }}>{maxStreak}s</div>
            <div className="sum-hl-lbl">Peak Flow</div>
          </div>
          <div className="sum-hl">
            <div className="sum-hl-val" style={{ color: logs.length > 0 ? 'var(--amber)' : 'var(--teal)' }}>{logs.length}</div>
            <div className="sum-hl-lbl">Incidents</div>
          </div>
        </div>
        <div className="sb">
          <div className="sr"><span className="sk">Session XP</span><span className="sv">+{xp}</span></div>
          <div className="sr"><span className="sk">Duration</span><span className="sv">{totalTime}s</span></div>
          <div className="sr"><span className="sk">Peak Score</span><span className="sv">{peakFocus}%</span></div>
          <div className="sr"><span className="sk">Data Points</span><span className="sv">{sessionHistory.length}</span></div>
          <div className="sr"><span className="sk">Rating</span><span className="sv" style={{ fontSize: '13px' }}>{grade}</span></div>
        </div>
        <button className="btn-full" onClick={onReset}>Return to Dashboard →</button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
//  TEACHER VIEW MODAL — Enhanced with better light mode
// ══════════════════════════════════════════════════════════════
const TeacherView = ({ isDark, onClose }) => {
  const [classFocus, setClassFocus] = useState(82);
  const [distracted, setDistracted] = useState(2);
  useEffect(() => {
    const id = setInterval(() => {
      setClassFocus(Math.floor(Math.random() * (88 - 75 + 1) + 75));
      setDistracted(Math.floor(Math.random() * 4));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const students = [
    { name: 'Ali Khan',        id: '102', score: 90, focused: true  },
    { name: 'Muneeba Tariq',   id: '105', score: 85, focused: true  },
    { name: 'Rafay Khalil',    id: '099', score: 78, focused: true, live: true },
    { name: 'Hamza Siddiqui', id: '118', score: 35, focused: false },
    { name: 'Sara Ahmed',      id: '121', score: 78, focused: true  },
    { name: 'Bilal Raza',      id: '134', score: 22, focused: false },
  ];
  const initials = n => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const active = 30 - distracted;

  const T = isDark ? {
    bg: 'rgba(8,12,20,0.97)',
    border: 'rgba(255,255,255,0.07)',
    border2: 'rgba(255,255,255,0.13)',
    text: '#e8ecf4', text2: '#a0aec0', muted: '#4a5568',
    surface: 'rgba(255,255,255,0.03)',
  } : {
    bg: 'rgba(230,238,255,0.97)',
    border: 'rgba(0,40,100,0.10)',
    border2: 'rgba(0,40,100,0.18)',
    text: '#0f172a', text2: '#334155', muted: '#64748b',
    surface: 'rgba(0,40,100,0.04)',
  };

  const stats = [
    { label: 'Class Avg Focus', value: `${classFocus}%`, color: '#60a5fa', sub: 'above threshold' },
    { label: 'Active Learners', value: active,            color: '#34d399', sub: 'of 30 students' },
    { label: 'Needs Attention', value: distracted, color: distracted > 2 ? '#f87171' : '#fbbf24', sub: distracted > 2 ? 'intervention needed' : 'monitoring' },
  ];

  return (
    <div className="page-enter" style={{
      position: 'fixed', inset: 0, zIndex: 8000,
      background: isDark ? 'rgba(0,0,0,0.88)' : 'rgba(30,60,110,0.45)',
      backdropFilter: 'blur(22px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <AnimatedBG score={75} isDark={isDark}/>
      <div style={{
        background: T.bg,
        border: `1px solid ${T.border2}`,
        borderRadius: '22px',
        width: '100%', maxWidth: '880px', maxHeight: '90vh', overflow: 'auto',
        backdropFilter: 'blur(28px)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(0,229,184,0.4),transparent)' }}/>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: `1px solid ${T.border}` }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e5b8', animation: 'pdot 1.4s infinite' }}/>
              <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.12em', textTransform: 'uppercase', color: '#00e5b8', fontWeight: 600 }}>Live Analytics</span>
            </div>
            <div style={{ fontSize: '21px', fontWeight: 700, color: T.text, fontFamily: "'Outfit',sans-serif" }}>Educator Analytics Panel</div>
            <div style={{ fontSize: '12px', color: T.text2, marginTop: '3px', fontFamily: "'Outfit',sans-serif" }}>Real-time class engagement monitoring</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="rec-indicators">
              <span className="ind-pill ind-rec"><span className="sdot p"/>REC ON</span>
              <span className="ind-pill ind-cam"><span className="sdot p"/>CAM LIVE</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'rgba(0,229,184,0.09)', border: '1px solid rgba(0,229,184,0.24)', borderRadius: '9px', fontSize: '12px', fontWeight: 600, color: '#00e5b8', fontFamily: "'JetBrains Mono',monospace" }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00e5b8', animation: 'pdot 1.4s infinite' }}/>
              CS-401 · 30 Students
            </div>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '9px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: 'rgba(248,113,113,0.09)', color: '#f87171', border: '1px solid rgba(248,113,113,0.24)', fontFamily: "'Outfit',sans-serif", transition: 'all .18s' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(248,113,113,0.18)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(248,113,113,0.09)'}>
              ← Back
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: `1px solid ${T.border}` }}>
          {stats.map((s, i) => (
            <div key={i} style={{ padding: '22px 28px', borderRight: i < 2 ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.muted, fontFamily: "'JetBrains Mono',monospace", marginBottom: '10px' }}>{s.label}</div>
              <div style={{ fontSize: '36px', fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '-1px', color: s.color, lineHeight: 1, transition: 'color .4s' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: T.muted, marginTop: '6px', fontFamily: "'JetBrains Mono',monospace" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Student Feed */}
        <div style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.muted, fontFamily: "'JetBrains Mono',monospace" }}>Live Student Feed</span>
            <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono',monospace", color: T.muted, background: T.surface, border: `1px solid ${T.border}`, padding: '3px 10px', borderRadius: '7px' }}>{students.length} shown</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {students.map(s => {
              const barC = s.score >= 75 ? '#00e5b8' : s.score >= 50 ? '#fbbf24' : '#f87171';
              const rowBg = s.live ? (isDark ? 'rgba(0,229,184,0.05)' : 'rgba(0,229,184,0.08)') : s.focused ? T.surface : (isDark ? 'rgba(248,113,113,0.05)' : 'rgba(248,113,113,0.06)');
              const rowBorder = s.live ? 'rgba(0,229,184,0.28)' : s.focused ? T.border : 'rgba(248,113,113,0.22)';
              const avBg = s.live ? 'rgba(0,229,184,0.15)' : s.focused ? 'rgba(0,229,184,0.09)' : 'rgba(248,113,113,0.1)';
              const avCol = s.live || s.focused ? '#00e5b8' : '#f87171';
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 16px', borderRadius: '12px', border: `1px solid ${rowBorder}`, background: rowBg, transition: 'all .2s' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: avBg, color: avCol, border: `1px solid ${rowBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>
                    {initials(s.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: T.text, fontFamily: "'Outfit',sans-serif" }}>{s.name}</span>
                      {s.live && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '8px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: '5px', background: 'rgba(0,229,184,0.1)', color: '#00e5b8', border: '1px solid rgba(0,229,184,0.25)', fontFamily: "'JetBrains Mono',monospace" }}>
                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00e5b8', animation: 'pdot 1.2s infinite' }}/>LIVE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '10px', color: T.muted, fontFamily: "'JetBrains Mono',monospace", marginTop: '2px' }}>ID · {s.id}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <div style={{ width: '110px', height: '4px', background: T.border, borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${s.score}%`, height: '100%', background: barC, borderRadius: '3px', transition: 'width .5s ease' }}/>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: barC, minWidth: '36px', textAlign: 'right' }}>{s.score}%</span>
                    <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 9px', borderRadius: '6px', fontFamily: "'JetBrains Mono',monospace", background: s.focused ? 'rgba(0,229,184,0.1)' : 'rgba(248,113,113,0.1)', color: s.focused ? '#00e5b8' : '#f87171', border: `1px solid ${s.focused ? 'rgba(0,229,184,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
                      {s.focused ? 'Focused' : 'Distracted'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
const AttentionDashboard = () => {
  const [score,     setScore]    = useState(100);
  const [distract,  setDistract] = useState(false);
  const [state,     setState]    = useState("System Standby...");
  const [streak,    setStreak]   = useState(0);
  const [maxStreak, setMax]      = useState(0);
  const [xp,        setXp]       = useState(120);
  const [summary,   setSummary]  = useState(false);
  const [matrix,    setMatrix]   = useState(false);
  const [matTxt,    setMatTxt]   = useState('');
  const [logs,      setLogs]     = useState([]);
  const [hist,      setHist]     = useState([]);
  const [isDark,    setIsDark]   = useState(true);
  const [maxed,     setMaxed]    = useState(false);
  const [minimized, setMinimized]= useState(false);
  const [showTeacherView, setShowTeacherView] = useState(false);
  const [liveAlerts,      setLiveAlerts]      = useState([]);
  const [sessionStart]  = useState(Date.now());
  const [sessionClock,  setSessionClock]  = useState('00:00');
  const [connStatus,    setConnStatus]    = useState('connecting');
  const [prevScore,     setPrevScore]     = useState(100);

  // TASK 2 (Frontend): New state for microphone audio level (0–100)
  const [micLevel, setMicLevel] = useState(0);

  const wsRef   = useRef(null);
  const vidRef  = useRef(null);
  const canvRef = useRef(null);
  // TASK 2 (Frontend): Refs for Web Audio API cleanup and alert cooldown
  const audioCtxRef       = useRef(null);
  const analyserRef       = useRef(null);
  const micRafRef         = useRef(null);
  const lastAudioAlertRef = useRef(0);
  // Tracks how many consecutive frames volume stayed above threshold
  const highVolumeFrames  = useRef(0);
  const AUDIO_ALERT_THRESHOLD  = 60;   // 0–100 scale
  const AUDIO_ALERT_FRAMES     = 20;   // ~20 rAF frames (~333ms) above threshold before alert
  const AUDIO_ALERT_COOLDOWN   = 15000; // 15 seconds between audio alerts

  const isSleep  = dSleep(state);
  const isMob    = dMobile(state);
  const isNoFace = dNoFace(state);
  const isSpoof  = dSpoof(state);
  // TASK 1 (Frontend): Detect multi-face / proxy alert from incoming state
  const isProxy  = dProxy(state);
  const isCrit   = isNoFace || isSpoof || isProxy;

  const stCls   = isSleep ? 'sleep' : isMob ? 'mobile' : isCrit ? 'crit' : distract ? 'warn' : 'ok';
  const pillCls = isSleep ? 'sleep' : isMob ? 'live'   : isCrit ? 'crit' : distract ? 'warn' : 'live';
  const stLbl   = isSleep ? 'SLEEP DETECTED'
    : isMob    ? 'MOBILE DEVICE'
    : isSpoof  ? 'SPOOFING ALERT'
    : isProxy  ? 'PROXY ALERT'
    : isNoFace ? 'SUBJECT ABSENT'
    : distract ? 'DISTRACTED'
    : state.replace('System Standby...', 'LIVE MONITORING');
  const scCol   = isSleep ? 'var(--purple)' : score >= 80 ? 'var(--teal)' : score >= 50 ? 'var(--amber)' : 'var(--red)';
  const riskScore = Math.min(100, Math.max(0, 100 - score + (logs.length * 4)));
  const scoreTrend = score - prevScore;

  // Session clock
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
      const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const s = (elapsed % 60).toString().padStart(2, '0');
      setSessionClock(`${m}:${s}`);
    }, 1000);
    return () => clearInterval(id);
  }, [sessionStart]);

  // Fullscreen
  const toggleMax = () => {
    if (!maxed) { document.documentElement.requestFullscreen?.().catch(() => {}); }
    else        { document.exitFullscreen?.().catch(() => {}); }
    setMaxed(m => !m);
  };
  useEffect(() => {
    const h = () => setMaxed(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  // Matrix ticker
  useEffect(() => {
    if (!matrix) return;
    const id = setInterval(() => {
      const h1 = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      const h2 = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      const lat = (Math.random() * 5 + 2).toFixed(2);
      const ln = `> [SYS_OK] YAW:${(Math.random() * .4).toFixed(3)} PITCH:${(Math.random() * .6).toFixed(3)}\n`
               + `> [ALLOC] 0x${h1}→0x${h2} LAT:${lat}ms\n`
               + `> [INFER] Conf:${(Math.random() * 99 + 1).toFixed(1)}% Thread:Active\n`;
      setMatTxt(p => (p + ln).split('\n').slice(-18).join('\n'));
    }, 400);
    return () => clearInterval(id);
  }, [matrix]);

  // Push toast
  const pushToast = useCallback((msg, level = 'crit', icon = '⚠') => {
    const id = Date.now() + Math.random();
    const time = new Date().toLocaleTimeString();
    setLiveAlerts(a => [...a.slice(-4), { id, msg, level, icon, time }]);
    setTimeout(() => setLiveAlerts(a => a.filter(x => x.id !== id)), 5000);
  }, []);

  const closeToast = useCallback((id) => {
    setLiveAlerts(a => a.filter(x => x.id !== id));
  }, []);

  // WebSocket + camera
  useEffect(() => {
    if (summary) return;
    setConnStatus('connecting');
    wsRef.current = new WebSocket(SOCKET_URL);

    wsRef.current.onopen = () => {
      setState("Connection Established");
      setConnStatus('connected');
      pushToast('AI proctoring engine connected', 'info', '✅');
    };
    wsRef.current.onerror = () => {
      setState("Network Error");
      setConnStatus('error');
    };
    wsRef.current.onclose = () => {
      if (connStatus !== 'connected') setConnStatus('error');
    };

    // TASK 2 (Frontend): Request both video AND audio in getUserMedia
    navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: true })
      .then(stream => {
        // Attach video track to the video element
        if (vidRef.current) {
          // Only pass video tracks to the video element to keep it muted/silent
          const videoStream = new MediaStream(stream.getVideoTracks());
          vidRef.current.srcObject = videoStream;
          vidRef.current.play().catch(() => {});
        }

        // TASK 2 (Frontend): Set up Web Audio API for mic monitoring
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          audioCtxRef.current = new AudioContext();
          analyserRef.current = audioCtxRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          analyserRef.current.smoothingTimeConstant = 0.6;

          const source = audioCtxRef.current.createMediaStreamSource(stream);
          source.connect(analyserRef.current);

          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

          const trackMic = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            // Compute average volume across all frequency bins, scale to 0–100
            const avg = dataArray.reduce((s, v) => s + v, 0) / dataArray.length;
            const level = Math.min(100, Math.round((avg / 255) * 100 * 3.5));
            setMicLevel(level);

            // TASK 2 (Frontend): Send audio alert via WebSocket if consistently loud
            if (level > AUDIO_ALERT_THRESHOLD) {
              highVolumeFrames.current += 1;
            } else {
              highVolumeFrames.current = 0;
            }

            if (
              highVolumeFrames.current >= AUDIO_ALERT_FRAMES &&
              wsRef.current?.readyState === WebSocket.OPEN &&
              Date.now() - lastAudioAlertRef.current > AUDIO_ALERT_COOLDOWN
            ) {
              lastAudioAlertRef.current = Date.now();
              highVolumeFrames.current  = 0;
              wsRef.current.send(JSON.stringify({ type: 'audio_alert', volume: level }));
            }

            micRafRef.current = requestAnimationFrame(trackMic);
          };

          trackMic();
        } catch (audioErr) {
          console.warn('Web Audio API setup failed:', audioErr);
        }
      })
      .catch(() => setState("Camera Authentication Failed"));

    const emoRx = /[\u{1F600}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;

    wsRef.current.onmessage = ev => {
      try {
        const d = JSON.parse(ev.data);
        setPrevScore(score);
        setScore(d.focus_score);
        const cs = d.student_state.replace(emoRx, '').trim();
        setState(cs);
        setDistract(d.focus_score < 70);

        if (dMobile(cs))  pushToast('Mobile phone detected — please put it away', 'crit', '📱');
        if (dSleep(cs))   pushToast('Student appears to be sleeping', 'warn', '💤');
        if (dNoFace(cs))  pushToast('Face not detected in frame', 'crit', '⊘');
        if (dSpoof(cs))   pushToast('Spoofing attempt detected', 'crit', '⚠');
        // TASK 1 (Frontend): Toast for multi-face / proxy alert
        if (dProxy(cs))   pushToast('Multiple persons detected — Proxy Alert!', 'crit', '👥');

        if (d.incident_logs) {
          setLogs(prev => {
            if (d.incident_logs.length > prev.length) {
              const latest = d.incident_logs[d.incident_logs.length - 1];
              const cleanAct = latest.activity.replace(emoRx, '').trim();
              pushToast(cleanAct, 'warn', '◉');
            }
            return d.incident_logs;
          });
        }

        setHist(h => [...h, { time: new Date().toLocaleTimeString(), score: d.focus_score, state: cs }]);
        if (d.focus_score >= 80) {
          setStreak(p => {
            const n = p + 1;
            setMax(m => n > m ? n : m);
            if (n % 50 === 0) setXp(x => x + 100);
            return n;
          });
        } else if (d.focus_score < 50) {
          setStreak(0);
        }
      } catch (e) { console.error(e); }
    };

    const iv = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN && vidRef.current?.readyState >= 2) {
        const ctx = canvRef.current.getContext('2d');
        ctx.drawImage(vidRef.current, 0, 0, 320, 240);
        wsRef.current.send(canvRef.current.toDataURL('image/jpeg', 0.5));
      }
    }, 150);

    return () => {
      clearInterval(iv);
      wsRef.current?.close();
      // TASK 2 (Frontend): Cleanup Web Audio resources on unmount
      if (micRafRef.current) cancelAnimationFrame(micRafRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      analyserRef.current = null;
    };
  }, [summary]);

  const exportCSV = () => {
    const rx = /[\u{1F600}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
    let csv = `data:text/csv;charset=utf-8,Session Report: ${STUDENT_NAME}\n\nTime,Activity\n`;
    logs.forEach(l => { csv += `${l.time},${l.activity.replace(rx, '').trim()}\n`; });
    const a = Object.assign(document.createElement('a'), { href: encodeURI(csv), download: `ProctorIQ_${STUDENT_NAME.replace(' ', '_')}.csv` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const logDot = act => {
    const a = act.toLowerCase();
    if (a.includes('sleep') || a.includes('drowsy')) return 'var(--purple)';
    if (a.includes('mobile') || a.includes('phone')) return 'var(--blue)';
    if (a.includes('spoof') || a.includes('not detected')) return 'var(--red)';
    if (a.includes('multiple') || a.includes('proxy')) return 'var(--red)';
    if (a.includes('noise') || a.includes('talking')) return 'var(--amber)';
    return 'var(--amber)';
  };

  const lastActivity = logs.length > 0
    ? logs[logs.length - 1].activity.replace(/[\u{1F600}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim()
    : 'Monitoring...';
  const isSuspicious = isCrit || isMob || isSleep || isProxy;

  // TASK 2 (Frontend): Mic level color — amber when quiet, red when loud
  const micColor = micLevel > AUDIO_ALERT_THRESHOLD ? 'var(--red)' : micLevel > 30 ? 'var(--amber)' : 'var(--teal)';

  // Minimized pill
  if (minimized) return (
    <>
      <style>{makeStyles(isDark)}</style>
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: isDark ? 'rgba(8,12,20,0.92)' : 'rgba(230,238,255,0.96)', border: '1px solid rgba(0,229,184,0.3)', borderRadius: '100px', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', fontWeight: 600, color: '#00e5b8', userSelect: 'none' }}
        onClick={() => setMinimized(false)}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e5b8', boxShadow: '0 0 8px #00e5b8', animation: 'pdot 2s infinite' }}/>
        ProctorIQ — {score}% · Click to restore
      </div>
    </>
  );

  // Summary screen
  if (summary) return (
    <>
      <style>{makeStyles(isDark)}</style>
      <div className="syn-root">
        <Summary xp={xp} maxStreak={maxStreak} sessionHistory={hist} logs={logs} isDark={isDark} onReset={() => window.location.reload()}/>
      </div>
    </>
  );

  return (
    <>
      <style>{makeStyles(isDark)}</style>
      <div className="syn-root">
        <AnimatedBG score={score} isDark={isDark}/>
        <ToastNotifications alerts={liveAlerts} onClose={closeToast}/>

        {/* Window controls */}
        <div className="win-ctrl">
          <button className="win-btn" onClick={() => setIsDark(d => !d)} title={isDark ? 'Light Mode' : 'Dark Mode'}>{isDark ? '☀' : '◑'}</button>
          <button className="win-btn" onClick={() => setMinimized(true)} title="Minimize">─</button>
          <button className="win-btn" onClick={toggleMax} title={maxed ? 'Restore' : 'Maximize'}>{maxed ? '⊡' : '⊞'}</button>
        </div>

        <video ref={vidRef} width="320" height="240" autoPlay playsInline muted
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -10 }}/>
        <canvas ref={canvRef} width="320" height="240"
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -10 }}/>

        {showTeacherView && <TeacherView isDark={isDark} onClose={() => setShowTeacherView(false)}/>}

        <div className="syn-wrap">

          {/* HEADER */}
          <header className="syn-hdr">
            <div className="brand">
              <div className="logo-mk"><Logo/></div>
              <div className="brand-txt">
                <div className="brand-name">ProctorIQ</div>
                <div className="brand-tag">Cognitive Attention Platform</div>
              </div>
            </div>
            <div className="hdr-r">
              <div className="rec-indicators">
                <span className="ind-pill ind-rec"><span className="sdot p"/>RECORDING ON</span>
                <span className="ind-pill ind-cam"><span className="sdot p"/>CAMERA ACTIVE</span>
                {/* TASK 2 (Frontend): MIC ACTIVE pill with dynamic level indicator */}
                <span className="ind-pill ind-mic" style={{ color: micColor, borderColor: micLevel > AUDIO_ALERT_THRESHOLD ? 'rgba(248,113,113,0.4)' : micLevel > 30 ? 'rgba(251,191,36,0.4)' : 'rgba(0,229,184,0.3)' }}>
                  <span className="sdot p" style={{ background: micColor }}/>
                  MIC ACTIVE
                  {/* Tiny bar visualising the level */}
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'flex-end',
                    gap: '1px',
                    marginLeft: '4px',
                    height: '10px',
                  }}>
                    {[0.25, 0.5, 0.75, 1.0].map((frac, idx) => (
                      <span key={idx} style={{
                        width: '2px',
                        borderRadius: '1px',
                        background: micLevel / 100 >= frac ? micColor : 'rgba(255,255,255,0.15)',
                        height: `${Math.round(frac * 10)}px`,
                        transition: 'background 0.15s',
                      }}/>
                    ))}
                  </span>
                </span>
              </div>
              <div className={`spill ${pillCls}`}>
                <div className={`sdot ${isCrit ? 'pf' : 'p'}`}/>{stLbl}
              </div>
              <button className="btn btn-t" onClick={() => setShowTeacherView(true)}>Teacher View</button>
              <button className="btn btn-g" onClick={() => setMatrix(m => !m)}>{matrix ? 'Standard' : 'Matrix'}</button>
              <button className="btn btn-d" onClick={() => setSummary(true)}>End Session</button>
            </div>
          </header>

          {/* CONNECTION STATUS */}
          <ConnectionBanner status={connStatus}/>

          {/* ACTIVITY PANEL */}
          <ActivityPanel
            lastActivity={lastActivity}
            statusLabel={stLbl}
            isSuspicious={isSuspicious}
            sessionTime={sessionClock}
          />

          {/* QUICK STATS — New feature */}
          <QuickStats score={score} logs={logs} hist={hist} sessionClock={sessionClock}/>

          {/* MAIN GRID */}
          <div className="main-grid">
            <div className={`score-card ${stCls}`}>
              <div className="sc-lbl">Attention Monitor</div>
              <FocusRing score={score} stateClass={stCls}/>

              {/* Risk gauge — new */}
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: "'JetBrains Mono',monospace", color: 'var(--muted)', marginBottom: '5px' }}>
                  <span>Cheating Risk</span>
                  <span style={{ color: riskScore > 50 ? 'var(--red)' : riskScore > 20 ? 'var(--amber)' : 'var(--teal)' }}>{riskScore}%</span>
                </div>
                <div className="confidence-track">
                  <div className="confidence-fill" style={{
                    width: `${riskScore}%`,
                    background: riskScore > 50 ? 'var(--red)' : riskScore > 20 ? 'var(--amber)' : 'var(--teal)',
                  }}/>
                </div>
              </div>

              <Sparkline history={hist}/>
              <AttentionHeatmap history={hist}/>
              <div className={`s-badge ${stCls}`}>
                {isSleep  ? '💤 Sleep Detected'
                  : isMob   ? '📱 Mobile Usage Detected'
                  : isSpoof ? '⚠ Spoofing Alert'
                  : isProxy ? '👥 Multiple Persons / Proxy Alert'
                  : isNoFace ? '⊘ Subject Not Detected'
                  : distract ? '◈ Distraction Detected'
                  : '◉ ' + (state.includes('Established') ? 'Active & Focused' : state)}
              </div>
            </div>

            <div className="mc">
              <div className="mr">
                <MCard label="Cognitive Score" icon="◎" value={`${score}%`}     color={scCol}   sub="Real-time"            barPct={score}                             delay="0.12s" trend={scoreTrend}/>
                <MCard label="Cheating Risk"   icon="⚠" value={`${riskScore}%`} color={riskScore > 50 ? 'var(--red)' : riskScore > 20 ? 'var(--amber)' : 'var(--teal)'} sub="Dynamic probability" barPct={riskScore} delay="0.14s"/>
                <MCard label="Flow Streak"     icon="⚡" value={`${streak}s`}    color="var(--text)"  sub="Current run"      barPct={(streak / Math.max(maxStreak, 1)) * 100} delay="0.16s"/>
                <MCard label="Session XP"      icon="◈" value={xp}               color="var(--amber)" sub={xp >= 220 ? 'Bonus active' : 'Accumulating'}               delay="0.18s"/>
              </div>
              <div className="mr">
                <MCard label="Peak Flow"    icon="▲" value={`${maxStreak}s`} color="var(--blue)"   sub="Session best"   delay="0.14s"/>
                <MCard label="Incidents"    icon="◉" value={logs.length}     color={logs.length > 0 ? 'var(--amber)' : 'var(--text)'} sub="This session" delay="0.18s"/>
                <MCard label="Data Points"  icon="≡" value={hist.length}     color="var(--subtle)" sub="Samples"         delay="0.22s"/>
                {/* TASK 2 (Frontend): Replaced Camera Auth card with Mic Level card */}
                <MCard label="Mic Level"    icon="♪" value={`${micLevel}%`}  color={micColor}      sub={micLevel > AUDIO_ALERT_THRESHOLD ? 'High Noise' : micLevel > 30 ? 'Noise Detected' : 'Quiet'} barPct={micLevel} delay="0.24s"/>
              </div>
            </div>
          </div>

          {/* TELEMETRY */}
          <div className={`tele ${isSleep ? 'sleep' : isMob ? '' : isCrit ? 'crit' : distract ? 'warn' : ''}`}>
            <div className="tele-hdr">
              <span className="tele-ttl">System Telemetry</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={`badge ${connStatus === 'connected' ? 'bg-t' : 'bg-r'}`}>
                  <span className="bdot"/>{connStatus === 'connected' ? 'Online' : 'Offline'}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', color: 'var(--muted)' }}>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
            {matrix ? (
              <div className="matrix-tm"><pre>{matTxt}</pre></div>
            ) : (
              <div className="tele-grid">
                <div className="tc">
                  <div className="tc-ttl">Engine</div>
                  <div className="tr"><span className="tk">Status</span><span className="badge bg-t"><span className="bdot"/>Active / WSS</span></div>
                  <div className="tr"><span className="tk">Vision</span><span className="tv">YOLOv8 Nano</span></div>
                  <div className="tr"><span className="tk">Landmarks</span><span className="tv">MediaPipe</span></div>
                  <div className="tr"><span className="tk">Latency</span><span className="tv">~12ms</span></div>
                  <div className="tr"><span className="tk">Interval</span><span className="tv">150ms</span></div>
                </div>
                <div className="tc">
                  <div className="tc-ttl">Session</div>
                  <div className="tr"><span className="tk">Subject</span><span className="tv">{STUDENT_NAME}</span></div>
                  <div className="tr"><span className="tk">Roll No</span><span className="tv">{STUDENT_ID_DISPLAY}</span></div>
                  <div className="tr"><span className="tk">Auth</span><span className="badge bg-t">Verified</span></div>
                  <div className="tr"><span className="tk">Recording</span><span className="badge bg-r"><span className="bdot"/>Active</span></div>
                  <div className="tr"><span className="tk">Duration</span><span className="tv">{sessionClock}</span></div>
                </div>
                <div className="tc">
                  <div className="tc-ttl">Detection State</div>
                  <div className="tr"><span className="tk">Attention</span><span className={`badge ${score >= 80 ? 'bg-t' : score >= 50 ? 'bg-a' : 'bg-r'}`}>{score}%</span></div>
                  <div className="tr"><span className="tk">Sleep</span><span className={`badge ${isSleep ? 'bg-p' : 'bg-t'}`}>{isSleep ? 'DETECTED' : 'Clear'}</span></div>
                  <div className="tr"><span className="tk">Mobile</span><span className={`badge ${isMob ? 'bg-b' : 'bg-t'}`}>{isMob ? 'DETECTED' : 'Clear'}</span></div>
                  <div className="tr"><span className="tk">Spoofing</span><span className={`badge ${isSpoof ? 'bg-r' : 'bg-t'}`}>{isSpoof ? 'ALERT' : 'Clear'}</span></div>
                  {/* TASK 1 (Frontend): Proxy/Multi-face row in telemetry */}
                  <div className="tr"><span className="tk">Proxy</span><span className={`badge ${isProxy ? 'bg-r' : 'bg-t'}`}>{isProxy ? 'ALERT' : 'Clear'}</span></div>
                  <div className="tr"><span className="tk">Mic Level</span><span className={`badge ${micLevel > AUDIO_ALERT_THRESHOLD ? 'bg-r' : micLevel > 30 ? 'bg-a' : 'bg-t'}`}>{micLevel}%</span></div>
                  <div className="tr"><span className="tk">Risk Score</span><span className={`badge ${riskScore > 50 ? 'bg-r' : riskScore > 20 ? 'bg-a' : 'bg-t'}`}>{riskScore}%</span></div>
                </div>
              </div>
            )}
            {isSleep && <div className="al-ban al-s"><span>💤</span><span>SLEEP DETECTED — Student appears to be asleep. Immediate attention required.</span></div>}
            {isMob && !isSleep && <div className="al-ban al-m"><span>📱</span><span>MOBILE USAGE — Mobile device detected in frame.</span></div>}
            {/* TASK 1 (Frontend): Proxy alert banner */}
            {isProxy && !isSleep && !isMob && <div className="al-ban al-c"><span>👥</span><span>PROXY ALERT — Multiple persons detected in frame. Possible cheating attempt.</span></div>}
            {isCrit && !isProxy && !isSleep && !isMob && <div className="al-ban al-c"><span>⚠</span><span>CRITICAL ALERT — {state}</span></div>}
            {!isCrit && !isSleep && !isMob && distract && <div className="al-ban al-w"><span>◈</span><span>DISTRACTION DETECTED — Refocus required immediately.</span></div>}
          </div>

          {/* TIMELINE + TRENDS */}
          <div className="dual-panel-grid">
            <div className="logs" style={{ animationDelay: '0.23s', height: '320px', display: 'flex', flexDirection: 'column' }}>
              <div className="logs-hdr" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
                <span className="logs-ttl">Activity Timeline</span>
              </div>
              <div className="tl-container">
                {logs.length === 0 ? (
                  <>
                    <div className="tl-item">
                      <div className="tl-line"/><div className="tl-dot teal"/>
                      <div className="tl-content"><div className="tl-time">Session Start</div><div className="tl-msg">Session Authenticated</div></div>
                    </div>
                    <div className="tl-item">
                      <div className="tl-line"/><div className="tl-dot teal"/>
                      <div className="tl-content"><div className="tl-time">—</div><div className="tl-msg">Webcam Engine Initiated</div></div>
                    </div>
                    <div className="tl-item">
                      <div className="tl-dot amber"/>
                      <div className="tl-content"><div className="tl-time">—</div><div className="tl-msg">Awaiting events...</div></div>
                    </div>
                  </>
                ) : (
                  logs.slice().reverse().map((log, i) => (
                    <div key={i} className="tl-item">
                      <div className="tl-line"/>
                      <div className={`tl-dot ${log.activity.includes('Mobile') || log.activity.includes('Sleep') || log.activity.includes('Multiple') || log.activity.includes('Noise') ? 'red' : 'amber'}`}/>
                      <div className="tl-content">
                        <div className="tl-time">{log.time}</div>
                        <div className="tl-msg">{log.activity.replace(/[\u{1F600}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <SuspiciousTrendsChart history={hist}/>
          </div>

          {/* INCIDENT LOGS */}
          <div className="logs">
            <div className="logs-hdr">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="logs-ttl">Incident Reports (Raw)</span>
                <span className="logs-cnt">{logs.length}</span>
              </div>
              {logs.length > 0 && (
                <button className="btn btn-g" style={{ padding: '5px 12px', fontSize: '11px' }} onClick={exportCSV}>
                  Export CSV ↓
                </button>
              )}
            </div>
            {logs.length === 0 ? (
              <div className="empty">
                <div className="ei">◎</div>
                No incidents recorded in current session.
              </div>
            ) : (
              logs.map((log, i) => {
                const clean = log.activity.replace(/[\u{1F600}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
                return (
                  <React.Fragment key={i}>
                    <div className="log-row">
                      <span className="lt">{log.time}</span>
                      <div className="ldot" style={{ background: logDot(clean) }}/>
                      <span><span className="ln">{STUDENT_NAME}</span><span className="la">— {clean}</span></span>
                    </div>
                    {i < logs.length - 1 && <div className="log-sep"/>}
                  </React.Fragment>
                );
              })
            )}
          </div>

          <footer className="footer-clean">
            <div className="footer-inner">
              <span>ProctorIQ Cognitive Attention Platform</span>
              <div className="footer-dot"/>
              <span>All rights reserved to Stack Overload</span>
              <div className="footer-dot"/>
              <span style={{ color: 'var(--teal)', opacity: 0.7 }}>v2.0.0</span>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default AttentionDashboard;