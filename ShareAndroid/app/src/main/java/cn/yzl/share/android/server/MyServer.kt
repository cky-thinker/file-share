package cn.yzl.share.android.server

import android.util.Log
import cn.yizems.util.ktx.android.context.getGlobalContext
import com.yanzhenjie.andserver.AndServer
import com.yanzhenjie.andserver.Server


object MyServer {

    private val server by lazy {
        AndServer.webServer(getGlobalContext())
            .port(8080)
//            .timeout(10, TimeUnit.SECONDS)
            .listener(object : Server.ServerListener {
                override fun onStarted() {
                    // TODO The server started successfully.
                }

                override fun onStopped() {
                    // TODO The server has stopped.
                }

                override fun onException(e: Exception) {
                    // TODO An exception occurred while the server was starting.
                }
            })
            .build()
    }

    /** 启动服务器 */
    fun start() {
        if (server.isRunning) {
            // TODO The server is already up.
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
