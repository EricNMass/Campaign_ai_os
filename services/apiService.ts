import { Campaign, Execution, Finding, Report, Deployment, ChatMessage } from '../types';

const getHeaders = () => {
  const token = localStorage.getItem('campaign_os_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const apiService = {
  // Authentication
  async login(username: string, password: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const res = await fetch('/api/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    if (!res.ok) throw new Error('Invalid credentials');
    const data = await res.json();
    localStorage.setItem('campaign_os_token', data.access_token);
    localStorage.setItem('campaign_os_role', data.role);
    localStorage.setItem('campaign_os_user', username);
    return data;
  },

  logout() {
    localStorage.removeItem('campaign_os_token');
    localStorage.removeItem('campaign_os_role');
    localStorage.removeItem('campaign_os_user');
  },

  getCurrentUser() {
    return {
      username: localStorage.getItem('campaign_os_user'),
      role: localStorage.getItem('campaign_os_role'),
      token: localStorage.getItem('campaign_os_token')
    };
  },

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    const res = await fetch('/api/campaigns', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch campaigns');
    return res.json();
  },

  async getCampaign(id: string): Promise<Campaign> {
    const res = await fetch(`/api/campaigns/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch campaign details');
    return res.json();
  },

  async createCampaign(campaign: Omit<Campaign, 'id' | 'status' | 'created_at'>): Promise<Campaign> {
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: getHeaders(),
      body: jsonBody(campaign),
    });
    if (!res.ok) throw new Error('Failed to create campaign');
    return res.json();
  },

  async deleteCampaign(id: string): Promise<void> {
    const res = await fetch(`/api/campaigns/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete campaign');
  },

  async validateCampaign(id: string, browserType = 'chromium'): Promise<any> {
    const res = await fetch(`/api/campaigns/${id}/validate?browser_type=${browserType}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to trigger validation');
    return res.json();
  },

  async getFindings(campaignId: string): Promise<Finding[]> {
    const res = await fetch(`/api/campaigns/${campaignId}/findings`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch findings');
    return res.json();
  },

  async getReports(campaignId: string): Promise<Report[]> {
    const res = await fetch(`/api/campaigns/${campaignId}/reports`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },

  // Executions
  async getExecutions(): Promise<Execution[]> {
    const res = await fetch('/api/executions', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch executions');
    return res.json();
  },

  async getExecution(id: string): Promise<Execution> {
    const res = await fetch(`/api/executions/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch execution run');
    return res.json();
  },

  async getExecutionLogs(id: string): Promise<string> {
    const res = await fetch(`/api/executions/${id}/logs`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch execution logs');
    const data = await res.json();
    return data.logs;
  },

  // Agents
  async getAgents(): Promise<any[]> {
    const res = await fetch('/api/agents', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch agent list');
    return res.json();
  },

  async submitCopilotQuery(message: string, campaignId?: string): Promise<ChatMessage> {
    const res = await fetch('/api/agents/copilot', {
      method: 'POST',
      headers: getHeaders(),
      body: jsonBody({ message, campaign_id: campaignId }),
    });
    if (!res.ok) throw new Error('Failed to submit Copilot query');
    return res.json();
  },

  // DevOps
  async getDeployments(): Promise<Deployment[]> {
    const res = await fetch('/api/devops/deployments', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch deployments');
    return res.json();
  },

  async triggerPipeline(pipelineId: number): Promise<any> {
    const res = await fetch(`/api/devops/trigger?pipeline_id=${pipelineId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to trigger pipeline');
    return res.json();
  },

  async remediateBuild(buildId: string): Promise<any> {
    const res = await fetch(`/api/devops/remediate/${buildId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to start remediation');
    return res.json();
  }
};

const jsonBody = (obj: any) => JSON.stringify(obj);
