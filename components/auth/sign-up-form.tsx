"use client";

import { useState } from "react";
import { TextInput, PasswordInput, Button, Divider, Alert } from "@mantine/core";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { signUpWithEmail, signInWithGoogle } from "@/lib/auth/actions";
import { GoogleIcon } from "@/components/icons/google-icon";

export function SignUpForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignUp(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signUpWithEmail(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      setSuccess(true);
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    const result = await signInWithGoogle();
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Account Created</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account has been created successfully. Please wait for an admin to approve your account before you can sign in.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
      {error && (
        <Alert
          icon={<AlertCircle className="h-4 w-4" />}
          color="red"
          variant="light"
          mb="md"
          onClose={() => setError(null)}
          withCloseButton
        >
          {error}
        </Alert>
      )}

      <form action={handleSignUp}>
        <div className="flex flex-col gap-4">
          <TextInput
            label="Full name"
            name="full_name"
            placeholder="John Doe"
            required
            size="md"
            classNames={{
              label: "text-foreground text-sm font-medium mb-1",
              input: "bg-background border-border text-foreground",
            }}
          />
          <TextInput
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            size="md"
            classNames={{
              label: "text-foreground text-sm font-medium mb-1",
              input: "bg-background border-border text-foreground",
            }}
          />
          <PasswordInput
            label="Password"
            name="password"
            placeholder="Min. 6 characters"
            required
            minLength={6}
            size="md"
            classNames={{
              label: "text-foreground text-sm font-medium mb-1",
              input: "bg-background border-border text-foreground",
            }}
          />
          <Button
            type="submit"
            fullWidth
            size="md"
            loading={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Create account
          </Button>
        </div>
      </form>

      <Divider
        label="Or continue with"
        labelPosition="center"
        my="lg"
        classNames={{ label: "text-muted-foreground text-xs" }}
      />

      <form action={handleGoogleLogin}>
        <Button
          type="submit"
          variant="outline"
          fullWidth
          size="md"
          loading={loading}
          leftSection={<GoogleIcon className="h-4 w-4 bg-transparent" />}
          classNames={{
            root: "border-border text-foreground hover:bg-muted",
          }}
        >
          Sign up with Google
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
