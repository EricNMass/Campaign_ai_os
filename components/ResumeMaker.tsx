
import React, { useState, useEffect } from 'react';
import { optimizeResume } from '../services/geminiService';

const ResumeMaker: React.FC = () => {
  const [resume, setResume] = useState('');
  const [jd, setJd] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(0);

  const steps = [
    "ANALYZING KEYWORDS...",
    "REBUILDING SECTIONS...",
    "MATCHING PHRASEOLOGY...",
    "UPDATING METRICS...",
    "CHECKING ATS COMPATIBILITY...",
    "FINAL REVIEW..."
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      setStep(0);
      interval = setInterval(() => {
        setStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 2500);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleOptimize = async () => {
    if (!resume || !jd) return;
    setLoading(true);
    setCopied(false);
    try {
      const result = await optimizeResume(resume, jd);
      setOutput(result);
    } catch (error) {
      alert('Builder operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-6">
             <div className="w-12 h-0.5 bg-indigo-500"></div>
             <span className="text-[10px] font-black tracking-[0.5em] text-indigo-400 uppercase">AI Builder Mode</span>
          </div>
          <h2 className="text-6xl font-black text-white tracking-tighter leading-none">AI Resume Builder</h2>
          <p className="text-xl text-slate-400 max-w-2xl mt-6 font-medium">Auto-generate a new resume perfectly tailored to your target job description.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Input Interface */}
        <div className="space-y-8">
          <div className="glass-card p-10 rounded-[3rem] border-white/5 group relative overflow-hidden">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <span className="text-[11px] font-black text-slate-500 tracking-[0.4em] uppercase">Your Current Resume</span>
              <div className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-bold text-white/40">STEP 1</div>
            </div>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              className="w-full bg-transparent border-none text-white text-sm leading-relaxed placeholder-slate-700 outline-none h-64 resize-none relative z-10 font-medium"
              placeholder="Paste your existing resume text..."
            />
          </div>

          <div className="glass-card p-10 rounded-[3rem] border-white/5 group relative overflow-hidden">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <span className="text-[11px] font-black text-slate-500 tracking-[0.4em] uppercase">Target Job Description</span>
              <div className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-bold text-white/40">STEP 2</div>
            </div>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              className="w-full bg-transparent border-none text-white text-sm leading-relaxed placeholder-slate-700 outline-none h-64 resize-none relative z-10 font-medium"
              placeholder="Paste the job requirements..."
            />
          </div>

          <button
            onClick={handleOptimize}
            disabled={loading || !resume || !jd}
            className="w-full py-10 bg-indigo-600 text-white rounded-[3rem] font-black text-2xl shadow-[0_0_50px_rgba(99,102,241,0.3)] hover:scale-[1.02] active:scale-95 disabled:grayscale disabled:opacity-50 transition-all flex justify-center items-center group relative overflow-hidden"
          >
            {loading ? (
              <div className="flex flex-col items-center">
                 <div className="flex items-center space-x-4 mb-2">
                    <div className="w-6 h-6 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="tracking-tighter">BUILDING RESUME...</span>
                 </div>
                 <p className="text-[10px] font-black text-indigo-300 tracking-[0.3em]">{steps[step]}</p>
              </div>
            ) : (
              <span className="tracking-tighter uppercase flex items-center">
                Generate Optimized Resume
                <svg className="w-8 h-8 ml-4 group-hover:translate-x-4 transition-transform text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </span>
            )}
          </button>
        </div>

        {/* Output Preview */}
        <div className="lg:sticky lg:top-32">
          <div className="bg-white/10 rounded-t-[3.5rem] px-12 py-8 flex justify-between items-center relative z-10 border border-white/10 border-b-0 backdrop-blur-3xl shadow-2xl">
             <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-indigo-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-purple-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-white/50 animate-pulse"></div>
             </div>
             <span className="text-[10px] text-white/40 font-black tracking-[0.6em] uppercase">Preview Output</span>
             <div className="w-10"></div>
          </div>
          
          <div className="glass-card border border-white/10 rounded-b-[3.5rem] min-h-[850px] flex flex-col relative overflow-hidden -mt-8 pt-16">
            <div className="px-14 pb-10 flex justify-between items-center border-b border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase mb-1">Match Quality</span>
                <span className={`text-xs font-black ${output ? 'text-indigo-400' : 'text-slate-600'}`}>
                   {output ? 'MAXIMUM ALIGNMENT ACHIEVED' : 'AWAITING BUILD INPUTS'}
                </span>
              </div>
              
              {output && (
                <div className="flex space-x-4">
                  <button 
                    onClick={() => {
                        navigator.clipboard.writeText(output);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    }}
                    className={`px-8 py-3.5 rounded-full text-[12px] font-black tracking-widest transition-all uppercase ${copied ? 'bg-emerald-500' : 'bg-white text-black hover:bg-indigo-50'}`}
                  >
                    {copied ? 'COPIED TO CLIPBOARD' : 'COPY RESUME'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-grow p-16 overflow-y-auto text-white/90 leading-[2.5] text-[15px] font-serif whitespace-pre-wrap selection:bg-indigo-500/30">
              {output ? (
                <div className="animate-in fade-in zoom-in-95 slide-in-from-top-10 duration-1000">
                  {output}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center space-y-12 text-center py-40 opacity-20">
                   <div className="w-40 h-56 border-2 border-dashed border-white/20 rounded-[3rem] flex items-center justify-center animate-pulse">
                      <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                   </div>
                   <div className="max-w-xs">
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white">Standby</p>
                    <p className="text-[12px] mt-4 leading-relaxed font-medium italic">Your new, optimized resume will be generated here.</p>
                   </div>
                </div>
              )}
            </div>

            <div className="p-10 border-t border-white/5 opacity-5 flex justify-between items-center select-none pointer-events-none grayscale">
                <span className="text-[10px] font-black tracking-[1em]">ATS_OPTIMIZED_BUILD_v5</span>
                <span className="text-[10px] font-black">AI_RECONSTRUCTION_ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeMaker;
