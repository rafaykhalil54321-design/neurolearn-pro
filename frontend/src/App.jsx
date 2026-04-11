import React, { useState, useEffect } from 'react';
import AttentionDashboard from './components/AttentionDashboard';
import AdaptiveTutor from './components/AdaptiveTutor';
import TeacherDashboard from './components/TeacherDashboard';

function App() {
  const [currentView, setCurrentView] = useState('student');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 🌙 Dark Mode Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    // Background color ab dark mode ko support karega
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8 transition-colors duration-500">
      <div className="max-w-6xl mx-auto">
        
        {/* Navigation Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-500">
          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-white tracking-tight mb-4 md:mb-0">
            NeuroLearn <span className="text-blue-600 dark:text-blue-400">Platform</span>
          </h1>
          
          <div className="flex items-center gap-4">
            
            {/* ☀️/🌙 DARK MODE TOGGLE BUTTON */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 px-4 rounded-full font-bold bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-yellow-400 hover:scale-105 transition-transform shadow-inner"
            >
              {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>

            {/* View Toggle Buttons */}
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
              <button 
                onClick={() => setCurrentView('student')}
                className={`px-4 py-2 rounded-md font-semibold text-sm transition-all duration-300 ${currentView === 'student' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Student View
              </button>
              <button 
                onClick={() => setCurrentView('teacher')}
                className={`px-4 py-2 rounded-md font-semibold text-sm transition-all duration-300 ${currentView === 'teacher' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Teacher View
              </button>
            </div>
            
          </div>
        </div>
        
        {/* Render View */}
        {currentView === 'student' ? (
          <div className="animate-fade-in">
            <AttentionDashboard />
            {/* <AdaptiveTutor /> Agar tutor file banayi hai to isay uncomment kar lena */}
          </div>
        ) : (
          <div className="animate-fade-in">
            <TeacherDashboard />
          </div>
        )}

      </div>
    </div>
  );
}

export default App;