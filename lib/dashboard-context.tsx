"use client";

import { createContext, useContext } from "react";

export type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_approved: boolean;
  provider?: string;
  created_at?: string;
};

const DashboardContext = createContext<UserProfile | null>(null);

export function DashboardProvider({
  profile,
  children,
}: {
  profile: UserProfile;
  children: React.ReactNode;
}) {
  return (
    <DashboardContext.Provider value={profile}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardProfile() {
  const ctx = useContext(DashboardContext);
  if (!ctx)
    throw new Error(
      "useDashboardProfile must be used within DashboardProvider"
    );
  return ctx;
}
