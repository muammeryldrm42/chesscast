import { NextRequest, NextResponse } from "next/server";
import { verifyViewer } from "@/lib/auth";
import { applyMove } from "@/lib/chess";

type Props = { params: Promise<{ gameId: string }> };

export async function POST(request: NextRequest, { params }: Props) {
  const viewer = await verifyViewer(request);
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.from || !body?.to) {
    return NextResponse.json({ error: "Move payload is incomplete." }, { status: 400 });
  }

  try {
    const { gameId } = await params;
    const game = await applyMove(gameId, viewer.fid, body);
    return NextResponse.json({ ok: true, game });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Move failed." }, { status: 400 });
  }
}
