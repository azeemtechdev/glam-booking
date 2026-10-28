# [App name]

```
api/openapi.yaml           the contract: source of truth for every endpoint
apps/server/               back end (Node, TypeScript, Fastify, Drizzle) on Supabase Postgres
apps/client/               customer + stylist app and admin panel (React, TypeScript)
apps/client/src/styles/    tokens.css: all colours and type in one file
payment-proof/             phase 2: prove pay, hold, confirm, payout in test mode
```

## Server

```bash
cd apps/server
cp .env.example .env       # set DATABASE_URL (Supabase transaction pooler) and JWT_SECRET
npm install
npm run db:migrate         # creates the tables in Supabase
npm run admin:create -- admin@example.com "Admin" "a-long-password"   # prints the authenticator secret
npm run dev                # http://localhost:3000/v1
```

In development, emails (verification codes, reset links) are printed in the server log.
Schema changes: edit `src/db/schema.ts`, then `npx drizzle-kit generate --name <change>` and `npm run db:migrate`.

## Client

```bash
cd apps/client
npm install
npm run dev                # http://localhost:5173, talks to http://localhost:3000
```

To point at another server, set `VITE_API_URL` in `apps/client/.env`.

## Contract

```bash
npx @redocly/cli lint api/openapi.yaml
```

## Payment proof (test mode only)

```bash
cd payment-proof
cp .env.example .env        # add your TEST secret key and test payout account
node proof.mjs webhook      # terminal 1: signed-event listener on :3000
node proof.mjs init 45000   # terminal 2: prints a checkout link; pay with a test card
node proof.mjs verify <ref> # confirm with the provider, never trust the app
node proof.mjs payout <ref> # pays the stylist 88% (12% commission)
```

The proof passes when: the payment is confirmed by the provider, the signed webhook arrives, the payout lands in the test account, and a repeat call does not pay twice (references are unique per booking).

Note: this script has not been run against the provider. Test-mode behaviour, payout setup (some accounts need a transfer approval setting changed) and whether this hold-then-release use is allowed must be confirmed with the provider before building on it.
