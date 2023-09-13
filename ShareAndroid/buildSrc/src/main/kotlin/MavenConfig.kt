import java.io.File
import java.util.*

class MavenConfig(
    val name: String,
    val url: String,
    val urlSnapshot: String? = null,
    val userName: String? = null,
    val pwd: String? = null
) {
    companion object {
        private val repositories = mutableListOf<MavenConfig>()

        fun getRepositories() = repositories.toList()

        private fun addRepository(name: String, propertiesFilePath: String) {
            val properties = Properties()
                .apply {
                    try {
                        File(propertiesFilePath).inputStream().use {
                            load(it)
                        }
                    } catch (e: Exception) {
                        println("$name::$propertiesFilePath 文件不存在 ,跳过配置")
                        return
                    }
                }
            repositories.add(
                MavenConfig(
                    name,
                    properties["MAVEN_PATH"].toString(),
                    properties["MAVEN_PATH_SNAPSHOT"]?.toString(),
                    properties["MAVEN_USER"]?.toString(),
                    properties["MAVEN_PWD"]?.toString()
                )
            )
        }

        private fun addRepository(
            name: String,
            mavenPath: String,
            mavenPathSnapshot: String? = null,
            mavenUser: String? = null,
            mavenPwd: String? = null
        ) {
            repositories.add(
                MavenConfig(
                    name,
                    mavenPath,
                    mavenPathSnapshot ?: mavenPath,
                    mavenUser,
                    mavenPwd
                )
            )
        }

        private fun addEnvRepo(
            name: String = "DEFAULT_MAVEN",
            mavenPathKey: String = "MAVEN_PATH",
            mavenPathSnapshotKey: String? = "MAVEN_PATH_SNAPSHOT",
            mavenUserKey: String? = "MAVEN_USER",
            mavenPwdKey: String? = "MAVEN_PWD"
        ) {
            val mavenPath = System.getenv(mavenPathKey) ?: return
            MavenConfig(
                name,
                mavenPath,
                System.getenv(mavenPathSnapshotKey) ?: mavenPath,
                System.getenv(mavenUserKey),
                System.getenv(mavenPwdKey)
            )
        }


        init {
//            addEnvRepo()
            addRepository("AliDev1", System.getProperty("user.home") + "/.m2/alidev.properties")
        }
    }

    override fun toString(): String {
        return "MavenConfig(name='$name', url='$url', urlSnapshot=$urlSnapshot, userName=$userName, pwd=$pwd)"
    }
}
