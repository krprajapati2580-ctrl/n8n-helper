export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  screenshot?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  nodeName: string;
  detail: string;
  completed: boolean;
}

export interface NodeFound {
  name: string;
  type: string;
  credentialsNeeded?: string;
  description: string;
}

export interface WorkflowInsight {
  type: 'warning' | 'info' | 'error';
  message: string;
  nodeName?: string;
}

export interface AnalysisResponse {
  reply: string;
  checklist: ChecklistItem[];
  nodesFound: NodeFound[];
  insights: WorkflowInsight[];
}
