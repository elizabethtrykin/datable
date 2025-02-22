import { sampleMessages } from "@/app/fake-data";
import { MessageCard } from "./MessageCard";
import { TweetCard } from "./TweetCard";
import { TweetMessage } from "@/types";

export function MessageList() {
  return (
    <div className="space-y-4 p-4">
      {sampleMessages.map((message) =>
        message.type === "tweet" ? (
          <TweetCard key={message.id} message={message as TweetMessage} />
        ) : (
          <MessageCard key={message.id} message={message} />
        )
      )}
    </div>
  );
}
