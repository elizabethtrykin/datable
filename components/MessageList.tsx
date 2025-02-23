import { MessageCard } from "./MessageCard";
import { TweetCard } from "./TweetCard";
import { ProfileCard } from "./ProfileCard";
import { TweetMessage, ProfileMessage } from "@/types";
import { useMessages } from "@/contexts/MessagesContext";
import EmptyMessageState from "./EmptyMessagesState";

export function MessageList() {
  const { messages } = useMessages();

  console.log("All Messages:", messages);

  return (
    <div className="space-y-4 p-4 w-full min-w-full justify-center">
      {messages.length === 0 ? (
        <EmptyMessageState />
      ) : (
        messages.map((message) => {
          console.log("Processing message:", message);
          if (message.type === "tweet") {
            return (
              <TweetCard key={message.id} message={message as TweetMessage} />
            );
          } else if (message.type === "profile") {
            return (
              <ProfileCard
                key={message.id}
                message={message as ProfileMessage}
              />
            );
          } else {
            return <MessageCard key={message.id} message={message} />;
          }
        })
      )}
    </div>
  );
}
