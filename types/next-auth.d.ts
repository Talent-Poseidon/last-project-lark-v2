
import { DefaultSession } from "next-auth";
import { User as PrismaUser } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      is_approved: boolean;
      provider: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    is_approved: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    is_approved: boolean;
    provider: string;
  }
}
