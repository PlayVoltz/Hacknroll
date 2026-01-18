import std/[json, random, strutils, sequtils]

type
  Card = object
    suit: string
    rank: string

  Output = object
    playerHand: seq[Card]
    dealerHand: seq[Card]
    playerTotal: int
    dealerTotal: int
    outcome: string
    payoutMinor: int

proc buildDeck(): seq[Card] =
  let suits = @["♠", "♥", "♦", "♣"]
  let ranks = @["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
  for s in suits:
    for r in ranks:
      result.add(Card(suit: s, rank: r))

proc draw(deck: var seq[Card]): Card =
  let idx = rand(deck.len - 1)
  result = deck[idx]
  deck.delete(idx)

proc handValue(hand: seq[Card]): int =
  var total = 0
  var aces = 0
  for c in hand:
    if c.rank == "A":
      inc aces
      total += 11
    elif c.rank in ["K", "Q", "J"]:
      total += 10
    else:
      total += parseInt(c.rank)
  while total > 21 and aces > 0:
    total -= 10
    dec aces
  result = total

proc main() =
  randomize()
  let input = readAll(stdin)
  let node = parseJson(input)
  let betMinor = node["betMinor"].getInt

  var deck = buildDeck()
  var playerHand = @[draw(deck), draw(deck)]
  var dealerHand = @[draw(deck), draw(deck)]

  var playerTotal = handValue(playerHand)
  while playerTotal < 17:
    playerHand.add(draw(deck))
    playerTotal = handValue(playerHand)

  var dealerTotal = handValue(dealerHand)
  while dealerTotal < 17:
    dealerHand.add(draw(deck))
    dealerTotal = handValue(dealerHand)

  var outcome = "PUSH"
  if playerTotal > 21:
    outcome = "LOSE"
  elif dealerTotal > 21:
    outcome = "WIN"
  elif playerTotal > dealerTotal:
    outcome = "WIN"
  elif playerTotal < dealerTotal:
    outcome = "LOSE"

  var payoutMinor = 0
  if outcome == "WIN":
    payoutMinor = betMinor * 2
  elif outcome == "PUSH":
    payoutMinor = betMinor

  let out = %*{
    "playerHand": playerHand.mapIt(%*{"suit": it.suit, "rank": it.rank}),
    "dealerHand": dealerHand.mapIt(%*{"suit": it.suit, "rank": it.rank}),
    "playerTotal": playerTotal,
    "dealerTotal": dealerTotal,
    "outcome": outcome,
    "payoutMinor": payoutMinor
  }

  stdout.write(out)

when isMainModule:
  main()
