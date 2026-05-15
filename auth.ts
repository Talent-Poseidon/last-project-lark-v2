import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { auth, signIn, signOut, handlers: { GET, POST } } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          console.log("[auth:authorize] Invalid input format");
          return null;
        }

        const { email, password } = parsedCredentials.data;

        try {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            console.log("[auth:authorize] User not found", { email });
            return null;
          }

          const passwordsMatch = await bcrypt.compare(password, user.password || "");
          if (!passwordsMatch) {
            console.log("[auth:authorize] Password mismatch", { email });
            return null;
          }

          console.log("[auth:authorize] Success", { email, role: user.role, approved: user.is_approved });
          return user;
        } catch (error) {
          console.error("[auth:authorize] DB ERROR", {
            name: error instanceof Error ? error.name : "Unknown",
            message: error instanceof Error ? error.message : String(error),
            email,
          });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
        console.log("[auth:signIn]", {
            userId: user?.id,
            email: user?.email,
            provider: account?.provider,
            approved: (user as any)?.is_approved,
        });
        return true;
    },
    async jwt({ token, user, account }) {
        if (user) {
            token.role = user.role;
            token.is_approved = user.is_approved;
            token.provider = account?.provider || "email";
            console.log("[auth:jwt] initial token set", {
                sub: token.sub,
                role: token.role,
                is_approved: token.is_approved,
                provider: token.provider,
            });
        }
        return token;
    },
    async session({ session, token }) {
        if (token && session.user) {
            session.user.id = token.sub as string;
            session.user.email = token.email as string;
            session.user.role = token.role as string;
            session.user.is_approved = token.is_approved as boolean;
            session.user.provider = token.provider as string;
        }
        return session;
    }
  }
});
