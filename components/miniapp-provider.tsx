"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

type MiniAppContextValue = {
  ready: boolean;
  isMiniApp: boolean;
  user: {
    fid?: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  addMiniApp: () => Promise<void>;
  composeCast: (text: string, embeds?: string[]) => Promise<void>;
};

const MiniAppContext = createContext<MiniAppContextValue>({
  ready: false,
  isMiniApp: false,
  user: {},
  authFetch: (input, init) => fetch(input, init),
  addMiniApp: async () => {},
  composeCast: async () => {}
});

export function MiniAppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [user, setUser] = useState<MiniAppContextValue["user"]>({});

  useEffect(() => {
    const boot = async () => {
      try {
        if (await sdk.isInMiniApp()) {
          setIsMiniApp(true);
          const context = await sdk.context;
          setUser({
            fid: context?.user?.fid,
            username: context?.user?.username,
            displayName: context?.user?.displayName,
            pfpUrl: context?.user?.pfpUrl
          });

          await sdk.actions.ready();

          if (context?.user?.fid) {
            await sdk.quickAuth.fetch("/api/me/sync", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                username: context.user.username,
                displayName: context.user.displayName,
                pfpUrl: context.user.pfpUrl,
                notificationDetails: context.client.notificationDetails,
                clientFid: context.client.clientFid
              })
            });
          }
        }
      } catch {
        // non-mini-app environment
      } finally {
        setReady(true);
      }
    };

    void boot();
  }, []);

  async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
    if (!isMiniApp) {
      return fetch(input, {
        ...init,
        headers: {
          "content-type": "application/json",
          ...(init?.headers ?? {})
        }
      });
    }

    return sdk.quickAuth.fetch(input.toString(), {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init?.headers ?? {})
      }
    });
  }

  const value = useMemo<MiniAppContextValue>(
    () => ({
      ready,
      isMiniApp,
      user,
      authFetch,
      addMiniApp: async () => {
        if (isMiniApp) await sdk.actions.addMiniApp();
      },
      composeCast: async (text, embeds) => {
        if (isMiniApp) {
          await sdk.actions.composeCast({ text, embeds });
        }
      }
    }),
    [ready, isMiniApp, user]
  );

  return <MiniAppContext.Provider value={value}>{children}</MiniAppContext.Provider>;
}

export function useMiniApp() {
  return useContext(MiniAppContext);
}
