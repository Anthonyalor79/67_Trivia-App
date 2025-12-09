// app/api/players/[playerId]/live/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const numericRoomId = Number(id);

  if (!Number.isInteger(numericRoomId)) {
    return NextResponse.json({ error: "Invalid sessionId" }, { status: 400 });
  }

  try {
    // 1) Find the player
    const session = await prisma.session.findFirst({
      where: { 
        roomId: numericRoomId,
        endTime: null
       },
    });

    if (!session) {
      return NextResponse.json({ error: "session not found" }, { status: 404 });
    }

    const players = await prisma.player.findMany({
      where: { sessionId: session.id },
    });

    return NextResponse.json({
      players
    });
  } catch (err) {
    console.error("LIVE STATE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to load live state" },
      { status: 500 }
    );
  }
}
