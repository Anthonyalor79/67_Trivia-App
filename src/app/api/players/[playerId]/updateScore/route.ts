// app/api/players/[playerId]/updateScore/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await context.params;
  const numericPlayerId = Number(playerId);

  if (!Number.isInteger(numericPlayerId)) {
    return NextResponse.json(
      { error: "Invalid playerId" },
      { status: 400 }
    );
  }

  let body: {
    roundId?: number;
    selectedOptionId?: number;
    // now client-driven:
    isCorrect?: boolean;
    scoreDelta?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { roundId, selectedOptionId, isCorrect, scoreDelta } = body;

  if (!roundId || !selectedOptionId) {
    return NextResponse.json(
      { error: "roundId and selectedOptionId are required" },
      { status: 400 }
    );
  }

  if (typeof scoreDelta !== "number" || !Number.isFinite(scoreDelta)) {
    return NextResponse.json(
      { error: "scoreDelta must be a finite number" },
      { status: 400 }
    );
  }

  // guard against trolling
  if (scoreDelta < 0 || scoreDelta > 1000) {
    return NextResponse.json(
      { error: "scoreDelta out of allowed range" },
      { status: 400 }
    );
  }

  try {
    // 1) Make sure the player exists
    const player = await prisma.player.findUnique({
      where: { id: numericPlayerId },
    });

    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    // 2) Load the option, just to validate it
    const option = await prisma.option.findUnique({
      where: { id: selectedOptionId },
    });

    if (!option) {
      return NextResponse.json(
        { error: "Option not found" },
        { status: 404 }
      );
    }

    // Optional: make sure option belongs to this question/round
    if (option.questionId !== roundId) {
      return NextResponse.json(
        { error: "Option does not belong to this question" },
        { status: 400 }
      );
    }

    let updatedPlayer = player;

    // 3) Only change score if there is a positive delta
    if (scoreDelta > 0) {
      updatedPlayer = await prisma.player.update({
        where: { id: numericPlayerId },
        data: {
          score: {
            increment: scoreDelta,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      correct: !!isCorrect,
      added: scoreDelta,
      newScore: updatedPlayer.score,
    });
  } catch (err) {
    console.error("UPDATE SCORE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update score" },
      { status: 500 }
    );
  }
}
