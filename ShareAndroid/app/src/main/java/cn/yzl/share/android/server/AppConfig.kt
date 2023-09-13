package cn.yzl.share.android.server

import android.content.Context
import com.yanzhenjie.andserver.annotation.Config
import com.yanzhenjie.andserver.framework.config.WebConfig
import com.yanzhenjie.andserver.framework.website.AssetsWebsite
import com.yanzhenjie.andserver.framework.website.StorageWebsite


@Config
class AppConfig : WebConfig {
    override fun onConfig(context: Context?, delegate: WebConfig.Delegate?) {
        context ?: return
        delegate ?: return
        delegate.addWebsite(AssetsWebsite(context, "/html/", "index.html"))
        delegate.addWebsite(StorageWebsite(MyController.filesDir.absolutePath))
    }
}
