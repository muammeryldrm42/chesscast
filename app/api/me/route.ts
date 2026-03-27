import { NextRequest, NextResponse } from "next/server";
import { verifyViewer } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const viewer = await verifyViewer(request);
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(viewer);
}
