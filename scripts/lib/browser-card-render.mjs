import {
  mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

function which(cmd) {
  try {
    return execFileSync('which', [cmd], { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

export function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    which('google-chrome'),
    which('google-chrome-stable'),
    which('chromium'),
    which('chromium-browser')
  ].filter(Boolean);

  const browser = candidates.find(path => existsSync(path));
  if (!browser)
    throw new Error('Chrome/Chromium not found. Set CHROME_PATH if it is installed elsewhere.');
  return browser;
}

export function fontDataUrl(path) {
  return `data:font/ttf;base64,${readFileSync(path).toString('base64')}`;
}

export function readDomAttr(dom, name) {
  const m = String(dom).match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : null;
}

export function browserProbeScript({ family, sample }) {
  const safeFamily = String(family).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const safeSample = String(sample).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `<script>
document.fonts.ready.then(() => {
  try {
    const el = document.querySelector('[data-sk-text]');
    if (!el) throw new Error('missing [data-sk-text] element');
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = Array.from(range.getClientRects())
      .filter(r => r.width > 0 && r.height > 0);
    const box = el.getBoundingClientRect();
    const widths = rects.map(r => box.width > 0 ? r.width / box.width : 0);
    const html = document.documentElement;
    html.setAttribute('data-sk-engine','chromium-block-layout-v1');
    html.setAttribute('data-sk-font-loaded',
      document.fonts.check('64px "${safeFamily}"','${safeSample}') ? '1' : '0');
    html.setAttribute('data-sk-lines', String(rects.length));
    html.setAttribute('data-sk-overflow-x',
      (el.scrollWidth > el.clientWidth + 1 ||
       rects.some(r => r.left < box.left - 1 || r.right > box.right + 1)) ? '1' : '0');
    html.setAttribute('data-sk-overflow-y',
      (el.scrollHeight > el.clientHeight + 1) ? '1' : '0');
    html.setAttribute('data-sk-min-line-ratio',
      String(widths.length ? Math.min(...widths) : 0));
    html.setAttribute('data-sk-max-line-ratio',
      String(widths.length ? Math.max(...widths) : 0));
    html.setAttribute('data-sk-source-length', String(el.textContent.length));
    html.setAttribute('data-sk-ready','1');
  } catch (e) {
    document.documentElement.setAttribute(
      'data-sk-error', encodeURIComponent(String(e.stack || e))
    );
  }
});
</script>`;
}

export function inspectHtml({ html, width, height, browser = findBrowser() }) {
  const dir = mkdtempSync(join(tmpdir(), 'sk-browser-card-'));
  const htmlPath = join(dir, 'card.html');

  try {
    writeFileSync(htmlPath, html);
    const dom = execFileSync(browser, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--allow-file-access-from-files',
      '--force-device-scale-factor=1',
      `--window-size=${width},${height}`,
      '--virtual-time-budget=2500',
      '--dump-dom',
      pathToFileURL(htmlPath).href
    ], {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    if (readDomAttr(dom, 'data-sk-ready') !== '1') {
      const err = readDomAttr(dom, 'data-sk-error');
      throw new Error(
        'browser layout probe did not finish' +
        (err ? `: ${decodeURIComponent(err)}` : '')
      );
    }

    return {
      engine: readDomAttr(dom, 'data-sk-engine'),
      fontLoaded: readDomAttr(dom, 'data-sk-font-loaded') === '1',
      lineCount: Number(readDomAttr(dom, 'data-sk-lines')),
      overflowX: readDomAttr(dom, 'data-sk-overflow-x') === '1',
      overflowY: readDomAttr(dom, 'data-sk-overflow-y') === '1',
      minLineRatio: Number(readDomAttr(dom, 'data-sk-min-line-ratio')),
      maxLineRatio: Number(readDomAttr(dom, 'data-sk-max-line-ratio')),
      sourceLength: Number(readDomAttr(dom, 'data-sk-source-length'))
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function screenshotHtml({
  html, outPath, width, height, browser = findBrowser()
}) {
  const dir = mkdtempSync(join(tmpdir(), 'sk-browser-card-'));
  const htmlPath = join(dir, 'card.html');

  try {
    writeFileSync(htmlPath, html);
    execFileSync(browser, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--allow-file-access-from-files',
      '--force-device-scale-factor=1',
      `--window-size=${width},${height}`,
      '--virtual-time-budget=2500',
      `--screenshot=${outPath}`,
      pathToFileURL(htmlPath).href
    ], { stdio: ['ignore', 'ignore', 'pipe'] });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
