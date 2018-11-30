# ki-ethereum-ui

This is a web ui which implements the Ki identity system and integrates it with Ethereum. Ki identities are derived from Ethereum accounts, and all database changes are signed by the Ethereum account.

This is just a demo, at least for now.

## Development

1. Install all packages by running `npx lerna bootstrap` from the repository root.

2. Start the server by running `npm start` from the `packages/ki-server` directory.

3. Navigate to the `packages/ki-ethereum-ui` directory.

4. In a separate tab, create the .env file by running `cp .env.default .env`

5. Replace the value for `KI_NODES` in the `.env` file with the appropriate websocket url for your local server. Look for the line output from your running server that looks like `Swarm listening on /ip4/127.0.0.1/tcp/4003/ws/ipfs/QmTWv5fGvUSFS8K86zxgGRYCEDLJLqGAXa5yjcZKG6weC5`. There should be multiple such lines; make sure you use the one that contains `tcp/4003/ws`.

6. Start the client by running `npm start`.
