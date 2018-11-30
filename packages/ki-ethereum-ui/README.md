# ki-ethereum-ui

This is a web ui which implements the Ki identity system and integrates it with Ethereum. Ki identities are derived from Ethereum accounts, and all database changes are signed by the Ethereum account.

This is just a demo, at least for now.

## Development

1. Install all packages by running `npx lerna bootstrap` from the repository root.

2. Start the server by running `npm start` from the `packages/ki-server` directory.

3. Start the client by running `npm start` from the `packages/ki-ethereum-ui` directory.
