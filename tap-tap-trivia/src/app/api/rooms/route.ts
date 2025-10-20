export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CreateRoomSchema } from "@/lib/validation";
import { toSerializable } from "@/lib/serialize";

export async function GET() {
  const rooms = await prisma.rooms.findMany({
    orderBy: { created_at: "desc" },
    take: 50,
    select: { id: true, code: true, status: true, created_at: true, started_at: true, ended_at: true },
  });
  return NextResponse.json(toSerializable(rooms));
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = CreateRoomSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const room = await prisma.rooms.create({
    data: {
      code: parsed.data.code ?? null,
      host_admin_id: parsed.data.hostAdminId ?? null,
      status: "lobby",
    },
    select: { id: true, code: true, status: true },
  });

  return NextResponse.json(toSerializable(room), { status: 201 });
}
