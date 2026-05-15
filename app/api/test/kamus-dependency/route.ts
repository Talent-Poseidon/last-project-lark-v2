import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Test-only helper to create a StandarJabatan that references a Kamus item,
// so we can verify deletion is blocked. Disabled in production.
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Disabled in production" }, { status: 404 });
  }
  try {
    const { kamusItemId } = await request.json();
    if (!kamusItemId) {
      return NextResponse.json({ error: "kamusItemId is required" }, { status: 400 });
    }
    const standar = await prisma.standarJabatan.create({
      data: {
        name: `Test Standar ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        level: "L1",
        description: "Auto-created for E2E dependency test",
        items: {
          create: [{ kamusItemId, expectedLevel: 3 }],
        },
      },
    });
    return NextResponse.json({ success: true, standarId: standar.id });
  } catch (error) {
    console.error("[API] POST /api/test/kamus-dependency failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
