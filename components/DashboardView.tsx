import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Campaign, Execution } from '../types';

interface DashboardProps {
  onNavigate: (view: any, id?: string) => void;
}

const DashboardView: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cList, eList, aList] = await Promise.all([
          apiService.getCampaigns(),
          apiService.getExecutions(),
          apiService.getAgents(),
        ]);
        setCampaigns(cList);
        setExecutions(eList);
        setAgents(aList);
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate metrics
  const activeCount = campaigns.filter(c => c.status === 'Active').length;
  const validatingCount = campaigns.filter(c => c.status === 'Validating').length;
  const failedCount = campaigns.filter(c => c.status === 'Failed').length;
  
  const totalExecutions = executions.length;
  const successExecutions = executions.filter(e => e.status === 'Success').length;
  const passRate = totalExecutions > 0 ? Math.round((successExecutions / totalExecutions) * 100) : 100;

  return (
    <div className="space-y-8 p-6 relative z-10 max-w-7xl mx-auto">
      {/* Top Welcome Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">CAMPAIGN INTELLIGENCE</h1>
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.3em] mt-1">Autonomous Operations Command</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => onNavigate('Campaigns')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] tracking-wider uppercase rounded-xl transition-all shadow-md hover:scale-[1.01]"
          >
            Manage Campaigns
          </button>
          <button 
            onClick={() => onNavigate('Copilot')}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[10px] tracking-wider uppercase rounded-xl transition-all"
          >
            Launch Copilot
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all flex justify-between items-center relative overflow-hidden group">
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Campaigns</p>
            <h3 className="text-3xl font-black text-white mt-1 leading-none">{activeCount}</h3>
            <span className="text-[9px] text-emerald-400 font-bold uppercase mt-2 block">● Fully Audit Verified</span>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover:rotate-12 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all flex justify-between items-center relative overflow-hidden group">
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Validating Queue</p>
            <h3 className="text-3xl font-black text-white mt-1 leading-none">{validatingCount}</h3>
            <span className="text-[9px] text-indigo-400 font-bold uppercase mt-2 block">● Running agent flows</span>
          </div>
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 group-hover:rotate-12 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all flex justify-between items-center relative overflow-hidden group">
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Failed / Broken</p>
            <h3 className="text-3xl font-black text-white mt-1 leading-none">{failedCount}</h3>
            <span className="text-[9px] text-red-400 font-bold uppercase mt-2 block">● Awaiting Self-Heal</span>
          </div>
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 group-hover:rotate-12 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all flex justify-between items-center relative overflow-hidden group">
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Test Pass Rate</p>
            <h3 className="text-3xl font-black text-white mt-1 leading-none">{passRate}%</h3>
            <span className="text-[9px] text-indigo-400 font-bold uppercase mt-2 block">● {totalExecutions} total runs</span>
          </div>
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 group-hover:rotate-12 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
        </div>
      </div>

      {/* Agents & Execution split panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Active Agents Fleet status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-white/10">
            <h3 className="text-lg font-black text-white tracking-tight uppercase mb-4">Autonomous Agent Fleet</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map((agent, index) => (
                <div key={index} className="p-4 bg-white/2 hover:bg-white/5 border border-white/5 rounded-xl transition-all flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-black text-white">{agent.name}</h4>
                    <p className="text-[10px] text-slate-400 italic mt-0.5">{agent.role}</p>
                    <div className="flex space-x-4 mt-2">
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Tasks: <strong className="text-white">{agent.tasks_completed}</strong></span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Score: <strong className="text-indigo-400">{Math.round(agent.accuracy_score * 100)}%</strong></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      {agent.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live execution list */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-white/10 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight uppercase mb-4">Latest Executions</h3>
              <div className="space-y-4">
                {executions.slice(0, 4).map((exec, idx) => {
                  const campName = campaigns.find(c => c.id === exec.campaign_id)?.name || 'Campaign Audit';
                  const isSuccess = exec.status === 'Success';
                  return (
                    <div 
                      key={idx} 
                      onClick={() => onNavigate('Executions', exec.id)}
                      className="p-3 bg-white/2 hover:bg-white/5 border border-white/5 rounded-xl cursor-pointer transition-all flex justify-between items-center"
                    >
                      <div className="max-w-[70%]">
                        <h4 className="text-xs font-black text-white truncate">{campName}</h4>
                        <span className="text-[9px] text-slate-500 font-bold block mt-1 uppercase tracking-wider">{exec.browser_type} / {exec.trigger_type}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-full border ${isSuccess ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : exec.status === 'Running' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {exec.status}
                      </span>
                    </div>
                  );
                })}
                {executions.length === 0 && (
                  <p className="text-xs text-slate-500 italic text-center py-6">No execution logs registered.</p>
                )}
              </div>
            </div>
            {executions.length > 0 && (
              <button 
                onClick={() => onNavigate('Executions')}
                className="w-full mt-4 text-center text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors"
              >
                View Execution Console →
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardView;
