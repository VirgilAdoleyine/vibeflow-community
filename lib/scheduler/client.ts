import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "vibeflow",
  name: "VibeFlow",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// ─── Event types ─────────────────────────────────────────────────────────────

export type VibeFlowEvents = {
  "automation/run": {
    data: {
      userId: string;
      prompt: string;
      threadId: string;
      executionId: string;
    };
  };
  "automation/scheduled": {
    data: {
      scheduleId: string;
      userId: string;
      prompt: string;
    };
  };
  "automation/webhook": {
    data: {
      scheduleId: string;
      userId: string;
      prompt: string;
      payload: unknown;
    };
  };
};
