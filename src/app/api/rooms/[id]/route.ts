import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * DELETE /api/rooms/:id
 *
 * Deletes:
 * - RoomCategory join rows
 * - Sessions belonging to the room
 * - Players in the session
 * - Winners linked to each player
 * - Finally, the Room itself
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const roomId = Number(params.id);

  if (isNaN(roomId)) {
    return NextResponse.json(
      { error: "Invalid room ID" },
      { status: 400 }
    );
  }

  try {
    // Find the room (ensure it exists)
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        sessions: true,
        categories: true,
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Delete Winners → Players → Sessions
    await prisma.winner.deleteMany({
      where: {
        player: {
          session: {
            roomId,
          },
        },
      },
    });

    await prisma.player.deleteMany({
      where: {
        session: {
          roomId,
        },
      },
    });

    await prisma.session.deleteMany({
      where: {
        roomId,
      },
    });

    // Delete RoomCategory join entries
    await prisma.roomCategory.deleteMany({
      where: {
        roomId,
      },
    });

    // Finally delete the room
    await prisma.room.delete({
      where: { id: roomId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE ROOM ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    );
  }
}
