package main

import (
	"encoding/json"
	"fmt"
	"os"
	"sort"
)

type Row struct {
	UserID      string `json:"userId"`
	Username    string `json:"username"`
	Credits     int64  `json:"creditsMinor"`
	Rank        int    `json:"rank,omitempty"`
}

func main() {
	var rows []Row
	if err := json.NewDecoder(os.Stdin).Decode(&rows); err != nil {
		_, _ = fmt.Fprintln(os.Stderr, "decode:", err)
		os.Exit(1)
	}

	sort.Slice(rows, func(i, j int) bool {
		return rows[i].Credits > rows[j].Credits // highest first
	})
	for i := range rows {
		rows[i].Rank = i + 1
	}

	enc := json.NewEncoder(os.Stdout)
	enc.SetEscapeHTML(false)
	if err := enc.Encode(rows); err != nil {
		_, _ = fmt.Fprintln(os.Stderr, "encode:", err)
		os.Exit(1)
	}
}

