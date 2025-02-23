export interface Message {
  id: string;
  type: "message" | "tweet" | "profile" | "regular" | "image";
  content?: string;
  timestamp: number;
}

export interface TweetMessage extends Message {
  type: "tweet";
  username: string;
  handle: string;
  likes: number;
  retweets: number;
  label: string;
  content: string;
}

export interface ProfileMessage extends Message {
  type: "profile";
  username: string;
  handle: string;
  url: string;
  label: string;
}

export interface RegularMessage extends Message {
  type: "regular";
}

export interface ImageMessage extends Message {
  type: "image";
  imageUrl: string;
}

export type MessageType =
  | RegularMessage
  | TweetMessage
  | ImageMessage
  | ProfileMessage;
