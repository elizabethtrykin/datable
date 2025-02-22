"use client";

import { UserProvider, useUser } from "@/contexts/UserContext";
import { Onboarding } from "@/components/Onboarding";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import VoiceVisualization from "@/components/VoiceWaves";
import { MessageList } from "@/components/MessageList";

function MainContent() {
  const { userInfo } = useUser();

  if (!userInfo) {
    return <Onboarding />;
  }

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

export default function Home() {
  return (
    <UserProvider>
      <MainContent />
    </UserProvider>
  );
}
