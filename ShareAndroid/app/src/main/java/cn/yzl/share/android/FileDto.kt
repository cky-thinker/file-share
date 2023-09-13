package cn.yzl.share.android

class FileDto(
    var name: String? = null,
    var type: String? = null,
    var content: String? = null,
    val time: Long = System.currentTimeMillis(),
)
