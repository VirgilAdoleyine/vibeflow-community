export type IntegrationStatus = "connected" | "disconnected" | "pending" | "error";

export interface Integration {
  id: string;
  provider: string;
  display_name: string;
  description: string;
  icon: string;
  color: string;
  status: IntegrationStatus;
  connected_at?: Date;
  scopes?: string[];
  auth_type?: "oauth" | "api_key" | "custom";
}

export interface ComposioIntegrationConfig {
  enabled: boolean;
  apiKey?: string;
  defaultApps?: string[];
}

export interface IntegrationConnection {
  id: string;
  user_id: string;
  provider: string;
  app_name: string;
  connection_id: string;
  status: IntegrationStatus;
  connected_at: Date;
  expires_at?: Date;
  scopes: string[];
}

export interface IntegrationMemory {
  id: string;
  user_id: string;
  provider: string;
  endpoint: string;
  script_template: string;
  success_count: number;
  embedding?: number[];
  created_at: Date;
  updated_at: Date;
}

export const SUPPORTED_INTEGRATIONS: Omit<
  Integration,
  "status" | "connected_at"
>[] = [
  {
    id: "slack",
    provider: "slack",
    display_name: "Slack",
    description: "Messages, channels, webhooks",
    icon: "💬",
    color: "#4A154B",
    scopes: ["chat:write", "channels:read"],
  },
  {
    id: "hubspot",
    provider: "hubspot",
    display_name: "HubSpot",
    description: "Contacts, deals, pipelines",
    icon: "🔶",
    color: "#FF7A59",
    scopes: ["contacts", "crm.objects.deals.read"],
  },
  {
    id: "notion",
    provider: "notion",
    display_name: "Notion",
    description: "Pages, databases, blocks",
    icon: "📝",
    color: "#000000",
    scopes: ["read_content", "update_content"],
  },
  {
    id: "gmail",
    provider: "gmail",
    display_name: "Gmail",
    description: "Read, send, label emails",
    icon: "📧",
    color: "#EA4335",
    scopes: ["gmail.readonly", "gmail.send"],
  },
  {
    id: "airtable",
    provider: "airtable",
    display_name: "Airtable",
    description: "Bases, tables, records",
    icon: "📊",
    color: "#18BFFF",
    scopes: ["data.records:read", "data.records:write"],
  },
  {
    id: "googlesheets",
    provider: "googlesheets",
    display_name: "Google Sheets",
    description: "Spreadsheets, formulas, charts",
    icon: "📗",
    color: "#34A853",
    scopes: ["spreadsheets", "spreadsheets.readonly"],
  },
  {
    id: "googledrive",
    provider: "googledrive",
    display_name: "Google Drive",
    description: "Files, folders, sharing",
    icon: "📁",
    color: "#4285F4",
    scopes: ["drive", "drive.readonly"],
  },
  {
    id: "googlecalendar",
    provider: "googlecalendar",
    display_name: "Google Calendar",
    description: "Events, schedules, reminders",
    icon: "📅",
    color: "#4285F4",
    scopes: ["calendar", "calendar.readonly"],
  },
  {
    id: "github",
    provider: "github",
    display_name: "GitHub",
    description: "Issues, PRs, repositories",
    icon: "🐙",
    color: "#181717",
    scopes: ["repo", "issues"],
  },
  {
    id: "salesforce",
    provider: "salesforce",
    display_name: "Salesforce",
    description: "CRM, contacts, opportunities",
    icon: "🔷",
    color: "#00A1E0",
    scopes: ["api", "refresh_token"],
  },
  {
    id: "jira",
    provider: "jira",
    display_name: "Jira",
    description: "Issues, projects, sprints",
    icon: "📋",
    color: "#0052CC",
    scopes: ["read:jira-work", "write:jira-work"],
  },
  {
    id: "discord",
    provider: "discord",
    display_name: "Discord",
    description: "Messages, channels, webhooks",
    icon: "🎮",
    color: "#5865F2",
    scopes: ["messages.read", "channels.read"],
  },
  {
    id: "calendly",
    provider: "calendly",
    display_name: "Calendly",
    description: "Events, scheduling, webhooks",
    icon: "📆",
    color: "#0068FF",
    scopes: ["scheduling", "webhooks"],
  },
  {
    id: "trello",
    provider: "trello",
    display_name: "Trello",
    description: "Boards, lists, cards",
    icon: "📌",
    color: "#0079BF",
    scopes: ["read", "write"],
  },
  {
    id: "asana",
    provider: "asana",
    display_name: "Asana",
    description: "Tasks, projects, workspaces",
    icon: "✅",
    color: "#F06A6A",
    scopes: ["default"],
  },
  {
    id: "outlook",
    provider: "outlook",
    display_name: "Outlook",
    description: "Emails, calendar, contacts",
    icon: "📩",
    color: "#0078D4",
    scopes: ["mail.read", "calendars.read"],
  },
  {
    id: "supabase",
    provider: "supabase",
    display_name: "Supabase",
    description: "Database, auth, storage",
    icon: "🐘",
    color: "#3ECF8E",
    scopes: ["schema", "auth"],
  },
  {
    id: "apaleo",
    provider: "apaleo",
    display_name: "Apaleo",
    description: "Hotel management, bookings",
    icon: "🏨",
    color: "#FF6B35",
    scopes: ["read", "write"],
  },
  {
    id: "attio",
    provider: "attio",
    display_name: "Attio",
    description: "CRM, contacts, companies",
    icon: "📠",
    color: "#6366F1",
    scopes: ["read", "write"],
  },
  {
    id: "basecamp",
    provider: "basecamp",
    display_name: "Basecamp",
    description: "Projects, to-dos, messages",
    icon: "🏕️",
    color: "#1F2D3D",
    scopes: ["read", "write"],
  },
  {
    id: "boldsign",
    provider: "boldsign",
    display_name: "BoldSign",
    description: "E-signatures, documents",
    icon: "✍️",
    color: "#FF6B35",
    scopes: ["read", "write"],
  },
  {
    id: "blackbaud",
    provider: "blackbaud",
    display_name: "Blackbaud",
    description: "Nonprofit CRM, fundraising",
    icon: "🎗️",
    color: "#6B2FA9",
    scopes: ["read", "write"],
  },
  {
    id: "googlesuper",
    provider: "googlesuper",
    display_name: "Google Super",
    description: "AI-powered search",
    icon: "⚡",
    color: "#4285F4",
    scopes: ["search"],
  },
  {
    id: "discordbot",
    provider: "discordbot",
    display_name: "Discord Bot",
    description: "Bot commands, automations",
    icon: "🤖",
    color: "#5865F2",
    scopes: ["bot"],
  },
];
