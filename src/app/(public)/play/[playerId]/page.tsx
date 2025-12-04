"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ... (Your Type definitions remain the same) ...
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

// HELPER: Color definitions for the 4 buttons (Cyberpunk/Neon palette)
const OPTION_COLORS = [
  // Option 1: Neon Pink
  {
    base: "bg-pink-900/40 border-pink-500/50 text-pink-100",
    hover: "hover:bg-pink-800/60 hover:border-pink-400 hover:scale-[1.02]",
    icon: "text-pink-400",
  },
  // Option 2: Cyan/Blue
  {
    base: "bg-cyan-900/40 border-cyan-500/50 text-cyan-100",
    hover: "hover:bg-cyan-800/60 hover:border-cyan-400 hover:scale-[1.02]",
    icon: "text-cyan-400",
  },
  // Option 3: Purple/Violet
  {
    base: "bg-violet-900/40 border-violet-500/50 text-violet-100",
    hover: "hover:bg-violet-800/60 hover:border-violet-400 hover:scale-[1.02]",
    icon: "text-violet-400",
  },
  // Option 4: Emerald/Green
  {
    base: "bg-emerald-900/40 border-emerald-500/50 text-emerald-100",
    hover: "hover:bg-emerald-800/60 hover:border-emerald-400 hover:scale-[1.02]",
    icon: "text-emerald-400",
  },
];

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

  const roomId = state?.room.id;

  // ... (Your useEffects for fetching state and checking ID remain exactly the same) ...
  useEffect(() => {
    if (!playerIdFromUrl) return;
    let timer: any;
    async function fetchState() {
      try {
        const res = await fetch(`/api/players/${playerIdFromUrl}/state`, { cache: "no-store" });
        if (!res.ok) return;
        const data: State = await res.json();
        setState(data);
      } catch {}
    }
    fetchState();
    timer = setInterval(fetchState, 1000);
    return () => clearInterval(timer);
  }, [playerIdFromUrl]);

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
    if (!playerIdFromUrl) return;
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

      if (!res.ok) throw new Error("Failed to submit answer");
      setAnsweredRoundIds(new Set([...answeredRoundIds, roundId]));
    } catch (e: any) {
      setError(e.message ?? "Failed to submit answer");
      setSubmitting(false);
    }
  }

  // Keyboard support logic remains the same
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!latestRound) return;
      if (submitting || answeredRoundIds.has(latestRound.id)) return;
      const index = parseInt(e.key, 10);
      if (!Number.isFinite(index)) return;
      const option = latestRound.question.options[index - 1];
      if (option) answer(latestRound.id, option.id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [latestRound, submitting, answeredRoundIds]);

  const joinedCount = state?.players.length ?? 0;

  return (
    <main className="h-screen w-full flex flex-col items-center justify-center text-white bg-gradient-to-b from-black via-indigo-900 to-purple-900 overflow-hidden">
      
      {/* Main Container */}
      <div className="flex flex-col h-full w-full max-w-6xl mx-auto px-4 pt-4">
        
        {/* Header - Made slightly more compact so buttons get more room */}
        <header className="flex-none flex items-center justify-between gap-2 mb-4">
          <div className="flex items-baseline gap-3">
             <h1 className="text-xl sm:text-2xl font-extrabold font-mono text-cyan-400 drop-shadow-[0_2px_4px_rgba(6,182,212,0.5)]">
              Room {roomId ?? "?"}
            </h1>
            <StatusBadge status={state?.room.status ?? "unknown"} />
          </div>
         
          <div className="flex gap-4 items-center">
            <span className="text-gray-300 text-sm font-mono hidden sm:inline">
              Players: <strong>{joinedCount}</strong>
            </span>
            {state?.room.code && (
              <span className="text-gray-300 text-sm font-mono">
                Code:{" "}
                <code className="bg-black/50 px-2 py-1 rounded-lg border border-gray-700">
                  {state.room.code}
                </code>
              </span>
            )}
          </div>
        </header>

        {error && (
          <p className="flex-none mb-4 text-sm text-red-300 bg-red-900/40 border border-red-700/80 rounded-lg p-3 font-mono">
            {error}
          </p>
        )}

        {/* Player Leaderboard - Collapsible or small? kept it normal for now */}
        <section className="flex-none rounded-lg p-3 bg-gray-900/60 border border-cyan-700/50 mb-4 max-h-[15vh] overflow-y-auto custom-scrollbar">
           <div className="flex justify-between items-center mb-2">
             <h2 className="font-semibold font-mono text-gray-300 text-sm">Leaderboard</h2>
             <span className="text-xs text-gray-500">{joinedCount} Joined</span>
           </div>
          {joinedCount ? (
            <ul className="divide-y divide-cyan-900/50">
              {state!.players.map((player, index) => (
                <li key={player.playerId} className="flex items-center justify-between py-1.5 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-cyan-600 font-mono">#{index + 1}</span>
                    <span className="font-mono truncate max-w-[150px]">{player.name}</span>
                  </div>
                  <span className="text-gray-400 font-mono">{player.totalScore}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 font-mono text-sm">Waiting for players…</p>
          )}
        </section>

        {/* --- BIG QUESTION SECTION --- */}
        <section className="flex-1 flex flex-col w-full rounded-t-xl border border-b-0 border-cyan-700/50 bg-gray-950/80 p-5 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
          
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="font-bold font-mono text-gray-200 text-lg uppercase tracking-wider">
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
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-pulse">
              <div className="w-16 h-16 rounded-full border-4 border-gray-700 border-t-cyan-500 animate-spin" />
              <p className="text-gray-400 font-mono text-xl">
                Waiting for host...
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={latestRound.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 flex flex-col"
              >
                {/* Question Stem */}
                <div className="flex-none mb-6">
                    <p className="text-xl sm:text-3xl font-bold font-mono text-white leading-tight drop-shadow-md">
                    {latestRound.question.stem}
                    </p>
                </div>

                {/* --- KAHOOT STYLE BUTTON GRID --- */}
                {/* flex-1 ensures the grid fills all vertical space remaining */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                  {latestRound.question.options.map((option, index) => {
                    const locked =
                      submitting ||
                      answeredRoundIds.has(latestRound.id) ||
                      percentageRemaining === 0;

                    // Get color style based on index (modulo 4 just in case)
                    const colorStyle = OPTION_COLORS[index % 4];

                    return (
                      <button
                        key={option.id}
                        disabled={locked}
                        onClick={() => answer(latestRound.id, option.id)}
                        // h-full makes buttons stretch to fill the grid cell
                        className={`
                          group relative h-full w-full rounded-2xl border-2 p-6 transition-all duration-200
                          flex flex-col items-center justify-center text-center shadow-lg
                          ${
                            locked
                              ? "bg-gray-800/80 border-gray-600 opacity-50 cursor-not-allowed grayscale"
                              : `${colorStyle.base} ${colorStyle.hover} active:scale-95`
                          }
                        `}
                      >
                         {/* Option Shape/Icon Background */}
                         <div className={`
                            absolute top-4 left-4 text-xs font-black font-mono px-2 py-1 rounded opacity-70
                            ${locked ? 'bg-gray-700 text-gray-400' : 'bg-black/30 ' + colorStyle.icon}
                         `}>
                             {index + 1}
                         </div>

                        <span className={`text-xl sm:text-2xl font-bold font-sans tracking-wide ${locked ? 'text-gray-400' : 'text-white'}`}>
                          {option.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
                
                {/* Footer Status */}
                <div className="h-8 shrink-0 flex items-center justify-center">
                    {answeredRoundIds.has(latestRound.id) && (
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="text-green-400 font-mono font-bold bg-green-900/30 px-4 py-1 rounded-full border border-green-800"
                    >
                        Answer submitted!
                    </motion.p>
                    )}
                </div>

              </motion.div>
            </AnimatePresence>
          )}
        </section>

        <div className="text-center bg-gray-950/80 w-full">
           {!playerIdFromUrl && (
            <a className="block py-2 text-cyan-500 hover:text-cyan-300 underline font-mono" href="/join">
              You need to join first
            </a>
          )}
        </div>
      </div>
    </main>
  );
}

// ... (StatusBadge, useCountdown, TimerBar remain unchanged)
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
    <div className="flex items-center gap-3 w-32 sm:w-48">
      <div className="flex-1 h-3 rounded-full bg-gray-800 overflow-hidden border border-gray-700">
        <div
          className="h-full bg-gradient-to-r from-pink-600 to-purple-600 transition-all duration-100 ease-linear"
          style={{ width: `${Math.floor(percentageRemaining * 100)}%` }}
        />
      </div>
      <span className="text-sm text-gray-300 tabular-nums font-mono font-bold">
        {remainingMilliseconds !== null
          ? Math.ceil(remainingMilliseconds / 1000)
          : Math.ceil(totalMilliseconds / 1000)}
        s
      </span>
    </div>
  );
}