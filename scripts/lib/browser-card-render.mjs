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

function attr(dom, name) {
  const m = dom.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : null;
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

    if (attr(dom, 'data-sk-ready') !== '1') {
      const err = attr(dom, 'data-sk-error');
      throw new Error(
        'browser layout probe did not finish' +
        (err ? `: ${decodeURIComponent(err)}` : '')
      );
    }

    return {
      engine: attr(dom, 'data-sk-engine'),
      fontLoaded: attr(dom, 'data-sk-font-loaded') === '1',
      lineCount: Number(attr(dom, 'data-sk-lines')),
      overflowX: attr(dom, 'data-sk-overflow-x') === '1',
      overflowY: attr(dom, 'data-sk-overflow-y') === '1',
      minLineRatio: Number(attr(dom, 'data-sk-min-line-ratio')),
      maxLineRatio: Number(attr(dom, 'data-sk-max-line-ratio')),
      sourceLength: Number(attr(dom, 'data-sk-source-length'))
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
