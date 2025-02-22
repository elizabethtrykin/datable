import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import VoiceVisualization from "@/components/VoiceWaves";

export default function Home() {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-screen max-w-full h-screen border md:min-w-[450px]"
    >
      <ResizablePanel defaultSize={25} minSize={25}>
        <div className="flex h-full items-center justify-center p-6"></div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75} minSize={25}>
        <div className="flex h-full items-center justify-center p-6">
          <VoiceVisualization />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
