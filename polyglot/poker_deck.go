package main

import (
	"encoding/json"
	"math/rand"
	"os"
	"time"
)

type Card struct {
	Suit string `json:"suit"`
	Rank string `json:"rank"`
}

var suits = []string{"♠", "♥", "♦", "♣"}
var ranks = []string{"A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"}

func buildDeck() []Card {
	deck := make([]Card, 0, 52)
	for _, s := range suits {
		for _, r := range ranks {
			deck = append(deck, Card{Suit: s, Rank: r})
		}
	}
	return deck
}

func draw(deck *[]Card) Card {
	d := *deck
	idx := rand.Intn(len(d))
	c := d[idx]
	d[idx] = d[len(d)-1]
	*deck = d[:len(d)-1]
	return c
}

func main() {
	rand.Seed(time.Now().UnixNano())
	deck := buildDeck()
	hand := []Card{draw(&deck), draw(&deck)}
	_ = json.NewEncoder(os.Stdout).Encode(map[string]any{
		"hand":      hand,
		"remaining": len(deck),
	})
}

