package work.buildora.healthsync

import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

class NovaApi(private val secrets: DeviceSecrets) {
    private val origin = "https://personal.buildora.work"

    suspend fun call(
        path: String,
        body: JSONObject? = null,
        authenticate: Boolean = true,
    ): JSONObject =
        withContext(Dispatchers.IO) {
            require(path in setOf("pair", "status", "sync"))
            val connection =
                URL("$origin/api/health-connect/$path").openConnection() as HttpURLConnection
            try {
                connection.connectTimeout = 15000
                connection.readTimeout = 30000
                connection.instanceFollowRedirects = false
                connection.requestMethod = if (body == null) "GET" else "POST"
                if (authenticate)
                    connection.setRequestProperty("Authorization", secrets.authorization())
                if (body != null) {
                    connection.doOutput = true
                    connection.setRequestProperty("Content-Type", "application/json")
                    connection.outputStream.use {
                        it.write(body.toString().toByteArray(Charsets.UTF_8))
                    }
                }
                val status = connection.responseCode
                if (status !in 200..299)
                    throw IllegalStateException(
                        when (status) {
                            401,
                            403,
                            409 ->
                                "Device pairing is expired, revoked or already claimed. Disconnect the old device in NOVA Health → Connections if needed, choose Reset local pairing in this app, then Pair with NOVA and approve the new code on the website."
                            429 -> "Sync rate limit reached. Retry later."
                            else -> "NOVA request failed (HTTP $status). Retry when online."
                        }
                    )
                JSONObject(connection.inputStream.bufferedReader().use { it.readText() })
            } finally {
                connection.disconnect()
            }
        }
}
