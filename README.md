# Get cookies.txt LOCALLY
Get cookies.txt, NEVER send information outside.

![ss](./ss.png)

This extension exports cookies.txt in Netscape or JSON format.
The Netscape cookies.txt format is compatible with wget, curl, MozillaCookieJar(Python3), and more.

Rest assured that this extension never transmits your information externally.
It features an open-source, unobfuscated source code that is readily available for inspection on GitHub or in the extension's installation directory.

To function correctly, this extension requires certain permissions, all of which are listed in the source code for transparency.
Specifically, it now needs "Download management" to execute a more appropriate file export method, which was previously achieved through "link generation and automatic clicking" in versions before v0.3.x.

- **activeTab**: To get the URL of the current active tab.
- **cookies**: To get and export cookies (not write or send).
- **downloads**: Only used to export local resources (cookies).
- **notifications**: To notify updates.
- **hosts permissions**: To get and export cookies (not write or send).


## Installation
### yt-dlp PowerShell command

点击 **Copy Cmd** 后，在 `yt-dlp.exe` 所在目录的 PowerShell 中粘贴执行：

1. 先运行 `.\yt-dlp.exe -U` 检查并更新 yt-dlp；更新失败时仍会尝试用现有版本继续下载。
2. 将当前网站的 cookies 写入本地文件，再下载当前页面的视频。
3. 勾选“下载中英文字幕”时，附加 `--write-subs --write-auto-subs --sub-langs "zh.*,en.*" --sub-format "srt/best"`。按实际可用的语言代码匹配中英文字幕（包括自动生成、自动翻译），优先 SRT，不提供 SRT 时使用最佳可用格式。未勾选时不附加字幕参数。

例如 `g6J5fcHsWFU` 的字幕列表中，`zh-Hans`、`zh-Hans-zh-Hans`、`zh-Hant-zh-Hans`、`en-zh-Hans` 都会匹配；`ab-zh-Hans`、`ja-zh-Hans` 等其他目标语言不会匹配。多个匹配的字幕轨会分别保存，语言列表并不是优先级或回退列表。

### From WebStore

[link-chrome]: https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc 'Chrome Web Store'
[link-firefox]: https://addons.mozilla.org/firefox/addon/get-cookies-txt-locally/ 'Firefox Addons'

[![Chrome Web Store](https://user-images.githubusercontent.com/24368162/230159073-0c5870ff-ffb8-4712-babc-68cbc801894a.png)][link-chrome]
[![Mozilla Add-on](https://user-images.githubusercontent.com/24368162/230159078-f6a55ce8-1501-4baa-ba16-55bf97c7dc2a.png)][link-firefox]

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/cclelndahbckbenkjhflpdbgdldlbecc.svg)][link-chrome]
[![Chrome Web Store](https://img.shields.io/chrome-web-store/users/cclelndahbckbenkjhflpdbgdldlbecc.svg)][link-chrome] \
[![Mozilla Add-on](https://img.shields.io/amo/v/get-cookies-txt-locally.svg)][link-firefox]
[![Mozilla Add-on](https://img.shields.io/amo/users/get-cookies-txt-locally)][link-firefox]

- Depending on the status of the review, it may not be the latest version or may not be published yet.
- Some features may be limited in the Firefox version.
- You may need to allow access to site resources from the extension manager.

### From source code (Google Chrome)
1. Download and unzip this repository.
2. Open Extensions(chrome://extensions/).
3. Enable "Developer mode".
4. Click on "Load Unpacked" and open the directory `Get-cookies.txt-LOCALLY/src`.

### From source code (Firefox)
For Firefox, you need to patch the manifest file by merging `src/manifest.json` and `src/manifest-firefox.json`. One of the following methods can be taken.
- Use `firefox` branch: the workflow has merged manifest on `master`.
- Use other branches: you need to merge by `npm run build:firefox`, `jq` or manually.


## Example of extension installation directory (Google Chrome)
### Windows
```
%LOCALAPPDATA%\Google\Chrome\User Data\Default\Extensions\cclelndahbckbenkjhflpdbgdldlbecc
```

### Mac
```
~/Library/Application Support/Google/Chrome/Default/Extensions/cclelndahbckbenkjhflpdbgdldlbecc
```

### Linux
```
~/.config/google-chrome/Default/Extensions/cclelndahbckbenkjhflpdbgdldlbecc
```
