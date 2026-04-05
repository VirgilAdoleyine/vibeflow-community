import { getSandbox } from "./client";

export interface SandboxResult {
  result: unknown;
  stdout: string;
  stderr: string;
  error: string | null;
  duration_ms: number;
}

/**
 * Map our internal token keys to env var names the script can use.
 */
function buildEnvVars(tokens: Record<string, string>): Record<string, string> {
  const envMap: Record<string, string> = {};

  for (const [provider, token] of Object.entries(tokens)) {
    const key = provider.toUpperCase().replace(/-/g, "_");
    envMap[`${key}_TOKEN`] = token;
  }

  return envMap;
}

/**
 * Run a Python script in the E2B sandbox.
 * Injects integration tokens as environment variables.
 * Expects the script to print JSON to stdout on the final line.
 */
export async function runInSandbox(
  script: string,
  tokens: Record<string, string> = {}
): Promise<SandboxResult> {
  const start = Date.now();

  try {
    const sandbox = await getSandbox();
    const envVars = buildEnvVars(tokens);

    // Write the script to a temp file
    const scriptPath = `/tmp/script_${Date.now()}.py`;
    await sandbox.files.write(scriptPath, script);

    // Build env var export string for the shell command
    const envStr = Object.entries(envVars)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(" ");

    const cmd = envStr
      ? `env ${envStr} python3 ${scriptPath}`
      : `python3 ${scriptPath}`;

    const output = await sandbox.commands.run(cmd, { timeoutMs: 25_000 });

    const stdout = output.stdout || "";
    const stderr = output.stderr || "";
    const duration_ms = Date.now() - start;

    if (output.exitCode !== 0) {
      return {
        result: null,
        stdout,
        stderr,
        error: stderr || `Process exited with code ${output.exitCode}`,
        duration_ms,
      };
    }

    // Parse the last non-empty line as JSON (our contract with the LLM)
    const lines = stdout.trim().split("\n").filter(Boolean);
    const lastLine = lines[lines.length - 1] || "{}";

    let result: unknown = lastLine;
    try {
      result = JSON.parse(lastLine);
    } catch {
      // Script printed non-JSON — treat as string result
      result = { status: "success", data: stdout, summary: lastLine };
    }

    return { result, stdout, stderr, error: null, duration_ms };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return {
      result: null,
      stdout: "",
      stderr: error,
      error,
      duration_ms: Date.now() - start,
    };
  }
}
