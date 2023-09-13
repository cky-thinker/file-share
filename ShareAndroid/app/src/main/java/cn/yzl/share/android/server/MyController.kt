package cn.yzl.share.android.server

import cn.yizems.moshi.ex.jobj.JsonObject
import cn.yizems.moshi.ex.jobj.toMJsonObject
import cn.yizems.moshi.ex.toJsonString
import cn.yizems.util.ktx.android.context.getGlobalContext
import cn.yizems.util.ktx.comm.file.child
import cn.yzl.share.android.FileDto
import com.yanzhenjie.andserver.annotation.GetMapping
import com.yanzhenjie.andserver.annotation.PostMapping
import com.yanzhenjie.andserver.annotation.RequestParam
import com.yanzhenjie.andserver.annotation.RestController
import com.yanzhenjie.andserver.http.RequestBody
import com.yanzhenjie.andserver.http.multipart.MultipartFile
import java.util.concurrent.CopyOnWriteArrayList

@RestController
class MyController {
    companion object {
        val downloadDir by lazy {
            getGlobalContext().filesDir.child("download-internal").apply {
                if (!exists()) {
                    mkdirs()
                }
            }
        }

        val filesDir by lazy {
            getGlobalContext().filesDir
        }

        private val textStore by lazy {
            CopyOnWriteArrayList<FileDto>()
        }
    }

    @GetMapping("/health")
    fun health(): String {
        return "hello world"
    }

    @GetMapping("/api/files")
    fun files(@RequestParam(name = "path", required = false) path: String? = null): String {
        val paths = if (path.isNullOrBlank()) {
            emptyList<String>()
        } else {
            path.split("/")
        }
        val targetDir = if (path.isNullOrBlank()) {
            downloadDir
        } else {
            downloadDir.child(path)
        }

        if (!targetDir.isDirectory || !targetDir.exists()) {
            return emptyMap<String, String>().toJsonString()
        }
        val files = downloadDir.listFiles()
            ?.map {
                FileDto(
                    it.name,
                    if (it.isDirectory) "directory" else "file",
                    time = it.lastModified(),
                )
            }?.toMutableList() ?: mutableListOf()
        if (targetDir == downloadDir) {
            files.addAll(textStore)
        }
        files.sortByDescending {
            it.time
        }
        return mapOf(
            "data" to mapOf(
                "files" to files,
                "path" to paths,
            ),
        ).toJsonString()
    }

    @PostMapping("/api/addText")
    fun addText(body: RequestBody? = null): String {
        if (body == null) {
            return JsonObject().toJsonString()
        }
        val str = body.string()

        val text = str.toMJsonObject()?.getString("message")

        if (text.isNullOrBlank()) {
            return JsonObject().toJsonString()
        }
        textStore.add(0, FileDto(text.take(20), "text", text))
        return JsonObject().toJsonString()
    }

    @PostMapping("/api/addFile")
    fun addFile(@RequestParam("file") file: MultipartFile): String {
        val name = file.filename ?: "file"
        val targetFile = downloadDir.child(name)
        file.stream.use { input ->
            targetFile.outputStream().use { output ->
                input.copyTo(output)
            }
        }
        return JsonObject().toJsonString()
    }

}
