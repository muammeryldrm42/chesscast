"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMiniApp } from "@/components/miniapp-provider";

type Leader = {
  fid: number;
  username?: string | null;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
};

export function Lobby() {
  const { ready, user, isMiniApp, authFetch, addMiniApp, composeCast } = useMiniApp();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [timeControl, setTimeControl] = useState("5+0");
  const [handle, setHandle] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const run = async () => {
      const res = await fetch("/api/leaderboard");
      if (res.ok) setLeaders(await res.json());
    };
    void run();
  }, []);

  async function createChallenge(kind: "direct" | "quick") {
    setMessage("");
    const res = await authFetch("/api/challenges", {
      method: "POST",
      body: JSON.stringify({
        kind,
        targetHandle: kind === "direct" ? handle : null,
        timeControl
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMessage(data.error ?? "Could not create challenge.");
      return;
    }

    if (kind === "direct") {
      await composeCast(
        `@${handle} I challenge you to a ${timeControl} game on ChessCast.`,
        [data.shareUrl]
      );
      window.location.href = `/challenge/${data.challenge.id}`;
      return;
    }

    if (data.gameId) {
      window.location.href = `/game/${data.gameId}`;
      return;
    }

    if (data.challenge?.id) {
      window.location.href = `/challenge/${data.challenge.id}`;
    }
  }

  if (!ready) return null;

  return (
    <div className="space-y-5">
      <section className="rounded-[32px] border border-white/10 bg-panel p-5 shadow-glow">
        <div className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-500">ChessCast</div>
        <h1 className="text-3xl font-black tracking-tight text-white">Farcaster online chess, built for challenges.</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-300">
          Premium 2D board, cast invites, history, leaderboard, and server-validated moves.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            {user.username ? `Signed in as @${user.username}` : isMiniApp ? "Mini App detected" : "Open inside Farcaster for auth"}
          </div>
          <button
            type="button"
            onClick={() => void addMiniApp()}
            className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent/90"
          >
            Add Mini App
          </button>
          <button
            type="button"
            onClick={() => void composeCast("Come play me on ChessCast.", [`${window.location.origin}`])}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-accent/60 hover:bg-accent/20"
          >
            Share app
          </button>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-white/10 bg-panel p-5 shadow-glow">
          <div className="mb-3 text-xs uppercase tracking-[0.25em] text-slate-500">Create a match</div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 text-xs text-slate-400">Time control</div>
              <select
                value={timeControl}
                onChange={(event) => setTimeControl(event.target.value)}
                className="w-full rounded-xl bg-transparent text-white outline-none"
              >
                <option value="1+0" className="bg-slate-900">1+0</option>
                <option value="3+0" className="bg-slate-900">3+0</option>
                <option value="5+0" className="bg-slate-900">5+0</option>
                <option value="10+0" className="bg-slate-900">10+0</option>
              </select>
            </label>

            <label className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 text-xs text-slate-400">Farcaster handle</div>
              <input
                value={handle}
                onChange={(event) => setHandle(event.target.value.replace("@", ""))}
                placeholder="rival"
                className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
              />
            </label>
          </div>

          {message ? <div className="mt-3 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">{message}</div> : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => void createChallenge("direct")}
              className="rounded-2xl bg-accent px-4 py-4 font-semibold text-white transition hover:bg-accent/90"
            >
              Challenge friend
            </button>
            <button
              type="button"
              onClick={() => void createChallenge("quick")}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 font-semibold text-white transition hover:border-accent/60 hover:bg-accent/20"
            >
              Quick match
            </button>
            <Link
              href="/history"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 font-semibold text-white transition hover:border-accent/60 hover:bg-accent/20"
            >
              Match history
            </Link>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-panel p-5 shadow-glow">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Leaderboard</div>
            <Link href="/leaderboard" className="text-sm text-accent2">View all</Link>
          </div>
          <div className="space-y-2">
            {leaders.map((leader, index) => (
              <div key={leader.fid} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <div className="text-xs text-slate-400">#{index + 1}</div>
                  <div className="font-semibold text-white">@{leader.username || `fid${leader.fid}`}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-accent2">{leader.rating}</div>
                  <div className="text-xs text-slate-400">
                    {leader.wins}W · {leader.losses}L · {leader.draws}D
                  </div>
                </div>
              </div>
            ))}
            {leaders.length === 0 ? <div className="text-sm text-slate-400">No games yet.</div> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
