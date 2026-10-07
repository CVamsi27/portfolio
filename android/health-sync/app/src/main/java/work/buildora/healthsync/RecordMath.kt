package work.buildora.healthsync

import java.security.MessageDigest
import java.time.Instant
import java.time.ZoneOffset

data class SleepInterval(val start: Instant, val end: Instant, val asleep: Boolean)

/**
 * Merge asleep intervals to avoid duplicate stages; gaps/awake/unknown are not claimed as asleep.
 */
fun sleepHours(start: Instant, end: Instant, stages: List<SleepInterval>): Double {
    require(end >= start)
    if (stages.isEmpty()) return (end.toEpochMilli() - start.toEpochMilli()) / 3600000.0
    val asleep =
        stages
            .filter { it.asleep }
            .map { maxOf(it.start, start) to minOf(it.end, end) }
            .filter { it.second > it.first }
            .sortedBy { it.first }
    var total = 0L
    var left: Instant? = null
    var right: Instant? = null
    for ((from, to) in asleep) {
        if (left == null) {
            left = from
            right = to
        } else if (from <= right!!) {
            right = maxOf(right, to)
        } else {
            total += right!!.toEpochMilli() - left.toEpochMilli()
            left = from
            right = to
        }
    }
    if (left != null) total += right!!.toEpochMilli() - left.toEpochMilli()
    return total / 3600000.0
}

fun recordedDate(instant: Instant, offset: ZoneOffset): String =
    instant.atOffset(offset).toLocalDate().toString()

fun secretDigest(secret: ByteArray): String =
    MessageDigest.getInstance("SHA-256").digest(secret).joinToString("") {
        "%02x".format(it.toInt() and 255)
    }
