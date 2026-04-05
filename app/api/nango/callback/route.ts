import { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * Nango redirects here after a successful OAuth flow.
 * We simply close the popup and notify the parent window.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const providerConfigKey = searchParams.get("provider_config_key") ?? "";
  const connectionId = searchParams.get("connection_id") ?? "";
  const success = !searchParams.get("error");

  // Close popup and post message to parent
  const html = `<!DOCTYPE html>
<html>
<head><title>Connecting…</title></head>
<body>
<script>
  if (window.opener) {
    window.opener.postMessage(
      {
        type: "NANGO_CALLBACK",
        provider: ${JSON.stringify(providerConfigKey)},
        connectionId: ${JSON.stringify(connectionId)},
        success: ${success},
        error: ${JSON.stringify(searchParams.get("error") ?? null)}
      },
      window.location.origin
    );
  }
  window.close();
</script>
<p>Connected! You can close this window.</p>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
