export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AnswerSchema } from "@/lib/validation";
import { scoreAnswer } from "@/lib/score";
import { toSerializable } from "@/lib/serialize";

type Params = { params: { id: string } };

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }>}) {
    const { id } = await context.params; 
   const roomId = Number(id);
  if (!Number.isFinite(roomId)) return NextResponse.json({ error: "Invalid room id" }, { status: 400 });

  const json = await _req.json().catch(() => ({}));
  const parsed = AnswerSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  // Validate round belongs to room
  const round = await prisma.room_rounds.findUnique({
    where: { id: parsed.data.roundId },
    select: { id: true, room_id: true, question_id: true, time_limit_ms: true }
  });
  if (!round || Number(round.room_id) !== roomId) {
    return NextResponse.json({ error: "Round not found for this room" }, { status: 404 });
  }

  // Check correctness
  let isCorrect: boolean | null = null;
  if (parsed.data.selectedOptionId) {
    const opt = await prisma.answer_options.findUnique({
      where: { id: parsed.data.selectedOptionId },
      select: { id: true, question_id: true, is_correct: true }
    });
    if (!opt || Number(opt.question_id) !== Number(round.question_id)) {
      return NextResponse.json({ error: "Invalid option for this round" }, { status: 400 });
    }
    isCorrect = opt.is_correct;
  } else {
    isCorrect = false; // no answer / timeout
  }

  const awarded = scoreAnswer(Boolean(isCorrect), parsed.data.responseTimeMs);

  const saved = await prisma.room_answers.upsert({
    where: { room_round_id_player_id: { room_round_id: parsed.data.roundId, player_id: parsed.data.playerId } },
    update: {
      selected_option_id: parsed.data.selectedOptionId ?? null,
      answered_at: new Date(),
      response_time_ms: parsed.data.responseTimeMs,
      is_correct: isCorrect,
      score_awarded: awarded,
    },
    create: {
      room_round_id: parsed.data.roundId,
      player_id: parsed.data.playerId,
      selected_option_id: parsed.data.selectedOptionId ?? null,
      answered_at: new Date(),
      response_time_ms: parsed.data.responseTimeMs,
      is_correct: isCorrect,
      score_awarded: awarded,
    },
    select: { id: true, is_correct: true, score_awarded: true }
  });

  // Optional: update running totals per player in room
  await prisma.$executeRawUnsafe(`
    UPDATE room_players rp
    SET total_score = COALESCE((
      SELECT SUM(score_awarded)
      FROM room_answers ra
      JOIN room_rounds rr ON rr.id = ra.room_round_id
      WHERE rr.room_id = rp.room_id AND ra.player_id = rp.player_id
    ), 0)
    WHERE rp.room_id = ${roomId}::bigint AND rp.player_id = '${parsed.data.playerId}';
  `);

  return NextResponse.json(toSerializable(saved), { status: 201 });

}
