"use client";
import { useState } from "react";

export default function JoinPage() {
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setJoining(true); setError(null);
    try {
      const res = await fetch(`/api/rooms/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to join");
      // Persist playerId in sessionStorage for quick demo
      sessionStorage.setItem("playerId", data.playerId);
      window.location.href = `/play/${roomId}`;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setJoining(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6 space-y-4">
      <h1 className="text-2xl font-bold">Join a Room</h1>
      <input className="w-full border p-2 rounded" placeholder="Room ID (number)" value={roomId}
             onChange={(e)=>setRoomId(e.target.value)} />
      <input className="w-full border p-2 rounded" placeholder="Display name" value={name}
             onChange={(e)=>setName(e.target.value)} />
      <button className="w-full rounded bg-black text-white p-2" disabled={joining} onClick={join}>
        {joining ? "Joining..." : "Join"}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </main>
  );
}
