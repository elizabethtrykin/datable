"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Message } from "@/types";
import { useMatchedPerson } from "./MatchedPersonContext";

interface MessagesContextType {
  messages: Message[];
  addMessage: (message: Message) => void;
  showMatchContactInfo: () => void;
}

const MessagesContext = createContext<MessagesContextType | undefined>(
  undefined
);

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { profileData, matchedPersonData } = useMatchedPerson();
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  console.log("profileData", profileData);

  const showMatchContactInfo = () => {
    // @ts-expect-error idc rn
    addMessage({
      id: "uuaiuhdiuahdiuahiudha",
      type: "profile",
      content: `Here is the contact info for the person you matched with: ${matchedPersonData?.firstName} ${matchedPersonData?.lastName}`,
      url: `https://x.com/${matchedPersonData?.twitter_handle}`,
      username: matchedPersonData?.twitter_handle || "",
    });
  };

  console.log(messages);

  return (
    <MessagesContext.Provider
      value={{ messages, addMessage, showMatchContactInfo }}
    >
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error("useMessages must be used within a MessagesProvider");
  }
  return context;
}
