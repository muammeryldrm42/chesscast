import Link from "next/link";
import { ensureDb, sql } from "@/lib/db";

export default async function LeaderboardPage() {
  await ensureDb();
  const leaders = await sql`
    select fid, username, rating, wins, losses, draws
    from users
    order by rating desc, wins desc, draws desc
    limit 100
  `;

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-accent2">← Back</Link>
      <div className="rounded-[32px] border border-white/10 bg-panel p-5 shadow-glow">
        <div className="mb-3 text-xs uppercase tracking-[0.25em] text-slate-500">Leaderboard</div>
        <div className="space-y-2">
          {leaders.map((leader, index) => (
            <div key={leader.fid} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <div className="text-xs text-slate-400">#{index + 1}</div>
                <div className="text-lg font-semibold text-white">@{leader.username || `fid${leader.fid}`}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-accent2">{leader.rating}</div>
                <div className="text-xs text-slate-400">
                  {leader.wins}W · {leader.losses}L · {leader.draws}D
                </div>
              </div>
            </div>
          ))}
          {leaders.length === 0 ? <div className="text-sm text-slate-400">No matches yet.</div> : null}
        </div>
      </div>
    </div>
  );
}
