package cn.yzl.share.android.util

import android.content.Context
import android.content.Context.WIFI_SERVICE
import android.net.ConnectivityManager
import android.net.ConnectivityManager.TYPE_ETHERNET
import android.net.ConnectivityManager.TYPE_WIFI
import android.net.wifi.WifiManager
import cn.yizems.util.ktx.android.context.getGlobalContext
import java.net.Inet4Address
import java.net.NetworkInterface


object Util {
    fun getIpAddress(): String? {
        val manager = getGlobalContext()
            .getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val info = manager.activeNetworkInfo
        if (info != null) {
            if (info.type == TYPE_ETHERNET) {
                return getIpAddressForInterfaces()
            } else if (info.type == TYPE_WIFI) {
                return getLocalIpAddress(getGlobalContext())
            }
        }
        return "0.0.0.0"
    }

    fun getLocalIpAddress(context: Context): String? {
        val wifiManager =
            context.getSystemService(WIFI_SERVICE) as WifiManager
        val wifiInfo = wifiManager.connectionInfo
        val ipAddress = wifiInfo.ipAddress
        return (ipAddress and 0xff).toString() + "." + (ipAddress shr 8 and 0xff) + "." + (ipAddress shr 16 and 0xff) + "." + (ipAddress shr 24 and 0xff)
    }


    fun getIpAddressForInterfaces(): String? {
        val interfaceName = "eth0"
        try {
            val enNetworkInterface = NetworkInterface.getNetworkInterfaces() //获取本机所有的网络接口
            while (enNetworkInterface.hasMoreElements()) {  //判断 Enumeration 对象中是否还有数据
                val networkInterface = enNetworkInterface.nextElement() //获取 Enumeration 对象中的下一个数据
                if (!networkInterface.isUp) { // 判断网口是否在使用
                    continue
                }
                if (interfaceName != networkInterface.displayName) { // 网口名称是否和需要的相同
                    continue
                }
                val enInetAddress =
                    networkInterface.inetAddresses //getInetAddresses 方法返回绑定到该网卡的所有的 IP 地址。
                while (enInetAddress.hasMoreElements()) {
                    val inetAddress = enInetAddress.nextElement()
                    if (inetAddress is Inet4Address) {  //判断是否未ipv4
                        return inetAddress.getHostAddress()
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return "0.0.0.0"
    }
}
