export interface BaseMessage {
  id: string;
  content: string;
  timestamp: number;
  label: string;
  type: "regular" | "tweet";
}

export interface RegularMessage extends BaseMessage {
  type: "regular";
}

export interface TweetMessage extends BaseMessage {
  type: "tweet";
  username: string;
  handle: string;
  likes: number;
  retweets: number;
}

export type Message = RegularMessage | TweetMessage;
