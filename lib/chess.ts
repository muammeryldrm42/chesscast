import { Chess } from "chess.js";
import { ensureDb, sql } from "@/lib/db";
import { parseTimeControl, uuid } from "@/lib/utils";
import { sendTurnNotification } from "@/lib/notifications";

export type GameRow = {
  id: string;
  challenge_id: string | null;
  white_fid: number;
  black_fid: number;
  status: string;
  result: string;
  termination: string | null;
  fen: string;
  pgn: string;
  turn: "w" | "b";
  time_control: string;
  white_time_ms: number;
  black_time_ms: number;
  last_move_at: string;
  started_at: string;
  finished_at: string | null;
  white_draw_offer: boolean;
  black_draw_offer: boolean;
  rematch_requested_by: number | null;
};

export async function createGame(input: {
  challengeId?: string | null;
  whiteFid: number;
  blackFid: number;
  timeControl: string;
}) {
  await ensureDb();

  const id = uuid();
  const time = parseTimeControl(input.timeControl);
  const fen = new Chess().fen();

  await sql`
    insert into games (
      id, challenge_id, white_fid, black_fid, fen, pgn, turn, time_control,
      white_time_ms, black_time_ms, started_at, last_move_at
    )
    values (
      ${id}, ${input.challengeId ?? null}, ${input.whiteFid}, ${input.blackFid},
      ${fen}, '', 'w', ${input.timeControl}, ${time.initialMs}, ${time.initialMs}, now(), now()
    )
  `;

  return id;
}

export async function getGame(gameId: string) {
  await ensureDb();
  const [game] = await sql<GameRow[]>`
    select *
    from games
    where id = ${gameId}
    limit 1
  `;
  return game ?? null;
}

export function withLiveClocks(game: GameRow) {
  const now = Date.now();
  const last = new Date(game.last_move_at).getTime();
  const elapsed = Math.max(0, now - last);

  let whiteTime = Number(game.white_time_ms);
  let blackTime = Number(game.black_time_ms);

  if (game.status === "active") {
    if (game.turn === "w") whiteTime = Math.max(0, whiteTime - elapsed);
    if (game.turn === "b") blackTime = Math.max(0, blackTime - elapsed);
  }

  return {
    ...game,
    white_time_ms_live: whiteTime,
    black_time_ms_live: blackTime
  };
}

async function finishGame(input: {
  game: GameRow;
  result: "1-0" | "0-1" | "1/2-1/2";
  termination: string;
}) {
  await ensureDb();

  await sql`
    update games
    set
      status = 'finished',
      result = ${input.result},
      termination = ${input.termination},
      finished_at = now()
    where id = ${input.game.id}
  `;

  if (input.result === "1-0") {
    await sql`
      update users
      set wins = wins + 1,
          rating = rating + 12,
          updated_at = now()
      where fid = ${input.game.white_fid}
    `;
    await sql`
      update users
      set losses = losses + 1,
          rating = greatest(100, rating - 12),
          updated_at = now()
      where fid = ${input.game.black_fid}
    `;
  } else if (input.result === "0-1") {
    await sql`
      update users
      set wins = wins + 1,
          rating = rating + 12,
          updated_at = now()
      where fid = ${input.game.black_fid}
    `;
    await sql`
      update users
      set losses = losses + 1,
          rating = greatest(100, rating - 12),
          updated_at = now()
      where fid = ${input.game.white_fid}
    `;
  } else {
    await sql`
      update users
      set draws = draws + 1,
          rating = rating + 2,
          updated_at = now()
      where fid in (${input.game.white_fid}, ${input.game.black_fid})
    `;
  }
}

export async function getMoves(gameId: string) {
  await ensureDb();
  return sql`
    select ply, san, uci, fen_after, moved_by_fid, created_at
    from game_moves
    where game_id = ${gameId}
    order by ply asc
  `;
}

export async function applyMove(gameId: string, fid: number, move: { from: string; to: string; promotion?: string }) {
  await ensureDb();
  const game = await getGame(gameId);
  if (!game) {
    throw new Error("Game not found.");
  }
  if (game.status !== "active") {
    throw new Error("Game is not active.");
  }

  const side = fid === Number(game.white_fid) ? "w" : fid === Number(game.black_fid) ? "b" : null;
  if (!side) {
    throw new Error("Not a player in this game.");
  }
  if (side !== game.turn) {
    throw new Error("It is not your turn.");
  }

  const live = withLiveClocks(game);
  if ((side === "w" ? live.white_time_ms_live : live.black_time_ms_live) <= 0) {
    await finishGame({
      game,
      result: side === "w" ? "0-1" : "1-0",
      termination: "timeout"
    });
    throw new Error("Time expired.");
  }

  const chess = new Chess(game.fen);
  const result = chess.move(move);
  if (!result) {
    throw new Error("Illegal move.");
  }

  const time = parseTimeControl(game.time_control);
  let whiteTime = live.white_time_ms_live;
  let blackTime = live.black_time_ms_live;

  if (side === "w") whiteTime += time.incrementMs;
  if (side === "b") blackTime += time.incrementMs;

  const nextTurn = chess.turn() as "w" | "b";
  const nextFen = chess.fen();
  const nextPgn = chess.pgn();
  const ply = chess.history().length;

  await sql.begin(async (tx) => {
    await tx`
      update games
      set
        fen = ${nextFen},
        pgn = ${nextPgn},
        turn = ${nextTurn},
        white_time_ms = ${whiteTime},
        black_time_ms = ${blackTime},
        last_move_at = now(),
        white_draw_offer = false,
        black_draw_offer = false
      where id = ${gameId}
    `;

    await tx`
      insert into game_moves (game_id, ply, san, uci, fen_after, moved_by_fid)
      values (${gameId}, ${ply}, ${result.san}, ${result.from + result.to + (result.promotion ?? "")}, ${nextFen}, ${fid})
    `;
  });

  const updated = await getGame(gameId);
  if (!updated) throw new Error("Game missing after move.");

  if (chess.isCheckmate()) {
    await finishGame({
      game: updated,
      result: side === "w" ? "1-0" : "0-1",
      termination: "checkmate"
    });
  } else if (chess.isDraw() || chess.isStalemate() || chess.isInsufficientMaterial() || chess.isThreefoldRepetition()) {
    await finishGame({
      game: updated,
      result: "1/2-1/2",
      termination: "draw"
    });
  } else {
    const nextFid = nextTurn === "w" ? Number(updated.white_fid) : Number(updated.black_fid);
    await sendTurnNotification(nextFid, gameId);
  }

  return getGame(gameId);
}

export async function resignGame(gameId: string, fid: number) {
  const game = await getGame(gameId);
  if (!game || game.status !== "active") throw new Error("Game not active.");
  if (fid !== Number(game.white_fid) && fid !== Number(game.black_fid)) throw new Error("Not your game.");

  await finishGame({
    game,
    result: fid === Number(game.white_fid) ? "0-1" : "1-0",
    termination: "resign"
  });

  return getGame(gameId);
}

export async function offerDraw(gameId: string, fid: number) {
  const game = await getGame(gameId);
  if (!game || game.status !== "active") throw new Error("Game not active.");

  if (fid === Number(game.white_fid)) {
    await sql`update games set white_draw_offer = true where id = ${gameId}`;
  } else if (fid === Number(game.black_fid)) {
    await sql`update games set black_draw_offer = true where id = ${gameId}`;
  } else {
    throw new Error("Not your game.");
  }

  return getGame(gameId);
}

export async function acceptDraw(gameId: string, fid: number) {
  const game = await getGame(gameId);
  if (!game || game.status !== "active") throw new Error("Game not active.");

  const allowed =
    (fid === Number(game.white_fid) && game.black_draw_offer) ||
    (fid === Number(game.black_fid) && game.white_draw_offer);

  if (!allowed) throw new Error("No draw offer to accept.");

  await finishGame({
    game,
    result: "1/2-1/2",
    termination: "draw"
  });

  return getGame(gameId);
}

export async function createRematch(gameId: string, fid: number) {
  const game = await getGame(gameId);
  if (!game || game.status !== "finished") throw new Error("Game must be finished first.");
  if (fid !== Number(game.white_fid) && fid !== Number(game.black_fid)) throw new Error("Not your game.");

  if (game.rematch_requested_by && Number(game.rematch_requested_by) !== fid) {
    return createGame({
      whiteFid: Number(game.black_fid),
      blackFid: Number(game.white_fid),
      timeControl: game.time_control,
      challengeId: null
    });
  }

  await sql`
    update games
    set rematch_requested_by = ${fid}
    where id = ${gameId}
  `;

  return null;
}

export async function maybeFinishOnTimeout(gameId: string) {
  const game = await getGame(gameId);
  if (!game || game.status !== "active") return game;

  const live = withLiveClocks(game);
  if (live.white_time_ms_live <= 0) {
    await finishGame({ game, result: "0-1", termination: "timeout" });
    return getGame(gameId);
  }
  if (live.black_time_ms_live <= 0) {
    await finishGame({ game, result: "1-0", termination: "timeout" });
    return getGame(gameId);
  }
  return game;
}
