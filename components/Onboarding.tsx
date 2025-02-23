import { useState } from "react";
import { GenderSelection } from "./GenderSelection";
import { ProfileForm } from "./ProfileForm";
import { OnboardingSuccess } from "./OnboardingSuccess";

interface FormData {
  gender?: "male" | "female";
  firstName?: string;
  lastName?: string;
  twitterHandle?: string;
  linkedinHandle?: string;
  personalWebsite?: string;
  otherLinks?: string[];
}

export function Onboarding() {
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({});

  const handleGenderSelection = (gender: "male" | "female") => {
    setFormData({ ...formData, gender });
    setStep(2);
  };

  const handleProfileSubmit = async (profileData: FormData) => {
    const updatedData = { ...profileData, gender: formData.gender };

    localStorage.setItem(
      "userData",
      JSON.stringify({
        firstName: updatedData.firstName,
        lastName: updatedData.lastName,
        gender: updatedData.gender,
      })
    );

    if (updatedData.gender === "male") {
      fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          twitter_handle: updatedData.twitterHandle?.trim() || null,
          linkedin_url: updatedData.linkedinHandle
            ? `https://www.linkedin.com/in/${updatedData.linkedinHandle.trim()}/`
            : null,
          personal_website: updatedData.personalWebsite?.trim() || null,
          other_links:
            updatedData.otherLinks?.map((link) => link.trim()) || null,
        }),
      });
    }

    setFormData(updatedData);
    setShowSuccess(true);
  };

  if (showSuccess) {
    return <OnboardingSuccess firstName={formData.firstName || ""} />;
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
