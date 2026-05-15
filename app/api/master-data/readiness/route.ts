import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [kamusCount, standarCount, scenarioCount, lastEvent] = await Promise.all([
      prisma.kamusItem.count(),
      prisma.standarJabatan.count(),
      prisma.scenario.count(),
      prisma.kamusEvent.findFirst({
        where: { eventType: "Kamus Submitted" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const ready = kamusCount > 0 && standarCount > 0 && scenarioCount > 0;

    return NextResponse.json({
      ready,
      kamusReady: kamusCount > 0,
      standarReady: standarCount > 0,
      scenarioReady: scenarioCount > 0,
      counts: {
        kamus: kamusCount,
        standarJabatan: standarCount,
        scenario: scenarioCount,
      },
      lastKamusSubmittedAt: lastEvent?.createdAt ?? null,
    });
  } catch (error) {
    console.error("[API] GET /api/master-data/readiness failed:", error);
    return NextResponse.json(
      { error: "Failed to check master data readiness" },
      { status: 500 }
    );
  }
}
