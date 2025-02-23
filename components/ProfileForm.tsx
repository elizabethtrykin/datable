import { useState, useEffect } from "react";
import Exa from "exa-js";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Twitter, Linkedin, Globe, Plus, X } from "lucide-react";

const exa = new Exa(process.env.NEXT_PUBLIC_EXA_API_KEY as string);

interface ProfileFormData {
  firstName?: string;
  identifier?: string;
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
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Fetch links from Exa and categorize them
  const fetchExaLinks = async (name: string) => {
    try {
      // Separate searches for different platforms
      const [twitterResult, linkedinResult, generalResult] = await Promise.all([
        // Twitter/X.com search
        exa.search(name, {
          includeDomains: ["x.com"],
          numResults: 10
        }),
        // LinkedIn search
        exa.search(name, {
          includeDomains: ["linkedin.com"],
          numResults: 10
        }),
        // General search for personal websites
        exa.search(name, {
          excludeDomains: ["x.com", "linkedin.com"],
          numResults: 10
        })
      ]);

      const twitterSuggestions: Suggestion[] = [];
      const linkedinSuggestions: Suggestion[] = [];
      const websiteSuggestions: Suggestion[] = [];

      // Process Twitter results - only use first valid result
      const twitterItem = (twitterResult.results || []).find((item: any) => {
        const url = item.url;
        return url && !url.includes("/status/") && 
               url.split('x.com/')[1]?.split(/[/?#]/)[0] &&
               !['home', 'search'].includes(url.split('x.com/')[1]?.split(/[/?#]/)[0] || '');
      });

      if (twitterItem) {
        const handle = twitterItem.url.split('x.com/')[1]?.split(/[/?#]/)[0];
        console.log('Found Twitter URL:', twitterItem.url);
        console.log('Extracted handle:', handle);
        
        twitterSuggestions.push({ 
          value: handle.replace(/^@/, ''),
          confidence: 0.9, 
          title: twitterItem.title || `@${handle} on Twitter`
        });
      }

      // Process LinkedIn results - only use first valid result
      const linkedinItem = (linkedinResult.results || []).find((item: any) => {
        const url = item.url;
        return url && url.includes("linkedin.com/in/") &&
               url.split("linkedin.com/in/")[1]?.split(/[/?#]/)[0];
      });

      if (linkedinItem) {
        const handle = linkedinItem.url.split("linkedin.com/in/")[1]?.split(/[/?#]/)[0] || "";
        console.log('Found LinkedIn URL:', linkedinItem.url);
        console.log('Extracted LinkedIn handle:', handle);
        
        if (handle && !handle.includes('/')) {
          linkedinSuggestions.push({ 
            value: handle,
            confidence: 0.9,
            title: linkedinItem.title || `${handle} on LinkedIn`
          });
        }
      }

      // Process general results - only use first valid result
      const websiteItem = (generalResult.results || [])[0];
      if (websiteItem) {
        websiteSuggestions.push({ 
          value: websiteItem.url, 
          confidence: 0.7, 
          title: websiteItem.title || websiteItem.url
        });
        console.log('Found personal website:', websiteItem.url);
      }

      return {
        twitter: twitterSuggestions,
        linkedin: linkedinSuggestions,
        website: websiteSuggestions,
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
    const identifier = formData.identifier?.trim();
    if (!name) return;
    
    setIsTransitioning(true);
    setTimeout(async () => {
      setNameSubmitted(true);
      setIsSearching(true);
      const results = await fetchExaLinks(`${name} ${identifier || ''}`);
      console.log('Search results:', results);
      
      const newFormData = {
        ...formData,
        linkedinHandle: results.linkedin[0]?.value || '',
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
      
      if (gender === "male") {
        setShowSuccessMessage(true);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
      setIsTransitioning(false);
    }
  };

  if (showSuccessMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-fade-in">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-zinc-900">Profile Created!</h2>
          <p className="text-zinc-600">Keep a look out for your Twitter DMs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      {!nameSubmitted ? (
        <form onSubmit={handleNameSubmit} className={`space-y-4 w-full max-w-md ${isTransitioning ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="e.g. John Smith"
                required
                value={formData.firstName || ''}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-zinc-700 mb-1">
                Help us find you! Give some identifiers
              </label>
              <Input
                id="identifier"
                type="text"
                placeholder="Company, school, or other identifier"
                value={formData.identifier || ''}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              />
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full py-2 mt-6"
            disabled={!formData.firstName?.trim() || isTransitioning}
          >
            Find me online
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
              className="bg-gray-50 cursor-default"
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

          {!isSearching && (
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
                {isSubmitting ? "Creating Profile..." : "Find me love"}
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}