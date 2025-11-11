"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function JoinPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill from query (?room=123&name=Alex)
  useEffect(() => {
    const r = params.get("room");
    const n = params.get("name");
    if (r) setRoomId(r);
    if (n) setName(n);
  }, [params]);

  // Basic validation
  const errs = useMemo(() => {
    const list: string[] = [];
    if (!roomId.trim()) list.push("Room ID is required.");
    if (roomId && !/^\d+$/.test(roomId.trim())) list.push("Room ID must be a number.");
    if (!name.trim()) list.push("Display name is required.");
    if (name.trim().length > 32) list.push("Display name must be 32 characters or less.");
    return list;
  }, [roomId, name]);

  async function join() {
    if (errs.length) {
      setError(errs[0]);
      return;
    }
    setJoining(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Failed to join");
      sessionStorage.setItem("playerId", data.playerId);
      router.push(`/play/${roomId}`);
    } catch (e: any) {
      setError(e.message ?? "Failed to join");
    } finally {
      setJoining(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void join();
    }
  }

  async function pasteRoomFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = (text || "").match(/\d+/)?.[0] ?? "";
      if (cleaned) setRoomId(cleaned);
    } catch {
      // ignore
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-900 to-slate-900 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl bg-white/10 backdrop-blur border border-white/15 p-6 sm:p-8 text-white shadow-2xl">
          <h1 className="text-3xl font-extrabold text-center mb-2">Join a Room</h1>
          <p className="text-center text-white/80 mb-6">
            Enter the room ID from the host and your display name.
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form className="space-y-4" onKeyDown={onKeyDown}>
            {/* Room ID */}
            <div>
              <label className="block text-sm mb-1 text-white/80" htmlFor="room">
                Room ID
              </label>
              <div className="flex gap-2">
                <input
                  id="room"
                  inputMode="numeric"
                  pattern="\d*"
                  className="flex-1 rounded-xl bg-white/90 text-black placeholder-black/50 px-3 py-2 outline-none focus:ring-2 ring-yellow-400"
                  placeholder="e.g. 123"
                  value={roomId}
                  onChange={(e) => {
                    // keep only digits
                    const digits = e.target.value.replace(/\D+/g, "");
                    setRoomId(digits);
                  }}
                />
                <button
                  type="button"
                  onClick={pasteRoomFromClipboard}
                  className="rounded-xl px-3 py-2 bg-white/10 hover:bg-white/20 transition text-sm"
                  title="Paste from clipboard"
                >
                  Paste
                </button>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm mb-1 text-white/80" htmlFor="name">
                Display Name
              </label>
              <input
                id="name"
                className="w-full rounded-xl bg-white/90 text-black placeholder-black/50 px-3 py-2 outline-none focus:ring-2 ring-yellow-400"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={32}
              />
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={join}
              disabled={joining}
              className="w-full rounded-2xl px-5 py-3 bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition disabled:opacity-60"
            >
              {joining ? "Joining…" : "Join Game"}
            </button>

            {/* Tips */}
            <p className="text-xs text-white/70 text-center">
              Tip: You can also open a link like <code>/join?room=123&name=Alex</code>
            </p>
          </form>
        </div>

        {/* Back to home */}
        <div className="text-center mt-4">
          <a href="/" className="text-white/80 hover:text-white underline">
            ← Back to Home
          </a>
        </div>
      </motion.div>
    </main>
  );
}
