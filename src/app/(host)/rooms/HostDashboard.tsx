"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type HistoryRoom = {
  roomId: number;
  triviaName: string;
  winnerName: string;
  winnerScore: number;
  endedAt: string;
};

export default function HostDashboard({
  admin,
}: {
  admin: { id: number; name: string; email: string };
}) {
  const [history, setHistory] = useState<HistoryRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/rooms/history", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to load history");

      setHistory(data);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

    async function handleDelete(roomId: number) {
    const confirmDelete = confirm("Delete this room? This cannot be undone.");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete room");
      }

      // refresh after deletion
      await refresh();

    } catch (error: any) {
      console.error(error);
      alert("Error deleting room: " + error.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-white bg-gradient-to-b from-black via-indigo-900 to-purple-900">

      {/* Header */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-6 flex gap-3 items-center justify-between">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-extrabold font-mono text-cyan-400 drop-shadow-[0_2px_4px_rgba(6,182,212,0.5)]"
        >
          Host Dashboard
        </motion.h1>

        <div className="flex gap-3">
          <button
            onClick={refresh}
            className="rounded-lg px-4 py-2 bg-transparent border border-cyan-500 text-cyan-500 hover:bg-cyan-900/40 transition font-mono"
          >
            Refresh
          </button>
          <button
            onClick={() => location.href = "/rooms/new"}
            className="rounded-lg px-4 py-2 bg-pink-600 text-white font-semibold font-mono hover:bg-pink-500 transition shadow-lg shadow-[0_0_12px_rgba(219,39,119,0.6)]"
          >
            New Room
          </button>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-6xl mx-auto px-6 pb-16 w-full">

        {/* Error */}
        {err && (
          <p className="mb-4 text-sm text-red-300 bg-red-900/40 border border-red-700/80 rounded-lg p-3 font-mono">
            {err}
          </p>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg p-5 bg-gray-900/50 border border-gray-700/50 animate-pulse h-36"
              />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📜</div>
            <h2 className="text-2xl font-bold mb-2 font-mono">
              No game history yet
            </h2>
            <p className="text-gray-400 font-mono">
              After you host games, your results will appear here.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {history.map((h) => (
                <motion.div
                  key={h.roomId}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg p-5 bg-gray-900/60 border border-cyan-700/50 hover:border-cyan-500/70 hover:bg-gray-800/50 transition"
                >
                  <h3 className="text-lg font-semibold font-mono mb-3">
                    Room #{h.roomId}
                  </h3>

                  {/* Card content (matches old layout style) */}
                  <div className="space-y-2 text-sm text-gray-300">

                    <Row label="Trivia">
                      {h.triviaName}
                    </Row>

                    <Row label="Winner">
                      {h.winnerName}
                    </Row>

                    <Row label="Score">
                      {h.winnerScore}
                    </Row>

                    <Row label="Ended">
                      {new Date(h.endedAt).toLocaleString()}
                    </Row>

                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleDelete(h.roomId)}
                      className="w-full py-2 mt-4 rounded-md text-red-300 font-mono border border-red-700/60 bg-red-900/30 hover:bg-red-900/60 hover:border-red-500 transition"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </section>
    </main>
  );
}

/* Small reusable row component */
function Row({ label, children }: { label: string; children: any }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-gray-400 font-mono">{label}:</span>
      <span className="font-mono">{children}</span>
    </div>
  );
}
