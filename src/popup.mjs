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
  // 直接使用相对路径字符串拼接成绝对路径
  const command = `$content = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${base64Text}')); [System.IO.File]::WriteAllText("$PWD\\${filename}", $content, (New-Object System.Text.UTF8Encoding $false)); .\\yt-dlp.exe --cookies ".\\${filename}" "${url}"`;

  await setClipboard(command);
});

