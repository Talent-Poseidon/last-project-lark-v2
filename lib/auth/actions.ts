"use server";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  console.log("[auth:action] signInWithEmail called", { email, timestamp: new Date().toISOString() });

  try {
    await signIn("credentials", {
      email,
      password: formData.get("password"),
      redirect: false,
    });
    console.log("[auth:action] signIn completed successfully", { email });
    return { success: true };
  } catch (error) {
    const errorInfo = {
      email,
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      digest: (error as any)?.digest,
      type: error instanceof AuthError ? error.type : undefined,
    };

    // NextAuth v5 beta: signIn with redirect:false can still throw
    // NEXT_REDIRECT internally. Only catch NEXT_REDIRECT, not all digest errors.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as any).digest === "string" &&
      (error as any).digest.startsWith("NEXT_REDIRECT")
    ) {
      console.log("[auth:action] caught NEXT_REDIRECT (treating as success)", { email, digest: (error as any).digest });
      return { success: true };
    }

    if (error instanceof AuthError) {
      console.error("[auth:action] AuthError", errorInfo);
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email atau password salah." };
        default:
          return { error: "Login gagal. Silakan coba lagi." };
      }
    }

    console.error("[auth:action] unexpected error", errorInfo);
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;

  if (!email || !password) {
      return { error: "Missing fields" };
  }

  try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
          return { error: "User already exists." };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      await prisma.user.create({
          data: {
              email,
              password: hashedPassword,
              name: fullName,
              is_approved: false, // Default pending approval
          },
      });

      return { success: true };
  } catch (error) {
      console.error("Signup error:", error);
      return { error: "Failed to create account." };
  }
}

export async function signInWithGoogle() {
  console.log("[auth:action] signInWithGoogle called", { timestamp: new Date().toISOString() });
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function signOutAction() {
  console.log("[auth:action] signOutAction called", { timestamp: new Date().toISOString() });
  await signOut({ redirectTo: "/auth/login" });
}
