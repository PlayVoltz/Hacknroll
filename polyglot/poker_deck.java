import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class poker_deck {
  static final String[] SUITS = new String[] {"♠", "♥", "♦", "♣"};
  static final String[] RANKS = new String[] {"A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"};

  static class Card {
    final String suit;
    final String rank;
    Card(String suit, String rank) { this.suit = suit; this.rank = rank; }
  }

  static List<Card> buildDeck() {
    List<Card> deck = new ArrayList<>(52);
    for (String s : SUITS) for (String r : RANKS) deck.add(new Card(s, r));
    return deck;
  }

  static Card draw(List<Card> deck, Random rnd) {
    int idx = rnd.nextInt(deck.size());
    return deck.remove(idx);
  }

  public static void main(String[] args) {
    Random rnd = new Random();
    List<Card> deck = buildDeck();
    Card c1 = draw(deck, rnd);
    Card c2 = draw(deck, rnd);

    // Tiny JSON output (no dependencies)
    System.out.print("{\"hand\":[");
    System.out.print("{\"suit\":\"" + c1.suit + "\",\"rank\":\"" + c1.rank + "\"},");
    System.out.print("{\"suit\":\"" + c2.suit + "\",\"rank\":\"" + c2.rank + "\"}");
    System.out.print("],\"remaining\":" + deck.size() + "}");
  }
}

