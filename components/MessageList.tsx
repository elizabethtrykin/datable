import { MessageCard } from "./MessageCard";
import { TweetCard } from "./TweetCard";
import { TweetMessage } from "@/types";
import { useMessages } from "@/contexts/MessagesContext";

export function MessageList() {
  const { messages } = useMessages();

  return (
    <div className="space-y-4 p-4">
      {messages.map((message) =>
        message.type === "tweet" ? (
          <TweetCard key={message.id} message={message as TweetMessage} />
        ) : (
          <MessageCard key={message.id} message={message} />
        )
      )}
    </div>
  );
}
