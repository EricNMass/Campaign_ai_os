export type AppView = 
  | 'Dashboard' 
  | 'Campaigns' 
  | 'Executions' 
  | 'Copilot' 
  | 'DevOps' 
  | 'Reports' 
  | 'Settings';

export interface Campaign {
  id: string;
  name: string;
  audience?: string;
  cta?: string;
  landing_pages: string[];
  tracking_links: string[];
  utm_parameters: Record<string, string>;
  email_assets: string[];
  status: 'Draft' | 'Validating' | 'Active' | 'Failed' | 'Awaiting Approval';
  created_at: string;
}

export interface Task {
  id: string;
  execution_id: string;
  agent_name: string;
  task_name: string;
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  status: 'Pending' | 'Running' | 'Success' | 'Failed';
  execution_time_seconds: number;
  created_at: string;
}

export interface Execution {
  id: string;
  campaign_id: string;
  trigger_type: string;
  browser_type: string;
  status: 'Pending' | 'Running' | 'Success' | 'Failed';
  video_path?: string;
  screenshot_paths: string[];
  log_path?: string;
  created_at: string;
  tasks: Task[];
}

export interface Finding {
  id: string;
  campaign_id: string;
  target_type: 'URL' | 'UTM' | 'SSL' | 'Email' | 'Script';
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  remediation?: string;
  created_at: string;
}

export interface Deployment {
  id: string;
  pipeline_name: string;
  build_id: string;
  status: 'Succeeded' | 'Failed' | 'InProgress' | 'Remediating' | 'Remediated' | 'ManualInterventionRequired';
  commit_hash: string;
  release_notes?: string;
  remediation_steps?: string;
  created_at: string;
}

export interface Report {
  id: string;
  campaign_id: string;
  type: string;
  format: 'PDF' | 'CSV' | 'Excel' | 'HTML';
  file_path: string;
  created_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'agent';
  content: string;
  agent_name?: string;
  timestamp?: string;
}
