import React from 'react';

const ProctorIQLogo = ({ size = 48 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0px 0px 8px rgba(0, 212, 170, 0.4))' }}
    >
      <defs>
        <linearGradient id="proctorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d4aa" />
          <stop offset="100%" stopColor="#0099ff" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Outer Shield representing Proctoring & Security */}
      <path 
        d="M24 4 L8 10 V22 C8 32 15 42 24 46 C33 42 40 32 40 22 V10 L24 4 Z" 
        stroke="url(#proctorGrad)" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Inner AI Eye representing Vision/Tracking */}
      <path 
        d="M14 24 C14 24 19 17 24 17 C29 17 34 24 34 24 C34 24 29 31 24 31 C19 31 14 24 14 24 Z" 
        stroke="url(#proctorGrad)" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Glowing Pupil */}
      <circle 
        cx="24" 
        cy="24" 
        r="3.5" 
        fill="url(#proctorGrad)" 
        filter="url(#glow)" 
      />
    </svg>
  );
};

export default ProctorIQLogo;