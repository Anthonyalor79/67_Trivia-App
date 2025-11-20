import { z } from "zod";

export const CreateRoomSchema = z.object({
  code: z.string().trim().min(1).max(16).optional(),
  hostAdminId: z.string().uuid().optional(), // can be null for now
});

export const JoinRoomSchema = z.object({
  displayName: z.string().min(1).max(32),
});

export const StartRoundSchema = z.object({
  questionId: z.number().int().positive().optional(), // if not provided, server can pick one
  timeLimitMs: z.number().int().positive().max(120_000).default(15_000),
  orderInRoom: z.number().int().positive().optional(),
});

export const AnswerSchema = z.object({
  roundId: z.number().int().positive(),
  playerId: z.string().uuid(),
  selectedOptionId: z.number().int().positive().nullable(), // null = no answer / timeout
  responseTimeMs: z.number().int().min(0).max(120_000).default(0),
});
