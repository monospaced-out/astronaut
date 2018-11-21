# orbit-connect-server

Orbit-connect is a set of 2 packages (server + client) to make it easy to get up and running with orbit-db, and hide the process of keeping various stores in sync so that you don't have to worry about it.

**Warning: this is in-progress and not production ready.**

The server package is intended to be run on a server. The server, in this architecture, has the role of providing both *redundancy* and *availability*. That is, it basically duplicates data from clients and makes it available for others to query. (Without the servers, peers would have to connect directly to each other. If a peer is offline, then it's database cannot be queried without servers.) The data redundancy is also useful, as client storage is not necessarily expected to be persisted over a long period of time (users change browsers/devices, clear their local storage, etc).

The client package, then exists for clients to be able to both *publish* their own data and *discover* other peers' data. Clients are not expected to communicate directly with one another in this model; rather, they use the servers as a relay.

This is the *server* package.

Example:

```js
const orbitConnectServer = require('@projectaspen/orbit-connect-server')

const ORBITDB_PATH = './orbitdb'
const PINNING_ROOM = 'hello-world'

orbitConnectServer({ orbitdbPath: ORBITDB_PATH, room: PINNING_ROOM })

/*
  Swarm listening on /ip4/127.0.0.1/tcp/4003/ws/ipfs/QmTWv5fGvUSFS8K86zxgGRYCEDLJLqGAXa5yjcZKG6weC5
  Swarm listening on /ip4/127.0.0.1/tcp/4002/ipfs/QmTWv5fGvUSFS8K86zxgGRYCEDLJLqGAXa5yjcZKG6weC5
  Swarm listening on /ip4/192.168.1.67/tcp/4002/ipfs/QmTWv5fGvUSFS8K86zxgGRYCEDLJLqGAXa5yjcZKG6weC5
*/
```
