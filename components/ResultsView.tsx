
import React from 'react';
import { AnalysisResult } from '../types';
import CircularProgress from './CircularProgress';

interface ResultsViewProps {
  result: AnalysisResult;
  onNewScan: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ result, onNewScan }) => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <span className="px-3 py-1 bg-emerald-500 text-white text-[9px] font-black tracking-widest uppercase rounded">COMPLETED</span>
            <span className="text-slate-500 text-[9px] font-black tracking-widest uppercase">ANALYSIS_REPORT_READY</span>
          </div>
          <h2 className="text-5xl font-black text-white tracking-tighter">Scan Results</h2>
        </div>
        <button 
          onClick={onNewScan}
          className="glass-card px-8 py-4 rounded-2xl text-white font-black text-sm hover:bg-white/5 transition-all flex items-center border border-white/10"
        >
          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          START NEW SCAN
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Match Score */}
        <div className="lg:col-span-4 glass-card p-10 rounded-[3rem] border-white/5 flex flex-col items-center">
          <CircularProgress percentage={result.matchScore} />
          
          <div className="mt-12 w-full pt-10 border-t border-white/5">
             <span className="text-[10px] font-black text-slate-500 tracking-[0.5em] uppercase block mb-4">AI Feedback</span>
             <p className="text-sm text-slate-300 leading-relaxed italic font-medium">"{result.summary}"</p>
          </div>

          <div className="mt-10 w-full grid grid-cols-2 gap-4">
             <div className="bg-white/5 p-4 rounded-2xl flex flex-col">
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Skills Found</span>
                <span className="text-2xl font-black text-white mono">{result.matchingSkills.length}</span>
             </div>
             <div className="bg-white/5 p-4 rounded-2xl flex flex-col">
                <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Skills Missing</span>
                <span className="text-2xl font-black text-white mono">{result.missingHardSkills.length}</span>
             </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="lg:col-span-8 space-y-8">
          {/* Missing Keywords */}
          <div className="glass-card p-10 rounded-[3rem] border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[60px]"></div>
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h3 className="text-xl font-black text-white tracking-tight flex items-center">
                <span className="w-2 h-6 bg-rose-500 rounded-full mr-4"></span>
                Missing Keywords
              </h3>
              <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 px-4 py-1.5 rounded-full tracking-widest uppercase">Target Skills Not Found</span>
            </div>
            <div className="flex flex-wrap gap-3 relative z-10">
              {result.missingHardSkills.length > 0 ? (
                result.missingHardSkills.map((skill, idx) => (
                  <span key={idx} className="bg-white/5 text-slate-200 px-6 py-3 rounded-2xl text-xs font-bold border border-white/5 hover:border-rose-500/30 hover:bg-white/10 transition-all">
                    {skill}
                  </span>
                ))
              ) : (
                <div className="w-full py-10 text-center bg-emerald-500/5 rounded-3xl border border-dashed border-emerald-500/30">
                  <p className="text-emerald-400 font-black tracking-widest text-xs">PERFECT! NO MISSING KEYWORDS DETECTED</p>
                </div>
              )}
            </div>
          </div>

          {/* Found Keywords */}
          <div className="glass-card p-10 rounded-[3rem] border-white/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px]"></div>
             <div className="flex justify-between items-center mb-8 relative z-10">
              <h3 className="text-xl font-black text-white tracking-tight flex items-center">
                <span className="w-2 h-6 bg-emerald-500 rounded-full mr-4"></span>
                Matched Keywords
              </h3>
              <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full tracking-widest uppercase">Validated Skills</span>
            </div>
            <div className="flex flex-wrap gap-3 relative z-10">
              {result.matchingSkills.map((skill, idx) => (
                <span key={idx} className="bg-white/5 text-slate-200 px-6 py-3 rounded-2xl text-xs font-bold border border-white/5 hover:border-emerald-500/30 hover:bg-white/10 transition-all">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-8 rounded-[2.5rem] border-white/5">
              <span className="text-[10px] font-black text-slate-500 tracking-[0.5em] uppercase block mb-8">Formatting Audit</span>
              <ul className="space-y-4">
                {result.formattingFeedback.map((item, idx) => (
                  <li key={idx} className="flex items-start text-xs font-bold text-slate-400 group">
                    <svg className="w-4 h-4 text-indigo-500 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-indigo-600/10 p-8 rounded-[2.5rem] border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.1)]">
              <span className="text-[10px] font-black text-indigo-400 tracking-[0.5em] uppercase block mb-8">Optimization Tips</span>
              <ul className="space-y-6">
                {result.optimizationTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start text-xs font-bold text-indigo-100/80 leading-relaxed">
                    <div className="w-6 h-6 bg-indigo-500 text-white rounded-lg flex items-center justify-center mr-4 flex-shrink-0 shadow-lg">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                    </div>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;
