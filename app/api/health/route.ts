import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Auto-discover semua model dari Prisma DMMF
    const modelNames = Prisma.dmmf.datamodel.models.map(
      (m) => m.dbName || m.name
    );

    const tableResults: Record<string, boolean> = {};
    const missingTables: string[] = [];

    for (const table of modelNames) {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`);
        tableResults[table] = true;
      } catch {
        tableResults[table] = false;
        missingTables.push(table);
      }
    }

    const isHealthy = missingTables.length === 0;

    return NextResponse.json(
      {
        status: isHealthy ? "healthy" : "unhealthy",
        database: "connected",
        tables: tableResults,
        missingTables,
        checkedAt: new Date().toISOString(),
      },
      { status: isHealthy ? 200 : 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        error:
          error instanceof Error ? error.message : "Unknown database error",
        checkedAt: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
