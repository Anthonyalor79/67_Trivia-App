"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type Option = { id: number; text: string; order: number };
type Round = {
  id: number;
  order_in_room: number;
  time_limit_ms: number | null;
  question: { id: number; stem?: string | null; options: Option[] };
};
type Player = { playerId: string; name: string; totalScore: number };
type State = {
  room: { id: number; status: string; code: string | null };
  players: Player[];
  rounds: Round[];
};

export default function PlayPage() {
  const router = useRouter();
  const { roomId } = useParams<{ roomId: string }>();
  const [state, setState] = useState<State | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [answeredRoundIds, setAnsweredRoundIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // --- polling for room state
  useEffect(() => {
    if (!roomId) return;
    let timer: any;
    async function fetchState() {
      try {
        const res = await fetch(`/api/rooms/${roomId}/state`, { cache: "no-store" });
        const data = await res.json();
        if (res.ok) setState(data);
      } catch {
        /* ignore */
      }
    }
    fetchState();
    timer = setInterval(fetchState, 1000);
    return () => clearInterval(timer);
  }, [roomId]);

  const playerId =
    typeof window !== "undefined" ? sessionStorage.getItem("playerId") : null;

  // If the player came straight here without joining:
  useEffect(() => {
    if (!playerId && roomId) {
      // Soft-redirect after a moment so they can read the message
      const t = setTimeout(() => router.push(`/join?room=${roomId}`), 1500);
      return () => clearTimeout(t);
    }
  }, [playerId, roomId, router]);

  const latest = state?.rounds.at(-1) ?? null;

  // --- client-side countdown (approx): resets when the round id changes
  const [roundStartTs, setRoundStartTs] = useState<number | null>(null);
  const lastRoundIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (latest && latest.id !== lastRoundIdRef.current) {
      lastRoundIdRef.current = latest.id;
      setRoundStartTs(Date.now());
      // Clear any "answered" lock for NEW rounds
      setSubmitting(false);
    }
  }, [latest?.id]);

  const { remainingMs, pct } = useCountdown(
    roundStartTs,
    latest?.time_limit_ms ?? null
  );

  // answer submission (locks out further clicks for this round)
  async function answer(roundId: number, selectedOptionId: number) {
    if (!playerId) {
      setError("No playerId in session — redirecting to join…");
      router.push(`/join?room=${roomId}`);
      return;
    }
    if (answeredRoundIds.has(roundId)) return; // already answered
    setSubmitting(true);
    setError(null);
    try {
      const responseTimeMs =
        latest?.time_limit_ms && roundStartTs
          ? Math.max(0, Date.now() - roundStartTs)
          : 1000;

      const res = await fetch(`/api/rooms/${roomId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId,
          playerId,
          selectedOptionId,
          responseTimeMs,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to submit answer");
      }
      setAnsweredRoundIds(new Set([...answeredRoundIds, roundId]));
    } catch (e: any) {
      setError(e.message ?? "Failed to submit answer");
      setSubmitting(false); // allow retry if it failed
    }
  }

  // Keyboard shortcuts 1..9
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!latest) return;
      if (submitting || answeredRoundIds.has(latest.id)) return;
      const idx = parseInt(e.key, 10);
      if (!Number.isFinite(idx)) return;
      const opt = latest.question.options[idx - 1];
      if (opt) {
        answer(latest.id, opt.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [latest, submitting, answeredRoundIds]);

  // UI helpers
  const joinedCount = state?.players.length ?? 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-900 to-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Room {String(roomId)}
          </h1>
          <div className="flex gap-2 items-center">
            <StatusBadge status={state?.room.status ?? "—"} />
            <span className="text-white/80 text-sm">
              Players: <strong>{joinedCount}</strong>
            </span>
            {state?.room.code && (
              <span className="text-white/80 text-sm">
                Code:{" "}
                <code className="bg-black/30 px-2 py-0.5 rounded">
                  {state.room.code}
                </code>
              </span>
            )}
          </div>
        </header>

        {error && (
          <p className="text-sm text-red-200 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
            {error}
          </p>
        )}

        {/* Player list */}
        <section className="rounded-2xl p-4 bg-white/10 border border-white/15">
          <h2 className="font-semibold mb-2">Leaderboard</h2>
          {joinedCount ? (
            <ul className="divide-y divide-white/10">
              {state!.players.map((p, i) => (
                <li
                  key={p.playerId}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-white/60">#{i + 1}</span>
                    <span>{p.name}</span>
                  </div>
                  <span className="text-white/70">{p.totalScore}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-white/70">Waiting for players…</p>
          )}
        </section>

        {/* Question */}
        <section className="rounded-2xl p-5 bg-white/10 border border-white/15">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Current Question</h3>
            {latest?.time_limit_ms ? (
              <TimerBar ms={latest.time_limit_ms} pct={pct} remainingMs={remainingMs} />
            ) : null}
          </div>

          {!latest ? (
            <p className="text-white/70">
              No round yet. Waiting for host to start…
            </p>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={latest.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <p className="mb-4 text-lg">{latest.question.stem}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {latest.question.options.map((o, idx) => {
                    const locked =
                      submitting || answeredRoundIds.has(latest.id) || pct === 0;
                    return (
                      <button
                        key={o.id}
                        disabled={locked}
                        onClick={() => answer(latest.id, o.id)}
                        className={`rounded-2xl px-4 py-3 text-left border backdrop-blur transition
                          ${
                            locked
                              ? "bg-white/10 border-white/15 opacity-70 cursor-not-allowed"
                              : "bg-white/10 hover:bg-white/20 border-white/20"
                          }`}
                        aria-label={`Answer ${idx + 1}: ${o.text}`}
                        title={`Press ${idx + 1}`}
                      >
                        <span className="text-white/60 mr-2">{idx + 1}.</span>
                        {o.text}
                      </button>
                    );
                  })}
                </div>

                {answeredRoundIds.has(latest.id) && (
                  <p className="mt-3 text-sm text-emerald-200">
                    Answer submitted! Waiting for the next round…
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </section>

        {/* Back links */}
        <div className="text-center">
          {!playerId && (
            <a
              className="text-white/80 hover:text-white underline"
              href={`/join?room=${String(roomId)}`}
            >
              ← You need to join first
            </a>
          )}
        </div>
      </div>
    </main>
  );
}

/* ---------------- Small components & hooks ---------------- */

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "live"
      ? "bg-emerald-400/20 text-emerald-200 border-emerald-400/30"
      : status === "lobby"
      ? "bg-yellow-400/20 text-yellow-200 border-yellow-400/30"
      : status === "ended"
      ? "bg-rose-400/20 text-rose-200 border-rose-400/30"
      : "bg-slate-400/20 text-slate-200 border-slate-400/30";
  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${cls}`}>
      {status.toUpperCase()}
    </span>
  );
}

function useCountdown(startTs: number | null, totalMs: number | null) {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    if (!totalMs) return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [totalMs]);

  if (!startTs || !totalMs) return { remainingMs: null, pct: 1 };

  const elapsed = Math.max(0, now - startTs);
  const remaining = Math.max(0, totalMs - elapsed);
  const pct = Math.max(0, Math.min(1, remaining / totalMs));
  return { remainingMs: remaining, pct };
}

function TimerBar({
  ms,
  pct,
  remainingMs,
}: {
  ms: number;
  pct: number;
  remainingMs: number | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-40 h-2 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full bg-yellow-400"
          style={{ width: `${Math.floor(pct * 100)}%` }}
        />
      </div>
      <span className="text-xs text-white/70 tabular-nums">
        {remainingMs !== null ? Math.ceil(remainingMs / 1000) : Math.ceil(ms / 1000)}s
      </span>
    </div>
  );
}
