import React, { useState, useEffect } from 'react';

export default function TeacherDashboard() {
  // Dummy data generate kar rahe hain class ke liye
  const [classFocus, setClassFocus] = useState(82);
  const [distractedStudents, setDistractedStudents] = useState(2);

  // Live effect deni ke liye number thora change hoga
  useEffect(() => {
    const interval = setInterval(() => {
      setClassFocus(Math.floor(Math.random() * (88 - 75 + 1) + 75));
      setDistractedStudents(Math.floor(Math.random() * 4));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 mt-6 max-w-4xl mx-auto">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Educator Analytics Panel
        </h2>
        <p className="text-gray-500 text-sm mt-1">Live overview of Class CS-401 (30 Students)</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-blue-600 text-sm font-semibold uppercase">Class Average Focus</p>
          <p className="text-3xl font-extrabold text-blue-700 mt-2">{classFocus}%</p>
        </div>
        
        <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
          <p className="text-green-600 text-sm font-semibold uppercase">Active Learners</p>
          <p className="text-3xl font-extrabold text-green-700 mt-2">{30 - distractedStudents} / 30</p>
        </div>

        <div className={`p-4 rounded-lg border ${distractedStudents > 2 ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'}`}>
          <p className={`${distractedStudents > 2 ? 'text-red-600' : 'text-orange-600'} text-sm font-semibold uppercase`}>Needs Intervention</p>
          <p className={`text-3xl font-extrabold mt-2 ${distractedStudents > 2 ? 'text-red-700' : 'text-orange-700'}`}>{distractedStudents} Students</p>
        </div>
      </div>

      {/* Detailed Student List (Dummy) */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Live Student Feed</h3>
        <div className="space-y-3">
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
            <span className="font-medium text-gray-700">Ali Khan (ID: 102)</span>
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="bg-blue-500 w-[90%] h-full"></div>
              </div>
              <span className="text-sm font-bold text-blue-600">90%</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
            <span className="font-medium text-gray-700">Muneeba (ID: 105)</span>
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="bg-blue-500 w-[85%] h-full"></div>
              </div>
              <span className="text-sm font-bold text-blue-600">85%</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-red-50 rounded border border-red-200">
            <span className="font-medium text-red-700">Hamza (ID: 118)</span>
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="bg-red-500 w-[35%] h-full"></div>
              </div>
              <span className="text-sm font-bold text-red-600">35% (Distracted)</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}