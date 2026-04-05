import { NextRequest } from "next/server";
import { getExecution, getExecutionLogs } from "@/lib/db/executions";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const execution = await getExecution(params.id);
    if (!execution) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const logs = await getExecutionLogs(params.id);

    return new Response(JSON.stringify({ execution, logs }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Database unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}
