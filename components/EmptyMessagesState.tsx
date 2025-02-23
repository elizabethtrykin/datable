import { EmptyMessageSkeleton } from "./EmptyMessageSkeleton";
import { EmptyTweetSkeleton } from "./EmptyTweetSkeleton";

export default function EmptyMessageState() {
  return (
    <div className="w-full flex flex-col items-center justify-center group h-[400px] self-center my-auto">
      <div className="relative w-full max-w-md h-fit pb-12 flex items-center justify-center">
        <div className="absolute bottom-24 -rotate-12 left-1/2 -translate-x-1/2 size-16 z-30 bg-white rounded-xl flex items-center justify-center border-2 transition-all duration-150 group-hover:rotate-[0deg]">
          <img
            src="/emptyavatar.png"
            alt="Empty avatar"
            className="w-12 h-12 z-30 opacity-45"
          />
        </div>
        <div className="relative z-10 transition-all duration-150 -rotate-3 group-hover:rotate-6">
          <EmptyMessageSkeleton />
        </div>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 rotate-[14deg] max-w-96 h-full z-20 transition-all duration-150 group-hover:rotate-[-3deg]">
          <EmptyTweetSkeleton />
        </div>
      </div>
      <p className="text-xs text-center">
        Their revealed personal artifacts will display here
      </p>
    </div>
  );
}
