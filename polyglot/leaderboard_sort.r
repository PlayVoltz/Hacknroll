#!/usr/bin/env Rscript

# Leaderboard sorting (highest balance first).
# Input format: lines like "username creditsMinor"

lines <- readLines(file("stdin"), warn = FALSE)
lines <- lines[nzchar(trimws(lines))]

if (length(lines) == 0) {
  quit(status = 0)
}

parts <- strsplit(lines, "\\s+")
username <- sapply(parts, function(x) x[[1]])
credits <- as.integer(sapply(parts, function(x) x[[2]]))

df <- data.frame(username = username, creditsMinor = credits, stringsAsFactors = FALSE)
df <- df[order(-df$creditsMinor), ]

for (i in seq_len(nrow(df))) {
  cat(i, df$username[i], df$creditsMinor[i], "\n")
}

