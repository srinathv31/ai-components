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
  ...props
}: AppLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(defaultSidebarOpen);
  const [activePanel, setActivePanel] = useState<"tools" | "reasoning" | "canvas" | null>(
    null
  );

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
        <main className="relative flex flex-1 flex-col overflow-hidden">
          {conversation}
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
                      variant={activePanel === "reasoning" ? "secondary" : "ghost"}
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
                        setActivePanel(activePanel === "canvas" ? null : "canvas")
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
            className="absolute right-4 top-4 z-10 rounded-full"
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

      {/* Fixed Prompt Input Footer */}
      <footer className="shrink-0 border-t bg-background p-4">
        {promptInput}
      </footer>
    </div>
  );
};

