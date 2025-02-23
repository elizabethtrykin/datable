"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface MatchedPerson {
  id: string;
  firstName: string;
  lastName: string;
}

interface MatchedPersonContextType {
  matchedPersonData: MatchedPerson | null;
  setMatchedPersonData: (data: MatchedPerson | null) => void;
  isAwaitingMatch: boolean;
  setIsAwaitingMatch: (isAwaiting: boolean) => void;
  findMatch: () => Promise<void>;
}

const MatchedPersonContext = createContext<
  MatchedPersonContextType | undefined
>(undefined);

export function MatchedPersonProvider({ children }: { children: ReactNode }) {
  const [matchedPersonData, setMatchedPersonData] =
    useState<MatchedPerson | null>(null);
  const [isAwaitingMatch, setIsAwaitingMatch] = useState(false);

  const findMatch = useCallback(async () => {
    if (isAwaitingMatch || matchedPersonData) return;

    setIsAwaitingMatch(true);
    try {
      const matchResponse = await fetch("/api/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const matchData = await matchResponse.json();
      setMatchedPersonData(matchData);
    } finally {
      setIsAwaitingMatch(false);
    }
  }, [isAwaitingMatch, matchedPersonData]);

  return (
    <MatchedPersonContext.Provider
      value={{
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
