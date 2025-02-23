import { motion } from "framer-motion";
import { Icons } from "./ui/icons";
import { Heart, User } from "lucide-react";

interface TweetMessage {
  username: string;
  handle: string;
  likes: number;
  retweets: number;
  label: string;
  content: string;
  timestamp: number | string;
}

export function TweetCard({ message }: { message: TweetMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full"
    >
      <div className="text-xs font-medium text-gray-500 mb-1 px-1">
        {message.label}
      </div>
      <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
        <div className="flex items-center mb-2 relative">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="h-6 w-6 text-gray-500" />
          </div>
          <div className="ml-3">
            <div className="font-bold text-gray-900">{message.username}</div>
            <div className="text-gray-500 text-sm">{message.handle}</div>
          </div>
          <div className="absolute right-0 top-0">
            <Icons.x />
          </div>
        </div>
        <p className="text-gray-800 text-sm mb-3">{message.content}</p>
        <div className="flex items-center justify-between text-gray-500 text-sm">
          <div className="flex space-x-4">
            <span className="flex items-center gap-1">
              <Heart className="size-3" />
              {message.likes}
            </span>
            <span className="flex items-center">
              <span className="mr-2">↺</span>
              {message.retweets}
            </span>
          </div>
          <div className="text-xs text-gray-400">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
