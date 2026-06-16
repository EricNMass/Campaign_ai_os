import React, { useState } from 'react';
import { apiService } from '../services/apiService';

interface LoginProps {
  onLoginSuccess: () => void;
}

const LoginView: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiService.login(username, password);
      onLoginSuccess();
    } catch (err) {
      setError('Invalid username or password credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
      <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-3xl">
        <div className="scanline"></div>
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mt-4 uppercase">CAMPAIGN AI OS</h2>
          <p className="text-[10px] font-bold text-indigo-400 tracking-[0.4em] uppercase mt-1">Autonomous Quality Portal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl hover:scale-[1.01]"
          >
            {loading ? 'Authenticating...' : 'Sign In with SSO'}
          </button>
        </form>

        {/* Demo Fast Login profiles */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 text-center">Or fast login as demo profiles:</p>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => selectUser('admin', 'admin123')}
              className="px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[9px] font-bold text-slate-300 hover:text-white transition-colors"
            >
              ADMIN
            </button>
            <button 
              onClick={() => selectUser('engineer', 'engineer123')}
              className="px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[9px] font-bold text-slate-300 hover:text-white transition-colors"
            >
              ENGINEER
            </button>
            <button 
              onClick={() => selectUser('manager', 'manager123')}
              className="px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[9px] font-bold text-slate-300 hover:text-white transition-colors"
            >
              MANAGER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
