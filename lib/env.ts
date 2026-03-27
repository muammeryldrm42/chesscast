export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  NEXT_PUBLIC_MINIAPP_URL:
    process.env.NEXT_PUBLIC_MINIAPP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  AUTH_SECRET: process.env.AUTH_SECRET ?? "dev-secret",
  ACCOUNT_ASSOCIATION_HEADER: process.env.ACCOUNT_ASSOCIATION_HEADER ?? "",
  ACCOUNT_ASSOCIATION_PAYLOAD: process.env.ACCOUNT_ASSOCIATION_PAYLOAD ?? "",
  ACCOUNT_ASSOCIATION_SIGNATURE: process.env.ACCOUNT_ASSOCIATION_SIGNATURE ?? "",
  FARCASTER_WEBHOOK_SECRET: process.env.FARCASTER_WEBHOOK_SECRET ?? "",
  NEYNAR_API_KEY: process.env.NEYNAR_API_KEY ?? "",
  CRON_SECRET: process.env.CRON_SECRET ?? ""
};

export function requireDatabaseUrl() {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing.");
  }
  return env.DATABASE_URL;
}
