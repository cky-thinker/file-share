package cn.yzl.share.android.server

import android.os.Build
import io.ktor.http.ContentType
import io.ktor.server.application.call
import io.ktor.server.application.install
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.server.plugins.callloging.CallLogging
import io.ktor.server.plugins.cors.routing.CORS
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.routing

object MyServer {
    private val server by lazy {
        embeddedServer(Netty, 6666) {
            this.install(CallLogging)
            // 跨域访问
            this.install(CORS) {
                this.anyHost()
            }

            routing {
                this.get("/") {
                    this.call.respondText(
                        "手机型号 ${Build.MODEL} 运行正常",
                        ContentType.Text.Plain
                    )
                }
            }
        }
    }
}
