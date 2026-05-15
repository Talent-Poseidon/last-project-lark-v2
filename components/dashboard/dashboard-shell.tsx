"use client";

import React from "react"

import { Avatar, Menu, UnstyledButton } from "@mantine/core";
import {
  LayoutDashboard,
  UserCircle,
  Shield,
  LogOut,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/lib/auth/actions"; // Use Server Action wrapper

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_approved: boolean;
}

interface DashboardShellProps {
  user: any; // NextAuth User type
  profile: Profile;
  children: React.ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
];

export function DashboardShell({ user, profile, children }: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-muted">
      {/* Top navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">B</span>
            </div>
            <span className="text-lg font-semibold text-foreground">Boilerplate</span>
          </Link>

          {/* Center nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            {profile.role === "admin" && (
              <Link
                href="/admin"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith("/admin")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* User menu */}
          <Menu shadow="md" width={220} position="bottom-end">
            <Menu.Target>
              <UnstyledButton className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted">
                <Avatar
                  src={profile.avatar_url}
                  alt={profile.full_name || "User"}
                  radius="xl"
                  size="sm"
                  color="blue"
                >
                  {(profile.full_name || user.email || "U").charAt(0).toUpperCase()}
                </Avatar>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-medium leading-none text-foreground">
                    {profile.full_name || "User"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Account</Menu.Label>
              <Menu.Item
                component={Link}
                href="/dashboard/profile"
                leftSection={<UserCircle className="h-4 w-4" />}
              >
                Profile
              </Menu.Item>
              {profile.role === "admin" && (
                <Menu.Item
                  component={Link}
                  href="/admin"
                  leftSection={<Shield className="h-4 w-4" />}
                >
                  Admin Panel
                </Menu.Item>
              )}
              <Menu.Divider />
              <form action={signOutAction}>
                <Menu.Item
                  color="red"
                  type="submit"
                  component="button"
                  leftSection={<LogOut className="h-4 w-4" />}
                  className="w-full"
                >
                  Sign out
                </Menu.Item>
              </form>
            </Menu.Dropdown>
          </Menu>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">{children}</main>
    </div>
  );
}
