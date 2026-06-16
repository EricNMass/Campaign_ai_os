import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Campaign, Finding, Report } from '../types';

interface CampaignsProps {
  selectedCampaignId?: string;
}

const CampaignsView: React.FC<CampaignsProps> = ({ selectedCampaignId }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [audience, setAudience] = useState('');
  const [cta, setCta] = useState('');
  const [landingPageInput, setLandingPageInput] = useState('');
  const [utmSource, setUtmSource] = useState('email');
  const [utmMedium, setUtmMedium] = useState('newsletter');
  const [utmCampaign, setUtmCampaign] = useState('summer_sales_2026');
  const [emailAssetInput, setEmailAssetInput] = useState('');
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const list = await apiService.getCampaigns();
      setCampaigns(list);
      
      const targetId = selectedCampaignId || (list.length > 0 ? list[0].id : null);
      if (targetId) {
        const camp = list.find(c => c.id === targetId);
        if (camp) handleSelectCampaign(camp);
      }
    } catch (err) {
      console.error('Failed to load campaigns list', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCampaign = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    try {
      const [fList, rList] = await Promise.all([
        apiService.getFindings(campaign.id),
        apiService.getReports(campaign.id)
      ]);
      setFindings(fList);
      setReports(rList);
    } catch (err) {
      console.error('Failed to fetch campaign resources', err);
    }
  };

  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newCampaign = await apiService.createCampaign({
        name,
        audience,
        cta,
        landing_pages: [landingPageInput.trim()],
        tracking_links: [],
        utm_parameters: {
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign
        },
        email_assets: [emailAssetInput.trim()]
      });
      
      setName('');
      setAudience('');
      setCta('');
      setLandingPageInput('');
      setEmailAssetInput('');
      setShowAddForm(false);
      
      // Reload campaigns
      await loadCampaigns();
      handleSelectCampaign(newCampaign);
    } catch (err) {
      alert('Failed to register campaign: ' + err);
    }
  };

  const handleValidate = async () => {
    if (!selectedCampaign) return;
    setTriggering(true);
    try {
      await apiService.validateCampaign(selectedCampaign.id);
      alert('Autonomous campaign audit initiated! Track progress in Execution or Chat tabs.');
      // Refresh status check
      setTimeout(loadCampaigns, 2000);
    } catch (err) {
      alert('Audit trigger failed: ' + err);
    } finally {
      setTriggering(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign? All tasks and findings will be deleted.')) return;
    try {
      await apiService.deleteCampaign(id);
      setSelectedCampaign(null);
      setFindings([]);
      setReports([]);
      loadCampaigns();
    } catch (err) {
      alert('Delete failed: ' + err);
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
      
      {/* Sidebar: Campaigns list */}
      <div className="space-y-4">
        <div className="glass-card p-5 rounded-3xl border border-white/10 flex flex-col justify-between min-h-[500px]">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-md font-black text-white uppercase tracking-wider">Campaign Registry</h3>
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors"
              >
                {showAddForm ? 'Cancel' : 'Register New'}
              </button>
            </div>

            {!showAddForm ? (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {campaigns.map((c, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleSelectCampaign(c)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex justify-between items-center ${selectedCampaign?.id === c.id ? 'bg-white/5 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-white/2 border-white/5 hover:border-white/10'}`}
                  >
                    <div className="max-w-[70%]">
                      <h4 className="text-xs font-black text-white truncate">{c.name}</h4>
                      <p className="text-[9px] text-slate-400 mt-1 truncate">{c.audience || 'All Audiences'}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full border ${c.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : c.status === 'Validating' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse' : 'bg-slate-500/10 text-slate-400 border-white/5'}`}>
                      {c.status}
                    </span>
                  </div>
                ))}
                {campaigns.length === 0 && (
                  <p className="text-xs text-slate-500 italic text-center py-12">No campaigns registered.</p>
                )}
              </div>
            ) : (
              <form onSubmit={handleAddCampaign} className="space-y-4">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Campaign Name</label>
                  <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Summer Launch" className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" required />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Target Audience</label>
                  <input type="text" value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Subscribed users" className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">CTA Text</label>
                    <input type="text" value={cta} onChange={e=>setCta(e.target.value)} placeholder="Buy Now" className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Landing Page Link</label>
                    <input type="url" value={landingPageInput} onChange={e=>setLandingPageInput(e.target.value)} placeholder="https://..." className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" required />
                  </div>
                </div>
                <div className="p-3 bg-white/2 border border-white/5 rounded-2xl space-y-2">
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-wider block">UTM Analytics Parameters</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <input type="text" value={utmSource} onChange={e=>setUtmSource(e.target.value)} placeholder="Source" className="bg-slate-950/60 border border-white/10 rounded-lg p-1.5 text-[10px] text-white focus:outline-none" />
                    <input type="text" value={utmMedium} onChange={e=>setUtmMedium(e.target.value)} placeholder="Medium" className="bg-slate-950/60 border border-white/10 rounded-lg p-1.5 text-[10px] text-white focus:outline-none" />
                    <input type="text" value={utmCampaign} onChange={e=>setUtmCampaign(e.target.value)} placeholder="Campaign" className="bg-slate-950/60 border border-white/10 rounded-lg p-1.5 text-[10px] text-white focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email Body copy / asset</label>
                  <textarea value={emailAssetInput} onChange={e=>setEmailAssetInput(e.target.value)} placeholder="Check out our deals at {{LandingPage}}..." className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white h-20 focus:outline-none focus:border-indigo-500" required />
                </div>
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">
                  Register Campaign
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Details Panel */}
      <div className="lg:col-span-2 space-y-6">
        {selectedCampaign ? (
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-6">
            
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-white/5 pb-4">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight uppercase">{selectedCampaign.name}</h2>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">ID: {selectedCampaign.id}</p>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={handleValidate}
                  disabled={triggering || selectedCampaign.status === 'Validating'}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md"
                >
                  {triggering ? 'Invoking...' : 'Validate Campaign'}
                </button>
                <button 
                  onClick={() => handleDelete(selectedCampaign.id)}
                  className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 font-black text-[10px] uppercase tracking-wider rounded-xl transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Campaign Config Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/2 border border-white/5 p-4 rounded-2xl">
              <div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Audience Targeting</span>
                <p className="text-xs text-white font-bold mt-0.5">{selectedCampaign.audience || 'Unspecified'}</p>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Expected CTA Text</span>
                <p className="text-xs text-white font-bold mt-0.5">{selectedCampaign.cta || 'Unspecified'}</p>
              </div>
              <div className="md:col-span-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Landing Pages Audit Target</span>
                {selectedCampaign.landing_pages.map((link, i) => (
                  <a key={i} href={link} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline block mt-1 truncate">{link}</a>
                ))}
              </div>
              <div className="md:col-span-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Analytics Rules (UTMs)</span>
                <div className="flex space-x-4 mt-1">
                  {Object.entries(selectedCampaign.utm_parameters).map(([k, v], i) => (
                    <span key={i} className="text-[10px] bg-slate-900 border border-white/10 px-2 py-0.5 rounded-lg text-slate-300">
                      <strong>{k}</strong>: {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Findings Check panel */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Automated Audit Findings ({findings.length})</h3>
              <div className="space-y-3">
                {findings.map((f, i) => {
                  const severityColors = f.severity === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' : (
                    f.severity === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  );
                  return (
                    <div key={i} className="p-4 bg-white/2 border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div className="max-w-[80%]">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-full border ${severityColors}`}>
                            {f.severity}
                          </span>
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">{f.target_type} Check</span>
                        </div>
                        <p className="text-xs text-white font-medium mt-2 leading-relaxed">{f.description}</p>
                        {f.remediation && (
                          <p className="text-[10px] text-slate-400 italic mt-1 font-semibold">Remediation: {f.remediation}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {findings.length === 0 && (
                  <p className="text-xs text-slate-500 italic py-6 text-center">No campaign defects found. Validation fully passing.</p>
                )}
              </div>
            </div>

            {/* Reports Downloads */}
            {reports.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Export PDF/Excel Reports</h3>
                <div className="flex space-x-3">
                  {reports.map((r, i) => (
                    <a 
                      key={i}
                      href={`/api/reports/${r.id}/download`}
                      download
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center space-x-1.5 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                      <span>Download {r.format} Report</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="glass-card p-12 rounded-3xl border border-white/10 text-center flex flex-col items-center justify-center min-h-[500px]">
            <svg className="w-16 h-16 text-slate-600 mb-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">No Campaign Selected</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm">Select an active marketing campaign from the registry sidebar, or compile a new one to execute autonomous validations.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default CampaignsView;
