package work.buildora.healthsync

import org.junit.Assert.*
import org.junit.Test

class SyncProtocolTest {
    @Test
    fun emptyWindowStillSendsAcknowledgedSyncRequest() {
        assertEquals(listOf(emptyList<Int>()), syncChunks(emptyList<Int>()) { it })
    }

    @Test
    fun sameIdFromOtherSourceOrTypeDoesNotSuppressDeletion() {
        val original = recordIdentity("weight", "app-one", "shared-id")
        assertNotEquals(original, recordIdentity("weight", "app-two", "shared-id"))
        assertNotEquals(original, recordIdentity("sleep", "app-one", "shared-id"))
        assertEquals(original, recordIdentity("weight", "app-one", "shared-id"))
    }

    @Test
    fun payloadBytesSplitLargeStageRecordsBeforeServerLimit() {
        assertEquals(
            listOf(listOf(400000), listOf(400000, 10)),
            syncChunks(listOf(400000, 400000, 10)) { it },
        )
    }

    @Test
    fun recordCountSplitsEvenWhenPayloadIsSmall() {
        assertEquals(listOf(200, 1), syncChunks(List(201) { 1 }) { it }.map { it.size })
    }

    @Test
    fun oversizedSingleRecordIsNeverSilentlyDropped() {
        assertThrows(IllegalStateException::class.java) { syncChunks(listOf(750000)) { it } }
    }
}
