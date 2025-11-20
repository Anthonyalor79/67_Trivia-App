export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toSerializable } from "@/lib/serialize";

export async function GET() {
  const cats = await prisma.categories.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
  return NextResponse.json(toSerializable(cats));
}