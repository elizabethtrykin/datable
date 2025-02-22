export type Message = {
  id: string;
  label: string;
  content: string;
  timestamp: string;
  type: string;
};

export const sampleMessages: Message[] = [
  {
    id: "1",
    type: "regular",
    label: "Their most viral tweet",
    content:
      "Just discovered that coffee and code are the perfect combination! 🚀 #CodingLife",
    timestamp: Date.now().toString(),
  },
  {
    id: "2",
    type: "tweet",
    content: "Just setting up my Twitter!",
    timestamp: Date.now().toString(),
    label: "Tweet",
    username: "Jack Dorsey",
    handle: "jack",
    likes: 42,
    retweets: 15,
  },
  {
    id: "3",
    label: "Latest update",
    content:
      "Launching our new feature today - super excited to share it with everyone! 🎉",
    timestamp: "2024-03-20T09:05:00Z",
  },
  {
    id: "4",
    content: "This is a regular message",
    timestamp: Date.now().toString(),
    label: "Assistant",
  },
  {
    id: "5",
    content: "Just setting up my Twitter!",
    timestamp: Date.now().toString(),
    label: "Tweet",
    username: "Jack Dorsey",
    handle: "jack",
    likes: 42,
    retweets: 15,
  },
];
