import { Campaign, Execution, Finding, Report, Deployment, ChatMessage, Task } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';
export const getUrl = (path: string) => `${API_BASE}${path}`;

const getHeaders = () => {
  const token = localStorage.getItem('campaign_os_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// --- Mock/Client-side Fallback Database ---
const isMockMode = () => localStorage.getItem('campaign_os_mock_mode') === 'true';

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'c1',
    name: 'Winter Retail Splash Campaign',
    audience: 'Online Shoppers',
    cta: 'Get 20% Off',
    landing_pages: ['https://example.com/winter-deals', 'https://example.com/winter-promo'],
    tracking_links: ['https://click.example.com/winter-splash'],
    utm_parameters: { utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'winter2026' },
    email_assets: ['Winter retail discount is live! Check URL: https://click.example.com/winter-splash'],
    status: 'Active',
    created_at: new Date().toISOString()
  },
  {
    id: 'c2',
    name: 'Developer Relations Platform Launch',
    audience: 'Full-Stack Developers',
    cta: 'Start Free Trial',
    landing_pages: ['https://example.dev/platform-launch'],
    tracking_links: [],
    utm_parameters: { utm_source: 'github', utm_medium: 'referral' },
    email_assets: ['Welcome to the developer platform: https://example.dev/platform-launch'],
    status: 'Draft',
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

const MOCK_EXECUTIONS: Execution[] = [
  {
    id: 'e1',
    campaign_id: 'c1',
    trigger_type: 'Manual',
    browser_type: 'chromium',
    status: 'Success',
    created_at: new Date().toISOString(),
    video_path: '',
    screenshot_paths: [],
    log_path: '',
    tasks: [
      {
        id: 't1',
        execution_id: 'e1',
        agent_name: 'CampaignAuditAgent',
        task_name: 'Requirements Checklist Check',
        input_data: {},
        output_data: { status: 'passed', details: 'All mandatory elements found.' },
        status: 'Success',
        execution_time_seconds: 0.8,
        created_at: new Date().toISOString()
      },
      {
        id: 't2',
        execution_id: 'e1',
        agent_name: 'URLCrawlerAgent',
        task_name: 'UTM query and link verification',
        input_data: {},
        output_data: { status: 'passed', verified_urls: 2 },
        status: 'Success',
        execution_time_seconds: 1.4,
        created_at: new Date().toISOString()
      }
    ]
  }
];

const MOCK_AGENTS = [
  { name: 'CampaignAuditAgent', role: 'Requirements validator', tasks_completed: 12, accuracy_score: 0.98, status: 'Idle' },
  { name: 'URLCrawlerAgent', role: 'Broken link scanner & UTM validator', tasks_completed: 45, accuracy_score: 0.95, status: 'Idle' },
  { name: 'EmailQAAgent', role: 'Asset parser & validation runner', tasks_completed: 8, accuracy_score: 1.0, status: 'Idle' }
];

const MOCK_FINDINGS: Finding[] = [
  {
    id: 'f1',
    campaign_id: 'c1',
    target_type: 'URL',
    severity: 'Low',
    description: 'Minor formatting warning in footer navigation links.',
    remediation: 'Verify footer tags are valid HTML.',
    created_at: new Date().toISOString()
  }
];

const MOCK_REPORTS: Report[] = [
  {
    id: 'r1',
    campaign_id: 'c1',
    type: 'Executive Summary',
    format: 'PDF',
    file_path: '#',
    created_at: new Date().toISOString()
  }
];

const MOCK_DEPLOYMENTS: Deployment[] = [
  {
    id: 'd1',
    pipeline_name: 'production-release',
    build_id: 'b1029',
    status: 'Succeeded',
    commit_hash: '75da65e',
    release_notes: 'Frontend configured with dynamic API URL endpoints and GitHub Pages deployment configuration.',
    remediation_steps: '',
    created_at: new Date().toISOString()
  }
];

// Local state lists (persisted in memory for active sessions)
let mockCampaigns = [...MOCK_CAMPAIGNS];
let mockExecutions = [...MOCK_EXECUTIONS];
let mockFindings = [...MOCK_FINDINGS];
let mockReports = [...MOCK_REPORTS];
let mockDeployments = [...MOCK_DEPLOYMENTS];

export const apiService = {
  // Authentication
  async login(username: string, password: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    try {
      const res = await fetch(getUrl('/api/auth/token'), {
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
      localStorage.setItem('campaign_os_mock_mode', 'false');
      return data;
    } catch (err) {
      // Fallback to Mock Auth if API is not reachable (e.g., GitHub Pages static hosting)
      const mockUsers: Record<string, { role: string; pass: string }> = {
        admin: { role: 'admin', pass: 'admin123' },
        engineer: { role: 'automation_engineer', pass: 'engineer123' },
        manager: { role: 'campaign_manager', pass: 'manager123' },
      };
      const mockUser = mockUsers[username];
      if (mockUser && mockUser.pass === password) {
        localStorage.setItem('campaign_os_token', 'mock-token-xyz');
        localStorage.setItem('campaign_os_role', mockUser.role);
        localStorage.setItem('campaign_os_user', username);
        localStorage.setItem('campaign_os_mock_mode', 'true');
        return {
          access_token: 'mock-token-xyz',
          role: mockUser.role,
          username: username
        };
      }
      throw new Error('Invalid credentials');
    }
  },

  logout() {
    localStorage.removeItem('campaign_os_token');
    localStorage.removeItem('campaign_os_role');
    localStorage.removeItem('campaign_os_user');
    localStorage.removeItem('campaign_os_mock_mode');
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
    if (isMockMode()) return mockCampaigns;
    const res = await fetch(getUrl('/api/campaigns'), { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch campaigns');
    return res.json();
  },

  async getCampaign(id: string): Promise<Campaign> {
    if (isMockMode()) {
      const camp = mockCampaigns.find(c => c.id === id);
      if (!camp) throw new Error('Campaign not found');
      return camp;
    }
    const res = await fetch(getUrl(`/api/campaigns/${id}`), { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch campaign details');
    return res.json();
  },

  async createCampaign(campaign: Omit<Campaign, 'id' | 'status' | 'created_at'>): Promise<Campaign> {
    if (isMockMode()) {
      const newCamp: Campaign = {
        ...campaign,
        id: 'c_' + Math.random().toString(36).substr(2, 9),
        status: 'Draft',
        created_at: new Date().toISOString()
      };
      mockCampaigns.push(newCamp);
      return newCamp;
    }
    const res = await fetch(getUrl('/api/campaigns'), {
      method: 'POST',
      headers: getHeaders(),
      body: jsonBody(campaign),
    });
    if (!res.ok) throw new Error('Failed to create campaign');
    return res.json();
  },

  async deleteCampaign(id: string): Promise<void> {
    if (isMockMode()) {
      mockCampaigns = mockCampaigns.filter(c => c.id !== id);
      return;
    }
    const res = await fetch(getUrl(`/api/campaigns/${id}`), {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete campaign');
  },

  async validateCampaign(id: string, browserType = 'chromium'): Promise<any> {
    if (isMockMode()) {
      // Simulate launching validation
      const campIndex = mockCampaigns.findIndex(c => c.id === id);
      if (campIndex !== -1) {
        mockCampaigns[campIndex].status = 'Validating';
      }
      
      const newExecId = 'e_' + Math.random().toString(36).substr(2, 9);
      const newExec: Execution = {
        id: newExecId,
        campaign_id: id,
        trigger_type: 'Manual',
        browser_type: browserType,
        status: 'Running',
        created_at: new Date().toISOString(),
        video_path: '',
        screenshot_paths: [],
        log_path: '',
        tasks: [
          {
            id: 't_mock_1',
            execution_id: newExecId,
            agent_name: 'CampaignAuditAgent',
            task_name: 'Requirements checklist crawler',
            input_data: {},
            output_data: {},
            status: 'Running',
            execution_time_seconds: 0.0,
            created_at: new Date().toISOString()
          }
        ]
      };
      
      mockExecutions.unshift(newExec);

      // Async mock status resolver
      setTimeout(() => {
        const targetExec = mockExecutions.find(e => e.id === newExecId);
        if (targetExec) {
          targetExec.status = 'Success';
          targetExec.tasks[0].status = 'Success';
          targetExec.tasks[0].execution_time_seconds = 2.4;
          targetExec.tasks[0].output_data = { status: 'passed', details: 'Requirements check passed. Local links validated.' };
          
          // Add a mock finding
          const newFinding: Finding = {
            id: 'f_' + Math.random().toString(36).substr(2, 9),
            campaign_id: id,
            target_type: 'UTM',
            severity: 'Medium',
            description: `Verify that UTM parameters match newsletter requirements.`,
            remediation: 'Ensure utm_source is set to Google.',
            created_at: new Date().toISOString()
          };
          mockFindings.unshift(newFinding);

          // Add a mock report
          const newReport: Report = {
            id: 'r_' + Math.random().toString(36).substr(2, 9),
            campaign_id: id,
            type: 'Audit Check',
            format: 'PDF',
            file_path: '#',
            created_at: new Date().toISOString()
          };
          mockReports.unshift(newReport);
        }

        const camp = mockCampaigns.find(c => c.id === id);
        if (camp) {
          camp.status = 'Active';
        }
      }, 5000);

      return { status: 'Running', execution_id: newExecId };
    }

    const res = await fetch(getUrl(`/api/campaigns/${id}/validate?browser_type=${browserType}`), {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to trigger validation');
    return res.json();
  },

  async getFindings(campaignId: string): Promise<Finding[]> {
    if (isMockMode()) {
      return campaignId ? mockFindings.filter(f => f.campaign_id === campaignId) : mockFindings;
    }
    const res = await fetch(getUrl(`/api/campaigns/${campaignId}/findings`), { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch findings');
    return res.json();
  },

  async getReports(campaignId: string): Promise<Report[]> {
    if (isMockMode()) {
      return campaignId ? mockReports.filter(r => r.campaign_id === campaignId) : mockReports;
    }
    const res = await fetch(getUrl(`/api/campaigns/${campaignId}/reports`), { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },

  // Executions
  async getExecutions(): Promise<Execution[]> {
    if (isMockMode()) return mockExecutions;
    const res = await fetch(getUrl('/api/executions'), { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch executions');
    return res.json();
  },

  async getExecution(id: string): Promise<Execution> {
    if (isMockMode()) {
      const exec = mockExecutions.find(e => e.id === id);
      if (!exec) throw new Error('Execution run not found');
      return exec;
    }
    const res = await fetch(getUrl(`/api/executions/${id}`), { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch execution run');
    return res.json();
  },

  async getExecutionLogs(id: string): Promise<string> {
    if (isMockMode()) {
      return `[Mock Logs - Run ID: ${id}]\nInfo: Commencing autonomous agent fleet routing...\nInfo: Running Playwright chromium browser executor...\nInfo: CampaignAuditAgent checklist verified.\nInfo: URLCrawlerAgent crawlers running on 2 URLs...\nSuccess: Validation process complete.`;
    }
    const res = await fetch(getUrl(`/api/executions/${id}/logs`), { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch execution logs');
    const data = await res.json();
    return data.logs;
  },

  // Agents
  async getAgents(): Promise<any[]> {
    if (isMockMode()) return MOCK_AGENTS;
    const res = await fetch(getUrl('/api/agents'), { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch agent list');
    return res.json();
  },

  async submitCopilotQuery(message: string, campaignId?: string): Promise<ChatMessage> {
    if (isMockMode()) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        role: 'assistant',
        content: `[Demo Mode] I have processed your inquiry: "${message}". Since this is running as a static mock frontend, I can't query Google Gemini live. However, I can confirm that your local campaign definitions and UTM links appear well-structured!`,
        timestamp: new Date().toISOString()
      };
    }
    const res = await fetch(getUrl('/api/agents/copilot'), {
      method: 'POST',
      headers: getHeaders(),
      body: jsonBody({ message, campaign_id: campaignId }),
    });
    if (!res.ok) throw new Error('Failed to submit Copilot query');
    return res.json();
  },

  // DevOps
  async getDeployments(): Promise<Deployment[]> {
    if (isMockMode()) return mockDeployments;
    const res = await fetch(getUrl('/api/devops/deployments'), { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch deployments');
    return res.json();
  },

  async triggerPipeline(pipelineId: number): Promise<any> {
    if (isMockMode()) {
      const newId = 'd_' + Math.random().toString(36).substr(2, 9);
      const newBuild: Deployment = {
        id: newId,
        pipeline_name: `manual-trigger-${pipelineId}`,
        build_id: 'b' + Math.floor(1000 + Math.random() * 9000),
        status: 'InProgress',
        commit_hash: 'abc1234',
        release_notes: 'Triggered from client portal',
        remediation_steps: '',
        created_at: new Date().toISOString()
      };
      mockDeployments.unshift(newBuild);

      setTimeout(() => {
        const build = mockDeployments.find(d => d.id === newId);
        if (build) build.status = 'Succeeded';
      }, 5000);

      return { status: 'Triggered', build_id: newBuild.build_id };
    }
    const res = await fetch(getUrl(`/api/devops/trigger?pipeline_id=${pipelineId}`), {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to trigger pipeline');
    return res.json();
  },

  async remediateBuild(buildId: string): Promise<any> {
    if (isMockMode()) {
      const build = mockDeployments.find(d => d.build_id === buildId);
      if (build) {
        build.status = 'Remediated';
        build.remediation_steps = 'Self-healing repair agent auto-patched build dependencies and resolved pipeline checks.';
      }
      return { status: 'Remediated' };
    }
    const res = await fetch(getUrl(`/api/devops/remediate/${buildId}`), {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to start remediation');
    return res.json();
  }
};

const jsonBody = (obj: any) => JSON.stringify(obj);
