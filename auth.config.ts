import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/sign-up",
  },
  trustHost: true,
  providers: [],
} satisfies NextAuthConfig;
