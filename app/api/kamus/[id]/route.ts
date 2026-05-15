import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [standarUses, scenarioUses] = await Promise.all([
      prisma.standarJabatanItem.count({ where: { kamusItemId: id } }),
      prisma.scenarioItem.count({ where: { kamusItemId: id } }),
    ]);

    if (standarUses > 0 || scenarioUses > 0) {
      return NextResponse.json(
        {
          error:
            "Kamus item cannot be deleted because it is used in Standar Jabatan or Scenario",
          dependency: {
            standarJabatan: standarUses,
            scenario: scenarioUses,
          },
        },
        { status: 409 }
      );
    }

    await prisma.kamusItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/kamus/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete kamus item" },
      { status: 500 }
    );
  }
}
