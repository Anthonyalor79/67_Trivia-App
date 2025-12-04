"use client";

import { useEffect, useRef, useState } from "react";
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
  const params = useParams<{ playerId: string }>();
  const playerIdFromUrl = params.playerId;

  const [state, setState] = useState<State | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [answeredRoundIds, setAnsweredRoundIds] = useState<Set<number>>(
    new Set()
  );
  const [error, setError] = useState<string | null>(null);

  const latestRound = state?.rounds.at(-1) ?? null;
  const [roundStartTimestamp, setRoundStartTimestamp] = useState<number | null>(
    null
  );
  const lastRoundIdRef = useRef<number | null>(null);

  // roomId comes from the state we fetch using playerId
  const roomId = state?.room.id;

  // fetch state by playerId
  useEffect(() => {
    if (!playerIdFromUrl) return;

    let timer: any;

    async function fetchState() {
      try {
        const res = await fetch(`/api/players/${playerIdFromUrl}/state`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data: State = await res.json();
        setState(data);
      } catch {
        // you could set an error here if you want
      }
    }

    fetchState();
    timer = setInterval(fetchState, 1000);

    return () => clearInterval(timer);
  }, [playerIdFromUrl]);

  // if we have no playerId at all, send them back to join
  useEffect(() => {
    if (!playerIdFromUrl) {
      const timeoutId = setTimeout(() => router.push("/join"), 1500);
      return () => clearTimeout(timeoutId);
    }
  }, [playerIdFromUrl, router]);

  useEffect(() => {
    if (latestRound && latestRound.id !== lastRoundIdRef.current) {
      lastRoundIdRef.current = latestRound.id;
      setRoundStartTimestamp(Date.now());
      setSubmitting(false);
    }
  }, [latestRound?.id]);

  const { remainingMilliseconds, percentageRemaining } = useCountdown(
    roundStartTimestamp,
    latestRound?.time_limit_ms ?? null
  );

  async function answer(roundId: number, selectedOptionId: number) {
    if (!playerIdFromUrl) {
      setError("No playerId in url. Redirecting to join.");
      router.push(
        roomId ? `/join?room=${roomId}` : "/join"
      );
      return;
    }
    if (answeredRoundIds.has(roundId)) return;

    setSubmitting(true);
    setError(null);

    try {
      const responseTimeMilliseconds =
        latestRound?.time_limit_ms && roundStartTimestamp
          ? Math.max(0, Date.now() - roundStartTimestamp)
          : 1000;

      const res = await fetch(`/api/players/${playerIdFromUrl}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId,
          selectedOptionId,
          responseTimeMilliseconds,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to submit answer");
      }

      setAnsweredRoundIds(new Set([...answeredRoundIds, roundId]));
    } catch (e: any) {
      setError(e.message ?? "Failed to submit answer");
      setSubmitting(false);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!latestRound) return;
      if (submitting || answeredRoundIds.has(latestRound.id)) return;
      const index = parseInt(e.key, 10);
      if (!Number.isFinite(index)) return;
      const option = latestRound.question.options[index - 1];
      if (option) {
        answer(latestRound.id, option.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [latestRound, submitting, answeredRoundIds]);

  const joinedCount = state?.players.length ?? 0;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400 drop-shadow-[0_2px_4px_rgba(6,182,212,0.5)]">
            Room {roomId ?? "?"}
          </h1>
          <div className="flex gap-2 items-center">
            <StatusBadge status={state?.room.status ?? "unknown"} />
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
              {state!.players.map((player, index) => (
                <li
                  key={player.playerId}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-cyan-600 font-mono">
                      #{index + 1}
                    </span>
                    <span className="font-mono">{player.name}</span>
                  </div>
                  <span className="text-gray-400 font-mono">
                    {player.totalScore}
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
            {latestRound?.time_limit_ms ? (
              <TimerBar
                totalMilliseconds={latestRound.time_limit_ms}
                percentageRemaining={percentageRemaining}
                remainingMilliseconds={remainingMilliseconds}
              />
            ) : null}
          </div>

          {!latestRound ? (
            <p className="text-gray-400 font-mono">
              No round yet. Waiting for host to start…
            </p>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={latestRound.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <p className="mb-4 text-lg font-mono text-cyan-300">
                  {latestRound.question.stem}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {latestRound.question.options.map((option, index) => {
                    const locked =
                      submitting ||
                      answeredRoundIds.has(latestRound.id) ||
                      percentageRemaining === 0;
                    return (
                      <button
                        key={option.id}
                        disabled={locked}
                        onClick={() => answer(latestRound.id, option.id)}
                        className={`rounded-lg px-4 py-3 text-left border transition
                          ${
                            locked
                              ? "bg-gray-800/50 border-gray-700 opacity-60 cursor-not-allowed"
                              : "bg-gray-900/50 border-cyan-700/60 hover:bg-cyan-900/40 hover:border-cyan-600"
                          }`}
                        aria-label={`Answer ${index + 1}: ${option.text}`}
                        title={`Press ${index + 1}`}
                      >
                        <span className="text-cyan-500 mr-2 font-mono">
                          {index + 1}.
                        </span>
                        {option.text}
                      </button>
                    );
                  })}
                </div>

                {answeredRoundIds.has(latestRound.id) && (
                  <p className="mt-3 text-sm text-green-400 font-mono">
                    Answer submitted! Waiting for the next round…
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </section>

        {/* Back link */}
        <div className="text-center">
          {!playerIdFromUrl && (
            <a
              className="text-cyan-500 hover:text-cyan-300 underline font-mono"
              href="/join"
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
  const normalized = status.toLowerCase();
  const statusClass =
    normalized === "live"
      ? "bg-green-900/50 text-green-300 border-green-700/80"
      : normalized === "lobby"
      ? "bg-yellow-900/50 text-yellow-300 border-yellow-700/80"
      : normalized === "ended"
      ? "bg-red-900/50 text-red-300 border-red-700/80"
      : "bg-gray-800/50 text-gray-400 border-gray-700/80";

  return (
    <span
      className={`text-xs px-2 py-1 rounded-full border font-mono ${statusClass}`}
    >
      {normalized.toUpperCase()}
    </span>
  );
}

function useCountdown(
  startTimestamp: number | null,
  totalMilliseconds: number | null
) {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    if (!totalMilliseconds) return;
    const intervalId = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(intervalId);
  }, [totalMilliseconds]);

  if (!startTimestamp || !totalMilliseconds) {
    return { remainingMilliseconds: null, percentageRemaining: 1 };
  }

  const elapsed = Math.max(0, now - startTimestamp);
  const remaining = Math.max(0, totalMilliseconds - elapsed);
  const percentageRemaining = Math.max(
    0,
    Math.min(1, remaining / totalMilliseconds)
  );

  return { remainingMilliseconds: remaining, percentageRemaining };
}

function TimerBar({
  totalMilliseconds,
  percentageRemaining,
  remainingMilliseconds,
}: {
  totalMilliseconds: number;
  percentageRemaining: number;
  remainingMilliseconds: number | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-40 h-2 rounded-full bg-gray-700 overflow-hidden">
        <div
          className="h-full bg-pink-600"
          style={{ width: `${Math.floor(percentageRemaining * 100)}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 tabular-nums font-mono">
        {remainingMilliseconds !== null
          ? Math.ceil(remainingMilliseconds / 1000)
          : Math.ceil(totalMilliseconds / 1000)}
        s
      </span>
    </div>
  );
}
