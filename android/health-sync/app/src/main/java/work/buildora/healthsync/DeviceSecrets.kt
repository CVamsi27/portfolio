package work.buildora.healthsync

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import java.security.SecureRandom
import java.util.UUID
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/** Only an AES-GCM ciphertext is persisted. Keystore key and bearer never leave this device. */
class DeviceSecrets(context: Context) {
    private val prefs = context.getSharedPreferences("device", Context.MODE_PRIVATE)
    private val alias = "nova-health-device-aes"

    private fun key(): SecretKey {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (store.getKey(alias, null) as? SecretKey)?.let {
            return it
        }
        return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
            .apply {
                init(
                    KeyGenParameterSpec.Builder(
                            alias,
                            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
                        )
                        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                        .build()
                )
            }
            .generateKey()
    }

    val deviceId: String
        get() =
            prefs.getString("id", null)
                ?: UUID.randomUUID().toString().also {
                    check(prefs.edit().putString("id", it).commit())
                }

    fun secret(): ByteArray {
        prefs.getString("ciphertext", null)?.let {
            val bytes = Base64.decode(it, Base64.NO_WRAP)
            return Cipher.getInstance("AES/GCM/NoPadding")
                .apply {
                    init(
                        Cipher.DECRYPT_MODE,
                        key(),
                        GCMParameterSpec(128, bytes.copyOfRange(0, 12)),
                    )
                }
                .doFinal(bytes.copyOfRange(12, bytes.size))
        }
        val value = ByteArray(32).also { SecureRandom().nextBytes(it) }
        val cipher =
            Cipher.getInstance("AES/GCM/NoPadding").apply { init(Cipher.ENCRYPT_MODE, key()) }
        check(
            prefs
                .edit()
                .putString(
                    "ciphertext",
                    Base64.encodeToString(cipher.iv + cipher.doFinal(value), Base64.NO_WRAP),
                )
                .commit()
        )
        return value
    }

    fun authorization() =
        "Bearer $deviceId.${Base64.encodeToString(secret(),Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)}"

    fun reset() {
        check(prefs.edit().clear().commit())
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        store.deleteEntry(alias)
    }
}
