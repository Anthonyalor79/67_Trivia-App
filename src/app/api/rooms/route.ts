export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { toSerializable } from "@/lib/serialize";

// POST /api/rooms
const CreateRoomSchema = z.object({
  code: z.string().trim().min(1).max(16).optional(),
  hostAdminId: z.string().uuid().optional(),
  categoryId: z.number().int().positive().optional(),
  totalQuestions: z.number().int().min(1).max(50).optional(),   // NEW
});

export async function GET() {
  const rooms = await prisma.rooms.findMany({
    orderBy: { created_at: "desc" },
    take: 50,
  });
  return NextResponse.json(toSerializable(rooms));
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = CreateRoomSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  if (parsed.data.categoryId) {
    const exists = await prisma.categories.findUnique({ where: { id: parsed.data.categoryId } });
    if (!exists) return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const room = await prisma.rooms.create({
    data: {
      code: parsed.data.code ?? null,
      host_admin_id: parsed.data.hostAdminId ?? null,
      status: "lobby",
      category_id: parsed.data.categoryId ?? null,
      total_questions: parsed.data.totalQuestions ?? null,         // NEW
      current_index: 0,                                            // NEW
    }
  });

  return NextResponse.json(toSerializable(room), { status: 201 });
}


export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const roomId = Number(id);
  if (!Number.isFinite(roomId)) return NextResponse.json({ error: "Invalid room id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const Schema = z.object({
    categoryId: z.number().int().positive().nullable().optional(), // null = Any category
  });
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  // If provided, validate category exists
  if (parsed.data.categoryId != null) {
    const exists = await prisma.categories.findUnique({ where: { id: parsed.data.categoryId } });
    if (!exists) return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const updated = await prisma.rooms.update({
    where: { id: roomId },
    data: { category_id: parsed.data.categoryId ?? null },
    select: { id: true, code: true, status: true, category_id: true },
  });

  return NextResponse.json(toSerializable(updated));
}