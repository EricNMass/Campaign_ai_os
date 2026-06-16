import React, { useState, useEffect } from 'react';
import { AppView } from './types';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import CampaignsView from './components/CampaignsView';
import ExecutionsView from './components/ExecutionsView';
import CopilotView from './components/CopilotView';
import DevOpsView from './components/DevOpsView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import { apiService } from './services/apiService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<AppView>('Dashboard');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>(undefined);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('campaign_os_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setView('Dashboard');
  };

  const handleLogout = () => {
    apiService.logout();
    setIsAuthenticated(false);
  };

  const handleNavigate = (targetView: AppView, targetId?: string) => {
    if (targetView === 'Campaigns') {
      setSelectedCampaignId(targetId);
    } else if (targetView === 'Executions') {
      setSelectedExecutionId(targetId);
    }
    setView(targetView);
  };

  const handleValidateTrigger = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setView('Campaigns');
  };

  const NavItem = ({ label, target, icon }: { label: string; target: AppView; icon: React.ReactNode }) => (
    <button
      onClick={() => {
        setSelectedCampaignId(undefined);
        setSelectedExecutionId(undefined);
        setView(target);
      }}
      className={`group flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all relative ${
        view === target 
          ? 'bg-indigo-600/10 border border-indigo-500/20 text-white font-bold' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/2 border border-transparent'
      }`}
    >
      <div className={`transition-transform group-hover:scale-105 ${view === target ? 'text-indigo-400' : 'text-slate-400'}`}>
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
      {view === target && (
        <div className="absolute right-3 w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_#6366f1]"></div>
      )}
    </button>
  );

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex relative z-10">
      
      {/* Side Command panel */}
      <aside className="w-64 glass-card border-r border-white/5 flex flex-col justify-between py-6 px-4 shrink-0 backdrop-blur-3xl">
        <div className="space-y-8">
          
          {/* Logo brand */}
          <div className="flex items-center space-x-3 px-2 cursor-pointer" onClick={() => setView('Dashboard')}>
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg hover:rotate-6 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-md font-black tracking-tight text-white leading-none">CAMPAIGN OS</span>
              <span className="text-[7px] font-bold tracking-[0.4em] text-indigo-400 uppercase mt-0.5">AGENT AUTONOMY</span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1.5">
            <NavItem 
              label="Dashboard" 
              target="Dashboard" 
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"/></svg>} 
            />
            <NavItem 
              label="Campaigns" 
              target="Campaigns" 
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>} 
            />
            <NavItem 
              label="Execution Center" 
              target="Executions" 
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} 
            />
            <NavItem 
              label="Chat Copilot" 
              target="Copilot" 
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>} 
            />
            <NavItem 
              label="DevOps Board" 
              target="DevOps" 
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>} 
            />
            <NavItem 
              label="Reports Archive" 
              target="Reports" 
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>} 
            />
            <NavItem 
              label="Settings" 
              target="Settings" 
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>} 
            />
          </nav>
        </div>

        {/* Footer logout */}
        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-[9px] font-bold text-slate-500 uppercase">Profile: {localStorage.getItem('campaign_os_user')}</span>
            <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded uppercase font-black">{localStorage.getItem('campaign_os_role')?.replace('_', ' ')}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 rounded-xl transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            <span className="text-[9px] font-black uppercase tracking-wider">Logout SSO</span>
          </button>
        </div>

      </aside>

      {/* Main dashboard body routing */}
      <main className="flex-grow overflow-y-auto">
        {view === 'Dashboard' && <DashboardView onNavigate={handleNavigate} />}
        {view === 'Campaigns' && <CampaignsView selectedCampaignId={selectedCampaignId} />}
        {view === 'Executions' && <ExecutionsView selectedExecutionId={selectedExecutionId} />}
        {view === 'Copilot' && <CopilotView onValidateTrigger={handleValidateTrigger} />}
        {view === 'DevOps' && <DevOpsView />}
        {view === 'Reports' && <ReportsView />}
        {view === 'Settings' && <SettingsView />}
      </main>

    </div>
  );
};

export default App;
