"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Player } from "@prisma/client";
import QRCode from "react-qr-code";
import Link from "next/link";

const QUESTION_DURATION_SECONDS = 20;

export default function HostPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [roomCode, setRoomCode] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | undefined>(undefined);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [joinUrl, setJoinUrl] = useState<string>("");

  // timer state (client only)
  const [questionStartTimestamp, setQuestionStartTimestamp] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

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
          const indexFromServer = data.questionIndex ?? 0;
          setCurrentIndex(indexFromServer);

          // since we do not store times in the DB, we just start
          // a fresh timer when the host resumes the game
          const now = Date.now();
          setQuestionStartTimestamp(now);
          setRemainingSeconds(QUESTION_DURATION_SECONDS);
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

  // Make join URL
  useEffect(() => {
    if (roomCode && typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/join?code=${encodeURIComponent(roomCode)}`;
      setJoinUrl(url);
    }
  }, [roomCode]);

  // lightweight polling for just live changes (lobby only)
  useEffect(() => {
    if (gameStarted) return;

    let isCancelled = false;
    let timer: NodeJS.Timeout | null = null;

    async function pollLiveState() {
      if (isCancelled) return;
      try {
        const res = await fetch(`/api/rooms/${id}/live`, {
          cache: "no-store",
        });
        if (!res.ok) return;

        const data: {
          players: { id: number; username: string; score: number }[];
        } = await res.json();

        if (!isCancelled) {
          setPlayers(data.players as Player[]);
        }
      } catch (err) {
        if (isCancelled) return;
        console.error("Poll live state failed:", err);
      }
    }

    // initial poll
    pollLiveState();
    // poll every 2 seconds
    timer = setInterval(pollLiveState, 2000);

    return () => {
      isCancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [id, gameStarted]);

  // ------------------------------------------------------
  // Local countdown timer for current question
  // ------------------------------------------------------
  useEffect(() => {
    // if no active question or game not started, do not run timer
    if (!gameStarted || questionStartTimestamp === null) {
      return;
    }

    setRemainingSeconds((previous) =>
      previous === null ? QUESTION_DURATION_SECONDS : previous
    );

    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - questionStartTimestamp) / 1000);
      const nextRemaining = QUESTION_DURATION_SECONDS - elapsedSeconds;
      setRemainingSeconds(nextRemaining > 0 ? nextRemaining : 0);
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [gameStarted, questionStartTimestamp]);

  // function to copy code to clipboard
  async function handleCopyRoomCode() {
    try {
      if (!roomCode) return;
      await navigator.clipboard.writeText(roomCode);
    } catch (error) {
      console.error("Failed to copy room code:", error);
    }
  }

  // helper to start or reset timer locally
  function startLocalQuestionTimer() {
    const now = Date.now();
    setQuestionStartTimestamp(now);
    setRemainingSeconds(QUESTION_DURATION_SECONDS);
  }

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
      setCurrentIndex((previousIndex) => (previousIndex === undefined ? 0 : previousIndex));
      startLocalQuestionTimer();
    } catch (err) {
      console.error("Failed to start game:", err);
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
        startLocalQuestionTimer();
      } catch (err) {
        console.error("Failed to move to next question:", err);
      }
    } else {
      await handleFinishGame();
    }
  }

  // ------------------------------------------------------
  // Finish game
  // ------------------------------------------------------
  async function handleFinishGame() {
    try {
      let winnerId: number | null = null;

      if (players.length > 0) {
        const sortedPlayers = [...players].sort((playerA: any, playerB: any) => {
          const scoreA = playerA.score ?? playerA.totalScore ?? 0;
          const scoreB = playerB.score ?? playerB.totalScore ?? 0;
          return scoreB - scoreA;
        });

        if (sortedPlayers[0]) {
          winnerId = sortedPlayers[0].id;
        }
      }

      const res = await fetch(`/api/rooms/${id}/endGame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId }),
      });
      if (!res.ok) return console.error("Failed to end game");

      router.push(`/rooms`);
    } catch (err) {
      console.error("Failed to end game:", err);
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

  const isTimeVisible = gameStarted && questionStartTimestamp !== null;

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

              {/* Code + copy button */}
              <div className="flex items-center gap-3">
                <p className="text-gray-400 font-mono text-sm">
                  Code:{" "}
                  <strong className="text-xl text-white font-bold ml-1">
                    {roomCode}
                  </strong>
                </p>
                <button
                  type="button"
                  onClick={handleCopyRoomCode}
                  className="px-3 py-1 rounded-md bg-gray-700 text-xs font-mono text-gray-100 border border-gray-500 hover:bg-gray-600 transition"
                >
                  Copy
                </button>
              </div>

              {/* QR code for /join?code=... */}
              {joinUrl && (
                <div className="mt-4 flex flex-col items-center">
                  <p className="text-xs font-mono text-gray-400 mb-2">
                    Scan to join this game
                  </p>
                  <div className="bg-white p-2 rounded-lg">
                    <QRCode value={joinUrl} size={128} />
                  </div>
                  <p className="mt-2 text-[10px] font-mono text-gray-500 break-all text-center">
                    {joinUrl}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-gray-800/70 p-5">
              <h2 className="font-semibold mb-3 font-mono text-gray-300">
                Players
              </h2>
              {players && players.length > 0 ? (
                <ul className="font-mono text-sm text-gray-300 divide-y divide-gray-700">
                  {players.map((player) => (
                    <li key={player.id} className="py-1">
                      {player.username} - {player.score}
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

                {/* Timer */}
                {isTimeVisible && remainingSeconds !== null && (
                  <p
                    className={`font-mono text-sm mb-3 ${
                      remainingSeconds <= 5 ? "text-red-400" : "text-gray-300"
                    }`}
                  >
                    Time left: {remainingSeconds}s
                  </p>
                )}

                <h3 className="text-xl font-bold text-cyan-300 mb-3">
                  Question{" "}
                  {currentIndex !== undefined ? currentIndex + 1 : "-"} of{" "}
                  {questions.length}
                </h3>

                <p className="text-gray-200 text-lg mb-4">
                  {currentQuestion?.question}
                </p>

                <ul className="space-y-2">
                  {currentQuestion?.options?.map((option: any) => (
                    <li
                      key={option.id}
                      className="px-4 py-2 rounded bg-gray-700/60 border border-gray-500/40 text-gray-200 font-mono"
                    >
                      {option.text}
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
          <Link
            href="/"
            className="text-cyan-500 hover:text-cyan-300 underline font-mono"
          >
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
