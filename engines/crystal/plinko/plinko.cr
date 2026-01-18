require "json"

struct PlinkoInput
  JSON.mapping(
    betMinor: Int64,
    rows: Int32,
    risk: String,
    slotIndex: Int32
  )
end

struct PlinkoOutput
  JSON.mapping(
    multiplier: Float64,
    payoutMinor: Int64
  )
end

BASE_MULTIPLIERS = {
  8 => {
    "low"    => [4.0, 1.5, 1.2, 0.8, 0.5, 0.8, 1.2, 1.5, 4.0],
    "medium" => [8.0, 4.0, 1.5, 0.7, 0.2, 0.7, 1.5, 4.0, 8.0],
    "high"   => [20.0, 8.0, 4.0, 1.5, 0.0, 1.5, 4.0, 8.0, 20.0],
  },
  10 => {
    "low"    => [6.0, 3.0, 1.5, 1.2, 0.8, 0.5, 0.8, 1.2, 1.5, 3.0, 6.0],
    "medium" => [12.0, 6.0, 3.0, 1.5, 0.7, 0.2, 0.7, 1.5, 3.0, 6.0, 12.0],
    "high"   => [40.0, 12.0, 6.0, 3.0, 1.5, 0.0, 1.5, 3.0, 6.0, 12.0, 40.0],
  },
  12 => {
    "low"    => [8.0, 4.0, 2.5, 1.5, 1.2, 0.8, 0.5, 0.8, 1.2, 1.5, 2.5, 4.0, 8.0],
    "medium" => [20.0, 8.0, 4.0, 2.5, 1.5, 0.7, 0.2, 0.7, 1.5, 2.5, 4.0, 8.0, 20.0],
    "high"   => [80.0, 20.0, 8.0, 4.0, 2.5, 0.5, 0.0, 0.5, 2.5, 4.0, 8.0, 20.0, 80.0],
  },
  14 => {
    "low"    => [12.0, 6.0, 4.0, 2.5, 1.8, 1.2, 0.8, 0.5, 0.8, 1.2, 1.8, 2.5, 4.0, 6.0, 12.0],
    "medium" => [40.0, 12.0, 6.0, 4.0, 2.5, 1.5, 0.7, 0.2, 0.7, 1.5, 2.5, 4.0, 6.0, 12.0, 40.0],
    "high"   => [160.0, 40.0, 12.0, 6.0, 4.0, 2.0, 0.5, 0.0, 0.5, 2.0, 4.0, 6.0, 12.0, 40.0, 160.0],
  },
  16 => {
    "low"    => [16.0, 8.0, 6.0, 4.0, 2.5, 1.8, 1.2, 0.8, 0.5, 0.8, 1.2, 1.8, 2.5, 4.0, 6.0, 8.0, 16.0],
    "medium" => [80.0, 20.0, 12.0, 6.0, 4.0, 2.5, 1.5, 0.7, 0.2, 0.7, 1.5, 2.5, 4.0, 6.0, 12.0, 20.0, 80.0],
    "high"   => [400.0, 80.0, 20.0, 12.0, 6.0, 4.0, 2.0, 0.5, 0.0, 0.5, 2.0, 4.0, 6.0, 12.0, 20.0, 80.0, 400.0],
  },
} of Int32 => Hash(String, Array(Float64))

input = PlinkoInput.from_json(STDIN.gets_to_end)

risk_map = BASE_MULTIPLIERS[input.rows]? || BASE_MULTIPLIERS[12]
mults = risk_map[input.risk]? || risk_map["medium"]

if input.slotIndex < 0 || input.slotIndex >= mults.size
  raise "Invalid slot"
end

multiplier = mults[input.slotIndex]
payout = (input.betMinor.to_f64 * multiplier).floor.to_i64

puts PlinkoOutput.new(multiplier: multiplier, payoutMinor: payout).to_json
