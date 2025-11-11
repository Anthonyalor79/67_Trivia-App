"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type Room = {
  id: number;
  code: string | null;
  status: "lobby" | "live" | "ended" | string;
  created_at?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
};

export default function RoomsIndex() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  async function refresh() {
    try {
      setErr(null);
      const res = await fetch("/api/rooms", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to load rooms");
      setRooms(data);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createRoom() {
    setCreating(true);
    setErr(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to create room");
      router.push(`/rooms/${data.id}`);
    } catch (e: any) {
      setErr(e.message);
      await refresh();
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-900 to-slate-900 text-white">
      {/* Header */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-6 flex items-center justify-between">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-extrabold"
        >
          Host Dashboard
        </motion.h1>

        <div className="flex gap-3">
          <button
            onClick={refresh}
            className="rounded-xl px-4 py-2 bg-white/10 hover:bg-white/20 transition"
            title="Refresh"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="rounded-xl px-4 py-2 bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition"
          >
            New Room
          </button>
        </div>
      </section>

      {showNew && <CreateRoomModal onClose={() => setShowNew(false)} onCreated={(id) => router.push(`/rooms/${id}`)} />}

      {/* Content */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        {err && (
          <p className="mb-4 text-sm text-red-300 bg-red-900/40 border border-red-600/40 rounded-lg p-3">
            {err}
          </p>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 bg-white/5 animate-pulse h-36"
              />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          // Empty state
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-2xl font-bold mb-2">No rooms yet</h2>
            <p className="text-white/70 mb-6">
              Create a room to host your first live trivia match.
            </p>
            <button
              onClick={createRoom}
              disabled={creating}
              className="rounded-2xl px-6 py-3 bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create Room"}
            </button>
          </div>
        ) : (
          // Rooms grid
          <AnimatePresence mode="popLayout">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl p-5 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">Room #{r.id}</h3>
                    <StatusBadge status={r.status} />
                  </div>

                  <div className="space-y-2 text-sm text-white/80">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white/70">Code:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-black/30 px-2 py-1 rounded">
                          {r.code ?? "—"}
                        </code>
                        {r.code && (
                          <CopyButton
                            text={r.code}
                            label="Copy code"
                            toast="Code copied!"
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white/70">Created:</span>
                      <span>{formatWhen(r.created_at)}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/rooms/${r.id}`}
                      className="flex-1 text-center rounded-xl px-4 py-2 bg-white text-black font-semibold hover:bg-gray-100 transition"
                    >
                      Open Host View
                    </Link>
                    <CopyButton
                      className="flex-1"
                      text={`${window?.location?.origin ?? ""}/join`}
                      label="Copy Join Link"
                      toast="Join link copied!"
                    />
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

/* ---------- Helpers & small components ---------- */

function StatusBadge({ status }: { status: Room["status"] }) {
  const style = useMemo(() => {
    switch (status) {
      case "live":
        return "bg-emerald-400/20 text-emerald-200 border-emerald-400/30";
      case "lobby":
        return "bg-yellow-400/20 text-yellow-200 border-yellow-400/30";
      case "ended":
        return "bg-red-400/20 text-red-200 border-red-400/30";
      default:
        return "bg-slate-400/20 text-slate-200 border-slate-400/30";
    }
  }, [status]);

  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${style}`}>
      {status.toUpperCase()}
    </span>
  );
}

function CopyButton({
  text,
  label = "Copy",
  toast = "Copied!",
  className = "",
}: {
  text: string;
  label?: string;
  toast?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {}
      }}
      className={`rounded-xl px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm transition ${className}`}
      title={label}
    >
      {copied ? "✓ " + toast : label}
    </button>
  );
}

function formatWhen(v?: string | null) {
  if (!v) return "—";
  try {
    const d = new Date(v);
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

function CreateRoomModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) {
  const [cats, setCats] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [selected, setSelected] = useState<number | "">("");
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(setCats).catch(() => setCats([]));
  }, []);

  async function create() {
    setCreating(true); setErr(null);
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
      onCreated(data.id);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <button className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close" />
      {/* Panel */}
      <div className="relative w-full max-w-lg mx-4 rounded-3xl bg-white text-black p-6 sm:p-8 shadow-2xl">
        <h2 className="text-2xl font-extrabold mb-1">Create Room</h2>
        <p className="text-gray-600 mb-5">Pick a category (or “Any”). You can change it later in the room.</p>

        {err && <p className="mb-3 text-sm text-red-600">{err}</p>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Category</label>
            <select
              value={String(selected)}
              onChange={(e) => setSelected(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full border rounded-xl px-3 py-2"
            >
              <option value="">Any category</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Room Code (optional)</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. ABCD"
              maxLength={16}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={create}
              disabled={creating}
              className="flex-1 rounded-xl bg-yellow-400 hover:bg-yellow-300 px-4 py-2 font-semibold"
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
