import { ImageResponse } from "next/og";

export async function GET() {
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
          alignItems: "stretch",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ fontSize: 26, color: "#34D1FF", letterSpacing: 4 }}>CHESSCAST</div>
          <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1 }}>Play social chess on Farcaster.</div>
          <div style={{ fontSize: 32, color: "#b7c0d6" }}>Challenge friends. Share matches. Climb the board.</div>
        </div>
      </div>
    ),
    { width: 1200, height: 800 }
  );
}
