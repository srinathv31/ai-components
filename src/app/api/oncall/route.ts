import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  getDynatraceSnapshotTool,
  pageHumanOnCallTool,
  prepareF5RedirectTool,
  restartServiceTool,
  sendF5RedirectEmailTool,
} from "@/ai/tools/oncall";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `
You are an AI Servicing Agent that monitors Dynatrace 24/7 and acts as the on-call assistant.

You have tools to:
- getDynatraceSnapshot: read the latest Dynatrace snapshot for the incident phase
- restartService: restart a service
- prepareF5Redirect: draft an email requesting an F5 traffic redirect
- sendF5RedirectEmail: send the email (REQUIRES HUMAN APPROVAL)
- pageHumanOnCall: page the on-call human only when necessary

Communication requirements:
- Write concise, human-friendly "Investigation Notes" (no hidden chain-of-thought). Explain what you observed, what you tried, and why.
- When you need human authorization (sendF5RedirectEmail), you MUST:
  1) prepareF5Redirect to produce the email draft
  2) call sendF5RedirectEmail with that draft
  3) immediately call pageHumanOnCall explaining what you need approved
- Prefer minimizing human wakeups. Page only when approval is required or automated options are exhausted.

Operational behavior (demo story):
- Start by calling getDynatraceSnapshot with scenarioId "dynatrace-3am-demo" and phase "incident".
- If the snapshot shows mixed 4xx/5xx and elevated latency, try restartService in azure-east and then re-check via getDynatraceSnapshot using the recommended next phase.
- If errors return quickly and are sustained 5xx after a recent restart, do NOT restart again. Prepare an F5 redirect (azure-east -> azure-central) and request approval to send the email.
- After email is sent/approved, re-check via getDynatraceSnapshot with phase "rerouted" and summarize the mitigation + next steps.
`.trim();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, provider, modelId } = body as {
      messages: UIMessage[];
      provider?: "openai" | "local" | "google";
      modelId?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response("Messages array is required", { status: 400 });
    }

    if (!provider || !modelId) {
      return new Response("Provider and modelId are required", { status: 400 });
    }

    const modelMessages = convertToModelMessages(messages);

    let model;
    if (provider === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return new Response(
          "OPENAI_API_KEY is not configured in environment variables",
          { status: 500 }
        );
      }
      model = openai(modelId);
    } else if (provider === "local") {
      const baseURL =
        process.env.LMSTUDIO_BASE_URL || "http://localhost:1234/v1";
      const openaiCompatible = createOpenAICompatible({
        name: "lmstudio",
        baseURL,
      });
      model = openaiCompatible(modelId);
    } else if (provider === "google") {
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return new Response(
          "GOOGLE_GENERATIVE_AI_API_KEY is not configured in environment variables",
          { status: 500 }
        );
      }
      model = google("gemini-2.5-pro");
    } else {
      return new Response(`Unsupported provider: ${provider}`, { status: 400 });
    }

    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      tools: {
        getDynatraceSnapshot: getDynatraceSnapshotTool,
        restartService: restartServiceTool,
        prepareF5Redirect: prepareF5RedirectTool,
        sendF5RedirectEmail: sendF5RedirectEmailTool,
        pageHumanOnCall: pageHumanOnCallTool,
      },
      stopWhen: stepCountIs(20),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error in oncall API route:", error);
    return new Response(
      error instanceof Error ? error.message : "Internal server error",
      { status: 500 }
    );
  }
}
