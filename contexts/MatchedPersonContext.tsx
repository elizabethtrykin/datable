"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
}

interface MatchedPersonContextType {
  matchedPersonData: Profile | null;
  setMatchedPersonData: (data: Profile | null) => void;
  isAwaitingMatch: boolean;
  setIsAwaitingMatch: (isAwaiting: boolean) => void;
  findMatch: () => Promise<void>;
}

const MatchedPersonContext = createContext<
  MatchedPersonContextType | undefined
>(undefined);

export function MatchedPersonProvider({ children }: { children: ReactNode }) {
  const [matchedPersonData, setMatchedPersonData] = useState<Profile | null>(
    null
  );
  const [isAwaitingMatch, setIsAwaitingMatch] = useState(false);
  const [matches, setMatches] = useState<Profile[]>([]);
  const [profileData, setProfileData] = useState<Profile | null>(null);

  const findMatch = useCallback(async () => {
    if (isAwaitingMatch) return;

    setIsAwaitingMatch(true);
    try {
      const userData = localStorage.getItem("userData");
      if (!userData) {
        console.log("No user data found");
        return;
      }

      const { gender, profile_id } = JSON.parse(userData);
      if (gender !== "female") {
        console.log("User is not female, skipping match");
        return;
      }

      const matchResponse = await fetch(`/api/match?profile_id=${profile_id}`);
      const { matches, topMatchData, profileData } = await matchResponse.json();

      localStorage.setItem(
        "conversationContext",
        JSON.stringify({
          female: profileData,
          male: topMatchData,
        })
      );

      setMatches(matches);
      setProfileData(profileData);
      setMatchedPersonData(topMatchData);
      setIsAwaitingMatch(false);
    } catch (error) {
      console.error("Error finding match:", error);
    } finally {
      setIsAwaitingMatch(false);
    }
  }, [isAwaitingMatch]);

  return (
    <MatchedPersonContext.Provider
      value={{
        matches,
        profileData,
        matchedPersonData,
        setMatchedPersonData,
        isAwaitingMatch,
        setIsAwaitingMatch,
        findMatch,
      }}
    >
      {children}
    </MatchedPersonContext.Provider>
  );
}

export function useMatchedPerson() {
  const context = useContext(MatchedPersonContext);
  if (context === undefined) {
    throw new Error(
      "useMatchedPerson must be used within a MatchedPersonProvider"
    );
  }
  return context;
}
