"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { MessageList } from "@/components/MessageList";
import VoiceVisualization from "@/components/VoiceWaves";

export default function ChatPage() {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-screen max-w-full h-screen border md:min-w-[450px]"
    >
      <ResizablePanel defaultSize={50} minSize={25}>
        <div className="flex h-full items-center justify-center p-6">
          <MessageList />
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
