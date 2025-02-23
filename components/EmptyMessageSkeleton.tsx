export const EmptyMessageSkeleton = () => {
  return (
    <div className="flex w-full flex-col gap-2 h-16 items-start bg-neutral-100 rounded-xl p-3 border-2">
      <div className="flex bg-neutral-300 h-2  w-10/12 rounded-xl"></div>
      <div className="flex bg-neutral-300 h-2  w-7/12 rounded-xl"></div>
      <div className="flex bg-neutral-300 h-2  w-20 rounded-xl"></div>
    </div>
  );
};
