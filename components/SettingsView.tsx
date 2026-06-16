import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';

const SettingsView: React.FC = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(apiService.getCurrentUser());
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto relative z-10 space-y-6">
      
      {/* Title */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-xl font-black text-white tracking-tight uppercase">System Settings</h2>
        <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Campaign AI OS Configurations</p>
      </div>

      {/* Profile detail */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <h3 className="text-sm font-black text-white uppercase tracking-wider">Active Credentials Profile</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white/2 border border-white/5 rounded-xl">
            <span className="text-[9px] font-black text-slate-500 uppercase block">Active Username</span>
            <span className="text-xs text-white font-bold mt-1 block">{user?.username || 'Guest'}</span>
          </div>
          <div className="p-3 bg-white/2 border border-white/5 rounded-xl">
            <span className="text-[9px] font-black text-slate-500 uppercase block">Security Role</span>
            <span className="text-xs text-indigo-400 font-bold mt-1 block uppercase tracking-wider">{user?.role || 'Guest'}</span>
          </div>
        </div>
      </div>

      {/* System info */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <h3 className="text-sm font-black text-white uppercase tracking-wider">Platform Specifications</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-white/2 border border-white/5 rounded-xl text-xs">
            <span className="text-slate-400">Database Engine</span>
            <span className="font-mono text-[10px] text-indigo-400">SQLite (Local) / PostgreSQL (Prod Mode)</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/2 border border-white/5 rounded-xl text-xs">
            <span className="text-slate-400">Short-Term Cache Cache</span>
            <span className="font-mono text-[10px] text-indigo-400">Redis Server Connection (Optional Fallback active)</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/2 border border-white/5 rounded-xl text-xs">
            <span className="text-slate-400">LLM Provider model</span>
            <span className="font-mono text-[10px] text-indigo-400">Google Gemini (Model: gemini-2.5-flash)</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/2 border border-white/5 rounded-xl text-xs">
            <span className="text-slate-400">Playwright Browser contexts</span>
            <span className="font-mono text-[10px] text-indigo-400">Chromium, Firefox, Webkit (Concurrent Limit: 3)</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/2 border border-white/5 rounded-xl text-xs">
            <span className="text-slate-400">Vault Store Management</span>
            <span className="font-mono text-[10px] text-indigo-400">Azure Key Vault credentials connector active</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SettingsView;
