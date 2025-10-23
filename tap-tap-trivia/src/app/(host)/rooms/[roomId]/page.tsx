"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Player = { playerId: string; name: string; totalScore: number };
type Option = { id: number; text: string; order: number };
type Round = { id: number; order_in_room: number; time_limit_ms: number | null; question: { id: number; stem?: string | null; options: Option[] } };
type RoomState = {
  room: { id: number; status: string; code: string | null; created_at?: string };
  players: Player[];
  rounds: Round[];
};

export default function HostRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [state, setState] = useState<RoomState | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const latest = state?.rounds.at(-1);

  async function fetchState() {
    const res = await fetch(`/api/rooms/${roomId}/state`, { cache: "no-store" });
    if (res.ok) setState(await res.json());
  }

  useEffect(() => {
    fetchState();
    const t = setInterval(fetchState, 1000);
    return () => clearInterval(t);
  }, [roomId]);

  const progress = state ? { cur: state.room.current_index ?? 0, total: state.room.total_questions ?? null } : { cur: 0, total: null };

  async function startRound() {
    try {
      setLoading(true);
      setErr(null);
      const response = await fetch(`/api/rooms/${roomId}/start-round`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 409) throw new Error(data?.error ?? "All questions played");
        throw new Error(data?.error ?? "Failed to start round");
      }
      await fetchState();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-900 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold">Host — Room {String(roomId)}</h1>
          <div className="flex gap-2">
            <div className="text-sm text-white/80">
              Progress: <strong>{progress.cur}</strong>
              {progress.total !== null ? <> / <strong>{progress.total}</strong></> : null}
            </div>
            <button
              onClick={fetchState}
              className="rounded-xl px-4 py-2 bg-white/10 hover:bg-white/20 transition"
            >
              Refresh
            </button>
            <button
              onClick={startRound}
              disabled={loading || (progress.total !== null && progress.cur >= progress.total)}
              className="rounded-xl px-4 py-2 bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition disabled:opacity-60"
            >
              {loading ? "Starting…" : (progress.total !== null && progress.cur >= progress.total) ? "Game Finished" : "Next Question"}
            </button>
          </div>
        </header>

        {err && (
          <p className="text-sm text-red-200 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
            {err}
          </p>
        )}

        {/* Top info */}
        <section className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl p-5 bg-white/10 border border-white/15">
            <h2 className="font-semibold mb-2">Room Info</h2>
            <div className="space-y-1 text-sm text-white/80">
              <div>Code: <code className="bg-black/30 px-2 py-0.5 rounded">{state?.room.code ?? "—"}</code></div>
              <div>Status: <span className="uppercase">{state?.room.status ?? "…"}</span></div>
              <div>Created: {state?.room.created_at ? new Date(state.room.created_at).toLocaleString() : "—"}</div>
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-white/10 border border-white/15">
            <h2 className="font-semibold mb-2">Players</h2>
            <ul className="space-y-1 text-sm">
              {state?.players.length ? (
                state.players.map((p) => (
                  <li key={p.playerId} className="flex items-center justify-between">
                    <span>{p.name}</span>
                    <span className="text-white/70">{p.totalScore}</span>
                  </li>
                ))
              ) : (
                <li className="text-white/70">No players yet…</li>
              )}
            </ul>
          </div>
        </section>

        {/* Current Question Preview */}
        <section className="rounded-2xl p-5 bg-white/10 border border-white/15">
          <h2 className="font-semibold mb-2">Current Question</h2>
          {!latest ? (
            <p className="text-white/70">No round yet. Click <strong>Start Round</strong> to begin.</p>
          ) : (
            <div>
              <p className="mb-3">{latest.question.stem}</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {latest.question.options.map((o) => (
                  <div key={o.id} className="rounded-xl px-3 py-2 bg-black/30 border border-white/10">
                    {o.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
