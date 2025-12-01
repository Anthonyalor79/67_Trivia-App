import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * POST /api/rooms
 *
 * Creates a NEW Room + Session for gameplay.
 * The host chooses:
 *   - categoryId (Category)
 *   - triviaId   (Trivia pack within that Category)
 *
 * We auto-generate:
 *   - room code (5 chars)
 *   - session linked to the room
 */
export async function POST(req: Request) {
  try {
    // Extract JSON body from request
    const { categoryId, triviaId } = await req.json();

    // Validate required trivia selection
    if (!triviaId) {
      return NextResponse.json(
        { error: "A trivia set must be selected." },
        { status: 400 }
      );
    }

    // OPTIONAL: ensure category exists (good fail-safe)
    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!categoryExists) {
        return NextResponse.json(
          { error: "Invalid category ID." },
          { status: 400 }
        );
      }
    }

    // Ensure trivia exists
    const trivia = await prisma.trivia.findUnique({
      where: { id: triviaId },
    });

    if (!trivia) {
      return NextResponse.json(
        { error: "Invalid trivia set." },
        { status: 400 }
      );
    }

    // Generate a simple 5-character join code
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();

    /**
     * Create the Room first.
     * For now we use a placeholder adminId = 1 because:
     *   - You will later pull the logged-in admin from session/JWT
     *   - For development, this is OK
     */
    const newRoom = await prisma.room.create({
      data: {
        adminId: 1, // TODO: replace with real admin ID after login integration
        // Create RoomCategory join entry if category defined
        categories:
          categoryId != null
            ? {
                create: {
                  categoryId,
                },
              }
            : undefined,
      },
    });

    /**
     * Create Session linked to this room.
     * This session has:
     *  - triviaId (the pack chosen)
     *  - join code
     *  - startTime is NOT set yet
     *  - endTime is NOT set yet
     */
    const session = await prisma.session.create({
      data: {
        roomId: newRoom.id,
        triviaId,
        code,
      },
    });

    return NextResponse.json(
      {
        id: newRoom.id,
        sessionId: session.id,
        code,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("CREATE ROOM ERROR:", err);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
