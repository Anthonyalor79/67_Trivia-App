"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Player as PrismaPlayer } from "@prisma/client"; // just for clarity, you can keep it as Player

type State = {
  roomId: number | null;
  code: string;
  gameStarted: boolean;
  gameEnded: boolean;
  gameDeleted: boolean;
  questionIndex: number;
  trivia: {
    id: number;
    name: string;
  } | null;
  questions: {
    id: number;
    question: string;
    options: {
      id: number;
      text: string;
    }[];
  }[] | null;
  players: PrismaPlayer[] | null;
};

const EMPTY_STATE: State = {
  roomId: null,
  code: "",
  gameStarted: false,
  gameEnded: false,
  gameDeleted: false,
  questionIndex: 0,
  trivia: null,
  questions: null,
  players: null,
};

// HELPER: Color definitions for the 4 buttons (Cyberpunk/Neon palette)
const OPTION_COLORS = [
  {
    base: "bg-pink-900/40 border-pink-500/50 text-pink-100",
    hover: "hover:bg-pink-800/60 hover:border-pink-400 hover:scale-[1.02]",
    icon: "text-pink-400",
  },
  {
    base: "bg-cyan-900/40 border-cyan-500/50 text-cyan-100",
    hover: "hover:bg-cyan-800/60 hover:border-cyan-400 hover:scale-[1.02]",
    icon: "text-cyan-400",
  },
  {
    base: "bg-violet-900/40 border-violet-500/50 text-violet-100",
    hover: "hover:bg-violet-800/60 hover:border-violet-400 hover:scale-[1.02]",
    icon: "text-violet-400",
  },
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

  const [state, setState] = useState<State>(EMPTY_STATE);
  const [players, setPlayers] = useState<PrismaPlayer[] | null>(null);
  const [gameStatus, setGameStatus] = useState<"Ready" | "Started" | "Ended">(
    "Ready"
  );

  const [submitting, setSubmitting] = useState(false);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<number>>(
    new Set()
  );
  const [error, setError] = useState<string | null>(null);

  const [roundStartTimestamp] = useState<number | null>(null); // kept for future timer use
  const lastQuestionIdRef = useRef<number | null>(null);

  // Derive current question from state
  const currentQuestion =
    state.questions &&
    state.questions.length > 0 &&
    state.questionIndex >= 0 &&
    state.questionIndex < state.questions.length
      ? state.questions[state.questionIndex]
      : null;

  const joinedCount = players?.length ?? 0;

  // ------------------------------------------------------
  // Initial Fetch state from backend
  // ------------------------------------------------------
  useEffect(() => {
    if (!playerIdFromUrl) return;

    async function fetchState() {
      try {
        const res = await fetch(`/api/players/${playerIdFromUrl}/state`, {
          cache: "no-store",
        });
        if (!res.ok) return;

        const data: State = await res.json();
        setState(data);
        setPlayers(data.players);

        const status: "Ready" | "Started" | "Ended" = data.gameEnded
          ? "Ended"
          : data.gameStarted
          ? "Started"
          : "Ready";
        setGameStatus(status);
      } catch {
        alert("Failed to load game state");
        router.push("/join");
      }
    }

    fetchState();
    // If you want live updates again, uncomment:
    // const timer = setInterval(fetchState, 1000);
    // return () => clearInterval(timer);
  }, [playerIdFromUrl, router]);

  // lightweight polling for just live changes
  useEffect(() => {
    if (!playerIdFromUrl) return;

    let isCancelled = false;
    let timer: NodeJS.Timeout | null = null;

    async function pollLiveState() {
      try {
        const res = await fetch(`/api/players/${playerIdFromUrl}/live`, {
          cache: "no-store",
        });
        if (!res.ok) return;

        const data: {
          gameStarted: boolean;
          gameEnded: boolean;
          questionIndex: number;
          players: { id: number; username: string; score: number }[];
        } = await res.json();

        if (isCancelled) return;

        // merge into existing state (do not touch questions/trivia)
        setState((prev) => ({
          ...prev,
          gameStarted: data.gameStarted,
          gameEnded: data.gameEnded,
          questionIndex: data.questionIndex,
          players: data.players as any, // or adjust your State type to match
        }));

        setPlayers(data.players as any);

        const status: "Ready" | "Started" | "Ended" = data.gameEnded
          ? "Ended"
          : data.gameStarted
          ? "Started"
          : "Ready";
        setGameStatus(status);
      } catch (err) {
        if (isCancelled) return;
        console.error("Poll live state failed:", err);
        // you can decide if you want to kick them out or just ignore
      }
    }

    // initial poll
    pollLiveState();
    // poll every second
    timer = setInterval(pollLiveState, 1000);

    return () => {
      isCancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [playerIdFromUrl]);

  // Kick out if no player id
  useEffect(() => {
    if (!playerIdFromUrl) {
      const timeoutId = setTimeout(() => router.push("/join"), 1500);
      return () => clearTimeout(timeoutId);
    }
  }, [playerIdFromUrl, router]);

  // ------------------------------------------------------
  // Answer a question
  // ------------------------------------------------------
  async function answer(selectedOptionId: number) {
    if (!playerIdFromUrl) return;
    if (!currentQuestion) return;

    const questionId = currentQuestion.id;
    if (answeredQuestionIds.has(questionId)) return;

    setSubmitting(true);
    setError(null);

    try {
      const responseTimeMilliseconds = 1000;

      const res = await fetch(
        `/api/players/${playerIdFromUrl}/updateScore`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roundId: questionId,
            selectedOptionId,
            responseTimeMilliseconds,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to submit answer");

      const data = await res.json();
      // If you want, you can read data.correct / data.newScore here
      // mark this question as answered
      setAnsweredQuestionIds(prev => new Set([...prev, questionId]));

      // allow future questions to be answered
      setSubmitting(false);
    } catch (e: any) {
      setError(e.message ?? "Failed to submit answer");
      setSubmitting(false);
    }
  }


  // ------------------------------------------------------
  // Keyboard support (1–4 for options)
  // ------------------------------------------------------
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!currentQuestion) return;
      if (submitting || answeredQuestionIds.has(currentQuestion.id)) return;

      const index = parseInt(e.key, 10);
      if (!Number.isFinite(index)) return;

      const option = currentQuestion.options[index - 1];
      if (option) answer(option.id);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentQuestion, submitting, answeredQuestionIds]);

  return (
    <main className="h-screen w-full flex flex-col items-center justify-center text-white bg-gradient-to-b from-black via-indigo-900 to-purple-900 overflow-hidden">
      {/* Main Container */}
      <div className="flex flex-col h-full w-full max-w-6xl mx-auto px-4 pt-4">
        {/* Header */}
        <header className="flex-none flex items-center justify-between gap-2 mb-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold font-mono text-cyan-400 drop-shadow-[0_2px_4px_rgba(6,182,212,0.5)]">
              Room {state.roomId ?? "?"}
            </h1>
            <StatusBadge status={gameStatus} />
          </div>

          <div className="flex gap-4 items-center">
            <span className="text-gray-300 text-sm font-mono hidden sm:inline">
              Players: <strong>{joinedCount}</strong>
            </span>
            {state.code && (
              <span className="text-gray-300 text-sm font-mono">
                Code:{" "}
                <code className="bg-black/50 px-2 py-1 rounded-lg border border-gray-700">
                  {state.code}
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

        {/* Leaderboard */}
        <section className="flex-none rounded-lg p-3 bg-gray-900/60 border border-cyan-700/50 mb-4 max-h-[15vh] overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold font-mono text-gray-300 text-sm">
              Leaderboard
            </h2>
            <span className="text-xs text-gray-500">
              {joinedCount} Joined
            </span>
          </div>
          {joinedCount && players ? (
            <ul className="divide-y divide-cyan-900/50">
              {players.map((player, index) => (
                <li
                  key={player.id}
                  className="flex items-center justify-between py-1.5 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-cyan-600 font-mono">
                      #{index + 1}
                    </span>
                    <span className="font-mono truncate max-w-[150px]">
                      {player.username}
                    </span>
                  </div>
                  <span className="text-gray-400 font-mono">
                    {player.score}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 font-mono text-sm">
              Waiting for players…
            </p>
          )}
        </section>

        {/* Question Section */}
        <section className="flex-1 flex flex-col w-full rounded-t-xl border border-b-0 border-cyan-700/50 bg-gray-950/80 p-5 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="font-bold font-mono text-gray-200 text-lg uppercase tracking-wider">
              Current Question
            </h3>
          </div>

          { gameStatus === "Ended" ? (
  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">

    {/* Animated Icon */}
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="w-28 h-28 rounded-full border-4 border-pink-600
                 flex items-center justify-center shadow-[0_0_25px_rgba(236,72,153,0.6)]"
    >
      <span className="text-4xl font-mono text-pink-400 drop-shadow-[0_0_6px_rgba(236,72,153,0.8)]">
        ✦
      </span>
    </motion.div>

    {/* Title */}
    <motion.h2
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="text-3xl sm:text-4xl font-extrabold font-mono text-pink-400
                 drop-shadow-[0_0_12px_rgba(236,72,153,0.7)]"
    >
      The Game Has Ended
    </motion.h2>

    {/* Subtitle */}
    <motion.p
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5 }}
      className="text-gray-300 font-mono text-lg max-w-md leading-relaxed"
    >
      Thank you for playing!  
      Waiting for the host to start a new game or return to the lobby.
    </motion.p>

    {/* Button */}
    <motion.button
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      onClick={() => router.push("/rooms")}
      className="mt-4 px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-500
                 border border-pink-400 text-white font-mono text-lg
                 shadow-[0_0_15px_rgba(236,72,153,0.6)] transition"
    >
      Return to Rooms
    </motion.button>

  </div>
) : gameStatus === "Ready" || !currentQuestion ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-pulse">
              <div className="w-16 h-16 rounded-full border-4 border-gray-700 border-t-cyan-500 animate-spin" />
              <p className="text-gray-400 font-mono text-xl">
                Waiting for host to start game...
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 flex flex-col"
              >
                {/* Question text */}
                <div className="flex-none mb-6">
                  <p className="text-xl sm:text-3xl font-bold font-mono text-white leading-tight drop-shadow-md">
                    {currentQuestion.question}
                  </p>
                </div>

                {/* Options grid */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                  {currentQuestion.options.map((option, index) => {
                    const locked =
                      submitting ||
                      answeredQuestionIds.has(currentQuestion.id);

                    const colorStyle = OPTION_COLORS[index % 4];

                    return (
                      <button
                        key={option.id}
                        disabled={locked}
                        onClick={() => answer(option.id)}
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
                        <div
                          className={`
                            absolute top-4 left-4 text-xs font-black font-mono px-2 py-1 rounded opacity-70
                            ${
                              locked
                                ? "bg-gray-700 text-gray-400"
                                : "bg-black/30 " + colorStyle.icon
                            }
                          `}
                        >
                          {index + 1}
                        </div>

                        <span
                          className={`text-xl sm:text-2xl font-bold font-sans tracking-wide ${
                            locked ? "text-gray-400" : "text-white"
                          }`}
                        >
                          {option.text}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Footer status */}
                <div className="h-8 shrink-0 flex items-center justify-center">
                  {answeredQuestionIds.has(currentQuestion.id) && (
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
            <a
              className="block py-2 text-cyan-500 hover:text-cyan-300 underline font-mono"
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

// --------------- Helpers unchanged -----------------
function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const statusClass =
    normalized === "started"
      ? "bg-green-900/50 text-green-300 border-green-700/80"
      : normalized === "ready"
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