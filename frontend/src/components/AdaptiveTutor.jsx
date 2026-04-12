import React, { useEffect, useState } from 'react';

export default function AdaptiveTutor() {
  const [focusScore, setFocusScore] = useState(100);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/attention');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setFocusScore(data.focus_score);
    };
    return () => ws.close();
  }, []);

  const isFocused = focusScore >= 75;
  const scoreColor = isFocused ? '#22d3ee' : '#f59e0b';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');

        .at-root {
          font-family: 'DM Sans', sans-serif;
          max-width: 860px;
          margin: 24px auto;
        }

        .at-card {
          background: rgba(255,255,255,0.02);
          border-radius: 28px;
          overflow: hidden;
          transition: border-color 0.5s ease, box-shadow 0.5s ease;
        }

        .at-card.focused {
          border: 1px solid rgba(34,211,238,0.2);
          box-shadow: 0 0 48px rgba(34,211,238,0.06), inset 0 1px 0 rgba(34,211,238,0.08);
        }

        .at-card.distracted {
          border: 1px solid rgba(245,158,11,0.25);
          box-shadow: 0 0 48px rgba(245,158,11,0.07), inset 0 1px 0 rgba(245,158,11,0.1);
        }

        /* Header */
        .at-header {
          padding: 28px 36px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .at-header.focused { background: rgba(34,211,238,0.04); }
        .at-header.distracted { background: rgba(245,158,11,0.04); }

        .at-chapter-tag {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #475569;
          font-family: 'JetBrains Mono', monospace;
          margin-bottom: 8px;
        }

        .at-chapter-title {
          font-size: 20px;
          font-weight: 800;
          color: #f1f5f9;
          letter-spacing: -0.5px;
          line-height: 1.3;
        }

        .at-mode-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: 'JetBrains Mono', monospace;
          transition: all 0.4s ease;
        }

        .at-mode-badge.focused {
          background: rgba(34,211,238,0.1);
          color: #22d3ee;
          border: 1px solid rgba(34,211,238,0.25);
        }

        .at-mode-badge.distracted {
          background: rgba(245,158,11,0.1);
          color: #f59e0b;
          border: 1px solid rgba(245,158,11,0.25);
        }

        .at-score-block { text-align: right; min-width: 80px; }

        .at-score-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #475569;
          font-family: 'JetBrains Mono', monospace;
          margin-bottom: 4px;
        }

        .at-score-value {
          font-size: 36px;
          font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: -1px;
          line-height: 1;
          transition: color 0.5s ease;
        }

        /* Progress bar */
        .at-score-bar {
          margin-top: 8px;
          width: 80px;
          height: 3px;
          background: rgba(255,255,255,0.07);
          border-radius: 2px;
          overflow: hidden;
        }

        .at-score-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease, background 0.5s ease;
        }

        /* Content Area */
        .at-body { padding: 36px; }

        .at-focused-content { animation: at-fade-in 0.5s ease; }
        .at-distracted-content { animation: at-fade-in 0.5s ease; }

        @keyframes at-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .at-text-block {
          font-size: 17px;
          line-height: 1.9;
          color: #94a3b8;
          font-weight: 400;
          margin-bottom: 20px;
        }

        .at-text-block:last-child { margin-bottom: 0; }

        /* Simplified mode */
        .at-simplified-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .at-simplified-icon {
          width: 36px; height: 36px;
          background: rgba(245,158,11,0.12);
          border: 1px solid rgba(245,158,11,0.25);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .at-simplified-title {
          font-size: 14px;
          font-weight: 700;
          color: #f59e0b;
          letter-spacing: 0.05em;
        }

        .at-simplified-sub {
          font-size: 11px;
          color: #78716c;
          font-family: 'JetBrains Mono', monospace;
          margin-top: 2px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .at-point-list { list-style: none; display: flex; flex-direction: column; gap: 14px; }

        .at-point {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px 20px;
          background: rgba(245,158,11,0.04);
          border: 1px solid rgba(245,158,11,0.1);
          border-radius: 14px;
          transition: all 0.2s ease;
        }

        .at-point:hover {
          background: rgba(245,158,11,0.07);
          border-color: rgba(245,158,11,0.2);
        }

        .at-point-num {
          width: 24px; height: 24px;
          background: rgba(245,158,11,0.15);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          color: #f59e0b;
          font-family: 'JetBrains Mono', monospace;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .at-point-text {
          font-size: 15px;
          line-height: 1.65;
          color: #cbd5e1;
          font-weight: 400;
        }

        .at-point-text strong { color: #fbbf24; font-weight: 700; }
      `}</style>

      <div className="at-root">
        <div className={`at-card ${isFocused ? 'focused' : 'distracted'}`}>

          {/* Header */}
          <div className={`at-header ${isFocused ? 'focused' : 'distracted'}`}>
            <div>
              <div className="at-chapter-tag">Chapter 1 · Neural Networks</div>
              <div className="at-chapter-title">How AI Neural Networks Work</div>
              <div className={`at-mode-badge ${isFocused ? 'focused' : 'distracted'}`}>
                {isFocused ? '🧠' : '⚡'} {isFocused ? 'Deep Learning Mode' : 'Quick Review Mode'}
              </div>
            </div>

            <div className="at-score-block">
              <div className="at-score-label">Live Focus</div>
              <div className="at-score-value" style={{ color: scoreColor }}>{focusScore}%</div>
              <div className="at-score-bar">
                <div
                  className="at-score-bar-fill"
                  style={{ width: `${focusScore}%`, background: scoreColor }}
                ></div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="at-body">
            {isFocused ? (
              <div className="at-focused-content">
                <p className="at-text-block">
                  Neural networks are computing systems inspired by the biological neural networks that constitute animal brains. An ANN is based on a collection of connected units or nodes called artificial neurons, which loosely model the neurons in a biological brain.
                </p>
                <p className="at-text-block">
                  Each connection, like the synapses in a biological brain, can transmit a signal to other neurons. An artificial neuron receives a signal then processes it and can signal neurons connected to it. The "signal" at a connection is a real number, and the output of each neuron is computed by some non-linear function of the sum of its inputs.
                </p>
              </div>
            ) : (
              <div className="at-distracted-content">
                <div className="at-simplified-header">
                  <div className="at-simplified-icon">⚠️</div>
                  <div>
                    <div className="at-simplified-title">Let's Make It Simpler</div>
                    <div className="at-simplified-sub">Focus dropping — switching to review mode</div>
                  </div>
                </div>
                <ul className="at-point-list">
                  <li className="at-point">
                    <div className="at-point-num">01</div>
                    <div className="at-point-text">
                      <strong>Neural Networks</strong> kaam karte hain computer ke dimaagh ki tarah — they learn from data instead of following fixed rules.
                    </div>
                  </li>
                  <li className="at-point">
                    <div className="at-point-num">02</div>
                    <div className="at-point-text">
                      Yeh chote chote hisson se milte hain jinhe <strong>Artificial Neurons</strong> kehte hain — har neuron connected hai dusron se.
                    </div>
                  </li>
                  <li className="at-point">
                    <div className="at-point-num">03</div>
                    <div className="at-point-text">
                      Har neuron <strong>signals receive</strong> karta hai, process karta hai, aur phir agle neurons ko forward kar deta hai.
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}