import Link from "next/link";
import { GameScreen } from "@/components/game-screen";
import { buildMiniAppMetadata } from "@/lib/miniapp-embed";
import { env } from "@/lib/env";

type Props = { params: Promise<{ gameId: string }> };

export async function generateMetadata({ params }: Props) {
  const { gameId } = await params;
  return buildMiniAppMetadata({
    title: "ChessCast Game",
    url: `${env.NEXT_PUBLIC_APP_URL}/game/${gameId}`,
    imageUrl: `${env.NEXT_PUBLIC_APP_URL}/api/og/game/${gameId}`,
    description: "Watch or join a ChessCast match."
  });
}

export default async function GamePage({ params }: Props) {
  const { gameId } = await params;
  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-accent2">← Back</Link>
      <GameScreen gameId={gameId} />
    </div>
  );
}
