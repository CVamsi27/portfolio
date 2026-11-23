package work.buildora.healthsync

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HydrationRecord
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import kotlin.math.roundToInt
import org.json.JSONArray
import org.json.JSONObject

class HealthReader(private val context: Context) {
    companion object {
        val corePermissions =
            setOf(
                HealthPermission.getReadPermission(WeightRecord::class),
                HealthPermission.getReadPermission(StepsRecord::class),
                HealthPermission.getReadPermission(SleepSessionRecord::class),
            )
        val exercisePermission = HealthPermission.getReadPermission(ExerciseSessionRecord::class)
        val caloriesPermission = HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class)
        val hydrationPermission = HealthPermission.getReadPermission(HydrationRecord::class)
        val restingHrPermission = HealthPermission.getReadPermission(RestingHeartRateRecord::class)
        val permissions =
            corePermissions +
                setOf(
                    exercisePermission,
                    caloriesPermission,
                    hydrationPermission,
                    restingHrPermission,
                )
    }

    suspend fun read(): List<JSONObject> {
        check(HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE) {
            "Health Connect is unavailable or requires an update."
        }
        val client = HealthConnectClient.getOrCreate(context)
        val granted = client.permissionController.getGrantedPermissions()
        check(granted.containsAll(corePermissions)) {
            "Grant read access to weight, steps and sleep before syncing. Permissions may have been revoked."
        }
        val now = Instant.now()
        val zone = ZoneId.systemDefault()
        val today = LocalDate.now(zone)
        val since = now.minusSeconds(29 * 86400L)
        val output = mutableListOf<JSONObject>()

        var page: String? = null
        do {
            val response =
                client.readRecords(
                    ReadRecordsRequest(
                        WeightRecord::class,
                        TimeRangeFilter.between(since, now),
                        pageToken = page,
                        pageSize = 500,
                    )
                )
            response.records.forEach { record ->
                val offset = record.zoneOffset ?: zone.rules.getOffset(record.time)
                output +=
                    row(
                            record.metadata.id,
                            "weight",
                            recordedDate(record.time, offset),
                            record.weight.inKilograms,
                            "kg",
                            record.metadata.dataOrigin.packageName,
                            record.time,
                            record.metadata.lastModifiedTime.toEpochMilli(),
                        )
                        .put("zoneOffsetSeconds", offset.totalSeconds)
            }
            page = response.pageToken
        } while (page != null)

        page = null
        do {
            val response =
                client.readRecords(
                    ReadRecordsRequest(
                        SleepSessionRecord::class,
                        TimeRangeFilter.between(since, now),
                        pageToken = page,
                        pageSize = 500,
                    )
                )
            response.records.forEach { record ->
                check(record.stages.size <= 2000) {
                    "Sleep record contains more stages than supported. No stages were dropped."
                }
                val offset = record.endZoneOffset ?: zone.rules.getOffset(record.endTime)
                val asleep =
                    setOf(
                        SleepSessionRecord.STAGE_TYPE_SLEEPING,
                        SleepSessionRecord.STAGE_TYPE_LIGHT,
                        SleepSessionRecord.STAGE_TYPE_DEEP,
                        SleepSessionRecord.STAGE_TYPE_REM,
                    )
                val stages =
                    record.stages.map {
                        SleepInterval(it.startTime, it.endTime, it.stage in asleep)
                    }
                val known =
                    asleep +
                        setOf(
                            SleepSessionRecord.STAGE_TYPE_AWAKE,
                            SleepSessionRecord.STAGE_TYPE_OUT_OF_BED,
                        )
                val kind =
                    if (stages.isEmpty()) "session-duration"
                    else if (record.stages.any { it.stage !in known }) "partial-stage-duration"
                    else "asleep-stage-duration"
                output +=
                    row(
                            record.metadata.id,
                            "sleep",
                            recordedDate(record.endTime, offset),
                            sleepHours(record.startTime, record.endTime, stages) * 60,
                            "minutes",
                            record.metadata.dataOrigin.packageName + " · " + kind,
                            record.endTime,
                            record.metadata.lastModifiedTime.toEpochMilli(),
                        )
                        .put("zoneOffsetSeconds", offset.totalSeconds)
                        .put("startAt", record.startTime.toString())
                        .put("endAt", record.endTime.toString())
                        .put("measurementKind", kind)
                        .put(
                            "stages",
                            JSONArray().apply {
                                record.stages.forEach {
                                    put(
                                        JSONObject()
                                            .put("startAt", it.startTime.toString())
                                            .put("endAt", it.endTime.toString())
                                            .put(
                                                "stage",
                                                when (it.stage) {
                                                    SleepSessionRecord.STAGE_TYPE_AWAKE -> "awake"
                                                    SleepSessionRecord.STAGE_TYPE_SLEEPING ->
                                                        "sleeping"
                                                    SleepSessionRecord.STAGE_TYPE_OUT_OF_BED ->
                                                        "out-of-bed"
                                                    SleepSessionRecord.STAGE_TYPE_LIGHT -> "light"
                                                    SleepSessionRecord.STAGE_TYPE_DEEP -> "deep"
                                                    SleepSessionRecord.STAGE_TYPE_REM -> "rem"
                                                    else -> "unknown"
                                                },
                                            )
                                    )
                                }
                            },
                        )
            }
            page = response.pageToken
        } while (page != null)

        if (exercisePermission in granted) {
            page = null
            do {
                val response =
                    client.readRecords(
                        ReadRecordsRequest(
                            ExerciseSessionRecord::class,
                            TimeRangeFilter.between(since, now),
                            pageToken = page,
                            pageSize = 500,
                        )
                    )
                response.records.forEach { record ->
                    val offset = record.startZoneOffset ?: zone.rules.getOffset(record.startTime)
                    val minutes =
                        ((record.endTime.toEpochMilli() - record.startTime.toEpochMilli()) / 60000.0)
                            .coerceIn(0.0, 1440.0)
                    val activity = exerciseTypeLabel(record.exerciseType)
                    val item =
                        row(
                                record.metadata.id,
                                "exercise",
                                recordedDate(record.startTime, offset),
                                minutes,
                                "minutes",
                                record.metadata.dataOrigin.packageName,
                                record.startTime,
                                record.metadata.lastModifiedTime.toEpochMilli(),
                            )
                            .put("zoneOffsetSeconds", offset.totalSeconds)
                            .put("startAt", record.startTime.toString())
                            .put("endAt", record.endTime.toString())
                            .put("activityType", activity)
                    record.title?.trim()?.takeIf { it.isNotEmpty() }?.let {
                        item.put("title", it.take(120))
                    }
                    output += item
                }
                page = response.pageToken
            } while (page != null)
        }

        if (restingHrPermission in granted) {
            page = null
            do {
                val response =
                    client.readRecords(
                        ReadRecordsRequest(
                            RestingHeartRateRecord::class,
                            TimeRangeFilter.between(since, now),
                            pageToken = page,
                            pageSize = 500,
                        )
                    )
                response.records.forEach { record ->
                    val offset = record.zoneOffset ?: zone.rules.getOffset(record.time)
                    output +=
                        row(
                                record.metadata.id,
                                "resting_hr",
                                recordedDate(record.time, offset),
                                record.beatsPerMinute.toDouble(),
                                "bpm",
                                record.metadata.dataOrigin.packageName,
                                record.time,
                                record.metadata.lastModifiedTime.toEpochMilli(),
                            )
                            .put("zoneOffsetSeconds", offset.totalSeconds)
                }
                page = response.pageToken
            } while (page != null)
        }

        // Daily priority aggregates (Steps, Active Calories, Hydration)
        for (daysAgo in 0..27) {
            val date = today.minusDays(daysAgo.toLong())
            val start = date.atStartOfDay(zone).toInstant()
            val end = if (daysAgo == 0) now else date.plusDays(1).atStartOfDay(zone).toInstant()
            val stepResult =
                client.aggregate(
                    AggregateRequest(
                        setOf(StepsRecord.COUNT_TOTAL),
                        TimeRangeFilter.between(start, end),
                    )
                )
            val count = stepResult[StepsRecord.COUNT_TOTAL]
            if (count != null) {
                output +=
                    row(
                            "steps:$date:${zone.id}",
                            "steps",
                            date.toString(),
                            count.toDouble(),
                            "count",
                            "Health Connect priority aggregate · " +
                                stepResult.dataOrigins
                                    .map { it.packageName }
                                    .sorted()
                                    .joinToString(","),
                            end,
                            now.toEpochMilli(),
                        )
                        .put("zoneOffsetSeconds", zone.rules.getOffset(end).totalSeconds)
                        .put("startAt", start.toString())
                        .put("endAt", end.toString())
                        .put("measurementKind", "daily-priority-aggregate")
            }

            if (caloriesPermission in granted) {
                val calResult =
                    client.aggregate(
                        AggregateRequest(
                            setOf(ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL),
                            TimeRangeFilter.between(start, end),
                        )
                    )
                val kcal = calResult[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.inKilocalories
                if (kcal != null && kcal > 0) {
                    output +=
                        row(
                                "active_calories:$date:${zone.id}",
                                "active_calories",
                                date.toString(),
                                kcal.roundToInt().toDouble(),
                                "kcal",
                                "Health Connect priority aggregate · " +
                                    calResult.dataOrigins
                                        .map { it.packageName }
                                        .sorted()
                                        .joinToString(","),
                                end,
                                now.toEpochMilli(),
                            )
                            .put("zoneOffsetSeconds", zone.rules.getOffset(end).totalSeconds)
                            .put("startAt", start.toString())
                            .put("endAt", end.toString())
                            .put("measurementKind", "daily-priority-aggregate")
                }
            }

            if (hydrationPermission in granted) {
                val hydResult =
                    client.aggregate(
                        AggregateRequest(
                            setOf(HydrationRecord.VOLUME_TOTAL),
                            TimeRangeFilter.between(start, end),
                        )
                    )
                val ml = hydResult[HydrationRecord.VOLUME_TOTAL]?.inMilliliters
                if (ml != null && ml > 0) {
                    output +=
                        row(
                                "hydration:$date:${zone.id}",
                                "hydration",
                                date.toString(),
                                ml.roundToInt().toDouble(),
                                "ml",
                                "Health Connect priority aggregate · " +
                                    hydResult.dataOrigins
                                        .map { it.packageName }
                                        .sorted()
                                        .joinToString(","),
                                end,
                                now.toEpochMilli(),
                            )
                            .put("zoneOffsetSeconds", zone.rules.getOffset(end).totalSeconds)
                            .put("startAt", start.toString())
                            .put("endAt", end.toString())
                            .put("measurementKind", "daily-priority-aggregate")
                }
            }
        }
        return output
    }

    private fun exerciseTypeLabel(type: Int): String =
        when (type) {
            ExerciseSessionRecord.EXERCISE_TYPE_WALKING -> "Walking"
            ExerciseSessionRecord.EXERCISE_TYPE_RUNNING,
            ExerciseSessionRecord.EXERCISE_TYPE_RUNNING_TREADMILL -> "Running"
            ExerciseSessionRecord.EXERCISE_TYPE_BIKING,
            ExerciseSessionRecord.EXERCISE_TYPE_BIKING_STATIONARY -> "Cycling"
            ExerciseSessionRecord.EXERCISE_TYPE_WEIGHTLIFTING,
            ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING -> "Strength Training"
            ExerciseSessionRecord.EXERCISE_TYPE_YOGA -> "Yoga"
            ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_POOL,
            ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_OPEN_WATER -> "Swimming"
            ExerciseSessionRecord.EXERCISE_TYPE_HIGH_INTENSITY_INTERVAL_TRAINING -> "HIIT"
            ExerciseSessionRecord.EXERCISE_TYPE_BADMINTON -> "Badminton"
            else -> "Workout"
        }

    private fun row(
        id: String,
        type: String,
        date: String,
        value: Double,
        unit: String,
        source: String,
        time: Instant,
        updated: Long,
    ) =
        JSONObject()
            .put("id", id)
            .put("type", type)
            .put("date", date)
            .put("value", value)
            .put("unit", unit)
            .put("source", source)
            .put("measuredAt", time.toString())
            .put("updatedAt", updated)
}
