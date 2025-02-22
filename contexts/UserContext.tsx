"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Gender = "male" | "female";

export interface UserInfo {
  gender: Gender;
  firstName: string;
  lastName: string;
  twitterHandle?: string;
  linkedinHandle?: string;
  pictureUrl?: string;
}

interface UserContextType {
  userInfo: UserInfo | null;
  setUserInfo: (info: UserInfo) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  return (
    <UserContext.Provider value={{ userInfo, setUserInfo }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
