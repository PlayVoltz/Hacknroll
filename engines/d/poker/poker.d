import std.stdio;
import std.json;
import std.random;
import std.array;
import std.conv;

struct Card {
    string suit;
    string rank;
}

Card[] buildDeck() {
    string[] suits = ["\u2660", "\u2665", "\u2666", "\u2663"];
    string[] ranks = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
    Card[] deck;
    foreach (s; suits) {
        foreach (r; ranks) {
            deck ~= Card(s, r);
        }
    }
    return deck;
}

Card[] jsonToDeck(JSONValue deckJson) {
    Card[] deck;
    foreach (c; deckJson.array) {
        auto obj = c.object;
        deck ~= Card(obj["suit"].str, obj["rank"].str);
    }
    return deck;
}

JSONValue cardToJson(Card c) {
    auto obj = JSONValue.emptyObject;
    obj["suit"] = JSONValue(c.suit);
    obj["rank"] = JSONValue(c.rank);
    return obj;
}

JSONValue deckToJson(Card[] deck) {
    auto arr = JSONValue.emptyArray;
    foreach (c; deck) {
        arr.array ~= cardToJson(c);
    }
    return arr;
}

void main() {
    auto inputText = readText(stdin);
    if (inputText.length == 0) {
        writeln("{\"error\":\"no_input\"}");
        return;
    }

    auto input = parseJSON(inputText);
    auto action = input.object["action"].str;
    auto rng = Random(unpredictableSeed);

    if (action == "build_deck") {
        auto deck = buildDeck();
        auto out = JSONValue.emptyObject;
        out["deck"] = deckToJson(deck);
        writeln(out.toString());
        return;
    }

    if (action == "draw") {
        auto deckJson = input.object["deck"];
        auto deck = jsonToDeck(deckJson);
        if (deck.length == 0) {
            writeln("{\"error\":\"empty_deck\"}");
            return;
        }
        auto idx = uniform(0, cast(int)deck.length, rng);
        auto card = deck[idx];
        deck = deck[0..idx] ~ deck[idx + 1 .. $];
        auto out = JSONValue.emptyObject;
        out["card"] = cardToJson(card);
        out["deck"] = deckToJson(deck);
        writeln(out.toString());
        return;
    }

    if (action == "pick_winner") {
        auto contendersJson = input.object["contenders"];
        auto contenders = contendersJson.array;
        if (contenders.length == 0) {
            writeln("{\"winnerId\":\"\"}");
            return;
        }
        auto idx = uniform(0, cast(int)contenders.length, rng);
        auto winnerId = contenders[idx].str;
        auto out = JSONValue.emptyObject;
        out["winnerId"] = JSONValue(winnerId);
        writeln(out.toString());
        return;
    }

    writeln("{\"error\":\"unknown_action\"}");
}
