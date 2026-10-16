import { formatMap, jsonToNetscapeMapper } from './modules/cookie_format.mjs';
import getAllCookies from './modules/get_all_cookies.mjs';

/** Promise to get URL of Active Tab */
const getUrlPromise = chrome.tabs
  .query({ active: true, currentWindow: true })
  .then(([{ url }]) => new URL(url));

// ----------------------------------------------
// Functions
// ----------------------------------------------

/**
 * Get Stringified Cookies Text and Format Data
 * @param {chrome.cookies.GetAllDetails} details
 * @returns {Promise<{ text: string, format: Format }>}
 */
const getCookieText = async (details) => {
  const cookies = await getAllCookies(details);
  const format = formatMap["netscape"];
  const text = format.serializer(cookies);
  return { text, format };
};

/**
 * Copy text data to the clipboard
 * @param {string} text
 */
const setClipboard = async (text) => {
  await navigator.clipboard.writeText(text);
  document.getElementById('copy').innerText = 'Copied!';
};

// ----------------------------------------------
// Actions after resolving the promise
// ----------------------------------------------

const downloadSubCheckbox = document.querySelector('#download-sub');

// Load state
chrome.storage.local.get(['downloadSub'], (result) => {
  downloadSubCheckbox.checked = result.downloadSub || false;
});

// Save state
downloadSubCheckbox.addEventListener('change', () => {
  chrome.storage.local.set({ downloadSub: downloadSubCheckbox.checked });
});

/** Set Cookies data to the table */
getUrlPromise
  .then((url) =>
    getAllCookies({
      url: url.href,
      partitionKey: { topLevelSite: url.origin },
    }),
  )
  .then((cookies) => {
    const netscape = jsonToNetscapeMapper(cookies);
    const tableRows = netscape.map((row) => {
      const tr = document.createElement('tr');
      tr.replaceChildren(
        ...row.map((v) => {
          const td = document.createElement('td');
          td.textContent = v;
          return td;
        }),
      );
      return tr;
    });
    document.querySelector('table tbody').replaceChildren(...tableRows);
  });

// ----------------------------------------------
// Event Listeners
// ----------------------------------------------


document.querySelector('#copy').addEventListener('click', async () => {
  const url = await getUrlPromise;
  const details = { url: url.href, partitionKey: { topLevelSite: url.origin } };
  const { text, format } = await getCookieText(details);

  const filename = `${url.hostname}_cookies${format.ext}`;

  const base64Text = btoa(unescape(encodeURIComponent(text)));
  // 匹配实际字幕代码，包括 zh-Hans、zh-Hant-zh-Hans 和 en-zh-Hans。
  const subParams = downloadSubCheckbox.checked
    ? ' --write-subs --write-auto-subs --sub-langs "zh.*,en.*" --sub-format "srt/best"'
    : '';
  // 粘贴执行时先更新 yt-dlp，再导出 cookies 并下载。
  const command = `.\\yt-dlp.exe -U; $content = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${base64Text}')); [System.IO.File]::WriteAllText("$PWD\\${filename}", $content, (New-Object System.Text.UTF8Encoding $false)); .\\yt-dlp.exe --cookies ".\\${filename}" "${url}"${subParams}`;

  await setClipboard(command);
});

