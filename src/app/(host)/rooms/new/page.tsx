"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Category = { id: number; name: string };
type Trivia = { id: number; name: string; categoryId: number };

export default function NewRoomPage() {
  const router = useRouter();

  const [cats, setCats] = useState<Category[]>([]);
  const [triviaSets, setTriviaSets] = useState<Trivia[]>([]);

  const [categoryId, setCategoryId] = useState<number | "">("");
  const [triviaId, setTriviaId] = useState<number | "">("");

  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Load categories on page load
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCats)
      .catch(() => setCats([]));
  }, []);

  // Load trivia when category changes
  useEffect(() => {
    if (!categoryId) {
      setTriviaSets([]);
      setTriviaId("");
      return;
    }

    fetch(`/api/trivia?categoryId=${categoryId}`)
      .then((r) => r.json())
      .then((data) => {
        setTriviaSets(data);
        setTriviaId("");
      })
      .catch(() => setTriviaSets([]));
  }, [categoryId]);

  async function create() {
    setErr(null);
    setCreating(true);

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: typeof categoryId === "number" ? categoryId : undefined,
          triviaId: typeof triviaId === "number" ? triviaId : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create room");

      router.push(`/rooms/${data.id}`);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-white bg-gradient-to-b from-black via-indigo-900 to-purple-900">

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-gray-900/60 border border-cyan-700/50 rounded-2xl p-8 shadow-xl backdrop-blur"
      >
        <h1 className="text-3xl font-extrabold font-mono text-center text-cyan-400 mb-6 drop-shadow-[0_2px_6px_rgba(6,182,212,0.6)]">
          Create New Room
        </h1>

        {err && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-900/40 px-4 py-2 text-sm text-red-200 font-mono">
            {err}
          </div>
        )}

        <div className="space-y-6">

          {/* Category Dropdown */}
          <div>
            <label className="block text-sm mb-1 text-cyan-300 font-mono">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) =>
                setCategoryId(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="w-full rounded-xl bg-black/40 border border-cyan-700/40 px-3 py-2 outline-none text-white font-mono focus:border-cyan-400 transition"
            >
              <option value="">Select a Category</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Trivia Dropdown */}
          <div>
            <label className="block text-sm mb-1 text-cyan-300 font-mono">
              Trivia Set
            </label>
            <select
              value={triviaId}
              disabled={!categoryId}
              onChange={(e) =>
                setTriviaId(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="w-full rounded-xl bg-black/40 border border-cyan-700/40 px-3 py-2 outline-none text-white font-mono focus:border-cyan-400 transition disabled:opacity-50"
            >
              <option value="">Select a Trivia Set</option>
              {triviaSets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Create Room */}
          <button
            onClick={create}
            disabled={!triviaId || creating}
            className="w-full rounded-xl px-5 py-3 bg-pink-600 text-white font-bold font-mono hover:bg-pink-500 transition disabled:opacity-50 shadow-lg shadow-[0_0_12px_rgba(219,39,119,0.5)]"
          >
            {creating ? "Creating…" : "Create Room"}
          </button>

          <div className="text-center">
            <a
              href="/rooms"
              className="text-cyan-300 hover:text-cyan-400 font-mono underline"
            >
              ← Back to Rooms
            </a>
          </div>
        </div>
      </motion.div>

    </main>
  );
}
