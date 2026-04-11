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
      // Smoothly interpolate towards the target focus score
      const lastPoint = dataPoints.current[dataPoints.current.length - 1];
      const smoothedValue = lastPoint + (focusScore - lastPoint) * SMOOTHING_FACTOR;
      
      dataPoints.current.push(smoothedValue);
      if (dataPoints.current.length > 100) dataPoints.current.shift();

      // Clear and Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const step = width / 99;

      // Professional Gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let i = 0; i < dataPoints.current.length; i++) {
        const x = i * step;
        const y = height - ((dataPoints.current[i] / 110) * height);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fillStyle = gradient;
      ctx.fill();

      animationRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationRef.current);
  }, [focusScore]);

  return (
    <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-xl mt-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-slate-400 uppercase">Focus Momentum</span>
        <span className="text-sm font-mono text-blue-400">{focusScore}%</span>
      </div>
      <canvas ref={canvasRef} width={800} height={150} className="w-full h-32" />
    </div>
  );
};

export default FocusVisualizer;