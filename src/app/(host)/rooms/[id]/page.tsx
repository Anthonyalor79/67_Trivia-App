"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

type Player = { id: string; name: string };

export default function HostPage() {
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [roomCode, setRoomCode] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  const currentQuestion =
    currentIndex >= 0 && currentIndex < questions.length
      ? questions[currentIndex]
      : null;

  // ------------------------------------------------------
  // Load room + trivia questions
  // ------------------------------------------------------
  useEffect(() => {
    async function loadRoom() {
      try {
        const res = await fetch(`/api/rooms/${id}`);
        const data = await res.json();

        setRoomCode(data.code);
        setQuestions(data.questions);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load room:", err);
      }
    }

    loadRoom();
  }, [id]);

  // ------------------------------------------------------
  // Host starts the round – move from lobby to question 1
  // ------------------------------------------------------
  function handleStartRound() {
    if (questions.length === 0) {
      alert("This trivia set has no questions.");
      return;
    }

    setCurrentIndex(0); // round starts → first question loads
  }

  // ------------------------------------------------------
  // Next question or finish game
  // ------------------------------------------------------
  function handleNextQuestion() {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      alert("Game finished!");
      // Later we can redirect or show leaderboard
    }
  }

  // ------------------------------------------------------
  // Loading State
  // ------------------------------------------------------
  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen text-white">
        Loading room...
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-white bg-gradient-to-b from-black via-indigo-900 to-purple-900">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div className="rounded-lg bg-gray-900/60 border border-cyan-700/50 p-6 sm:p-8 shadow-2xl shadow-cyan-900/50">

          {/* ---------------------------------------------------- */}
          {/* Header Bar (Start Round button disappears after start) */}
          {/* ---------------------------------------------------- */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <h1 className="text-3xl font-extrabold font-mono text-cyan-400 drop-shadow-[0_2px_4px_rgba(6,182,212,0.5)]">
              Host — Room {roomCode}
            </h1>

            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-lg px-4 py-2 bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-700/40 transition text-sm font-mono"
              >
                Refresh
              </button>

              {/* Only show Start Round BEFORE the first question */}
              {currentIndex === -1 && (
                <button
                  type="button"
                  onClick={handleStartRound}
                  className="rounded-lg px-5 py-2 bg-pink-600 text-white font-semibold font-mono hover:bg-pink-500 transition shadow-lg shadow-[0_0_12px_rgba(219,39,119,0.6)]"
                >
                  Start Round
                </button>
              )}
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* Room Info + Players List                            */}
          {/* ---------------------------------------------------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg bg-gray-800/70 p-5">
              <h2 className="font-semibold mb-3 font-mono text-gray-300">
                Room Info
              </h2>
              <p className="text-gray-400 font-mono text-sm">
                Code:{" "}
                <strong className="text-xl text-white font-bold ml-1">
                  {roomCode}
                </strong>
              </p>
            </div>

            <div className="rounded-lg bg-gray-800/70 p-5">
              <h2 className="font-semibold mb-3 font-mono text-gray-300">
                Players
              </h2>
              {players.length === 0 ? (
                <p className="text-gray-400 font-mono text-sm">No players yet...</p>
              ) : (
                <ul className="font-mono text-sm text-gray-300 divide-y divide-gray-700">
                  {players.map((p) => (
                    <li key={p.id} className="py-1">{p.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* BEFORE ROUND STARTS → show only instruction message  */}
          {/* ---------------------------------------------------- */}
          {currentIndex === -1 ? (
            <div className="mt-10 text-center">
              <p className="text-lg font-mono text-gray-300">
                Click <strong className="text-pink-400">Start Round</strong> to begin.
              </p>
            </div>
          ) : (
            <>
              {/* ------------------------------------------------ */}
              {/* Active Question UI                               */}
              {/* ------------------------------------------------ */}
              <div className="mt-6 rounded-lg bg-gray-800/70 p-5">
                <h2 className="font-semibold mb-3 font-mono text-gray-300">
                  Current Question
                </h2>

                <h3 className="text-xl font-bold text-cyan-300 mb-3">
                  Question {currentIndex + 1} of {questions.length}
                </h3>

                <p className="text-gray-200 text-lg mb-4">
                  {currentQuestion?.question}
                </p>

                <ul className="space-y-2">
                  {currentQuestion?.options.map((opt: any) => (
                    <li
                      key={opt.id}
                      className="px-4 py-2 rounded bg-gray-700/60 border border-gray-500/40 text-gray-200 font-mono"
                    >
                      {opt.text}
                    </li>
                  ))}
                </ul>

                {/* Next Question or Finish */}
                <button
                  onClick={handleNextQuestion}
                  className="mt-6 rounded-lg px-5 py-2 bg-pink-600 text-white font-semibold font-mono hover:bg-pink-500 transition"
                >
                  {currentIndex + 1 < questions.length
                    ? "Next Question"
                    : "Finish Game"}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="text-center mt-4">
          <a href="/" className="text-cyan-500 hover:text-cyan-300 underline font-mono">
            ← Back to Home
          </a>
        </div>
      </motion.div>
    </main>
  );
}
