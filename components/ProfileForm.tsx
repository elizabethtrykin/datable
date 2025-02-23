import { useState, useEffect } from "react";
import Exa from "exa-js";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Twitter, Linkedin, Globe, Plus, X } from "lucide-react";

const exa = new Exa(process.env.EXA_API_KEY as string);

interface ProfileFormData {
  firstName?: string;
  twitterHandle?: string;
  linkedinHandle?: string;
  personalWebsite?: string;
  otherLinks?: string[];
}

interface Suggestion {
  value: string;
  confidence: number; // 0-1
  title: string; // For preview in UI
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
  const [suggestions, setSuggestions] = useState<{
    twitter: Suggestion[];
    linkedin: Suggestion[];
    website: Suggestion[];
  }>({
    twitter: [],
    linkedin: [],
    website: []
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fetch links from Exa and categorize them
  const fetchExaLinks = async (name: string) => {
    try {
      const result = await exa.search(name, { type: "keyword" });
      const results = result.results || [];

      const twitterSuggestions: Suggestion[] = [];
      const linkedinSuggestions: Suggestion[] = [];
      const websiteSuggestions: Suggestion[] = [];

      results.forEach((item: any) => {
        const url = item.url;
        const title = item.title || url;
        const confidence = url.includes("profile") || url.includes("about") ? 0.9 : 0.7;

        if (url.includes("twitter.com") || url.includes("x.com")) {
          // Skip if it's a tweet URL
          if (url.includes("/status/")) return;
          
          // Extract handle from either twitter.com or x.com
          const handle = url.split(/twitter\.com\/|x\.com\//)[1]?.split(/[/?#]/)[0];
          console.log('Found Twitter URL:', url);
          console.log('Extracted handle:', handle);
          
          if (handle && !handle.includes('/') && handle !== 'home' && handle !== 'search') {
            twitterSuggestions.push({ 
              value: handle.replace(/^@/, ''), // Ensure clean handle without @
              confidence, 
              title: title || `@${handle} on Twitter`
            });
          }
        } else if (url.includes("linkedin.com/in/")) {
          // Extract just the username/handle part from LinkedIn URL
          const handle = url.split("linkedin.com/in/")[1]?.split(/[/?#]/)[0] || "";
          console.log('Found LinkedIn URL:', url);
          console.log('Extracted LinkedIn handle:', handle);
          
          if (handle && !handle.includes('/')) {
            linkedinSuggestions.push({ 
              value: handle, // Store just the handle/username part
              confidence, 
              title: title || `${handle} on LinkedIn`
            });
          }
        } else if (
          url.includes(name.toLowerCase().replace(" ", "")) &&
          (url.includes(".com") || url.includes(".org")) &&
          !url.includes("facebook") &&
          !url.includes("twitter") &&
          !url.includes("linkedin")
        ) {
          websiteSuggestions.push({ value: url, confidence, title });
        }
      });

      return {
        twitter: twitterSuggestions.slice(0, 3), // Limit to top 3
        linkedin: linkedinSuggestions.slice(0, 3),
        website: websiteSuggestions.slice(0, 3),
      };
    } catch (err) {
      console.error("Exa API error:", err);
      return { twitter: [], linkedin: [], website: [] };
    }
  };

  const formatTwitterHandle = (input: string): string => {
    if (!input) return '';
    
    // Remove @ if present, trailing slashes, and whitespace
    let handle = input.trim().replace(/^@/, '').replace(/\/$/, '');
    
    // If it's a URL, extract the handle
    if (handle.includes('twitter.com/') || handle.includes('x.com/')) {
      handle = handle.split(/twitter\.com\/|x\.com\//)[1]?.split(/[/?#]/)[0] || '';
    }
    
    // Final cleanup - remove any remaining @ and invalid characters
    handle = handle.replace(/^@/, '').trim();
    
    // Validate the handle format
    if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) {
      console.warn('Invalid Twitter handle format:', handle);
    }
    
    return handle;
  };

  const formatLinkedInUrl = (input: string): string => {
    if (!input) return '';
    
    // Remove any trailing slashes and whitespace
    let handle = input.trim().replace(/\/$/, '');
    
    // If it's already a full LinkedIn URL, extract just the handle
    if (handle.includes('linkedin.com/in/')) {
      handle = handle.split('linkedin.com/in/')[1]?.split(/[/?#]/)[0] || '';
    }
    
    // Remove any @ symbol if someone adds it
    handle = handle.replace(/^@/, '');
    
    // Return the full URL
    return `https://www.linkedin.com/in/${handle}`;
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formData.firstName?.trim();
    if (!name) return;
    
    setIsTransitioning(true);
    setTimeout(async () => {
      setNameSubmitted(true);
      setIsSearching(true);
      const results = await fetchExaLinks(name);
      console.log('Search results:', results);
      
      const newFormData = {
        ...formData,
        linkedinHandle: results.linkedin[0]?.value || '', // This will now be just the handle part
        personalWebsite: results.website[0]?.value || ''
      };
      
      if (results.twitter.length > 0) {
        console.log('Setting Twitter handle:', results.twitter[0].value);
        newFormData.twitterHandle = results.twitter[0].value;
      }
      
      setFormData(newFormData);
      setSuggestions(results);
      setIsSearching(false);
      setIsTransitioning(false);
    }, 300);
  };

  const applySuggestion = (field: keyof ProfileFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    setShowSuggestions(false);
  };

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
      if (!formData.firstName) {
        throw new Error("First name is required");
      }

      // Format the data before submitting
      const formattedData = {
        ...formData,
        twitterHandle: formData.twitterHandle ? formatTwitterHandle(formData.twitterHandle) : undefined,
        linkedinHandle: formData.linkedinHandle ? formatLinkedInUrl(formData.linkedinHandle) : undefined,
      };

      // Start fade out animation immediately
      setIsTransitioning(true);
      
      // Submit formatted data
      await onSubmit(formattedData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
      setIsTransitioning(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      {!nameSubmitted ? (
        <form onSubmit={handleNameSubmit} className={`space-y-4 w-full max-w-md ${isTransitioning ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className="relative">
            <Input
              type="text"
              placeholder="Full Name"
              required
              value={formData.firstName || ''}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full py-2"
            disabled={!formData.firstName?.trim() || isTransitioning}
          >
            Find My Profiles
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className={`space-y-4 w-full max-w-md transition-opacity duration-300 ${isTransitioning ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className="text-center mb-6 space-y-1">
            <h2 className="text-2xl font-semibold text-zinc-900">We've found you online!</h2>
          </div>
          <div className="relative">
            <Input
              type="text"
              value={formData.firstName || ''}
              disabled
              className="bg-gray-50"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce-loading" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce-loading" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce-loading" style={{ animationDelay: '300ms' }}></div>
                </div>
                <div className="relative">
                  <span className="text-sm font-medium text-blue-600 animate-pulse-fast">Analyzing profiles</span>
                  <div className="absolute -bottom-0.5 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-600 to-transparent animate-pulse-fast"></div>
                </div>
              </div>
            )}
          </div>

          {!isSearching && suggestions.twitter.length + suggestions.linkedin.length + suggestions.website.length > 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500/70 group-focus-within:text-zinc-900/70">
                  <Twitter className="w-4 h-4" />
                </div>
                <Input
                  type="text"
                  placeholder="Twitter Handle (with or without @)"
                  value={formData.twitterHandle ? `@${formatTwitterHandle(formData.twitterHandle)}` : ""}
                  onChange={(e) =>
                    setFormData({ ...formData, twitterHandle: e.target.value })
                  }
                  className="pl-9 group"
                />
                {suggestions.twitter.length > 0 && formData.twitterHandle === suggestions.twitter[0]?.value && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Auto-filled
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500/70 group-focus-within:text-zinc-900/70">
                  <Linkedin className="w-4 h-4" />
                </div>
                <Input
                  type="text"
                  placeholder="LinkedIn URL or username"
                  value={formData.linkedinHandle || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, linkedinHandle: e.target.value })
                  }
                  className="pl-9 group"
                />
                {suggestions.linkedin.length > 0 && formData.linkedinHandle === suggestions.linkedin[0]?.value && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Auto-filled
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500/70 group-focus-within:text-zinc-900/70">
                  <Globe className="w-4 h-4" />
                </div>
                <Input
                  type="url"
                  placeholder="Personal Website"
                  value={formData.personalWebsite || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, personalWebsite: e.target.value })
                  }
                  className="pl-9 group"
                />
                {suggestions.website.length > 0 && formData.personalWebsite === suggestions.website[0]?.value && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Auto-filled
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-500">Other Links</span>
                  {(formData.otherLinks?.length || 0) < 5 && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          otherLinks: [...(formData.otherLinks || []), ""]
                        });
                      }}
                      className="p-1 hover:bg-zinc-100 rounded-full transition-colors"
                    >
                      <Plus className="w-4 h-4 text-zinc-500" />
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {formData.otherLinks?.map((link, index) => (
                    <div key={index} className="relative group">
                      <Input
                        type="url"
                        placeholder="https://"
                        value={link}
                        onChange={(e) => {
                          const newLinks = [...(formData.otherLinks || [])];
                          newLinks[index] = e.target.value;
                          setFormData({ ...formData, otherLinks: newLinks });
                        }}
                        className="pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => removeOtherLink(index)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-zinc-500" />
                      </button>
                    </div>
                  ))}
                </div>
                {formData.otherLinks?.length === 5 && (
                  <p className="text-xs text-zinc-500">Maximum 5 links reached</p>
                )}
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <Button type="submit" className="w-full py-2" disabled={isSubmitting}>
                {isSubmitting ? "Creating Profile..." : "Complete"}
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}