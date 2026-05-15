import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getDatasourceUrl() {
  const url = process.env.DATABASE_URL || "";
  if (url.includes("pooler.supabase.com") && !url.includes("pgbouncer=true")) {
    const separator = url.includes("?") ? "&" : "?";
    return url + separator + "pgbouncer=true&connection_limit=1";
  }
  return url;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ datasourceUrl: getDatasourceUrl() });

globalForPrisma.prisma = prisma;
