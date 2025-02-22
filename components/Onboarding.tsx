import { useState } from "react";
import { useUser, UserInfo } from "@/contexts/UserContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function Onboarding() {
  const { setUserInfo } = useUser();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserInfo>>({});

  const handleGenderSelection = (gender: "male" | "female") => {
    setFormData({ ...formData, gender });
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserInfo(formData as UserInfo);
  };

  if (step === 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <h2 className="text-2xl font-bold mb-6">
          Welcome! Please select your gender:
        </h2>
        <div className="space-x-4">
          <Button
            onClick={() => handleGenderSelection("male")}
            className="px-6 py-2 bg-blue-100 text-blue-800 border border-blue-200 rounded-lg font-mono hover:bg-blue-50"
          >
            Male
          </Button>
          <Button
            onClick={() => handleGenderSelection("female")}
            className="px-6 py-2 bg-pink-100 text-pink-800 border border-pink-200 rounded-lg font-mono hover:bg-pink-50"
          >
            Female
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
        <Input
          type="text"
          placeholder="First Name"
          required
          onChange={(e) =>
            setFormData({ ...formData, firstName: e.target.value })
          }
        />
        <Input
          type="text"
          placeholder="Last Name"
          required
          onChange={(e) =>
            setFormData({ ...formData, lastName: e.target.value })
          }
        />

        {formData.gender === "male" && (
          <>
            <Input
              type="text"
              placeholder="Twitter Handle"
              onChange={(e) =>
                setFormData({ ...formData, twitterHandle: e.target.value })
              }
            />
            <Input
              type="text"
              placeholder="LinkedIn Handle"
              onChange={(e) =>
                setFormData({ ...formData, linkedinHandle: e.target.value })
              }
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  setFormData({ ...formData, pictureUrl: url });
                }
              }}
            />
          </>
        )}

        <Button type="submit" className="w-full py-2 ">
          Complete
        </Button>
      </form>
    </div>
  );
}
