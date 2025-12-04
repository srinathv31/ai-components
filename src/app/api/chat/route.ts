import { readFileTool } from "@/ai/tools/file-server";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import type { UIMessage } from "ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, provider, modelId } = body;
    console.log(body);

    if (!messages || !Array.isArray(messages)) {
      return new Response("Messages array is required", { status: 400 });
    }

    if (!provider || !modelId) {
      return new Response("Provider and modelId are required", { status: 400 });
    }

    // Convert UIMessage[] to ModelMessage[] format
    const modelMessages = convertToModelMessages(messages as UIMessage[]);

    let model;

    // Switch between providers
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
      // For local models, use the modelId from the request
      // LM Studio typically uses model names like "llama-3.1-8b-instruct" or similar
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
      system:
        "You are a helpful employee onboarding assistant. You can read files from the file server to supplement the information you need to answer the user's question. You primarily help developers get started with the company and the technology stack. The read file tool takes in a file path but it returns a static string of the file content so you don't need a filePath parameter.",
      messages: modelMessages,
      tools: { readFile: readFileTool },
      stopWhen: stepCountIs(10),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error in chat API route:", error);
    return new Response(
      error instanceof Error ? error.message : "Internal server error",
      { status: 500 }
    );
  }
}
