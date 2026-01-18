import java.io.BufferedReader
import java.io.InputStreamReader

// Leaderboard sorting (highest balance first).
// Input format: lines like "username creditsMinor"

data class Row(val username: String, val creditsMinor: Long)

fun main() {
  val br = BufferedReader(InputStreamReader(System.`in`))
  val rows = mutableListOf<Row>()
  while (true) {
    val line = br.readLine() ?: break
    val s = line.trim()
    if (s.isEmpty()) continue
    val parts = s.split(Regex("\\s+"))
    if (parts.size < 2) continue
    rows.add(Row(parts[0], parts[1].toLong()))
  }

  val sorted = rows.sortedByDescending { it.creditsMinor }
  for ((i, r) in sorted.withIndex()) {
    println("${i + 1} ${r.username} ${r.creditsMinor}")
  }
}

