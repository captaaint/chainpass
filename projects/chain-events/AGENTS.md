# AGENTS.md

## UI changes

When a task requires UI changes, use the shadcn MCP before making edits.

Use it to inspect available components, examples, and add commands so UI work follows the project's shadcn setup and conventions.

## Frontend debugging

When a frontend or Next.js error appears, use the Next.js MCP to debug it before making fixes.

Use it to inspect the running app's current errors, routes, logs, page metadata, and other runtime diagnostics so fixes are based on the live Next.js state.

## On-chain frontend work

When implementing or changing wallet, network, contract read/write, transaction status, ticket purchase, scanner/check-in, or event indexing code, read and follow the project skills first:

- `../../skills/wagmi/SKILL.md`
- `../../skills/viem/SKILL.md`

Use the wagmi skill for React providers, wallet connection, network switching, client-side contract hooks, and transaction UX.

Use the viem skill for ABI handling, ETH/time conversion, server-side contract clients, event log indexing, and lower-level contract interaction patterns.

Prefer the existing ChainInvite implementation patterns unless the ChainEvents contract or UX requires a different approach.

## Layout changes

When a task requires layout changes, fetch and review the relevant screen design from the ChainEvents NFT Ticketing Console project through the Stitch MCP before making edits.
