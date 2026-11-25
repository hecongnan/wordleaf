# 词叶 Wordleaf

一款本地优先的英语背词应用，提供四级、六级、考研、专四、专八、新东方六级乱序版和 2026 考研红宝书。浏览书架选择词书，单击词卡查看释义，再点进入下一词，双击加入模糊单词。

## 下载

从 [GitHub Releases](https://github.com/hecongnan/wordleaf/releases/latest) 下载。Android 8.0 及以上设备使用 APK，建议使用已更新的 Android System WebView。桌面端下载独立 HTML 文件，使用现代浏览器直接打开。

Android v1.1.0 起，在「学习空间」右上角点「检查更新」即可下载更新。按系统提示允许词叶安装新版，再点「更新」。使用旧版时，先在同一设备、同一用户下覆盖安装一次 v1.1.0，无需卸载。

## 学习数据

词书、页面与图形随应用打包。进度、每日目标、收藏和模糊单词使用本地 Web Storage。Android 版保留原有 WebView 存储并自动将现有记录复制到应用私有存储。两份记录按保存版本恢复。系统云备份已关闭。应用主动检查或下载更新时访问 GitHub，学习数据仅在本机保存。桌面端使用打开页面的浏览器存储。同一浏览器使用同一路径打开桌面文件以续背。两端独立记录；清除应用或浏览器数据、卸载应用，均可能丢失记录。

## 本地构建

桌面单文件需要 Python 3，执行 `python3 scripts/build-desktop.py` 后打开 `build/Wordleaf-Desktop.html`。开发时可运行 `python3 -m http.server 8000 --directory web`。

Android 构建需要 Linux、JDK 17 或 21、Python 3、Android SDK Platform 35 和 Build Tools 35.0.0。设置 `ANDROID_HOME` 后运行 `bash scripts/build-apk.sh`，生成 `build/wordleaf-unsigned.apk`。使用 Android SDK 的 `apksigner sign` 与自己的密钥签名后即可安装测试。更新已安装的版本须使用相同应用 ID 和签名证书。

## 词表来源

- 通用考试词库及 2026 考研红宝书：[Qwerty Learner](https://github.com/RealKai42/qwerty-learner/tree/master/public/dicts)
- 双语例句：[English Vocabulary](https://github.com/KyleBing/english-vocabulary)，许可见 [examples-LICENSE.txt](web/examples-LICENSE.txt)
- 新东方六级乱序版：[30 课时公开词表](https://lzctuhao-iqjxs8f9-lzctuhao.4everland.app/2021/0704/folder-ganhuo/xdflevel6/)

## 学习记录备份与升级验证

首页底部的「学习记录备份」支持导出 JSON、选择文件预览、确认导入和恢复到上次导入前。请将文件保存至应用目录外。备份包含学习记录、每日目标和词书标识；词库随应用提供。导入会替换当前设备的学习记录。网页和 Android 使用相同的文件格式。

仓库的 Android upgrade regression 工作流在一次性模拟器中安装历史 v1.1.0，在实际 WebView 内背完一词、标记模糊词并收藏，再用 `adb install -r` 覆盖安装当前源码构建的 APK。断言检查下一张词卡，并比对升级前后的学习记录摘要。CI 用同一临时密钥签署两份安装包，正式签名密钥仅在本地保存。该测试验证覆盖安装及其数据迁移，系统安装权限、取消和下载中断属于单独的更新器场景。
