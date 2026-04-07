import { NextRequest } from "next/server";
import { getExecution, getExecutionLogs } from "@/lib/db/executions";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const execution = await getExecution(id);
    if (!execution) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const logs = await getExecutionLogs(id);

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
