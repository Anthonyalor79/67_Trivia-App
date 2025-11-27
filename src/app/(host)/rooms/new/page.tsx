"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Category = { id: number; name: string };
type TriviaSet = {
  id: number;
  name: string;
  questionCount: number;
};

export default function NewRoomPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [triviaSets, setTriviaSets] = useState<TriviaSet[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const [selectedTrivia, setSelectedTrivia] = useState<number | "">("");

  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Load categories on mount
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // Load trivia sets when category is selected
  useEffect(() => {
    if (typeof selectedCategory !== "number") {
      setTriviaSets([]);
      setSelectedTrivia("");
      return;
    }

    fetch(`/api/trivia/by-category/${selectedCategory}`)
      .then((r) => r.json())
      .then(setTriviaSets)
      .catch(() => setTriviaSets([]));
  }, [selectedCategory]);

  async function createRoom() {
    if (!selectedCategory || !selectedTrivia) {
      setErr("Please choose a category and a trivia set.");
      return;
    }

    setCreating(true);
    setErr(null);

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          triviaId: selectedTrivia, // this determines the question pack
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
    <main className="min-h-screen bg-gradient-to-b from-black via-indigo-900 to-purple-900 text-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-3xl bg-white/10 border border-white/15 p-6 sm:p-8 shadow-2xl backdrop-blur"
      >
        <h1 className="text-3xl font-extrabold mb-6 text-center font-mono text-cyan-400">
          Create New Room
        </h1>

        {err && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 font-mono">
            {err}
          </div>
        )}

        <div className="space-y-6">

          {/* CATEGORY SELECT */}
          <div>
            <label className="block text-sm mb-1 text-white/80 font-mono">
              Category
            </label>
            <select
              value={String(selectedCategory)}
              onChange={(e) =>
                setSelectedCategory(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="w-full rounded-xl bg-gray-800 text-white px-3 py-2 border border-gray-600 focus:border-cyan-500 outline-none"
            >
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* TRIVIA SET SELECT — Only visible after category */}
          {triviaSets.length > 0 && (
            <div>
              <label className="block text-sm mb-1 text-white/80 font-mono">
                Trivia Set
              </label>
              <select
                value={String(selectedTrivia)}
                onChange={(e) =>
                  setSelectedTrivia(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="w-full rounded-xl bg-gray-800 text-white px-3 py-2 border border-gray-600 focus:border-cyan-500 outline-none"
              >
                <option value="">Select trivia set…</option>
                {triviaSets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.questionCount} questions)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* CREATE ROOM BUTTON */}
          <button
            onClick={createRoom}
            disabled={creating}
            className="w-full rounded-2xl px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold font-mono transition disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create Room"}
          </button>

        </div>
      </motion.div>
    </main>
  );
}
