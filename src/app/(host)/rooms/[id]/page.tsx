"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Player } from "@prisma/client";

export default function HostPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [roomCode, setRoomCode] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | undefined>(undefined);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  const currentQuestion =
    currentIndex !== undefined && currentIndex >= 0 && currentIndex < questions.length
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

        if (data.gameEnded) {
          alert("This game has ended. Returning to rooms list.");
          router.push(`/rooms`);
          return;
        } else if (data.gameDeleted) {
          alert("This game has been deleted. Returning to rooms list.");
          router.push(`/rooms`);
          return;
        } else if (data.gameStarted) {
          alert("Game already started, resuming...");
          setGameStarted(true);
          const idx = data.questionIndex ?? 0;
          setCurrentIndex(idx);
        }

        setRoomCode(data.code);
        setQuestions(data.questions);
        setPlayers(data.players);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load room:", err);
        router.push(`/rooms`);
      }
    }

    loadRoom();
  }, [id, router]);

  // ------------------------------------------------------
  // Host starts the round – move from lobby to question 1
  // ------------------------------------------------------
  async function handleStartRound() {
    if (questions.length === 0) {
      alert("This trivia set has no questions.");
      return;
    }
    try {
      const res = await fetch(`/api/rooms/${id}/startGame`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data?.error || "Failed to start game");
        return;
      }

      setGameStarted(true);
      // Start at first question if not already set
      setCurrentIndex(prev => (prev === undefined ? 0 : prev));
    } catch (err) {
      console.error("Failed to load room:", err);
    }
  }

  // ------------------------------------------------------
  // Next question or finish game
  // ------------------------------------------------------
  async function handleNextQuestion() {
    if (currentIndex === undefined) {
      console.error("No current question index set");
      return;
    }

    if (currentIndex + 1 < questions.length) {
      try {
        const res = await fetch(`/api/rooms/${id}/nextQuestion`, {
          method: "POST",
        });

        const data = await res.json();

        if (!res.ok) {
          console.error(data?.error || "Failed to move to next question");
          return;
        }

        setGameStarted(true);
        setPlayers(data.players);
        setCurrentIndex(currentIndex + 1);
      } catch (err) {
        console.error("Failed to load room:", err);
      }
    } else {
      alert("Game finished!");
      await handleFinishGame();
    }
  }

  // ------------------------------------------------------
  // Finish game
  // ------------------------------------------------------
  async function handleFinishGame() {
    try {
      // Query the player list and select highest score as winner and app it to api endpoint
      let winnerId: number | null = null;

      if (players.length > 0) {
        const sortedPlayers = [...players].sort((a: any, b: any) => {
          const scoreA = a.score ?? a.totalScore ?? 0;
          const scoreB = b.score ?? b.totalScore ?? 0;
          return scoreB - scoreA; // descending
        });

        if (sortedPlayers[0]) {
          winnerId = sortedPlayers[0].id;
        }
      }

      const res = await fetch(`/api/rooms/${id}/endGame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId }), // server can store this in Winner table
      });
      if (!res.ok) return console.error("Failed to end game");

      router.push(`/rooms`);
    } catch (err) {
      console.error("Failed to load room:", err);
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <h1 className="text-3xl font-extrabold font-mono text-cyan-400">
              Host — Room {id}
            </h1>

            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-lg px-4 py-2 bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-700/40 transition text-sm font-mono"
              >
                Refresh
              </button>

              {!gameStarted && (
                <button
                  type="button"
                  onClick={handleStartRound}
                  className="rounded-lg px-5 py-2 bg-pink-600 text-white font-semibold font-mono hover:bg-pink-500 transition"
                  disabled={gameStarted}
                >
                  Start Round
                </button>
              )}
            </div>
          </div>

          {/* Room + Players */}
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
              {players && players.length > 0 ? (
                <ul className="font-mono text-sm text-gray-300 divide-y divide-gray-700">
                  {players.map((p) => (
                    <li key={p.id} className="py-1">
                      {p.username} - {p.score}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 font-mono text-sm">No players yet...</p>
              )}
            </div>
          </div>

          {/* Lobby vs Game */}
          {!gameStarted ? (
            <div className="mt-10 text-center">
              <p className="text-lg font-mono text-gray-300">
                Click <strong className="text-pink-400">Start Round</strong> to begin.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-lg bg-gray-800/70 p-5">
                <h2 className="font-semibold mb-3 font-mono text-gray-300">
                  Current Question
                </h2>

                <h3 className="text-xl font-bold text-cyan-300 mb-3">
                  Question{" "}
                  {currentIndex !== undefined ? currentIndex + 1 : "-"} of {questions.length}
                </h3>

                <p className="text-gray-200 text-lg mb-4">
                  {currentQuestion?.question}
                </p>

                <ul className="space-y-2">
                  {currentQuestion?.options?.map((opt: any) => (
                    <li
                      key={opt.id}
                      className="px-4 py-2 rounded bg-gray-700/60 border border-gray-500/40 text-gray-200 font-mono"
                    >
                      {opt.text}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleNextQuestion}
                  className="mt-6 rounded-lg px-5 py-2 bg-pink-600 text-white font-semibold font-mono hover:bg-pink-500 transition"
                >
                  {currentIndex !== undefined && currentIndex + 1 < questions.length
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
