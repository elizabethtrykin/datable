import { motion } from "framer-motion";
import { Icons } from "./ui/icons";
import Link from "next/link";
import { Button } from "./ui/button";
import { User } from "lucide-react";

interface ProfileMessage {
  username: string;
  handle: string;
  url: string;
  label: string;
  timestamp: number | string;
}

export function ProfileCard({ message }: { message: ProfileMessage }) {
  console.log("Profile Message Data:", message);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full min-w-full"
    >
      <div className="text-xs font-medium text-gray-500 mb-1 px-1">
        {message.label}
      </div>
      <Link
        href={message.url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full min-w-full"
      >
        <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow min-w-full">
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
          <Button variant="outline" asChild className="mt-4">
            <Link href={message.url} target="_blank" rel="noopener noreferrer">
              Message them
            </Link>
          </Button>
        </div>
      </Link>
    </motion.div>
  );
}
