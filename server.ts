import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

// Set up larger limits for base64 screenshots and logs
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Endpoint for workflow / screen / log analysis
app.post("/api/analyze", async (req, res) => {
  try {
    const { 
      workflowJson, 
      screenshotBase64, 
      logs, 
      chatHistory, 
      userPrompt, 
      localTrainingData,
      preferredModel,
      openaiApiKey,
      claudeApiKey
    } = req.body;

    const systemInstruction = `You are the ultimate expert n8n Workflow Copilot, troubleshooter, and AI Agent specialist.
Your mission is to help users successfully run, configure, and troubleshoot their n8n workflows by seeing what's happening and explaining step-by-step setup, configuration, credential placement, and diagnosing any errors or misconfigurations. You specialize in teaching new learners.

Be extremely detailed and authoritative on the following common n8n problem areas:
1. **Webhook Testing vs Production**:
   - Always explain the difference between 'Test' webhook URLs (which listen for 120s during active design session and require clicking 'Listen for test event') and 'Production' webhook URLs (which only listen after the workflow is fully Activated/Saved).
   - Diagnose Webhook 404 or hanging listen indicators by instructing the user to copy the URL containing "/test" when active on the canvas.

2. **n8n Expression Language & Variable Scope**:
   - Teach learners how to reference previous nodes using: \`{{ $json.propertyName }}\` (current node's input) or \`{{ $('Node Name').item.json.propertyName }}\` (specific previous node's output).
   - Address data structure errors: e.g. "Cannot read property of undefined". Guide them to inspect input JSON payload format.

3. **Item Lists vs Single Objects**:
   - Explain that n8n processes lists in loop streams. If Node A outputs 5 items, Node B (like Slack or Email) will execute 5 times by default.
   - Explain how to aggregate results using the 'Item Lists' node (e.g., summarize all items into 1 or split 1 array item into multiple records).

4. **Self-Hosting Environment Variables (Docker / Local)**:
   - If they write code inside the 'Code Node' and get "Cannot find module" or import errors, explain that they must configure n8n environment variables: \`NODE_FUNCTION_ALLOW_EXTERNAL=lodash,axios\` or \`NODE_FUNCTION_ALLOW_BUILTIN=*\` in their Docker-compose or system env.

5. **API Key, OAuth & Credentials Setup**:
   - Point out clearly where to navigate: Click 'Credentials' on the left sidebar -> 'Add Credential' -> Select provider (e.g., OpenAI, Google, Slack) -> Paste key/Secret -> Save.
   - For OAuth, guide them to copy the 'Redirect URI' from n8n credentials panel and paste it into their OAuth App settings (e.g. Google Cloud Console or Slack App API).

6. **Automated Error Healing & AI Agent Architecture**:
   - Strongly promote setting up self-healing error structures: In n8n, create an 'Error Trigger' node connected to an 'AI Agent' node (with an LLM like Gemini or OpenAI and custom prompts). This handles logic flow optimization, parses execution logs in real-time, and resolves failures automatically.
   - Guide how to route errors: Inside any node settings, navigate to 'Settings' tab -> 'On Error' -> choose 'Stop workflow' (triggering the global Error Trigger workflow) or 'Continue (Ignore error)' or 'Route to next node' to handle failures on localized branches.

Capabilities:
1. Parse n8n workflow JSON structure (visual connections, node types, credential mappings, parameters, and expressions).
2. Analyze screenshots of n8n canvas, screen layouts, active credentials, and error flags visually.
3. Troubleshooting execution logs, database errors, AI node logic, and schema misalignments.
4. Explaining n8n concepts, specifically how the user can configure native automated troubleshooting with Error Triggers and AI Agent Nodes inside n8n itself.

You MUST respond ONLY in valid JSON matching the following schema. Make sure everything is escaped properly.
Schema:
{
  "reply": "A detailed, helpful, markdown-formatted string. Address the user's specific request or question. Point out exactly where to put API keys, what code to write, where to find credentials (such as Slack, OpenAI, Stripe, etc.), and resolve errors in logs or screen visual alerts. Avoid developer jargon where possible and speak in a friendly, encouraging companion voice.",
  "checklist": [
    {
      "id": "string (unique)",
      "label": "Short, actionable checklist step description",
      "nodeName": "Name of the relevant n8n node, or 'Global'",
      "detail": "Detailed guideline on where to find the setting, what key/credentials to insert, and what to verify.",
      "completed": false
    }
  ],
  "nodesFound": [
    {
      "name": "Name of the node as shown in n8n (e.g., Slack Node)",
      "type": "Type identifier of the node (e.g., n8n-nodes-base.slack)",
      "credentialsNeeded": "Name of the credential required, or 'None'",
      "description": "Short explanation of what this node does in the context of this workflow"
    }
  ],
  "insights": [
    {
      "type": "warning | info | error",
      "message": "Direct, clean warning, tip, or error diagnosis",
      "nodeName": "Name of relevant node (optional)"
    }
  ]
}`;

    // Prepare content parts for Gemini
    const contents: any[] = [];

    // Add chat history context if present
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const msg of chatHistory) {
        if (msg.sender === "user") {
          contents.push({ role: "user", parts: [{ text: msg.text }] });
        } else {
          contents.push({ role: "model", parts: [{ text: msg.text }] });
        }
      }
    }

    // Prepare current query parts
    const currentQueryParts: any[] = [];

    let contextString = "Here is the user's current task state context:\n";

    if (localTrainingData && Array.isArray(localTrainingData) && localTrainingData.length > 0) {
      contextString += `\n--- PRE-TRAINED LOCAL MEMORY & KNOWLEDGE BASE ---\n`;
      contextString += `Use these custom user-provided troubleshooting rules, environment facts, and local tips to inform your diagnosis. They take high precedence for this user's local workspace:\n`;
      localTrainingData.forEach((item: any, i: number) => {
        contextString += `[Custom Rule #${i + 1}] Category: ${item.category || "General"} | Title: ${item.title}\nDetail: ${item.content || item.description}\n`;
      });
      contextString += `--------------------------------------------------\n`;
    }

    if (workflowJson) {
      contextString += `\n--- n8n Workflow JSON code provided by user ---\n${workflowJson}\n`;
    }

    if (logs) {
      contextString += `\n--- Execution logs or code error output ---\n${logs}\n`;
    }

    if (userPrompt) {
      contextString += `\n--- User's specific query ---\n${userPrompt}\n`;
    } else {
      contextString += `\nUser requested analysis of the uploaded workflow context.\n`;
    }

    currentQueryParts.push({ text: contextString });

    // Handle base64 image if attached
    if (screenshotBase64) {
      // Remove data url prefix if present
      const match = screenshotBase64.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        currentQueryParts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        });
      } else {
        // Fallback or assume simple base64
        currentQueryParts.push({
          inlineData: {
            mimeType: "image/png",
            data: screenshotBase64
          }
        });
      }
    }

    // 1. ROUTING FOR CUSTOM OPENAI MODEL
    if (preferredModel === 'openai' && openaiApiKey) {
      console.log("Routing analysis to custom OpenAI fallback model...");
      const messages: any[] = [
        { role: "system", content: systemInstruction + "\n\nCRITICAL: You MUST respond ONLY with a valid single JSON object containing 'reply', 'checklist', 'nodesFound', and 'insights' matching the requested schema. Wrap in zero explanation or outer markdown wrapper." }
      ];

      if (chatHistory && Array.isArray(chatHistory)) {
        chatHistory.slice(-6).forEach((msg: any) => {
          messages.push({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          });
        });
      }

      const openaiUserContent: any[] = [{ type: "text", text: contextString }];
      if (screenshotBase64) {
        openaiUserContent.push({
          type: "image_url",
          image_url: { url: screenshotBase64 }
        });
      }

      messages.push({ role: "user", content: openaiUserContent });

      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: messages,
          response_format: { type: "json_object" }
        })
      });

      const openaiData = await openaiResponse.json();
      if (openaiData.error) {
        throw new Error(`OpenAI Endpoint Error: ${openaiData.error.message || JSON.stringify(openaiData.error)}`);
      }

      const replyContent = openaiData.choices?.[0]?.message?.content;
      if (!replyContent) {
        throw new Error("No response received from OpenAI model completion.");
      }

      return res.json(JSON.parse(replyContent.trim()));
    }

    // 2. ROUTING FOR CUSTOM CLAUDE MODEL
    if (preferredModel === 'claude' && claudeApiKey) {
      console.log("Routing analysis to custom Claude fallback model...");
      const messages: any[] = [];

      if (chatHistory && Array.isArray(chatHistory)) {
        chatHistory.slice(-6).forEach((msg: any) => {
          messages.push({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          });
        });
      }

      const claudeContentParts: any[] = [];
      if (screenshotBase64) {
        const match = screenshotBase64.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,(.+)$/);
        if (match) {
          claudeContentParts.push({
            type: "image",
            source: {
              type: "base64",
              media_type: match[1],
              data: match[2]
            }
          });
        }
      }
      claudeContentParts.push({
        type: "text",
        text: contextString
      });

      messages.push({
        role: "user",
        content: claudeContentParts
      });

      const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": claudeApiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          system: systemInstruction + "\n\nCRITICAL: You MUST respond ONLY with a valid, single, parseable JSON object matching the requested schema. Wrap in zero explanation or outer markdown wrapper.",
          messages: messages,
          max_tokens: 4000
        })
      });

      const claudeData = await claudeResponse.json();
      if (claudeData.error) {
        throw new Error(`Claude Endpoint Error: ${claudeData.error.message || JSON.stringify(claudeData.error)}`);
      }

      const rawText = claudeData.content?.[0]?.text || "";
      let cleanedJsonText = rawText.trim();
      if (cleanedJsonText.includes("```json")) {
        cleanedJsonText = cleanedJsonText.split("```json")[1].split("```")[0].trim();
      } else if (cleanedJsonText.includes("```")) {
        cleanedJsonText = cleanedJsonText.split("```")[1].split("```")[0].trim();
      }

      return res.json(JSON.parse(cleanedJsonText));
    }

    contents.push({ role: "user", parts: currentQueryParts });

    // Request generation from Gemini 3.5-flash with JSON schema
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["reply", "checklist", "nodesFound", "insights"],
          properties: {
            reply: {
              type: Type.STRING,
              description: "Markdown answer resolving questions, describing step-by-step guidance, explaining nodes, or identifying error fixes."
            },
            checklist: {
              type: Type.ARRAY,
              description: "Dynamic checklist of actions the user needs to perform to make this workflow succeed.",
              items: {
                type: Type.OBJECT,
                required: ["id", "label", "nodeName", "detail", "completed"],
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  nodeName: { type: Type.STRING },
                  detail: { type: Type.STRING },
                  completed: { type: Type.BOOLEAN }
                }
              }
            },
            nodesFound: {
              type: Type.ARRAY,
              description: "Array of n8n nodes parsed from the JSON or screenshot.",
              items: {
                type: Type.OBJECT,
                required: ["name", "type", "description"],
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                  credentialsNeeded: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            },
            insights: {
              type: Type.ARRAY,
              description: "Warnings, instructions, or errors highlighted in the workflow.",
              items: {
                type: Type.OBJECT,
                required: ["type", "message"],
                properties: {
                  type: { type: Type.STRING, description: "warning, info, or error" },
                  message: { type: Type.STRING },
                  nodeName: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("Empty response received from Gemini model.");
    }

    const parsedResponse = JSON.parse(textResponse.trim());
    res.json(parsedResponse);
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    res.status(500).json({
      reply: `Sorry, I encountered an error while trying to analyze your n8n workflow. Let's make sure the JSON format is correct or try again.\n\n**Error details:** ${error.message || error}`,
      checklist: [],
      nodesFound: [],
      insights: [{ type: "error", message: `Analysis failed: ${error.message || "Unknown error"}` }]
    });
  }
});

// Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`n8n Workflow Copilot server running on http://localhost:${PORT}`);
  });
}

startServer();
