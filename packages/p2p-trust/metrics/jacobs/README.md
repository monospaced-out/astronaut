# p2p-trust: jacobs algorithm

>The trust of a city street is formed over time from many, many little public sidewalk contacts... Most of it is ostensibly utterly trivial but the sum is not trivial at all. The sum of such casual, public contact at a local level... is a feeling for the public identity of people, a web of public respect and trust.

Jane Jacobs, *The Death and Life of Great American Cities*

## Corrections [WIP]

At an intuitive level, corrections can be conceptualized as the opposite of trust links. If a peer would like to broadcast to its network that another peer should *not* be trusted, a correction should be posted.

However, corrections are not modeled as the opposites of trust links. Rather, they are a level above the trust link layer. This is why they are called *corrections* rather than *distrust links*. A distrust link would be a statement that a peer is not trustworthy, the opposite of trustworthy. However, the concept of a distrust link would be problematic for two reasons.

First, it would allow contradictory states to arise in the model. For example, if a peer (that I trust with 90% confidence) says that peer X is 100% trustworthy, but a second peer (that I also trust with 80% confidence) says that peer X is 100% *not* trustworthy, this means the following probabilities are both true: peer X is trustworthy with probability 90%, *and* peer X is *not* trustworthy with probability 80%. Because being trustworthy and being not trustworthy are mutually exclusive possibilities, and because there is a 100% probability that any peer is either trustworthy or not, the probability that a peer is trustworthy *plus* the probability that this peer is *not* trustworthy should always equal 100%. 90% + 80% does not equal 100%; thus we have a contradiction.

Second, distrust links would have limited ability to override bad trust links. For example, if I have trust in peer X with probability 70% (from my peers), but then I receive external information which leads me to conclude with 100% certainty that this peer is not trustworthy. This leads me to create a distrust link of 100%. While it is unclear what the exact procedure should be for determining how to combine trust links and distrust links, a reasonable intuition in this particlar situation would be to update my trust in peer X with probability 0%. Of course, this is the same number that I would get if I did not trust peer X at all (and none of my trusted peers trusted peer X, etc.) Rather than sending a signal to my peers that peer X should not be trusted, I would simply be sending same signal as someone that had no opinion on peer X. This is not what we want. We want to send a *negative* signal about peer X. Of course, probabilities cannot be negative.

These problems are solved when we model *corrections* instead of *distrust links*. A correction is a statement that a given peer *should not* be trusted. In other words, it's a recommendation to my peers *not* to trust someone. Peers will follow my recommendation to the degree that they trust me. So a peer that trusts me with 100% confidence would ignore any trust they would have otherwise had in peer X. Or, if this peer trusts me with 50% confidence, they would "correct" their trust in peer X by 50%. That is, if they trusted peer X with confidence 80%, they would correct this to a trust of 40% (`0.5 x 0.8 = 0.4`).

Corrections are aggregated from peers in the same way that trust is aggregated. Trust links through peers are followed, except that the terminal condition is finding a peer with a *correction* pointing to the target node. Corrections are *not* transitive; thus corrections pointing to other nodes should not be followed at any step in the graph traversal.

The end result is that now peers can write *corrections* to the graph. Further, the procedure for calculating trust is augmented. First, the "raw" trust is calculated using the previously defined method. Then, the corrected trust is calculated. The final trust is given by `(1 - correction) * raw`.
