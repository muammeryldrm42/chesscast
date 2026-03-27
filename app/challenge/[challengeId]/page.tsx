import Link from "next/link";
import { buildMiniAppMetadata } from "@/lib/miniapp-embed";
import { env } from "@/lib/env";
import { ensureDb, sql } from "@/lib/db";
import { ChallengeActions } from "./screen";

type Props = { params: Promise<{ challengeId: string }> };

export async function generateMetadata({ params }: Props) {
  const { challengeId } = await params;
  return buildMiniAppMetadata({
    title: "ChessCast Challenge",
    url: `${env.NEXT_PUBLIC_APP_URL}/challenge/${challengeId}`,
    imageUrl: `${env.NEXT_PUBLIC_APP_URL}/api/og/challenge/${challengeId}`,
    description: "Accept a Farcaster chess challenge."
  });
}

export default async function ChallengePage({ params }: Props) {
  const { challengeId } = await params;
  await ensureDb();

  const [challenge] = await sql`
    select
      c.*,
      creator.username as creator_username
    from challenges c
    left join users creator on creator.fid = c.creator_fid
    where c.id = ${challengeId}
    limit 1
  `;

  if (!challenge) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-panel p-6 text-slate-300">
        Challenge not found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-accent2">← Back</Link>
      <div className="rounded-[32px] border border-white/10 bg-panel p-6 shadow-glow">
        <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Challenge</div>
        <h1 className="mt-2 text-3xl font-black text-white">@{challenge.creator_username || `fid${challenge.creator_fid}`} wants to play.</h1>
        <p className="mt-2 text-sm text-slate-300">
          Time control {challenge.time_control} · status {challenge.status}
        </p>
        <div className="mt-5">
          <ChallengeActions challengeId={challengeId} status={challenge.status} />
        </div>
      </div>
    </div>
  );
}
