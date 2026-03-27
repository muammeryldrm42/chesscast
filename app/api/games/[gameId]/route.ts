import { NextRequest, NextResponse } from "next/server";
import { getGame, getMoves, maybeFinishOnTimeout, withLiveClocks } from "@/lib/chess";
import { ensureDb, sql } from "@/lib/db";
import { verifyViewer } from "@/lib/auth";

type Props = { params: Promise<{ gameId: string }> };

export async function GET(request: NextRequest, { params }: Props) {
  await ensureDb();
  const viewer = await verifyViewer(request).catch(() => null);
  const { gameId } = await params;
  const game = await maybeFinishOnTimeout(gameId);

  if (!game) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }

  const live = withLiveClocks(game);
  const [white] = await sql`select fid, username, pfp_url from users where fid = ${game.white_fid} limit 1`;
  const [black] = await sql`select fid, username, pfp_url from users where fid = ${game.black_fid} limit 1`;
  const moves = await getMoves(gameId);

  return NextResponse.json({
    game: live,
    players: {
      white: white ?? { fid: game.white_fid, username: null, pfp_url: null },
      black: black ?? { fid: game.black_fid, username: null, pfp_url: null }
    },
    moves,
    viewerFid: viewer?.fid
  });
}
