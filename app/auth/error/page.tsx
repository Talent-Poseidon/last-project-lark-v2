import { AlertCircle } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const errorDescription = params.error_description;
  const errorCode = params.error_code;
  const details = params.details;

  // Check for OTP expired error
  const isOtpExpired = errorCode === "otp_expired" || errorDescription?.includes("expired");

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${isOtpExpired ? "bg-blue-100 text-blue-600" : "bg-destructive/10 text-destructive"}`}>
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {isOtpExpired ? "Link Expired" : "Authentication Error"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {isOtpExpired 
              ? "This confirmation link has expired or has already been used. Your email might already be confirmed."
              : (errorDescription || "Something went wrong during authentication. Please try again.")}
          </p>
          
          {isOtpExpired ? (
             <p className="mt-4 text-sm font-medium text-foreground">
               Please try signing in directly.
             </p>
          ) : (
            (error || errorCode || details) && (
              <div className="mt-4 rounded-md bg-muted p-3 text-xs font-mono text-left overflow-auto max-h-48 break-all">
                {errorCode && <p className="mb-1"><strong>Code:</strong> {errorCode}</p>}
                {error && <p className="mb-1"><strong>Error:</strong> {error}</p>}
                {details && <p className="mb-1 border-t pt-1 mt-1"><strong>Details:</strong> {details}</p>}
              </div>
            )
          )}
          
          {!isOtpExpired && (
            <p className="mt-3 text-xs text-muted-foreground">
               If the error persists, it might be due to a missing profile or invalid session.
            </p>
          )}

          <form action={signOutAction} className="mt-6">
             <Button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isOtpExpired ? "Go to Sign In" : "Back to sign in (Sign Out)"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
