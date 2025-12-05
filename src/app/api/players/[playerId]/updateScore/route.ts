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
    return NextResponse.json({ error: "Invalid playerId" }, { status: 400 });
  }

  let body: {
    roundId?: number;
    selectedOptionId?: number;
    responseTimeMilliseconds?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { roundId, selectedOptionId } = body;

  if (!roundId || !selectedOptionId) {
    return NextResponse.json(
      { error: "roundId and selectedOptionId are required" },
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

    // 3) Check if this option is correct by looking in Answer table
    const correctAnswer = await prisma.answer.findFirst({
      where: { optionId: selectedOptionId },
    });

    const isCorrect = !!correctAnswer;

    let updatedPlayer = player;

    if (isCorrect) {
      // 4) Update the player score. Adjust the increment value to whatever you want.
      updatedPlayer = await prisma.player.update({
        where: { id: numericPlayerId },
        data: {
          score: {
            increment: 100, // e.g. +100 points for a correct answer
          },
        },
      });
    }

    return NextResponse.json({
      correct: isCorrect,
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
