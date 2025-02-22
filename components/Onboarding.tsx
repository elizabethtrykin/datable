import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";

export function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<{
    gender?: "male" | "female";
    firstName?: string;
    lastName?: string;
    twitterHandle?: string;
    linkedinHandle?: string;
    personalWebsite?: string;
    otherLinks?: string[];
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherLink, setOtherLink] = useState("");

  const handleGenderSelection = (gender: "male" | "female") => {
    setFormData({ ...formData, gender });
    setStep(2);
  };

  const addOtherLink = () => {
    if (otherLink && (!formData.otherLinks || formData.otherLinks.length < 5)) {
      setFormData({
        ...formData,
        otherLinks: [...(formData.otherLinks || []), otherLink]
      });
      setOtherLink("");
    }
  };

  const removeOtherLink = (index: number) => {
    setFormData({
      ...formData,
      otherLinks: formData.otherLinks?.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!formData.firstName || !formData.lastName) {
        throw new Error('First and last name are required');
      }

      // Store user data in localStorage
      localStorage.setItem('userData', JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender
      }));

      if (formData.gender === "male") {
        const response = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            twitter_handle: formData.twitterHandle?.trim() || null,
            linkedin_url: formData.linkedinHandle ? `https://www.linkedin.com/in/${formData.linkedinHandle.trim()}/` : null,
            personal_website: formData.personalWebsite?.trim() || null,
            other_links: formData.otherLinks?.map(link => link.trim()) || null
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create profile');
        }
        
        router.push('/');
      } else {
        router.push('/chat');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <h2 className="text-2xl font-bold mb-6">Are you a girl?</h2>
        <div className="space-x-4">
          <Button
            onClick={() => handleGenderSelection("female")}
            className="px-6 py-2 bg-pink-100 text-pink-800 border border-pink-200 rounded-lg font-mono hover:bg-pink-50"
          >
            Yes
          </Button>
          <Button
            onClick={() => handleGenderSelection("male")}
            className="px-6 py-2 bg-blue-100 text-blue-800 border border-blue-200 rounded-lg font-mono hover:bg-blue-50"
          >
            No
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
              placeholder="Twitter Handle (without @)"
              onChange={(e) =>
                setFormData({ ...formData, twitterHandle: e.target.value })
              }
            />
            <Input
              type="text"
              placeholder="LinkedIn Username"
              onChange={(e) =>
                setFormData({ ...formData, linkedinHandle: e.target.value })
              }
            />
            <Input
              type="url"
              placeholder="Personal Website"
              onChange={(e) =>
                setFormData({ ...formData, personalWebsite: e.target.value })
              }
            />
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="Other Link"
                  value={otherLink}
                  onChange={(e) => setOtherLink(e.target.value)}
                />
                <Button
                  type="button"
                  onClick={addOtherLink}
                  disabled={!otherLink || (formData.otherLinks?.length || 0) >= 5}
                >
                  Add
                </Button>
              </div>
              {formData.otherLinks?.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="truncate flex-1">{link}</span>
                  <Button
                    type="button"
                    onClick={() => removeOtherLink(index)}
                    variant="destructive"
                    size="sm"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {formData.otherLinks?.length === 5 && (
                <p className="text-sm text-gray-500">Maximum 5 links reached</p>
              )}
            </div>
          </>
        )}

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <Button 
          type="submit" 
          className="w-full py-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Profile...' : 'Complete'}
        </Button>
      </form>
    </div>
  );
}
