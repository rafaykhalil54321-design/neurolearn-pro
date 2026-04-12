import React, { useEffect, useState, useRef } from 'react';
import FocusVisualizer from './FocusVisualizer';

// ==========================================================
// 🛑 SIRF IS LINE MEIN APNA RAILWAY KA URL CHECK KAREIN
const RAILWAY_URL = "neurolearn-pro-production.up.railway.app"; 
// ==========================================================

const AttentionDashboard = () => {
  const [currentScore, setCurrentScore] = useState(100);
  const [isDistracted, setIsDistracted] = useState(false);
  const [studentState, setStudentState] = useState("AI Engine Standby...");
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [xp, setXp] = useState(120);
  const [showSummary, setShowSummary] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [liveFrame, setLiveFrame] = useState(null);

  const socketRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (showSummary) return;

    // WebSocket Connection using the URL from top
    socketRef.current = new WebSocket(`wss://${RAILWAY_URL}/ws/attention`);

    // 1. Camera access setup
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    }).catch(err => setStudentState("Camera Error ❌"));

    // 2. Receive processed data from Railway
    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setCurrentScore(data.focus_score);
        setStudentState(data.student_state);
        setIsDistracted(data.focus_score < 70);
        if (data.frame) setLiveFrame(data.frame);

        // Gamification Logic (XP & Streaks)
        if (data.focus_score >= 80) {
          setStreak(prev => {
            const next = prev + 1;
            if (next > maxStreak) setMaxStreak(next);
            if (next > 0 && next % 50 === 0) setXp(x => x + 100);
            return next;
          });
        } else if (data.focus_score < 50) {
          setStreak(0);
        }
      } catch (e) { console.error("Data Parse Error:", e); }
    };

    // 3. Send Camera frames to Railway (Every 150ms)
    const interval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN && videoRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64Frame = canvas.toDataURL('image/jpeg', 0.4); 
        socketRef.current.send(base64Frame);
      }
    }, 150);

    return () => { 
      clearInterval(interval);
      if (socketRef.current) socketRef.current.close(); 
    };
  }, [showSummary, maxStreak]); 

  if (showSummary) return <SummaryScreen xp={xp} maxStreak={maxStreak} />;

  return (
    <div className={`transition-all duration-700 min-h-screen font-['Inter'] ${isZenMode ? 'bg-slate-900' : 'bg-slate-50 dark:bg-slate-950'}`}>
      
      {/* 🌑 Blackout Overlay when system is locked */}
      <div className={`fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center transition-opacity duration-1000 ${currentScore === 0 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
           <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
           <h2 className="text-white text-2xl font-black tracking-widest uppercase">System Locked</h2>
           <p className="text-slate-500 text-sm mt-3 font-bold uppercase tracking-widest">Look at Camera to Resume Session</p>
      </div>

      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      <canvas ref={canvasRef} width="320" height="240" className="hidden" />

      {/* Monitor PIP */}
      {showCamera && (
        <div className="fixed bottom-8 right-8 w-56 bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-blue-500 z-[100]">
          <div className="bg-slate-900 text-white text-[10px] px-3 py-2 flex justify-between items-center font-bold">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> MONITOR
            </span>
            <button onClick={() => setShowCamera(false)}>✕</button>
          </div>
          {liveFrame && <img src={liveFrame.startsWith('data') ? liveFrame : `data:image/jpeg;base64,${liveFrame}`} className="w-full h-auto transform scale-x-[-1]" />}
        </div>
      )}

      <div className="max-w-6xl mx-auto p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">NeuroLearn <span className="text-blue-600">Pro</span></h2>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-2 ${isDistracted ? 'text-red-500' : 'text-blue-500'}`}>{studentState}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowCamera(!showCamera)} className="px-6 py-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest">Monitor 📸</button>
            <button onClick={() => setIsZenMode(!isZenMode)} className="px-6 py-2 bg-purple-100 text-purple-700 rounded-xl text-xs font-black uppercase tracking-widest">Zen Mode 🧘</button>
            <button onClick={() => setShowSummary(true)} className="bg-red-500 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest">Finish</button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
          <StatBox label="Focus" value={`${currentScore}%`} color={isDistracted ? "red" : "blue"} />
          <StatBox label="Streak" value={streak} color="amber" />
          <StatBox label="Max" value={maxStreak} color="blue" />
          <StatBox label="XP" value={xp} color="emerald" />
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm mb-10">
          <FocusVisualizer focusScore={currentScore} />
        </div>

        <div className={`p-12 bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800 transition-all duration-700 ${currentScore < 20 ? 'opacity-0 scale-95 blur-xl' : 'opacity-100 scale-100 blur-0'}`}>
          <p className="text-2xl leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
            Machine learning represents a paradigm shift in how we process information. By mimicking the neural plasticity of the human brain, these systems can identify complex patterns in real-time. This active learning module is currently being monitored for attention consistency to optimize your cognitive retention...
          </p>
          {isDistracted && currentScore > 0 && (
            <div className="mt-10 text-center text-red-500 font-black animate-pulse tracking-widest uppercase text-sm">⚠️ Attention Required to Unlock Content</div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, color }) => {
  const themes = {
    red: "bg-red-50 border-red-100 text-red-600",
    blue: "bg-blue-50 border-blue-100 text-blue-600",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-600",
    amber: "bg-orange-50 border-orange-100 text-orange-600"
  };
  return (
    <div className={`p-6 rounded-[2rem] border-2 transition-all ${themes[color] || themes.blue}`}>
      <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
  );
};

const SummaryScreen = ({ xp, maxStreak }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-['Inter']">
    <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-xl w-full text-center border border-slate-100">
      <span className="text-7xl mb-6 block">🏆</span>
      <h2 className="text-4xl font-black text-slate-800 mb-8">Session Complete</h2>
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="p-6 bg-slate-50 rounded-3xl"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Total XP</p><p className="text-3xl font-black">+{xp}</p></div>
        <div className="p-6 bg-slate-50 rounded-3xl"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Best Streak</p><p className="text-3xl font-black">{maxStreak}</p></div>
      </div>
      <button onClick={() => window.location.reload()} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-700 transition-all">Start New Session</button>
    </div>
  </div>
);

export default AttentionDashboard;