import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  Cpu, 
  HelpCircle, 
  Settings, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Play, 
  Upload, 
  FileCode, 
  Check, 
  RefreshCw, 
  MessageSquare, 
  Key, 
  Eye, 
  Zap,
  BookOpen,
  Send,
  Sparkles,
  ChevronRight,
  Clipboard,
  X,
  Brain,
  Plus,
  Trash2,
  Tv,
  Moon,
  Sun,
  Activity,
  Minimize2,
  Maximize2,
  Search,
  Compass,
  GitCommit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, ChecklistItem, NodeFound, WorkflowInsight, AnalysisResponse } from './types';
import WebhookInspector from './components/WebhookInspector';

// Predefined realistic n8n workflow for quick demo loading
const SAMPLE_N8N_WORKFLOW = {
  "nodes": [
    {
      "parameters": {
        "path": "lead-ingestion",
        "options": {}
      },
      "name": "Webhook Inbound Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [100, 300]
    },
    {
      "parameters": {
        "model": "gpt-4o",
        "promptType": "define",
        "text": "Summarize this inbound customer message and categorize urgency (High, Medium, Low):\nName: {{ $json.body.name }}\nEmail: {{ $json.body.email }}\nMessage: {{ $json.body.message }}",
        "options": {
          "temperature": 0.3
        }
      },
      "name": "Gemini AI Agent Node",
      "type": "n8n-nodes-base.advancedAi",
      "typeVersion": 1,
      "position": [360, 300]
    },
    {
      "parameters": {
        "channel": "customer-alerts",
        "text": "=🚨 *Urgent Lead Summary* 🚨\n\n*Name:* {{ $json.body.name }}\n*Urgency:* {{ $json.output.category }}\n\n*Executive Summary:* \n{{ $json.output.summary }}"
      },
      "name": "Slack Operations Alert",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 2,
      "position": [620, 300]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.output.category }}",
              "value2": "High"
            }
          ]
        }
      },
      "name": "High Urgency Guard",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [480, 150]
    }
  ],
  "connections": {
    "Webhook Inbound Trigger": {
      "main": [
        [
          {
            "node": "Gemini AI Agent Node",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Gemini AI Agent Node": {
      "main": [
        [
          {
            "node": "High Urgency Guard",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "High Urgency Guard": {
      "main": [
        [
          {
            "node": "Slack Operations Alert",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
};

// Simple tutorial and code snippets for setting up native error routing in n8n
const N8N_ERROR_TRIGGER_BLUEPRINT = `{
  "meta": {
    "instanceId": "cb5a8f4c21946fe7"
  },
  "nodes": [
    {
      "parameters": {},
      "id": "e818bfa0-56a9-4623",
      "name": "Error Trigger",
      "type": "n8n-nodes-base.errorTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "model": "gpt-4o",
        "options": {}
      },
      "id": "1d8bf421-4fa3-5cb3",
      "name": "Error Diagnostics AI Agent",
      "type": "n8n-nodes-base.advancedAi",
      "typeVersion": 1,
      "position": [480, 300],
      "notesInFlow": true,
      "notes": "Parses error logs, matches against known API errors, and updates database or notifies developer."
    }
  ],
  "connections": {
    "Error Trigger": {
      "main": [
        [
          {
            "node": "Error Diagnostics AI Agent",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}`;

const QUIZ_QUESTIONS = [
  {
    question: "How do you reference a parameter called 'email' from a previous node named 'Get Customer' in modern n8n?",
    options: [
      { text: "$node['Get Customer'].json.email", isCorrect: false },
      { text: "$('Get Customer').item.json.email", isCorrect: true },
      { text: "$json.Get_Customer.email", isCorrect: false },
      { text: "$node.Get_Customer.data.email", isCorrect: false }
    ],
    explanation: "In modern n8n versions, the correct syntax uses $('Node Name').item.json.propertyName. This ensures proper item-level tracking across loops!"
  },
  {
    question: "When designing a Webhook trigger, your workflow doesn't capture events when you call the production Webhook URL. Why?",
    options: [
      { text: "Production webhooks only listen when the workflow is fully Saved and set to ACTIVE.", isCorrect: true },
      { text: "Production webhooks only work on paid n8n plans.", isCorrect: false },
      { text: "You must use a proxy server to map production webhooks.", isCorrect: false },
      { text: "n8n webhooks only support GET requests by default.", isCorrect: false }
    ],
    explanation: "For safety, the Production URL only triggers when your workflow is Active. While building and testing, always copy the Test URL and click 'Listen for test event'!"
  },
  {
    question: "Your custom Code Node throws 'Cannot find module \"lodash\"' in your self-hosted n8n container. How do you resolve this?",
    options: [
      { text: "Write 'import lodash from \"lodash\"' at the bottom of the node.", isCorrect: false },
      { text: "Restart n8n and try pasting the code again.", isCorrect: false },
      { text: "Set the environment variable NODE_FUNCTION_ALLOW_EXTERNAL=lodash in your n8n Docker deployment.", isCorrect: true },
      { text: "N8n does not support external packages at all.", isCorrect: false }
    ],
    explanation: "Self-hosted n8n restricts package imports for security. You must authorize npm libraries by adding them to the NODE_FUNCTION_ALLOW_EXTERNAL environment variable."
  },
  {
    question: "If Node A outputs a list of 10 customer records, and Node B is a Slack Node connected next, how many Slack messages are posted by default?",
    options: [
      { text: "1 message containing all 10 records", isCorrect: false },
      { text: "0 messages (errors out because it's a list)", isCorrect: false },
      { text: "10 individual Slack messages (one for each customer)", isCorrect: true },
      { text: "1 message with only the first customer", isCorrect: false }
    ],
    explanation: "N8n operates on an item-based loop execution model. If a node receives multiple items, it executes the subsequent node once for each item in the list!"
  }
];

interface TrainingRule {
  id: string;
  title: string;
  content: string;
  category: 'Credentials' | 'Environment' | 'Best Practices' | 'Custom Snippets';
}

const DEFAULT_TRAINING_DATA: TrainingRule[] = [
  {
    id: "rule-1",
    title: "Local Docker Node Modules Access",
    content: "Error: 'Cannot find module ...' inside custom Code Nodes. Self-hosted n8n operates in a sandboxed Node.js environment. To permit external npm packages inside Code Nodes, you must run n8n with the environment variable: NODE_FUNCTION_ALLOW_EXTERNAL=lodash,axios,cheerio,uuid or set NODE_FUNCTION_ALLOW_BUILTIN=* in your docker-compose env setup.",
    category: "Environment"
  },
  {
    id: "rule-2",
    title: "Tunneling Webhooks locally (ngrok / Localtunnel)",
    content: "Issue: Trigger node hangs on 'Waiting for test event' or returns 404. When running n8n on localhost:5678, webhooks from Slack, Shopify, or GitHub cannot contact your local machine. Set WEBHOOK_URL=https://your-tunnel-subdomain.ngrok-free.app inside n8n's docker-compose, and ensure your third-party integrations point to this tunnel domain.",
    category: "Environment"
  },
  {
    id: "rule-3",
    title: "Database PostgreSQL Local SSL Certs",
    content: "Error: 'self-signed certificate' or connection rejected. For local or self-hosted databases that require SSL but use self-signed certificates, bypass strict validation rejection by configuring DB_POSTGRES_SSL_REJECT_UNAUTHORIZED=false in the n8n system container's environment configuration.",
    category: "Credentials"
  },
  {
    id: "rule-4",
    title: "AI Agent Node local rate limits",
    content: "Error: '429 Too Many Requests' or 'Quota exceeded'. Keep loop-based request rates below 15 requests/minute when testing with free-tier or shared Gemini / OpenAI API keys. Implement standard rate limiting or use a Throttle node to serialize the flow.",
    category: "Best Practices"
  },
  {
    id: "rule-5",
    title: "Webhook URL Confusion (Test vs Production)",
    content: "Issue: Webhook doesn't trigger when active, or test event fails to fire. n8n maintains separate Webhook paths: '/webhook-test/' (only listens for 120 seconds after you click 'Listen for test event' in the canvas UI) and '/webhook/' (active 24/7 once the workflow is toggled to ACTIVE and saved). Never mix up test payloads with the production path.",
    category: "Best Practices"
  },
  {
    id: "rule-6",
    title: "n8n Expression Null Safety Operator",
    content: "Error: 'Cannot read property of undefined'. Raw JSON payloads frequently have missing fields. Prevent execution halts by using safe optional chaining and default fallback syntax in expressions: {{ $json.body?.customer?.email || 'no-email@domain.com' }} or {{ $json.items?.[0]?.id ?? 'None' }}.",
    category: "Custom Snippets"
  },
  {
    id: "rule-7",
    title: "HTTP Request SSL Verification Bypass",
    content: "Error: 'self signed certificate in certificate chain'. When requesting self-hosted APIs or local development endpoints with the native HTTP Request Node, click 'Add Option' -> Select 'Ignore SSL Issues' and toggle it to TRUE to prevent Node.js from terminating the request due to trust issues.",
    category: "Credentials"
  },
  {
    id: "rule-8",
    title: "Gmail API 403 Forbidden Access",
    content: "Error: '403 Access Blocked' or 'Publishing status is testing'. In Google Cloud Console OAuth Consent settings, you must change your Publishing Status from 'Testing' to 'In Production', or explicitly add the user's Google accounts under the authorized 'Test Users' list to authorize access.",
    category: "Credentials"
  },
  {
    id: "rule-9",
    title: "Google Sheets Shared Account Permissions",
    content: "Error: 'Spreadsheet not found (404)' or permission denied. When using Google Sheets Service Account credentials, n8n connects via a client email (e.g. n8n-service@gcp-project.iam.gserviceaccount.com). You must manually share the Google Sheet with this exact service account email, granting it 'Editor' permissions.",
    category: "Credentials"
  },
  {
    id: "rule-10",
    title: "Slack App Bot Scopes Alignment",
    content: "Error: 'missing_scope' or 'not_in_channel'. Ensure your Slack App Bot token is granted 'chat:write' and 'channels:read' permissions in the Slack Developer Portal. Also, if posting to a private channel, your Slack App Bot must be manually invited to that channel first via: /invite @YourAppName.",
    category: "Credentials"
  },
  {
    id: "rule-11",
    title: "JavaScript Out of Memory (Heap Exhausted)",
    content: "Error: 'JavaScript heap out of memory' during large file processing or high-concurrency looping. Prevent host crashes by turning on executions database pruning: set EXECUTIONS_DATA_PRUNE=true, EXECUTIONS_DATA_MAX_AGE=168, and allocate more RAM using Docker's resource control: '--memory=2g'.",
    category: "Environment"
  },
  {
    id: "rule-12",
    title: "SQLite Database Locks (Busy DB)",
    content: "Error: 'SQLITE_BUSY: database is locked'. The default SQLite database is not designed for concurrent multi-worker production environments. If running multiple workflows concurrently, shift your self-hosted n8n backend storage by setting DB_TYPE=postgres and linking postgres credentials.",
    category: "Environment"
  },
  {
    id: "rule-13",
    title: "HTTP Request Socket Connection Timeout",
    content: "Error: 'ETIMEDOUT' or 'socket hang up' on heavy external requests. In the HTTP Request Node settings, click 'Add Option' -> Select 'Timeout' and increase the connection limit to 180000 milliseconds (3 minutes) to support slow API endpoints.",
    category: "Best Practices"
  },
  {
    id: "rule-14",
    title: "Webhook CORS Preflight Responses",
    content: "Error: 'CORS policy blocked preflight check' when triggering webhooks from a frontend application. Configure your Webhook Node settings: Set 'HTTP Method' to 'POST', then click 'Add Option' -> Select 'Response Headers' -> Add 'Access-Control-Allow-Origin: *' and 'Access-Control-Allow-Methods: POST, OPTIONS'.",
    category: "Best Practices"
  },
  {
    id: "rule-15",
    title: "Expression Syntax for Space-Contained Node Names",
    content: "Syntax Issue: When referencing an upstream node whose name contains spaces or special characters, standard dot-notation fails. Always use bracket-notation instead: {{ $('Google Sheets Reader').item.json.email }} instead of {{ $node.Google Sheets Reader.json.email }}.",
    category: "Custom Snippets"
  }
];

const getConnectionSuggestion = (nodeName: string) => {
  const lowerName = nodeName.toLowerCase();
  if (lowerName.includes('webhook') || lowerName.includes('trigger') && !lowerName.includes('error')) {
    return {
      suggestedNodeName: "OpenAI Enrichment Agent",
      suggestedNodeType: "n8n-nodes-base.openAi",
      reason: "To parse, categorize, and enrich incoming raw webhook payload data using AI before notifying teams or routing to databases.",
      outputPort: "Main Output Handle (Data)",
      targetNodeName: "OpenAI enrichment"
    };
  } else if (lowerName.includes('openai') || lowerName.includes('gemini') || lowerName.includes('enrichment') || lowerName.includes('agent')) {
    return {
      suggestedNodeName: "Slack Operations Alert",
      suggestedNodeType: "n8n-nodes-base.slack",
      reason: "To immediately post high-priority structured lead notifications directly to your team's custom Slack channel.",
      outputPort: "Main Output Handle (JSON Output)",
      targetNodeName: "Slack Notify"
    };
  } else if (lowerName.includes('error')) {
    return {
      suggestedNodeName: "Slack Notify / AI Diagnostics",
      suggestedNodeType: "n8n-nodes-base.slack",
      reason: "To alert engineers on dedicated Slack operations channels with full stack traces, log outputs, and context for automated self-healing.",
      outputPort: "Error Output Handle (Trigger Logs)",
      targetNodeName: "Slack Notify"
    };
  } else if (lowerName.includes('slack') || lowerName.includes('notify')) {
    return {
      suggestedNodeName: "Postgres Database / Airtable logger",
      suggestedNodeType: "n8n-nodes-base.postgres",
      reason: "To log and audit operations, creating a persistent registry of all notifications sent.",
      outputPort: "Main Output Handle (Response Status)",
      targetNodeName: ""
    };
  }
  return {
    suggestedNodeName: "Code Node",
    suggestedNodeType: "n8n-nodes-base.code",
    reason: "Standard JavaScript execution block to format, filter, and transform schemas between nodes.",
    outputPort: "Main Output Handle",
    targetNodeName: ""
  };
};

export default function App() {
  // Input fields
  const [workflowJson, setWorkflowJson] = useState<string>(() => localStorage.getItem('n8n_workflow_json') || '');
  const [logsInput, setLogsInput] = useState<string>(() => localStorage.getItem('n8n_logs_input') || '');
  const [screenshot, setScreenshot] = useState<string | null>(() => localStorage.getItem('n8n_screenshot') || null);
  
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'capture' | 'json' | 'native' | 'academy' | 'memory' | 'settings'>(() => {
    return (localStorage.getItem('n8n_active_tab') as 'capture' | 'json' | 'native' | 'academy' | 'memory' | 'settings') || 'capture';
  });
  const [selectedNode, setSelectedNode] = useState<NodeFound | null>(null);
  const [isAssistantActive, setIsAssistantActive] = useState<boolean>(false);

  // Academy states
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // States for server response data
  const [chatHistory, setChatHistory] = useState<Message[]>(() => {
    const cached = localStorage.getItem('n8n_chat_history');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { /* ignore */ }
    }
    return [
      {
        id: 'welcome',
        sender: 'assistant',
        text: "👋 Hello! I am your **n8n Workflow Copilot**.\n\nI can analyze your workflow JSON structure, see screenshot captures of your n8n canvas (using browser screen share), read error logs, and diagnose issues. \n\n*How can we get started?* \n- Upload/paste your n8n workflow code in the **JSON & Logs** tab.\n- Or use **Screen Capture** to share your current n8n screen directly!\n- Ask me any troubleshooting questions.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    const cached = localStorage.getItem('n8n_checklist');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { /* ignore */ }
    }
    return [];
  });
  const [nodesFound, setNodesFound] = useState<NodeFound[]>([]);
  const [insights, setInsights] = useState<WorkflowInsight[]>([]);
  
  // Local Knowledge Base Training states
  const [localTrainingData, setLocalTrainingData] = useState<TrainingRule[]>(() => {
    const cached = localStorage.getItem('n8n_training_rules');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { /* ignore */ }
    }
    return DEFAULT_TRAINING_DATA;
  });

  // State for adding a new local training rule
  const [newRuleTitle, setNewRuleTitle] = useState<string>('');
  const [newRuleCategory, setNewRuleCategory] = useState<'Credentials' | 'Environment' | 'Best Practices' | 'Custom Snippets'>('Environment');
  const [newRuleContent, setNewRuleContent] = useState<string>('');
  const [ruleAddedSuccess, setRuleAddedSuccess] = useState<boolean>(false);
  
  // Interactive / UI Helper states
  const [userInput, setUserInput] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCopiedBlueprint, setIsCopiedBlueprint] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Fallback API Keys & Preferred Model states
  const [preferredModel, setPreferredModel] = useState<'gemini' | 'openai' | 'claude'>(() => {
    return (localStorage.getItem('n8n_preferred_model') as 'gemini' | 'openai' | 'claude') || 'gemini';
  });
  const [openaiApiKey, setOpenaiApiKey] = useState<string>(() => {
    return localStorage.getItem('n8n_openai_api_key') || '';
  });
  const [claudeApiKey, setClaudeApiKey] = useState<string>(() => {
    return localStorage.getItem('n8n_claude_api_key') || '';
  });

  // Preset Knowledge Search & Filters
  const [presetSearchQuery, setPresetSearchQuery] = useState<string>('');
  const [presetFilterCategory, setPresetFilterCategory] = useState<'All' | 'Credentials' | 'Environment' | 'Best Practices' | 'Custom Snippets'>('All');

  // Floating Companion & Dimmed Backdrop overlay modes
  const [isFloatingCompanion, setIsFloatingCompanion] = useState<boolean>(() => {
    return localStorage.getItem('n8n_is_floating_companion') === 'true';
  });
  const [isDimmedOverlay, setIsDimmedOverlay] = useState<boolean>(() => {
    return localStorage.getItem('n8n_is_dimmed_overlay') === 'true';
  });
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    return localStorage.getItem('n8n_is_minimized') === 'true';
  });

  // Live guiding stream states
  const [isLiveGuidingActive, setIsLiveGuidingActive] = useState<boolean>(false);
  const [countdownToNextCapture, setCountdownToNextCapture] = useState<number>(8);

  // References for live stream media capturing
  const activeStreamRef = useRef<MediaStream | null>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Live frame capture logic (without repetitive permission popups)
  const captureLiveFrame = () => {
    const video = hiddenVideoRef.current;
    if (!video || video.paused || video.ended || !activeStreamRef.current) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/png");
        setScreenshot(base64);
        console.log("Automatically synchronized a new live frame from screen track.");
      }
    } catch (err) {
      console.error("Live frame capture warning:", err);
    }
  };

  // Start display stream capture
  const startLiveGuiding = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as unknown as MediaTrackConstraints,
        audio: false
      });
      
      activeStreamRef.current = stream;
      
      let video = hiddenVideoRef.current;
      if (!video) {
        video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        hiddenVideoRef.current = video;
      }
      video.srcObject = stream;
      await video.play();
      
      setIsLiveGuidingActive(true);
      setCountdownToNextCapture(8);
      
      // Stop tracking if stream ended inside Chrome/OS interface
      stream.getVideoTracks()[0].onended = () => {
        stopLiveGuiding();
      };
      
      setTimeout(() => {
        captureLiveFrame();
      }, 1000);

      setChatHistory(prev => [
        ...prev,
        {
          id: `live-on-${Date.now()}`,
          sender: 'assistant',
          text: "🟢 **Live Guiding Screen Stream initialized!**\n\nI am now monitoring your n8n workspace. Every **8 seconds** I will silently snap a fresh image of your screen. Ask me troubleshooting questions or click **Analyze Canvas** to sync with my backend whenever you hit a bug!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      console.error("Screen track start error:", err);
      setErrorMsg("Failed to start live guiding: screen share track was blocked or canceled by browser.");
    }
  };

  // Stop display stream capture
  const stopLiveGuiding = () => {
    setIsLiveGuidingActive(false);
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
    }
    if (hiddenVideoRef.current) {
      hiddenVideoRef.current.srcObject = null;
    }
    setChatHistory(prev => [
      ...prev,
      {
        id: `live-off-${Date.now()}`,
        sender: 'assistant',
        text: "🛑 **Live guiding stream stopped.** I am no longer recording or syncing your screen.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleApplyPresetSolution = (title: string, content: string) => {
    if (!localTrainingData.some(rule => rule.title === title)) {
      const newRule: TrainingRule = {
        id: `preset-patch-${Date.now()}`,
        title,
        category: 'Environment',
        content
      };
      setLocalTrainingData(prev => [...prev, newRule]);
    }
    setActiveTab('memory');
    setChatHistory(prev => [
      ...prev,
      {
        id: `patch-added-${Date.now()}`,
        sender: 'assistant',
        text: `🛠️ **Copilot Context Updated!**\n\nI have automatically ingested the environment rule: **${title}** into my local workspace memory. This solution is now actively prioritized for future workspace diagnoses!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Cleanup live stream guiding tracks on component unmount
  useEffect(() => {
    return () => {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('n8n_preferred_model', preferredModel);
  }, [preferredModel]);

  useEffect(() => {
    localStorage.setItem('n8n_openai_api_key', openaiApiKey);
  }, [openaiApiKey]);

  useEffect(() => {
    localStorage.setItem('n8n_claude_api_key', claudeApiKey);
  }, [claudeApiKey]);

  useEffect(() => {
    localStorage.setItem('n8n_is_floating_companion', String(isFloatingCompanion));
  }, [isFloatingCompanion]);

  useEffect(() => {
    localStorage.setItem('n8n_is_dimmed_overlay', String(isDimmedOverlay));
  }, [isDimmedOverlay]);

  useEffect(() => {
    localStorage.setItem('n8n_is_minimized', String(isMinimized));
  }, [isMinimized]);

  // Handle stream capture countdown loop
  useEffect(() => {
    let interval: any = null;
    if (isLiveGuidingActive) {
      interval = setInterval(() => {
        setCountdownToNextCapture(prev => {
          if (prev <= 1) {
            captureLiveFrame();
            return 8;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdownToNextCapture(8);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLiveGuidingActive]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Synchronize state changes to localStorage for local runtime persistence
  useEffect(() => {
    localStorage.setItem('n8n_workflow_json', workflowJson);
  }, [workflowJson]);

  useEffect(() => {
    localStorage.setItem('n8n_logs_input', logsInput);
  }, [logsInput]);

  useEffect(() => {
    if (screenshot) {
      localStorage.setItem('n8n_screenshot', screenshot);
    } else {
      localStorage.removeItem('n8n_screenshot');
    }
  }, [screenshot]);

  useEffect(() => {
    localStorage.setItem('n8n_chat_history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    localStorage.setItem('n8n_checklist', JSON.stringify(checklist));
  }, [checklist]);

  useEffect(() => {
    localStorage.setItem('n8n_training_rules', JSON.stringify(localTrainingData));
  }, [localTrainingData]);

  useEffect(() => {
    localStorage.setItem('n8n_active_tab', activeTab);
  }, [activeTab]);

  // Handle Drag Events for screenshot drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg("Please upload only image files (PNG, JPEG, etc.).");
      return;
    }
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setScreenshot(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Browser-native Display Capture to grab a snapshot of the n8n PC window
  const startScreenCapture = async () => {
    try {
      setErrorMsg(null);
      // Request screen video capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as unknown as MediaTrackConstraints,
        audio: false
      });
      
      const video = document.createElement("video");
      video.srcObject = stream;
      
      video.onloadedmetadata = () => {
        video.play();
        // Wait briefly for the stream to render a frame
        setTimeout(() => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL("image/png");
            setScreenshot(base64);
            
            // Add notification message in chat
            setChatHistory(prev => [
              ...prev,
              {
                id: `snap-${Date.now()}`,
                sender: 'assistant',
                text: "📸 **Screen Frame Captured successfully!** Click **Analyze Canvas & Context** to send the image along with any code or log files to the Copilot for diagnosing.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          }
          // Stop stream tracks
          stream.getTracks().forEach(track => track.stop());
        }, 600);
      };
    } catch (err: any) {
      console.error("Screen capture error:", err);
      setErrorMsg("Screen capture was canceled or blocked by your browser. You can still upload screenshots of n8n using the file picker below!");
    }
  };

  // Preset quick analysis helper
  const handleLoadSample = () => {
    setWorkflowJson(JSON.stringify(SAMPLE_N8N_WORKFLOW, null, 2));
    setLogsInput(`[n8n Execution Failed]
Node: Gemini AI Agent Node
Error: 401 Unauthorized
Message: Authentication failed. Please check that a valid GEMINI_API_KEY is supplied.
Time: 09:34:12 UTC`);
    setActiveTab('json');
    setErrorMsg(null);

    setChatHistory(prev => [
      ...prev,
      {
        id: `sample-${Date.now()}`,
        sender: 'assistant',
        text: "💡 **Sample n8n workflow loaded!** This workflow triggers on a webhook, passes data to a Gemini AI node for analysis, and posts high-urgency alerts to Slack.\n\nI have also loaded an execution log containing an **Authentication error** for testing.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Submit to Gemini endpoint
  const analyzeWorkflow = async (customPrompt?: string) => {
    setIsAnalyzing(true);
    setErrorMsg(null);

    const activePrompt = customPrompt || userInput || "Analyze the current state of my n8n workflow, point out what credentials it needs, where to put them, and how to fix any errors.";

    // Add user message to history
    const userMsgId = `user-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text: activePrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      screenshot: screenshot || undefined
    };

    setChatHistory(prev => [...prev, userMsg]);
    setUserInput('');

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowJson: workflowJson || undefined,
          screenshotBase64: screenshot || undefined,
          logs: logsInput || undefined,
          chatHistory: chatHistory.slice(-6).map(m => ({ sender: m.sender, text: m.text })),
          userPrompt: activePrompt,
          localTrainingData: localTrainingData,
          preferredModel: preferredModel,
          openaiApiKey: openaiApiKey || undefined,
          claudeApiKey: claudeApiKey || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Failed with server status ${response.status}`);
      }

      const data: AnalysisResponse = await response.json();

      // Update copilot diagnostics panel
      if (data.checklist && data.checklist.length > 0) {
        setChecklist(data.checklist);
      }
      if (data.nodesFound && data.nodesFound.length > 0) {
        setNodesFound(data.nodesFound);
      }
      if (data.insights && data.insights.length > 0) {
        setInsights(data.insights);
      }

      // Add model's text response to chat
      setChatHistory(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

    } catch (err: any) {
      console.error("Analysis failed:", err);
      setErrorMsg(`Failed to get analysis: ${err.message || "Unknown error"}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      analyzeWorkflow();
    }
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleCopyBlueprint = () => {
    navigator.clipboard.writeText(N8N_ERROR_TRIGGER_BLUEPRINT);
    setIsCopiedBlueprint(true);
    setTimeout(() => setIsCopiedBlueprint(false), 2000);
  };

  const handleCopyItem = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Inline formatting helper
  const parseInlineFormatting = (text: string) => {
    return text.split(/(\*\*.*?\*\*|`.*?`)/).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="px-1.5 py-0.5 bg-slate-100 text-rose-600 rounded font-mono text-xs">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  // Full formatted output render
  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-sm font-semibold text-slate-800 mt-3 mb-1 font-sans">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="text-base font-bold text-slate-900 mt-4 mb-1.5 font-sans">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={idx} className="text-lg font-extrabold text-slate-950 mt-5 mb-2 font-sans">{line.replace('# ', '')}</h2>;
      }
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const content = line.trim().substring(2);
        return (
          <li key={idx} className="list-disc ml-5 text-slate-600 my-1 text-sm leading-relaxed">
            {parseInlineFormatting(content)}
          </li>
        );
      }
      const numMatch = line.trim().match(/^(\d+)\.\s(.*)$/);
      if (numMatch) {
        return (
          <li key={idx} className="list-decimal ml-5 text-slate-600 my-1 text-sm leading-relaxed">
            {parseInlineFormatting(numMatch[2])}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-slate-600 text-sm leading-relaxed my-1.5">
          {parseInlineFormatting(line)}
        </p>
      );
    });
  };

  const renderFullMarkdown = (text: string) => {
    if (!text) return null;
    const blocks = text.split('```');
    return blocks.map((block, index) => {
      if (index % 2 === 1) {
        const lines = block.split('\n');
        const firstLine = lines[0].trim();
        const hasLang = firstLine === 'json' || firstLine === 'javascript' || firstLine === 'js' || firstLine === 'bash' || firstLine === 'sh' || firstLine === 'typescript' || firstLine === 'ts';
        const codeContent = hasLang ? lines.slice(1).join('\n') : block;
        return (
          <div key={index} className="relative my-3">
            <div className="absolute right-2 top-2 text-slate-500 text-[10px] font-mono select-none px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">
              {hasLang ? firstLine.toUpperCase() : 'CODE'}
            </div>
            <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-inner border border-slate-800 leading-relaxed max-w-full">
              <code>{codeContent.trim()}</code>
            </pre>
          </div>
        );
      } else {
        return renderFormattedText(block);
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans flex flex-col antialiased">
      
      {/* Upper Navigation Banner */}
      <header className="border-b border-slate-200 bg-white shadow-xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent group-hover:opacity-100 transition-opacity" />
              <Cpu className="h-5 w-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold tracking-tight text-slate-900 text-lg">n8n Workflow Copilot</h1>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-ping" />
                  Companion Active
                </span>
              </div>
              <p className="text-xs text-slate-500">Guide, configure, and debug n8n flows without building from scratch</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFloatingCompanion(prev => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                isFloatingCompanion 
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' 
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-3xs'
              }`}
              title="Transform app into a floating overlay window with optional ambient dimmer"
            >
              <Tv className="h-3.5 w-3.5" />
              {isFloatingCompanion ? "Standard Layout" : "Floating Companion"}
            </button>

            <div className="h-6 w-[1px] bg-slate-200" />

            <button
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/80 rounded-lg border border-slate-200 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Load Sample AI Flow
            </button>
            <div className="h-6 w-[1px] bg-slate-200 hidden sm:block" />
            <span className="text-[11px] font-mono text-slate-400 bg-slate-50 border border-slate-100 rounded px-2 py-1 hidden sm:block">
              v1.2.0-floating
            </span>
          </div>
        </div>
      </header>

      {isFloatingCompanion ? (
        <div className="flex-1 relative min-h-[680px] overflow-hidden bg-slate-900 flex flex-col">
          {/* Simulated n8n Desktop App Workspace Grid */}
          <div className="absolute inset-0 flex select-none pointer-events-auto">
            {/* Left Rail */}
            <div className="w-16 bg-[#101524] border-r border-[#1e293b] flex flex-col items-center py-4 gap-6 shrink-0 z-10">
              <div className="h-9 w-9 rounded-lg bg-orange-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-orange-600/20">
                n
              </div>
              <div className="flex-1 flex flex-col gap-4 w-full px-2">
                <div className="h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 cursor-pointer" title="Workflows">
                  <Layers className="h-4 w-4" />
                </div>
                <div className="h-10 rounded-xl hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer" title="Credentials">
                  <Key className="h-4 w-4" />
                </div>
                <div className="h-10 rounded-xl hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer" title="Executions">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">
                U
              </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 bg-[#141b2e] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] relative overflow-hidden flex flex-col">
              {/* Canvas Header */}
              <div className="h-14 border-b border-[#1e293b] bg-[#111827]/80 backdrop-blur-sm px-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-200">Lead Generation Sync & Enrichment</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Execution Paused
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">PC Localhost:5678</span>
                </div>
              </div>

              {/* Node Graph simulator */}
              <div className="flex-1 relative flex items-center justify-center p-8">
                {/* Simulated Nodes List */}
                <div className="relative w-full max-w-2xl h-[320px] flex flex-col justify-between z-10">
                  {/* SVG connection lines inside relative container for perfect stability */}
                  <svg className="absolute inset-0 h-full w-full pointer-events-none z-0">
                    {/* Webhook -> OpenAI */}
                    <path 
                      d="M 176,50 C 280,50 376,50 480,50" 
                      stroke={isAssistantActive && (selectedNode?.name === "Inbound Webhook" || selectedNode?.name === "Webhook Inbound Trigger") ? "#34d399" : "#475569"} 
                      strokeWidth={isAssistantActive && (selectedNode?.name === "Inbound Webhook" || selectedNode?.name === "Webhook Inbound Trigger") ? "3.5" : "2.5"} 
                      fill="none" 
                      strokeDasharray={isAssistantActive && (selectedNode?.name === "Inbound Webhook" || selectedNode?.name === "Webhook Inbound Trigger") ? "6,4" : "5,5"} 
                      className={isAssistantActive && (selectedNode?.name === "Inbound Webhook" || selectedNode?.name === "Webhook Inbound Trigger") ? "animate-flow" : "animate-pulse"} 
                    />
                    {/* OpenAI -> Slack */}
                    <path 
                      d="M 672,50 C 740,50 420,270 496,270" 
                      stroke={isAssistantActive && (selectedNode?.name === "OpenAI Enrichment Agent" || selectedNode?.name === "OpenAI enrichment") ? "#6366f1" : "#334155"} 
                      strokeWidth={isAssistantActive && (selectedNode?.name === "OpenAI Enrichment Agent" || selectedNode?.name === "OpenAI enrichment") ? "3.5" : "2"} 
                      fill="none" 
                      strokeDasharray={isAssistantActive && (selectedNode?.name === "OpenAI Enrichment Agent" || selectedNode?.name === "OpenAI enrichment") ? "6,4" : "none"}
                      className={isAssistantActive && (selectedNode?.name === "OpenAI Enrichment Agent" || selectedNode?.name === "OpenAI enrichment") ? "animate-flow" : ""}
                    />
                    {/* Error Trigger -> Slack or AI */}
                    <path 
                      d="M 176,270 C 280,270 392,270 496,270" 
                      stroke={isAssistantActive && selectedNode?.name === "Error Trigger" ? "#34d399" : "#334155"} 
                      strokeWidth={isAssistantActive && selectedNode?.name === "Error Trigger" ? "3.5" : "2"} 
                      fill="none" 
                      strokeDasharray={isAssistantActive && selectedNode?.name === "Error Trigger" ? "6,4" : "5,5"}
                      className={isAssistantActive && selectedNode?.name === "Error Trigger" ? "animate-flow" : ""}
                    />
                  </svg>

                  <div className="flex justify-between items-center z-10">
                    {/* Node 1: Webhook */}
                    <div 
                      onClick={() => {
                        setSelectedNode({
                          name: "Inbound Webhook",
                          type: "n8n-nodes-base.webhook",
                          description: "Listens for inbound HTTP requests/webhooks (from Stripe, HubSpot, GitHub, etc.) to trigger your workflow execution instantly.",
                          credentialsNeeded: "None"
                        });
                      }}
                      className={`w-44 bg-[#1e293b] border rounded-xl p-3.5 shadow-xl transition-all cursor-pointer relative group ${
                        selectedNode?.name === "Inbound Webhook" || selectedNode?.name === "Webhook Inbound Trigger"
                          ? "border-emerald-500 ring-2 ring-emerald-500/50 shadow-emerald-500/10 scale-[1.02]" 
                          : "border-slate-700 hover:border-slate-500 hover:scale-[1.01]"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-left">
                        <div className="h-8 w-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                          <Tv className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Trigger</span>
                          <span className="text-xs font-bold text-white">Inbound Webhook</span>
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[9px] text-emerald-400 font-bold">Listening on :5678</span>
                      </div>

                      {/* Webhook Output Port */}
                      <div className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border border-slate-600 bg-slate-800 flex items-center justify-center transition-all z-20 group-hover:scale-110 ${
                        isAssistantActive && (selectedNode?.name === "Inbound Webhook" || selectedNode?.name === "Webhook Inbound Trigger")
                          ? "ring-4 ring-emerald-500/80 bg-emerald-400 border-white scale-125 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                          : "hover:bg-slate-400"
                      }`}
                      title="Main Output Handle"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        {isAssistantActive && (selectedNode?.name === "Inbound Webhook" || selectedNode?.name === "Webhook Inbound Trigger") && (
                          <span className="absolute left-6 whitespace-nowrap bg-emerald-600 text-white font-mono font-bold text-[8px] px-1.5 py-0.5 rounded shadow-lg animate-bounce uppercase tracking-wider">
                            👉 Connect from here
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Node 2: OpenAI Enrichment */}
                    <div 
                      onClick={() => {
                        const openAiNode: NodeFound = {
                          name: "OpenAI Enrichment Agent",
                          type: "n8n-nodes-base.openAi",
                          description: "Queries GPT-4o-mini to categorize and clean raw incoming lead data payloads. Throws a 401 response code if the API Key is invalid or empty.",
                          credentialsNeeded: "OpenAI API Key (sk-proj-...)"
                        };
                        setSelectedNode(openAiNode);
                      }}
                      className={`w-48 bg-[#1e293b] border-2 rounded-xl p-3.5 shadow-2xl transition-all cursor-pointer relative group ${
                        selectedNode?.name === "OpenAI Enrichment Agent" || selectedNode?.name === "OpenAI enrichment"
                          ? "border-indigo-500 ring-2 ring-indigo-500/50 shadow-indigo-500/10 scale-[1.02]" 
                          : "border-rose-500/70 hover:border-rose-400 hover:scale-[1.01]"
                      }`}
                    >
                      <div className="absolute -top-2.5 -right-2 bg-rose-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-bounce">
                        ERROR 401
                      </div>
                      <div className="flex items-center gap-2 text-left">
                        <div className="h-8 w-8 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                          <Cpu className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <span className="text-[10px] text-rose-400 block font-bold uppercase tracking-wider">AI Agent</span>
                          <span className="text-xs font-bold text-white">OpenAI enrichment</span>
                        </div>
                      </div>
                      <p className="text-[9px] text-rose-300 mt-2 font-mono leading-normal bg-rose-950/40 p-1.5 rounded border border-rose-900/30 text-left">
                        Missing or invalid OpenAI API Key. Click to resolve!
                      </p>

                      {/* OpenAI Input Port */}
                      <div className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border border-slate-600 bg-slate-800 flex items-center justify-center transition-all z-20 group-hover:scale-110 ${
                        isAssistantActive && (selectedNode?.name === "Inbound Webhook" || selectedNode?.name === "Webhook Inbound Trigger")
                          ? "ring-4 ring-indigo-500/80 bg-indigo-400 border-white scale-125 animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.8)]"
                          : "hover:bg-slate-400"
                      }`}
                      title="Input Handle"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        {isAssistantActive && (selectedNode?.name === "Inbound Webhook" || selectedNode?.name === "Webhook Inbound Trigger") && (
                          <span className="absolute right-6 whitespace-nowrap bg-indigo-600 text-white font-mono font-bold text-[8px] px-1.5 py-0.5 rounded shadow-lg animate-bounce uppercase tracking-wider">
                            🎯 Target Input
                          </span>
                        )}
                      </div>

                      {/* OpenAI Output Port */}
                      <div className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border border-slate-600 bg-slate-800 flex items-center justify-center transition-all z-20 group-hover:scale-110 ${
                        isAssistantActive && (selectedNode?.name === "OpenAI Enrichment Agent" || selectedNode?.name === "OpenAI enrichment")
                          ? "ring-4 ring-emerald-500/80 bg-emerald-400 border-white scale-125 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                          : "hover:bg-slate-400"
                      }`}
                      title="Main Output Handle"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        {isAssistantActive && (selectedNode?.name === "OpenAI Enrichment Agent" || selectedNode?.name === "OpenAI enrichment") && (
                          <span className="absolute left-6 whitespace-nowrap bg-emerald-600 text-white font-mono font-bold text-[8px] px-1.5 py-0.5 rounded shadow-lg animate-bounce uppercase tracking-wider">
                            👉 Connect from here
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center z-10">
                    {/* Node 3: Error Trigger */}
                    <div 
                      onClick={() => {
                        setSelectedNode({
                          name: "Error Trigger",
                          type: "n8n-nodes-base.errorTrigger",
                          description: "Fires automatically when any node in the active workflow fails, capturing the full error context, node name, and stack trace to allow automated recovery.",
                          credentialsNeeded: "None"
                        });
                      }}
                      className={`w-44 bg-[#1e293b] border rounded-xl p-3.5 shadow-xl transition-all cursor-pointer relative group ${
                        selectedNode?.name === "Error Trigger"
                          ? "border-emerald-500 ring-2 ring-emerald-500/50 shadow-emerald-500/10 scale-[1.02]" 
                          : "border-slate-700 hover:border-slate-500 hover:scale-[1.01]"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-left">
                        <div className="h-8 w-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                          <Zap className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Advanced</span>
                          <span className="text-xs font-bold text-white">Error Trigger</span>
                        </div>
                      </div>
                      <div className="mt-2 text-left">
                        <span className="text-[9px] text-slate-400 block font-medium">Bypasses crash to run recovery flow</span>
                      </div>

                      {/* Error Trigger Output Port */}
                      <div className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border border-slate-600 bg-slate-800 flex items-center justify-center transition-all z-20 group-hover:scale-110 ${
                        isAssistantActive && selectedNode?.name === "Error Trigger"
                          ? "ring-4 ring-emerald-500/80 bg-emerald-400 border-white scale-125 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                          : "hover:bg-slate-400"
                      }`}
                      title="Main Output Handle"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        {isAssistantActive && selectedNode?.name === "Error Trigger" && (
                          <span className="absolute left-6 whitespace-nowrap bg-emerald-600 text-white font-mono font-bold text-[8px] px-1.5 py-0.5 rounded shadow-lg animate-bounce uppercase tracking-wider">
                            👉 Connect from here
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Node 4: Slack Notification */}
                    <div 
                      onClick={() => {
                        setSelectedNode({
                          name: "Slack Notify",
                          type: "n8n-nodes-base.slack",
                          description: "Sends customized alerts, rich markdown blocks, or status updates to a specific Slack channel or user.",
                          credentialsNeeded: "Slack OAuth Credentials"
                        });
                      }}
                      className={`w-44 bg-[#1e293b] border rounded-xl p-3.5 shadow-xl transition-all cursor-pointer relative group ${
                        selectedNode?.name === "Slack Notify"
                          ? "border-indigo-500 ring-2 ring-indigo-500/50 shadow-indigo-500/10 scale-[1.02] opacity-100" 
                          : "border-slate-700 hover:border-slate-500 hover:scale-[1.01] opacity-75 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-left">
                        <div className="h-8 w-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                          <Layers className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Action</span>
                          <span className="text-xs font-bold text-white">Slack Notify</span>
                        </div>
                      </div>
                      <div className="mt-2 text-left">
                        <span className="text-[9px] text-slate-400 block font-medium">Post rich alerts & status channels</span>
                      </div>

                      {/* Slack Input Port */}
                      <div className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border border-slate-600 bg-slate-800 flex items-center justify-center transition-all z-20 group-hover:scale-110 ${
                        isAssistantActive && (selectedNode?.name === "OpenAI Enrichment Agent" || selectedNode?.name === "OpenAI enrichment" || selectedNode?.name === "Error Trigger")
                          ? "ring-4 ring-indigo-500/80 bg-indigo-400 border-white scale-125 animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.8)]"
                          : "hover:bg-slate-400"
                      }`}
                      title="Input Handle"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        {isAssistantActive && (selectedNode?.name === "OpenAI Enrichment Agent" || selectedNode?.name === "OpenAI enrichment" || selectedNode?.name === "Error Trigger") && (
                          <span className="absolute right-6 whitespace-nowrap bg-indigo-600 text-white font-mono font-bold text-[8px] px-1.5 py-0.5 rounded shadow-lg animate-bounce uppercase tracking-wider">
                            🎯 Target Input
                          </span>
                        )}
                      </div>

                      {/* Slack Output Port */}
                      <div className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border border-slate-600 bg-slate-800 flex items-center justify-center transition-all z-20 group-hover:scale-110 ${
                        isAssistantActive && selectedNode?.name === "Slack Notify"
                          ? "ring-4 ring-emerald-500/80 bg-emerald-400 border-white scale-125 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                          : "hover:bg-slate-400"
                      }`}
                      title="Main Output Handle"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        {isAssistantActive && selectedNode?.name === "Slack Notify" && (
                          <span className="absolute left-6 whitespace-nowrap bg-emerald-600 text-white font-mono font-bold text-[8px] px-1.5 py-0.5 rounded shadow-lg animate-bounce uppercase tracking-wider">
                            👉 Connect from here
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating helper guide overlay */}
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-[#1b253b] border border-[#2e3c5a] rounded-xl px-4 py-2.5 shadow-xl text-center flex items-center gap-2 z-10 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span className="text-[10px] text-slate-200 font-semibold font-mono">
                    Live screen guiding active. Toggle 'Standard Layout' at the top to configure custom JSON!
                  </span>
                </div>

                {/* Float-card overlay for selected node on canvas */}
                <AnimatePresence>
                  {selectedNode && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="absolute bottom-4 left-4 right-4 bg-[#111827]/95 text-slate-100 rounded-xl p-4 shadow-2xl border border-slate-800 backdrop-blur-md z-25 flex flex-col gap-3 text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0">
                            <Key className="h-4 w-4 text-emerald-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white">{selectedNode.name}</h4>
                              <span className="text-[9px] bg-slate-800 border border-slate-700 text-slate-300 font-mono px-1.5 py-0.5 rounded">
                                {selectedNode.type}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-300 mt-1">
                              {selectedNode.description}
                            </p>
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            setSelectedNode(null);
                            setIsAssistantActive(false);
                          }}
                          className="text-slate-400 hover:text-white p-1 hover:bg-slate-850 rounded cursor-pointer shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Launch assistant buttons & suggestions in canvas view */}
                      <div className="border-t border-slate-800 pt-2 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                            Smart Connection Assistant
                          </span>
                          
                          <button
                            type="button"
                            onClick={() => setIsAssistantActive(prev => !prev)}
                            className={`text-[9px] font-extrabold px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                              isAssistantActive
                                ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600 shadow-sm'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-sm animate-pulse shadow-indigo-500/20'
                            }`}
                          >
                            <Sparkles className="h-3 w-3" />
                            {isAssistantActive ? "Close Assistant" : "Suggest Next Connection"}
                          </button>
                        </div>

                        {isAssistantActive && (
                          <div className="p-2.5 bg-slate-950/80 rounded-lg border border-indigo-500/40 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="flex items-start gap-2">
                              <Compass className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                              <p className="text-[10px] text-slate-200 leading-normal">
                                <span className="font-bold text-slate-400">Next Node Suggestion:</span> <span className="text-emerald-400 font-bold font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">{getConnectionSuggestion(selectedNode.name).suggestedNodeName}</span>. {getConnectionSuggestion(selectedNode.name).reason}
                              </p>
                            </div>

                            <div className="flex items-center justify-between bg-slate-900/50 px-2 py-1.5 rounded border border-slate-800 text-[9px] font-mono">
                              <span className="text-slate-400 flex items-center gap-1">
                                <GitCommit className="h-3 w-3 text-indigo-400 animate-pulse" />
                                Output Port:
                              </span>
                              <span className="text-emerald-400 font-bold">
                                {getConnectionSuggestion(selectedNode.name).outputPort}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Ambient Dark Dimmer Overlay Mask */}
          {isDimmedOverlay && (
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[1px] transition-all duration-300 z-20 pointer-events-none" />
          )}

          {/* DRAGGABLE/FLOATING COMPANION WIDGET */}
          {isMinimized ? (
            /* Minimized small pill button */
            <div 
              onClick={() => {
                setIsMinimized(false);
                localStorage.setItem('n8n_is_minimized', 'false');
              }}
              className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-slate-900 hover:bg-slate-850 border-2 border-indigo-500 shadow-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 group z-40 animate-bounce"
              title="Click to restore n8n Workflow Copilot Companion"
            >
              <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-ping" />
              <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
              <Cpu className="h-6 w-6 text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span className="text-[8px] font-bold text-white mt-0.5 tracking-wider uppercase font-mono">active</span>
            </div>
          ) : (
            /* Expanded Full Floating Widget Overlay */
            <div className="fixed bottom-6 right-6 w-[430px] max-w-[calc(100vw-48px)] h-[640px] max-h-[calc(100vh-140px)] bg-white border border-slate-200/90 shadow-2xl rounded-2xl flex flex-col overflow-hidden z-35 animate-in slide-in-from-bottom-5 duration-300">
              {/* Header */}
              <div className="bg-slate-900 text-white p-3.5 px-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                    <Cpu className="h-4 w-4 text-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold tracking-tight">n8n Copilot Companion</h4>
                    <span className="inline-flex items-center text-[9px] text-emerald-400 font-mono">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1 animate-ping" />
                      Live Stream Active
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => {
                      setIsMinimized(true);
                      localStorage.setItem('n8n_is_minimized', 'true');
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title="Minimize companion"
                  >
                    <Minimize2 className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => {
                      setIsFloatingCompanion(false);
                      localStorage.setItem('n8n_is_floating_companion', 'false');
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title="Exit Floating Mode"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* High Density Tabs selector for overlay */}
              <div className="flex border-b border-slate-100 bg-slate-50 p-1 gap-0.5 shrink-0 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setActiveTab('capture')}
                  className={`flex-1 min-w-[70px] py-1.5 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    activeTab === 'capture' ? 'bg-white text-slate-950 shadow-3xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Eye className="h-3 w-3" />
                  Stream
                </button>
                <button
                  onClick={() => setActiveTab('native')}
                  className={`flex-1 min-w-[75px] py-1.5 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    activeTab === 'native' ? 'bg-white text-slate-950 shadow-3xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Zap className="h-3 w-3 text-amber-500" />
                  Heal
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`flex-1 min-w-[70px] py-1.5 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    activeTab === 'json' ? 'bg-white text-slate-950 shadow-3xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileCode className="h-3 w-3" />
                  JSON
                </button>
                <button
                  onClick={() => setActiveTab('memory')}
                  className={`flex-1 min-w-[75px] py-1.5 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    activeTab === 'memory' ? 'bg-white text-slate-950 shadow-3xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Brain className="h-3 w-3 text-emerald-500" />
                  Memory
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 min-w-[70px] py-1.5 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    activeTab === 'settings' ? 'bg-white text-slate-950 shadow-3xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Settings className="h-3 w-3" />
                  Keys
                </button>
              </div>

              {/* Scrollable multi-panels representation inside compact companion popup */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50/40">
                {/* Render the selected Tab's content block inside the widget! */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-3xs p-3.5 flex flex-col">
                  {activeTab === 'capture' && (
                    /* Embedded high density screen/file capture */
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Live Canvas Input</span>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.2 rounded font-mono">Capture Mode</span>
                      </div>
                      
                      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-3 text-center flex flex-col items-center justify-center min-h-[140px] relative">
                        {screenshot ? (
                          <div className="relative w-full flex items-center justify-center">
                            <img src={screenshot} alt="Captured Screen" className="max-h-[120px] rounded-lg border object-contain bg-white shadow-3xs" />
                            <button onClick={() => setScreenshot(null)} className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-xs cursor-pointer">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                            <Eye className="h-6 w-6 text-slate-300 animate-pulse mb-1" />
                            <p className="text-[10px] font-semibold text-slate-500">Workspace Stream Standby</p>
                            <p className="text-[9px] text-slate-400 max-w-[180px] mt-0.5">Connect stream in settings or drag & drop a workspace image here.</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            if (isLiveGuidingActive) stopLiveGuiding();
                            else startLiveGuiding();
                          }}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                            isLiveGuidingActive 
                              ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" 
                              : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                          }`}
                        >
                          <Tv className="h-3 w-3 shrink-0" />
                          {isLiveGuidingActive ? "Disconnect Stream" : "Connect Stream"}
                        </button>
                        <button
                          onClick={() => {
                            setWorkflowJson(JSON.stringify(SAMPLE_N8N_WORKFLOW, null, 2));
                            setLogsInput("");
                            setInsights([]);
                            setNodesFound([
                              { name: "Inbound Lead Webhook", type: "n8n-nodes-base.webhook", description: "Listens for raw payloads." },
                              { name: "Verify Gmail Address", type: "n8n-nodes-base.if", description: "Checks client email domain." },
                              { name: "Enrich Lead AI", type: "n8n-nodes-base.openAi", description: "GPT enrichment." }
                            ]);
                            setChecklist([
                              { id: "1", nodeName: "Enrich Lead AI", label: "Configure API Key", detail: "Supply SK inside Settings", completed: false },
                              { id: "2", nodeName: "Verify Gmail Address", label: "Syntax conversion", detail: "Fix curly braces in JSON", completed: false }
                            ]);
                          }}
                          className="py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 cursor-pointer"
                        >
                          <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                          Load Sample Flow
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'native' && (
                    /* Embedded Self Heal options */
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Self-Heal recovery blueprint</span>
                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.2 rounded font-mono">Blueprint</span>
                      </div>
                      
                      <p className="text-[10px] text-slate-500 leading-normal text-left">
                        We pre-built an **Error Trigger Recovery workflow** for your n8n canvas. Insert this block to auto-reroute errors directly to this copilot's debugging endpoint!
                      </p>

                      <div className="bg-slate-900 text-slate-100 p-2 rounded-lg border border-slate-800 text-left relative font-mono text-[9px] max-h-[110px] overflow-y-auto">
                        <button onClick={handleCopyBlueprint} className="absolute top-2 right-2 p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded border border-slate-700 cursor-pointer">
                          {isCopiedBlueprint ? <Check className="h-3 w-3 text-emerald-400" /> : <Clipboard className="h-3 w-3" />}
                        </button>
                        <pre>{N8N_ERROR_TRIGGER_BLUEPRINT.substring(0, 150)}...</pre>
                      </div>

                      <button onClick={handleCopyBlueprint} className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 text-white font-bold text-[10px] rounded-lg cursor-pointer">
                        {isCopiedBlueprint ? "Blueprint JSON copied!" : "Copy complete n8n blueprint"}
                      </button>
                    </div>
                  )}

                  {activeTab === 'json' && (
                    /* Compact JSON input */
                    <div className="flex flex-col gap-2.5 text-left">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Paste Workflow JSON</label>
                        <textarea
                          rows={3}
                          value={workflowJson}
                          onChange={(e) => setWorkflowJson(e.target.value)}
                          placeholder="Paste n8n JSON nodes tree here..."
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono outline-none focus:ring-1 focus:ring-slate-950"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Paste Execution Error Logs</label>
                        <textarea
                          rows={2}
                          value={logsInput}
                          onChange={(e) => setLogsInput(e.target.value)}
                          placeholder="Paste console or n8n error log trace..."
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono outline-none focus:ring-1 focus:ring-slate-950"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'memory' && (
                    /* Compact memory logs */
                    <div className="flex flex-col gap-2 text-left">
                      <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-950">Workspace Memory</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                          {localTrainingData.length} rules
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 leading-normal">
                        Your custom rules are appended securely to the troubleshooting prompt.
                      </p>
                      
                      <div className="max-h-[140px] overflow-y-auto flex flex-col gap-1.5 mt-1 pr-1">
                        {localTrainingData.map((rule) => (
                          <div key={rule.id} className="p-2 bg-slate-50 border rounded-lg flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold text-slate-800 block truncate">{rule.title}</span>
                              <span className="text-[8px] text-slate-400 uppercase font-mono">{rule.category}</span>
                            </div>
                            <button onClick={() => setLocalTrainingData(prev => prev.filter(r => r.id !== rule.id))} className="text-slate-400 hover:text-rose-600 shrink-0 cursor-pointer">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'settings' && (
                    /* Compact Settings inside overlay */
                    <div className="flex flex-col gap-3 text-left">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Model Engine</label>
                        <select
                          value={preferredModel}
                          onChange={(e) => setPreferredModel(e.target.value as 'gemini' | 'openai' | 'claude')}
                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] outline-none font-semibold"
                        >
                          <option value="gemini">Gemini 3.5 Flash</option>
                          <option value="openai">OpenAI GPT-4o-mini</option>
                          <option value="claude">Anthropic Claude 3.5</option>
                        </select>
                      </div>

                      {preferredModel !== 'gemini' && (
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                            {preferredModel === 'openai' ? "OpenAI API Key" : "Claude API Key"}
                          </label>
                          <input
                            type="password"
                            value={preferredModel === 'openai' ? openaiApiKey : claudeApiKey}
                            onChange={(e) => preferredModel === 'openai' ? setOpenaiApiKey(e.target.value) : setClaudeApiKey(e.target.value)}
                            placeholder="sk-..."
                            className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono outline-none"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-slate-150 pt-2">
                        <span className="text-[10px] font-bold text-slate-600">Ambient Dimmer Overlay</span>
                        <input
                          type="checkbox"
                          checked={isDimmedOverlay}
                          onChange={(e) => setIsDimmedOverlay(e.target.checked)}
                          className="h-3.5 w-3.5 rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Checklist & Chat Combined representation in tight viewport */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-3xs flex flex-col overflow-hidden min-h-[220px]">
                  <div className="border-b border-slate-100 p-2.5 bg-slate-50 flex items-center justify-between shrink-0">
                    <span className="text-[10px] font-bold text-slate-800 flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5 text-slate-600" />
                      Advisor Feed & Action Steps
                    </span>
                    {checklist.length > 0 && (
                      <span className="text-[9px] bg-slate-200 font-bold px-1.5 py-0.2 rounded text-slate-700">
                        {checklist.filter(c => c.completed).length}/{checklist.length} Done
                      </span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[160px] scrollbar-thin text-left bg-white">
                    {/* Compact Checklist if pending */}
                    {checklist.length > 0 && checklist.filter(c => !c.completed).length > 0 && (
                      <div className="pb-2 border-b border-slate-100 mb-2 space-y-2">
                        <span className="text-[9px] font-bold text-indigo-600 uppercase block mb-1">Pending actions:</span>
                        {checklist.filter(c => !c.completed).map((item) => (
                          <div key={item.id} className="p-2 bg-indigo-50/50 border border-indigo-100 rounded-lg flex items-start gap-1.5">
                            <button onClick={() => toggleChecklistItem(item.id)} className="mt-0.5 h-3.5 w-3.5 rounded border border-indigo-300 bg-white flex items-center justify-center shrink-0 cursor-pointer">
                              <Check className="h-2 w-2 text-indigo-600 opacity-0 hover:opacity-100" />
                            </button>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-slate-900 leading-tight">{item.label}</p>
                              <p className="text-[9px] text-slate-500 font-mono">{item.nodeName}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Chat messages */}
                    {chatHistory.map((msg) => (
                      <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-2.5 rounded-xl text-[10px] leading-relaxed text-left max-w-[95%] ${
                          msg.sender === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none border shadow-3xs'
                        }`}>
                          {renderFullMarkdown(msg.text)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* High density bottom prompt box */}
                  <div className="border-t border-slate-150 p-2 bg-slate-50 flex gap-1.5 shrink-0">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask copilot to verify or fix..."
                      className="flex-1 px-2.5 py-1.5 text-[10px] border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400 bg-white leading-normal"
                    />
                    <button
                      onClick={() => analyzeWorkflow()}
                      disabled={isAnalyzing || !userInput.trim()}
                      className="h-7 px-3 bg-slate-950 text-white font-bold text-[10px] rounded-lg hover:bg-slate-850 shrink-0 cursor-pointer flex items-center justify-center"
                    >
                      {isAnalyzing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sticky bottom analysis action in compact companion */}
              <div className="p-3 border-t border-slate-150 bg-slate-50 flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => analyzeWorkflow()}
                  disabled={isAnalyzing || (!workflowJson && !screenshot && !logsInput)}
                  className={`w-full py-2.5 rounded-lg font-bold text-[10px] shadow-xs transition-all flex items-center justify-center gap-1.5 ${
                    isAnalyzing 
                      ? 'bg-slate-300 text-slate-600 cursor-not-allowed animate-pulse'
                      : (!workflowJson && !screenshot && !logsInput)
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer hover:shadow-md'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Analyzing canvas...
                    </>
                  ) : (
                    <>
                      <Activity className="h-3 w-3" />
                      Run Full Workspace Diagnosis
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side Panel: Context Capture & Direct Inputs */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
            
            {/* Tabs Selector */}
            <div className="flex flex-wrap border-b border-slate-100 bg-slate-50/50 p-1 gap-0.5">
              <button
                onClick={() => setActiveTab('capture')}
                className={`flex-1 min-w-[90px] py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'capture'
                    ? 'bg-white text-slate-950 shadow-xs border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Eye className="h-3 w-3" />
                Capture
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`flex-1 min-w-[95px] py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'json'
                    ? 'bg-white text-slate-950 shadow-xs border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileCode className="h-3 w-3" />
                JSON & Logs
              </button>
              <button
                onClick={() => setActiveTab('native')}
                className={`flex-1 min-w-[95px] py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'native'
                    ? 'bg-white text-slate-950 shadow-xs border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Zap className="h-3 w-3 text-amber-500" />
                Self-Heal
              </button>
              <button
                onClick={() => setActiveTab('academy')}
                className={`flex-1 min-w-[100px] py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'academy'
                    ? 'bg-white text-slate-950 shadow-xs border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                <BookOpen className="h-3 w-3 text-indigo-500 animate-pulse" />
                Solver Academy
              </button>
              <button
                onClick={() => setActiveTab('memory')}
                className={`flex-1 min-w-[100px] py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'memory'
                    ? 'bg-white text-slate-950 shadow-xs border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                <Brain className="h-3 w-3 text-emerald-500" />
                Local Memory ({localTrainingData.length})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 min-w-[90px] py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-white text-slate-950 shadow-xs border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                <Settings className="h-3 w-3 text-slate-500" />
                Settings
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5 flex-1 min-h-[360px] flex flex-col">
              
              {/* Tab 1: Live Capture / Drop Image */}
              {activeTab === 'capture' && (
                <div className="flex-1 flex flex-col gap-4">
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center flex flex-col items-center justify-center min-h-[220px] relative transition-all"
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                  >
                    {screenshot ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img 
                           src={screenshot} 
                          alt="Captured n8n Screen" 
                          className="max-h-[220px] rounded-lg object-contain shadow-md border border-slate-200" 
                        />
                        <button 
                          onClick={() => setScreenshot(null)}
                          className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1 shadow-md hover:bg-slate-800 transition"
                          title="Remove snapshot"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2.5">
                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shadow-inner">
                          <Eye className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">No Screen Active</p>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-[280px]">
                            Share your laptop screen to capture your n8n workflow window, or drop a screenshot of the canvas here!
                          </p>
                        </div>
                      </div>
                    )}
                    {dragActive && (
                      <div className="absolute inset-0 bg-slate-900/10 border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center backdrop-blur-xs">
                        <span className="text-xs font-bold text-slate-800">Drop your file here!</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={startScreenCapture}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md cursor-pointer transition-all active:scale-98"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Capture n8n Window
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs cursor-pointer transition-all"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload Screenshot
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageFile(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                  
                  <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3.5 mt-2">
                    <div className="flex gap-2">
                      <HelpCircle className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                      <div className="text-[11px] text-slate-600 leading-relaxed">
                        <span className="font-semibold text-slate-800">How visual analysis helps:</span> Share your n8n browser tab or desktop. Once captured, our companion parses the visual node lines, execution indicators, status lights, or error warning bubbles automatically!
                      </div>
                    </div>
                  </div>

                  {/* Webhook URL Inspector & Parameter Matcher */}
                  <div className="mt-2">
                    <WebhookInspector 
                      isStreamActive={isLiveGuidingActive} 
                      onApplyPresetSolution={handleApplyPresetSolution} 
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Workflow JSON / Code & Execution Logs */}
              {activeTab === 'json' && (
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex-1 flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Workflow JSON (Paste code)</span>
                      {workflowJson && (
                        <button onClick={() => setWorkflowJson('')} className="text-slate-400 hover:text-slate-600 font-mono text-[10px]">
                          Clear
                        </button>
                      )}
                    </label>
                    <textarea
                      value={workflowJson}
                      onChange={(e) => setWorkflowJson(e.target.value)}
                      placeholder="Paste your exported n8n workflow JSON here..."
                      className="flex-1 w-full p-3 text-xs font-mono bg-slate-900 text-slate-200 rounded-xl border border-slate-800 focus:outline-hidden focus:border-slate-700 min-h-[140px] resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Execution Logs / Error Message</span>
                      {logsInput && (
                        <button onClick={() => setLogsInput('')} className="text-slate-400 hover:text-slate-600 font-mono text-[10px]">
                          Clear
                        </button>
                      )}
                    </label>
                    <textarea
                      value={logsInput}
                      onChange={(e) => setLogsInput(e.target.value)}
                      placeholder="Paste details of what failed, console outputs, database errors, or API logs here..."
                      className="w-full p-3 text-xs font-mono bg-slate-550 border border-slate-200 rounded-xl focus:outline-hidden focus:border-slate-400 min-h-[90px] resize-none text-slate-700 bg-slate-50"
                    />
                  </div>
                </div>
              )}

              {/* Tab 3: Native n8n Self-Healing Node Instruction */}
              {activeTab === 'native' && (
                <div className="flex-1 flex flex-col gap-4">
                  <div className="rounded-xl bg-amber-50/75 border border-amber-200 p-3.5 flex gap-3">
                    <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">Run Automated Diagnostics</h4>
                      <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                        Instead of manual troubleshooting, you can embed diagnostic agents directly in n8n. Below is a copyable node setup representing an <strong>Error Trigger Node</strong> coupled directly with an <strong>AI Agent Node</strong> for self-debugging.
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Self-Heal Node Blueprint JSON</span>
                      <button
                        onClick={handleCopyBlueprint}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md cursor-pointer transition-all"
                      >
                        {isCopiedBlueprint ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Clipboard className="h-3 w-3" />
                            Copy Node Code
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="flex-1 w-full p-3 bg-slate-900 text-slate-300 font-mono text-[10px] rounded-xl border border-slate-800 overflow-y-auto max-h-[160px] leading-relaxed shadow-inner">
                      {N8N_ERROR_TRIGGER_BLUEPRINT}
                    </pre>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-150 rounded-lg p-3">
                    <span className="font-semibold text-slate-700 block mb-1">How to deploy native debugging:</span>
                    1. Copy the JSON code above.<br />
                    2. Open your n8n workspace in a new tab.<br />
                    3. Press <kbd className="px-1 py-0.5 bg-slate-200 rounded text-[10px] font-mono text-slate-600 shadow-xs">Ctrl + V</kbd> to paste the nodes directly onto your n8n canvas.<br />
                    4. When any workflow fails, the Error Trigger catches it, sends the full logs to the AI Agent, which diagnoses and heals!
                  </div>
                </div>
              )}

              {/* Tab 4: Troubleshooting & Problem Solving Academy */}
              {activeTab === 'academy' && (
                <div className="flex-1 flex flex-col gap-4">
                  {/* Academy Head / Stats */}
                  <div className="rounded-xl bg-indigo-50/70 border border-indigo-150 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-indigo-900">n8n Solver Academy</h4>
                        <p className="text-[10px] text-indigo-700">Train your problem solving abilities</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                        Score: {quizScore}/{QUIZ_QUESTIONS.length}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Quiz Module */}
                  <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl flex flex-col gap-3">
                    {currentQuizIndex < QUIZ_QUESTIONS.length ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                            Interactive Quiz: Question {currentQuizIndex + 1} of {QUIZ_QUESTIONS.length}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 leading-normal">
                          {QUIZ_QUESTIONS[currentQuizIndex].question}
                        </p>

                        <div className="flex flex-col gap-2 mt-1">
                          {QUIZ_QUESTIONS[currentQuizIndex].options.map((option, idx) => {
                            let optionStyle = "border-slate-200 bg-white hover:bg-slate-50 text-slate-700";
                            if (selectedOption === idx) {
                              optionStyle = "border-indigo-500 bg-indigo-50/40 text-indigo-950 font-semibold";
                            }
                            if (quizSubmitted) {
                              if (option.isCorrect) {
                                optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold";
                              } else if (selectedOption === idx) {
                                optionStyle = "border-rose-400 bg-rose-50 text-rose-950";
                              } else {
                                optionStyle = "border-slate-200 bg-slate-50 text-slate-400 opacity-60";
                              }
                            }

                            return (
                              <button
                                key={idx}
                                disabled={quizSubmitted}
                                onClick={() => setSelectedOption(idx)}
                                className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${optionStyle} ${
                                  !quizSubmitted ? "cursor-pointer" : ""
                                }`}
                              >
                                <span>{option.text}</span>
                                {quizSubmitted && option.isCorrect && (
                                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-2" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {quizSubmitted ? (
                          <div className="mt-2 flex flex-col gap-2">
                            <div className="p-3 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600 leading-relaxed shadow-3xs">
                              <span className="font-bold text-slate-800 block mb-0.5">💡 Educational takeaway:</span>
                              {QUIZ_QUESTIONS[currentQuizIndex].explanation}
                            </div>
                            <button
                              onClick={() => {
                                setSelectedOption(null);
                                setQuizSubmitted(false);
                                setCurrentQuizIndex(prev => prev + 1);
                              }}
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
                            >
                              Next Question
                            </button>
                          </div>
                        ) : (
                          <button
                            disabled={selectedOption === null}
                            onClick={() => {
                              setQuizSubmitted(true);
                              if (QUIZ_QUESTIONS[currentQuizIndex].options[selectedOption!].isCorrect) {
                                setQuizScore(prev => prev + 1);
                              }
                            }}
                            className={`w-full py-2 font-bold text-xs rounded-lg transition-all ${
                              selectedOption === null
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                            }`}
                          >
                            Submit Answer
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4 flex flex-col items-center justify-center gap-2">
                        <span className="text-4xl">🏆</span>
                        <h4 className="font-bold text-slate-900 text-xs">Academy Completed!</h4>
                        <p className="text-[10px] text-slate-500 max-w-[240px]">
                          Great job! You scored {quizScore} out of {QUIZ_QUESTIONS.length}. You've built robust troubleshooting logic for webhooks, custom code imports, loop aggregation, and item list parameters!
                        </p>
                        <button
                          onClick={() => {
                            setCurrentQuizIndex(0);
                            setQuizScore(0);
                            setSelectedOption(null);
                            setQuizSubmitted(false);
                          }}
                          className="mt-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 transition-all cursor-pointer"
                        >
                          Restart Quiz
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Preset Debugging Labs (Problem Solvers) */}
                  <div className="flex flex-col gap-2">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Hands-on Practice Labs (Load & Diagnose)
                    </h5>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <div 
                        onClick={() => {
                          setWorkflowJson(JSON.stringify({
                            "nodes": [
                              {
                                "parameters": {
                                  "path": "test-webhook"
                                },
                                "name": "Inbound Lead Webhook",
                                "type": "n8n-nodes-base.webhook",
                                "typeVersion": 1,
                                "position": [100, 250]
                              }
                            ]
                          }, null, 2));
                          setLogsInput(`[n8n Error - Connection Terminated]
Time: 10:45:01
Error Code: 404 Not Found
Message: No webhook listener active at URL: /webhook/test-webhook. 
Did you hit the Production URL without activating the workflow, or did you forget to click 'Listen for test event'?`);
                          setActiveTab('json');
                          setChatHistory(prev => [
                            ...prev,
                            {
                              id: `lab1-${Date.now()}`,
                              sender: 'assistant',
                              text: "🧪 **Lab Loaded: Webhook 404 Trigger Issue!**\n\nI have loaded a webhook node structure and a 404 listener error output. \n\nClick **Analyze Canvas & Context** to let the Copilot show you exactly why this happened and how to run a proper webhook test session in n8n!",
                              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            }
                          ]);
                        }}
                        className="p-3 bg-white border border-slate-150 rounded-xl hover:border-slate-350 hover:shadow-2xs transition-all cursor-pointer text-left flex items-start gap-2.5"
                      >
                        <span className="text-lg mt-0.5 shrink-0">🌐</span>
                        <div>
                          <span className="inline-block text-[9px] font-bold text-emerald-750 bg-emerald-50 px-1.5 py-0.2 rounded mb-1">
                            Easy
                          </span>
                          <h6 className="text-xs font-bold text-slate-800">Lab 1: Webhook 404 vs Listen State</h6>
                          <p className="text-[10px] text-slate-500 mt-0.5">Learn why your webhook calls fail or hang during manual n8n trigger testing.</p>
                        </div>
                      </div>

                      <div 
                        onClick={() => {
                          setWorkflowJson(JSON.stringify({
                            "nodes": [
                              {
                                "parameters": {
                                  "jsCode": "const lodash = require('lodash');\nreturn lodash.chunk($input.all(), 2);"
                                },
                                "name": "Custom Array Chunker",
                                "type": "n8n-nodes-base.code",
                                "typeVersion": 1,
                                "position": [250, 250]
                              }
                            ]
                          }, null, 2));
                          setLogsInput(`[n8n Code execution failed]
Node: Custom Array Chunker
Error: Cannot find module 'lodash'
    at Object.run (/usr/local/lib/node_modules/n8n/node_modules/@n8n/permissions/dist/index.js)
    at RunCustomScriptCode`);
                          setActiveTab('json');
                          setChatHistory(prev => [
                            ...prev,
                            {
                              id: `lab2-${Date.now()}`,
                              sender: 'assistant',
                              text: "🧪 **Lab Loaded: Code Node External Imports!**\n\nI have loaded a custom Code Node attempting to import 'lodash', failing with 'Cannot find module'.\n\nClick **Analyze Canvas & Context** to let the Copilot explain the Docker environment variables required to authorize custom libraries!",
                              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            }
                          ]);
                        }}
                        className="p-3 bg-white border border-slate-150 rounded-xl hover:border-slate-350 hover:shadow-2xs transition-all cursor-pointer text-left flex items-start gap-2.5"
                      >
                        <span className="text-lg mt-0.5 shrink-0">💻</span>
                        <div>
                          <span className="inline-block text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded mb-1">
                            Medium
                          </span>
                          <h6 className="text-xs font-bold text-slate-800">Lab 2: Code Node External Imports</h6>
                          <p className="text-[10px] text-slate-500 mt-0.5">Learn how to configure self-hosted n8n environment variables to enable npm libraries.</p>
                        </div>
                      </div>

                      <div 
                        onClick={() => {
                          setWorkflowJson(JSON.stringify({
                            "nodes": [
                              {
                                "parameters": {
                                  "conditions": {
                                    "string": [
                                      {
                                        "value1": "={{ $node[\"Fetch Customers\"].json[\"email\"] }}",
                                        "value2": "@gmail.com"
                                      }
                                    ]
                                  }
                                },
                                "name": "Verify Gmail Address",
                                "type": "n8n-nodes-base.if",
                                "typeVersion": 1,
                                "position": [380, 250]
                              }
                            ]
                          }, null, 2));
                          setLogsInput(`[n8n Expression Failed]
Node: Verify Gmail Address
Property: value1
Error: Cannot read property 'json' of undefined
Message: The node "Fetch Customers" does not exist or has no execution output data at the current item scope context.`);
                          setActiveTab('json');
                          setChatHistory(prev => [
                            ...prev,
                            {
                              id: `lab3-${Date.now()}`,
                              sender: 'assistant',
                              text: "🧪 **Lab Loaded: Variable Expression Failure!**\n\nI have loaded an IF node with faulty legacy variable references throwing 'Cannot read property json of undefined'.\n\nClick **Analyze Canvas & Context** to learn how to modernise syntax and resolve scope index errors!",
                              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            }
                          ]);
                        }}
                        className="p-3 bg-white border border-slate-150 rounded-xl hover:border-slate-350 hover:shadow-2xs transition-all cursor-pointer text-left flex items-start gap-2.5"
                      >
                        <span className="text-lg mt-0.5 shrink-0">🔍</span>
                        <div>
                          <span className="inline-block text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded mb-1">
                            Hard
                          </span>
                          <h6 className="text-xs font-bold text-slate-800">Lab 3: Variable Expression Syntax</h6>
                          <p className="text-[10px] text-slate-500 mt-0.5">Resolve 'Cannot read property' and modernise expression references to reference upstream data.</p>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              )}

              {/* Tab 5: Local Workspace Training & Memory Hub */}
              {activeTab === 'memory' && (
                <div className="flex-1 flex flex-col gap-4">
                  {/* Local memory stats & header */}
                  <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                        <Brain className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-950">Local Workspace Brain</h4>
                        <p className="text-[10px] text-emerald-700 font-medium">Trained on {localTrainingData.length} active memory rules</p>
                      </div>
                    </div>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Offline-First
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-normal bg-white p-2.5 rounded-lg border border-slate-150">
                    💡 **How this trains the AI**: Rules created here are automatically saved in your browser's secure `localStorage` and sent with your prompt. The Copilot uses them to tailor code outputs, file locations, and Docker configurations exactly to your PC setup!
                  </p>

                  {/* Add New Rule Form */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2.5">
                    <h5 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <Plus className="h-3 w-3 text-emerald-600" />
                      Commit Custom Rule to Memory
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Rule Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Local Postgres Hostname"
                          value={newRuleTitle}
                          onChange={(e) => setNewRuleTitle(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Category</label>
                        <select
                          value={newRuleCategory}
                          onChange={(e) => setNewRuleCategory(e.target.value as 'Credentials' | 'Environment' | 'Best Practices' | 'Custom Snippets')}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        >
                          <option value="Environment">Environment Setup</option>
                          <option value="Credentials">Credentials & Secrets</option>
                          <option value="Best Practices">Best Practices</option>
                          <option value="Custom Snippets">Custom JS/Expression Snippets</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Troubleshooting Rule / Local Configuration Detail</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. My postgres database runs on host.docker.internal, using standard port 5432 and user 'postgres'."
                        value={newRuleContent}
                        onChange={(e) => setNewRuleContent(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono resize-none"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={!newRuleTitle.trim() || !newRuleContent.trim()}
                      onClick={() => {
                        const newRule: TrainingRule = {
                          id: `custom-rule-${Date.now()}`,
                          title: newRuleTitle.trim(),
                          category: newRuleCategory,
                          content: newRuleContent.trim()
                        };
                        setLocalTrainingData(prev => [...prev, newRule]);
                        setNewRuleTitle('');
                        setNewRuleContent('');
                        setRuleAddedSuccess(true);
                        setTimeout(() => setRuleAddedSuccess(false), 2500);
                      }}
                      className={`w-full py-2 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        !newRuleTitle.trim() || !newRuleContent.trim()
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      <Brain className="h-3.5 w-3.5" />
                      Save to Workspace Memory
                    </button>

                    {ruleAddedSuccess && (
                      <div className="p-1.5 bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-700 text-center rounded-lg font-bold animate-pulse">
                        ✨ Brain Memory trained with new rule!
                      </div>
                    )}
                  </div>

                  {/* Preset Error Encyclopedia & Diagnostic Reference */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col gap-3 shadow-3xs text-left animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4 text-indigo-600 animate-pulse" />
                        <h5 className="text-xs font-bold text-slate-800">
                          n8n Error Encyclopedia & Preset Library
                        </h5>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const toAdd = DEFAULT_TRAINING_DATA.filter(
                            defaultRule => !localTrainingData.some(r => r.title === defaultRule.title)
                          );
                          if (toAdd.length > 0) {
                            setLocalTrainingData(prev => {
                              // Filter out duplicates just in case
                              const combined = [...prev];
                              toAdd.forEach(item => {
                                if (!combined.some(c => c.title === item.title)) {
                                  combined.push({
                                    id: `preset-${item.id}-${Date.now()}`,
                                    title: item.title,
                                    category: item.category,
                                    content: item.content
                                  });
                                }
                              });
                              return combined;
                            });
                          }
                        }}
                        className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        ⚡ Train Copilot on All 15 Presets
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-normal">
                      Explore 15 pre-compiled common n8n errors. Click <strong>Train Copilot</strong> to feed specific solutions into the AI context for immediate, accurate, guided self-healing!
                    </p>

                    {/* Search & Filter controls */}
                    <div className="flex flex-col sm:flex-row gap-2 mt-1">
                      <div className="flex-1 relative">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                          <Search className="h-3 w-3" />
                        </span>
                        <input
                          type="text"
                          placeholder="Search error types, codes, nodes or variables..."
                          value={presetSearchQuery}
                          onChange={(e) => setPresetSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-slate-400 placeholder:text-slate-400 font-medium"
                        />
                      </div>

                      {/* Category selector */}
                      <select
                        value={presetFilterCategory}
                        onChange={(e) => setPresetFilterCategory(e.target.value as any)}
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none font-bold min-w-[120px] text-slate-700"
                      >
                        <option value="All">All Categories</option>
                        <option value="Environment">Environment Setup</option>
                        <option value="Credentials">Credentials & Secrets</option>
                        <option value="Best Practices">Best Practices</option>
                        <option value="Custom Snippets">Custom Snippets</option>
                      </select>
                    </div>

                    {/* Filtered preset cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2 max-h-[300px] overflow-y-auto pr-1">
                      {DEFAULT_TRAINING_DATA.filter((rule) => {
                        const matchText = (rule.title + ' ' + rule.content + ' ' + rule.category).toLowerCase();
                        const matchSearch = matchText.includes(presetSearchQuery.toLowerCase());
                        const matchCat = presetFilterCategory === 'All' || rule.category === presetFilterCategory;
                        return matchSearch && matchCat;
                      }).map((rule) => {
                        const isTrained = localTrainingData.some(r => r.title === rule.title);
                        let categoryColor = "bg-slate-100 text-slate-700 border-slate-200";
                        if (rule.category === 'Credentials') categoryColor = "bg-amber-50 text-amber-700 border-amber-200";
                        if (rule.category === 'Environment') categoryColor = "bg-blue-50 text-blue-700 border-blue-200";
                        if (rule.category === 'Best Practices') categoryColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
                        if (rule.category === 'Custom Snippets') categoryColor = "bg-emerald-50 text-emerald-700 border-emerald-200";

                        return (
                          <div
                            key={rule.id}
                            className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 text-left ${
                              isTrained
                                ? 'bg-indigo-50/10 border-indigo-200 shadow-3xs'
                                : 'bg-slate-50/50 border-slate-200 hover:border-slate-350'
                            }`}
                          >
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded border uppercase tracking-wider ${categoryColor}`}>
                                  {rule.category}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono font-medium">Preset #{rule.id.split('-')[1]}</span>
                              </div>
                              <h6 className="text-xs font-bold text-slate-800 line-clamp-1">{rule.title}</h6>
                              <p className="text-[10px] text-slate-600 font-mono leading-relaxed bg-white/70 p-2 rounded border border-slate-100 line-clamp-4 select-all">
                                {rule.content}
                              </p>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100/50 pt-2 mt-0.5">
                              {isTrained ? (
                                <span className="inline-flex items-center text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-150">
                                  <Check className="h-3 w-3 mr-0.5 shrink-0" />
                                  Trained & Active
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newRule: TrainingRule = {
                                      id: `preset-rule-${Date.now()}`,
                                      title: rule.title,
                                      category: rule.category,
                                      content: rule.content
                                    };
                                    setLocalTrainingData(prev => [...prev, newRule]);
                                  }}
                                  className="text-[9px] bg-slate-900 hover:bg-slate-800 text-white font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Brain className="h-3 w-3 text-emerald-400" />
                                  Train Copilot
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {DEFAULT_TRAINING_DATA.filter((rule) => {
                        const matchText = (rule.title + ' ' + rule.content + ' ' + rule.category).toLowerCase();
                        const matchSearch = matchText.includes(presetSearchQuery.toLowerCase());
                        const matchCat = presetFilterCategory === 'All' || rule.category === presetFilterCategory;
                        return matchSearch && matchCat;
                      }).length === 0 && (
                        <div className="col-span-1 md:col-span-2 text-center py-8 text-slate-400 text-[11px] font-medium border border-dashed rounded-xl bg-slate-50/50">
                          No matching preset errors found in library. Try typing a different keyword!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Rules List */}
                  <div className="flex-1 flex flex-col gap-2">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Active Training Rules inside Memory ({localTrainingData.length})
                    </h5>

                    {localTrainingData.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center gap-1">
                        <span className="text-xl">💤</span>
                        <p className="text-[11px] font-semibold text-slate-500">Workspace brain is blank</p>
                        <p className="text-[9px] text-slate-400">Add a custom rule above to build memory.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                        {localTrainingData.map((rule) => {
                          let catBg = "bg-slate-100 text-slate-700 border-slate-200";
                          if (rule.category === 'Credentials') catBg = "bg-amber-50 text-amber-700 border-amber-200";
                          if (rule.category === 'Environment') catBg = "bg-blue-50 text-blue-700 border-blue-200";
                          if (rule.category === 'Best Practices') catBg = "bg-indigo-50 text-indigo-700 border-indigo-200";
                          if (rule.category === 'Custom Snippets') catBg = "bg-emerald-50 text-emerald-700 border-emerald-200";

                          return (
                            <div key={rule.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 shadow-3xs transition-all hover:border-slate-300">
                              <div className="flex-1 flex flex-col gap-1.5 text-left">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${catBg}`}>
                                    {rule.category}
                                  </span>
                                  <h6 className="text-xs font-bold text-slate-800">{rule.title}</h6>
                                </div>
                                <p className="text-[10px] text-slate-600 font-mono leading-relaxed bg-slate-50 p-2 rounded border border-slate-100 whitespace-pre-wrap select-all">
                                  {rule.content}
                                </p>
                              </div>

                              <button
                                type="button"
                                title="Delete rule from memory"
                                onClick={() => {
                                  setLocalTrainingData(prev => prev.filter(r => r.id !== rule.id));
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}

                        {/* Reset button to restore defaults */}
                        <button
                          type="button"
                          onClick={() => {
                            if (globalThis.confirm("Are you sure you want to restore the default training rules? This will replace your current memory list.")) {
                              setLocalTrainingData(DEFAULT_TRAINING_DATA);
                            }
                          }}
                          className="text-[10px] text-center text-slate-400 hover:text-slate-600 underline font-semibold py-1 cursor-pointer"
                        >
                          Restore default rules
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 6: Co-Pilot Advanced Settings & Key Manager */}
              {activeTab === 'settings' && (
                <div className="flex-1 flex flex-col gap-4 text-left animate-in fade-in duration-200">
                  <div className="rounded-xl bg-slate-900 text-white p-3.5 flex items-center gap-3 shadow-xs">
                    <Settings className="h-4 w-4 text-emerald-400 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-bold">Advanced Settings & Fallback Keys</h4>
                      <p className="text-[10px] text-slate-400">Configure companion behavior and fallback API keys</p>
                    </div>
                  </div>

                  {/* Segment: LLM Keys */}
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col gap-3 shadow-3xs">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-slate-500" />
                      Fallback LLM API Keys
                    </h5>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Provide API keys below to use OpenAI or Claude if the local memory system requires external deep troubleshooting assistance. Keys are stored strictly inside your browser.
                    </p>

                    <div className="flex flex-col gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Preferred AI Model Engine</label>
                        <select
                          value={preferredModel}
                          onChange={(e) => setPreferredModel(e.target.value as 'gemini' | 'openai' | 'claude')}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-slate-950"
                        >
                          <option value="gemini">Gemini 3.5 Flash (Default Co-Pilot)</option>
                          <option value="openai">OpenAI GPT-4o-mini (Custom Key)</option>
                          <option value="claude">Anthropic Claude 3.5 Sonnet (Custom Key)</option>
                        </select>
                      </div>

                      {preferredModel === 'openai' && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                          <label className="block text-[10px] font-semibold text-slate-500">OpenAI API Key</label>
                          <input
                            type="password"
                            placeholder="sk-proj-..."
                            value={openaiApiKey}
                            onChange={(e) => setOpenaiApiKey(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-1 focus:ring-slate-950"
                          />
                          <p className="text-[9px] text-amber-600 font-medium">⚠️ Keys are sent securely server-side to execute completions without browser CORS errors.</p>
                        </div>
                      )}

                      {preferredModel === 'claude' && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                          <label className="block text-[10px] font-semibold text-slate-500">Claude (Anthropic) API Key</label>
                          <input
                            type="password"
                            placeholder="sk-ant-..."
                            value={claudeApiKey}
                            onChange={(e) => setClaudeApiKey(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-1 focus:ring-slate-950"
                          />
                          <p className="text-[9px] text-amber-600 font-medium">⚠️ Keys are sent securely server-side to execute completions without browser CORS errors.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Segment: Screen Streaming */}
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col gap-3 shadow-3xs">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Tv className="h-3.5 w-3.5 text-slate-500" />
                      Live Screen Guiding Stream
                    </h5>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Share your n8n browser tab. Our background scheduler will periodically capture screen frames so the Copilot is in perfect lockstep with your canvas.
                    </p>

                    <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${isLiveGuidingActive ? "bg-emerald-500 animate-ping" : "bg-slate-300"}`} />
                        <div>
                          <span className="text-[10px] font-bold text-slate-700 block">
                            {isLiveGuidingActive ? "LIVE GUIDING ACTIVE" : "STREAM DISCONNECTED"}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {isLiveGuidingActive ? `Sync frame in ${countdownToNextCapture}s` : "No active display media hook"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={isLiveGuidingActive ? stopLiveGuiding : startLiveGuiding}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                          isLiveGuidingActive
                            ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {isLiveGuidingActive ? "Stop Stream" : "Connect Stream"}
                      </button>
                    </div>
                  </div>

                  {/* Segment: Companion Layout Settings */}
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col gap-3 shadow-3xs">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-slate-500" />
                      Companion Layout Options
                    </h5>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">Floating Companion Window</span>
                          <span className="text-[9px] text-slate-400">Transform copilot into a small overlay for side-by-side work</span>
                        </div>
                        <input
                          type="checkbox"
                          id="floating-companion-checkbox"
                          checked={isFloatingCompanion}
                          onChange={(e) => setIsFloatingCompanion(e.target.checked)}
                          className="h-4 w-4 text-slate-950 border-slate-300 rounded focus:ring-0 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">Ambient Dark Dimmer Overlay</span>
                          <span className="text-[9px] text-slate-400">Dims the rest of the workspace behind the floating overlay</span>
                        </div>
                        <input
                          type="checkbox"
                          id="dark-overlay-checkbox"
                          checked={isDimmedOverlay}
                          onChange={(e) => setIsDimmedOverlay(e.target.checked)}
                          className="h-4 w-4 text-slate-950 border-slate-300 rounded focus:ring-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Sticky Action Button footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col gap-2.5">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 text-[11px] text-rose-700 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
              
              <button
                onClick={() => analyzeWorkflow()}
                disabled={isAnalyzing || (!workflowJson && !screenshot && !logsInput)}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                  isAnalyzing 
                    ? 'bg-slate-300 text-slate-600 cursor-not-allowed animate-pulse'
                    : (!workflowJson && !screenshot && !logsInput)
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-950 hover:bg-slate-850 text-white hover:shadow-lg cursor-pointer hover:-translate-y-0.5 active:translate-y-0'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    AI Analyzing Workflow Context...
                  </>
                ) : (
                  <>
                    <Cpu className="h-4 w-4 text-emerald-400" />
                    Analyze Canvas & Context
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Quick Tutorials/Educational accordion snippet */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col gap-3">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wide">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              Interactive n8n Quick Reference
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl hover:border-slate-300 transition-all cursor-pointer"
                onClick={() => {
                  setLogsInput(`Webhook failed to trigger.
Error: CORS or Host mismatch. Ensure you are copying the TEST webhook URL for manual triggers in n8n.`);
                  setActiveTab('json');
                }}
              >
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  Webhook Trigger Failed
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Click to load CORS/Host webhook trigger logs error context.</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl hover:border-slate-300 transition-all cursor-pointer"
                onClick={() => {
                  setLogsInput(`[n8n Error] Cannot find module 'lodash'
Ensure you set NODE_FUNCTION_ALLOW_EXTERNAL=lodash env variable in your n8n Docker deployment.`);
                  setActiveTab('json');
                }}
              >
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  Code Node Imports
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Click to load standard custom module import error context.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Panel: AI Advisor & Workspace Diagnostics */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Top Dashboard Analytics (Inventory & Insights) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* Left module: Node Inventory */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs md:col-span-6 flex flex-col gap-3">
              <h3 className="font-bold text-slate-950 text-xs flex items-center justify-between uppercase tracking-wide">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-emerald-500" />
                  Detected Workflow Nodes
                </span>
                <span className="text-[10px] font-mono font-medium text-slate-400">
                  {nodesFound.length || 0} found
                </span>
              </h3>

              <div className="flex-1 overflow-y-auto max-h-[160px] pr-1 flex flex-col gap-2 scrollbar-thin">
                {nodesFound.length > 0 ? (
                  nodesFound.map((node, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedNode(node)}
                      className={`p-2.5 rounded-xl border transition-all text-left cursor-pointer flex justify-between items-center ${
                        selectedNode?.name === node.name 
                          ? 'border-slate-900 bg-slate-50 shadow-xs' 
                          : 'border-slate-100 hover:border-slate-250 bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded bg-slate-400 shrink-0" />
                          {node.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[190px]">
                          {node.type.replace('n8n-nodes-base.', '')}
                        </p>
                      </div>
                      <span className="text-[10px] bg-slate-200/50 font-medium px-2 py-0.5 rounded text-slate-600 shrink-0">
                        {node.credentialsNeeded && node.credentialsNeeded !== 'None' ? '🔑 Key needed' : 'Public'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <FileCode className="h-6 w-6 text-slate-400 mb-1" />
                    <p className="text-[11px] text-slate-500">No nodes analyzed yet</p>
                    <p className="text-[9px] text-slate-400 max-w-[180px] mt-0.5">Upload a JSON workflow or capture the screen to populate node index.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right module: Realtime Insights */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs md:col-span-6 flex flex-col gap-3">
              <h3 className="font-bold text-slate-950 text-xs flex items-center justify-between uppercase tracking-wide">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                  Diagnostic Insights
                </span>
                <span className="text-[10px] font-mono font-medium text-slate-400">
                  {insights.length || 0} issues
                </span>
              </h3>

              <div className="flex-1 overflow-y-auto max-h-[160px] pr-1 flex flex-col gap-2 scrollbar-thin">
                {insights.length > 0 ? (
                  insights.map((insight, i) => (
                    <div 
                      key={i} 
                      className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                        insight.type === 'error' 
                          ? 'bg-rose-50 border-rose-150 text-rose-900' 
                          : insight.type === 'warning'
                            ? 'bg-amber-50 border-amber-150 text-amber-900'
                            : 'bg-indigo-50 border-indigo-150 text-indigo-900'
                      }`}
                    >
                      {insight.type === 'error' ? (
                        <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      ) : insight.type === 'warning' ? (
                        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-[11px] font-semibold">
                          {insight.nodeName ? `Node '${insight.nodeName}': ` : 'Workflow Warning: '}
                        </p>
                        <p className="text-[10px] mt-0.5 opacity-90 leading-relaxed">
                          {insight.message}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-1" />
                    <p className="text-[11px] text-slate-500">System Healthy</p>
                    <p className="text-[9px] text-slate-400 max-w-[180px] mt-0.5">No critical logical flaws or missing key errors detected.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Node detail display card if one is selected */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-900 text-slate-100 rounded-2xl p-4.5 shadow-md border border-slate-800 relative text-left"
              >
                <button 
                  onClick={() => {
                    setSelectedNode(null);
                    setIsAssistantActive(false);
                  }}
                  className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 mt-0.5 shrink-0">
                      <Key className="h-4.5 w-4.5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">{selectedNode.name}</h4>
                        <span className="text-[9px] bg-slate-800 border border-slate-700 text-slate-300 font-mono px-1.5 py-0.5 rounded">
                          {selectedNode.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                        {selectedNode.description}
                      </p>
                      {selectedNode.credentialsNeeded && selectedNode.credentialsNeeded !== 'None' && (
                        <div className="mt-3 p-2 bg-slate-850 rounded-lg border border-slate-800 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 flex items-center gap-1 font-semibold">
                            <Key className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                            Required Credentials ID:
                          </span>
                          <code className="text-emerald-400 font-mono text-[10px] bg-slate-950 px-2 py-0.5 rounded">
                            {selectedNode.credentialsNeeded}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Standard view Connection Assistant controls */}
                  <div className="border-t border-slate-800 pt-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                        Smart Connection Assistant
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => setIsAssistantActive(prev => !prev)}
                        className={`text-[9px] font-extrabold px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isAssistantActive
                            ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-sm animate-pulse shadow-indigo-500/20'
                        }`}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {isAssistantActive ? "Close Assistant" : "Suggest Next Connection"}
                      </button>
                    </div>

                    {isAssistantActive && (
                      <div className="p-3 bg-slate-950/80 rounded-xl border border-indigo-500/40 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="flex items-start gap-2">
                          <Compass className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-slate-200 leading-normal">
                            <span className="font-bold text-slate-400">Next Node Suggestion:</span> <span className="text-emerald-400 font-bold font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">{getConnectionSuggestion(selectedNode.name).suggestedNodeName}</span>. {getConnectionSuggestion(selectedNode.name).reason}
                          </p>
                        </div>

                        <div className="flex items-center justify-between bg-slate-900/50 px-2.5 py-2 rounded border border-slate-800 text-[10px] font-mono">
                          <span className="text-slate-400 flex items-center gap-1">
                            <GitCommit className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                            Output Connection Port:
                          </span>
                          <span className="text-emerald-400 font-bold">
                            {getConnectionSuggestion(selectedNode.name).outputPort}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Big Module: AI Interactive Copilot (Split-view layout internally) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden flex-1 min-h-[480px]">
            
            {/* Header / Info bar */}
            <div className="border-b border-slate-150 p-4 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-sm">Interactive Advisor Console</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 border border-slate-200/55 rounded px-2 py-0.5">
                Powered by Gemini 3.5
              </span>
            </div>

            {/* Split layout: Setup Checklist (Left) & Chat Feed (Right) */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-250">
              
              {/* Checklist Panel */}
              <div className="md:col-span-5 p-4 bg-slate-50/30 flex flex-col gap-3 max-h-[420px] md:max-h-none overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 tracking-wide uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    Setup Checklist
                  </h4>
                  <span className="text-[10px] bg-slate-200/60 font-semibold px-2 py-0.5 rounded text-slate-700">
                    {checklist.filter(c => c.completed).length}/{checklist.length} Complete
                  </span>
                </div>

                <div className="flex-1 flex flex-col gap-2.5">
                  {checklist.length > 0 ? (
                    checklist.map((item) => (
                      <div 
                        key={item.id} 
                        className={`p-3 rounded-xl border transition-all text-left flex items-start gap-2.5 ${
                          item.completed 
                            ? 'bg-slate-50 border-slate-200/60 opacity-70' 
                            : 'bg-white border-slate-150 shadow-2xs hover:border-slate-300'
                        }`}
                      >
                        <button 
                          onClick={() => toggleChecklistItem(item.id)}
                          className={`mt-0.5 h-4.5 w-4.5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                            item.completed 
                              ? 'bg-slate-900 border-slate-900 text-white' 
                              : 'border-slate-300 hover:border-slate-500 bg-white'
                          }`}
                        >
                          {item.completed && <Check className="h-3 w-3 stroke-[3]" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className="inline-block text-[9px] font-mono font-semibold px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 uppercase mb-1">
                            {item.nodeName}
                          </span>
                          <p className={`text-xs font-bold leading-snug ${item.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {item.label}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            {item.detail}
                          </p>
                          
                          {/* Easy copying of parameter placeholders */}
                          {item.detail.includes("{{") && (
                            <button
                              onClick={() => handleCopyItem(item.detail.substring(item.detail.indexOf("{{"), item.detail.indexOf("}}") + 2), item.id)}
                              className="mt-2 inline-flex items-center gap-1 text-[9px] font-mono font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded px-1.5 py-0.5 transition"
                            >
                              {copiedIndex === item.id ? (
                                <>
                                  <Check className="h-2.5 w-2.5 text-emerald-600" />
                                  Expression Copied
                                </>
                              ) : (
                                <>
                                  <Clipboard className="h-2.5 w-2.5" />
                                  Copy Expression Code
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 mt-2">
                      <CheckCircle2 className="h-6 w-6 text-slate-300 mb-1" />
                      <p className="text-[11px] text-slate-500">Checklist Pending</p>
                      <p className="text-[9px] text-slate-400 max-w-[160px] mt-0.5">Your step-by-step setup guide will appear once you load and analyze your first workflow!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Chat Panel */}
              <div className="md:col-span-7 flex flex-col max-h-[480px] md:max-h-none">
                
                {/* Message display feed */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[340px] md:max-h-[380px] scrollbar-thin">
                  {chatHistory.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`p-3.5 rounded-2xl max-w-[90%] text-left ${
                        msg.sender === 'user' 
                          ? 'bg-slate-900 text-white rounded-tr-none' 
                          : 'bg-slate-50 border border-slate-200 rounded-tl-none text-slate-800 shadow-3xs'
                      }`}>
                        
                        {/* Render inline markdown message */}
                        <div className="text-xs leading-relaxed overflow-hidden break-words max-w-full">
                          {renderFullMarkdown(msg.text)}
                        </div>

                        {/* Screenshot thumbnail attachment if user attached screen */}
                        {msg.screenshot && (
                          <div className="mt-2.5 pt-2 border-t border-slate-850/10">
                            <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1 mb-1">
                              📸 Attached Screenshot:
                            </span>
                            <img 
                              src={msg.screenshot} 
                              alt="Context" 
                              className="max-h-[110px] rounded-lg object-contain border border-slate-300 bg-white" 
                            />
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                {/* Predefined prompt pills */}
                <div className="px-4 py-1.5 bg-slate-50/50 border-t border-slate-100 flex gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap">
                  <button 
                    onClick={() => analyzeWorkflow("How can I configure the Error Trigger node specifically with the AI Agent node for automated troubleshooting inside n8n?")}
                    className="inline-flex items-center px-2 py-1 text-[10px] font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:border-slate-350 shadow-3xs shrink-0 cursor-pointer transition-all"
                  >
                    <Zap className="h-3 w-3 text-amber-500 mr-1 shrink-0" />
                    How to configure Error Trigger AI?
                  </button>
                  <button 
                    onClick={() => analyzeWorkflow("Where do I input my API Keys and third party credentials securely in n8n so I don't get 401 errors?")}
                    className="inline-flex items-center px-2 py-1 text-[10px] font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:border-slate-350 shadow-3xs shrink-0 cursor-pointer transition-all"
                  >
                    <Key className="h-3 w-3 text-emerald-500 mr-1 shrink-0" />
                    Credential input guides
                  </button>
                  <button 
                    onClick={() => analyzeWorkflow("Explain how visual variables like {{ $json.body }} and n8n expression engines work.")}
                    className="inline-flex items-center px-2 py-1 text-[10px] font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:border-slate-350 shadow-3xs shrink-0 cursor-pointer transition-all"
                  >
                    <Layers className="h-3 w-3 text-indigo-500 mr-1 shrink-0" />
                    Expression engines
                  </button>
                </div>

                {/* Input action text-bar */}
                <div className="p-3 bg-white border-t border-slate-150 flex gap-2 items-center">
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask the n8n Copilot anything..."
                    disabled={isAnalyzing}
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-slate-400 max-h-[80px] resize-none leading-relaxed text-slate-800 placeholder-slate-400 bg-slate-50/50"
                    rows={1}
                  />
                  <button
                    onClick={() => analyzeWorkflow()}
                    disabled={isAnalyzing || !userInput.trim()}
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isAnalyzing || !userInput.trim()
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        : 'bg-slate-950 text-white hover:bg-slate-850 shadow-md cursor-pointer active:scale-95'
                    }`}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>

              </div>

            </div>

          </div>

        </div>

      </main>
      )}

      {/* Clean elegant Footer */}
      <footer className="border-t border-slate-200/75 bg-white py-5 mt-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Cpu className="h-4 w-4 text-slate-400" />
            <span>© 2026 n8n Workflow Copilot. Created via Google AI Studio.</span>
          </div>
          <div className="flex gap-4">
            <a href="https://n8n.io" target="_blank" rel="noreferrer" className="hover:text-slate-850 font-semibold transition">n8n Docs</a>
            <span className="text-slate-200">|</span>
            <span className="font-semibold text-slate-600">Local PC Desktop Companion Simulation</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
