import { ensureDb, sql } from "@/lib/db";
import { env } from "@/lib/env";

export async function registerNotificationToken(input: {
  fid: number;
  notificationUrl: string;
  notificationToken: string;
  clientFid?: number | null;
}) {
  await ensureDb();
  await sql`
    insert into notification_tokens (fid, notification_url, notification_token, client_fid, enabled)
    values (${input.fid}, ${input.notificationUrl}, ${input.notificationToken}, ${input.clientFid ?? null}, true)
  `;
}

export async function disableNotificationTokens(fid: number) {
  await ensureDb();
  await sql`
    update notification_tokens
    set enabled = false, updated_at = now()
    where fid = ${fid}
  `;
}

export async function sendTurnNotification(fid: number, gameId: string) {
  await ensureDb();

  const tokens = await sql`
    select notification_url, notification_token
    from notification_tokens
    where fid = ${fid} and enabled = true
    order by updated_at desc
    limit 10
  `;

  if (tokens.length === 0) return;

  const grouped = new Map<string, string[]>();
  for (const row of tokens) {
    const existing = grouped.get(row.notification_url) ?? [];
    existing.push(row.notification_token);
    grouped.set(row.notification_url, existing);
  }

  await Promise.all(
    [...grouped.entries()].map(async ([url, groupedTokens]) => {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            notificationId: `turn-${gameId}`,
            title: "Your move",
            body: "Your ChessCast game is waiting.",
            targetUrl: `${env.NEXT_PUBLIC_APP_URL}/game/${gameId}`,
            tokens: groupedTokens.slice(0, 100)
          })
        });

        if (!response.ok) return;
        const payload = (await response.json()) as { invalidTokens?: string[] };
        if (payload.invalidTokens?.length) {
          await sql`
            update notification_tokens
            set enabled = false, updated_at = now()
            where notification_token = any(${payload.invalidTokens})
          `;
        }
      } catch {
        // noop
      }
    })
  );
}
