export async function fetchUserTokens(
  _userId: string
): Promise<Record<string, string>> {
  return {};
}

export async function fetchToken(
  _provider: string,
  _userId: string
): Promise<string> {
  throw new Error("No token found");
}

export function detectRequiredProviders(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  
  const keywords: Record<string, string[]> = {
    slack: ["slack", "message", "channel", "notify", "post", "#"],
    hubspot: ["hubspot", "crm", "contact", "deal", "pipeline"],
    notion: ["notion", "page", "database", "doc"],
    gmail: ["gmail", "email", "mail", "inbox"],
    airtable: ["airtable", "base", "table", "record"],
    googlesheets: ["google sheets", "spreadsheet", "sheet"],
    googledrive: ["google drive", "drive", "file", "folder"],
    googlecalendar: ["google calendar", "calendar", "event", "meeting", "schedule"],
    github: ["github", "issue", "pr", "pull request", "repo", "repository"],
    salesforce: ["salesforce", "sfdc", "opportunity"],
    jira: ["jira", "issue", "sprint", "project"],
    discord: ["discord", "server", "channel"],
    calendly: ["calendly", "meeting", "scheduling", "book"],
    trello: ["trello", "board", "card", "list"],
    asana: ["asana", "task", "project", "workspace"],
    outlook: ["outlook", "office email", "microsoft email"],
    supabase: ["supabase", "database", "db"],
    apaleo: ["apaleo", "hotel", "booking"],
    attio: ["attio", "crm"],
    basecamp: ["basecamp", "todo"],
    boldsign: ["boldsign", "esign", "signature"],
    blackbaud: ["blackbaud", "nonprofit", "fundraising"],
    googlesuper: ["google super", "super"],
    discordbot: ["discord bot"],
  };

  return Object.entries(keywords)
    .filter(([, terms]) => terms.some((term) => lower.includes(term)))
    .map(([provider]) => provider);
}