
import React, { useState } from 'react';
import { Job } from '../types';

const INITIAL_JOBS: Job[] = [
  { id: '1', title: 'Senior Software Architect', company: 'Nexus Systems', location: 'San Francisco, CA', status: 'Applied', dateApplied: '2024-01-15' },
  { id: '2', title: 'Lead Product Designer', company: 'Aether Design', location: 'Remote', status: 'Saved' },
  { id: '3', title: 'Technical Director', company: 'Quantum Labs', location: 'Austin, TX', status: 'Interview', dateApplied: '2024-01-10' },
];

const COLUMNS: Job['status'][] = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'];

const JobTracker: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [showModal, setShowModal] = useState(false);
  const [newJob, setNewJob] = useState<Partial<Job>>({
    title: '',
    company: '',
    location: '',
    status: 'Saved'
  });

  const moveJob = (id: string, newStatus: Job['status']) => {
    setJobs(prev => prev.map(job => job.id === id ? { ...job, status: newStatus } : job));
  };

  const deleteJob = (id: string) => {
    setJobs(prev => prev.filter(job => job.id !== id));
  };

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title || !newJob.company) return;

    const job: Job = {
      id: Math.random().toString(36).substr(2, 9),
      title: newJob.title || '',
      company: newJob.company || '',
      location: newJob.location || 'Remote',
      status: newJob.status as Job['status'] || 'Saved',
      dateApplied: newJob.status === 'Applied' ? new Date().toISOString().split('T')[0] : undefined
    };

    setJobs(prev => [...prev, job]);
    setNewJob({ title: '', company: '', location: '', status: 'Saved' });
    setShowModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div>
           <div className="flex items-center space-x-3 mb-4">
             <div className="w-12 h-0.5 bg-indigo-500"></div>
             <span className="text-[10px] font-black tracking-[0.5em] text-indigo-400 uppercase">Application Pipeline</span>
          </div>
          <h2 className="text-5xl font-black text-white tracking-tighter">Job Tracker</h2>
          <p className="text-slate-400 mt-4 font-medium max-w-lg">Manage and monitor your professional transition pipeline with diagnostic precision.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="group relative bg-white text-black px-10 py-5 rounded-2xl font-black text-sm shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all overflow-hidden"
        >
          <span className="relative z-10 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
            ADD NEW JOB
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>

      <div className="flex gap-8 overflow-x-auto pb-12 scrollbar-hide snap-x">
        {COLUMNS.map(column => (
          <div key={column} className="w-80 flex-shrink-0 snap-start">
            <div className="glass-card rounded-[2.5rem] p-6 flex flex-col min-h-[700px] border border-white/5 relative overflow-hidden">
              <div className="flex justify-between items-center mb-8 px-2 relative z-10">
                <h3 className="font-black text-white uppercase text-[10px] tracking-[0.4em]">{column}</h3>
                <span className="bg-white/5 text-white/60 px-3 py-1 rounded-full text-[9px] font-black border border-white/10">
                  {jobs.filter(j => j.status === column).length}
                </span>
              </div>

              <div className="space-y-4 relative z-10">
                {jobs.filter(job => job.status === column).map(job => (
                  <div key={job.id} className="glass-card p-6 rounded-3xl border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all group relative">
                    <button 
                      onClick={() => deleteJob(job.id)}
                      className="absolute top-4 right-4 text-white/20 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
                    </button>

                    <h4 className="font-black text-white mb-2 tracking-tight group-hover:text-indigo-400 transition-colors">{job.title}</h4>
                    <p className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider">{job.company}</p>
                    
                    <div className="flex items-center text-[10px] text-slate-400 font-bold mb-6">
                      <svg className="w-3.5 h-3.5 mr-2 text-indigo-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      {job.location}
                    </div>
                    
                    <div className="pt-4 border-t border-white/5">
                      <select 
                        className="w-full text-[9px] bg-transparent border-none outline-none cursor-pointer text-indigo-400 font-black uppercase tracking-widest appearance-none"
                        value={job.status}
                        onChange={(e) => moveJob(job.id, e.target.value as Job['status'])}
                      >
                        {COLUMNS.map(c => <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>)}
                      </select>
                    </div>
                  </div>
                ))}

                {jobs.filter(j => j.status === column).length === 0 && (
                  <div className="py-20 text-center opacity-10">
                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Void Vector</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Job Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-xl rounded-[3rem] p-12 border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            <div className="mb-10">
              <h3 className="text-3xl font-black text-white tracking-tighter mb-2">New Pipeline Entry</h3>
              <p className="text-slate-500 text-sm font-medium">Inject a new job vector into your active tracking grid.</p>
            </div>

            <form onSubmit={handleAddJob} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Job Title</label>
                <input 
                  autoFocus
                  required
                  type="text"
                  placeholder="e.g. Lead Engineer"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/10 transition-all font-medium"
                  value={newJob.title}
                  onChange={e => setNewJob({...newJob, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company</label>
                  <input 
                    required
                    type="text"
                    placeholder="Company Name"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    value={newJob.company}
                    onChange={e => setNewJob({...newJob, company: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                  <input 
                    type="text"
                    placeholder="City or Remote"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    value={newJob.location}
                    onChange={e => setNewJob({...newJob, location: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Status</label>
                <div className="flex flex-wrap gap-2">
                  {COLUMNS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewJob({...newJob, status: c})}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${newJob.status === c ? 'bg-white text-black border-white' : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/20'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black text-lg shadow-[0_20px_40px_-10px_rgba(99,102,241,0.3)] hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all mt-4"
              >
                INITIALIZE VECTOR
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobTracker;
