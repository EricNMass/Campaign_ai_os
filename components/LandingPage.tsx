
import React from 'react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="relative pt-24 pb-32">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black tracking-[0.3em] text-emerald-300 uppercase">AI RECRUITMENT SUITE ACTIVE</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 text-white">
            Get Hired with <span className="text-gradient">Precision</span> Intelligence.
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            Scan your resume, build tailored applications, and track your job search with executive-grade AI tools.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button
              onClick={onStart}
              className="group relative px-12 py-6 bg-white text-black font-black text-xl rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all overflow-hidden"
            >
              <span className="relative z-10 uppercase tracking-tight">Scan My Resume</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            <button className="px-12 py-6 glass-card text-white font-black text-xl rounded-2xl border border-white/10 hover:bg-white/5 transition-all uppercase tracking-tight">
              View Tools
            </button>
          </div>
        </div>

        {/* HUD Visualization */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
          {[
            { label: 'Keyword Sync', val: 'REAL-TIME', icon: '✨' },
            { label: 'ATS Ready', val: 'Better Resume', icon: '✅' },
            { label: 'Match Accuracy', val: '85% or better', icon: '🎯' },
            { label: 'Data Encryption', val: 'MIL-GRADE', icon: '🔒' }
          ].map((item, i) => (
            <div key={i} className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col items-center group hover:border-white/20 transition-all">
              <span className="text-2xl mb-2">{item.icon}</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.label}</span>
              <span className="text-lg font-black text-white mono tracking-tighter">{item.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[800px] pointer-events-none opacity-20 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600 rounded-full blur-[120px] animation-delay-2000 animate-pulse"></div>
      </div>
    </div>
  );
};

export default LandingPage;
