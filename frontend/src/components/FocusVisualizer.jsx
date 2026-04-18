import React, { useEffect, useRef, useState } from 'react';

const FocusVisualizer = ({ focusScore = 75 }) => {
  const canvasRef   = useRef(null);
  const dataPoints  = useRef(Array(100).fill(75));
  const animRef     = useRef(null);
  const frameRef    = useRef(0);

  // Stats derived from history
  const [stats, setStats] = useState({ avg: 75, min: 75, max: 75, trend: 0 });

  // Compute stats every 30 frames
  useEffect(() => {
    const pts = dataPoints.current;
    if (pts.length < 10) return;
    const avg = Math.round(pts.reduce((a, b) => a + b, 0) / pts.length);
    const min = Math.round(Math.min(...pts));
    const max = Math.round(Math.max(...pts));
    const recent  = pts.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const earlier = pts.slice(-30, -20).reduce((a, b) => a + b, 0) / 10;
    const trend = Math.round(recent - earlier);
    setStats({ avg, min, max, trend });
  }, [focusScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const SMOOTH = 0.12;

    const render = () => {
      frameRef.current++;

      // Smooth incoming score
      const last = dataPoints.current[dataPoints.current.length - 1];
      const next = last + (focusScore - last) * SMOOTH;
      dataPoints.current.push(next);
      if (dataPoints.current.length > 120) dataPoints.current.shift();

      const W = canvas.width;
      const H = canvas.height;
      const pts = dataPoints.current;
      const step = W / (pts.length - 1);

      ctx.clearRect(0, 0, W, H);

      // ── Color system ──────────────────────────────────────
      const score = pts[pts.length - 1];
      let lineColor, glowRGB;
      if (score >= 80)      { lineColor = '#00d4aa'; glowRGB = '0,212,170'; }
      else if (score >= 50) { lineColor = '#f6ad55'; glowRGB = '246,173,85'; }
      else                  { lineColor = '#fc6060'; glowRGB = '252,96,96'; }

      // ── Subtle grid ───────────────────────────────────────
      ctx.setLineDash([2, 10]);
      ctx.lineWidth = 1;
      [25, 50, 70, 75, 100].forEach(pct => {
        const y = H - (pct / 110) * H;
        const isBaseline = pct === 70;
        ctx.strokeStyle = isBaseline ? `rgba(${glowRGB},0.15)` : 'rgba(255,255,255,0.04)';
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        // Label
        if ([25, 50, 75, 100].includes(pct)) {
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.font = '500 9px DM Mono, monospace';
          ctx.fillText(`${pct}`, 4, y - 3);
          ctx.setLineDash([2, 10]);
        }
      });
      ctx.setLineDash([]);

      // ── Vertical time markers (every 20 pts) ─────────────
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i += 20) {
        const x = i * step;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }

      // ── Build path ────────────────────────────────────────
      const toXY = (i) => ({
        x: i * step,
        y: H - ((pts[i] / 110) * H)
      });

      // Smooth curve using bezier
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const { x, y } = toXY(i);
        if (i === 0) { ctx.moveTo(x, y); continue; }
        const prev = toXY(i - 1);
        const cpx  = (prev.x + x) / 2;
        ctx.bezierCurveTo(cpx, prev.y, cpx, y, x, y);
      }

      // Glow pass (wide, soft)
      ctx.shadowColor = lineColor;
      ctx.shadowBlur  = 18;
      ctx.strokeStyle = lineColor;
      ctx.lineWidth   = 3;
      ctx.lineJoin    = 'round';
      ctx.stroke();

      // Crisp pass (narrow, sharp)
      ctx.shadowBlur  = 0;
      ctx.strokeStyle = lineColor;
      ctx.lineWidth   = 1.8;
      ctx.stroke();

      // ── Area fill ─────────────────────────────────────────
      const last2 = toXY(pts.length - 1);
      ctx.lineTo(last2.x, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0,   `rgba(${glowRGB},0.22)`);
      grad.addColorStop(0.5, `rgba(${glowRGB},0.07)`);
      grad.addColorStop(1,   `rgba(${glowRGB},0.00)`);
      ctx.fillStyle = grad;
      ctx.fill();

      // ── Danger zone fill (below 50) ───────────────────────
      const dangerY = H - (50 / 110) * H;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, dangerY, W, H - dangerY);
      ctx.clip();
      const dangerGrad = ctx.createLinearGradient(0, dangerY, 0, H);
      dangerGrad.addColorStop(0, 'rgba(252,96,96,0.00)');
      dangerGrad.addColorStop(1, 'rgba(252,96,96,0.08)');
      ctx.fillStyle = dangerGrad;
      ctx.fillRect(0, dangerY, W, H - dangerY);
      ctx.restore();

      // ── Live dot + pulse ring ─────────────────────────────
      const { x: lx, y: ly } = toXY(pts.length - 1);
      const pulse = Math.sin(frameRef.current * 0.08) * 0.5 + 0.5; // 0–1

      // Outer ring (pulsing)
      ctx.beginPath();
      ctx.arc(lx, ly, 7 + pulse * 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${glowRGB},${0.2 + pulse * 0.15})`;
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      // Inner filled dot
      ctx.shadowColor = lineColor;
      ctx.shadowBlur  = 20;
      ctx.beginPath();
      ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
      ctx.fillStyle   = lineColor;
      ctx.fill();
      ctx.shadowBlur  = 0;

      // White center
      ctx.beginPath();
      ctx.arc(lx, ly, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fill();

      // ── Score callout next to dot ──────────────────────────
      const label = `${Math.round(score)}%`;
      const boxW = 38, boxH = 20, boxX = Math.min(lx + 10, W - boxW - 4), boxY = ly - 26;
      ctx.fillStyle   = lineColor;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 5);
      ctx.fill();
      ctx.fillStyle   = '#000';
      ctx.font        = '700 10px DM Mono, monospace';
      ctx.textAlign   = 'center';
      ctx.fillText(label, boxX + boxW / 2, boxY + 13);
      ctx.textAlign   = 'left';

      animRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animRef.current);
  }, [focusScore]);

  // ── Derived display values ──────────────────────────────────────────────
  const score = focusScore;
  const scoreColor = score >= 80 ? '#00d4aa' : score >= 50 ? '#f6ad55' : '#fc6060';
  const statusLabel = score >= 80 ? 'Highly Focused' : score >= 70 ? 'Focused' : score >= 50 ? 'Distracted' : 'Critical';
  const trendIcon = stats.trend > 2 ? '↑' : stats.trend < -2 ? '↓' : '→';
  const trendColor = stats.trend > 2 ? '#00d4aa' : stats.trend < -2 ? '#fc6060' : '#94a3b8';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500;600&display=swap');

        .fv-root { width: 100%; }

        /* Top bar */
        .fv-topbar {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 16px;
        }
        .fv-left { display: flex; align-items: center; gap: 10px; }
        .fv-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--fv-muted, #4a5568); font-family: 'DM Mono', monospace;
          display: flex; align-items: center; gap: 8px;
        }
        .fv-live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          animation: fvPulse 1.3s ease-in-out infinite;
        }
        @keyframes fvPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.7)} }

        .fv-status-chip {
          font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          padding: 3px 9px; border-radius: 6px; font-family: 'DM Mono', monospace;
          border: 1px solid currentColor; opacity: 0.85;
          transition: color 0.4s, border-color 0.4s;
        }

        .fv-score-big {
          font-family: 'DM Mono', monospace; font-size: 28px; font-weight: 600;
          letter-spacing: -1px; transition: color 0.4s;
        }

        /* Canvas wrapper */
        .fv-canvas-wrap {
          position: relative; border-radius: 10px; overflow: hidden;
          background: rgba(255,255,255,0.01);
        }
        .fv-canvas-wrap canvas { width: 100%; height: 140px; display: block; }

        /* Stats row */
        .fv-stats {
          display: flex; gap: 0; margin-top: 14px;
          border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; overflow: hidden;
        }
        .fv-stat {
          flex: 1; padding: 10px 14px; text-align: center;
          border-right: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          transition: background 0.2s;
        }
        .fv-stat:last-child { border-right: none; }
        .fv-stat:hover { background: rgba(255,255,255,0.04); }
        .fv-stat-label {
          font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;
          color: #4a5568; font-family: 'DM Mono', monospace; margin-bottom: 4px;
        }
        .fv-stat-val {
          font-size: 15px; font-weight: 700; font-family: 'DM Mono', monospace;
          letter-spacing: -.5px; color: #e2e8f0; transition: color .3s;
        }
      `}</style>

      <div className="fv-root">
        {/* Top bar */}
        <div className="fv-topbar">
          <div className="fv-left">
            <div className="fv-label">
              <div className="fv-live-dot" style={{ background: scoreColor }} />
              Focus Momentum
            </div>
            <div className="fv-status-chip" style={{ color: scoreColor }}>{statusLabel}</div>
          </div>
          <div className="fv-score-big" style={{ color: scoreColor }}>{score}%</div>
        </div>

        {/* Canvas */}
        <div className="fv-canvas-wrap">
          <canvas ref={canvasRef} width={900} height={160} />
        </div>

        {/* Stats row */}
        <div className="fv-stats">
          <div className="fv-stat">
            <div className="fv-stat-label">Avg</div>
            <div className="fv-stat-val">{stats.avg}%</div>
          </div>
          <div className="fv-stat">
            <div className="fv-stat-label">Peak</div>
            <div className="fv-stat-val" style={{ color: '#00d4aa' }}>{stats.max}%</div>
          </div>
          <div className="fv-stat">
            <div className="fv-stat-label">Low</div>
            <div className="fv-stat-val" style={{ color: '#fc6060' }}>{stats.min}%</div>
          </div>
          <div className="fv-stat">
            <div className="fv-stat-label">Trend</div>
            <div className="fv-stat-val" style={{ color: trendColor }}>
              {trendIcon} {Math.abs(stats.trend)}
            </div>
          </div>
          <div className="fv-stat">
            <div className="fv-stat-label">Status</div>
            <div className="fv-stat-val" style={{ color: scoreColor, fontSize: '11px' }}>{statusLabel}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FocusVisualizer;