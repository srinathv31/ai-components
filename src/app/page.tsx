"use client";

import { AppLayout } from "@/components/ai-elements/app-layout";
import Conversation from "@/components/chat/conversation";
import {
  PromptInput,
  PromptInputProvider,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputAttachments,
  PromptInputAttachment,
} from "@/components/ai-elements/prompt-input";
import { useChat } from "@ai-sdk/react";
import { useMemo, useState, useEffect } from "react";
import { DefaultChatTransport } from "ai";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import { Canvas } from "@/components/ai-elements/canvas";
import type { UIMessage, ToolUIPart, ReasoningUIPart } from "ai";
import { ModelProvider, useModel } from "@/contexts/model-context";
import {
  ModelSelector,
  ModelSelectorTrigger,
  ModelSelectorContent,
  ModelSelectorInput,
  ModelSelectorList,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorItem,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorSeparator,
} from "@/components/ai-elements/model-selector";
import { Button } from "@/components/ui/button";
import { getModelsByProvider } from "@/lib/models";
import { ChevronDown } from "lucide-react";

function ChatContent() {
  const { selectedModel, setSelectedModel } = useModel();
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);

  const transport = useMemo(() => new DefaultChatTransport(), []);

  const { messages, status, sendMessage } = useChat({
    transport,
  });

  // log out the selected model when the selected model changes
  useEffect(() => {
    console.log(selectedModel);
  }, [selectedModel]);

  // Extract tools, reasoning, and canvas data from messages
  const toolsData = useMemo(() => {
    const tools: Array<{
      toolName: string;
      state: ToolUIPart["state"];
      input?: unknown;
      output?: unknown;
      errorText?: string;
    }> = [];
    messages.forEach((message: UIMessage) => {
      message.parts.forEach((part) => {
        if (part.type.startsWith("tool-")) {
          const toolPart = part as ToolUIPart;
          const toolName = toolPart.type.replace("tool-", "");
          tools.push({
            toolName,
            state: toolPart.state,
            input: "input" in toolPart ? toolPart.input : undefined,
            output: "output" in toolPart ? toolPart.output : undefined,
            errorText: "errorText" in toolPart ? toolPart.errorText : undefined,
          });
        }
      });
    });
    return tools;
  }, [messages]);

  const reasoningData = useMemo(() => {
    const reasoning: string[] = [];
    messages.forEach((message: UIMessage) => {
      message.parts.forEach((part) => {
        if (part.type === "reasoning") {
          const reasoningPart = part as ReasoningUIPart;
          // Try to extract reasoning text from the part
          const reasoningText =
            "reasoning" in reasoningPart
              ? String(reasoningPart.reasoning || "")
              : "text" in reasoningPart
              ? String(reasoningPart.text || "")
              : "";
          if (reasoningText) {
            reasoning.push(reasoningText);
          }
        }
      });
    });
    return reasoning;
  }, [messages]);

  const openaiModels = getModelsByProvider("openai");
  const localModels = getModelsByProvider("local");

  return (
    <AppLayout
      header={
        <div className="flex items-center justify-between w-full">
          <h1 className="font-semibold text-lg">AI Chat</h1>
          <ModelSelector
            open={modelSelectorOpen}
            onOpenChange={setModelSelectorOpen}
          >
            <ModelSelectorTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ModelSelectorLogo
                  provider={
                    selectedModel.provider === "openai" ? "openai" : "lmstudio"
                  }
                />
                <span className="hidden sm:inline">{selectedModel.name}</span>
                <ChevronDown className="size-4 opacity-50" />
              </Button>
            </ModelSelectorTrigger>
            <ModelSelectorContent>
              <ModelSelectorInput placeholder="Search models..." />
              <ModelSelectorList>
                <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                {openaiModels.length > 0 && (
                  <ModelSelectorGroup heading="OpenAI">
                    {openaiModels.map((model) => (
                      <ModelSelectorItem
                        key={model.id}
                        onSelect={() => {
                          setSelectedModel(model);
                          setModelSelectorOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        <ModelSelectorLogo provider="openai" />
                        <ModelSelectorName>{model.name}</ModelSelectorName>
                      </ModelSelectorItem>
                    ))}
                  </ModelSelectorGroup>
                )}
                {localModels.length > 0 && (
                  <>
                    {openaiModels.length > 0 && <ModelSelectorSeparator />}
                    <ModelSelectorGroup heading="Local (LM Studio)">
                      {localModels.map((model) => (
                        <ModelSelectorItem
                          key={model.id}
                          onSelect={() => {
                            setSelectedModel(model);
                            setModelSelectorOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <ModelSelectorLogo provider="lmstudio" />
                          <ModelSelectorName>{model.name}</ModelSelectorName>
                        </ModelSelectorItem>
                      ))}
                    </ModelSelectorGroup>
                  </>
                )}
              </ModelSelectorList>
            </ModelSelectorContent>
          </ModelSelector>
        </div>
      }
      conversation={
        <Conversation
          messages={messages}
          status={status as "idle" | "streaming" | "error"}
        />
      }
      promptInput={
        <PromptInput
          onSubmit={async (message) => {
            sendMessage(
              { text: message.text },
              {
                body: {
                  provider: selectedModel.provider,
                  modelId: selectedModel.id,
                },
              }
            );
          }}
        >
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
          <PromptInputFooter>
            <PromptInputTextarea placeholder="Type your message..." />
            <PromptInputSubmit status={status} />
          </PromptInputFooter>
        </PromptInput>
      }
      tools={
        toolsData.length > 0 ? (
          <>
            {toolsData.map((tool, index) => (
              <Tool key={index} defaultOpen={index === toolsData.length - 1}>
                <ToolHeader
                  title={tool.toolName}
                  type="tool-call"
                  state={tool.state}
                />
                <ToolContent>
                  {tool.input ? (
                    <ToolInput input={tool.input as ToolUIPart["input"]} />
                  ) : null}
                  {tool.output || tool.errorText ? (
                    <ToolOutput
                      output={tool.output as ToolUIPart["output"]}
                      errorText={tool.errorText}
                    />
                  ) : null}
                </ToolContent>
              </Tool>
            ))}
          </>
        ) : (
          <div className="text-muted-foreground text-sm text-center py-8">
            No tools used yet
          </div>
        )
      }
      reasoning={
        reasoningData.length > 0 ? (
          <>
            {reasoningData.map((reasoning, index) => (
              <Reasoning
                key={index}
                isStreaming={
                  status === "streaming" && index === reasoningData.length - 1
                }
                defaultOpen={index === reasoningData.length - 1}
              >
                <ReasoningTrigger />
                <ReasoningContent>{reasoning}</ReasoningContent>
              </Reasoning>
            ))}
          </>
        ) : (
          <div className="text-muted-foreground text-sm text-center py-8">
            No reasoning available
          </div>
        )
      }
      canvas={
        <div className="h-[600px] w-full">
          <Canvas>{/* Canvas nodes and edges can be added here */}</Canvas>
        </div>
      }
      defaultSidebarOpen={false}
      hasMessages={messages.length > 0}
    />
  );
}

export default function Home() {
  return (
    <ModelProvider>
      <PromptInputProvider>
        <ChatContent />
      </PromptInputProvider>
    </ModelProvider>
  );
}
