import { getModel } from "@/lib/graph/factory";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { runInSandbox } from "@/lib/sandbox/runner";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import type { AgentState } from "@/lib/graph/state";

const TOOL_USE_PROMPT = `You are an automation assistant.
When a user asks to interact with connected apps (Gmail, Slack, GitHub, etc.), use the available tools.

Available tools will be automatically called based on your response.
If you need to use a tool, just describe what you want to do - the tool will be selected automatically.

After getting tool results, summarize them for the user in a clear way.`;

const CODE_GEN_PROMPT = `You are an expert Python automation engineer.
Given a task step, write a complete, runnable Python script.

Rules:
- Use only standard library + requests + json. No other imports unless necessary.
- Print the result as JSON to stdout on the last line: print(json.dumps(result))
- Handle errors gracefully with try/except
- Keep scripts focused: one task per script
- Return a dict with keys: "status", "data", "summary"

Respond ONLY with the Python script inside a \`\`\`python block.`;

// Map app names to keywords for detecting requests
const APP_KEYWORDS: Record<string, string[]> = {
  gmail: ["gmail", "email", "google email", "send email", "inbox"],
  slack: ["slack", "message", "channel", "send to slack"],
  github: ["github", "git", "issue", "pr", "pull request"],
  notion: ["notion", "page", "document"],
  hubspot: ["hubspot", "crm", "contact"],
  airtable: ["airtable", "base", "table"],
  googlesheets: ["google sheets", "sheets", "spreadsheet"],
  googlecalendar: ["calendar", "google calendar", "event"],
};

function detectAppFromPrompt(prompt: string): string | null {
  const lowerPrompt = prompt.toLowerCase();
  for (const [app, keywords] of Object.entries(APP_KEYWORDS)) {
    if (keywords.some((kw) => lowerPrompt.includes(kw))) {
      return app;
    }
  }
  return null;
}

export async function executorNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  const { composio_tools, user_api_key, is_free_tier, current_step, plan, user_prompt, sandbox_result, integration_tokens } = state;
  
  const currentStep = plan[current_step] || user_prompt;
  const requestedApp = detectAppFromPrompt(currentStep);
  const connectedApps = composio_tools?.map((t: any) => t?.name?.toLowerCase()).filter(Boolean) || [];
  
  console.log(`[executor] Step ${current_step + 1}: ${currentStep}`);
  console.log(`[executor] Requested app: ${requestedApp}, Connected: ${connectedApps.length} tools`);
  
  // Check if user wants to use a specific app
  if (requestedApp) {
    const appConnected = connectedApps.some((name: string) => 
      name?.toLowerCase().includes(requestedApp.toLowerCase())
    );
    
    // If app is NOT connected but user is asking about it
    if (!appConnected && composio_tools?.length > 0) {
      console.log(`[executor] App ${requestedApp} not connected`);
      return {
        current_script: "",
        sandbox_result: null,
        current_step: current_step + 1,
        error: null,
        final_output: `To use ${requestedApp}, please connect it first in the Apps tab.`,
      };
    }
  }
  
  // If we have Composio tools and something is connected, use them
  if (composio_tools && composio_tools.length > 0) {
    console.log(`[executor] Using ${composio_tools.length} Composio tools`);
    
    const model = getModel("executor", user_api_key, is_free_tier);
    const toolNode = new ToolNode(composio_tools);
    
    // Bind tools to model
    const modelWithTools = model.bindTools(composio_tools);
    
    // Build messages
    const messages: any[] = [
      new SystemMessage(TOOL_USE_PROMPT),
      new HumanMessage(currentStep),
    ];
    
    if (sandbox_result) {
      messages.push(new HumanMessage(`Previous result: ${JSON.stringify(sandbox_result).slice(0, 500)}`));
    }
    
    // Invoke model with tools
    const response = await modelWithTools.invoke(messages);
    
    // Check if model wants to call tools
    if (response.tool_calls && response.tool_calls.length > 0) {
      console.log(`[executor] Calling ${response.tool_calls.length} tool(s)`);
      
      // Run tools
      const toolResults = await toolNode.invoke({ messages: [response] });
      
      const toolMessages = toolResults.messages as any[];
      const lastToolResult = toolMessages[toolMessages.length - 1];
      
      return {
        current_script: JSON.stringify(response.tool_calls),
        sandbox_result: lastToolResult?.content || "Tool executed",
        current_step: current_step + 1,
        error: null,
        final_output: `Used tools: ${response.tool_calls.map((t: any) => t.name).join(", ")}`,
      };
    }
    
    // No tool call - just return the response
    return {
      current_script: "",
      sandbox_result: response.content,
      current_step: current_step + 1,
      error: null,
      final_output: response.content as string,
    };
  }
  
  // NO Composio tools - fallback to Python script generation
  console.log(`[executor] No tools - using Python script fallback`);
  
  const model = getModel("executor", user_api_key, is_free_tier);
  
  // Build token context
  const tokenContext = Object.entries(integration_tokens || {})
    .map(([k, v]) => `${k}: ${String(v).slice(0, 8)}...`)
    .join(", ");
  
  // Generate Python script
  const response = await model.invoke([
    new SystemMessage(SYSTEM_PROMPT + "\n\n" + CODE_GEN_PROMPT),
    new HumanMessage(
      `Task: ${currentStep}\n\nAvailable tokens: ${tokenContext || "none"}\n\nPrevious result: ${
        sandbox_result ? JSON.stringify(sandbox_result).slice(0, 500) : "none"
      }\n\nWrite the Python script now:`
    ),
  ]);
  
  const content = response.content as string;
  
  // Extract Python code
  const codeMatch = content.match(/```python\n?([\s\S]*?)\n?```/);
  const script = codeMatch ? codeMatch[1] : content;
  
  console.log(`[executor] Running script in sandbox...`);
  
  // Run in E2B sandbox
  const sandboxResult = await runInSandbox(script, integration_tokens || {});
  
  if (sandboxResult.error) {
    console.log(`[executor] Sandbox error: ${sandboxResult.error}`);
    return {
      current_script: script,
      error: sandboxResult.error,
      retry_count: state.retry_count + 1,
    };
  }
  
  console.log(`[executor] Script success`);
  return {
    current_script: script,
    sandbox_result: sandboxResult.result,
    current_step: current_step + 1,
    error: null,
  };
}