import React, { useEffect, useState } from 'react';
import { apiService, getUrl } from '../services/apiService';
import { Report, Campaign } from '../types';

const ReportsView: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [rList, cList] = await Promise.all([
        apiService.getReports(''), // empty queries all
        apiService.getCampaigns()
      ]);
      // Wait, getReports on campaignId requires campaignId. Let's see:
      // Does our API support fetching all reports if campaignId is not supplied?
      // Yes, we implemented list_all_reports in backend/app/api/reports.py. Let's call that directly!
      const res = await fetch(getUrl('/api/reports'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('campaign_os_token')}`
        }
      });
      if (res.ok) {
        const allReports = await res.json();
        setReports(allReports);
      } else {
        setReports(rList);
      }
      setCampaigns(cList);
    } catch (err) {
      console.error('Failed to load reports archive', err);
    } finally {
      setLoading(false);
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
          <h2 className="text-xl font-black text-white tracking-tight uppercase">Audit Reports Archive</h2>
          <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">PDF, Excel, and CSV artifacts</p>
        </div>
        <button
          onClick={loadReports}
          className="p-2 bg-slate-900 border border-white/10 rounded-xl text-indigo-400 hover:text-white transition-colors"
        >
          Refresh Archive
        </button>
      </div>

      {/* Reports registry table */}
      <div className="overflow-x-auto bg-white/2 border border-white/10 rounded-2xl">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-slate-400 uppercase font-black tracking-wider">
              <th className="px-6 py-4">Campaign context</th>
              <th className="px-6 py-4">Report Type</th>
              <th className="px-6 py-4">Document Format</th>
              <th className="px-6 py-4">Created At</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r, i) => {
              const campName = campaigns.find(c => c.id === r.campaign_id)?.name || 'Campaign Audit';
              return (
                <tr key={i} className="border-b border-white/5 hover:bg-white/1 transition-colors">
                  <td class="px-6 py-4 font-bold text-white">{campName}</td>
                  <td class="px-6 py-4 text-slate-300">{r.type}</td>
                  <td class="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded font-black text-[9px] border ${r.format === 'PDF' ? 'bg-red-500/10 text-red-400 border-red-500/20' : r.format === 'Excel' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-300 border-white/5'}`}>
                      {r.format}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-slate-400">{new Date(r.created_at).toLocaleString()}</td>
                  <td class="px-6 py-4 text-right">
                    <a
                      href={getUrl(`/api/reports/${r.id}/download`)}
                      download
                      className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors inline-block"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              );
            })}
            {reports.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">No reports generated yet. Trigger validations first.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsView;
