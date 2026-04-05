export type IntegrationStatus = "connected" | "disconnected" | "error";

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
}

export interface NangoConnection {
  id: string;
  provider_config_key: string;
  connection_id: string;
  created_at: string;
  updated_at: string;
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
    id: "shopify",
    provider: "shopify",
    display_name: "Shopify",
    description: "Orders, products, customers",
    icon: "🛒",
    color: "#96BF48",
    scopes: ["read_orders", "read_products", "read_customers"],
  },
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
    provider: "google-mail",
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
];
