# orbit-connect-client

Orbit-connect is a set of 2 packages (server + client) to make it easy to get up and running with orbit-db, and hide the process of keeping various stores in sync so that you don't have to worry about it.

**Warning: this is in-progress and not production ready.**

The server package is intended to be run on a server. The server, in this architecture, has the role of providing both *redundancy* and *availability*. That is, it basically duplicates data from clients and makes it available for others to query. (Without the servers, peers would have to connect directly to each other. If a peer is offline, then it's database cannot be queried without servers.) The data redundancy is also useful, as client storage is not necessarily expected to be persisted over a long period of time (users change browsers/devices, clear their local storage, etc).

The client package, then exists for clients to be able to both *publish* their own data and *discover* other peers' data. Clients are not expected to communicate directly with one another in this model; rather, they use the servers as a relay.

This is the *client* package.

## API

This package exports a class that can be used in place of orbit-db for certain operations. (Yes, it's just running orbit-db under the hood.) Specifically, all of the database open/create operations are supported. The method names and parameters correspond exactly with those in orbit-db.

These methods are asynchronous; they return a promise that only resolves once the requested database has finished syncing with all of the connected server nodes. (The resolved value is of course the orbit-db database.)

The supported methods are:

- `open`
- `feed`
- `log`
- `eventlog`
- `keyvalue`
- `kvstore`
- `counter`
- `docs`
- `docstore`

See the orbit-db documentation for details on these methods.

Example:

```js
const OrbitConnect = require('@projectaspen/orbit-connect-client')

// These are the instances of orbit-connect-server to connect to.
// This value can be found in the "Swarm listening on" message that is logged when starting the server.
const nodes = [ '/ip4/127.0.0.1/tcp/4003/ws/ipfs/QmTWv5fGvUSFS8K86zxgGRYCEDLJLqGAXa5yjcZKG6weC5' ]

const orbitConnect = new OrbitConnect({
  nodes,
  orbitdbOptions: {} // this parameter is optional; this object is passed along to the orbit-db constructor

const db = await orbitConnect.open(myDbAddress)
})
```
