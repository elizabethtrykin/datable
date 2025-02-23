"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { MessageList } from "@/components/MessageList";
import VoiceVisualization from "@/components/VoiceWaves";
import { useMessages } from "@/contexts/MessagesContext";
import { Button } from "@/components/ui/button";
import { Heart, X } from "lucide-react";

export default function ChatPage() {
  const { messages } = useMessages();

  const canPerformEarlyAction = messages.length > 0;
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-screen max-w-full h-screen border md:min-w-[450px]"
    >
      <ResizablePanel defaultSize={50} minSize={25}>
        <div className="flex h-full items-center justify-center relative p-6">
          <MessageList />
          {canPerformEarlyAction && (
            <div className="absolute bottom-2 left-2 flex flex-row gap-2 ">
              <Button
                variant="outline"
                className="flex flex-row gap-2"
                disabled={!canPerformEarlyAction}
              >
                <X className="size-3" />
                pass this one
              </Button>
              <Button
                variant="outline"
                className="flex flex-row gap-2"
                disabled={!canPerformEarlyAction}
              >
                <Heart className="size-3" />
                intro right now!
              </Button>
            </div>
          )}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50} minSize={25}>
        <div className="flex h-full items-center justify-center p-6">
          <VoiceVisualization />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
