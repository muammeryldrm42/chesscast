"use client";

import { useState } from "react";
import { useMiniApp } from "@/components/miniapp-provider";

export function ChallengeActions({ challengeId, status }: { challengeId: string; status: string }) {
  const { authFetch } = useMiniApp();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function accept() {
    setBusy(true);
    setMessage("");
    const res = await authFetch(`/api/challenges/${challengeId}/accept`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error ?? "Could not accept challenge.");
      setBusy(false);
      return;
    }
    if (data.gameId) {
      window.location.href = `/game/${data.gameId}`;
      return;
    }
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      {message ? <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">{message}</div> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={busy || status !== "pending"}
          onClick={() => void accept()}
          className="rounded-2xl bg-accent px-4 py-4 font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Accept challenge
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            window.location.href = "/";
          }}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 font-semibold text-white transition hover:border-accent/60 hover:bg-accent/20"
        >
          Back to lobby
        </button>
      </div>
    </div>
  );
}
