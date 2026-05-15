"use client";

import { useState } from "react";
import { Avatar, Badge, Button, TextInput } from "@mantine/core";
import { Search, CheckCircle2, XCircle, Shield, ShieldOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { approveUser, revokeUser, toggleUserRole } from "@/lib/admin/actions";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_approved: boolean;
  provider: string | null;
  created_at: string;
}

interface AdminUserTableProps {
  users: Profile[];
  currentUserId: string;
}

export function AdminUserTable({ users, currentUserId }: AdminUserTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredUsers = users.filter(
    (u) =>
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = users.filter((u) => !u.is_approved).length;

  async function handleApprove(userId: string) {
    setLoadingId(userId);
    await approveUser(userId);
    setLoadingId(null);
  }

  async function handleRevoke(userId: string) {
    setLoadingId(userId);
    await revokeUser(userId);
    setLoadingId(null);
  }

  async function handleToggleAdmin(userId: string) {
    setLoadingId(userId);
    await toggleUserRole(userId);
    setLoadingId(null);
  }

  return (
    <div>
      {/* Summary + Search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="light" color="blue" size="lg">
            {users.length} Total Users
          </Badge>
          {pendingCount > 0 && (
            <Badge variant="light" color="yellow" size="lg">
              {pendingCount} Pending Approval
            </Badge>
          )}
        </div>
        <TextInput
          placeholder="Search users..."
          leftSection={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          size="sm"
          className="sm:w-64"
          classNames={{
            input: "bg-background border-border text-foreground",
          }}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((u) => {
                const isCurrentUser = u.id === currentUserId;
                const isLoading = loadingId === u.id;

                return (
                  <tr
                    key={u.id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={u.avatar_url}
                          alt={u.full_name || "User"}
                          size="sm"
                          radius="xl"
                          color="blue"
                        >
                          {(u.full_name || u.email || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {u.full_name || "No name"}
                            {isCurrentUser && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="light"
                        color={u.provider === "google" ? "blue" : "gray"}
                        size="sm"
                      >
                        {u.provider || "email"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="light"
                        color={u.role === "admin" ? "blue" : "gray"}
                        size="sm"
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="light"
                        color={u.is_approved ? "green" : "yellow"}
                        size="sm"
                      >
                        {u.is_approved ? "Approved" : "Pending"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {!isCurrentUser && (
                          <>
                            {u.is_approved ? (
                              <Button
                                size="xs"
                                variant="light"
                                color="red"
                                loading={isLoading}
                                onClick={() => handleRevoke(u.id)}
                                leftSection={<XCircle className="h-3 w-3" />}
                              >
                                Revoke
                              </Button>
                            ) : (
                              <Button
                                size="xs"
                                variant="light"
                                color="green"
                                loading={isLoading}
                                onClick={() => handleApprove(u.id)}
                                leftSection={
                                  <CheckCircle2 className="h-3 w-3" />
                                }
                              >
                                Approve
                              </Button>
                            )}

                            <Button
                              size="xs"
                              variant="subtle"
                              color="gray"
                              loading={isLoading}
                              onClick={() => handleToggleAdmin(u.id)}
                              title={
                                u.role === "admin"
                                  ? "Remove Admin"
                                  : "Make Admin"
                              }
                            >
                              {u.role === "admin" ? (
                                <ShieldOff className="h-4 w-4" />
                              ) : (
                                <Shield className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
