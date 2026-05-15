import { Clock } from "lucide-react";
import { signOut } from "@/auth";

export default function PendingApprovalPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
          <Clock className="h-6 w-6 text-yellow-600" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Account Pending Approval</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account is currently pending approval from an administrator. 
          You will be able to sign in once your account has been approved.
        </p>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/auth/login" });
          }}
        >
          <button 
            type="submit"
            className="mt-6 inline-block text-sm font-medium text-primary hover:underline bg-transparent border-none cursor-pointer p-0"
          >
            Back to sign in
          </button>
        </form>
      </div>
    </main>
  );
}
