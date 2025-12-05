// app/api/rooms/[id]/endGame/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const roomId = Number(id);

  if (isNaN(roomId)) {
    return NextResponse.json({ error: "Invalid room id" }, { status: 400 });
  }

  // Try to read winnerId from body (it is optional)
  let winnerId: number | null = null;
  try {
    const body = await request.json().catch(() => null);
    if (body && typeof body.winnerId === "number") {
      winnerId = body.winnerId;
    }
  } catch {
    // ignore body parse errors; we can still just end the game
  }

  try {
    // Find active session
    const session = await prisma.session.findFirst({
      where: {
        roomId,
        endTime: null, // must be active
      },
      orderBy: { id: "desc" },
    });

    if (!session) {
      return NextResponse.json(
        { error: "No active session found for this room" },
        { status: 404 }
      );
    }

    // If we got a winnerId, make sure that player belongs to this session
    let winnerPlayer = null;
    if (winnerId !== null) {
      winnerPlayer = await prisma.player.findFirst({
        where: {
          id: winnerId,
          sessionId: session.id,
        },
      });

      if (!winnerPlayer) {
        return NextResponse.json(
          { error: "Winner does not belong to this session" },
          { status: 400 }
        );
      }

      // If you have a Winner model, you can record it here.
      // Adjust field names if your schema is different.
      //
      await prisma.winner.create({
        data: {
          playerId: winnerPlayer.id,
          score: winnerPlayer.score,
        },
      });
    }

    // End the session
    const updated = await prisma.session.update({
      where: { id: session.id },
      data: {
        endTime: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: updated.id,
      endTime: updated.endTime,
      winnerId: winnerPlayer ? winnerPlayer.id : null,
    });
  } catch (err) {
    console.error("END GAME ERROR:", err);
    return NextResponse.json(
      { error: "Failed to end game" },
      { status: 500 }
    );
  }
}
