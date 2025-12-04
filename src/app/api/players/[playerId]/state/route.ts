import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { playerId: string } }
) {
  const playerId = await Number(params.playerId);
  if (!Number.isInteger(playerId)) {
    return NextResponse.json({ error: "Invalid playerId" }, { status: 400 });
  }

  // Step 1: find player
  const player = await prisma.player.findUnique({
    where: { id: playerId },
  });
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  // Step 2: find active session
  const session = await prisma.session.findFirst({
    where: { id: player.sessionId, endTime: null },
    include: {
      players: true,
      trivia: {
        include: {
          questions: {
            include: {
              options: true,
            },
          },
        },
      },
      room: true,
    },
  });

  if (!session) {
    return NextResponse.json(
      { error: "Active session not found" },
      { status: 404 }
    );
  }

  // Build state expected by frontend
  return NextResponse.json({
    room: {
      id: session.room.id,
      status: session.endTime ? "closed" : "active",
      code: session.code,
    },
    players: session.players.map((p) => ({
      playerId: p.id,
      name: p.username,
      totalScore: 0,
    })),
    rounds: session.trivia.questions.map((q, index) => ({
      id: q.id,
      order_in_room: index,
      time_limit_ms: null, // you can add later
      question: {
        id: q.id,
        stem: q.actualQuestion,
        options: q.options.map((o) => ({
          id: o.id,
          text: o.text,
          order: index,
        })),
      },
    })),
  });
}
