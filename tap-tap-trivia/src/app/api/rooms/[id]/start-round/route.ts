export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { StartRoundSchema } from "@/lib/validation";
import { toSerializable } from "@/lib/serialize";

type Params = { params: { id: string } };

export async function POST(req: Request, context: { params: Promise<{ id: string }>}) {
   const { id } = await context.params;           // 👈 await the params
   const roomId = Number(id);
  if (!Number.isFinite(roomId)) {
    return NextResponse.json({ error: "Invalid room id" }, { status: 400 });
  }

  const room = await prisma.rooms.findUnique({ where: { id: roomId }, select: { id: true, status: true } });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.status === "ended") return NextResponse.json({ error: "Room has ended" }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const parsed = StartRoundSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  // Ensure there are active questions
  const anyActive = await prisma.questions.count({ where: { is_active: true } });
  if (!anyActive) return NextResponse.json({ error: "No active questions found" }, { status: 404 });

  // If questionId not provided, pick the latest active (simple MVP)
  const qid = parsed.data.questionId ?? (await pickAnyActiveQuestionId());

  const lastRound = await prisma.room_rounds.findFirst({
    where: { room_id: roomId },
    orderBy: { order_in_room: "desc" },
    select: { order_in_room: true },
  });
  const order = parsed.data.orderInRoom ?? ((lastRound?.order_in_room ?? 0) + 1);

  const round = await prisma.room_rounds.create({
    data: {
      room_id: roomId,
      question_id: qid,
      order_in_room: order,
      time_limit_ms: parsed.data.timeLimitMs,
    },
    select: { id: true, question_id: true, order_in_room: true, time_limit_ms: true }
  });

  const question = await prisma.questions.findUnique({
    where: { id: round.question_id },
    select: {
      id: true, stem: true, difficulty: true, category_id: true,
      answer_options: { select: { id: true, text: true, order: true }, orderBy: { order: "asc" } }
    }
  });

  return NextResponse.json(toSerializable({ round, question }), { status: 201 });
}

async function pickAnyActiveQuestionId(): Promise<number> {
  const q = await prisma.questions.findFirst({
    where: { is_active: true },
    select: { id: true },
    orderBy: { id: "desc" },
  });
  if (!q) throw new Error("No active questions");
  return Number(q.id);
}
