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
  profileData: Profile | null;
  setProfileData: (data: Profile | null) => void;
  matches: Profile[];
  setMatches: (matches: Profile[]) => void;
}

const MatchedPersonContext = createContext<MatchedPersonContextType | undefined>(undefined);

export function MatchedPersonProvider({ children }: { children: ReactNode }) {
  const [matchedPersonData, setMatchedPersonData] = useState<Profile | null>(null);
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

      // First wait for profile processing to complete
      const eventSource = new EventSource(`/api/profile/updates?id=${profile_id}`);
      
      eventSource.onmessage = async (event) => {
        const { status, data } = JSON.parse(event.data);
        
        if (status === "completed" && data.embedding && data.stringified_data) {
          eventSource.close();
          
          // Now call the match endpoint
          console.log("Profile processing complete, finding matches...");
          const matchResponse = await fetch(`/api/match?profile_id=${profile_id}`);
          
          if (!matchResponse.ok) {
            throw new Error('Failed to find matches');
          }
          
          const matchData = await matchResponse.json();
          console.log("Match data received:", matchData);
          
          if (matchData.topMatchData) {
            localStorage.setItem(
              "conversationContext",
              JSON.stringify({
                female: { stringified_data: data.stringified_data },
                male: matchData.topMatchData,
              })
            );

            setMatchedPersonData(matchData.topMatchData);
            setIsAwaitingMatch(false);
          }
        } else if (status === "failed") {
          console.error("Profile processing failed:", data.error_message);
          eventSource.close();
          setIsAwaitingMatch(false);
        }
      };

      eventSource.onerror = (error) => {
        console.error("EventSource failed:", error);
        eventSource.close();
        setIsAwaitingMatch(false);
      };

    } catch (error) {
      console.error("Error finding match:", error);
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
        setProfileData,
        setMatches
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
