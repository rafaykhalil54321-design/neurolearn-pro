import React, { useEffect, useState } from 'react';

export default function AdaptiveTutor() {
  const [focusScore, setFocusScore] = useState(100);

  useEffect(() => {
    // Backend se focus score le raha hai
    const ws = new WebSocket('ws://localhost:8000/ws/attention');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setFocusScore(data.focus_score);
    };
    return () => ws.close();
  }, []);

  // Agar score 75 se zyada hai to bacha focused hai
  const isFocused = focusScore >= 75;

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 mt-6 max-w-4xl mx-auto">
      
      {/* Header Panel */}
      <div className={`p-4 rounded-lg mb-6 flex justify-between items-center transition-all duration-500 ${isFocused ? 'bg-blue-50 border border-blue-200' : 'bg-orange-50 border border-orange-200'}`}>
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Chapter 1: How AI Neural Networks Work
          </h2>
          <p className={`text-sm font-semibold mt-1 ${isFocused ? 'text-blue-600' : 'text-orange-600'}`}>
            {isFocused ? '🧠 Deep Learning Mode (Focus is High)' : '⚡ Quick Review Mode (Focus is Dropping)'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xs uppercase tracking-widest">Live Focus</p>
          <p className={`text-2xl font-bold ${isFocused ? 'text-blue-600' : 'text-orange-500'}`}>
            {focusScore}%
          </p>
        </div>
      </div>

      {/* Adaptive Content Section */}
      <div className="prose max-w-none text-gray-700">
        
        {isFocused ? (
          // DETAILED MODE (Jab Focus Acha Ho)
          <div className="space-y-4 animate-fade-in">
            <p className="text-lg leading-relaxed">
              Neural networks are computing systems inspired by the biological neural networks that constitute animal brains. An ANN is based on a collection of connected units or nodes called artificial neurons, which loosely model the neurons in a biological brain.
            </p>
            <p className="text-lg leading-relaxed">
              Each connection, like the synapses in a biological brain, can transmit a signal to other neurons. An artificial neuron receives a signal then processes it and can signal neurons connected to it. The "signal" at a connection is a real number, and the output of each neuron is computed by some non-linear function of the sum of its inputs.
            </p>
          </div>
        ) : (
          // SIMPLIFIED MODE (Jab Focus Gir Jaye)
          <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-400 animate-fade-in">
            <h3 className="font-bold text-orange-800 mb-3 text-lg">⚠️ Let's Make It Simpler:</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-lg">
                <span>👉</span> 
                <span><strong>Neural Networks</strong> computer ke dimaagh ki tarah kaam karte hain.</span>
              </li>
              <li className="flex items-start gap-2 text-lg">
                <span>👉</span> 
                <span>Yeh chote chote hisson se mil kar bante hain jinhe <strong>"Artificial Neurons"</strong> kehte hain.</span>
              </li>
              <li className="flex items-start gap-2 text-lg">
                <span>👉</span> 
                <span>Har neuron data (signals) receive karta hai, usay process karta hai, aur aage bhej deta hai.</span>
              </li>
            </ul>
          </div>
        )}
      </div>

    </div>
  );
}