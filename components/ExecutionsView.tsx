import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Execution, Task } from '../types';

interface ExecutionsProps {
  selectedExecutionId?: string;
}

const ExecutionsView: React.FC<ExecutionsProps> = ({ selectedExecutionId }) => {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'logs' | 'media'>('details');

  useEffect(() => {
    loadExecutions();
  }, []);

  const loadExecutions = async () => {
    setLoading(true);
    try {
      const list = await apiService.getExecutions();
      setExecutions(list);
      
      const targetId = selectedExecutionId || (list.length > 0 ? list[0].id : null);
      if (targetId) {
        const exec = list.find(e => e.id === targetId);
        if (exec) handleSelectExecution(exec);
      }
    } catch (err) {
      console.error('Failed to load executions history', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExecution = async (exec: Execution) => {
    setSelectedExecution(exec);
    setActiveTab('details');
    try {
      const logContent = await apiService.getExecutionLogs(exec.id);
      setLogs(logContent);
    } catch (err) {
      setLogs('Logs stream not established or file deleted.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 max-w-7xl mx-auto relative z-10">
      
      {/* Sidebar: Runs list */}
      <div className="space-y-4">
        <div className="glass-card p-5 rounded-3xl border border-white/10 flex flex-col justify-between min-h-[500px]">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-md font-black text-white uppercase tracking-wider">Execution Queue</h3>
              <button 
                onClick={loadExecutions}
                className="p-1.5 bg-slate-900 border border-white/10 text-indigo-400 hover:text-white rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 19m-3.778-3h-4.82"/></svg>
              </button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {executions.map((e, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSelectExecution(e)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex justify-between items-center ${selectedExecution?.id === e.id ? 'bg-white/5 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-white/2 border-white/5 hover:border-white/10'}`}
                >
                  <div className="max-w-[70%]">
                    <h4 className="text-xs font-black text-white truncate">Run: #{e.id.substring(0, 8)}</h4>
                    <p className="text-[9px] text-slate-400 mt-1 truncate">{e.browser_type.toUpperCase()} / {e.trigger_type}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full border ${e.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : e.status === 'Running' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {e.status}
                  </span>
                </div>
              ))}
              {executions.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-12">No executions logs available.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Details and output logs pane */}
      <div className="lg:col-span-2 space-y-6">
        {selectedExecution ? (
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-6">
            
            {/* Run Header */}
            <div className="flex justify-between items-start border-b border-white/5 pb-4">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight uppercase">Browser Session #{selectedExecution.id.substring(0, 8)}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Initiated at: {new Date(selectedExecution.created_at).toLocaleString()}</p>
              </div>
              <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-full border ${selectedExecution.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : selectedExecution.status === 'Running' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                {selectedExecution.status}
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-2 border-b border-white/5 pb-1">
              <button 
                onClick={() => setActiveTab('details')}
                className={`pb-2 px-4 text-xs font-black uppercase tracking-wider transition-colors relative ${activeTab === 'details' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Steps & Actions
                {activeTab === 'details' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]"></div>}
              </button>
              <button 
                onClick={() => setActiveTab('logs')}
                className={`pb-2 px-4 text-xs font-black uppercase tracking-wider transition-colors relative ${activeTab === 'logs' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Terminal Output
                {activeTab === 'logs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]"></div>}
              </button>
              <button 
                onClick={() => setActiveTab('media')}
                className={`pb-2 px-4 text-xs font-black uppercase tracking-wider transition-colors relative ${activeTab === 'media' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Media Captures
                {activeTab === 'media' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]"></div>}
              </button>
            </div>

            {/* Content Tabs Switcher */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Agent Verification steps checklist:</span>
                <div className="space-y-3">
                  {selectedExecution.tasks && selectedExecution.tasks.map((task, idx) => (
                    <div key={idx} className="p-4 bg-white/2 border border-white/5 rounded-2xl flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-white">{task.task_name}</span>
                          <span className="text-[8px] font-bold bg-slate-900 border border-white/10 px-2 py-0.5 rounded text-indigo-400">{task.agent_name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Time: {task.execution_time_seconds.toFixed(2)}s</p>
                      </div>
                      <span className={`px-2.5 py-1 text-[8px] font-black uppercase rounded-full border ${task.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : task.status === 'Running' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {task.status}
                      </span>
                    </div>
                  ))}
                  {(!selectedExecution.tasks || selectedExecution.tasks.length === 0) && (
                    <p className="text-xs text-slate-500 italic text-center py-6">Orchestrator has initialized session context. Spawning agents...</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/10 font-mono text-xs text-slate-300 h-96 overflow-y-auto whitespace-pre-wrap">
                {logs || 'Empty/no logs received.'}
              </div>
            )}

            {activeTab === 'media' && (
              <div className="space-y-6">
                
                {/* Embed Video playback */}
                {selectedExecution.video_path ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Play Session Automation Video:</span>
                    <div className="overflow-hidden border border-white/10 rounded-2xl bg-black aspect-video w-full">
                      <video 
                        src={selectedExecution.video_path} 
                        controls 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border border-dashed border-white/10 rounded-2xl text-center text-xs text-slate-500">
                    Video recording not available for this run (tests completed successfully without browser interaction details, or run failed during requirements parsing).
                  </div>
                )}

                {/* Screenshots lists */}
                {selectedExecution.screenshot_paths && selectedExecution.screenshot_paths.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Failure Screenshots Captured:</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedExecution.screenshot_paths.map((src, i) => (
                        <div key={i} className="border border-white/10 rounded-2xl overflow-hidden bg-white/2 hover:scale-[1.01] transition-transform">
                          <img src={src} alt="Defect capture" className="w-full object-cover aspect-video" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-white/10 rounded-2xl text-center text-xs text-slate-500">
                    No error/failure screenshots captured (all script steps validated successfully!).
                  </div>
                )}

              </div>
            )}

          </div>
        ) : (
          <div className="glass-card p-12 rounded-3xl border border-white/10 text-center flex flex-col items-center justify-center min-h-[500px]">
            <svg className="w-16 h-16 text-slate-600 mb-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">No Execution Selected</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm">Select a browser simulation run from the sidebar timeline to check logs, step validations, failure screenshots, and play execution video.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default ExecutionsView;
