"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

// testing section
type Player = { id: string; name: string };

export default function HostPage() {
  const { roomId } = useParams<{ roomId: string }>();

  // testing section / requires data fetching from database
  const [room, setRoom] = useState({
    code: "456",
    status: "lobby",
    created: new Date(),
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  // --- testing section


  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-white bg-gradient-to-b from-black via-indigo-900 to-purple-900">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div className="rounded-lg bg-gray-900/60 border border-cyan-700/50 p-6 sm:p-8 text-white shadow-2xl shadow-cyan-900/50">

<div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
  <h1 className="text-3xl font-extrabold font-mono text-cyan-400 drop-shadow-[0_2px_4px_rgba(6,182,212,0.5)]">
    Host — Room {room.code}
  </h1>
  <div className="flex gap-3">
    <button
      type="button"
      className="rounded-lg px-4 py-2 bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-700/40 transition text-sm font-mono"
    >
      Refresh
    </button>
    <button
      type="button"
      className="rounded-lg px-5 py-2 bg-pink-600 text-white font-semibold font-mono hover:bg-pink-500 transition shadow-lg shadow-[0_0_12px_rgba(219,39,119,0.6)]"
    >
      Next Question
    </button>
  </div>
  </div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div className="rounded-lg bg-gray-800/70 p-5">
    <h2 className="font-semibold mb-3 font-mono text-gray-300">
      Room Info
    </h2>
    <div className="space-y-2 font-mono text-sm">
      <p className="text-gray-400">
        Code:{" "}
        <strong className="text-xl text-white font-bold ml-1">
          {room.code}
        </strong>
      </p>
      <p className="text-gray-400 flex items-center gap-2">
        Status: <StatusBadge status={room.status} />
      </p>
      <p className="text-gray-400">
        Created:{" "}
        <span className="text-gray-300">
          {room.created.toLocaleString()}
        </span>
      </p>
    </div>
  </div>

<div className="rounded-lg bg-gray-800/70 p-5">
  <h2 className="font-semibold mb-3 font-mono text-gray-300">
    Players
  </h2>
  <div className="font-mono text-sm text-gray-400">
    {players.length > 0 ? (
      <ul className="divide-y divide-gray-700">
        {players.map((p) => (
          <li key={p.id} className="py-1 text-gray-200">
            {p.name}
          </li>
        ))}
      </ul>
    ) : (
      <p>No players yet...</p>
    )}
  </div>
</div>
</div>

<div className="mt-6 rounded-lg bg-gray-800/70 p-5">
  <h2 className="font-semibold mb-3 font-mono text-gray-300">
    Current Question
  </h2>
  <div className="font-mono text-sm text-gray-400">
    {currentQuestion ? (
      <p className="text-gray-200">{currentQuestion}</p>
    ) : (
      <p>
        No round yet. Click{" "}
        <strong className="text-pink-400">Next Question</strong> to
        begin.
      </p>
    )}
  </div>
</div>

    </div>

    <div className="text-center mt-4">
      <a
        href="/"
        className="text-cyan-500 hover:text-cyan-300 underline font-mono"
      >
        ← Back to Home
      </a>
    </div>
  </motion.div>
</main>
);
} 

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "live"
      ? "bg-green-900/50 text-green-300 border-green-700/80"
      : status === "lobby"
      ? "bg-pink-900/50 text-pink-300 border-pink-700/80"
      : status === "ended"
      ? "bg-red-900/50 text-red-300 border-red-700/80"
      : "bg-gray-800/50 text-gray-400 border-gray-700/80";
  return (
    <span className={`text-xs px-2 py-1 rounded-full border font-mono ${cls}`}>
      {status.toUpperCase()}
    </span>
  );
}