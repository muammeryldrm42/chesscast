import Link from "next/link";
import { GameScreen } from "@/components/game-screen";

type Props = { params: Promise<{ gameId: string }> };

export default async function SpectatorPage({ params }: Props) {
  const { gameId } = await params;
  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-accent2">← Back</Link>
      <GameScreen gameId={gameId} spectator />
    </div>
  );
}
