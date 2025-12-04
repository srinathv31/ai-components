"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Panel } from "./panel";
import {
  LayoutPanelLeftIcon,
  WrenchIcon,
  BrainIcon,
  WorkflowIcon,
  ChevronRightIcon,
} from "lucide-react";

export type AppLayoutProps = ComponentProps<"div"> & {
  header?: ReactNode;
  conversation: ReactNode;
  promptInput: ReactNode;
  tools?: ReactNode;
  reasoning?: ReactNode;
  canvas?: ReactNode;
  showSidebar?: boolean;
  defaultSidebarOpen?: boolean;
  hasMessages?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
};

export const AppLayout = ({
  className,
  header,
  conversation,
  promptInput,
  tools,
  reasoning,
  canvas,
  showSidebar = true,
  defaultSidebarOpen = false,
  hasMessages = false,
  emptyStateTitle = "Start a conversation",
  emptyStateDescription = "Ask me anything to get started",
  ...props
}: AppLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(defaultSidebarOpen);
  const [activePanel, setActivePanel] = useState<
    "tools" | "reasoning" | "canvas" | null
  >(null);

  const hasPanels = !!(tools || reasoning || canvas);

  return (
    <div
      className={cn(
        "flex h-screen w-full flex-col overflow-hidden bg-background",
        className
      )}
      {...props}
    >
      {/* Header */}
      {header && (
        <header className="flex shrink-0 items-center border-b px-4 py-3">
          {header}
        </header>
      )}

      {/* Main Content Area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Conversation Area */}
        <main className="relative flex flex-1 flex-col overflow-hidden px-6 md:px-12 lg:px-16">
          <div className="mx-auto flex h-full w-full max-w-4xl flex-col">
            {hasMessages ? (
              <>
                {/* Conversation */}
                <div className="flex-1 overflow-hidden">{conversation}</div>

                {/* Floating Prompt Input at Bottom */}
                <div className="relative pb-4">
                  <div className="absolute inset-x-0 -top-8 h-8 bg-linear-to-t from-background to-transparent pointer-events-none" />
                  <div className="relative rounded-xl border bg-background shadow-lg">
                    {promptInput}
                  </div>
                </div>
              </>
            ) : (
              /* Centered Empty State with Input */
              <div className="flex flex-1 flex-col items-center justify-center gap-6 pb-20">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {emptyStateTitle}
                  </h2>
                  <p className="text-muted-foreground">
                    {emptyStateDescription}
                  </p>
                </div>
                <div className="w-full max-w-2xl">
                  <div className="rounded-xl border bg-background shadow-lg">
                    {promptInput}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Sidebar with Panels */}
        {showSidebar && hasPanels && (
          <aside
            className={cn(
              "flex shrink-0 flex-col border-l bg-card transition-all duration-300",
              isSidebarOpen ? "w-96" : "w-0 border-0"
            )}
          >
            {isSidebarOpen && (
              <div className="flex h-full flex-col overflow-hidden">
                {/* Panel Tabs */}
                <div className="flex border-b">
                  {tools && (
                    <Button
                      variant={activePanel === "tools" ? "secondary" : "ghost"}
                      className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                      onClick={() =>
                        setActivePanel(activePanel === "tools" ? null : "tools")
                      }
                    >
                      <WrenchIcon className="mr-2 size-4" />
                      Tools
                    </Button>
                  )}
                  {reasoning && (
                    <Button
                      variant={
                        activePanel === "reasoning" ? "secondary" : "ghost"
                      }
                      className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                      onClick={() =>
                        setActivePanel(
                          activePanel === "reasoning" ? null : "reasoning"
                        )
                      }
                    >
                      <BrainIcon className="mr-2 size-4" />
                      Reasoning
                    </Button>
                  )}
                  {canvas && (
                    <Button
                      variant={activePanel === "canvas" ? "secondary" : "ghost"}
                      className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                      onClick={() =>
                        setActivePanel(
                          activePanel === "canvas" ? null : "canvas"
                        )
                      }
                    >
                      <WorkflowIcon className="mr-2 size-4" />
                      Canvas
                    </Button>
                  )}
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {activePanel === "tools" && tools && (
                    <div className="space-y-4">{tools}</div>
                  )}
                  {activePanel === "reasoning" && reasoning && (
                    <div className="space-y-4">{reasoning}</div>
                  )}
                  {activePanel === "canvas" && canvas && (
                    <div className="h-full">{canvas}</div>
                  )}
                  {!activePanel && (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                      Select a panel to view
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Sidebar Toggle Button */}
        {showSidebar && hasPanels && (
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute top-4 z-10 rounded-full transition-all duration-300",
              isSidebarOpen ? "right-100" : "right-2"
            )}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <LayoutPanelLeftIcon
              className={cn(
                "size-4 transition-transform",
                isSidebarOpen && "rotate-180"
              )}
            />
          </Button>
        )}
      </div>
    </div>
  );
};
