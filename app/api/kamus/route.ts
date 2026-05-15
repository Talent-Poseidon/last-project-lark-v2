import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseKamusCsv } from "@/lib/kamus/parse";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type");
    const search = searchParams.get("q");

    const items = await prisma.kamusItem.findMany({
      where: {
        ...(typeFilter && typeFilter !== "all" ? { type: typeFilter } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { code: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { code: "asc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("[API] GET /api/kamus failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch kamus" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let text = "";
    let confirm = false;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      const confirmRaw = form.get("confirm");
      confirm = confirmRaw === "true" || confirmRaw === "1";
      if (!file || typeof file === "string") {
        return NextResponse.json(
          { error: "Missing file" },
          { status: 400 }
        );
      }
      text = await (file as File).text();
    } else {
      const body = await request.json();
      text = body.csv || body.text || "";
      confirm = body.confirm === true;
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "File is empty" },
        { status: 400 }
      );
    }

    const { rows, errors } = parseKamusCsv(text);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", errors, rows },
        { status: 400 }
      );
    }

    const existing = await prisma.kamusItem.findMany();
    const existingByCode = new Map(existing.map((e) => [e.code, e]));

    const created: typeof rows = [];
    const updated: typeof rows = [];
    const unchanged: typeof rows = [];
    const incomingCodes = new Set(rows.map((r) => r.code));
    const deleted = existing.filter((e) => !incomingCodes.has(e.code));

    for (const row of rows) {
      const existingRow = existingByCode.get(row.code);
      if (!existingRow) {
        created.push(row);
      } else if (
        existingRow.name !== row.name ||
        existingRow.type !== row.type ||
        existingRow.description !== row.description ||
        existingRow.behavioralIndicators !== row.behavioralIndicators
      ) {
        updated.push(row);
      } else {
        unchanged.push(row);
      }
    }

    if (!confirm && existing.length > 0) {
      return NextResponse.json({
        preview: true,
        created,
        updated,
        unchanged,
        deleted: deleted.map((d) => ({
          code: d.code,
          name: d.name,
          type: d.type,
        })),
      });
    }

    const blockedDeletes: { code: string; reason: string }[] = [];
    for (const d of deleted) {
      const [standarUses, scenarioUses] = await Promise.all([
        prisma.standarJabatanItem.count({ where: { kamusItemId: d.id } }),
        prisma.scenarioItem.count({ where: { kamusItemId: d.id } }),
      ]);
      if (standarUses > 0 || scenarioUses > 0) {
        blockedDeletes.push({
          code: d.code,
          reason: `Used by ${standarUses} Standar Jabatan and ${scenarioUses} Scenario`,
        });
      }
    }
    if (blockedDeletes.length > 0) {
      return NextResponse.json(
        {
          error: "Some items cannot be deleted because they are in use",
          blockedDeletes,
        },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const row of created) {
        await tx.kamusItem.create({
          data: {
            code: row.code,
            name: row.name,
            type: row.type,
            description: row.description,
            behavioralIndicators: row.behavioralIndicators,
          },
        });
      }
      for (const row of updated) {
        await tx.kamusItem.update({
          where: { code: row.code },
          data: {
            name: row.name,
            type: row.type,
            description: row.description,
            behavioralIndicators: row.behavioralIndicators,
          },
        });
      }
      for (const d of deleted) {
        await tx.kamusItem.delete({ where: { id: d.id } });
      }
      await tx.kamusEvent.create({
        data: {
          eventType: "Kamus Submitted",
          itemsCount: rows.length,
          payload: JSON.stringify({
            createdCount: created.length,
            updatedCount: updated.length,
            deletedCount: deleted.length,
          }),
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        event: "Kamus Submitted",
        createdCount: created.length,
        updatedCount: updated.length,
        deletedCount: deleted.length,
        totalItems: rows.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] POST /api/kamus failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit kamus" },
      { status: 500 }
    );
  }
}
