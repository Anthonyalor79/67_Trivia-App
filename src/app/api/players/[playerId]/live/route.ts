// app/api/players/[playerId]/live/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await context.params;
  const numericPlayerId = Number(playerId);

  if (!Number.isInteger(numericPlayerId)) {
    return NextResponse.json({ error: "Invalid playerId" }, { status: 400 });
  }

  try {
    // 1) Find the player
    const player = await prisma.player.findUnique({
      where: { id: numericPlayerId },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // 2) Find their session
    const session = await prisma.session.findUnique({
      where: { id: player.sessionId },
      include: {
        players: true, // we just need the players for leaderboard
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const gameStarted = !!session.startTime && !session.endTime;
    const gameEnded = !!session.endTime;

    // Sort players by score descending if you want leaderboard order
    const players = session.players
      .slice()
      .sort((a, b) => b.score - a.score)
      .map((p) => ({
        id: p.id,
        username: p.username,
        score: p.score,
      }));

    return NextResponse.json({
      gameStarted,
      gameEnded,
      questionIndex: session.currentQuestionIndex,
      players,
    });
  } catch (err) {
    console.error("LIVE STATE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to load live state" },
      { status: 500 }
    );
  }
}
