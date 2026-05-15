"use client";

import { Users, Shield, Clock, CheckCircle2 } from "lucide-react";
import { useDashboardProfile } from "@/lib/dashboard-context";

export default function DashboardPage() {
  const profile = useDashboardProfile();

  const stats = [
    {
      label: "Account Status",
      value: profile.is_approved ? "Approved" : "Pending",
      icon: profile.is_approved ? CheckCircle2 : Clock,
      color: profile.is_approved ? "text-primary" : "text-muted-foreground",
      bgColor: profile.is_approved ? "bg-primary/10" : "bg-muted",
    },
    {
      label: "Role",
      value: profile.role === "admin" ? "Administrator" : "User",
      icon: Shield,
      color: profile.role === "admin" ? "text-primary" : "text-muted-foreground",
      bgColor: profile.role === "admin" ? "bg-primary/10" : "bg-muted",
    },
    {
      label: "Provider",
      value: profile.provider === "google" ? "Google" : "Email",
      icon: Users,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {profile.full_name || "User"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {"Here's an overview of your account."}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-semibold text-foreground">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick info */}
      <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Account Details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="mt-0.5 font-medium text-foreground">{profile.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Member since</p>
            <p className="mt-0.5 font-medium text-foreground">
              {profile.created_at
                ? new Date(profile.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">User ID</p>
            <p className="mt-0.5 font-mono text-xs text-foreground">{profile.id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last sign in</p>
            <p className="mt-0.5 font-medium text-foreground">Now</p>
          </div>
        </div>
      </div>
    </div>
  );
}
