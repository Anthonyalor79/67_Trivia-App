import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/trivia?categoryId=1
 * Returns all Trivia sets that belong to the given category
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = Number(searchParams.get("categoryId"));

  if (!categoryId || isNaN(categoryId)) {
    return NextResponse.json(
      { error: "categoryId is required" },
      { status: 400 }
    );
  }

  try {
    const triviaSets = await prisma.trivia.findMany({
      where: { categoryId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(triviaSets);
  } catch (err) {
    console.error("TRIVIA FETCH ERROR:", err);
    return NextResponse.json(
      { error: "Failed to load trivia sets" },
      { status: 500 }
    );
  }
}
