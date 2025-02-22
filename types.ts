export interface BaseMessage {
  id: string;
  content: string;
  timestamp: number;
  label: string;
  type: "regular" | "tweet" | "image";
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

export interface ImageMessage extends BaseMessage {
  type: "image";
  imageUrl: string;
}

export type Message = RegularMessage | TweetMessage | ImageMessage;
