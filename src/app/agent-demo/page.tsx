"use client";

import { AppLayout } from "@/components/ai-elements/app-layout";
import {
  PromptInput,
  PromptInputProvider,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputAttachments,
  PromptInputAttachment,
} from "@/components/ai-elements/prompt-input";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  Confirmation,
  ConfirmationTitle,
  ConfirmationRequest,
  ConfirmationActions,
  ConfirmationAction,
  ConfirmationAccepted,
  ConfirmationRejected,
} from "@/components/ai-elements/confirmation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ModelProvider, useModel } from "@/contexts/model-context";
import { getModelsByProvider } from "@/lib/models";
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
import { useChat } from "@ai-sdk/react";
import * as aiHelpers from "ai";
import {
  DefaultChatTransport,
  type UIMessage,
  type ToolUIPart,
  type TextUIPart,
} from "ai";
import { ChevronDown, Play, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

type EventItem =
  | {
      kind: "tool";
      messageIndex: number;
      partIndex: number;
      toolName: string;
      state: ToolUIPart["state"];
      input?: unknown;
      output?: unknown;
      errorText?: string;
      at?: string;
    }
  | {
      kind: "note";
      messageIndex: number;
      partIndex: number;
      text: string;
    };

function useOnCallEvents(messages: UIMessage[]): EventItem[] {
  return useMemo(() => {
    const events: EventItem[] = [];
    messages.forEach((message, messageIndex) => {
      message.parts.forEach((part, partIndex) => {
        if (part.type === "text" && message.role === "assistant") {
          const t = part as TextUIPart;
          const text = String(t.text ?? "").trim();
          if (text) {
            events.push({ kind: "note", messageIndex, partIndex, text });
          }
        }
        if (part.type.startsWith("tool-")) {
          const toolPart = part as ToolUIPart;
          const toolName = toolPart.type.replace("tool-", "");
          const input = "input" in toolPart ? toolPart.input : undefined;
          const output = "output" in toolPart ? toolPart.output : undefined;
          const errorText =
            "errorText" in toolPart ? toolPart.errorText : undefined;

          const at =
            (typeof output === "object" &&
              output &&
              "at" in (output as Record<string, unknown>) &&
              typeof (output as Record<string, unknown>).at === "string" &&
              ((output as Record<string, unknown>).at as string)) ||
            undefined;

          events.push({
            kind: "tool",
            messageIndex,
            partIndex,
            toolName,
            state: toolPart.state,
            input,
            output,
            errorText,
            at,
          });
        }
      });
    });
    return events;
  }, [messages]);
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;

function OnCallConversation({
  messages,
  addToolApprovalResponse,
}: {
  messages: UIMessage[];
  addToolApprovalResponse?: (args: {
    id: string;
    approved: boolean;
    reason?: string;
  }) => void;
}) {
  return (
    <Conversation className="h-full">
      <ConversationContent>
        {messages.length === 0 ? (
          <ConversationEmptyState
            title="On-call servicing agent"
            description="Click Start to run the 3am incident scenario, then chat with the agent."
          />
        ) : (
          messages.map((message, index) => (
            <Message from={message.role} key={index}>
              <MessageContent>
                {message.parts.map((part, i) => {
                  if (part.type === "text") {
                    const textPart = part as TextUIPart;
                    return (
                      <MessageResponse key={`${message.role}-text-${i}`}>
                        {textPart.text}
                      </MessageResponse>
                    );
                  }

                  if (part.type.startsWith("tool-")) {
                    const toolPart = part as ToolUIPart;
                    const toolName = toolPart.type.replace("tool-", "");

                    // Special-case: approval-gated tool
                    if (toolName === "sendF5RedirectEmail") {
                      // The approval shape is not always present in ToolUIPart types yet.
                      const approval =
                        (
                          toolPart as unknown as {
                            approval?: {
                              id: string;
                              approved?: boolean;
                              reason?: string;
                            };
                          }
                        ).approval ?? undefined;
                      const toolId = (toolPart as unknown as { id: string }).id;
                      const approvalForUi =
                        approval && typeof approval.approved === "boolean"
                          ? {
                              id: approval.id,
                              approved: approval.approved,
                              reason: approval.reason,
                            }
                          : { id: approval?.id ?? toolId };
                      const approvalId = approvalForUi.id;

                      return (
                        <div
                          key={`${message.role}-tool-${i}`}
                          className="space-y-3"
                        >
                          <Tool defaultOpen>
                            <ToolHeader
                              title={toolName}
                              type={toolPart.type}
                              state={toolPart.state}
                            />
                            <ToolContent>
                              {"input" in toolPart && toolPart.input ? (
                                <ToolInput
                                  input={toolPart.input as ToolUIPart["input"]}
                                />
                              ) : null}
                              {"output" in toolPart ||
                              "errorText" in toolPart ? (
                                <ToolOutput
                                  output={
                                    "output" in toolPart
                                      ? (toolPart.output as ToolUIPart["output"])
                                      : undefined
                                  }
                                  errorText={
                                    "errorText" in toolPart
                                      ? toolPart.errorText
                                      : undefined
                                  }
                                />
                              ) : null}
                            </ToolContent>
                          </Tool>

                          <Confirmation
                            approval={approvalForUi}
                            state={toolPart.state}
                            className="border-yellow-200 bg-yellow-50/50"
                          >
                            <ConfirmationTitle className="font-medium">
                              Human approval required
                            </ConfirmationTitle>
                            <ConfirmationRequest>
                              <div className="text-sm text-muted-foreground">
                                The agent is ready to send the F5 redirect email
                                to mitigate customer impact. Approve or deny.
                              </div>
                              <ConfirmationActions>
                                <ConfirmationAction
                                  variant="secondary"
                                  onClick={() => {
                                    if (!addToolApprovalResponse) return;
                                    addToolApprovalResponse({
                                      id: approvalId,
                                      approved: false,
                                      reason: "Denied by on-call",
                                    });
                                  }}
                                >
                                  Deny
                                </ConfirmationAction>
                                <ConfirmationAction
                                  onClick={() => {
                                    if (!addToolApprovalResponse) return;
                                    addToolApprovalResponse({
                                      id: approvalId,
                                      approved: true,
                                    });
                                  }}
                                >
                                  Approve & Send
                                </ConfirmationAction>
                              </ConfirmationActions>
                            </ConfirmationRequest>
                            <ConfirmationAccepted>
                              <div className="text-sm">
                                Approved. The agent sent the email and is
                                continuing mitigation.
                              </div>
                            </ConfirmationAccepted>
                            <ConfirmationRejected>
                              <div className="text-sm">
                                Denied. The agent will page a human and propose
                                alternatives.
                              </div>
                            </ConfirmationRejected>
                          </Confirmation>
                        </div>
                      );
                    }

                    // Default tool rendering
                    return (
                      <Tool
                        key={`${message.role}-tool-${i}`}
                        defaultOpen={false}
                      >
                        <ToolHeader
                          title={toolName}
                          type={toolPart.type}
                          state={toolPart.state}
                        />
                        <ToolContent>
                          {"input" in toolPart && toolPart.input ? (
                            <ToolInput
                              input={toolPart.input as ToolUIPart["input"]}
                            />
                          ) : null}
                          {"output" in toolPart || "errorText" in toolPart ? (
                            <ToolOutput
                              output={
                                "output" in toolPart
                                  ? (toolPart.output as ToolUIPart["output"])
                                  : undefined
                              }
                              errorText={
                                "errorText" in toolPart
                                  ? toolPart.errorText
                                  : undefined
                              }
                            />
                          ) : null}
                        </ToolContent>
                      </Tool>
                    );
                  }

                  return null;
                })}
              </MessageContent>
            </Message>
          ))
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}

type ChatStatus = "ready" | "submitted" | "streaming" | "error";

type SendMessageOptions = {
  body: {
    provider: string;
    modelId: string;
  };
};

type UseChatShape = {
  messages: UIMessage[];
  status: ChatStatus;
  sendMessage: (
    message: { text: string },
    options?: SendMessageOptions
  ) => void;
  addToolApprovalResponse?: (args: {
    id: string;
    approved: boolean;
    reason?: string;
  }) => void;
};

function AgentDemoSession({ onReset }: { onReset: () => void }) {
  const { selectedModel, setSelectedModel } = useModel();

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/oncall" }),
    []
  );

  const sendAutomaticallyWhen =
    (aiHelpers as unknown as Record<string, unknown>)
      .lastAssistantMessageIsCompleteWithApprovalResponses ?? undefined;

  // addToolApprovalResponse is only present when tool-approval is supported.
  const chat = useChat({
    transport,
    // @ts-ignore - helper may not exist in current types
    sendAutomaticallyWhen,
  }) as unknown as UseChatShape;

  const messages = chat.messages ?? [];
  const status = chat.status ?? "ready";
  const sendMessage = chat.sendMessage;
  const addToolApprovalResponse = chat.addToolApprovalResponse;

  const events = useOnCallEvents(messages);

  const openaiModels = getModelsByProvider("openai");
  const localModels = getModelsByProvider("local");

  const incidentBadge = useMemo(() => {
    const lastSnapshot = [...events]
      .reverse()
      .find((e) => e.kind === "tool" && e.toolName === "getDynatraceSnapshot");
    const lastSnapshotPhase =
      lastSnapshot?.kind === "tool"
        ? asRecord(lastSnapshot.output)?.phase
        : undefined;

    const awaitingApproval = events.some(
      (e) =>
        e.kind === "tool" &&
        e.toolName === "sendF5RedirectEmail" &&
        e.state === "approval-requested"
    );
    const hasPaging = events.some(
      (e) => e.kind === "tool" && e.toolName === "pageHumanOnCall"
    );
    const hasEmailSent = events.some(
      (e) =>
        e.kind === "tool" &&
        e.toolName === "sendF5RedirectEmail" &&
        e.state === "output-available"
    );
    if (lastSnapshotPhase === "resolved")
      return { label: "Resolved", variant: "secondary" as const };
    if (awaitingApproval)
      return { label: "Awaiting Approval", variant: "secondary" as const };
    if (hasEmailSent || lastSnapshotPhase === "rerouted")
      return { label: "Mitigating", variant: "secondary" as const };
    if (hasPaging)
      return { label: "Human Paged", variant: "destructive" as const };
    if (messages.length > 0)
      return { label: "Monitoring", variant: "secondary" as const };
    return { label: "Idle", variant: "outline" as const };
  }, [events, messages.length]);

  return (
    <AppLayout
      header={
        <div className="flex items-center justify-between w-full gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-lg">On‑Call Servicing Agent</h1>
            <Badge variant={incidentBadge.variant}>{incidentBadge.label}</Badge>
          </div>

          <div className="flex items-center gap-2">
            <ModelSelector>
              <ModelSelectorTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <ModelSelectorLogo
                    provider={
                      selectedModel.provider === "openai"
                        ? "openai"
                        : "lmstudio"
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
                          onSelect={() => setSelectedModel(model)}
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
                            onSelect={() => setSelectedModel(model)}
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

            <Button
              size="sm"
              variant="secondary"
              className="gap-2"
              disabled={status === "streaming"}
              onClick={() => {
                sendMessage(
                  {
                    text: "Start the 3am incident response demo. Follow your runbook: check Dynatrace, take least-risk actions first, and only page a human when approval is required.",
                  },
                  {
                    body: {
                      provider: selectedModel.provider,
                      modelId: selectedModel.id,
                    },
                  }
                );
              }}
            >
              <Play className="size-4" />
              Start
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={onReset}
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </div>
      }
      conversation={
        <OnCallConversation
          messages={messages}
          addToolApprovalResponse={addToolApprovalResponse}
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
            <PromptInputTextarea placeholder="Ask the agent what happened, why it chose an action, or what to do next..." />
            <PromptInputSubmit status={status} />
          </PromptInputFooter>
        </PromptInput>
      }
      tools={
        <div className="space-y-3">
          <div className="text-sm font-medium">Event Log</div>
          <Separator />
          <ScrollArea className="h-[560px] pr-2">
            <div className="space-y-3">
              {events.length === 0 ? (
                <div className="text-muted-foreground text-sm py-6 text-center">
                  No events yet
                </div>
              ) : (
                events.map((e, idx) => {
                  if (e.kind === "note") {
                    const title =
                      e.text.split("\n").find(Boolean)?.slice(0, 80) ?? "Note";
                    return (
                      <Card key={idx} className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-medium">
                            Investigation Notes
                          </div>
                          <Badge variant="secondary">assistant</Badge>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                          {title}
                        </div>
                      </Card>
                    );
                  }

                  const isApproval = e.toolName === "sendF5RedirectEmail";
                  const isPaging = e.toolName === "pageHumanOnCall";
                  const isSnapshot = e.toolName === "getDynatraceSnapshot";

                  return (
                    <Card key={idx} className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium">
                          {isSnapshot
                            ? "Dynatrace Snapshot"
                            : isPaging
                            ? "Pager"
                            : isApproval
                            ? "F5 Redirect Email"
                            : e.toolName}
                        </div>
                        <Badge variant={isPaging ? "destructive" : "secondary"}>
                          {e.state}
                        </Badge>
                      </div>
                      {e.at && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {e.at}
                        </div>
                      )}
                      {isSnapshot &&
                      typeof e.output === "object" &&
                      e.output ? (
                        <div className="mt-2 text-sm text-muted-foreground space-y-1">
                          <div>
                            {String(
                              asRecord(asRecord(e.output)?.health)?.summary ??
                                ""
                            )}
                          </div>
                          <div className="text-xs">
                            phase: {String(asRecord(e.output)?.phase ?? "")} ·
                            errorRate:{" "}
                            {String(
                              asRecord(asRecord(e.output)?.metrics)
                                ?.errorRatePct ?? ""
                            )}
                            % · p95:{" "}
                            {String(
                              asRecord(asRecord(e.output)?.metrics)
                                ?.p95LatencyMs ?? ""
                            )}
                            ms
                          </div>
                        </div>
                      ) : null}
                      {isApproval &&
                      typeof e.output === "object" &&
                      e.output &&
                      "ticketId" in (e.output as Record<string, unknown>) ? (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Change ticket:{" "}
                          {String(asRecord(e.output)?.ticketId ?? "")}
                        </div>
                      ) : null}
                      {isPaging &&
                      typeof e.output === "object" &&
                      e.output &&
                      "pageId" in (e.output as Record<string, unknown>) ? (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Paged human (id:{" "}
                          {String(asRecord(e.output)?.pageId ?? "")})
                        </div>
                      ) : null}
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      }
      reasoning={
        <div className="space-y-2">
          <div className="text-sm font-medium">What the agent saw</div>
          <div className="text-sm text-muted-foreground">
            Open the “Tools” panel entries for detailed inputs/outputs
            (Dynatrace logs, restart results, email draft, etc.). This panel
            stays human-friendly.
          </div>
        </div>
      }
      canvas={
        <div className="space-y-2">
          <div className="text-sm font-medium">What the agent did</div>
          <div className="text-sm text-muted-foreground">
            Use the Event Log timeline to replay actions. Approval-gated actions
            show as “Awaiting Approval”.
          </div>
        </div>
      }
      defaultSidebarOpen
      hasMessages={messages.length > 0}
      emptyStateTitle="On‑Call Servicing Agent (Dynatrace Demo)"
      emptyStateDescription="Click Start to run the 3am incident scenario. The agent will act first; you only get paged if approval is needed."
    />
  );
}

export default function AgentDemoPage() {
  const [sessionKey, setSessionKey] = useState(0);
  return (
    <ModelProvider>
      <PromptInputProvider>
        <AgentDemoSession
          key={sessionKey}
          onReset={() => setSessionKey((k) => k + 1)}
        />
      </PromptInputProvider>
    </ModelProvider>
  );
}
