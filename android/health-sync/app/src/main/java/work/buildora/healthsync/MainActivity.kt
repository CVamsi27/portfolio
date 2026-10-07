package work.buildora.healthsync

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.widget.*
import androidx.activity.ComponentActivity
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.lifecycle.lifecycleScope
import java.time.Instant
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

class MainActivity : ComponentActivity() {
    private lateinit var status: TextView
    private lateinit var pairing: TextView
    private lateinit var secrets: DeviceSecrets
    private var busy = false
    private val prefs by lazy { getSharedPreferences("sync", MODE_PRIVATE) }
    private val permissionRequest =
        registerForActivityResult(PermissionController.createRequestPermissionResultContract()) {
            granted ->
            status.text =
                if (granted.containsAll(HealthReader.permissions))
                    "Read permissions granted. Pair and Sync now."
                else "Permission denied or partial. No records have been uploaded."
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        secrets = DeviceSecrets(this)
        val content =
            LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(32, 48, 32, 32)
            }
        content.addView(
            TextView(this).apply {
                text = "NOVA Health Sync"
                textSize = 28f
            }
        )
        content.addView(
            TextView(this).apply {
                text =
                    "Read-only weight, daily steps and sleep. Source apps must write data to Health Connect. Foreground sync only; open this app and choose Sync now."
                textSize = 16f
            }
        )
        status =
            TextView(this).apply {
                text = "Last successful sync: ${prefs.getString("lastSync","Never")}"
                textSize = 16f
                setPadding(0, 24, 0, 24)
            }
        content.addView(status)
        pairing =
            TextView(this).apply {
                text = prefs.getString("pairingNotice", "")
                textSize = 20f
                setTextIsSelectable(true)
            }
        content.addView(pairing)
        fun button(label: String, action: () -> Unit) {
            content.addView(
                Button(this).apply {
                    text = label
                    setOnClickListener { if (!busy) action() }
                }
            )
        }
        button("Grant read permissions") {
            if (HealthConnectClient.getSdkStatus(this) == HealthConnectClient.SDK_AVAILABLE)
                permissionRequest.launch(HealthReader.permissions)
            else {
                status.text = "Install or update Health Connect, then return here."
                startActivity(
                    Intent(
                        Intent.ACTION_VIEW,
                        Uri.parse(
                            "https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata"
                        ),
                    )
                )
            }
        }
        button("Pair with NOVA") {
            runOperation {
                val response =
                    NovaApi(secrets)
                        .call(
                            "pair",
                            JSONObject()
                                .put("deviceId", secrets.deviceId)
                                .put("label", "${Build.MANUFACTURER} ${Build.MODEL}")
                                .put("secretDigest", secretDigest(secrets.secret())),
                            false,
                        )
                val notice =
                    "Pairing code: ${response.getString("pairingCode")}\nExpires: ${response.getString("expiresAt")}\nEnter this code in personal.buildora.work Health → Connections."
                prefs.edit().putString("pairingNotice", notice).apply()
                pairing.text = notice
                status.text = "Waiting for website approval."
            }
        }
        button("Check connection") {
            runOperation {
                val response = NovaApi(secrets).call("status")
                val rawLastSync =
                    response.optString("lastSyncAt").takeUnless {
                        response.isNull("lastSyncAt") || it.isBlank() || it == "null"
                    }
                val lastSync =
                    rawLastSync?.let {
                        runCatching {
                                java.time.format.DateTimeFormatter.ofLocalizedDateTime(
                                        java.time.format.FormatStyle.MEDIUM
                                    )
                                    .withZone(java.time.ZoneId.systemDefault())
                                    .format(Instant.parse(it))
                            }
                            .getOrDefault(it)
                    } ?: "Not synced yet"
                status.text =
                    if (response.optBoolean("paired")) "Paired. Last sync: $lastSync"
                    else "Not paired. Enter and approve the pairing code on the website."
            }
        }
        button("Sync now") {
            runOperation {
                val api = NovaApi(secrets)
                check(api.call("status").optBoolean("paired")) {
                    "Approve pairing in NOVA Health → Connections before syncing."
                }
                val current = HealthReader(this).read()
                // Compare only a completely read window. Failed or denied reads never create
                // deletions.
                val old = JSONArray(prefs.getString("previousRecords", "[]"))
                val ids = current.map { identity(it) }.toSet()
                val since = Instant.now().minusSeconds(28 * 86400L)
                val tombstones = mutableListOf<JSONObject>()
                for (index in 0 until old.length()) {
                    val row = old.getJSONObject(index)
                    if (
                        identity(row) !in ids && Instant.parse(row.getString("measuredAt")) >= since
                    )
                        tombstones +=
                            JSONObject(row.toString())
                                .put("deleted", true)
                                .put("updatedAt", System.currentTimeMillis())
                }
                val all = current + tombstones
                var acknowledged = 0
                for (chunk in syncChunks(all) { it.toString().toByteArray(Charsets.UTF_8).size }) {
                    val result = api.call("sync", JSONObject().put("records", JSONArray(chunk)))
                    acknowledged += result.getInt("count")
                }
                val lastSync = Instant.now().toString()
                check(
                    prefs
                        .edit()
                        .putString("previousRecords", JSONArray(current).toString())
                        .putString("lastSync", lastSync)
                        .commit()
                ) {
                    "Upload succeeded, but local sync checkpoint could not be saved. Retry safely."
                }
                status.text = "Synced $acknowledged records. Last successful sync: $lastSync"
                pairing.text = "Connected to your NOVA account."
            }
        }
        button("Open NOVA Health → Connections") {
            startActivity(
                Intent(
                    Intent.ACTION_VIEW,
                    Uri.parse("https://personal.buildora.work/health?view=connections"),
                )
            )
        }
        button("Privacy and permissions") {
            startActivity(Intent(this, PrivacyActivity::class.java))
        }
        button("Reset local pairing") {
            android.app.AlertDialog.Builder(this)
                .setMessage(
                    "First disconnect this device in NOVA Health → Connections. Reset removes this phone's credential and sync checkpoint; uploaded records stay in your account."
                )
                .setNegativeButton("Cancel", null)
                .setPositiveButton("Reset") { _, _ ->
                    secrets.reset()
                    prefs.edit().clear().apply()
                    pairing.text = ""
                    status.text = "Local pairing removed. Pair again to sync."
                }
                .show()
        }
        setContentView(ScrollView(this).apply { addView(content) })
    }

    private fun identity(record: JSONObject) =
        recordIdentity(record.getString("type"), record.getString("source"), record.getString("id"))

    private fun runOperation(action: suspend () -> Unit) {
        if (busy) return
        busy = true
        status.text = "Working…"
        lifecycleScope.launch {
            try {
                action()
            } catch (error: Exception) {
                status.text =
                    error.message ?: "Sync failed. Check network and permissions, then retry."
            } finally {
                busy = false
            }
        }
    }
}
