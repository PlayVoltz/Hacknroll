#!/usr/bin/env runghc

-- Leaderboard sorting (highest balance first).
-- Input format: lines like "username creditsMinor"

import Data.List (sortOn)
import Data.Ord (Down(..))

parseLine :: String -> Maybe (String, Int)
parseLine s =
  case words s of
    (u:c:_) -> Just (u, read c)
    _       -> Nothing

main :: IO ()
main = do
  input <- getContents
  let rows = [ r | Just r <- map parseLine (lines input) ]
      sorted = sortOn (Down . snd) rows
  mapM_ putStrLn [ show i ++ " " ++ u ++ " " ++ show c | (i,(u,c)) <- zip [1..] sorted ]

