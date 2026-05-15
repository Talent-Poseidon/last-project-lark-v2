"use client";

import { ProfileCard } from "@/components/dashboard/profile-card";
import { useDashboardProfile } from "@/lib/dashboard-context";

export default function ProfilePage() {
  const profile = useDashboardProfile();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal information
        </p>
      </div>
      <ProfileCard
        user={{ id: profile.id, email: profile.email }}
        profile={{
          ...profile,
          created_at: profile.created_at || new Date().toISOString(),
        }}
      />
    </div>
  );
}
