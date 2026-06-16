
import React, { useState } from 'react';
import { generateCoverLetter } from '../services/geminiService';

const CoverLetterGen: React.FC = () => {
  const [resume, setResume] = useState('');
  const [jd, setJd] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!resume || !jd) return;
    setLoading(true);
    setCopied(false);
    try {
      const result = await generateCoverLetter(resume, jd);
      setOutput(result);
    } catch (error) {
      console.error(error);
      alert('Failed to generate cover letter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <div className="flex items-center space-x-3 mb-6">
               <div className="w-12 h-0.5 bg-indigo-500"></div>
               <span className="text-[10px] font-black tracking-[0.5em] text-indigo-400 uppercase">AI Writer</span>
            </div>
            <h2 className="text-6xl font-black text-white tracking-tighter">Cover Letter AI</h2>
            <p className="text-xl text-slate-400 mt-6 font-medium">Generate a tailored, high-impact cover letter based on your resume and the job description.</p>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-8 rounded-[2.5rem] border-white/5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Paste Your Resume</label>
              <textarea
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                className="w-full bg-transparent border-none text-white text-sm leading-relaxed placeholder-slate-700 h-40 outline-none resize-none font-medium"
                placeholder="Paste your career highlights..."
              />
            </div>
            <div className="glass-card p-8 rounded-[2.5rem] border-white/5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Target Job Description</label>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                className="w-full bg-transparent border-none text-white text-sm leading-relaxed placeholder-slate-700 h-40 outline-none resize-none font-medium"
                placeholder="Paste the job requirements..."
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !resume || !jd}
              className="w-full py-8 bg-white text-black rounded-3xl font-black text-xl shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex justify-center items-center"
            >
              {loading ? (
                <div className="flex items-center space-x-3">
                   <div className="w-5 h-5 border-2 border-black/10 border-t-black rounded-full animate-spin"></div>
                   <span>WRITING...</span>
                </div>
              ) : 'Generate Cover Letter'}
            </button>
          </div>
        </div>

        <div className="glass-card rounded-[3rem] border border-white/10 p-12 flex flex-col min-h-[700px] backdrop-blur-3xl shadow-2xl">
          <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/5">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Draft Preview</h3>
            {output && (
              <button 
                onClick={() => {
                    navigator.clipboard.writeText(output);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                }}
                className={`text-xs font-black tracking-widest uppercase transition-colors ${copied ? 'text-emerald-400' : 'text-indigo-400 hover:text-indigo-300'}`}
              >
                {copied ? 'COPIED' : 'COPY TEXT'}
              </button>
            )}
          </div>
          <div className="flex-grow whitespace-pre-wrap text-white/80 leading-[2.2] text-[15px] font-serif overflow-y-auto pr-4 scrollbar-hide">
            {output || "Your tailored cover letter will appear here..."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterGen;
