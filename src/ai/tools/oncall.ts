import { tool } from "ai";
import { z } from "zod";
import {
  getDynatraceSnapshotForPhase,
  type OnCallScenarioId,
  type OnCallScenarioPhase,
} from "@/ai/oncall/scenario";

const ScenarioIdSchema = z
  .literal("dynatrace-3am-demo")
  .default("dynatrace-3am-demo");

const PhaseSchema = z
  .enum([
    "incident",
    "post-restart-good",
    "post-restart-bad",
    "rerouted",
    "resolved",
  ])
  .default("incident");

export const getDynatraceSnapshotTool = tool({
  description:
    "Get a Dynatrace snapshot (simulated) for the current incident phase.",
  inputSchema: z.object({
    scenarioId: ScenarioIdSchema,
    phase: PhaseSchema.describe(
      "Scenario phase; use the latest phase you observed or the recommendedNextPhase from the last snapshot."
    ),
  }),
  execute: async ({ scenarioId, phase }) => {
    const snapshot = getDynatraceSnapshotForPhase(
      scenarioId as OnCallScenarioId,
      phase as OnCallScenarioPhase
    );
    return snapshot;
  },
});

export const restartServiceTool = tool({
  description:
    "Restart a service in a region (simulated). Use when the service is degraded and a quick restart might recover it.",
  inputSchema: z.object({
    serviceName: z.string().default("orders-api"),
    region: z.enum(["azure-east", "azure-central"]).default("azure-east"),
    scenarioId: ScenarioIdSchema,
    currentPhase: PhaseSchema,
  }),
  execute: async ({ serviceName, region, currentPhase }) => {
    return {
      action: "restart-service",
      serviceName,
      region,
      outcome: "restarted",
      note: "Service restarted successfully. Monitor closely; issue may recur if underlying dependency is unhealthy.",
      previousPhase: currentPhase,
      nextPhase: (currentPhase === "incident"
        ? "post-restart-good"
        : currentPhase) satisfies OnCallScenarioPhase,
      recommendedNextStep: {
        tool: "getDynatraceSnapshot",
        phase: currentPhase === "incident" ? "post-restart-good" : currentPhase,
      },
      at: new Date().toISOString(),
    };
  },
});

export const prepareF5RedirectTool = tool({
  description:
    "Prepare an F5 redirect change (simulated) including an email draft to the F5 team.",
  inputSchema: z.object({
    fromRegion: z.enum(["azure-east", "azure-central"]).default("azure-east"),
    toRegion: z.enum(["azure-east", "azure-central"]).default("azure-central"),
    serviceName: z.string().default("orders-api"),
    scenarioId: ScenarioIdSchema,
    currentPhase: PhaseSchema,
  }),
  execute: async ({ fromRegion, toRegion, serviceName, currentPhase }) => {
    const subject = `[URGENT] Request: F5 redirect ${serviceName} traffic ${fromRegion} -> ${toRegion}`;
    const body = `Hello F5 Team,

We are currently in an active incident impacting ${serviceName} in ${fromRegion}.

Summary:
- Time: ${new Date().toISOString()}
- Impact: Sustained 5xx errors in ${fromRegion}
- Recent action: Service restart attempted ~3 minutes ago; issue recurred

Request:
Please implement an emergency traffic redirect for ${serviceName} from ${fromRegion} to ${toRegion} until further notice.

Rollback plan:
- Revert redirect once ${fromRegion} is healthy for 30 minutes and incident commander confirms.

Thank you,
On-call Servicing Agent (Demo)
`;

    return {
      action: "prepare-f5-redirect",
      previousPhase: currentPhase,
      nextPhase: "rerouted" as const,
      changeSummary: {
        fromRegion,
        toRegion,
        serviceName,
        risk: "medium",
        expectedImpact:
          "Mitigate customer impact by shifting traffic to healthy region",
      },
      emailDraft: {
        to: "f5-team@company.com",
        subject,
        body,
      },
      note: "This action requires human approval before sending the email to the F5 team.",
      at: new Date().toISOString(),
    };
  },
});

const sendF5RedirectEmailToolConfig = {
  description:
    "Send an email to the F5 team to request a traffic redirect (simulated). Requires human approval.",
  inputSchema: z.object({
    to: z.string().email(),
    subject: z.string(),
    body: z.string(),
    scenarioId: ScenarioIdSchema,
    nextPhase: PhaseSchema.default("rerouted"),
  }),
  // Human-in-the-loop gate.
  // Runtime supports this; types may lag behind depending on AI SDK version.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  needsApproval: true,
  execute: async ({
    to,
    subject,
    body,
    nextPhase,
  }: {
    to: string;
    subject: string;
    body: string;
    scenarioId: "dynatrace-3am-demo";
    nextPhase:
      | "incident"
      | "post-restart-good"
      | "post-restart-bad"
      | "rerouted"
      | "resolved";
  }) => {
    return {
      action: "send-f5-redirect-email",
      sent: true,
      to,
      subject,
      bodyPreview: body.slice(0, 240),
      ticketId: `CHG-${Math.floor(100000 + Math.random() * 900000)}`,
      nextPhase,
      at: new Date().toISOString(),
    };
  },
} as unknown as Parameters<typeof tool>[0];

export const sendF5RedirectEmailTool = tool(sendF5RedirectEmailToolConfig);

export const pageHumanOnCallTool = tool({
  description:
    "Page the human on-call engineer (simulated). Use only when approval is required or automated actions are exhausted.",
  inputSchema: z.object({
    reason: z.string(),
    severity: z.enum(["warning", "critical"]).default("critical"),
  }),
  execute: async ({ reason, severity }) => {
    return {
      action: "page-human-oncall",
      severity,
      reason,
      pageId: `PAGE-${Math.floor(1000 + Math.random() * 9000)}`,
      at: new Date().toISOString(),
    };
  },
});
