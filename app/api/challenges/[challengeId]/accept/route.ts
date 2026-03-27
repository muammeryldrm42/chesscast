import { NextRequest, NextResponse } from "next/server";
import { verifyViewer } from "@/lib/auth";
import { createGame } from "@/lib/chess";
import { ensureDb, sql } from "@/lib/db";

type Props = { params: Promise<{ challengeId: string }> };

export async function POST(request: NextRequest, { params }: Props) {
  await ensureDb();
  const viewer = await verifyViewer(request);
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { challengeId } = await params;

  const [challenge] = await sql`
    select * from challenges where id = ${challengeId} limit 1
  `;

  if (!challenge) return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  if (challenge.status !== "pending") {
    return NextResponse.json({ error: "Challenge is not available." }, { status: 400 });
  }
  if (Number(challenge.creator_fid) === viewer.fid) {
    return NextResponse.json({ error: "You cannot accept your own challenge." }, { status: 400 });
  }
  if (challenge.target_fid && Number(challenge.target_fid) !== viewer.fid) {
    return NextResponse.json({ error: "This challenge is reserved for someone else." }, { status: 403 });
  }

  const whiteFid = Math.random() > 0.5 ? Number(challenge.creator_fid) : viewer.fid;
  const blackFid = whiteFid === Number(challenge.creator_fid) ? viewer.fid : Number(challenge.creator_fid);
  const gameId = await createGame({
    challengeId,
    whiteFid,
    blackFid,
    timeControl: challenge.time_control
  });

  await sql`
    update challenges
    set status = 'accepted', target_fid = ${viewer.fid}, game_id = ${gameId}
    where id = ${challengeId}
  `;

  return NextResponse.json({ ok: true, gameId });
}
