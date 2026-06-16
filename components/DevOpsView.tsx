import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Deployment } from '../types';

const DevOpsView: React.FC = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    loadDeployments();
  }, []);

  const loadDeployments = async () => {
    setLoading(true);
    try {
      const list = await apiService.getDeployments();
      setDeployments(list);
    } catch (err) {
      console.error('Failed to load deployments status', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerPipeline = async () => {
    setTriggering(true);
    try {
      await apiService.triggerPipeline(101);
      alert('DevOps pipeline execution successfully triggered on Azure DevOps!');
      setTimeout(loadDeployments, 1500);
    } catch (err) {
      alert('Trigger failed: ' + err);
    } finally {
      setTriggering(false);
    }
  };

  const handleRemediate = async (buildId: string) => {
    try {
      await apiService.remediateBuild(buildId);
      alert(`Auto-remediation run triggered for Build #${buildId}. Check status in a few seconds.`);
      setTimeout(loadDeployments, 2000);
    } catch (err) {
      alert('Remediation trigger failed: ' + err);
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
    <div className="p-6 max-w-5xl mx-auto relative z-10 space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase">CI/CD Deployments Monitor</h2>
          <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Azure DevOps Pipelines Integration</p>
        </div>
        <button
          onClick={handleTriggerPipeline}
          disabled={triggering}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] tracking-wider uppercase rounded-xl transition-all shadow-md"
        >
          {triggering ? 'Triggering...' : 'Trigger Deploy Build'}
        </button>
      </div>

      {/* Deployments list */}
      <div className="grid grid-cols-1 gap-6">
        {deployments.map((d, i) => {
          const isFailed = d.status === 'Failed';
          const isRemediated = d.status === 'Remediated';
          const statusColors = isFailed ? 'bg-red-500/10 text-red-400 border-red-500/20' : (
            isRemediated ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : (
              d.status === 'InProgress' || d.status === 'Remediating' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse' :
              'bg-slate-500/10 text-slate-400 border-white/5'
            )
          );

          return (
            <div key={i} className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 hover:border-white/15 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-black text-white uppercase">{d.pipeline_name}</h3>
                  <div className="flex items-center space-x-3 mt-1.5 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    <span>Build: #{d.build_id}</span>
                    <span>•</span>
                    <span>Commit: {d.commit_hash}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-1 text-[8px] font-black uppercase rounded-full border ${statusColors}`}>
                    {d.status}
                  </span>
                  {isFailed && (
                    <button
                      onClick={() => handleRemediate(d.build_id)}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[8px] uppercase tracking-wider rounded-lg transition-colors"
                    >
                      Remediate Build
                    </button>
                  )}
                </div>
              </div>

              {d.release_notes && (
                <div className="p-3 bg-white/2 border border-white/5 rounded-xl text-xs text-slate-300 leading-relaxed">
                  <strong>Notes:</strong> {d.release_notes}
                </div>
              )}

              {d.reremediation_steps || d.remediation_steps && (
                <div className="p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl text-xs text-indigo-300 leading-relaxed font-mono">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Self-Heal Resolution:</span>
                  {d.remediation_steps}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DevOpsView;
