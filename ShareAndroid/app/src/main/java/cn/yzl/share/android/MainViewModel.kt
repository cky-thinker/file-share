package cn.yzl.share.android

import cn.yzl.share.android.server.MyController
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.update

object MainViewModel {
    var files = MutableStateFlow(emptyList<FileDto>())

    fun updateFilesList() {
        val realFiles = MyController.downloadDir.listFiles()?.map {
            FileDto(
                name = it.name, type = it.extension, time = it.lastModified()
            )
        } ?: emptyList()
        files.update {
            MyController.textStore.toMutableList().apply {
                addAll(realFiles)
            }
        }
    }
}
