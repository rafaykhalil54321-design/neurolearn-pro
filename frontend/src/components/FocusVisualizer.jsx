import React, { useEffect, useRef } from 'react';

const FocusVisualizer = ({ focusScore = 75 }) => {
  const canvasRef = useRef(null);
  const dataPoints = useRef(Array(100).fill(75));
  const animationRef = useRef(null);

  const SMOOTHING_FACTOR = 0.1;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const render = () => {
      const lastPoint = dataPoints.current[dataPoints.current.length - 1];
      const smoothedValue = lastPoint + (focusScore - lastPoint) * SMOOTHING_FACTOR;

      dataPoints.current.push(smoothedValue);
      if (dataPoints.current.length > 100) dataPoints.current.shift();

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const step = width / 99;

      // Color based on score
      const score = dataPoints.current[dataPoints.current.length - 1];
      const lineColor = score >= 80 ? '#22d3ee' : score >= 50 ? '#f59e0b' : '#f43f5e';
      const glowColor = score >= 80 ? 'rgba(34,211,238,' : score >= 50 ? 'rgba(245,158,11,' : 'rgba(244,63,94,';

      // Fill gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, glowColor + '0.25)');
      gradient.addColorStop(0.6, glowColor + '0.05)');
      gradient.addColorStop(1, glowColor + '0)');

      // Grid lines
      ctx.setLineDash([2, 8]);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      [25, 50, 75].forEach(pct => {
        const y = height - (pct / 110) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Baseline
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      const baselineY = height - (70 / 110) * height;
      ctx.beginPath();
      ctx.moveTo(0, baselineY);
      ctx.lineTo(width, baselineY);
      ctx.stroke();

      // Glow shadow for line
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = 12;

      // Line path
      ctx.beginPath();
      for (let i = 0; i < dataPoints.current.length; i++) {
        const x = i * step;
        const y = height - ((dataPoints.current[i] / 110) * height);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Fill area
      const fillPath = new Path2D();
      for (let i = 0; i < dataPoints.current.length; i++) {
        const x = i * step;
        const y = height - ((dataPoints.current[i] / 110) * height);
        if (i === 0) fillPath.moveTo(x, y);
        else fillPath.lineTo(x, y);
      }
      fillPath.lineTo(width, height);
      fillPath.lineTo(0, height);
      fillPath.closePath();
      ctx.fillStyle = gradient;
      ctx.fill(fillPath);

      // Live dot
      const lastX = (dataPoints.current.length - 1) * step;
      const lastY = height - ((dataPoints.current[dataPoints.current.length - 1] / 110) * height);
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fillStyle = lineColor;
      ctx.fill();
      ctx.shadowBlur = 0;

      animationRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationRef.current);
  }, [focusScore]);

  const score = focusScore;
  const scoreColor = score >= 80 ? '#22d3ee' : score >= 50 ? '#f59e0b' : '#f43f5e';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@600;700&display=swap');
        .fv-wrap { position: relative; }
        .fv-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .fv-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #475569;
          font-family: 'JetBrains Mono', monospace;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .fv-live-indicator {
          width: 6px; height: 6px;
          border-radius: 50%;
          animation: fv-pulse 1.2s ease-in-out infinite;
        }
        @keyframes fv-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        .fv-score {
          font-family: 'JetBrains Mono', monospace;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.5px;
          transition: color 0.5s ease;
        }
        .fv-canvas-wrap {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
        }
        .fv-y-labels {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 4px 0;
          pointer-events: none;
        }
        .fv-y-label {
          font-size: 8px;
          font-family: 'JetBrains Mono', monospace;
          color: rgba(255,255,255,0.15);
          font-weight: 600;
          letter-spacing: 0.1em;
        }
      `}</style>

      <div className="fv-wrap">
        <div className="fv-header">
          <div className="fv-label">
            <div className="fv-live-indicator" style={{ background: scoreColor }}></div>
            Focus Momentum
          </div>
          <div className="fv-score" style={{ color: scoreColor }}>{focusScore}%</div>
        </div>

        <div className="fv-canvas-wrap">
          <canvas
            ref={canvasRef}
            width={800}
            height={150}
            style={{ width: '100%', height: '140px', display: 'block' }}
          />
        </div>
      </div>
    </>
  );
};

export default FocusVisualizer;