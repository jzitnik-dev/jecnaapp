package cz.jzitnik.widgetalarms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.reactnativeandroidwidget.RNWidgetJsCommunication

class WidgetAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != WidgetAlarmScheduler.widgetAlarmAction(context)) {
      Log.w(TAG, "ignoring broadcast with unexpected action: ${intent.action}")
      return
    }

    val widgetName = intent.getStringExtra(WidgetAlarmScheduler.EXTRA_WIDGET_NAME)
    if (widgetName == null) {
      Log.w(TAG, "ALARM FIRED but missing extra '$EXTRA' → cannot determine widget, skipping")
      return
    }

    Log.i(TAG, "ALARM FIRED for widget=$widgetName → requestWidgetUpdate (enqueues headless WIDGET_UPDATE job)")
    RNWidgetJsCommunication.requestWidgetUpdate(context, widgetName)
  }

  companion object {
    private const val TAG = "WidgetAlarms"
    private const val EXTRA = WidgetAlarmScheduler.EXTRA_WIDGET_NAME
  }
}
