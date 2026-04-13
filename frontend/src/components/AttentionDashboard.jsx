import React, { useEffect, useState, useRef } from 'react';
import FocusVisualizer from './FocusVisualizer';

// 🛑 LOCAL TESTING URL (Railway par push karne se pehle isay wss://neurolearn-pro-production.up.railway.app/ws/attention kar dena)
const SOCKET_URL = "ws://localhost:8000/ws/attention";

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

    // 🌐 Connection ban raha hai
    socketRef.current = new WebSocket(SOCKET_URL);

    // ✅ Connection Successful
    socketRef.current.onopen = () => {
      console.log("🚀 Connected to AI Engine!");
      setStudentState("AI Engine Connected ✅");
    };

    // ❌ Connection Error
    socketRef.current.onerror = () => {
      setStudentState("Connection Failed ❌");
    };

    // 📸 Camera Permission
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    }).catch(() => setStudentState("Camera Error ❌"));

    // 🧠 Server se Score wapis aana
    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setCurrentScore(data.focus_score);
        setStudentState(data.student_state);
        setIsDistracted(data.focus_score < 70);
        if (data.frame) setLiveFrame(data.frame);

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

    // 📤 Camera ki photo Server ko bhejna (Har 200ms baad)
    const interval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN && videoRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Image tayar ki
        const base64Frame = canvas.toDataURL('image/jpeg', 0.4);
        
        // 🛑 YAHAN GHALTI THI: Yahan frame send karna hai, naya connection nahi banana!
        socketRef.current.send(base64Frame);
      }
    }, 200); 

    return () => {
      clearInterval(interval);
      if (socketRef.current) socketRef.current.close();
    };
  }, [showSummary, maxStreak]);

  if (showSummary) return <SummaryScreen xp={xp} maxStreak={maxStreak} />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .nl-root {
          min-height: 100vh;
          background: #050b18;
          font-family: 'DM Sans', sans-serif;
          color: #e2e8f0;
          position: relative;
          overflow-x: hidden;
        }

        .nl-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }

        .nl-root::after {
          content: '';
          position: fixed;
          top: -30%;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 400px;
          background: radial-gradient(ellipse, rgba(34,211,238,0.06) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .nl-container { max-width: 1200px; margin: 0 auto; padding: 32px 24px; position: relative; z-index: 1; }

        .nl-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          padding-bottom: 24px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .nl-brand { display: flex; align-items: center; gap: 12px; }

        .nl-brand-icon {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #22d3ee, #3b82f6);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          box-shadow: 0 0 20px rgba(34,211,238,0.3);
        }

        .nl-brand-title {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #f8fafc;
        }

        .nl-brand-title span { color: #22d3ee; }

        .nl-status {
          display: flex; align-items: center; gap: 8px;
          margin-top: 4px;
        }

        .nl-status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          animation: pulse-dot 1.5s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .nl-status-text {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-family: 'JetBrains Mono', monospace;
        }

        .nl-header-actions { display: flex; gap: 10px; align-items: center; }

        .nl-btn {
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }

        .nl-btn-ghost {
          background: rgba(255,255,255,0.04);
          color: #94a3b8;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .nl-btn-ghost:hover { background: rgba(255,255,255,0.08); color: #e2e8f0; border-color: rgba(255,255,255,0.15); }

        .nl-btn-zen {
          background: rgba(139,92,246,0.12);
          color: #a78bfa;
          border: 1px solid rgba(139,92,246,0.25);
        }
        .nl-btn-zen:hover { background: rgba(139,92,246,0.2); box-shadow: 0 0 16px rgba(139,92,246,0.2); }

        .nl-btn-danger {
          background: linear-gradient(135deg, #f43f5e, #e11d48);
          color: #fff;
          box-shadow: 0 4px 16px rgba(244,63,94,0.3);
        }
        .nl-btn-danger:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(244,63,94,0.4); }

        .nl-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        @media (max-width: 768px) { .nl-stats { grid-template-columns: repeat(2, 1fr); } }

        .nl-stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 24px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .nl-stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          border-radius: 20px 20px 0 0;
        }
        .nl-stat-card:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.12); }

        .nl-stat-card.blue::before { background: linear-gradient(90deg, #3b82f6, #22d3ee); }
        .nl-stat-card.amber::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
        .nl-stat-card.emerald::before { background: linear-gradient(90deg, #10b981, #34d399); }
        .nl-stat-card.red::before { background: linear-gradient(90deg, #f43f5e, #fb7185); }

        .nl-stat-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 10px;
          font-family: 'JetBrains Mono', monospace;
        }

        .nl-stat-value {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -1px;
          font-family: 'JetBrains Mono', monospace;
          line-height: 1;
        }

        .nl-stat-card.blue .nl-stat-value { color: #22d3ee; }
        .nl-stat-card.amber .nl-stat-value { color: #f59e0b; }
        .nl-stat-card.emerald .nl-stat-value { color: #10b981; }
        .nl-stat-card.red .nl-stat-value { color: #f43f5e; }

        .nl-panel {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 24px;
          padding: 32px;
          margin-bottom: 24px;
        }

        .nl-content-panel {
          background: rgba(255,255,255,0.02);
          border-radius: 28px;
          padding: 40px;
          transition: all 0.5s ease;
          filter: ${currentScore < 20 ? 'blur(15px)' : 'none'};
        }

        .nl-content-panel.focused {
          border: 1px solid rgba(34,211,238,0.2);
          box-shadow: 0 0 40px rgba(34,211,238,0.06);
        }

        .nl-content-panel.distracted {
          border: 1px solid rgba(244,63,94,0.2);
          box-shadow: 0 0 40px rgba(244,63,94,0.06);
        }

        .nl-content-text {
          font-size: 18px;
          line-height: 1.85;
          color: #cbd5e1;
          font-weight: 400;
        }

        .nl-distract-warning {
          margin-top: 24px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          background: rgba(244,63,94,0.06);
          border: 1px solid rgba(244,63,94,0.2);
          border-radius: 14px;
        }

        .nl-distract-warning-text {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #f43f5e;
          font-family: 'JetBrains Mono', monospace;
          animation: warn-pulse 2s ease-in-out infinite;
        }

        @keyframes warn-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .nl-pip {
          position: fixed;
          bottom: 32px; right: 32px;
          width: 220px;
          background: rgba(5,11,24,0.9);
          backdrop-filter: blur(20px);
          border: 1px solid #22d3ee;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          z-index: 100;
        }
      `}</style>

      <div className="nl-root">
        <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
        <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }} />

        {showCamera && liveFrame && (
          <div className="nl-pip">
            <img 
               src={liveFrame.startsWith('data') ? liveFrame : `data:image/jpeg;base64,${liveFrame}`} 
               style={{ width: '100%', height: 'auto', transform: 'scaleX(-1)', display: 'block' }} 
               alt="live"
            />
          </div>
        )}

        <div className="nl-container">
          <header className="nl-header">
            <div className="nl-brand">
              <div className="nl-brand-icon">🧠</div>
              <div>
                <div className="nl-brand-title">NeuroLearn <span>Pro</span></div>
                <div className="nl-status">
                  <div className="nl-status-dot" style={{ background: isDistracted ? '#f43f5e' : '#22d3ee' }}></div>
                  <span className="nl-status-text" style={{ color: isDistracted ? '#f43f5e' : '#22d3ee' }}>{studentState}</span>
                </div>
              </div>
            </div>
            <div className="nl-header-actions">
              <button className="nl-btn nl-btn-ghost" onClick={() => setShowCamera(!showCamera)}>📸 Monitor</button>
              <button className="nl-btn nl-btn-zen" onClick={() => setIsZenMode(!isZenMode)}>🧘 Zen</button>
              <button className="nl-btn nl-btn-danger" onClick={() => setShowSummary(true)}>Finish</button>
            </div>
          </header>

          <div className="nl-stats">
            <StatBox label="Focus" value={`${currentScore}%`} color={isDistracted ? "red" : "blue"} />
            <StatBox label="Streak" value={streak} color="amber" />
            <StatBox label="Best" value={maxStreak} color="blue" />
            <StatBox label="XP" value={xp} color="emerald" />
          </div>

          <div className="nl-panel">
            <FocusVisualizer focusScore={currentScore} />
          </div>

          <div className={`nl-content-panel ${isDistracted ? 'distracted' : 'focused'}`}>
            <p className="nl-content-text">
              Machine learning represents a paradigm shift in how we process information. By mimicking the neural plasticity of the human brain, these systems can identify complex patterns in real-time. This active learning module is currently being monitored for attention consistency to optimize your cognitive retention...
            </p>
            {isDistracted && (
              <div className="nl-distract-warning">
                <span className="nl-distract-warning-text">⚠️ Attention dropping — please refocus</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const StatBox = ({ label, value, color }) => (
  <div className={`nl-stat-card ${color}`}>
    <div className="nl-stat-label">{label}</div>
    <div className="nl-stat-value">{value}</div>
  </div>
);

const SummaryScreen = ({ xp, maxStreak }) => (
  <div className="sum-root">
    <div className="sum-card">
      <span className="sum-trophy">🏆</span>
      <div className="sum-title">Session Complete</div>
      <div className="sum-sub">Great work — your brain worked hard today.</div>
      <div className="sum-grid">
        <div className="sum-stat">
          <div className="sum-stat-label">Total XP</div>
          <div className="sum-stat-value">+{xp}</div>
        </div>
        <div className="sum-stat">
          <div className="sum-stat-label">Best Streak</div>
          <div className="sum-stat-value">{maxStreak}</div>
        </div>
      </div>
      <button className="sum-btn" onClick={() => window.location.reload()}>Start New Session</button>
    </div>
  </div>
);

export default AttentionDashboard;