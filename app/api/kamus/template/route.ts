import { NextResponse } from "next/server";
import { KAMUS_TEMPLATE_CSV } from "@/lib/kamus/parse";

export const dynamic = "force-dynamic";

export async function GET() {
  return new NextResponse(KAMUS_TEMPLATE_CSV, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="kamus-template.csv"',
    },
  });
}
