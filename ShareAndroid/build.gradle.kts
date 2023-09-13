// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id("com.android.application") version "8.1.1" apply false
    id("org.jetbrains.kotlin.android") version "1.8.10" apply false
}

buildscript {
    dependencies {
        classpath("com.yanzhenjie.andserver:plugin:2.1.12")
    }
}

subprojects {
    repositories {
        MavenConfig.getRepositories()
            .forEach {
                println(it.toString())
                maven {
                    name = it.name
                    url = uri(it.url)
                    credentials {
                        username = it.userName
                        password = it.pwd
                    }
                }
            }
        maven {
            isAllowInsecureProtocol = true
            setUrl("http://maven.aliyun.com/nexus/content/groups/public/")
        }
        google()
        maven { setUrl("https://jitpack.io") }
        mavenCentral()
        jcenter()
    }
}
