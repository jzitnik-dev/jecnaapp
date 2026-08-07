package cz.jzitnik.widgetalarms

import android.content.Context
import android.util.Log
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WidgetAlarmsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WidgetAlarms")

    Function("schedule") { widgetName: String, triggerAtMillis: Long ->
      Log.i(TAG, "JS → schedule(widget=$widgetName, triggerAtMillis=$triggerAtMillis)")
      val context = requireContext()
      WidgetAlarmScheduler.schedule(context, widgetName, triggerAtMillis)
      WidgetAlarmStore(context).save(widgetName, triggerAtMillis)
      Log.i(TAG, "JS → schedule(widget=$widgetName): alarm armed and persisted for boot-restore")
    }

    Function("cancel") { widgetName: String ->
      Log.i(TAG, "JS → cancel(widget=$widgetName)")
      val context = requireContext()
      WidgetAlarmScheduler.cancel(context, widgetName)
      WidgetAlarmStore(context).remove(widgetName)
      Log.i(TAG, "JS → cancel(widget=$widgetName): alarm removed and persisted entry deleted")
    }
  }

  private fun requireContext(): Context =
    appContext.reactContext ?: throw Exceptions.ReactContextLost()

  companion object {
    private const val TAG = "WidgetAlarms"
  }
}
