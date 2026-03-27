import { NextResponse } from "next/server";
import { ensureDb, sql } from "@/lib/db";

export async function GET() {
  await ensureDb();
  const rows = await sql`
    select fid, username, rating, wins, losses, draws
    from users
    order by rating desc, wins desc, draws desc
    limit 20
  `;
  return NextResponse.json(rows);
}
