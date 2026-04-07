import { getModel } from "@/lib/graph/factory";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { runInSandbox } from "@/lib/sandbox/runner";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import type { AgentState } from "@/lib/graph/state";

const CODE_GEN_PROMPT = `You are an expert Python automation engineer.
Given a task step and available integration tokens, write a complete, runnable Python script.

Rules:
- Use only standard library + requests + json. No other imports unless necessary.
- Print the result as JSON to stdout on the last line: print(json.dumps(result))
- Handle errors gracefully with try/except
- Use the provided tokens as Bearer tokens in Authorization headers
- Keep scripts focused: one task per script
- Return a dict with keys: "status", "data", "summary"

Available tokens (will be injected as env vars):
- SLACK_TOKEN for Slack (Bot User OAuth Token)
- HUBSPOT_TOKEN for HubSpot (Private App Access Token)
- NOTION_TOKEN for Notion (Internal Integration Token)
- GMAIL_TOKEN for Gmail (OAuth2 access token)
- AIRTABLE_TOKEN for Airtable (Personal Access Token)
- GOOGLE_SHEETS_TOKEN for Google Sheets (OAuth2 access token)
- GOOGLE_DRIVE_TOKEN for Google Drive (OAuth2 access token)
- GOOGLE_CALENDAR_TOKEN for Google Calendar (OAuth2 access token)
- GITHUB_TOKEN for GitHub (Personal Access Token)
- SALESFORCE_TOKEN for Salesforce (Access Token)
- JIRA_TOKEN for Jira (API Token)
- DISCORD_TOKEN for Discord (Bot Token)
- CALENDLY_TOKEN for Calendly (API Token)
- TRELLO_TOKEN for Trello (API Key + Token)
- ASANA_TOKEN for Asana (Personal Access Token)
- OUTLOOK_TOKEN for Outlook (OAuth2 access token)
- SUPABASE_URL, SUPABASE_KEY for Supabase

Respond ONLY with the Python script inside a \`\`\`python block.`;

export async function executorNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  const model = getModel("executor", state.user_api_key, state.is_free_tier);
  const currentStep = state.plan[state.current_step] || state.user_prompt;
  console.log(`[executor] Step ${state.current_step + 1}: ${currentStep}`);

  // Build token context for the prompt
  const tokenContext = Object.entries(state.integration_tokens)
    .map(([k, v]) => `${k}: ${v.slice(0, 8)}...`)
    .join(", ");

  // Generate the Python script
  const response = await model.invoke([
    new SystemMessage(SYSTEM_PROMPT + "\n\n" + CODE_GEN_PROMPT),
    new HumanMessage(
      `Task: ${currentStep}\n\nAvailable tokens: ${tokenContext || "none"}\n\nPrevious result: ${
        state.sandbox_result
          ? JSON.stringify(state.sandbox_result).slice(0, 500)
          : "none"
      }\n\nWrite the Python script now:`
    ),
  ]);

  const content = response.content as string;

  // Extract Python code
  const codeMatch = content.match(/```python\n?([\s\S]*?)\n?```/);
  const script = codeMatch ? codeMatch[1] : content;

  console.log(`[executor] Running script in E2B sandbox...`);

  // Run in E2B sandbox
  const sandboxResult = await runInSandbox(script, state.integration_tokens);

  if (sandboxResult.error) {
    console.log(`[executor] Sandbox error: ${sandboxResult.error}`);
    return {
      current_script: script,
      error: sandboxResult.error,
      retry_count: state.retry_count + 1,
    };
  }

  console.log(`[executor] Success`);
  return {
    current_script: script,
    sandbox_result: sandboxResult.result,
    current_step: state.current_step + 1,
    error: null,
  };
}
