# p2p-trust

This library implements the general concept outlined in the paper [Peer to Peer Degrees of Trust](https://github.com/WebOfTrustInfo/rwot7/blob/master/final-documents/peer-to-peer-degrees-of-trust.pdf). Peers are allowed to make "trust claims" about one another. The library uses the generated graph to calculate how much one peer should trust another. Further, this library allows arbitrary claims to be set, and calculates the trustworthiness of any given claim.

This library comes prepackaged with the [jacobs metric](metrics/jacobs). However, the default metric can be overridden if desired.

## API

TODO
