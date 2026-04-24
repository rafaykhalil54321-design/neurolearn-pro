import React, { useState, useEffect, useRef } from 'react';



const SOCKET_URL = "ws://localhost:8000/ws/attention";

const RAFAY_ID   = '099';



// ══════════════════════════════════════════════════════════════

//  ANIMATED BACKGROUND — identical to AttentionDashboard

// ══════════════════════════════════════════════════════════════

const AnimatedBG = ({ score }) => {

  const ref = useRef(null);

  useEffect(()=>{

    const canvas=ref.current; if(!canvas)return;

    const ctx=canvas.getContext('2d');

    let id,frame=0,W,H,pts=[];

    const GRID=65;

    const resize=()=>{ W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight;

      pts=Array.from({length:70},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.18,vy:(Math.random()-.5)*.18,r:Math.random()*2+.8,phase:Math.random()*Math.PI*2}));

    };

    resize(); window.addEventListener('resize',resize);

    const draw=()=>{

      frame++; ctx.clearRect(0,0,W,H);

      const aR=score>=80?'0,229,184':score>=50?'251,191,36':'248,113,113';

      ctx.fillStyle='#080c14'; ctx.fillRect(0,0,W,H);

      ctx.lineWidth=1;

      for(let x=0;x<=W;x+=GRID){const a=.055+.025*Math.sin(frame*.0022+x*.01);ctx.strokeStyle=`rgba(${aR},${a})`;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}

      for(let y=0;y<=H;y+=GRID){const a=.055+.025*Math.sin(frame*.0022+y*.01);ctx.strokeStyle=`rgba(${aR},${a})`;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

      for(let x=0;x<=W;x+=GRID)for(let y=0;y<=H;y+=GRID){const p=Math.sin(frame*.005+x*.008+y*.008);ctx.beginPath();ctx.arc(x,y,1.4,0,Math.PI*2);ctx.fillStyle=`rgba(${aR},${.10+p*.07})`;ctx.fill();}

      pts.forEach(p=>{

        p.x+=p.vx;p.y+=p.vy;p.phase+=.007;

        if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;

        const alpha=.38+Math.sin(p.phase)*.22;

        pts.forEach(q=>{const dx=p.x-q.x,dy=p.y-q.y,d=Math.sqrt(dx*dx+dy*dy);if(d<130&&d>0){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=`rgba(${aR},${(1-d/130)*.16})`;ctx.lineWidth=.8;ctx.stroke();}});

        ctx.shadowColor=`rgba(${aR},.7)`;ctx.shadowBlur=7;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(${aR},${alpha})`;ctx.fill();ctx.shadowBlur=0;

      });

      const g1=ctx.createRadialGradient(W*.1,H*.15,0,W*.1,H*.15,W*.45);g1.addColorStop(0,`rgba(${aR},.065)`);g1.addColorStop(1,'transparent');ctx.fillStyle=g1;ctx.fillRect(0,0,W,H);

      const g2=ctx.createRadialGradient(W*.9,H*.85,0,W*.9,H*.85,W*.4);g2.addColorStop(0,'rgba(96,165,250,.05)');g2.addColorStop(1,'transparent');ctx.fillStyle=g2;ctx.fillRect(0,0,W,H);

      id=requestAnimationFrame(draw);

    };

    draw(); return()=>{cancelAnimationFrame(id);window.removeEventListener('resize',resize);};

  },[score]);

  return <canvas ref={ref} style={{position:'fixed',inset:0,width:'100%',height:'100%',zIndex:0,pointerEvents:'none',display:'block'}}/>;

};



// ══════════════════════════════════════════════════════════════

//  GLOBAL STYLES

// ══════════════════════════════════════════════════════════════

const CSS = `

  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap');

  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

  :root{

    --bg:#080c14; --panel:rgba(8,12,20,0.76); --glass:rgba(12,18,32,0.82);

    --surface:rgba(255,255,255,0.028); --surface2:rgba(255,255,255,0.05);

    --border:rgba(255,255,255,0.065); --borderB:rgba(255,255,255,0.13);

    --text:#e8ecf4; --text2:#a0aec0; --muted:#4a5568; --subtle:#64748b;

    --teal:#00e5b8; --tealDim:rgba(0,229,184,0.10); --tealGlow:rgba(0,229,184,0.20);

    --amber:#fbbf24; --ambDim:rgba(251,191,36,0.10);

    --red:#f87171; --redDim:rgba(248,113,113,0.10);

    --blue:#60a5fa; --blueDim:rgba(96,165,250,0.10);

    --green:#34d399;

    --r:12px; --rlg:18px; --rxl:22px;

  }

  html,body{font-family:'Outfit',sans-serif;-webkit-font-smoothing:antialiased;background:var(--bg);color:var(--text);}

  .td-root{min-height:100vh;background:transparent;color:var(--text);position:relative;overflow-x:hidden;}

  .td-root::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:.22;

    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");}

  .td-wrap{max-width:1060px;margin:0 auto;padding:28px 24px 48px;position:relative;z-index:1;}



  /* HEADER */

  .td-hdr{display:flex;justify-content:space-between;align-items:center;padding-bottom:22px;margin-bottom:28px;border-bottom:1px solid var(--border);animation:fsD .5s cubic-bezier(.16,1,.3,1) both;}

  .td-brand{display:flex;align-items:center;gap:14px;}

  .td-bico{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#00e5b8,#0088ff);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#000;box-shadow:0 0 22px rgba(0,229,184,0.3);}

  .td-bname{font-size:20px;font-weight:700;letter-spacing:-.3px;color:var(--text);}

  .td-bsub{font-size:11px;color:var(--subtle);margin-top:3px;font-family:'JetBrains Mono',monospace;letter-spacing:.05em;}

  .td-hdr-r{display:flex;align-items:center;gap:12px;}

  .td-eyebrow{display:flex;align-items:center;gap:7px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:var(--teal);font-family:'JetBrains Mono',monospace;}

  .td-ldot{width:6px;height:6px;border-radius:50%;background:var(--teal);box-shadow:0 0 8px var(--teal);animation:pdot 1.4s infinite;}

  @keyframes pdot{0%,100%{opacity:1}50%{opacity:.25}}

  .td-cbadge{display:inline-flex;align-items:center;gap:7px;padding:8px 16px;border-radius:9px;background:rgba(0,229,184,.08);border:1px solid rgba(0,229,184,.22);font-size:12px;font-weight:600;color:var(--teal);font-family:'JetBrains Mono',monospace;letter-spacing:.05em;}



  /* STATS */

  .td-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:18px;animation:fsU .5s cubic-bezier(.16,1,.3,1) .1s both;}

  .td-stat{background:var(--panel);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border:1px solid var(--border);border-radius:var(--rxl);padding:24px 22px;position:relative;overflow:hidden;transition:border-color .25s,transform .2s;}

  .td-stat:hover{border-color:var(--borderB);transform:translateY(-2px);}

  .td-stat-acc{position:absolute;bottom:0;left:0;right:0;height:2px;}

  .td-stat.blue .td-stat-acc{background:linear-gradient(90deg,var(--blue),#818cf8);}

  .td-stat.green .td-stat-acc{background:linear-gradient(90deg,var(--green),var(--teal));}

  .td-stat.red .td-stat-acc{background:linear-gradient(90deg,var(--red),#fb7185);}

  .td-stat.warn .td-stat-acc{background:linear-gradient(90deg,var(--amber),#fbbf24);}

  .td-stat-lbl{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin-bottom:12px;font-family:'JetBrains Mono',monospace;}

  .td-stat-val{font-size:38px;font-weight:800;font-family:'JetBrains Mono',monospace;letter-spacing:-1.5px;line-height:1;margin-bottom:6px;transition:color .4s;}

  .td-stat.blue .td-stat-val{color:var(--blue);}

  .td-stat.green .td-stat-val{color:var(--green);}

  .td-stat.red .td-stat-val{color:var(--red);}

  .td-stat.warn .td-stat-val{color:var(--amber);}

  .td-stat-sub{font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace;}



  /* FEED PANEL */

  .td-feed{background:var(--panel);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border:1px solid var(--border);border-radius:var(--rxl);padding:26px 28px;animation:fsU .5s cubic-bezier(.16,1,.3,1) .2s both;position:relative;overflow:hidden;}

  .td-feed::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,229,184,.25),transparent);opacity:.7;}

  .td-feed-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border);}

  .td-feed-ttl{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.14em;color:var(--muted);font-family:'JetBrains Mono',monospace;}

  .td-feed-cnt{font-size:10px;font-weight:600;color:var(--subtle);font-family:'JetBrains Mono',monospace;background:rgba(255,255,255,.04);border:1px solid var(--border);padding:3px 10px;border-radius:7px;}



  /* STUDENT ROWS */

  .td-row{display:flex;align-items:center;gap:14px;padding:13px 16px;border-radius:11px;border:1px solid;transition:all .2s;cursor:default;margin-bottom:8px;}

  .td-row:last-child{margin-bottom:0;}

  .td-row.ok{background:rgba(255,255,255,.02);border-color:var(--border);}

  .td-row.ok:hover{background:rgba(255,255,255,.04);border-color:var(--borderB);}

  .td-row.alert{background:rgba(248,113,113,.05);border-color:rgba(248,113,113,.2);}

  .td-row.alert:hover{background:rgba(248,113,113,.09);border-color:rgba(248,113,113,.3);}

  .td-row.lf{background:rgba(0,229,184,.04);border-color:rgba(0,229,184,.28);box-shadow:0 0 24px rgba(0,229,184,.06);}

  .td-row.lf:hover{background:rgba(0,229,184,.07);border-color:rgba(0,229,184,.42);}

  .td-row.ld{background:rgba(248,113,113,.05);border-color:rgba(248,113,113,.28);animation:apulse 2s ease-in-out infinite;}

  @keyframes apulse{0%,100%{box-shadow:0 0 16px rgba(248,113,113,.06)}50%{box-shadow:0 0 32px rgba(248,113,113,.18)}}



  .td-av{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;font-family:'JetBrains Mono',monospace;flex-shrink:0;letter-spacing:.05em;}

  .td-av.ok{background:var(--tealDim);color:var(--teal);border:1px solid rgba(0,229,184,.2);}

  .td-av.alert{background:var(--redDim);color:var(--red);border:1px solid rgba(248,113,113,.2);}

  .td-av.lf{background:rgba(0,229,184,.15);color:var(--teal);border:1px solid rgba(0,229,184,.4);box-shadow:0 0 12px rgba(0,229,184,.22);}

  .td-av.ld{background:rgba(248,113,113,.15);color:var(--red);border:1px solid rgba(248,113,113,.4);box-shadow:0 0 12px rgba(248,113,113,.22);}



  .td-info{flex:1;min-width:0;}

  .td-name{font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px;display:flex;align-items:center;gap:8px;}

  .td-id{font-size:10px;color:var(--muted);font-family:'JetBrains Mono',monospace;font-weight:500;letter-spacing:.08em;}

  .td-stxt{font-size:10px;color:var(--subtle);font-family:'JetBrains Mono',monospace;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;}

  .live-badge{display:inline-flex;align-items:center;gap:4px;font-size:8px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:2px 8px;border-radius:5px;font-family:'JetBrains Mono',monospace;background:var(--tealDim);color:var(--teal);border:1px solid rgba(0,229,184,.28);}

  .lbdot{width:4px;height:4px;border-radius:50%;background:var(--teal);animation:pdot 1.2s infinite;}



  .td-bar-wrap{display:flex;align-items:center;gap:12px;flex-shrink:0;}

  .td-bar-track{width:120px;height:4px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden;}

  .td-bar-fill{height:100%;border-radius:3px;transition:width .6s cubic-bezier(.34,1.56,.64,1);}

  .td-score{font-size:13px;font-weight:800;font-family:'JetBrains Mono',monospace;min-width:36px;text-align:right;letter-spacing:-.5px;}

  .td-chip{font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:3px 10px;border-radius:6px;font-family:'JetBrains Mono',monospace;white-space:nowrap;}

  .td-chip.ok{background:rgba(0,229,184,.1);color:var(--teal);border:1px solid rgba(0,229,184,.2);}

  .td-chip.alert{background:var(--redDim);color:var(--red);border:1px solid rgba(248,113,113,.2);}

  .td-chip.lf{background:rgba(0,229,184,.12);color:var(--teal);border:1px solid rgba(0,229,184,.3);}

  .td-chip.ld{background:var(--redDim);color:var(--red);border:1px solid rgba(248,113,113,.3);}

  .td-chip.conn{background:var(--ambDim);color:var(--amber);border:1px solid rgba(251,191,36,.25);}



  @keyframes fsU{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}

  @keyframes fsD{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:none}}



  @media(max-width:720px){.td-stats{grid-template-columns:1fr 1fr}.td-hdr{flex-direction:column;align-items:flex-start;gap:16px}.td-bar-track{width:80px}}

  @media(max-width:480px){.td-wrap{padding:18px 14px}.td-stats{grid-template-columns:1fr}.td-chip{display:none}}

`;



// ══════════════════════════════════════════════════════════════

//  TEACHER DASHBOARD

// ══════════════════════════════════════════════════════════════

export default function TeacherDashboard() {

  const [classFocus,    setClassFocus]    = useState(82);

  const [distractedStu, setDistractedStu] = useState(2);

  const [rafayScore,    setRafayScore]    = useState(null);

  const [rafayState,    setRafayState]    = useState('Connecting...');

  const wsRef = useRef(null);



  // Class-wide interval

  useEffect(()=>{

    const id=setInterval(()=>{

      setClassFocus(Math.floor(Math.random()*(88-75+1)+75));

      setDistractedStu(Math.floor(Math.random()*4));

    },3000);

    return()=>clearInterval(id);

  },[]);



  // WebSocket

  useEffect(()=>{

    wsRef.current=new WebSocket(SOCKET_URL);

    wsRef.current.onopen  = ()=>setRafayState('Connection Established.');

    wsRef.current.onerror = ()=>setRafayState('Network Error.');

    wsRef.current.onclose = ()=>setRafayState('Disconnected.');

    const rx=/[\u{1F600}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;

    wsRef.current.onmessage = ev=>{

      try{ const d=JSON.parse(ev.data); setRafayScore(d.focus_score); setRafayState(d.student_state.replace(rx,'').trim()); }

      catch(e){ console.error(e); }

    };

    return()=>wsRef.current?.close();

  },[]);



  const staticStudents = [

    {name:'Ali Khan',       id:'102',score:90,focused:true },

    {name:'Muneeba Tariq',  id:'105',score:85,focused:true },

    {name:'Hamza Siddiqui',id:'118',score:35,focused:false},

    {name:'Sara Ahmed',     id:'121',score:78,focused:true },

    {name:'Bilal Raza',     id:'134',score:22,focused:false},

  ];



  const activeCount = 30 - distractedStu;

  const initials    = n=>n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();



  const rafayConn = rafayScore===null;

  const rafayFoc  = !rafayConn && rafayScore>=70;

  const rafayBarC = rafayConn?'var(--amber)':rafayScore>=75?'var(--teal)':rafayScore>=50?'var(--amber)':'var(--red)';

  const rafayRow  = rafayConn?'ok':rafayFoc?'lf':'ld';

  const rafayAv   = rafayConn?'ok':rafayFoc?'lf':'ld';

  const rafayChip = rafayConn?'conn':rafayFoc?'lf':'ld';

  const rafayLbl  = rafayConn?'Connecting…':rafayFoc?'Focused':'Distracted';



  const bgScore = rafayScore ?? 80;



  return (

    <>

      <style>{CSS}</style>

      <div className="td-root">

        <AnimatedBG score={bgScore}/>



        <div className="td-wrap">



          {/* HEADER */}

          <header className="td-hdr">

            <div className="td-brand">

              <div className="td-bico">S</div>

              <div>

                <div className="td-bname">Synapse</div>

                <div className="td-bsub">Educator Analytics Panel</div>

              </div>

            </div>

            <div className="td-hdr-r">

              <div className="td-eyebrow"><div className="td-ldot"/>Live Session</div>

              <div className="td-cbadge">

                <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'var(--teal)',animation:'pdot 1.4s infinite'}}/>

                CS-401 · 30 Students

              </div>

            </div>

          </header>



          {/* STATS */}

          <div className="td-stats">

            <div className="td-stat blue">

              <div className="td-stat-acc"/>

              <div className="td-stat-lbl">Class Avg Focus</div>

              <div className="td-stat-val">{classFocus}%</div>

              <div className="td-stat-sub">above threshold</div>

            </div>

            <div className="td-stat green">

              <div className="td-stat-acc"/>

              <div className="td-stat-lbl">Active Learners</div>

              <div className="td-stat-val">{activeCount}</div>

              <div className="td-stat-sub">of 30 students</div>

            </div>

            <div className={`td-stat ${distractedStu>2?'red':'warn'}`}>

              <div className="td-stat-acc"/>

              <div className="td-stat-lbl">Needs Attention</div>

              <div className="td-stat-val">{distractedStu}</div>

              <div className="td-stat-sub">{distractedStu>2?'intervention needed':'monitoring'}</div>

            </div>

          </div>



          {/* FEED */}

          <div className="td-feed">

            <div className="td-feed-hdr">

              <span className="td-feed-ttl">Live Student Feed</span>

              <span className="td-feed-cnt">{staticStudents.length+1} shown</span>

            </div>



            {/* Rafay — live WebSocket row */}

            <div className={`td-row ${rafayRow}`}>

              <div className={`td-av ${rafayAv}`}>RK</div>

              <div className="td-info">

                <div className="td-name">

                  Rafay Khalil

                  <span className="live-badge"><span className="lbdot"/>LIVE</span>

                </div>

                <div className="td-id">ID · {RAFAY_ID}</div>

                <div className="td-stxt">{rafayState}</div>

              </div>

              <div className="td-bar-wrap">

                <div className="td-bar-track">

                  <div className="td-bar-fill" style={{width:rafayConn?'0%':`${rafayScore}%`,background:rafayBarC}}/>

                </div>

                <div className="td-score" style={{color:rafayBarC}}>{rafayConn?'--':`${rafayScore}%`}</div>

                <div className={`td-chip ${rafayChip}`}>{rafayLbl}</div>

              </div>

            </div>



            {/* Static students */}

            {staticStudents.map(s=>{

              const barC=s.score>=75?'var(--teal)':s.score>=50?'var(--amber)':'var(--red)';

              const type=s.focused?'ok':'alert';

              return (

                <div key={s.id} className={`td-row ${type}`}>

                  <div className={`td-av ${type}`}>{initials(s.name)}</div>

                  <div className="td-info">

                    <div className="td-name">{s.name}</div>

                    <div className="td-id">ID · {s.id}</div>

                  </div>

                  <div className="td-bar-wrap">

                    <div className="td-bar-track"><div className="td-bar-fill" style={{width:`${s.score}%`,background:barC}}/></div>

                    <div className="td-score" style={{color:barC}}>{s.score}%</div>

                    <div className={`td-chip ${type}`}>{s.focused?'Focused':'Distracted'}</div>

                  </div>

                </div>

              );

            })}

          </div>



        </div>

      </div>

    </>

  );

}