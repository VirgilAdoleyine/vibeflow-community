import { serve } from "inngest/next";
import { inngest } from "@/lib/scheduler/client";
import { functions } from "@/lib/scheduler/trigger";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
