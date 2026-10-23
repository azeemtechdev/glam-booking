# [App name]: project starter

```
api/openapi.yaml           the contract: source of truth for everything
apps/web/                  customer + stylist app and admin panel (React, TypeScript)
apps/web/src/styles/       tokens.css: all colours and type in one file
payment-proof/             phase 2: prove pay, hold, confirm, payout in test mode
```

## Step 1: check the contract and start the mock server

```bash
npx @redocly/cli lint api/openapi.yaml            # checks the contract
npx @stoplight/prism-cli mock api/openapi.yaml -p 4010   # fake API at http://localhost:4010/v1
```

The mock returns realistic fake data built from the examples in the contract. Add `example:` values to schemas to make it more realistic.

## Step 2: create the web app (inside apps/web)

```bash
cd apps/web
npm create vite@latest . -- --template react-ts
npm install
npx openapi-typescript ../../api/openapi.yaml -o src/api/schema.d.ts   # typed API
npm run dev
```

Import `src/styles/tokens.css` once in `main.tsx`. Point the API base URL at `http://localhost:4010/v1`; later switch to the real back end by changing that one setting.

## Step 3: payment proof (test mode only)

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
