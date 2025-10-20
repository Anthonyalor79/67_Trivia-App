"use client";

import { useEffect, useState } from "react";

type Room = { id: number; code: string | null; status: string };

export default function RoomsIndex() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/rooms");
    if (res.ok) setRooms(await res.json());
  }

  useEffect(() => { refresh(); }, []);

  async function createRoom() {
    setCreating(true); setErr(null);
    try {
      const res = await fetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to create room");
      window.location.href = `/rooms/${data.id}`;
    } catch (e: any) {
      setErr(e.message);
      await refresh();
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Host — Rooms</h1>
      <button className="rounded bg-black text-white p-2" onClick={createRoom} disabled={creating}>
        {creating ? "Creating…" : "Create Room"}
      </button>
      {err && <p className="text-red-600 text-sm">{err}</p>}

      <h2 className="text-xl font-semibold mt-6">Recent Rooms</h2>
      <ul className="list-disc ml-6">
        {rooms.map(r => (
          <li key={r.id}>
            <a className="underline" href={`/rooms/${r.id}`}>Room {r.id}</a> — {r.status}{r.code ? ` (code: ${r.code})` : ""}
          </li>
        ))}
      </ul>
    </main>
  );
}
