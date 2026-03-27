import { NextRequest, NextResponse } from "next/server";
import { verifyViewer, upsertViewerProfile } from "@/lib/auth";
import { registerNotificationToken } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  const viewer = await verifyViewer(request);
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  await upsertViewerProfile({
    fid: viewer.fid,
    username: body.username,
    displayName: body.displayName,
    pfpUrl: body.pfpUrl
  });

  if (body.notificationDetails?.url && body.notificationDetails?.token) {
    await registerNotificationToken({
      fid: viewer.fid,
      notificationUrl: body.notificationDetails.url,
      notificationToken: body.notificationDetails.token,
      clientFid: body.clientFid ?? null
    });
  }

  return NextResponse.json({ ok: true });
}
