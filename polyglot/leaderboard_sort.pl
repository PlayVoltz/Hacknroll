#!/usr/bin/env perl
use strict;
use warnings;

# Leaderboard sorting (highest balance first).
# Input format: lines like "username creditsMinor"

my @rows = ();
while (my $line = <STDIN>) {
  chomp $line;
  next if $line =~ /^\s*$/;
  my ($username, $credits) = split(/\s+/, $line, 2);
  push @rows, { username => $username, creditsMinor => int($credits) };
}

@rows = sort { $b->{creditsMinor} <=> $a->{creditsMinor} } @rows;

my $rank = 1;
for my $r (@rows) {
  print $rank++ . " " . $r->{username} . " " . $r->{creditsMinor} . "\n";
}

