import { NextRequest, NextResponse } from "next/server";
import { verifyViewer } from "@/lib/auth";
import { resignGame } from "@/lib/chess";

type Props = { params: Promise<{ gameId: string }> };

export async function POST(request: NextRequest, { params }: Props) {
  const viewer = await verifyViewer(request);
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { gameId } = await params;
    const game = await resignGame(gameId, viewer.fid);
    return NextResponse.json({ ok: true, game });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Resign failed." }, { status: 400 });
  }
}
