# ChessCast

Premium 2D Farcaster chess mini app.

## Included

- Quick Auth verification
- Premium 2D board
- Friend challenges
- Cast invites with `composeCast`
- Open challenge quick-match flow
- Server-authoritative chess validation with `chess.js`
- History, leaderboard, resign, draw, rematch
- Notification token storage
- Dynamic share cards
- `/.well-known/farcaster.json`

## Local

```bash
npm install
npm run dev
```

Use a tunnel for Warpcast preview.

## Required env

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_MINIAPP_URL`
- `AUTH_SECRET`
- `ACCOUNT_ASSOCIATION_HEADER`
- `ACCOUNT_ASSOCIATION_PAYLOAD`
- `ACCOUNT_ASSOCIATION_SIGNATURE`

## Optional env

- `NEYNAR_API_KEY`
- `FARCASTER_WEBHOOK_SECRET`
- `CRON_SECRET`

## Notes

- The manifest domain must exactly match the production domain.
- `addMiniApp()` only works on the production domain.
- The app auto-creates its database tables on first use.
- This version uses fast polling instead of a separate websocket server so it deploys cleanly on Vercel.
