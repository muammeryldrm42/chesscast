import type { Metadata } from "next";
import { env } from "@/lib/env";

type EmbedOptions = {
  url: string;
  title: string;
  imageUrl: string;
  description?: string;
};

export function buildMiniAppMetadata(options: EmbedOptions): Metadata {
  const miniapp = {
    version: "1",
    imageUrl: options.imageUrl,
    button: {
      title: options.title,
      action: {
        type: "launch_miniapp",
        name: "ChessCast",
        url: options.url,
        splashImageUrl: `${env.NEXT_PUBLIC_APP_URL}/icon-200.png`,
        splashBackgroundColor: "#050814"
      }
    }
  };

  const frame = {
    ...miniapp,
    button: {
      ...miniapp.button,
      action: {
        ...miniapp.button.action,
        type: "launch_frame"
      }
    }
  };

  return {
    title: options.title,
    description: options.description ?? "Play social chess on Farcaster",
    openGraph: {
      title: options.title,
      description: options.description ?? "Play social chess on Farcaster",
      images: [options.imageUrl]
    },
    other: {
      "fc:miniapp": JSON.stringify(miniapp),
      "fc:frame": JSON.stringify(frame)
    }
  };
}
