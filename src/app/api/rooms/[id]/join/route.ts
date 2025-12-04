// app/api/rooms/[id]/join/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const roomIdFromPath = Number(id);

  if (isNaN(roomIdFromPath)) {
    return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
  }

  let body: {
    displayName?: string;
    roomId?: number;
    roomCode?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const displayName = body.displayName?.trim();
  const roomCode = body.roomCode?.trim();

  if (!displayName || !roomCode) {
    return NextResponse.json(
      { error: "Display name and room code are required" },
      { status: 400 }
    );
  }

  // Optional: ensure body.roomId matches the path
  if (body.roomId && body.roomId !== roomIdFromPath) {
    return NextResponse.json(
      { error: "Room ID mismatch" },
      { status: 400 }
    );
  }

  try {
    // 1) Find a session for this room + code
    const session = await prisma.session.findFirst({
      where: {
        roomId: roomIdFromPath,
        code: roomCode,
        endTime: null,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "No active session found for this room and code" },
        { status: 404 }
      );
    }

    // 2) Prevent duplicate username in same session (matches @@unique constraint)
    const existingPlayer = await prisma.player.findFirst({
      where: {
        username: displayName,
        sessionId: session.id,
      },
    });

    if (existingPlayer) {
      return NextResponse.json(
        { error: "That name is already taken in this game" },
        { status: 409 }
      );
    }

    // 3) Create the player
    const player = await prisma.player.create({
      data: {
        username: displayName,
        sessionId: session.id,
      },
    });

    return NextResponse.json(
      {
        playerId: player.id,
        sessionId: session.id,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("JOIN ROOM ERROR:", err);
    return NextResponse.json(
      { error: "Failed to join room" },
      { status: 500 }
    );
  }
}
