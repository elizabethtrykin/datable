import { MessageCard } from "./MessageCard";
import { TweetCard } from "./TweetCard";
import { TweetMessage } from "@/types";
import { useMessages } from "@/contexts/MessagesContext";
import EmptyMessageState from "./EmptyMessagesState";

export function MessageList() {
  const { messages } = useMessages();

  return (
    <div className="space-y-4 p-4">
      {messages.length === 0 ? (
        <EmptyMessageState />
      ) : (
        messages.map((message) =>
          message.type === "tweet" ? (
            <TweetCard key={message.id} message={message as TweetMessage} />
          ) : (
            <MessageCard key={message.id} message={message} />
          )
        )
      )}
    </div>
  );
}
