import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** ------------------ GET /api/rooms/:id ------------------ **/
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const roomId = Number(id);

  if (isNaN(roomId)) {
    return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
  }

  try {
    const session = await prisma.session.findFirst({
      where: { roomId },
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
      roomId,
      code: session.code,
      gameStarted: session.startTime && !session.endTime ? true : false,
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

/** ------------------ DELETE /api/rooms/:id ------------------ **/
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const roomId = Number(id);

  if (isNaN(roomId)) {
    return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
  }

  try {
    const room = await prisma.room.findUnique({ where: { id: roomId } });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    await prisma.winner.deleteMany({
      where: { player: { session: { roomId } } },
    });

    await prisma.player.deleteMany({
      where: { session: { roomId } },
    });

    await prisma.session.deleteMany({
      where: { roomId },
    });

    await prisma.roomCategory.deleteMany({
      where: { roomId },
    });

    await prisma.room.delete({ where: { id: roomId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE ROOM ERROR:", err);
    return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
  }
}
