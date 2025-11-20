// play/[roomId]/page.tsx (Player View)
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
  const [answeredRoundIds, setAnsweredRoundIds] = useState<Set<number>>(
    new Set()
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;
    let timer: any;
    async function fetchState() {
      try {
        const res = await fetch(`/api/rooms/${roomId}/state`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (res.ok) setState(data);
      } catch {
      }
    }
    fetchState();
    timer = setInterval(fetchState, 1000);
    return () => clearInterval(timer);
  }, [roomId]);

  const playerId =
    typeof window !== "undefined" ? sessionStorage.getItem("playerId") : null;

  useEffect(() => {
    if (!playerId && roomId) {
      const t = setTimeout(() => router.push(`/join?room=${roomId}`), 1500);
      return () => clearTimeout(t);
    }
  }, [playerId, roomId, router]);

  const latest = state?.rounds.at(-1) ?? null;

  const [roundStartTs, setRoundStartTs] = useState<number | null>(null);
  const lastRoundIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (latest && latest.id !== lastRoundIdRef.current) {
      lastRoundIdRef.current = latest.id;
      setRoundStartTs(Date.now());
      // Clear any "answered" 
      setSubmitting(false);
    }
  }, [latest?.id]);

  const { remainingMs, pct } = useCountdown(
    roundStartTs,
    latest?.time_limit_ms ?? null
  );

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

  const joinedCount = state?.players.length ?? 0;

  return (
<main className="min-h-screen bg-black text-white">
  <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
    {/* Header */}
<header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
  <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400 drop-shadow-[0_2px_4px_rgba(6,182,212,0.5)]">
    Room {String(roomId)}
  </h1>
  <div className="flex gap-2 items-center">
    <StatusBadge status={state?.room.status ?? "—"} />
    <span className="text-gray-300 text-sm font-mono">
      Players: <strong>{joinedCount}</strong>
    </span>
    {state?.room.code && (
      <span className="text-gray-300 text-sm font-mono">
        Code:{" "}
        <code className="bg-black/50 px-2 py-0.5 rounded-lg border border-gray-700">
          {state.room.code}
        </code>
      </span>
        )}
      </div>
    </header>

        {error && (
          <p className="text-sm text-red-300 bg-red-900/40 border border-red-700/80 rounded-lg p-3 font-mono">
            {error}
          </p>
        )}

{/* Player list */}
<section className="rounded-lg p-4 bg-gray-900/60 border border-cyan-700/50">
  <h2 className="font-semibold mb-2 font-mono text-gray-300">
    Leaderboard
  </h2>
  {joinedCount ? (
    <ul className="divide-y divide-cyan-900/50">
      {state!.players.map((p, i) => (
        <li
          key={p.playerId}
          className="flex items-center justify-between py-2"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 text-cyan-600 font-mono">
              #{i + 1}
            </span>
            <span className="font-mono">{p.name}</span>
          </div>
          <span className="text-gray-400 font-mono">
            {p.totalScore}
          </span>
        </li>
      ))}
    </ul>
          ) : (
            <p className="text-gray-400 font-mono">Waiting for players…</p>
          )}
        </section>

        {/* Question */}
<section className="rounded-lg p-5 bg-gray-900/60 border border-cyan-700/50">
  <div className="flex items-center justify-between mb-3">
    <h3 className="font-semibold font-mono text-gray-300">
      Current Question
    </h3>
    {latest?.time_limit_ms ? (
      <TimerBar
        ms={latest.time_limit_ms}
        pct={pct}
        remainingMs={remainingMs}
      />
    ) : null}
  </div>

  {!latest ? (
    <p className="text-gray-400 font-mono">
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
    <p className="mb-4 text-lg font-mono text-cyan-300">
      {latest.question.stem}
    </p>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  {latest.question.options.map((o, idx) => {
    const locked =
      submitting ||
      answeredRoundIds.has(latest.id) ||
      pct === 0;
    return (
      <button
        key={o.id}
        disabled={locked}
        onClick={() => answer(latest.id, o.id)}
        className={`rounded-lg px-4 py-3 text-left border transition
          ${
            locked
              ? "bg-gray-800/50 border-gray-700 opacity-60 cursor-not-allowed"
              : "bg-gray-900/50 border-cyan-700/60 hover:bg-cyan-900/40 hover:border-cyan-600"
          }`}
        aria-label={`Answer ${idx + 1}: ${o.text}`}
        title={`Press ${idx + 1}`}
      >
      <span className="text-cyan-500 mr-2 font-mono">
        {idx + 1}.
      </span>
      {o.text}
    </button>
  );
})}
</div>

        {answeredRoundIds.has(latest.id) && (
          <p className="mt-3 text-sm text-green-400 font-mono">
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
      className="text-cyan-500 hover:text-cyan-300 underline font-mono"
      href={`/join?room=${String(roomId)}`}
    >
        You need to join first
    </a>
  )}
</div>
</div>
</main>
);
}


function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "live"
      ? "bg-green-900/50 text-green-300 border-green-700/80"
      : status === "lobby"
      ? "bg-yellow-900/50 text-yellow-300 border-yellow-700/80"
      : status === "ended"
      ? "bg-red-900/50 text-red-300 border-red-700/80"
      : "bg-gray-800/50 text-gray-400 border-gray-700/80";
  return (
    <span className={`text-xs px-2 py-1 rounded-full border font-mono ${cls}`}>
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
      <div className="w-40 h-2 rounded-full bg-gray-700 overflow-hidden">
        <div
          className="h-full bg-pink-600"
          style={{ width: `${Math.floor(pct * 100)}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 tabular-nums font-mono">
        {remainingMs !== null
          ? Math.ceil(remainingMs / 1000)
          : Math.ceil(ms / 1000)}
        s
      </span>
    </div>
  );
}