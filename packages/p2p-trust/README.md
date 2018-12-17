# p2p-trust

This library creates a framework around the general concept outlined in the paper: [Peer to Peer Degrees of Trust](https://github.com/WebOfTrustInfo/rwot7/blob/master/final-documents/peer-to-peer-degrees-of-trust.pdf). Peers are allowed to make "trust claims" about one another. The library calculates how confident one peer can be in another (even one that is not directly trusted), based these claims. Further, this library allows arbitrary claims to be set, and calculates the confidence of any given claim in the same manner.

This library is more of a shell rather than an actual codebase (literally just ~20 lines of code, with no dependencies). It exists as part of a modular architecture. The heavy lifting is performed by the `metric` that is passed into the constructor. The [jacobs metric](../jacobs-metric) is an implemented metric that can be used here.

## API

TODO
