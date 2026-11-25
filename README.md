# 词叶 Wordleaf

一款本地优先的英语背词应用，提供四级、六级、考研、专四、专八、新东方六级乱序版和 2026 考研红宝书。浏览书架选择词书，单击词卡查看释义，再点进入下一词，双击加入模糊单词。

## 下载

从 [GitHub Releases](https://github.com/hecongnan/wordleaf/releases/latest) 下载。Android 8.0 及以上设备使用 APK，建议使用已更新的 Android System WebView。桌面端下载独立 HTML 文件，使用现代浏览器直接打开。

## 学习数据

词书、页面与图形随应用打包。进度、每日目标、收藏和模糊单词使用本地 Web Storage。Android 版使用应用私有 WebView 存储，未声明联网权限，并关闭系统云备份。桌面端使用打开页面的浏览器存储。同一浏览器使用同一路径打开桌面文件以续背。两端独立记录；清除应用或浏览器数据、卸载应用，均可能丢失记录。

## 本地构建

桌面单文件需要 Python 3，执行 `python3 scripts/build-desktop.py` 后打开 `build/Wordleaf-Desktop.html`。开发时可运行 `python3 -m http.server 8000 --directory web`。

Android 构建需要 Linux、JDK 17 或 21、Python 3、Android SDK Platform 35 和 Build Tools 35.0.0。设置 `ANDROID_HOME` 后运行 `bash scripts/build-apk.sh`，生成 `build/wordleaf-unsigned.apk`。使用 Android SDK 的 `apksigner sign` 与自己的密钥签名后即可安装测试。更新已安装的版本须使用相同应用 ID 和签名证书。

## 词表来源

- 通用考试词库及 2026 考研红宝书：[Qwerty Learner](https://github.com/RealKai42/qwerty-learner/tree/master/public/dicts)
- 双语例句：[English Vocabulary](https://github.com/KyleBing/english-vocabulary)，许可见 [examples-LICENSE.txt](web/examples-LICENSE.txt)
- 新东方六级乱序版：[30 课时公开词表](https://lzctuhao-iqjxs8f9-lzctuhao.4everland.app/2021/0704/folder-ganhuo/xdflevel6/)
