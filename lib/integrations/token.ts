import { getNangoClient } from "./client";
import { SUPPORTED_INTEGRATIONS } from "@/types/integration";

/**
 * Fetch all available integration tokens for a user.
 * Returns a map of { provider: accessToken }.
 * Silently skips any provider that isn't connected.
 */
export async function fetchUserTokens(
  userId: string
): Promise<Record<string, string>> {
  const nango = getNangoClient();
  const tokens: Record<string, string> = {};

  await Promise.allSettled(
    SUPPORTED_INTEGRATIONS.map(async ({ provider }) => {
      try {
        const connection = await nango.getConnection(provider, userId);
        const credentials = connection?.credentials as
          | { access_token?: string; token?: string; api_key?: string }
          | undefined;

        const token =
          credentials?.access_token ||
          credentials?.token ||
          credentials?.api_key;

        if (token) {
          tokens[provider] = token;
        }
      } catch {
        // Not connected — skip silently
      }
    })
  );

  return tokens;
}

/**
 * Fetch a token for a single provider.
 * Throws if not connected.
 */
export async function fetchToken(
  provider: string,
  userId: string
): Promise<string> {
  const nango = getNangoClient();

  const connection = await nango.getConnection(provider, userId);
  const credentials = connection?.credentials as
    | { access_token?: string; token?: string; api_key?: string }
    | undefined;

  const token =
    credentials?.access_token || credentials?.token || credentials?.api_key;

  if (!token) {
    throw new Error(`No token found for provider: ${provider}`);
  }

  return token;
}

/**
 * Detect which integrations a prompt likely needs,
 * so we only fetch the tokens we actually need.
 */
export function detectRequiredProviders(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const required: string[] = [];

  const keywords: Record<string, string[]> = {
    shopify: ["shopify", "order", "product", "customer", "store"],
    slack: ["slack", "message", "channel", "notify", "post"],
    hubspot: ["hubspot", "crm", "contact", "deal", "pipeline"],
    notion: ["notion", "page", "database", "doc"],
    "google-mail": ["gmail", "email", "mail", "inbox"],
    airtable: ["airtable", "base", "table", "record"],
  };

  for (const [provider, terms] of Object.entries(keywords)) {
    if (terms.some((term) => lower.includes(term))) {
      required.push(provider);
    }
  }

  return required;
}
