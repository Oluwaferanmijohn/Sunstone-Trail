# Sunstone Trail

An original, mobile-first online roll-and-move adventure board game.

## Foundation

- Nuxt 4, Vue, TypeScript and Tailwind CSS
- Pinia for local client state
- Pure TypeScript rules engine in `shared/game/`
- Supabase-ready runtime configuration (no keys are committed)
- Vitest rules tests

## Commands

```bash
npm install
npm run dev
npm test
npm run build
```

Copy `.env.example` to `.env` once the Supabase project exists. Keep the service-role key server-only; it must never be exposed to browser code.

## Game-engine contract

The pure rules engine lives in `shared/game/engine.ts`. It receives a validated roll from 1–6 and returns a new game state plus displayable events. In multiplayer, a Nuxt server route will create the roll and call this same engine before persisting the result.

## Multiplayer setup

1. Create a Supabase project and enable anonymous sign-in (or another supported sign-in method).
2. Run `supabase/migrations/202610050001_game_rooms.sql` in the Supabase SQL editor or through the Supabase CLI.
3. Enable Realtime for the `game_rooms` table if it is not already enabled by the migration.
4. Copy `.env.example` to `.env` and fill in the project URL, publishable key, and server-only service-role key.

All game mutations use Nuxt server endpoints. The browser can request a roll but never supplies the outcome, position, or next turn. Room rows use an incrementing `version` to reject two simultaneous moves.

Anonymous guests are created only when a player chooses to create, join, or open a room. They receive a Supabase session token that Nuxt forwards to the server endpoint; the service-role key remains private on the server.

## Production checklist

- Run `npm test` and `npm run build` before every deployment.
- Install the SQL migration before enabling room traffic.
- Use a host that provides HTTPS; PWA installation and service workers require it.
- Set the same three `NUXT_*` environment variables in the deployment provider. Never set the service-role key as a public variable.
- The included rate limiter is process-local. Replace it with a shared Redis or KV limiter before running more than one server instance.
