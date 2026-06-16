
import React, { useState } from 'react';

interface ScannerProps {
  onScan: (resume: string, jd: string) => void;
  isLoading: boolean;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, isLoading }) => {
  const [resume, setResume] = useState('');
  const [jd, setJd] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resume && jd) onScan(resume, jd);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 relative">
      <div className="text-center mb-16">
        <h2 className="text-5xl font-black text-white tracking-tighter mb-4">ATS Resume Scanner</h2>
        <p className="text-slate-400 font-medium max-w-2xl mx-auto">Compare your resume against a job description to find missing keywords and optimize your score.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Input A */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-transparent rounded-[2.5rem] blur opacity-50 group-hover:opacity-100 transition duration-1000"></div>
          <div className="relative glass-card rounded-[2.5rem] p-8 min-h-[550px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-black text-indigo-400 tracking-[0.4em] uppercase">Step 1: Paste Your Resume</span>
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => <div key={i} className="w-1 h-1 bg-white/20 rounded-full"></div>)}
              </div>
            </div>
            {isLoading && <div className="scanline"></div>}
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              className="flex-grow bg-transparent border-none text-white text-sm leading-relaxed placeholder-slate-600 outline-none resize-none selection:bg-indigo-500/30 font-medium"
              placeholder="Paste your existing resume text here..."
            />
          </div>
        </div>

        {/* Input B */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500/20 to-transparent rounded-[2.5rem] blur opacity-50 group-hover:opacity-100 transition duration-1000"></div>
          <div className="relative glass-card rounded-[2.5rem] p-8 min-h-[550px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-black text-rose-400 tracking-[0.4em] uppercase">Step 2: Job Description</span>
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => <div key={i} className="w-1 h-1 bg-white/20 rounded-full"></div>)}
              </div>
            </div>
            {isLoading && <div className="scanline"></div>}
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              className="flex-grow bg-transparent border-none text-white text-sm leading-relaxed placeholder-slate-600 outline-none resize-none selection:bg-rose-500/30 font-medium"
              placeholder="Paste the target job description here..."
            />
          </div>
        </div>

        <div className="lg:col-span-2 flex justify-center mt-12">
          <button
            type="submit"
            disabled={isLoading || !resume || !jd}
            className="group relative px-20 py-8 bg-white text-black rounded-3xl font-black text-2xl shadow-[0_20px_60px_-15px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 disabled:grayscale disabled:opacity-50 transition-all flex items-center space-x-4 overflow-hidden"
          >
            {isLoading ? (
              <>
                <div className="w-6 h-6 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
                <span className="tracking-tighter uppercase">Analyzing...</span>
              </>
            ) : (
              <>
                <span className="tracking-tighter uppercase">Scan Resume</span>
                <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Scanner;
