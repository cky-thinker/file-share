package cn.yzl.share.android.server

import android.util.Log
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import cn.yizems.util.ktx.android.context.getGlobalContext
import com.yanzhenjie.andserver.AndServer
import com.yanzhenjie.andserver.Server

object MyServer {

    var state by mutableStateOf(false)

    private lateinit var server: Server;

    /** 启动服务器 */
    fun start(port: Int) {
        server = AndServer.webServer(getGlobalContext())
            .port(port)
//            .timeout(10, TimeUnit.SECONDS)
            .listener(object : Server.ServerListener {
                override fun onStarted() {
                    state = true
                }

                override fun onStopped() {
                    state = false
                }

                override fun onException(e: Exception) {
                    state = false
                }
            })
            .build()
        if (server.isRunning) {
            Log.w("AndServer", "The server has already started.");
        } else {
            server.startup();
        }
    }

    /** 停止服务器 */
    fun stop() {
        if (server.isRunning) {
            server.shutdown();
        } else {
            Log.w("AndServer", "The server has not started yet.");
        }
    }
}
