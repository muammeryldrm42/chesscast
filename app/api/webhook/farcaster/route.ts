import { NextRequest, NextResponse } from "next/server";
import { disableNotificationTokens, registerNotificationToken } from "@/lib/notifications";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body." }, { status: 400 });

  // Lightweight fallback handler. For strict verification, provide NEYNAR_API_KEY
  // and extend this route with parseWebhookEvent + verifyAppKeyWithNeynar.
  const fid = Number(body?.fid ?? body?.payload?.fid ?? 0);

  if (body?.event === "miniapp_removed" || body?.event === "notifications_disabled") {
    if (fid) await disableNotificationTokens(fid);
    return NextResponse.json({ ok: true });
  }

  const details = body?.notificationDetails;
  if ((body?.event === "miniapp_added" || body?.event === "notifications_enabled") && fid && details?.url && details?.token) {
    await registerNotificationToken({
      fid,
      notificationUrl: details.url,
      notificationToken: details.token,
      clientFid: Number(body?.clientFid ?? 0) || null
    });
  }

  return NextResponse.json({ ok: true });
}
