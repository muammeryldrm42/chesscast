import { ImageResponse } from "next/og";
import { ensureDb, sql } from "@/lib/db";

type Props = { params: Promise<{ gameId: string }> };

export async function GET(_: Request, { params }: Props) {
  await ensureDb();
  const { gameId } = await params;

  const [game] = await sql`
    select
      g.*,
      white_user.username as white_username,
      black_user.username as black_username
    from games g
    left join users white_user on white_user.fid = g.white_fid
    left join users black_user on black_user.fid = g.black_fid
    where g.id = ${gameId}
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
          <div style={{ fontSize: 24, color: "#34D1FF", letterSpacing: 4 }}>CHESSCAST GAME</div>
          <div style={{ fontSize: 64, fontWeight: 900 }}>
            @{game?.white_username || "white"} vs @{game?.black_username || "black"}
          </div>
          <div style={{ fontSize: 30, color: "#b7c0d6" }}>
            {game?.result === "*" ? "Live match" : `Result ${game?.result}`} · {game?.termination || "in progress"}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 800 }
  );
}
