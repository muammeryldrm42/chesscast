"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMiniApp } from "@/components/miniapp-provider";

type Item = {
  id: string;
  result: string;
  termination: string | null;
  started_at: string;
  finished_at: string | null;
  white_username?: string | null;
  black_username?: string | null;
};

export default function HistoryPage() {
  const { authFetch } = useMiniApp();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await authFetch("/api/history");
      if (res.ok) setItems(await res.json());
    };
    void load();
  }, [authFetch]);

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-accent2">← Back</Link>
      <div className="rounded-[32px] border border-white/10 bg-panel p-5 shadow-glow">
        <div className="mb-3 text-xs uppercase tracking-[0.25em] text-slate-500">History</div>
        <div className="space-y-2">
          {items.map((item) => (
            <Link key={item.id} href={`/game/${item.id}`} className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-4 transition hover:border-accent/60">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">@{item.white_username || "white"} vs @{item.black_username || "black"}</div>
                  <div className="text-sm text-slate-400">{item.termination || "in progress"}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-accent2">{item.result}</div>
                  <div className="text-xs text-slate-500">{new Date(item.started_at).toLocaleString()}</div>
                </div>
              </div>
            </Link>
          ))}
          {items.length === 0 ? <div className="text-sm text-slate-400">No history yet.</div> : null}
        </div>
      </div>
    </div>
  );
}
