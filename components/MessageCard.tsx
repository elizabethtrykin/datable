import { motion } from "framer-motion";
import { Message } from "@/types";

export function MessageCard({ message }: { message: Message }) {
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
        <p className="text-gray-800 text-sm">{message.content}</p>
        <div className="text-xs text-gray-400 mt-2">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </motion.div>
  );
}
