import type { Metadata } from "next";
import { MiniAppProvider } from "@/components/miniapp-provider";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "ChessCast",
  description: "Play social chess on Farcaster"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MiniAppProvider>
          <main className="mx-auto min-h-screen max-w-[1080px] px-4 py-6 sm:px-6">
            {children}
          </main>
        </MiniAppProvider>
      </body>
    </html>
  );
}
