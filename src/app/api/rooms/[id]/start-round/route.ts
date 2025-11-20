export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toSerializable } from "@/lib/serialize";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const roomId = Number(id);
  if (!Number.isFinite(roomId)) return NextResponse.json({ error: "Invalid room id" }, { status: 400 });

  const [room, players, rounds] = await Promise.all([
    prisma.rooms.findUnique({
      where: { id: roomId }
    }),
    prisma.room_players.findMany({
      where: { room_id: roomId },
      select: { player_id: true, total_score: true, players: { select: { display_name: true } } },
      orderBy: { total_score: "desc" },
    }),
    prisma.room_rounds.findMany({
      where: { room_id: roomId },
      orderBy: { order_in_room: "asc" },
      select: {
        id: true,
        order_in_room: true,
        time_limit_ms: true,
        started_at: true,
        question_id: true,
        questions: {
          select: {
            stem: true,
            answer_options: { select: { id: true, text: true, order: true }, orderBy: { order: "asc" } },
          },
        },
      },
    }),
  ]);

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const safeRounds = rounds.map((r) => ({
    id: r.id,
    order_in_room: r.order_in_room,
    time_limit_ms: r.time_limit_ms,
    started_at: r.started_at,
    question: {
      id: r.question_id,
      stem: r.questions?.stem ?? null,
      options: r.questions?.answer_options.map((o) => ({ id: o.id, text: o.text, order: o.order })) ?? [],
    },
  }));

  const roster = players.map((p) => ({
    playerId: p.player_id,
    name: p.players.display_name,
    totalScore: p.total_score,
  }));

  return NextResponse.json(toSerializable({ room, players: roster, rounds: safeRounds }));
}
