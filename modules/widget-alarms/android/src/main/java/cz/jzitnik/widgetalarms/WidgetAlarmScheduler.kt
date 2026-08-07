package cz.jzitnik.widgetalarms

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

internal object WidgetAlarmScheduler {
  private const val TAG = "WidgetAlarms"

  const val ACTION_SUFFIX = "WIDGET_ALARM"
  const val EXTRA_WIDGET_NAME = "widgetName"

  private const val MIN_FIRE_DELAY_MS = 1_000L

  fun widgetAlarmAction(context: Context): String = "${context.packageName}.$ACTION_SUFFIX"

  fun widgetAlarmIntent(context: Context, widgetName: String): Intent =
    Intent(widgetAlarmAction(context))
      .setPackage(context.packageName)
      .putExtra(EXTRA_WIDGET_NAME, widgetName)

  private fun pendingIntent(context: Context, widgetName: String): PendingIntent =
    PendingIntent.getBroadcast(
      context,
      widgetName.hashCode(),
      widgetAlarmIntent(context, widgetName),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

  fun schedule(context: Context, widgetName: String, triggerAtMillis: Long) {
    val now = System.currentTimeMillis()
    val requestedDelayMinutes = (triggerAtMillis - now) / 60_000.0
    val triggerAt = maxOf(triggerAtMillis, now + MIN_FIRE_DELAY_MS)
    val actualDelayMinutes = (triggerAt - now) / 60_000.0

    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val exactAllowed =
      Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()

    if (exactAllowed) {
      Log.i(
        TAG,
        "schedule(widget=$widgetName, requestedAt=$triggerAtMillis (in ${"%.1f".format(requestedDelayMinutes)} min), " +
          "fireAt=$triggerAt (in ${"%.1f".format(actualDelayMinutes)} min)) → setExactAndAllowWhileIdle"
      )
      alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent(context, widgetName))
    } else {
      Log.w(
        TAG,
        "schedule(widget=$widgetName, requestedAt=$triggerAtMillis, fireAt=$triggerAt) → " +
          "SCHEDULE_EXACT_ALARM NOT GRANTED, falling back to inexact setAndAllowWhileIdle"
      )
      alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent(context, widgetName))
    }
  }

  fun cancel(context: Context, widgetName: String) {
    Log.i(TAG, "cancel(widget=$widgetName)")
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val pending = pendingIntent(context, widgetName)
    alarmManager.cancel(pending)
    pending.cancel()
    Log.i(TAG, "cancel(widget=$widgetName): alarm cancelled and PendingIntent invalidated")
  }
}
