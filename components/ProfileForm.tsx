import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface ProfileFormData {
  firstName?: string;
  lastName?: string;
  twitterHandle?: string;
  linkedinHandle?: string;
  personalWebsite?: string;
  otherLinks?: string[];
}

interface ProfileFormProps {
  gender: "male" | "female";
  onSubmit: (data: ProfileFormData) => Promise<void>;
}

export function ProfileForm({ gender, onSubmit }: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileFormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherLink, setOtherLink] = useState("");

  const addOtherLink = () => {
    if (otherLink && (!formData.otherLinks || formData.otherLinks.length < 5)) {
      setFormData({
        ...formData,
        otherLinks: [...(formData.otherLinks || []), otherLink],
      });
      setOtherLink("");
    }
  };

  const removeOtherLink = (index: number) => {
    setFormData({
      ...formData,
      otherLinks: formData.otherLinks?.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!formData.firstName || !formData.lastName) {
        throw new Error("First and last name are required");
      }
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
    }
  };

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

        {gender === "male" && (
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
                  disabled={
                    !otherLink || (formData.otherLinks?.length || 0) >= 5
                  }
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

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <Button type="submit" className="w-full py-2" disabled={isSubmitting}>
          {isSubmitting ? "Creating Profile..." : "Complete"}
        </Button>
      </form>
    </div>
  );
}
