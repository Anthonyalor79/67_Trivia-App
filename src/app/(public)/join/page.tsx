// join/page.tsx (Join Page)
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

function JoinPageInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [roomId, setRoomId] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const r = params.get("room");
    const n = params.get("name");
    if (r) setRoomId(r);
    if (n) setName(n);
  }, [params]);

  const errs = useMemo(() => {
    const list: string[] = [];
    if (!roomId.trim()) list.push("Room ID is required.");
    if (roomId && !/^\d+$/.test(roomId.trim()))
      list.push("Room ID must be a number.");
    if (!name.trim()) list.push("Display name is required.");
    if (name.trim().length > 32)
      list.push("Display name must be 32 characters or less.");
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
        body: JSON.stringify({
          displayName: name.trim(),
          roomId: Number(roomId.trim()),
          roomCode: roomCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          typeof data?.error === "string" ? data.error : "Failed to join"
        );
      sessionStorage.setItem("playerId", data.playerId);
      router.push(`/play/${data.playerId}`);
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

  async function pasteRoomCodeFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      const value = text.replace(/[^A-Za-z0-9]+/g, "");
      if (value) setRoomCode(value.toUpperCase());
    } catch {
      // ignore
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-white bg-gradient-to-b from-black via-indigo-900 to-purple-900">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="rounded-lg bg-gray-900/60 border border-cyan-700/50 p-6 sm:p-8 text-white shadow-2xl shadow-cyan-900/50">
          <h1 className="text-3xl font-extrabold text-center mb-2 font-mono text-cyan-400 drop-shadow-[0_2px_4px_rgba(6,182,212,0.5)]">
            Join a Room
          </h1>
          <p className="text-center text-gray-300 mb-6 font-mono">
            Enter the room ID from the host and your display name.
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-700/80 bg-red-900/40 px-4 py-3 text-sm text-red-300 font-mono">
              {error}
            </div>
          )}

          <form className="space-y-4" onKeyDown={onKeyDown}>
            {/* Room ID */}
            <div>
              <label
                className="block text-sm mb-1 text-gray-300 font-mono"
                htmlFor="room"
              >
                Room ID
              </label>
              <div className="flex gap-2">
                <input
                  id="room"
                  inputMode="numeric"
                  pattern="\d*"
                  className="flex-1 rounded-lg bg-gray-800 text-white placeholder-gray-500 px-3 py-2 outline-none border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transform transition-transform duration-200 hover:scale-105"
                  placeholder="e.g. 123"
                  value={roomId}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D+/g, "");
                    setRoomId(digits);
                  }}
                />
                <button
                  type="button"
                  onClick={pasteRoomFromClipboard}
                  className="rounded-lg px-3 py-2 bg-transparent border border-cyan-500 text-cyan-500 hover:bg-cyan-900/40 transition text-sm font-mono"
                  title="Paste from clipboard"
                >
                  Paste
                </button>
              </div>
            </div>

            {/* Room Code */}
            <div>
              <label
                className="block text-sm mb-1 text-gray-300 font-mono"
                htmlFor="roomCode"
              >
                Room Code
              </label>
              <div className="flex gap-2">
                <input
                  id="roomCode"
                  pattern="[A-Za-z0-9]*"
                  className="flex-1 rounded-lg bg-gray-800 text-white placeholder-gray-500 px-3 py-2 outline-none border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transform transition-transform duration-200 hover:scale-105"
                  placeholder="e.g. A1B2C3"
                  value={roomCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^A-Za-z0-9]+/g, "");
                    setRoomCode(value.toUpperCase());
                  }}
                />
                <button
                  type="button"
                  onClick={pasteRoomCodeFromClipboard}
                  className="rounded-lg px-3 py-2 bg-transparent border border-cyan-500 text-cyan-500 hover:bg-cyan-900/40 transition text-sm font-mono"
                  title="Paste from clipboard"
                >
                  Paste
                </button>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label
                className="block text-sm mb-1 text-gray-300 font-mono"
                htmlFor="name"
              >
                Display Name
              </label>
              <input
                id="name"
                className="w-full rounded-lg bg-gray-800 text-white placeholder-gray-500 px-3 py-2 outline-none border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transform transition-transform duration-200 hover:scale-105"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={32}
              />
            </div>

            <button
              type="button"
              onClick={join}
              disabled={joining}
              className="w-full rounded-lg px-5 py-3 bg-pink-600 text-white font-semibold font-mono hover:bg-pink-500 transition disabled:opacity-60 shadow-lg shadow-[0_0_12px_rgba(219,39,119,0.6)] transform transition-transform duration-200 hover:scale-105"
            >
              {joining ? "Joining…" : "Join Game"}
            </button>

            <p className="text-xs text-gray-500 text-center font-mono">
              Tip: You can also open a link like{" "}
              <code>/join?room=123&name=Alex</code>
            </p>
          </form>
        </div>

        {/* Back to home */}
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

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinPageInner />
    </Suspense>
  );
}
