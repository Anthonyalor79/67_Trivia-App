"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function HostRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [loading, setLoading] = useState(false);

  async function startRound() {
    setLoading(true);
    await fetch(`/api/rooms/${roomId}/start-round`, { method: "POST", body: JSON.stringify({}) });
    setLoading(false);
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Host — Room {roomId}</h1>
      <button className="rounded bg-black text-white p-2" onClick={startRound} disabled={loading}>
        {loading ? "Starting…" : "Start Round"}
      </button>
      <p className="text-sm text-gray-600">
        Players can go to <code>/join</code>, enter this room id, then play at <code>/play/{String(roomId)}</code>.
      </p>
    </main>
  );
}
