import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** ------------------ GET /api/rooms/:id ------------------ **/
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await context.params;
  const numericPlayerId = Number(playerId);

  try {
    const session = await prisma.session.findFirst({
      where: { 
        players: {
          some: { id: numericPlayerId},
         }
       },
      include: {
        room: true,
        players: true,
        trivia: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Room or session not found" }, { status: 404 });
    }

    const questions = session.trivia.questions.map((q) => ({
      id: q.id,
      question: q.actualQuestion,
      options: q.options.map((o) => ({
        id: o.id,
        text: o.text,
      })),
    }));

    return NextResponse.json({
      roomId: session.roomId,
      code: session.code,
      gameStarted: session.startTime && !session.endTime ? true : false,
      gameEnded: session.endTime ? true : false,
      gameDeleted: session.endTime ? true : false,
      questionIndex: session.currentQuestionIndex,
      trivia: {
        id: session.trivia.id,
        name: session.trivia.name,
      },
      questions,
      players: session.players
    });
  } catch (err) {
    console.error("ROOM FETCH ERROR:", err);
    return NextResponse.json({ error: "Failed to load room" }, { status: 500 });
  }
}
