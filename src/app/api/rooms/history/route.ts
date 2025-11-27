import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Create a single Prisma client instance for this route
const prisma = new PrismaClient();

/**
 * GET /api/rooms/history
 *
 * Returns a list of past games (rooms) with:
 * - Trivia name
 * - Winner username
 * - Winner score
 * - Session end time
 *
 * This is used to show historical game results
 * on the Host Dashboard after login.
 */
export async function GET() {
  try {
    /**
     * Fetch ALL rooms from newest → oldest.
     * Includes:
     * - The session for that room
     * - All players in the session
     * - Each player's winner record (if they won)
     * - Categories assigned to the room via the RoomCategory join table
     */
    const rooms = await prisma.room.findMany({
      orderBy: {
        id: "desc",
      },
      include: {
        sessions: {
          include: {
            players: {
              include: {
                winners: true, // a player may have 0 or 1 winner rows
              },
            },
            room: {
              include: {
                categories: {
                  include: {
                    category: true, // actual Category record
                  },
                },
              },
            },
          },
        },
      },
    });

    /**
     * Flatten Prisma’s deep nested structure
     * into a clean JSON payload for the dashboard.
     */
    const formatted = rooms
      .map((room) => {
        // A room should only have one session.
        const session = room.sessions[0];
        if (!session) return null;

        // Determine winner
        const winnerPlayer = session.players.find(
          (p) => p.winners.length > 0
        );
        const winnerData = winnerPlayer?.winners[0];

        // Determine trivia/category name
        const categories = session.room.categories;
        const triviaName =
          categories?.[0]?.category?.name ?? "Unknown Trivia";

        return {
          roomId: room.id,
          triviaName,
          winnerName: winnerPlayer?.username ?? "No winner",
          winnerScore: winnerData?.score ?? 0,
          endedAt: session.endTime,
        };
      })
      .filter(Boolean); // Remove any rooms missing a session (shouldn’t happen)

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("ROOM HISTORY ERROR:", err);

    return NextResponse.json(
      { error: "Failed to load room history" },
      { status: 500 }
    );
  }
}
