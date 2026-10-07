package work.buildora.healthsync
/** Identity matches the server's provider-scoped deduplication key. */
fun recordIdentity(type: String, source: String, id: String): Triple<String, String, String> =
    Triple(type, source, id)

/** Empty windows still upload once, so the server acknowledges a real completed check. */
fun <T> syncChunks(records: List<T>, sizeOf: (T) -> Int): List<List<T>> {
    if (records.isEmpty()) return listOf(emptyList())
    val chunks = mutableListOf<List<T>>()
    var chunk = mutableListOf<T>()
    var bytes = 16
    for (record in records) {
        val size = sizeOf(record) + 1
        check(size < 750000) {
            "A health record exceeds the upload limit. Nothing was silently truncated."
        }
        if (chunk.size >= 200 || bytes + size > 750000) {
            chunks += chunk
            chunk = mutableListOf()
            bytes = 16
        }
        chunk += record
        bytes += size
    }
    if (chunk.isNotEmpty()) chunks += chunk
    return chunks
}
