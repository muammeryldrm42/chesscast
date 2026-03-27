import { NextRequest, NextResponse } from "next/server";
import { verifyViewer } from "@/lib/auth";
import { createRematch } from "@/lib/chess";

type Props = { params: Promise<{ gameId: string }> };

export async function POST(request: NextRequest, { params }: Props) {
  const viewer = await verifyViewer(request);
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { gameId } = await params;
    const nextGameId = await createRematch(gameId, viewer.fid);
    return NextResponse.json({ ok: true, gameId: nextGameId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Rematch failed." }, { status: 400 });
  }
}
