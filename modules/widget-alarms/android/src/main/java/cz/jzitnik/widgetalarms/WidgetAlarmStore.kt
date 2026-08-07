package cz.jzitnik.widgetalarms

import android.content.Context
import android.content.SharedPreferences
import android.util.Log

internal class WidgetAlarmStore(context: Context) {
  private val appContext = context.applicationContext
  private val prefs: SharedPreferences =
    appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  fun save(widgetName: String, triggerAtMillis: Long) {
    Log.d(TAG, "save(widget=$widgetName, triggerAt=$triggerAtMillis)")
    prefs.edit().putLong(widgetName, triggerAtMillis).apply()
  }

  fun remove(widgetName: String) {
    Log.d(TAG, "remove(widget=$widgetName)")
    prefs.edit().remove(widgetName).apply()
  }

  fun restore(): Int {
    val now = System.currentTimeMillis()
    val all = prefs.all
    var restored = 0
    var skippedPast = 0

    all.forEach { (widgetName, value) ->
      val triggerAt = value as? Long
      if (triggerAt == null) {
        Log.w(TAG, "restore: skipping $widgetName (value not a Long: $value)")
        return@forEach
      }
      if (triggerAt <= now) {
        Log.d(TAG, "restore: skipping $widgetName (triggerAt $triggerAt is in the past)")
        skippedPast++
        return@forEach
      }

      WidgetAlarmScheduler.schedule(appContext, widgetName, triggerAt)
      restored++
    }

    Log.i(TAG, "restore: re-armed $restored alarm(s), skipped $skippedPast past, of ${all.size} persisted")
    return restored
  }

  companion object {
    private const val TAG = "WidgetAlarms"
    private const val PREFS_NAME = "widget_alarms"
  }
}
