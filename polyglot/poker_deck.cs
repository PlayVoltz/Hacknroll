using System;
using System.Collections.Generic;

public class poker_deck
{
  static readonly string[] Suits = { "♠", "♥", "♦", "♣" };
  static readonly string[] Ranks = { "A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2" };

  public record Card(string suit, string rank);

  static List<Card> BuildDeck()
  {
    var deck = new List<Card>(52);
    foreach (var s in Suits)
      foreach (var r in Ranks)
        deck.Add(new Card(s, r));
    return deck;
  }

  static Card Draw(List<Card> deck, Random rnd)
  {
    var idx = rnd.Next(deck.Count);
    var c = deck[idx];
    deck.RemoveAt(idx);
    return c;
  }

  public static void Main()
  {
    var rnd = new Random();
    var deck = BuildDeck();
    var c1 = Draw(deck, rnd);
    var c2 = Draw(deck, rnd);

    // Tiny JSON output (no deps)
    Console.Write("{\"hand\":[");
    Console.Write($"{{\"suit\":\"{c1.suit}\",\"rank\":\"{c1.rank}\"}},");
    Console.Write($"{{\"suit\":\"{c2.suit}\",\"rank\":\"{c2.rank}\"}}");
    Console.Write($"],\"remaining\":{deck.Count}}}");
  }
}

