# p2p-trust: jacobs algorithm

>The trust of a city street is formed over time from many, many little public sidewalk contacts... Most of it is ostensibly utterly trivial but the sum is not trivial at all. The sum of such casual, public contact at a local level... is a feeling for the public identity of people, a web of public respect and trust.

Jane Jacobs, *The Death and Life of Great American Cities*

I've named this metric in honor of Jane Jacobs, a visionary that described the intricate inner workings of cities. She frequently referenced networks of social ties as being the glue that holds cities together. I am inspired by Jane Jacobs to pursue the same principles that make real-world cities great, in the digital world. Perhaps one day the digital world can feel as safe and welcoming as a great city.

## Metric

As far as the metric itself: it utilizes a model of probability. Every trust claim is interpreted as a *statement* that some peer is trustworthy, with confidence *x*. A statement is assumed to be either correct or to contain an error. The amount of trust placed in a peer (the confidence) is modeled as the probability that any given statement from said peer does *not* contain an error.

This probabilistic model allows us to aggregate trust in 2 useful dimensions. The first I call the *vertical* dimension. If peer A trusts peer B, who trusts peer C, this is a vertical chain of trust. Trust can be aggregated vertically through multiplication. This comes from probability theory. The probability of 2 independent events *both* occurring is simply the product of their individual probabilities. Thus the trustworthiness of C is the trust (or confidence) from A to B times the trust from B to C. If the trust from A to B is `0.5`, and the trust from B to C is `0.5`, then the trust from A to C is `0.25`.

The trickier part of the model is in aggregating the *horizontal* dimension. If peer A trusts peer B, and peer A also trusts peer C (and both peer B and peer C trust peer D), how do we aggregate A's trust in B with A's trust in C? Once again, probability theory has an answer here. Going back to our error model: if both B and C have made an error, then it's easy to determine that D is not trustworthy. Likewise, if neither have made an error, then D is trustworthy. But what if B makes an error but C does not (or vice versa)? Well, we assume that D is still trustworthy, even though one of the peers made an error. If we said that D is *not* trustworthy, this would be contradictory. One of the peers said that D was trustworthy and did not make an error; thus D *must* be trustworthy (according to this model). But how do we explain the other peer, that did make an error? Well, there's nothing in this model that says you can't make an error and still get lucky.

With this in mind, we now have a straightforward way to apply probability in the horizontal dimension. Peer D is trustworthy if *either* peer B or peer C has *not* made an error. Stated differently: peer D is *not* trustworthy if (and only if) neither peer B nor peer C has made an error. So we first get the confidence through the path A -> B -> D. Then we take the *inverse* of this, and multiply it by the inverses of the confidence through A -> C -> D. This product is the probability that peer D is *not* trustworthy. The trust in peer D, then, is the inverse of this product. This one is a bit confusing as it requires taking an inverse, multiplying, and then taking another inverse. But it does check out in terms of probability theory, given the assumptions of the model.

What's the point of following the probability theory model? Well, it seems to nicely aggregate this trust in a way that makes sense. Trust drops exponentially with each hop, limiting the influence that a distantly connected (and perhaps malicious) peer can have. Yet at the same time, trust becomes significantly stronger when there are multiple paths from one node to another. Trust is also a concept that can naturally be described using probability. You can have anywhere from no trust to complete trust, with in between states representing partial trust.

One thing to note about this model is that it is pessimistic. That is, it assumes that all unknown peers are not trustworthy, and that all untrustworthy peers are malicious. (Otherwise, unknown peers would have a trust of 50%). This may seem harsh, but it is a necessary precaution against [Sybil attacks](https://en.wikipedia.org/wiki/Sybil_attack). By assuming that all unknown peers are malicious, this model can function well even in a highly adverse environment.

## Aggregating claim values

TODO
