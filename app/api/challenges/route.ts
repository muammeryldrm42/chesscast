import { NextRequest, NextResponse } from "next/server";
import { verifyViewer } from "@/lib/auth";
import { createGame } from "@/lib/chess";
import { ensureDb, sql } from "@/lib/db";
import { env } from "@/lib/env";
import { uuid } from "@/lib/utils";

export async function POST(request: NextRequest) {
  await ensureDb();
  const viewer = await verifyViewer(request);
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const kind = body.kind === "quick" ? "quick" : "direct";
  const targetHandle = typeof body.targetHandle === "string" ? body.targetHandle.trim().replace("@", "") : null;
  const timeControl = typeof body.timeControl === "string" ? body.timeControl : "5+0";
  const id = uuid();

  if (kind === "quick") {
    const [existing] = await sql`
      select *
      from challenges
      where kind = 'quick'
        and status = 'pending'
        and creator_fid <> ${viewer.fid}
      order by created_at asc
      limit 1
    `;

    if (existing) {
      const whiteFid = Math.random() > 0.5 ? Number(existing.creator_fid) : viewer.fid;
      const blackFid = whiteFid === Number(existing.creator_fid) ? viewer.fid : Number(existing.creator_fid);
      const gameId = await createGame({
        challengeId: existing.id,
        whiteFid,
        blackFid,
        timeControl: existing.time_control
      });

      await sql`
        update challenges
        set status = 'accepted', target_fid = ${viewer.fid}, game_id = ${gameId}
        where id = ${existing.id}
      `;

      return NextResponse.json({ gameId, challenge: existing });
    }
  }

  if (kind === "direct" && !targetHandle) {
    return NextResponse.json({ error: "Target handle required." }, { status: 400 });
  }

  let targetFid: number | null = null;
  if (targetHandle) {
    const [user] = await sql`
      select fid from users where lower(username) = lower(${targetHandle}) limit 1
    `;
    targetFid = user ? Number(user.fid) : null;
  }

  await sql`
    insert into challenges (id, kind, creator_fid, target_fid, target_handle, time_control, color_pref, status)
    values (${id}, ${kind}, ${viewer.fid}, ${targetFid}, ${targetHandle}, ${timeControl}, 'random', 'pending')
  `;

  return NextResponse.json({
    challenge: {
      id,
      kind,
      creator_fid: viewer.fid,
      target_fid: targetFid,
      target_handle: targetHandle,
      time_control: timeControl,
      status: "pending"
    },
    shareUrl: `${env.NEXT_PUBLIC_APP_URL}/challenge/${id}`
  });
}
