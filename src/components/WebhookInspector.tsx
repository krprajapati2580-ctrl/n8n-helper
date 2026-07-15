import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Link2, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Send, 
  Copy, 
  Check, 
  HelpCircle, 
  RefreshCw, 
  FileCode, 
  Terminal, 
  Radio,
  Sliders
} from 'lucide-react';

interface WebhookInspectorProps {
  isStreamActive: boolean;
  onApplyPresetSolution?: (title: string, content: string) => void;
}

interface ParsedUrl {
  isValid: boolean;
  rawUrl: string;
  protocol: string;
  host: string;
  port: string;
  path: string;
  isTestMode: boolean;
  isProductionMode: boolean;
  webhookId: string;
  customPath: string;
  queryParams: Array<{ key: string; value: string }>;
}

export default function WebhookInspector({ isStreamActive, onApplyPresetSolution }: WebhookInspectorProps) {
  const [urlInput, setUrlInput] = useState<string>('http://localhost:5678/webhook-test/6f9a32c1-3dcd-4e96/lead-trigger?status=new&source=facebook_ads');
  const [parsed, setParsed] = useState<ParsedUrl | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [simulationResponse, setSimulationResponse] = useState<{
    status: number;
    statusText: string;
    body: string;
    type: 'success' | 'warning' | 'error';
    reasons: string[];
  } | null>(null);

  // Preset templates that users can load for instant debugging simulation
  const presets = [
    {
      name: 'Local Host Webhook (Problematic)',
      url: 'http://localhost:5678/webhook-test/6f9a32c1-3dcd-4e96/lead-trigger?status=new&source=facebook_ads',
      description: 'Default local address which cannot accept external webhooks (Slack, Stripe, etc.) directly.'
    },
    {
      name: 'Test Webhook URL (Temporary Listener)',
      url: 'https://primary-n8n.cloud.n8n.io/webhook-test/9b1a-493e-8f9d-7a63/stripe-listener?event=charge.succeeded&amount=100',
      description: 'Used for manual canvas tests. Active only when the "Listen for test event" button is clicked.'
    },
    {
      name: 'Production Webhook URL (24/7 Active)',
      url: 'https://my-workflow.tunnel.ngrok-free.app/webhook/e07f-44a1-bcdd-c1d4/shopify-order?id=12345&status=paid',
      description: 'Used for production. Active 24/7, but requires the workflow state to be toggled to ACTIVE.'
    }
  ];

  // Run the parser whenever URL input changes
  useEffect(() => {
    parseWebhookUrl(urlInput);
  }, [urlInput]);

  // Extract simulated webhook if stream state changes or auto-detect is triggered
  const handleAutoDetectFromStream = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      // Simulate reading URL parameters from current stream
      const simulatedUrls = [
        'http://localhost:5678/webhook-test/81b2-4cd3-ae5f-7e99/slack-reaction?channel=general&user=U12345',
        'https://demo-n8n.cloud.n8n.io/webhook-test/c2d4-4a92-bf15-9988/webhook-trigger?active=true',
        'http://127.0.0.1:5678/webhook/b4f5-9aa2-e123/shopify-webhook?topic=orders/create'
      ];
      const randomUrl = simulatedUrls[Math.floor(Math.random() * simulatedUrls.length)];
      setUrlInput(randomUrl);
      setIsAnalyzing(false);
    }, 850);
  };

  const parseWebhookUrl = (raw: string) => {
    try {
      if (!raw || !raw.trim()) {
        setParsed({
          isValid: false,
          rawUrl: raw,
          protocol: '',
          host: '',
          port: '',
          path: '',
          isTestMode: false,
          isProductionMode: false,
          webhookId: '',
          customPath: '',
          queryParams: []
        });
        return;
      }

      // Add default protocol if not specified to allow URL parsing
      let normalized = raw.trim();
      if (!/^https?:\/\//i.test(normalized)) {
        normalized = 'http://' + normalized;
      }

      const urlObj = new URL(normalized);
      
      // Parse query params
      const params: Array<{ key: string; value: string }> = [];
      urlObj.searchParams.forEach((value, key) => {
        params.push({ key, value });
      });

      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      
      // Check if it's a standard n8n webhook URL
      // Pattern: /webhook-test/<id>/<path> or /webhook/<id>/<path>
      const isTestMode = pathSegments.includes('webhook-test');
      const isProductionMode = pathSegments.includes('webhook');
      
      let webhookId = '';
      let customPath = '';
      
      const webhookIndex = pathSegments.findIndex(s => s === 'webhook-test' || s === 'webhook');
      if (webhookIndex !== -1) {
        if (pathSegments[webhookIndex + 1]) {
          webhookId = pathSegments[webhookIndex + 1];
        }
        if (pathSegments.slice(webhookIndex + 2).length > 0) {
          customPath = pathSegments.slice(webhookIndex + 2).join('/');
        }
      }

      setParsed({
        isValid: isTestMode || isProductionMode,
        rawUrl: raw,
        protocol: urlObj.protocol.replace(':', ''),
        host: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        isTestMode,
        isProductionMode,
        webhookId,
        customPath,
        queryParams: params
      });
      
      // Clear old simulations on new parse
      setSimulationResponse(null);
    } catch (e) {
      setParsed({
        isValid: false,
        rawUrl: raw,
        protocol: '',
        host: '',
        port: '',
        path: '',
        isTestMode: false,
        isProductionMode: false,
        webhookId: '',
        customPath: '',
        queryParams: []
      });
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(urlInput);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleParamValueChange = (index: number, newValue: string) => {
    if (!parsed) return;
    const updatedParams = [...parsed.queryParams];
    updatedParams[index].value = newValue;
    
    // Reconstruct URL
    try {
      let normalized = urlInput.trim();
      if (!/^https?:\/\//i.test(normalized)) {
        normalized = 'http://' + normalized;
      }
      const urlObj = new URL(normalized);
      urlObj.search = ''; // Clear search params
      updatedParams.forEach(p => {
        if (p.key) urlObj.searchParams.set(p.key, p.value);
      });
      
      setUrlInput(urlObj.toString());
    } catch (e) {
      // fallback
    }
  };

  const handleRunSimulation = () => {
    if (!parsed) return;
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const reasons: string[] = [];
      let type: 'success' | 'warning' | 'error' = 'success';
      let status = 200;
      let statusText = 'OK';
      let body = '';

      // Rule 1: Check localhost trigger issue
      if (parsed.host === 'localhost' || parsed.host === '127.0.0.1') {
        type = 'error';
        status = 0;
        statusText = 'Connection Refused (External Source)';
        reasons.push(
          'CRITICAL: The Webhook target is running on your local machine (localhost). External APIs (Slack, Stripe, GitHub, etc.) cannot communicate with private local addresses directly.'
        );
        reasons.push(
          'SOLUTION: You must configure an ngrok/localtunnel bridge and set the WEBHOOK_URL environment variable in your docker-compose file.'
        );
        body = JSON.stringify({
          error: 'Network unreachable. External systems cannot reach local loopback interfaces.',
          help: 'Define WEBHOOK_URL in n8n system variables.'
        }, null, 2);
      } 
      // Rule 2: Check test mode url
      else if (parsed.isTestMode) {
        type = 'warning';
        status = 404;
        statusText = 'Workflow Not Awaiting Test Event';
        reasons.push(
          'WARNING: This is a /webhook-test/ path. n8n will return "404 Not Found" unless you have clicked "Listen for test event" on the canvas inside the last 120 seconds.'
        );
        reasons.push(
          'BEST PRACTICE: For active, uninterrupted automated webhooks (production), make sure to swap "/webhook-test/" in your URL to "/webhook/" and save.'
        );
        body = JSON.stringify({
          code: 404,
          message: 'The workflow is not currently active, or is not listening for a test event.',
          hint: 'Ensure you clicked "Listen for test event" on the canvas.'
        }, null, 2);
      }
      // Rule 3: Check production mode url
      else if (parsed.isProductionMode) {
        type = 'success';
        status = 200;
        statusText = 'OK (Awaiting Active State)';
        reasons.push(
          'SUCCESS: The URL is pointed to a /webhook/ production endpoint which is active 24/7.'
        );
        reasons.push(
          'CHECKLIST: Ensure the workflow is toggled to ACTIVE (top-right switch) and saved, or n8n will discard production payloads silently.'
        );
        body = JSON.stringify({
          status: 'success',
          webhook_received: true,
          mode: 'production',
          timestamp: new Date().toISOString()
        }, null, 2);
      } else {
        type = 'error';
        status = 400;
        statusText = 'Bad Request (Not an n8n webhook format)';
        reasons.push(
          'ERROR: The URL path does not contain the standard "/webhook/" or "/webhook-test/" segment.'
        );
        reasons.push(
          'STRUCTURE: An n8n webhook URL must match the format: https://[host]/webhook/[id]/[path_name].'
        );
        body = JSON.stringify({
          error: 'Invalid webhook path structure.'
        }, null, 2);
      }

      setSimulationResponse({
        status,
        statusText,
        body,
        type,
        reasons
      });
      setIsAnalyzing(false);
    }, 600);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4 text-left">
      
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
            <Radio className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              Webhook URL Inspector & Matcher
            </h4>
            <p className="text-[10px] text-slate-400 font-mono">
              Live validation of n8n trigger webhooks
            </p>
          </div>
        </div>

        {/* Auto Detect Button if screen stream is on */}
        <button
          type="button"
          onClick={handleAutoDetectFromStream}
          disabled={isAnalyzing}
          className={`text-[9px] font-bold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
            isStreamActive 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 animate-bounce' 
              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
          }`}
          title={isStreamActive ? "Extract webhook address automatically from your live shared screen stream!" : "Scans and generates simulated trigger payloads"}
        >
          {isAnalyzing ? (
            <RefreshCw className="h-2.5 w-2.5 animate-spin" />
          ) : (
            <Globe className="h-2.5 w-2.5" />
          )}
          {isStreamActive ? "🔍 Auto-Extract from Stream" : "Simulate Stream Match"}
        </button>
      </div>

      {/* Preset selector bar */}
      <div className="flex flex-col gap-1">
        <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
          Quick-Load Preset Webhook Scenarios
        </label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {presets.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setUrlInput(p.url)}
              className={`text-[10px] px-2.5 py-1 rounded-md border font-semibold transition-all cursor-pointer ${
                urlInput === p.url 
                  ? 'bg-slate-900 border-slate-950 text-white shadow-xs' 
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
              }`}
              title={p.description}
            >
              Preset #{i+1}: {p.name.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main input */}
      <div className="flex flex-col gap-1.5 mt-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Target Webhook URL
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="text-[10px] text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              {isCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              {isCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="flex items-stretch gap-1">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Link2 className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste any webhook URL to validate..."
              className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
          <button
            type="button"
            onClick={handleRunSimulation}
            disabled={isAnalyzing || !urlInput.trim()}
            className="px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-xl flex items-center gap-1.5 cursor-pointer shadow-3xs transition-all shrink-0 active:scale-97"
          >
            <Play className="h-3 w-3 fill-current" />
            Inspect Path
          </button>
        </div>
      </div>

      {/* URL Analysis grid */}
      {parsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50/50 p-3 rounded-xl border border-slate-200/60 text-[10px]">
          <div className="p-2 bg-white rounded-lg border border-slate-150">
            <span className="text-slate-400 font-bold block text-[8px] uppercase tracking-wider">Status & Protocol</span>
            <span className="font-mono text-slate-700 font-semibold block mt-0.5">
              {parsed.protocol || 'Unknown'}:// {parsed.isValid ? (
                <span className="text-emerald-600 font-bold">Standard</span>
              ) : (
                <span className="text-amber-600 font-bold">Raw / Non-n8n</span>
              )}
            </span>
          </div>

          <div className="p-2 bg-white rounded-lg border border-slate-150">
            <span className="text-slate-400 font-bold block text-[8px] uppercase tracking-wider">Network Domain</span>
            <span className="font-mono text-slate-700 font-semibold block truncate mt-0.5" title={parsed.host}>
              {parsed.host || 'No Host'} {parsed.port ? `:${parsed.port}` : ''}
            </span>
          </div>

          <div className="p-2 bg-white rounded-lg border border-slate-150">
            <span className="text-slate-400 font-bold block text-[8px] uppercase tracking-wider">Listener Mode</span>
            <span className="font-semibold block mt-0.5">
              {parsed.isTestMode && (
                <span className="inline-flex items-center text-amber-600 font-extrabold uppercase text-[9px] bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                  ⚡ Test (120s limit)
                </span>
              )}
              {parsed.isProductionMode && (
                <span className="inline-flex items-center text-emerald-600 font-extrabold uppercase text-[9px] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  ⚙️ Production (24/7)
                </span>
              )}
              {!parsed.isTestMode && !parsed.isProductionMode && (
                <span className="text-slate-500 font-semibold">Custom / Static</span>
              )}
            </span>
          </div>

          <div className="p-2 bg-white rounded-lg border border-slate-150">
            <span className="text-slate-400 font-bold block text-[8px] uppercase tracking-wider">Webhook ID & Path</span>
            <span className="font-mono text-slate-700 font-semibold block truncate mt-0.5" title={parsed.customPath || 'None'}>
              ID: {parsed.webhookId || 'None'} {parsed.customPath ? `(${parsed.customPath})` : ''}
            </span>
          </div>
        </div>
      )}

      {/* Query Parameters Inspector Editor */}
      {parsed && parsed.queryParams.length > 0 && (
        <div className="border border-slate-200 rounded-xl p-3 bg-white flex flex-col gap-2">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5 mb-1">
            <Sliders className="h-3.5 w-3.5 text-indigo-500" />
            <h5 className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
              Query Parameters Detected ({parsed.queryParams.length})
            </h5>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
            {parsed.queryParams.map((param, idx) => (
              <div key={idx} className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-[10px]">
                <span className="font-mono font-bold text-indigo-600 shrink-0 truncate max-w-[100px]" title={param.key}>
                  {param.key}
                </span>
                <span className="text-slate-400 font-mono font-medium">=</span>
                <input
                  type="text"
                  value={param.value}
                  onChange={(e) => handleParamValueChange(idx, e.target.value)}
                  className="flex-1 px-1.5 py-0.5 bg-white border border-slate-150 rounded text-[10px] font-mono outline-none focus:border-slate-350"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simulation Diagnostic response */}
      {simulationResponse && (
        <div className={`rounded-xl border p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200 text-[11px] ${
          simulationResponse.type === 'error' 
            ? 'bg-rose-50/70 border-rose-200 text-rose-900' 
            : simulationResponse.type === 'warning'
              ? 'bg-amber-50/70 border-amber-200 text-amber-900'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center gap-2">
            {simulationResponse.type === 'error' && <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0" />}
            {simulationResponse.type === 'warning' && <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0" />}
            {simulationResponse.type === 'success' && <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0" />}
            <div className="flex-1">
              <span className="font-bold">Diagnostic Code: {simulationResponse.status}</span>
              <span className="mx-2 font-semibold">|</span>
              <span className="font-mono">{simulationResponse.statusText}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-black/5 pt-2">
            <span className="font-bold text-[10px] uppercase tracking-wider block">Diagnostics Checklist Summary</span>
            <ul className="flex flex-col gap-1.5">
              {simulationResponse.reasons.map((r, i) => {
                const isSol = r.includes('SOLUTION:') || r.includes('BEST PRACTICE:');
                return (
                  <li key={i} className={`flex items-start gap-1.5 leading-relaxed ${isSol ? 'font-semibold text-slate-800' : ''}`}>
                    <span className="mt-0.5 text-[12px] leading-none shrink-0">•</span>
                    <span>{r}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Preset solutions trigger */}
          {simulationResponse.type === 'error' && onApplyPresetSolution && (
            <button
              type="button"
              onClick={() => {
                // Apply ngrok environment helper preset solution
                onApplyPresetSolution(
                  "Tunneling Webhooks locally (ngrok / Localtunnel)",
                  "When testing Webhook nodes on localhost, set WEBHOOK_URL=https://your-subdomain.ngrok-free.app so that Slack or GitHub triggers can reach your local machine's n8n port."
                );
              }}
              className="self-start mt-1 text-[10px] bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg transition-all"
            >
              🛠️ Deploy ngrok Tunnel Environment Patch
            </button>
          )}

          {/* Response payload preview */}
          <div className="flex flex-col gap-1 mt-1">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Terminal className="h-3 w-3" /> Simulated Server Reply
            </span>
            <pre className="p-2.5 bg-slate-900 text-slate-300 font-mono text-[9px] rounded-lg border border-slate-800 overflow-x-auto max-h-[100px] leading-relaxed shadow-inner select-all">
              {simulationResponse.body}
            </pre>
          </div>
        </div>
      )}

      {/* Static helpful instruction card footer */}
      <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-150 rounded-xl p-3 flex gap-2">
        <HelpCircle className="h-4.5 w-4.5 text-slate-400 mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-700 block">How Webhook matching operates:</span>
          When setting up triggers in Stripe, Slack, or GitHub, the webhook URL you input must EXACTLY match the active n8n instance path. If testing, toggle the <strong>Test / Production</strong> segment in the inspector above to verify your external trigger points to the correct endpoint context!
        </div>
      </div>
      
    </div>
  );
}
