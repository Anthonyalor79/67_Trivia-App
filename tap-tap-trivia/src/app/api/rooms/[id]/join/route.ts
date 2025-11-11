export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { JoinRoomSchema } from "@/lib/validation";
import { toSerializable } from "@/lib/serialize";

type Params = { params: { id: string } };

export async function POST(req: Request, context: { params: Promise<{ id: string }>}) {
     const { id } = await context.params;           // 👈 await the params
   const roomId = Number(id);
  if (!Number.isFinite(roomId)) return NextResponse.json({ error: "Invalid room id" }, { status: 400 });

  const payload = await req.json().catch(() => ({}));
  const parsed = JoinRoomSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const room = await prisma.rooms.findUnique({ where: { id: roomId }, select: { id: true, status: true } });
  if (!room || room.status === "ended") return NextResponse.json({ error: "Room not found or ended" }, { status: 404 });

  // Create the player (anonymous) and add to room
  const player = await prisma.players.create({ data: { display_name: parsed.data.displayName } });

  await prisma.room_players.upsert({
    where: { room_id_player_id: { room_id: roomId, player_id: player.id } },
    create: { room_id: roomId, player_id: player.id },
    update: { left_at: null },
  });

  return NextResponse.json(toSerializable({ playerId: player.id, roomId }), { status: 201 });

}
