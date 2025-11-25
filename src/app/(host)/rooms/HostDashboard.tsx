"use client";

// rooms/page.tsx (Host Dashboard)
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

export default function HostDashboard({
  admin,
}: {
  admin: { id: number; name: string; email: string; passHash?: string };
}) {
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
<main className="flex flex-col items-center justify-center min-h-screen px-6 text-white bg-gradient-to-b from-black via-indigo-900 to-purple-900">
<section className="max-w-6xl mx-auto px-6 pt-12 pb-6 flex items-center justify-between">
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
      title="Refresh"
    >
      Refresh
    </button>
    <button
      onClick={() => setShowNew(true)}
      className="rounded-lg px-4 py-2 bg-pink-600 text-white font-semibold font-mono hover:bg-pink-500 transition shadow-lg shadow-[0_0_12px_rgba(219,39,119,0.6)]"
    >
      New Room
    </button>
  </div>
</section>

      {showNew && (
        <CreateRoomModal
          onClose={() => setShowNew(false)}
          onCreated={(id) => router.push(`/rooms/${id}`)}
        />
      )}

      {/* Content */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        {err && (
          <p className="mb-4 text-sm text-red-300 bg-red-900/40 border border-red-700/80 rounded-lg p-3 font-mono">
            {err}
          </p>
        )}

  {loading ? (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg p-5 bg-gray-900/50 border border-gray-700/50 animate-pulse h-36"
        />
      ))}
    </div>
  ) : rooms.length === 0 ? (
    
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🎮</div>
      <h2 className="text-2xl font-bold mb-2 font-mono">No rooms yet</h2>
      <p className="text-gray-400 mb-6 font-mono">
        Create a room to host your first live trivia match.
      </p>
      <button
        onClick={createRoom}
        disabled={creating}
        className="rounded-lg px-6 py-3 bg-pink-600 text-white font-semibold font-mono hover:bg-pink-500 transition disabled:opacity-60 shadow-lg shadow-[0_0_12px_rgba(219,39,119,0.6)]"
      >
        {creating ? "Creating…" : "Create Room"}
      </button>
    </div>
  ) : (
    <AnimatePresence mode="popLayout">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r) => (
          <motion.div
            key={r.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg p-5 bg-gray-900/60 border border-cyan-700/50 hover:border-cyan-500/70 hover:bg-gray-800/50 transition"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold font-mono">
                Room #{r.id}
              </h3>
              <StatusBadge status={r.status} />
            </div>

<div className="space-y-2 text-sm text-gray-300">
<div className="flex items-center justify-between gap-2">
  <span className="text-gray-400 font-mono">Code:</span>
  <div className="flex items-center gap-2">
    <code className="bg-black/50 px-2 py-1 rounded-lg border border-gray-700 font-mono">
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
      <span className="text-gray-400 font-mono">Created:</span>
      <span className="font-mono">
        {formatWhen(r.created_at)}
      </span>
    </div>
  </div>

  <div className="mt-4 flex gap-2">
    <Link
      href={`/rooms/${r.id}`}
      className="flex-1 text-center rounded-lg px-4 py-2 bg-cyan-600 text-white font-semibold font-mono hover:bg-cyan-500 transition shadow-lg shadow-[0_0_12px_rgba(6,182,212,0.6)]"
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

function StatusBadge({ status }: { status: Room["status"] }) {
  const style = useMemo(() => {
    switch (status) {
      case "live":
        return "bg-green-900/50 text-green-300 border-green-700/80";
      case "lobby":
        return "bg-yellow-900/50 text-yellow-300 border-yellow-700/80";
      case "ended":
        return "bg-red-900/50 text-red-300 border-red-700/80";
      default:
        return "bg-gray-800/50 text-gray-400 border-gray-700/80";
    }
  }, [status]);

  return (
    <span className={`text-xs px-2 py-1 rounded-full border font-mono ${style}`}>
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
      className={`rounded-lg px-3 py-2 bg-transparent border border-cyan-500 text-cyan-500 hover:bg-cyan-900/40 text-sm transition font-mono ${className}`}
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

function CreateRoomModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: number) => void;
}) {
  const [cats, setCats] = useState<
    { id: number; name: string; slug: string }[]
  >([]);
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
      <button
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative w-full max-w-lg mx-4 rounded-lg bg-gray-900 text-white p-6 sm:p-8 shadow-2xl border border-cyan-700/50 shadow-cyan-900/50">
        <h2 className="text-2xl font-extrabold mb-1 font-mono text-cyan-400">
          Create Room
        </h2>
        <p className="text-gray-400 mb-5 font-mono">
          Pick a category (or “Any”). You can change it later in the room.
        </p>

        {err && <p className="mb-3 text-sm text-red-400 font-mono">{err}</p>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1 font-mono text-gray-300">
              Category
            </label>
            <select
              value={String(selected)}
              onChange={(e) =>
                setSelected(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full border border-gray-600 bg-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
            >
              <option value="">Any category</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1 font-mono text-gray-300">
              Room Code (optional)
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. ABCD"
              maxLength={16}
              className="w-full border border-gray-600 bg-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-600 px-4 py-2 font-mono hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={create}
              disabled={creating}
              className="flex-1 rounded-lg bg-pink-600 hover:bg-pink-500 px-4 py-2 font-semibold font-mono text-white shadow-lg shadow-[0_0_12px_rgba(219,39,119,0.6)]"
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}