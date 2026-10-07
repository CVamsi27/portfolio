package work.buildora.healthsync

import java.time.Instant
import java.time.ZoneOffset
import org.junit.Assert.*
import org.junit.Test

class RecordMathTest {
    private val start = Instant.parse("2026-10-06T17:00:00Z")

    @Test
    fun asleepIntervalsExcludeAwakeAndMergeOverlaps() {
        val end = start.plusSeconds(8 * 3600)
        val stages =
            listOf(
                SleepInterval(start, start.plusSeconds(4 * 3600), true),
                SleepInterval(start.plusSeconds(3 * 3600), start.plusSeconds(7 * 3600), true),
                SleepInterval(start.plusSeconds(7 * 3600), end, false),
            )
        assertEquals(7.0, sleepHours(start, end, stages), 0.00001)
    }

    @Test
    fun emptyStagesUseSessionDuration() {
        assertEquals(8.0, sleepHours(start, start.plusSeconds(8 * 3600), emptyList()), 0.00001)
    }

    @Test
    fun wakeDateUsesRecordedTimezoneAcrossMidnight() {
        assertEquals(
            "2026-10-07",
            recordedDate(start.plusSeconds(8 * 3600), ZoneOffset.ofHoursMinutes(5, 30)),
        )
    }

    @Test
    fun digestNeverContainsRawSecret() {
        assertEquals(
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
            secretDigest("abc".toByteArray()),
        )
    }

    @Test
    fun clippedStageCannotExceedSession() {
        assertEquals(
            1.0,
            sleepHours(
                start,
                start.plusSeconds(3600),
                listOf(SleepInterval(start.minusSeconds(500), start.plusSeconds(8000), true)),
            ),
            0.00001,
        )
    }
}
