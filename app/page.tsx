import { Lobby } from "@/components/lobby";
import { buildMiniAppMetadata } from "@/lib/miniapp-embed";
import { env } from "@/lib/env";

export const metadata = buildMiniAppMetadata({
  title: "ChessCast",
  url: `${env.NEXT_PUBLIC_APP_URL}/`,
  imageUrl: `${env.NEXT_PUBLIC_APP_URL}/api/og/home`,
  description: "Challenge Farcaster users to premium 2D chess."
});

export default function HomePage() {
  return <Lobby />;
}
