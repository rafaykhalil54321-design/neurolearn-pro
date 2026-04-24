import React, { useEffect, useRef, useState } from 'react';

// ══════════════════════════════════════════════════════════════
//  FOCUS VISUALIZER — cohesive with Synapse / Teacher design
// ══════════════════════════════════════════════════════════════
const FocusVisualizer = ({ focusScore = 75 }) => {
  const canvasRef  = useRef(null);
  const dataPoints = useRef(Array(100).fill(75));
  const animRef    = useRef(null);
  const frameRef   = useRef(0);
  const [stats, setStats] = useState({ avg:75, min:75, max:75, trend:0 });

  // Compute stats on each score change
  useEffect(()=>{
    const pts = dataPoints.current;
    if(pts.length<10) return;
    const avg    = Math.round(pts.reduce((a,b)=>a+b,0)/pts.length);
    const min    = Math.round(Math.min(...pts));
    const max    = Math.round(Math.max(...pts));
    const recent  = pts.slice(-10).reduce((a,b)=>a+b,0)/10;
    const earlier = pts.slice(-30,-20).reduce((a,b)=>a+b,0)/10;
    setStats({ avg, min, max, trend:Math.round(recent-earlier) });
  },[focusScore]);

  useEffect(()=>{
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const SMOOTH = 0.12;

    const render = ()=>{
      frameRef.current++;
      const last = dataPoints.current[dataPoints.current.length-1];
      dataPoints.current.push(last+(focusScore-last)*SMOOTH);
      if(dataPoints.current.length>120) dataPoints.current.shift();

      const W   = canvas.width;
      const H   = canvas.height;
      const pts = dataPoints.current;
      const step = W/(pts.length-1);
      ctx.clearRect(0,0,W,H);

      const score = pts[pts.length-1];
      let lineColor, glowRGB;
      if(score>=80)      { lineColor='#00e5b8'; glowRGB='0,229,184'; }
      else if(score>=50) { lineColor='#fbbf24'; glowRGB='251,191,36'; }
      else               { lineColor='#f87171'; glowRGB='248,113,113'; }

      // Grid
      ctx.setLineDash([2,10]); ctx.lineWidth=1;
      [25,50,70,75,100].forEach(pct=>{
        const y=H-(pct/110)*H;
        ctx.strokeStyle=pct===70?`rgba(${glowRGB},.15)`:'rgba(255,255,255,.04)';
        ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
        if([25,50,75,100].includes(pct)){
          ctx.setLineDash([]);
          ctx.fillStyle='rgba(255,255,255,.12)';
          ctx.font='500 9px JetBrains Mono, monospace';
          ctx.fillText(`${pct}`,4,y-3);
          ctx.setLineDash([2,10]);
        }
      });
      ctx.setLineDash([]);

      // Vertical time markers
      ctx.strokeStyle='rgba(255,255,255,.03)'; ctx.lineWidth=1;
      for(let i=0;i<pts.length;i+=20){const x=i*step;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}

      const toXY=i=>({x:i*step,y:H-((pts[i]/110)*H)});

      // Bezier curve path
      ctx.beginPath();
      for(let i=0;i<pts.length;i++){
        const {x,y}=toXY(i);
        if(i===0){ctx.moveTo(x,y);continue;}
        const prev=toXY(i-1),cpx=(prev.x+x)/2;
        ctx.bezierCurveTo(cpx,prev.y,cpx,y,x,y);
      }

      // Glow pass
      ctx.shadowColor=lineColor; ctx.shadowBlur=18;
      ctx.strokeStyle=lineColor; ctx.lineWidth=3; ctx.lineJoin='round'; ctx.stroke();

      // Crisp pass
      ctx.shadowBlur=0; ctx.strokeStyle=lineColor; ctx.lineWidth=1.8; ctx.stroke();

      // Area fill
      const last2=toXY(pts.length-1);
      ctx.lineTo(last2.x,H); ctx.lineTo(0,H); ctx.closePath();
      const grad=ctx.createLinearGradient(0,0,0,H);
      grad.addColorStop(0,`rgba(${glowRGB},.22)`);
      grad.addColorStop(.5,`rgba(${glowRGB},.07)`);
      grad.addColorStop(1,`rgba(${glowRGB},.00)`);
      ctx.fillStyle=grad; ctx.fill();

      // Danger zone (below 50)
      const dangerY=H-(50/110)*H;
      ctx.save(); ctx.beginPath(); ctx.rect(0,dangerY,W,H-dangerY); ctx.clip();
      const dg=ctx.createLinearGradient(0,dangerY,0,H);
      dg.addColorStop(0,'rgba(248,113,113,.00)'); dg.addColorStop(1,'rgba(248,113,113,.09)');
      ctx.fillStyle=dg; ctx.fillRect(0,dangerY,W,H-dangerY); ctx.restore();

      // Live dot + pulse ring
      const {x:lx,y:ly}=toXY(pts.length-1);
      const pulse=Math.sin(frameRef.current*0.08)*.5+.5;
      ctx.beginPath(); ctx.arc(lx,ly,7+pulse*4,0,Math.PI*2);
      ctx.strokeStyle=`rgba(${glowRGB},${.2+pulse*.15})`; ctx.lineWidth=1.5; ctx.stroke();
      ctx.shadowColor=lineColor; ctx.shadowBlur=20;
      ctx.beginPath(); ctx.arc(lx,ly,4.5,0,Math.PI*2); ctx.fillStyle=lineColor; ctx.fill();
      ctx.shadowBlur=0;
      ctx.beginPath(); ctx.arc(lx,ly,1.8,0,Math.PI*2); ctx.fillStyle='rgba(255,255,255,.85)'; ctx.fill();

      // Score callout
      const label=`${Math.round(score)}%`;
      const bW=38,bH=20,bX=Math.min(lx+10,W-bW-4),bY=ly-26;
      ctx.fillStyle=lineColor;
      ctx.beginPath(); ctx.roundRect(bX,bY,bW,bH,5); ctx.fill();
      ctx.fillStyle='#000'; ctx.font='700 10px JetBrains Mono, monospace';
      ctx.textAlign='center'; ctx.fillText(label,bX+bW/2,bY+13); ctx.textAlign='left';

      animRef.current=requestAnimationFrame(render);
    };

    render();
    return()=>cancelAnimationFrame(animRef.current);
  },[focusScore]);

  const score      = focusScore;
  const scoreColor = score>=80?'#00e5b8':score>=50?'#fbbf24':'#f87171';
  const statusLbl  = score>=80?'Highly Focused':score>=70?'Focused':score>=50?'Distracted':'Critical';
  const trendIcon  = stats.trend>2?'↑':stats.trend<-2?'↓':'→';
  const trendColor = stats.trend>2?'#00e5b8':stats.trend<-2?'#f87171':'#64748b';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .fv-root { width: 100%; font-family: 'Outfit', sans-serif; }

        /* Top bar */
        .fv-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .fv-left   { display: flex; align-items: center; gap: 10px; }
        .fv-lbl    {
          font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
          color: #4a5568; font-family: 'JetBrains Mono', monospace;
          display: flex; align-items: center; gap: 8px;
        }
        .fv-ldot { width: 6px; height: 6px; border-radius: 50%; animation: fvPulse 1.3s ease-in-out infinite; }
        @keyframes fvPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.7)} }

        .fv-chip {
          font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          padding: 3px 9px; border-radius: 6px; font-family: 'JetBrains Mono', monospace;
          border: 1px solid currentColor; opacity: 0.85;
          transition: color 0.4s, border-color 0.4s;
        }
        .fv-score {
          font-family: 'JetBrains Mono', monospace; font-size: 28px; font-weight: 600;
          letter-spacing: -1px; transition: color 0.4s;
        }

        /* Canvas wrapper */
        .fv-canvas-wrap {
          position: relative; border-radius: 11px; overflow: hidden;
          background: rgba(255,255,255,0.012);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .fv-canvas-wrap canvas { width: 100%; height: 140px; display: block; }

        /* Stats row — matches panel glass style */
        .fv-stats {
          display: flex; gap: 0; margin-top: 14px;
          border: 1px solid rgba(255,255,255,0.065); border-radius: 12px;
          overflow: hidden; background: rgba(8,12,20,0.5);
          backdrop-filter: blur(12px);
        }
        .fv-stat {
          flex: 1; padding: 10px 14px; text-align: center;
          border-right: 1px solid rgba(255,255,255,0.065);
          transition: background 0.2s;
        }
        .fv-stat:last-child { border-right: none; }
        .fv-stat:hover { background: rgba(255,255,255,0.04); }
        .fv-stat-lbl {
          font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em;
          color: #4a5568; font-family: 'JetBrains Mono', monospace; margin-bottom: 5px;
        }
        .fv-stat-val {
          font-size: 15px; font-weight: 700; font-family: 'JetBrains Mono', monospace;
          letter-spacing: -.5px; color: #e8ecf4; transition: color .3s;
        }
      `}</style>

      <div className="fv-root">
        <div className="fv-topbar">
          <div className="fv-left">
            <div className="fv-lbl">
              <div className="fv-ldot" style={{background:scoreColor}}/>
              Focus Momentum
            </div>
            <div className="fv-chip" style={{color:scoreColor}}>{statusLbl}</div>
          </div>
          <div className="fv-score" style={{color:scoreColor}}>{score}%</div>
        </div>

        <div className="fv-canvas-wrap">
          <canvas ref={canvasRef} width={900} height={160}/>
        </div>

        <div className="fv-stats">
          <div className="fv-stat">
            <div className="fv-stat-lbl">Avg</div>
            <div className="fv-stat-val">{stats.avg}%</div>
          </div>
          <div className="fv-stat">
            <div className="fv-stat-lbl">Peak</div>
            <div className="fv-stat-val" style={{color:'#00e5b8'}}>{stats.max}%</div>
          </div>
          <div className="fv-stat">
            <div className="fv-stat-lbl">Low</div>
            <div className="fv-stat-val" style={{color:'#f87171'}}>{stats.min}%</div>
          </div>
          <div className="fv-stat">
            <div className="fv-stat-lbl">Trend</div>
            <div className="fv-stat-val" style={{color:trendColor}}>{trendIcon} {Math.abs(stats.trend)}</div>
          </div>
          <div className="fv-stat">
            <div className="fv-stat-lbl">Status</div>
            <div className="fv-stat-val" style={{color:scoreColor,fontSize:'11px'}}>{statusLbl}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FocusVisualizer;