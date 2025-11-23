import { openai } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText, convertToModelMessages } from "ai";
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
    } else {
      return new Response(`Unsupported provider: ${provider}`, { status: 400 });
    }

    const result = streamText({
      model,
      messages: modelMessages,
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
