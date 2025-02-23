"use client";

import { useState, useEffect } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { MessageList } from "@/components/MessageList";
import VoiceVisualization from "@/components/VoiceWaves";
import { useMessages } from "@/contexts/MessagesContext";
import { useMatchedPerson } from "@/contexts/MatchedPersonContext";
import { Button } from "@/components/ui/button";
import { Heart, X } from "lucide-react";
import { Icons } from "@/components/ui/icons";
import { motion } from "framer-motion";
export default function ChatPage() {
  const { messages, showMatchContactInfo } = useMessages();
  const {
    matchedPersonData,
    isAwaitingMatch,
    findMatch,
    profileData,
    setProfileData,
  } = useMatchedPerson();

  const canPerformEarlyAction = messages.length > 0;

  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");

    if (storedUserData) {
      setProfileData(JSON.parse(storedUserData));
    }
    findMatch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!profileData) {
    return null;
  }

  if (isAwaitingMatch || !matchedPersonData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center flex items-center justify-center flex-col gap-2">
          <h2 className="text-5xl font-bold mb-4">
            Hey {profileData.firstName},
          </h2>
          <div className="flex items-center gap-2">
            <span>finding your perfect match</span>
            <div className="flex gap-1">
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="w-1.5 h-1.5 bg-black rounded-full"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: index * 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-screen max-w-full max-h-screen border md:min-w-[450px] overflow-hidden"
    >
      <ResizablePanel defaultSize={50} minSize={25}>
        <div className="flex h-full items-center justify-center relative overflow-y-auto">
          <MessageList />

          <div className="absolute bottom-2 left-2 flex flex-row gap-2 ">
            <>
              {" "}
              {/* <Button
                variant="outline"
                className="flex flex-row gap-2"
                disabled={!canPerformEarlyAction}
              >
                <X className="size-3" />
                pass this one
              </Button> */}
              <Button
                variant="outline"
                onClick={showMatchContactInfo}
                className="flex flex-row gap-2"
                // disabled={!canPerformEarlyAction}
              >
                <Heart className="size-3" />
                intro right now!
              </Button>
            </>
          </div>
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
