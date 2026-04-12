import React, { useState, useEffect } from 'react';

export default function TeacherDashboard() {
  const [classFocus, setClassFocus] = useState(82);
  const [distractedStudents, setDistractedStudents] = useState(2);

  useEffect(() => {
    const interval = setInterval(() => {
      setClassFocus(Math.floor(Math.random() * (88 - 75 + 1) + 75));
      setDistractedStudents(Math.floor(Math.random() * 4));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const students = [
    { name: 'Ali Khan', id: '102', score: 90, focused: true },
    { name: 'Muneeba Tariq', id: '105', score: 85, focused: true },
    { name: 'Hamza Siddiqui', id: '118', score: 35, focused: false },
    { name: 'Sara Ahmed', id: '121', score: 78, focused: true },
    { name: 'Bilal Raza', id: '134', score: 22, focused: false },
  ];

  const activeCount = 30 - distractedStudents;

  const initials = (name) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');

        .td-root {
          font-family: 'DM Sans', sans-serif;
          max-width: 900px;
          margin: 24px auto;
          color: #e2e8f0;
        }

        .td-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 28px;
          overflow: hidden;
        }

        /* Header */
        .td-header {
          padding: 32px 40px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.02);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .td-header-left {}

        .td-eyebrow {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #475569;
          font-family: 'JetBrains Mono', monospace;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .td-live-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #22d3ee;
          animation: td-pulse 1.3s ease-in-out infinite;
        }
        @keyframes td-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .td-title {
          font-size: 24px;
          font-weight: 800;
          color: #f1f5f9;
          letter-spacing: -0.5px;
        }

        .td-subtitle {
          font-size: 13px;
          color: #64748b;
          margin-top: 4px;
          font-weight: 500;
        }

        .td-class-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: rgba(34,211,238,0.08);
          border: 1px solid rgba(34,211,238,0.2);
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          color: #22d3ee;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.1em;
        }

        /* Stats */
        .td-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .td-stat {
          padding: 32px 36px;
          border-right: 1px solid rgba(255,255,255,0.05);
          transition: background 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .td-stat:last-child { border-right: none; }
        .td-stat::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .td-stat.blue::after { background: linear-gradient(90deg, #22d3ee, #3b82f6); opacity: 1; }
        .td-stat.green::after { background: linear-gradient(90deg, #10b981, #34d399); opacity: 1; }
        .td-stat.red::after { background: linear-gradient(90deg, #f43f5e, #fb7185); opacity: 1; }
        .td-stat.warn::after { background: linear-gradient(90deg, #f59e0b, #fbbf24); opacity: 1; }

        .td-stat-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #475569;
          font-family: 'JetBrains Mono', monospace;
          margin-bottom: 12px;
        }

        .td-stat-value {
          font-size: 40px;
          font-weight: 800;
          letter-spacing: -1.5px;
          font-family: 'JetBrains Mono', monospace;
          line-height: 1;
          margin-bottom: 6px;
          transition: color 0.4s ease;
        }

        .td-stat.blue .td-stat-value { color: #22d3ee; }
        .td-stat.green .td-stat-value { color: #10b981; }
        .td-stat.red .td-stat-value { color: #f43f5e; }
        .td-stat.warn .td-stat-value { color: #f59e0b; }

        .td-stat-sub {
          font-size: 11px;
          color: #475569;
          font-weight: 500;
          font-family: 'JetBrains Mono', monospace;
        }

        /* Student Feed */
        .td-feed-section { padding: 32px 40px; }

        .td-feed-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .td-feed-title {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #64748b;
          font-family: 'JetBrains Mono', monospace;
        }

        .td-feed-count {
          font-size: 10px;
          font-weight: 700;
          color: #334155;
          font-family: 'JetBrains Mono', monospace;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          padding: 4px 10px;
          border-radius: 8px;
        }

        .td-student-list { display: flex; flex-direction: column; gap: 10px; }

        .td-student {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          border-radius: 16px;
          border: 1px solid;
          transition: all 0.25s ease;
          cursor: default;
        }

        .td-student.ok {
          background: rgba(255,255,255,0.02);
          border-color: rgba(255,255,255,0.06);
        }
        .td-student.ok:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.1);
        }

        .td-student.alert {
          background: rgba(244,63,94,0.04);
          border-color: rgba(244,63,94,0.15);
        }
        .td-student.alert:hover {
          background: rgba(244,63,94,0.07);
          border-color: rgba(244,63,94,0.25);
        }

        .td-avatar {
          width: 38px; height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
          flex-shrink: 0;
          letter-spacing: 0.05em;
        }

        .td-avatar.ok {
          background: rgba(34,211,238,0.1);
          color: #22d3ee;
          border: 1px solid rgba(34,211,238,0.2);
        }

        .td-avatar.alert {
          background: rgba(244,63,94,0.1);
          color: #f43f5e;
          border: 1px solid rgba(244,63,94,0.2);
        }

        .td-student-info { flex: 1; min-width: 0; }

        .td-student-name {
          font-size: 14px;
          font-weight: 700;
          color: #e2e8f0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 2px;
        }

        .td-student-id {
          font-size: 10px;
          color: #475569;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
          letter-spacing: 0.1em;
        }

        .td-bar-wrap { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }

        .td-bar-track {
          width: 120px;
          height: 4px;
          background: rgba(255,255,255,0.07);
          border-radius: 4px;
          overflow: hidden;
        }

        .td-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.6s ease;
        }

        .td-score-label {
          font-size: 13px;
          font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
          min-width: 36px;
          text-align: right;
          letter-spacing: -0.5px;
        }

        .td-status-chip {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 6px;
          font-family: 'JetBrains Mono', monospace;
          white-space: nowrap;
        }

        .td-status-chip.ok { background: rgba(16,185,129,0.1); color: #10b981; }
        .td-status-chip.alert { background: rgba(244,63,94,0.12); color: #f43f5e; }

        @media (max-width: 640px) {
          .td-stats { grid-template-columns: 1fr; }
          .td-stat { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .td-header { flex-direction: column; gap: 16px; }
          .td-bar-track { width: 80px; }
        }
      `}</style>

      <div className="td-root">
        <div className="td-card">

          {/* Header */}
          <div className="td-header">
            <div className="td-header-left">
              <div className="td-eyebrow">
                <div className="td-live-dot"></div>
                Live Analytics
              </div>
              <div className="td-title">Educator Analytics Panel</div>
              <div className="td-subtitle">Real-time class engagement monitoring</div>
            </div>
            <div className="td-class-badge">
              📚 CS-401 · 30 Students
            </div>
          </div>

          {/* Stats */}
          <div className="td-stats">
            <div className="td-stat blue">
              <div className="td-stat-label">Class Avg Focus</div>
              <div className="td-stat-value">{classFocus}%</div>
              <div className="td-stat-sub">above threshold</div>
            </div>

            <div className="td-stat green">
              <div className="td-stat-label">Active Learners</div>
              <div className="td-stat-value">{activeCount}</div>
              <div className="td-stat-sub">of 30 students</div>
            </div>

            <div className={`td-stat ${distractedStudents > 2 ? 'red' : 'warn'}`}>
              <div className="td-stat-label">Needs Attention</div>
              <div className="td-stat-value">{distractedStudents}</div>
              <div className="td-stat-sub">{distractedStudents > 2 ? 'intervention needed' : 'monitoring'}</div>
            </div>
          </div>

          {/* Student Feed */}
          <div className="td-feed-section">
            <div className="td-feed-header">
              <div className="td-feed-title">Live Student Feed</div>
              <div className="td-feed-count">{students.length} shown</div>
            </div>

            <div className="td-student-list">
              {students.map((s) => {
                const barColor = s.score >= 75 ? '#22d3ee' : s.score >= 50 ? '#f59e0b' : '#f43f5e';
                const type = s.focused ? 'ok' : 'alert';
                return (
                  <div key={s.id} className={`td-student ${type}`}>
                    <div className={`td-avatar ${type}`}>{initials(s.name)}</div>

                    <div className="td-student-info">
                      <div className="td-student-name">{s.name}</div>
                      <div className="td-student-id">ID: {s.id}</div>
                    </div>

                    <div className="td-bar-wrap">
                      <div className="td-bar-track">
                        <div className="td-bar-fill" style={{ width: `${s.score}%`, background: barColor }}></div>
                      </div>
                      <div className="td-score-label" style={{ color: barColor }}>{s.score}%</div>
                      <div className={`td-status-chip ${type}`}>{s.focused ? 'Focused' : 'Distracted'}</div>
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