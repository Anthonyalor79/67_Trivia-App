"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Category = { id: number; name: string; slug: string };

export default function NewRoomPage() {
  const router = useRouter();
  const [cats, setCats] = useState<Category[]>([]);
  const [selected, setSelected] = useState<number | "">("");
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCats)
      .catch(() => setCats([]));
  }, []);

  async function create() {
    setCreating(true);
    setErr(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim() || undefined,
          categoryId: typeof selected === "number" ? selected : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to create room");
      router.push(`/rooms/${data.id}`);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-900 to-slate-900 text-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-3xl bg-white/10 border border-white/15 p-6 sm:p-8 shadow-2xl backdrop-blur"
      >
        <h1 className="text-3xl font-extrabold mb-2 text-center">Create Room</h1>
        <p className="text-center text-white/80 mb-6">
          Choose a category and optional room code. You can start when players join.
        </p>

        {err && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-white/80">Category</label>
            <select
              value={String(selected)}
              onChange={(e) => setSelected(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-xl bg-white/90 text-black px-3 py-2 outline-none focus:ring-2 ring-yellow-400"
            >
              <option value="">Any category</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-white/70 mt-1">
              If left blank, questions can be from any category
            </p>
          </div>

          <div>
            <label className="block text-sm mb-1 text-white/80">Room Code (optional)</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. ABCD"
              className="w-full rounded-xl bg-white/90 text-black px-3 py-2 outline-none focus:ring-2 ring-yellow-400"
              maxLength={16}
            />
          </div>

          <button
            onClick={create}
            disabled={creating}
            className="w-full rounded-2xl px-5 py-3 bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create Room"}
          </button>

          <div className="text-center">
            <a href="/rooms" className="text-white/80 hover:text-white underline">
              ← Back to Rooms
            </a>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
