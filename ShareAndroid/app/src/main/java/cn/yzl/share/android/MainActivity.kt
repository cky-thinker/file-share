package cn.yzl.share.android

import android.content.ClipboardManager
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CornerSize
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import cn.yizems.moshi.ex.android.addAndroidJsonSupport
import cn.yizems.moshi.ex.jobj.addMJsonAdapter
import cn.yizems.moshi.ex.moshiInstances
import cn.yizems.moshi.ex.setToDefault
import cn.yizems.util.ktx.comm.file.child
import cn.yzl.share.android.server.MyController
import cn.yzl.share.android.server.MyServer
import cn.yzl.share.android.ui.theme.ShareAndroidTheme
import cn.yzl.share.android.util.Util
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory


class MainActivity : ComponentActivity() {

    private val sharedPreferences by lazy {
        getSharedPreferences("share", MODE_PRIVATE)
    }

    private var port by mutableStateOf("8080")

    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        port = sharedPreferences.getString("port", "8080") ?: "8080"
        MainViewModel.updateFilesList()
        setContent {
            ShareAndroidTheme {
                // A surface container using the 'background' color from the theme
                Surface(
                    modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background
                ) {
                    Column(
                        modifier = Modifier.padding(10.dp)
                    ) {
                        Text(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(10.dp),
                            text = "Share File For Android",
                            textAlign = TextAlign.Center,
                            fontSize = MaterialTheme.typography.titleLarge.fontSize
                        )
                        Row {
                            TextField(
                                value = port,
                                onValueChange = {
                                    port = it
                                    sharedPreferences.edit().putString("port", it).apply()
                                },
                                label = { Text("端口") },
                                modifier = Modifier.weight(1f),
                                shape = MaterialTheme.shapes.medium.copy(CornerSize(15)),
                                keyboardOptions = KeyboardOptions.Default.copy(
                                    keyboardType = KeyboardType.Number
                                ),
                            )
                            Button(onClick = {
                                if (MyServer.state) {
                                    MyServer.stop()
                                } else {
                                    MyServer.start(port.toInt())
                                }
                            }) {
                                Text(
                                    text = if (MyServer.state) "停止" else "启动",
                                )
                            }
                            Button(onClick = {
                                // 启动默认浏览器打开网页
                                Intent().apply {
                                    action = Intent.ACTION_VIEW
                                    data = android.net.Uri.parse("http://127.0.0.1:$port")
                                    startActivity(this)
                                }
                            }) {
                                Text(
                                    text = "打开网页",
                                )
                            }
                        }
                        Divider(thickness = 10.dp, color = Color.Transparent)
                        val ip = remember {
                            Util.getIpAddress() ?: "获取ip失败"
                        }
                        Text(
                            modifier = Modifier.clickable {
                                // 复制
                                val clipboard =
                                    getSystemService(CLIPBOARD_SERVICE) as ClipboardManager;
                                clipboard.setPrimaryClip(
                                    android.content.ClipData.newPlainText(
                                        "text",
                                        ip
                                    )
                                )
                                Toast.makeText(this@MainActivity, "复制成功", Toast.LENGTH_SHORT)
                                    .show()
                            },
                            text = "$ip:$port",
                            fontSize = MaterialTheme.typography.titleMedium.fontSize
                        )
                        Text(
                            text = "文件列表",
                            fontSize = MaterialTheme.typography.titleMedium.fontSize
                        )
                        FileList()
                    }
                }
            }
        }
        moshiInstances.newBuilder().add(KotlinJsonAdapterFactory()).addMJsonAdapter()
            .addAndroidJsonSupport().build().setToDefault()
    }

    @Composable
    private fun FileList() {
        val data = MainViewModel.files.collectAsState()
        data.value.forEach {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 10.dp),
                horizontalArrangement = Arrangement.Center,
            ) {
                Text(
                    text = it.name ?: "", modifier = Modifier.weight(1f),
                )
                Text(
                    text = it.type ?: "", modifier = Modifier.padding(10.dp)
                )
                if (it.type == "text") {
                    Button(onClick = {
                        // 复制
                        val clipboard =
                            getSystemService(CLIPBOARD_SERVICE) as ClipboardManager;
                        clipboard.setPrimaryClip(
                            android.content.ClipData.newPlainText(
                                "text",
                                it.content
                            )
                        )
                        Toast.makeText(this@MainActivity, "复制成功", Toast.LENGTH_SHORT).show()
                    }) {
                        Text(text = "复制")
                    }
                }
                Button(onClick = {
                    // 删除
                    if (it.type == "text") {
                        MyController.textStore.remove(it)
                    } else {
                        MyController.downloadDir.child(it.name!!).delete()
                    }
                    MainViewModel.updateFilesList()
                }) {
                    Text(text = "删除")
                }
            }
            Divider(thickness = 10.dp, color = Color.Transparent)
        }
    }
}
