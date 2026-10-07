package work.buildora.healthsync

import android.app.Activity
import android.os.Bundle
import android.widget.TextView

class PrivacyActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(
            TextView(this).apply {
                setPadding(32, 48, 32, 32)
                textSize = 18f
                text =
                    "NOVA Health Sync reads weight, daily steps and sleep from Health Connect only when you choose Sync now. No write, background, location or calorie-burn permissions are requested. Records are uploaded over HTTPS to your paired NOVA account, with source and timestamps. Your account retains imports until you delete them. The device credential is encrypted using Android Keystore, excluded from Android backup, and never exported. Disconnect in NOVA Health → Connections to revoke uploads; revoke Health Connect permissions to stop reads. This companion requires your source apps to write data to Health Connect. You can use NOVA without connecting health data."
            }
        )
    }
}
