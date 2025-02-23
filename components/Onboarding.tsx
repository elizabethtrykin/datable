import { useState } from "react";
import { GenderSelection } from "./GenderSelection";
import { ProfileForm } from "./ProfileForm";
import { OnboardingSuccess } from "./OnboardingSuccess";
import { useRouter } from "next/navigation";

interface FormData {
  gender?: "male" | "female";
  firstName?: string;
  twitterHandle?: string;
  linkedinHandle?: string;
  personalWebsite?: string;
  otherLinks?: string[];
}

export function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({});

  const handleGenderSelection = (gender: "male" | "female") => {
    setFormData({ ...formData, gender });
    setStep(2);
  };

  const handleProfileSubmit = async (profileData: FormData) => {
    const updatedData = { ...profileData, gender: formData.gender };

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        gender: updatedData.gender,
        twitter_handle: updatedData.twitterHandle?.trim() || null,
        linkedin_url: updatedData.linkedinHandle || null,
        personal_website: updatedData.personalWebsite?.trim() || null,
        other_links: updatedData.otherLinks?.map((link) => link.trim()) || null,
      }),
    });

    const { profile_id } = await res.json();

    console.log("profile", profile_id);

    localStorage.setItem(
      "userData",
      JSON.stringify({
        firstName: updatedData.firstName,
        gender: updatedData.gender,
        profile_id,
        twitter_handle: updatedData.twitterHandle,
      })
    );
    setFormData(updatedData);
    setShowSuccess(true);

    if (updatedData.gender === "female") {
      setTimeout(() => {
        router.push("/chat");
      }, 2000);
    }
  };

  if (showSuccess) {
    return (
      <OnboardingSuccess
        firstName={formData.firstName || ""}
        gender={formData.gender || "female"}
      />
    );
  }

  if (step === 1) {
    return <GenderSelection onSelect={handleGenderSelection} />;
  }

  return (
    <ProfileForm
      gender={formData.gender || "female"}
      onSubmit={handleProfileSubmit}
    />
  );
}
