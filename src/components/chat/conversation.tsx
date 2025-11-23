"use client";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageAttachments,
  MessageAttachment,
} from "@/components/ai-elements/message";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
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
import type {
  UIMessage,
  ToolUIPart,
  ReasoningUIPart,
  TextUIPart,
  FileUIPart,
} from "ai";

interface ChatConversationProps {
  messages: UIMessage[];
  status: "idle" | "streaming" | "error";
}

const ChatConversation = ({ messages, status }: ChatConversationProps) => {
  return (
    <Conversation className="h-full">
      <ConversationContent>
        {messages.length === 0 ? (
          <ConversationEmptyState
            title="Start a conversation"
            description="Ask me anything to get started"
          />
        ) : (
          messages.map((message: UIMessage, index) => (
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
                  if (part.type === "file") {
                    const filePart = part as FileUIPart;
                    return (
                      <MessageAttachments key={`${message.role}-file-${i}`}>
                        <MessageAttachment data={filePart} />
                      </MessageAttachments>
                    );
                  }
                  if (part.type.startsWith("tool-")) {
                    const toolPart = part as ToolUIPart;
                    const toolName = toolPart.type.replace("tool-", "");
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
                  if (part.type === "reasoning") {
                    const reasoningPart = part as ReasoningUIPart;
                    // Try to extract reasoning text from various possible properties
                    const reasoningText =
                      "reasoning" in reasoningPart
                        ? String(reasoningPart.reasoning || "")
                        : "text" in reasoningPart
                        ? String(reasoningPart.text || "")
                        : "";
                    return (
                      <Reasoning
                        key={`${message.role}-reasoning-${i}`}
                        isStreaming={status === "streaming"}
                        defaultOpen={false}
                      >
                        <ReasoningTrigger />
                        <ReasoningContent>{reasoningText}</ReasoningContent>
                      </Reasoning>
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
};

export default ChatConversation;
