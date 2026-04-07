import { Composio } from "@composio/core";
import { LangchainProvider } from "@composio/langchain";

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;

const GMAIL_CONFIG = {
  toolkitSlug: "GMAIL",
  authConfigId: "ac_1skm6eP220xM",
  authMethod: "OAUTH2",
} as const;

const SLACK_CONFIG = {
  toolkitSlug: "SLACK",
  authConfigId: "ac_eVwXe0T2e18x",
  authMethod: "OAUTH2",
} as const;

const GOOGLE_SHEETS_CONFIG = {
  toolkitSlug: "GOOGLESHEETS",
  authConfigId: "ac_HMp19JBDehll",
  authMethod: "OAUTH2",
} as const;

const NOTION_CONFIG = {
  toolkitSlug: "NOTION",
  authConfigId: "ac_qnZwhjqa0_0G",
  authMethod: "OAUTH2",
} as const;

const GOOGLE_DRIVE_CONFIG = {
  toolkitSlug: "GOOGLEDRIVE",
  authConfigId: "ac_bKpGpNOEqi6b",
  authMethod: "OAUTH2",
} as const;

const SUPABASE_CONFIG = {
  toolkitSlug: "SUPABASE",
  authConfigId: "ac_cD0Oo3zzJ1LN",
  authMethod: "OAUTH2",
} as const;

const HUBSPOT_CONFIG = {
  toolkitSlug: "HUBSPOT",
  authConfigId: "ac_4wApPeiy20gY",
  authMethod: "OAUTH2",
} as const;

const GITHUB_CONFIG = {
  toolkitSlug: "GITHUB",
  authConfigId: "ac_o3KOsPJkHSuT",
  authMethod: "OAUTH2",
} as const;

const AIRTABLE_CONFIG = {
  toolkitSlug: "AIRTABLE",
  authConfigId: "ac_eopGkN8IR1Zd",
  authMethod: "OAUTH2",
} as const;

const APALEO_CONFIG = {
  toolkitSlug: "APALEO",
  authConfigId: "ac_ViLJL3SA7sYx",
  authMethod: "OAUTH2",
} as const;

const ASANA_CONFIG = {
  toolkitSlug: "ASANA",
  authConfigId: "ac_JPfqKptGlDaj",
  authMethod: "OAUTH2",
} as const;

const ATTIO_CONFIG = {
  toolkitSlug: "ATTIO",
  authConfigId: "ac_-lQHzixfgdeU",
  authMethod: "OAUTH2",
} as const;

const BASECAMP_CONFIG = {
  toolkitSlug: "BASECAMP",
  authConfigId: "ac_hSC0XUr2Zgp9",
  authMethod: "OAUTH2",
} as const;

const BOLDSIGN_CONFIG = {
  toolkitSlug: "BOLDSIGN",
  authConfigId: "ac_CQbD4ME6yOta",
  authMethod: "OAUTH2",
} as const;

const BLACKBAUD_CONFIG = {
  toolkitSlug: "BLACKBAUD",
  authConfigId: "ac_M6UEsdq7BSGs",
  authMethod: "OAUTH2",
} as const;

const CALENDLY_CONFIG = {
  toolkitSlug: "CALENDLY",
  authConfigId: "ac_MEBH4_695hTP",
  authMethod: "OAUTH2",
} as const;

const GOOGLE_CALENDAR_CONFIG = {
  toolkitSlug: "GOOGLECALENDAR",
  authConfigId: "ac_U85-XZUW3boE",
  authMethod: "OAUTH2",
} as const;

const GOOGLE_SUPER_CONFIG = {
  toolkitSlug: "GOOGLESUPER",
  authConfigId: "ac_W2ukHkjV8VYJ",
  authMethod: "OAUTH2",
} as const;

const SALESFORCE_CONFIG = {
  toolkitSlug: "SALESFORCE",
  authConfigId: "ac_W_VYKHzstDhk",
  authMethod: "OAUTH2",
} as const;

const JIRA_CONFIG = {
  toolkitSlug: "JIRA",
  authConfigId: "ac_1oaeaLZvnnUd",
  authMethod: "OAUTH2",
} as const;

const DISCORD_CONFIG = {
  toolkitSlug: "DISCORD",
  authConfigId: "ac_u4f6wsUibIIe",
  authMethod: "OAUTH2",
} as const;

const DISCORD_BOT_CONFIG = {
  toolkitSlug: "DISCORDBOT",
  authConfigId: "ac_9OGgK4V-seKW",
  authMethod: "OAUTH2",
} as const;

const OUTLOOK_CONFIG = {
  toolkitSlug: "OUTLOOK",
  authConfigId: "ac_u1UxpgWxLS27",
  authMethod: "OAUTH2",
} as const;

const TRELLO_CONFIG = {
  toolkitSlug: "TRELLO",
  authConfigId: "ac_qIFFv047XNxw",
  authMethod: "OAUTH1",
} as const;

let composioClient: any = null;

function getComposioClient(): any {
  if (!COMPOSIO_API_KEY) {
    throw new Error("COMPOSIO_API_KEY is not set");
  }

  if (!composioClient) {
    composioClient = new Composio({
      apiKey: COMPOSIO_API_KEY,
      provider: new LangchainProvider(),
    });
  }

  return composioClient;
}

export interface ComposioSession {
  userId: string;
  connectedApps: string[];
  tools: any[];
}

const sessions = new Map<string, ComposioSession>();

export async function createComposioSession(
  userId: string,
  apps: string[] = []
): Promise<ComposioSession> {
  const client = getComposioClient();
  const session = await client.create(userId);

  const tools = await session.getTools();

  const composioSession: ComposioSession = {
    userId,
    connectedApps: apps,
    tools,
  };

  sessions.set(userId, composioSession);
  return composioSession;
}

export async function getComposioSession(
  userId: string
): Promise<ComposioSession | null> {
  return sessions.get(userId) || null;
}

export async function updateComposioSession(
  userId: string,
  apps: string[]
): Promise<ComposioSession> {
  return createComposioSession(userId, apps);
}

export async function authorizeApp(
  userId: string,
  appName: string,
  callbackUrl?: string
): Promise<{ redirectUrl: string; session: any }> {
  const client = getComposioClient();
  const session = await client.create(userId, { manageConnections: false });

  const appConfig = getAppConfig(appName);

  const connectionRequest = await session.authorize(appName, {
    authConfigId: appConfig.authConfigId,
    callbackUrl: callbackUrl || "http://localhost:3000/api/integrations/composio/callback",
  });

  return {
    redirectUrl: connectionRequest.redirectUrl,
    session: connectionRequest,
  };
}

function getAppConfig(appName: string) {
  const normalizedName = appName.toLowerCase().replace(/-/g, "");
  
  if (normalizedName === "gmail" || normalizedName === "gmail0s44uz") {
    return GMAIL_CONFIG;
  }
  
  if (normalizedName === "slack" || normalizedName === "slackze7rox") {
    return SLACK_CONFIG;
  }
  
  if (normalizedName === "googlesheets" || normalizedName === "google sheetsonhdz") {
    return GOOGLE_SHEETS_CONFIG;
  }
  
  if (normalizedName === "notion" || normalizedName === "notionerhdb") {
    return NOTION_CONFIG;
  }
  
  if (normalizedName === "googledrive" || normalizedName === "google drivebmacdi") {
    return GOOGLE_DRIVE_CONFIG;
  }
  
  if (normalizedName === "supabase" || normalizedName === "supabasehgomlr") {
    return SUPABASE_CONFIG;
  }
  
  if (normalizedName === "hubspot" || normalizedName === "hubspotola1zv") {
    return HUBSPOT_CONFIG;
  }
  
  if (normalizedName === "github" || normalizedName === "githubygfosi") {
    return GITHUB_CONFIG;
  }
  
  if (normalizedName === "airtable" || normalizedName === "airtablebah992") {
    return AIRTABLE_CONFIG;
  }
  
  if (normalizedName === "apaleo" || normalizedName === "apaleoskjv3") {
    return APALEO_CONFIG;
  }
  
  if (normalizedName === "asana" || normalizedName === "asanam6hizg") {
    return ASANA_CONFIG;
  }
  
  if (normalizedName === "attio" || normalizedName === "attiozfnhtu") {
    return ATTIO_CONFIG;
  }
  
  if (normalizedName === "basecamp" || normalizedName === "basecamphejbm4") {
    return BASECAMP_CONFIG;
  }
  
  if (normalizedName === "boldsign" || normalizedName === "boldsignmnqyjp") {
    return BOLDSIGN_CONFIG;
  }
  
  if (normalizedName === "blackbaud" || normalizedName === "blackbadiikogf") {
    return BLACKBAUD_CONFIG;
  }
  
  if (normalizedName === "calendly" || normalizedName === "calendlyj3pra8") {
    return CALENDLY_CONFIG;
  }
  
  if (normalizedName === "googlecalendar") {
    return GOOGLE_CALENDAR_CONFIG;
  }
  
  if (normalizedName === "googlesuper") {
    return GOOGLE_SUPER_CONFIG;
  }
  
  if (normalizedName === "salesforce") {
    return SALESFORCE_CONFIG;
  }
  
  if (normalizedName === "jira") {
    return JIRA_CONFIG;
  }
  
  if (normalizedName === "discord") {
    return DISCORD_CONFIG;
  }
  
  if (normalizedName === "discordbot") {
    return DISCORD_BOT_CONFIG;
  }
  
  if (normalizedName === "outlook") {
    return OUTLOOK_CONFIG;
  }
  
  if (normalizedName === "trello") {
    return TRELLO_CONFIG;
  }
  
  return {
    toolkitSlug: appName.toUpperCase(),
    authConfigId: undefined,
    authMethod: "OAUTH2",
  };
}

export async function waitForConnection(
  connectionRequest: any
): Promise<{ id: string; app: string }> {
  const connectedAccount = await connectionRequest.waitForConnection();
  return {
    id: connectedAccount.id,
    app: connectedAccount.app || "unknown",
  };
}

export async function disconnectApp(
  userId: string,
  appName: string
): Promise<void> {
  const client = getComposioClient();
  const session = await client.create(userId);
  await session.revokeAccess(appName);

  const existingSession = sessions.get(userId);
  if (existingSession) {
    const updatedApps = existingSession.connectedApps.filter(
      (app) => app !== appName
    );
    await updateComposioSession(userId, updatedApps);
  }
}

export async function getAvailableTools(
  userId: string,
  apps?: string[]
): Promise<any[]> {
  const session = await createComposioSession(userId, apps || []);
  return session.tools;
}

export function clearSession(userId: string): void {
  sessions.delete(userId);
}

export const APP_CONFIGS = {
  gmail: {
    toolkitSlug: "GMAIL",
    authConfigId: "ac_1skm6eP220xM",
    authMethod: "OAUTH2" as const,
  },
  slack: {
    toolkitSlug: "SLACK",
    authConfigId: "ac_eVwXe0T2e18x",
    authMethod: "OAUTH2" as const,
  },
  google_sheets: {
    toolkitSlug: "GOOGLESHEETS",
    authConfigId: "ac_HMp19JBDehll",
    authMethod: "OAUTH2" as const,
  },
  notion: {
    toolkitSlug: "NOTION",
    authConfigId: "ac_qnZwhjqa0_0G",
    authMethod: "OAUTH2" as const,
  },
  google_drive: {
    toolkitSlug: "GOOGLEDRIVE",
    authConfigId: "ac_bKpGpNOEqi6b",
    authMethod: "OAUTH2" as const,
  },
  supabase: {
    toolkitSlug: "SUPABASE",
    authConfigId: "ac_cD0Oo3zzJ1LN",
    authMethod: "OAUTH2" as const,
  },
  hubspot: {
    toolkitSlug: "HUBSPOT",
    authConfigId: "ac_4wApPeiy20gY",
    authMethod: "OAUTH2" as const,
  },
  github: {
    toolkitSlug: "GITHUB",
    authConfigId: "ac_o3KOsPJkHSuT",
    authMethod: "OAUTH2" as const,
  },
  airtable: {
    toolkitSlug: "AIRTABLE",
    authConfigId: "ac_eopGkN8IR1Zd",
    authMethod: "OAUTH2" as const,
  },
  apaleo: {
    toolkitSlug: "APALEO",
    authConfigId: "ac_ViLJL3SA7sYx",
    authMethod: "OAUTH2" as const,
  },
  asana: {
    toolkitSlug: "ASANA",
    authConfigId: "ac_JPfqKptGlDaj",
    authMethod: "OAUTH2" as const,
  },
  attio: {
    toolkitSlug: "ATTIO",
    authConfigId: "ac_-lQHzixfgdeU",
    authMethod: "OAUTH2" as const,
  },
  basecamp: {
    toolkitSlug: "BASECAMP",
    authConfigId: "ac_hSC0XUr2Zgp9",
    authMethod: "OAUTH2" as const,
  },
  boldsign: {
    toolkitSlug: "BOLDSIGN",
    authConfigId: "ac_CQbD4ME6yOta",
    authMethod: "OAUTH2" as const,
  },
  blackbaud: {
    toolkitSlug: "BLACKBAUD",
    authConfigId: "ac_M6UEsdq7BSGs",
    authMethod: "OAUTH2" as const,
  },
  calendly: {
    toolkitSlug: "CALENDLY",
    authConfigId: "ac_MEBH4_695hTP",
    authMethod: "OAUTH2" as const,
  },
  google_calendar: {
    toolkitSlug: "GOOGLECALENDAR",
    authConfigId: "ac_U85-XZUW3boE",
    authMethod: "OAUTH2" as const,
  },
  google_super: {
    toolkitSlug: "GOOGLESUPER",
    authConfigId: "ac_W2ukHkjV8VYJ",
    authMethod: "OAUTH2" as const,
  },
  salesforce: {
    toolkitSlug: "SALESFORCE",
    authConfigId: "ac_W_VYKHzstDhk",
    authMethod: "OAUTH2" as const,
  },
  jira: {
    toolkitSlug: "JIRA",
    authConfigId: "ac_1oaeaLZvnnUd",
    authMethod: "OAUTH2" as const,
  },
  discord: {
    toolkitSlug: "DISCORD",
    authConfigId: "ac_u4f6wsUibIIe",
    authMethod: "OAUTH2" as const,
  },
  discord_bot: {
    toolkitSlug: "DISCORDBOT",
    authConfigId: "ac_9OGgK4V-seKW",
    authMethod: "OAUTH2" as const,
  },
  outlook: {
    toolkitSlug: "OUTLOOK",
    authConfigId: "ac_u1UxpgWxLS27",
    authMethod: "OAUTH2" as const,
  },
  trello: {
    toolkitSlug: "TRELLO",
    authConfigId: "ac_qIFFv047XNxw",
    authMethod: "OAUTH1" as const,
  },
} as const;
