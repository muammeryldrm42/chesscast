import { NextRequest, NextResponse } from "next/server";
import { verifyViewer } from "@/lib/auth";
import { ensureDb, sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  await ensureDb();
  const viewer = await verifyViewer(request);
  if (!viewer) {
    return NextResponse.json([]);
  }

  const rows = await sql`
    select
      g.id,
      g.result,
      g.termination,
      g.started_at,
      g.finished_at,
      white_user.username as white_username,
      black_user.username as black_username
    from games g
    left join users white_user on white_user.fid = g.white_fid
    left join users black_user on black_user.fid = g.black_fid
    where g.white_fid = ${viewer.fid} or g.black_fid = ${viewer.fid}
    order by g.started_at desc
    limit 50
  `;
  return NextResponse.json(rows);
}
