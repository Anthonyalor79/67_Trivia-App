"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Option = { id: number; text: string; order: number };
type Round = { id: number; order_in_room: number; time_limit_ms: number | null; question: { id: number; stem?: string | null; options: Option[] } };
type Player = { playerId: string; name: string; totalScore: number };
type State = { room: { id: number; status: string; code: string | null }; players: Player[]; rounds: Round[] };

export default function PlayPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [state, setState] = useState<State | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    let timer: any;
    async function fetchState() {
      const res = await fetch(`/api/rooms/${roomId}/state`);
      if (res.ok) setState(await res.json());
    }
    fetchState();
    timer = setInterval(fetchState, 1000);
    return () => clearInterval(timer);
  }, [roomId]);

  const playerId = typeof window !== "undefined" ? sessionStorage.getItem("playerId") : null;

  async function answer(roundId: number, selectedOptionId: number) {
    if (!playerId) return alert("No playerId in session");
    setSubmitting(true);
    await fetch(`/api/rooms/${roomId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundId, playerId, selectedOptionId, responseTimeMs: 1000 })
    });
    setSubmitting(false);
  }

  const latest = state?.rounds.at(-1);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Room {String(roomId)}</h1>
      <div className="space-y-2">
        <p>Status: {state?.room.status ?? "..."}</p>
        <h2 className="text-xl font-semibold">Players</h2>
        <ul className="list-disc ml-6">
          {state?.players.map(p => <li key={p.playerId}>{p.name} — {p.totalScore}</li>)}
        </ul>
      </div>

      <div className="border rounded p-4">
        <h3 className="font-semibold">Current Question</h3>
        {latest ? (
          <>
            <p className="mt-2">{latest.question.stem}</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {latest.question.options.map(o => (
                <button key={o.id} disabled={submitting}
                        onClick={() => answer(latest.id, o.id)}
                        className="border rounded p-2 hover:bg-gray-100">
                  {o.text}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p>No round yet. Waiting for host…</p>
        )}
      </div>
    </main>
  );
}
