"use client";

import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { ChessBoard } from "@/components/chess-board";
import { useMiniApp } from "@/components/miniapp-provider";
import { formatClock } from "@/lib/utils";

type GamePayload = {
  game: {
    id: string;
    white_fid: number;
    black_fid: number;
    white_time_ms_live: number;
    black_time_ms_live: number;
    white_time_ms: number;
    black_time_ms: number;
    status: string;
    result: string;
    termination: string | null;
    fen: string;
    pgn: string;
    turn: "w" | "b";
    time_control: string;
    white_draw_offer?: boolean;
    black_draw_offer?: boolean;
  };
  players: {
    white: { fid: number; username?: string | null; pfp_url?: string | null };
    black: { fid: number; username?: string | null; pfp_url?: string | null };
  };
  moves: Array<{ ply: number; san: string; uci: string; moved_by_fid: number }>;
  viewerFid?: number;
};

export function GameScreen({ gameId, spectator = false }: { gameId: string; spectator?: boolean }) {
  const { authFetch, user, composeCast } = useMiniApp();
  const [payload, setPayload] = useState<GamePayload | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [moveHints, setMoveHints] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let timer: number | undefined;
    const load = async () => {
      const res = await authFetch(`/api/games/${gameId}`);
      if (res.ok) {
        setPayload(await res.json());
      }
      timer = window.setTimeout(load, 1000);
    };
    void load();

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [authFetch, gameId]);

  const orientation = useMemo(() => {
    if (!payload || !user.fid) return "white";
    return payload.game.white_fid === user.fid ? "white" : "black";
  }, [payload, user.fid]);

  const lastMoveSquares = useMemo(() => {
    const last = payload?.moves?.[payload.moves.length - 1]?.uci;
    if (!last) return [];
    return [last.slice(0, 2), last.slice(2, 4)];
  }, [payload]);

  if (!payload) {
    return <div className="rounded-3xl border border-white/10 bg-panel p-6 text-sm text-slate-300">Loading game…</div>;
  }

  const chess = new Chess(payload.game.fen);
  const myTurn =
    !spectator &&
    user.fid &&
    ((payload.game.turn === "w" && payload.game.white_fid === user.fid) ||
      (payload.game.turn === "b" && payload.game.black_fid === user.fid));

  async function handleSquareClick(square: string) {
    if (!payload || spectator || !myTurn || busy || payload.game.status !== "active") return;

    if (!selectedSquare) {
      const piece = chess.get(square as never);
      if (!piece) return;
      const viewerColor = payload.game.white_fid === user.fid ? "w" : "b";
      if (piece.color !== viewerColor) return;
      const moves = chess.moves({ square: square as never, verbose: true });
      setSelectedSquare(square);
      setMoveHints(moves.map((move) => move.to));
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      setMoveHints([]);
      return;
    }

    setBusy(true);
    setMessage("");

    const move = {
      from: selectedSquare,
      to: square,
      promotion: "q"
    };

    const res = await authFetch(`/api/games/${gameId}/move`, {
      method: "POST",
      body: JSON.stringify(move)
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Move failed." }));
      setMessage(data.error ?? "Move failed.");
    }

    const fresh = await authFetch(`/api/games/${gameId}`);
    if (fresh.ok) {
      setPayload(await fresh.json());
    }

    setSelectedSquare(null);
    setMoveHints([]);
    setBusy(false);
  }

  async function perform(path: string) {
    if (!payload) return;
    setBusy(true);
    setMessage("");
    const res = await authFetch(path, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(body.error ?? "Action failed.");
    } else if (body.gameId) {
      window.location.href = `/game/${body.gameId}`;
    }
    const fresh = await authFetch(`/api/games/${gameId}`);
    if (fresh.ok) setPayload(await fresh.json());
    setBusy(false);
  }

  const top = orientation === "white" ? payload.players.black : payload.players.white;
  const bottom = orientation === "white" ? payload.players.white : payload.players.black;
  const topClock = orientation === "white" ? payload.game.black_time_ms_live : payload.game.white_time_ms_live;
  const bottomClock = orientation === "white" ? payload.game.white_time_ms_live : payload.game.black_time_ms_live;

  const incomingDrawOffer =
    (user.fid === payload.game.white_fid && payload.game.black_draw_offer) ||
    (user.fid === payload.game.black_fid && payload.game.white_draw_offer);

  return (
    <div className="space-y-4">
      <PlayerStrip username={top.username} fid={top.fid} clockMs={topClock} active={payload.game.turn === (orientation === "white" ? "b" : "w")} />

      <ChessBoard
        fen={payload.game.fen}
        orientation={orientation}
        selectable={!spectator}
        selectedSquare={selectedSquare}
        moveHints={moveHints}
        lastMove={lastMoveSquares}
        onSquareClick={handleSquareClick}
      />

      <PlayerStrip username={bottom.username} fid={bottom.fid} clockMs={bottomClock} active={payload.game.turn === (orientation === "white" ? "w" : "b")} />

      <div className="grid gap-3 rounded-3xl border border-white/10 bg-panel p-4 shadow-glow">
        <div className="flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="rounded-full bg-white/5 px-3 py-1">Mode {payload.game.time_control}</span>
          <span className="rounded-full bg-white/5 px-3 py-1">Status {payload.game.status}</span>
          {payload.game.termination ? <span className="rounded-full bg-white/5 px-3 py-1">{payload.game.termination}</span> : null}
          {payload.game.result !== "*" ? <span className="rounded-full bg-white/5 px-3 py-1">Result {payload.game.result}</span> : null}
        </div>

        {message ? <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">{message}</div> : null}

        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
          {!spectator ? (
            <>
              <ActionButton disabled={busy || payload.game.status !== "active"} onClick={() => perform(`/api/games/${gameId}/draw/offer`)}>
                Offer draw
              </ActionButton>
              <ActionButton disabled={busy || payload.game.status !== "active" || !incomingDrawOffer} onClick={() => perform(`/api/games/${gameId}/draw/accept`)}>
                Accept draw
              </ActionButton>
              <ActionButton disabled={busy || payload.game.status !== "active"} onClick={() => perform(`/api/games/${gameId}/resign`)}>
                Resign
              </ActionButton>
              <ActionButton disabled={busy} onClick={() => perform(`/api/games/${gameId}/rematch`)}>
                Rematch
              </ActionButton>
              <ActionButton
                disabled={busy}
                onClick={() =>
                  composeCast(
                    `Just played a ChessCast game${payload.game.result !== "*" ? ` (${payload.game.result})` : ""}.`,
                    [`${window.location.origin}/game/${gameId}`]
                  )
                }
              >
                Share
              </ActionButton>
            </>
          ) : null}
        </div>

        <div className="rounded-3xl border border-white/10 bg-panel2 p-4">
          <div className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-400">Move list</div>
          <div className="max-h-48 overflow-auto text-sm text-slate-200">
            {payload.moves.length === 0 ? "No moves yet." : null}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {payload.moves.map((move, index) => (
                <div key={`${move.ply}-${move.uci}`} className="rounded-xl bg-white/5 px-3 py-2">
                  <span className="mr-2 text-slate-400">{index + 1}.</span>
                  <span>{move.san}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerStrip({
  username,
  fid,
  clockMs,
  active
}: {
  username?: string | null;
  fid: number;
  clockMs: number;
  active?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-panel p-4 shadow-glow">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-slate-500">{active ? "turn" : "waiting"}</div>
        <div className="text-lg font-semibold text-white">@{username || `fid${fid}`}</div>
      </div>
      <div className={active ? "text-xl font-bold text-accent2" : "text-xl font-bold text-white"}>{formatClock(clockMs)}</div>
    </div>
  );
}

function ActionButton({
  children,
  disabled,
  onClick
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void | Promise<void>;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void onClick()}
      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 font-medium text-white transition hover:border-accent/60 hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
