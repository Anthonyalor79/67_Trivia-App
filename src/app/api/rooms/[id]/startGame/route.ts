import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const roomId = Number(id);

  if (isNaN(roomId)) {
    return NextResponse.json({ error: "Invalid room id" }, { status: 400 });
  }

  // Find active session for this room
  const session = await prisma.session.findFirst({
    where: {
      roomId,
      endTime: null,
    },
    orderBy: { id: "desc" },
  });

  if (!session) {
    return NextResponse.json(
      { error: "No active session found for this room" },
      { status: 404 }
    );
  }

  // Start the game by setting startTime = now
  const updated = await prisma.session.update({
    where: { id: session.id },
    data: {
      startTime: new Date(),
      // currentQuestionIndex: 0  // uncomment after adding this column
    },
  });

  return NextResponse.json({
    success: true,
    sessionId: updated.id,
    startTime: updated.startTime,
  });
}
