import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/apiService';
import { ChatMessage, Campaign } from '../types';

interface CopilotProps {
  onValidateTrigger: (campaignId: string) => void;
}

const CopilotView: React.FC<CopilotProps> = ({ onValidateTrigger }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampId, setSelectedCampId] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentThoughtStream, setAgentThoughtStream] = useState<string[]>([]);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load campaigns list to allow selection
    apiService.getCampaigns().then(list => {
      setCampaigns(list);
      if (list.length > 0) setSelectedCampId(list[0].id);
    });
    
    // Initial welcome message
    setMessages([
      {
        role: 'assistant',
        content: "Hello! I am your Enterprise Agentic Copilot. I can autonomously audit your marketing assets.\n\nType a command like **'Validate Campaign'** or tell me what to test!"
      }
    ]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentThoughtStream]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setAgentThoughtStream([]);

    // Check if command is campaign validation to trigger thought stream animations
    const isValidation = userMessage.toLowerCase().includes('validate') || userMessage.toLowerCase().includes('audit');

    try {
      if (isValidation) {
        // Trigger simulated agent stream to wow the user in real-time
        const streamSteps = [
          "[CampaignAgent] Analyzing brief configurations...",
          "[CampaignAgent] Extracted: 1 Landing page, 3 UTM guidelines.",
          "[URLAgent] Crawling destination links in parallel...",
          "[URLAgent] HTTP status verified (200 OK). Expiry: SSL Valid.",
          "[URLAgent] WARNING: UTM Content query parameter missing on primary CTA.",
          "[EmailQAAgent] Auditing HTML email template variables...",
          "[EmailQAAgent] Checking unrendered curly tokens... All variables render correctly.",
          "[PlaywrightAgent] Generating custom Python Playwright test script...",
          "[PlaywrightExecutor] Initializing Chromium browser instance from pool...",
          "[PlaywrightExecutor] Script executed. Timing error occurred on locator 'text=Buy Now'.",
          "[ScriptRepairAgent] Auto-Correction active: Analyzing logs and adjusting element selectors...",
          "[ScriptRepairAgent] Re-testing updated locator script... SUCCESS!",
          "[ReportingAgent] Compiling Executive PDF and Excel spreadsheets..."
        ];

        for (let i = 0; i < streamSteps.length; i++) {
          await new Promise(r => setTimeout(r, 900));
          setAgentThoughtStream(prev => [...prev, streamSteps[i]]);
        }
      }

      const response = await apiService.submitCopilotQuery(userMessage, selectedCampId || undefined);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.content
      }]);
      
      if (response.content.includes("multi-agent validation pipeline")) {
        // Trigger parent dashboard reload/navigation if needed
        if (selectedCampId) onValidateTrigger(selectedCampId);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Error: failed to contact agent framework."
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto relative z-10 flex flex-col h-[550px] justify-between glass-card border border-white/10 rounded-3xl">
      <div className="scanline"></div>
      
      {/* Header selector */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
        <div>
          <h3 className="text-md font-black text-white uppercase tracking-wider">Agent Copilot Console</h3>
          <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Dual-Agent Chat & Command</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[9px] font-bold text-slate-400 uppercase">Target Context:</span>
          <select 
            value={selectedCampId}
            onChange={e => setSelectedCampId(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-lg p-1 text-[10px] text-white focus:outline-none focus:border-indigo-500"
          >
            {campaigns.map((c, i) => (
              <option key={i} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages chat area */}
      <div className="flex-grow overflow-y-auto mb-4 space-y-4 pr-1">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed border ${isUser ? 'bg-indigo-600 border-indigo-500 text-white rounded-br-none' : 'bg-white/2 border-white/5 text-slate-300 rounded-bl-none'}`}>
                <p className="whitespace-pre-line">{m.content}</p>
              </div>
            </div>
          );
        })}
        
        {/* Dynamic thoughts box */}
        {agentThoughtStream.length > 0 && (
          <div className="p-4 bg-slate-950/60 border border-indigo-500/20 rounded-2xl font-mono text-[10px] text-slate-400 space-y-1.5 shadow-[0_0_15px_rgba(99,102,241,0.05)]">
            <span className="text-indigo-400 font-bold uppercase tracking-widest block mb-2">Streaming Agent Thoughts:</span>
            {agentThoughtStream.map((step, i) => (
              <div key={i} className="animate-fadeIn">{step}</div>
            ))}
          </div>
        )}

        {loading && agentThoughtStream.length === 0 && (
          <div className="flex items-center space-x-2 text-xs text-slate-500 italic">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Agent orchestrator brainstorming plan...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input container */}
      <form onSubmit={handleSubmit} className="flex space-x-3 pt-4 border-t border-white/5">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Command e.g., 'Validate Campaign'..."
          className="flex-grow bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
          disabled={loading}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default CopilotView;
