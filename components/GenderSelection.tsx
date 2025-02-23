import { Button } from "./ui/button";

interface GenderSelectionProps {
  onSelect: (gender: "male" | "female") => void;
}

export function GenderSelection({ onSelect }: GenderSelectionProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h2 className="text-2xl font-bold mb-6">Are you a girl?</h2>
      <div className="space-x-4">
        <Button
          onClick={() => onSelect("female")}
          className="px-6 py-2 bg-pink-100 text-pink-800 border border-pink-200 rounded-lg font-mono hover:bg-pink-50"
        >
          Yes
        </Button>
        <Button
          onClick={() => onSelect("male")}
          className="px-6 py-2 bg-blue-100 text-blue-800 border border-blue-200 rounded-lg font-mono hover:bg-blue-50"
        >
          No
        </Button>
      </div>
    </div>
  );
}
