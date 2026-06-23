# ChainInvite Web

Next.js frontend for the ChainInvite application.

## Contract Settings

```env
NEXT_PUBLIC_CHAININVITE_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_CHAININVITE_DEPLOYMENT_BLOCK=...
```

## Development

From the workspace root:

```bash
npm install
npm run dev
```

`npm run dev` uses webpack for local development because the app can hit a Turbopack resolver panic after the ChainPass subproject move. To retry Turbopack explicitly, use:

```bash
npm run dev:turbo
```
