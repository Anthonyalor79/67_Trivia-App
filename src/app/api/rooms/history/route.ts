import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { id: "desc" },
      include: {
        sessions: {
          include: {
            players: {
              include: { winners: true },
            },
            room: {
              include: {
                categories: {
                  include: { category: true },
                },
              },
            },
          },
        },
      },
    });

    const formatted = rooms.map((room) => {
      const session = room.sessions[0];

      // If a room has NO sessions, skip it
      if (!session) {
        return {
          roomId: room.id,
          triviaName: "Unknown Trivia",
          winnerName: "No session",
          winnerScore: 0,
          endedAt: null,
        };
      }

      // Determine winner
      const winnerPlayer = session.players.find(
        (p) => p.winners.length > 0
      );

      // Determine trivia/category name
      const categories = session.room.categories;
      const triviaName =
        categories?.[0]?.category?.name ?? "Unknown Trivia";

      return {
        roomId: room.id,
        triviaName,
        winnerName: winnerPlayer?.username ?? "No winner",
        winnerScore: winnerPlayer?.winners[0]?.score ?? 0,
        endedAt: session.endTime ?? null,
      };
    });

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("ROOM HISTORY ERROR:", err);
    return NextResponse.json(
      { error: "Failed to load room history" },
      { status: 500 }
    );
  }
}
