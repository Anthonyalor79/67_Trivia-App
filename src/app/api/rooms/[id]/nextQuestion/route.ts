// app/api/rooms/[id]/nextQuestion/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ⬅️ await params
  const roomId = Number(id);

  if (isNaN(roomId)) {
    return NextResponse.json({ error: "Invalid room id" }, { status: 400 });
  }

  try {
    // Find the latest active session for this room
    const session = await prisma.session.findFirst({
      where: {
        roomId,
        endTime: null,
      },
      orderBy: { id: "desc" },
      include: {
        players: true,
        trivia: {
          include: {
            questions: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "No active session found for this room" },
        { status: 404 }
      );
    }

    const totalQuestions = session.trivia.questions.length;

    // Optional safety: do not move past last question
    if (session.currentQuestionIndex + 1 >= totalQuestions) {
      return NextResponse.json(
        {
          error: "Already at last question",
          currentQuestionIndex: session.currentQuestionIndex,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.session.update({
      where: { id: session.id },
      data: {
        currentQuestionIndex: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: updated.id,
      currentQuestionIndex: updated.currentQuestionIndex,
      players: session.players
    });
  } catch (err) {
    console.error("NEXT QUESTION ERROR:", err);
    return NextResponse.json(
      { error: "Failed to move to next question" },
      { status: 500 }
    );
  }
}
