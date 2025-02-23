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

    localStorage.setItem(
      "userData",
      JSON.stringify({
        firstName: updatedData.firstName,
        gender: updatedData.gender,
      })
    );

    // Create profile for both genders
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        gender: updatedData.gender,
        twitter_handle: updatedData.twitterHandle?.trim() || null,
        linkedin_url: updatedData.linkedinHandle
          ? `https://www.linkedin.com/in/${updatedData.linkedinHandle.trim()}/`
          : null,
        personal_website: updatedData.personalWebsite?.trim() || null,
        other_links: updatedData.otherLinks?.map((link) => link.trim()) || null,
      }),
    });

    const result = await response.json();

    // If female profile, get matches
    if (updatedData.gender === "female" && result.profile_id) {
      const matchResponse = await fetch(`/api/match?profile_id=${result.profile_id}`);
      const matchData = await matchResponse.json();

      if (matchData.matches?.length > 0) {
        // Store all the context data
        localStorage.setItem("matches", JSON.stringify(matchData.matches));
        localStorage.setItem(
          "conversationContext",
          JSON.stringify({
            female: matchData.profileData,
            male: matchData.topMatchData,
          })
        );
      } else {
        console.log("No matches found:", matchData.message);
        localStorage.setItem("matches", JSON.stringify([]));
        localStorage.setItem(
          "conversationContext",
          JSON.stringify({
            female: { profile_id: result.profile_id },
            male: null,
          })
        );
      }
    }

    setFormData(updatedData);
    setShowSuccess(true);

    setTimeout(() => {
      router.push("/chat");
    }, 2000);
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
