import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminUserTable } from "@/components/admin/admin-user-table";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) redirect("/dashboard");

  let formattedUsers: {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
    is_approved: boolean;
    provider: string;
    created_at: string;
  }[] = [];

  let queryError: string | null = null;

  try {
    const users = await prisma.user.findMany({
      orderBy: { id: "desc" },
      include: { accounts: true },
    });

    formattedUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.name,
      avatar_url: u.image,
      role: u.role,
      is_approved: u.is_approved,
      provider: u.accounts[0]?.provider || "email",
      created_at: new Date().toISOString(),
    }));
  } catch (error) {
    console.error("[admin:page] Prisma findMany failed", {
      error: error instanceof Error ? error.message : error,
    });
    queryError = error instanceof Error ? error.message : "Database query failed";
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approve or manage user accounts. Users who sign in with Google need
          approval before they can access the app.
        </p>
      </div>
      {queryError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-medium text-red-800">
            Failed to load users. Please refresh the page.
          </p>
          <p className="mt-1 text-xs text-red-600">{queryError}</p>
        </div>
      ) : (
        <AdminUserTable users={formattedUsers} currentUserId={session.user.id} />
      )}
    </div>
  );
}
