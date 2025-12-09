import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** ------------------ GET /api/players/:playerId/state ------------------ **/
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await context.params;
  const numericPlayerId = Number(playerId);

  if (Number.isNaN(numericPlayerId)) {
    return NextResponse.json(
      { error: "Invalid player id" },
      { status: 400 }
    );
  }

  try {
    const session = await prisma.session.findFirst({
      where: {
        players: {
          some: { id: numericPlayerId },
        },
      },
      include: {
        room: true,
        players: true,
        trivia: {
          include: {
            questions: {
              include: {
                options: {
                  include: {
                    // this pulls Answer rows so we can know which options are correct
                    answers: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Room or session not found" },
        { status: 404 }
      );
    }

    const questions = session.trivia.questions.map((question) => ({
      id: question.id,
      question: question.actualQuestion,
      options: question.options.map((option) => ({
        id: option.id,
        text: option.text,
      })),
      // any Option that has at least one Answer row is considered "correct"
      correctOptionIds: question.options
        .filter((option) => option.answers && option.answers.length > 0)
        .map((option) => option.id),
    }));

    return NextResponse.json({
      roomId: session.roomId,
      code: session.code,
      gameStarted: !!session.startTime && !session.endTime,
      gameEnded: !!session.endTime,
      // this looks a little odd but I’m keeping your original flag behaviour
      gameDeleted: !!session.endTime,
      questionIndex: session.currentQuestionIndex,
      trivia: {
        id: session.trivia.id,
        name: session.trivia.name,
      },
      questions,
      players: session.players,
    });
  } catch (error) {
    console.error("ROOM FETCH ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load room" },
      { status: 500 }
    );
  }
}
