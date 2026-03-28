import postgres from "postgres";
import { requireDatabaseUrl } from "@/lib/env";

declare global {
  var __chesscast_sql: ReturnType<typeof postgres> | undefined;
  var __chesscast_ready: boolean | undefined;
}

function getSqlClient() {
  if (!globalThis.__chesscast_sql) {
    globalThis.__chesscast_sql = postgres(requireDatabaseUrl(), {
      prepare: false,
      max: 1,
      idle_timeout: 20
    });
  }

  return globalThis.__chesscast_sql;
}

export const sql = ((...args: Parameters<ReturnType<typeof postgres>>) => getSqlClient()(...args)) as ReturnType<
  typeof postgres
>;

(sql as any).begin = (...args: any[]) => (getSqlClient() as any).begin(...args);

export async function ensureDb() {
  if (globalThis.__chesscast_ready) return;

  await sql.begin(async (tx: any) => {
    await tx`
      create table if not exists users (
        fid bigint primary key,
        username text,
        display_name text,
        pfp_url text,
        rating integer not null default 1200,
        wins integer not null default 0,
        losses integer not null default 0,
        draws integer not null default 0,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    `;

    await tx`
      create table if not exists challenges (
        id text primary key,
        kind text not null default 'direct',
        creator_fid bigint not null,
        target_fid bigint,
        target_handle text,
        color_pref text not null default 'random',
        time_control text not null default '5+0',
        status text not null default 'pending',
        game_id text,
        created_at timestamptz not null default now(),
        expires_at timestamptz not null default now() + interval '1 day'
      );
    `;

    await tx`
      create table if not exists games (
        id text primary key,
        challenge_id text,
        white_fid bigint not null,
        black_fid bigint not null,
        status text not null default 'active',
        result text not null default '*',
        termination text,
        fen text not null,
        pgn text not null default '',
        turn text not null default 'w',
        time_control text not null default '5+0',
        white_time_ms bigint not null,
        black_time_ms bigint not null,
        last_move_at timestamptz not null default now(),
        started_at timestamptz not null default now(),
        finished_at timestamptz,
        white_draw_offer boolean not null default false,
        black_draw_offer boolean not null default false,
        rematch_requested_by bigint
      );
    `;

    await tx`
      create table if not exists game_moves (
        id bigserial primary key,
        game_id text not null,
        ply integer not null,
        san text not null,
        uci text not null,
        fen_after text not null,
        moved_by_fid bigint not null,
        created_at timestamptz not null default now()
      );
    `;

    await tx`
      create table if not exists notification_tokens (
        id bigserial primary key,
        fid bigint not null,
        notification_url text not null,
        notification_token text not null,
        client_fid bigint,
        enabled boolean not null default true,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    `;

    await tx`create index if not exists idx_challenges_status on challenges(status);`;
    await tx`create index if not exists idx_games_status on games(status);`;
    await tx`create index if not exists idx_moves_game on game_moves(game_id, ply);`;
    await tx`create index if not exists idx_notifications_fid on notification_tokens(fid, enabled);`;
  });

  globalThis.__chesscast_ready = true;
}
