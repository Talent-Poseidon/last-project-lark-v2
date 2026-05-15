"use client";

import { useState } from "react";
import { Avatar, TextInput, Button, Badge, Alert } from "@mantine/core";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/lib/profile/actions";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_approved: boolean;
  created_at: string;
}

interface ProfileCardProps {
  user: any; // NextAuth User
  profile: Profile;
}

export function ProfileCard({ user, profile }: ProfileCardProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleUpdateProfile() {
    setLoading(true);
    setMessage(null);

    try {
      await updateProfile(fullName);
      setMessage({ type: "success", text: "Profile updated successfully." });
      router.refresh();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to update profile" });
    }
    
    setLoading(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Profile overview */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-1">
        <div className="flex flex-col items-center text-center">
          <Avatar
            src={profile.avatar_url}
            alt={profile.full_name || "User"}
            size={80}
            radius="xl"
            color="blue"
          >
            {(profile.full_name || user.email || "U").charAt(0).toUpperCase()}
          </Avatar>
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            {profile.full_name || "User"}
          </h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-3 flex items-center gap-2">
            <Badge
              variant="light"
              color={profile.role === "admin" ? "blue" : "gray"}
              size="sm"
            >
              {profile.role}
            </Badge>
            <Badge
              variant="light"
              color={profile.is_approved ? "green" : "yellow"}
              size="sm"
            >
              {profile.is_approved ? "Approved" : "Pending"}
            </Badge>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Joined{" "}
            {new Date(profile.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Edit form */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
        <h3 className="text-lg font-semibold text-foreground">Edit Profile</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your display name and personal information.
        </p>

        {message && (
          <Alert
            icon={
              message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )
            }
            color={message.type === "success" ? "green" : "red"}
            variant="light"
            mt="md"
            onClose={() => setMessage(null)}
            withCloseButton
          >
            {message.text}
          </Alert>
        )}

        <div className="mt-6 flex flex-col gap-4">
          <TextInput
            label="Email"
            value={user.email || ""}
            disabled
            size="md"
            classNames={{
              label: "text-foreground text-sm font-medium mb-1",
              input: "bg-muted border-border text-muted-foreground",
            }}
          />
          <TextInput
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.currentTarget.value)}
            placeholder="Your full name"
            size="md"
            classNames={{
              label: "text-foreground text-sm font-medium mb-1",
              input: "bg-background border-border text-foreground",
            }}
          />
          <TextInput
            label="User ID"
            value={user.id}
            disabled
            size="md"
            classNames={{
              label: "text-foreground text-sm font-medium mb-1",
              input: "bg-muted border-border text-muted-foreground font-mono text-xs",
            }}
          />
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleUpdateProfile}
              loading={loading}
              size="md"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
