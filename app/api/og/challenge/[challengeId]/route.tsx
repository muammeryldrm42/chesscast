import { ImageResponse } from "next/og";
import { ensureDb, sql } from "@/lib/db";

type Props = { params: Promise<{ challengeId: string }> };

export async function GET(_: Request, { params }: Props) {
  await ensureDb();
  const { challengeId } = await params;
  const [challenge] = await sql`
    select c.*, u.username
    from challenges c
    left join users u on u.fid = c.creator_fid
    where c.id = ${challengeId}
    limit 1
  `;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #050814, #0b1220 60%, #111827)",
          color: "white",
          padding: 48,
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ fontSize: 24, color: "#34D1FF", letterSpacing: 4 }}>CHESSCAST CHALLENGE</div>
          <div style={{ fontSize: 72, fontWeight: 900 }}>@{challenge?.username || "player"} challenged you.</div>
          <div style={{ fontSize: 30, color: "#b7c0d6" }}>Time control {challenge?.time_control || "5+0"} · Launch inside Farcaster</div>
        </div>
      </div>
    ),
    { width: 1200, height: 800 }
  );
}
