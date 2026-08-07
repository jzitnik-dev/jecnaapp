package cz.jzitnik.widgetalarms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class WidgetBootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

    Log.i(TAG, "BOOT_COMPLETED received → re-arming persisted widget alarms")
    val restored = WidgetAlarmStore(context).restore()
    Log.i(TAG, "BOOT_COMPLETED: re-armed $restored alarm(s)")
  }

  companion object {
    private const val TAG = "WidgetAlarms"
  }
}
