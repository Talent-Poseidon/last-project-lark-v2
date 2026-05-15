import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardProvider } from "@/lib/dashboard-context";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const profile = {
    id: session.user.id,
    email: session.user.email,
    full_name: session.user.name,
    avatar_url: session.user.image,
    role: session.user.role,
    is_approved: session.user.is_approved,
    provider: session.user.provider || "email",
    created_at: new Date().toISOString(),
  };

  return (
    <DashboardProvider profile={profile}>
      <DashboardShell user={session.user} profile={profile}>
        {children}
      </DashboardShell>
    </DashboardProvider>
  );
}
