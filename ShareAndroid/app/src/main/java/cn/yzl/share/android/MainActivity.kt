package cn.yzl.share.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import cn.yizems.moshi.ex.android.addAndroidJsonSupport
import cn.yizems.moshi.ex.jobj.addMJsonAdapter
import cn.yizems.moshi.ex.moshiInstances
import cn.yizems.moshi.ex.setToDefault
import cn.yzl.share.android.server.MyServer
import cn.yzl.share.android.ui.theme.ShareAndroidTheme
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ShareAndroidTheme {
                // A surface container using the 'background' color from the theme
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    Greeting("Android")
                }
            }
        }
        moshiInstances
            .newBuilder()
            .add(KotlinJsonAdapterFactory())
            .addMJsonAdapter()
            .addAndroidJsonSupport()
            .build().setToDefault()
        MyServer.start()
    }
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    Text(
        text = "Hello $name!",
        modifier = modifier
    )
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    ShareAndroidTheme {
        Greeting("Android")
    }
}
