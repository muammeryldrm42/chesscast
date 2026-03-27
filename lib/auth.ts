import { createClient } from "@farcaster/quick-auth";
import { NextRequest } from "next/server";
import { ensureDb, sql } from "@/lib/db";
import { env } from "@/lib/env";

const quickAuth = createClient();

export type Viewer = {
  fid: number;
  username?: string | null;
  displayName?: string | null;
  pfpUrl?: string | null;
  rating?: number | null;
};

export async function verifyViewer(request: NextRequest) {
  await ensureDb();

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.split(" ")[1];
  const payload = await quickAuth.verifyJwt({
    token,
    domain: new URL(env.NEXT_PUBLIC_APP_URL).hostname
  });

  const fid = Number(payload.sub);

  const [user] = await sql`
    select fid, username, display_name, pfp_url, rating
    from users
    where fid = ${fid}
    limit 1
  `;

  return {
    fid,
    username: user?.username ?? null,
    displayName: user?.display_name ?? null,
    pfpUrl: user?.pfp_url ?? null,
    rating: user?.rating ?? null
  } satisfies Viewer;
}

export async function upsertViewerProfile(input: {
  fid: number;
  username?: string | null;
  displayName?: string | null;
  pfpUrl?: string | null;
}) {
  await ensureDb();
  await sql`
    insert into users (fid, username, display_name, pfp_url)
    values (${input.fid}, ${input.username ?? null}, ${input.displayName ?? null}, ${input.pfpUrl ?? null})
    on conflict (fid)
    do update set
      username = coalesce(excluded.username, users.username),
      display_name = coalesce(excluded.display_name, users.display_name),
      pfp_url = coalesce(excluded.pfp_url, users.pfp_url),
      updated_at = now()
  `;
}
