import { Icons } from "./ui/icons";

export const EmptyTweetSkeleton = () => {
  return (
    <div className="relative w-80 max-w-[500px] bg-white rounded-xl p-3 shadow-sm border-2">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 bg-neutral-200 rounded-full shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="bg-neutral-200 h-3 w-20 rounded-full" />
            <div className="bg-neutral-200 h-3 w-16 rounded-full" />
            <div className="ml-auto opacity-50">
              <Icons.x />
            </div>
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="flex bg-neutral-200 h-2 w-7/12 rounded-xl" />
            <div className="flex bg-neutral-200 h-2 w-10/12 rounded-xl" />
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-neutral-200 rounded-full" />
              <div className="bg-neutral-200 h-2 w-6 rounded-full" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-neutral-200 rounded-full" />
              <div className="bg-neutral-200 h-2 w-6 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
