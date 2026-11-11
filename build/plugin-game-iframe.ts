import { createReadStream, existsSync, readFileSync, statSync } from 'fs';
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from 'path';

import { type Plugin, normalizePath } from 'vite-plus';

interface GameIframeOptions {
  gameRoot: string;
  entry: string;
  width: number;
  height: number;
  mute: boolean;
}

const remoteExecutePath = normalizePath(
  resolve(import.meta.dirname, '../src/devtools-panel/api/remote-execute'),
);
const iframeRemoteExecutePath = normalizePath(
  resolve(import.meta.dirname, '../src/devtools-panel/api-iframe/remote-execute.ts'),
);

// Requests that belong to the panel's own dev server; any other request may be the game's (games use absolute urls)
const panelPaths = ['/src/', '/@', '/node_modules/', '/__'];
const isPanelPath = (path: string) =>
  path === '/' || path === '/index.html' || panelPaths.some((prefix) => path.startsWith(prefix));

// For `mute=on`: media elements are forced muted, also the ones that autoplay, and audio contexts stay suspended
const muteAudioScript = `<script>(() => {
  const muted = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'muted');
  Object.defineProperty(HTMLMediaElement.prototype, 'muted', { ...muted, set() { muted.set.call(this, true); } });
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { muted.set.call(this, true); return play.apply(this, arguments); };
  addEventListener('play', (event) => { if (event.target instanceof HTMLMediaElement) muted.set.call(event.target, true); }, true);
  for (const name of ['AudioContext', 'webkitAudioContext']) {
    const Native = window[name];
    if (Native) window[name] = class extends Native {
      constructor(...args) { super(...args); this.suspend(); }
      resume() { return Promise.resolve(); }
    };
  }
})()</script>`;

/**
 * `vp run iframe <path> [width=480] [height=300]` (the `iframe` script is `vp dev . --`). The arguments after `--`
 * are not Vite's, so Vite ignores them and they can be read here. The `.` is needed: without something before
 * `--`, Vite's CLI takes the arguments after it as its own (the first as the root). The path may also be
 * written `iframe=<path>`.
 */
function getGameIframeOptions(argv = process.argv): GameIframeOptions | undefined {
  const dashIndex = argv.indexOf('--');
  if (dashIndex === -1) return undefined;

  const args = new Map<string, string>();
  const tokens = argv.slice(dashIndex + 1).filter((token) => token !== '--');
  for (let i = 0; i < tokens.length; i++) {
    const [, key, value] = /^(?:--)?([\w-]+)(?:=(.*))?$/s.exec(tokens[i]!) ?? [];
    if (key) args.set(key, value ?? tokens[++i] ?? '');
    else if (!args.has('iframe')) args.set('iframe', tokens[i]!);
  }

  const iframe = args.get('iframe');
  if (iframe === undefined) return undefined;
  if (/^https?:\/\//i.test(iframe)) {
    throw new Error(
      'iframe: urls are not supported yet, give the path of the game folder or its html file',
    );
  }
  if (!isAbsolute(iframe) || !existsSync(iframe)) {
    throw new Error(
      `iframe: expected the absolute path of an existing folder or file, got "${iframe}"`,
    );
  }

  const isFolder = statSync(iframe).isDirectory();
  const gameRoot = isFolder ? iframe : dirname(iframe);
  const entry = isFolder ? 'index.html' : basename(iframe);
  if (!existsSync(join(gameRoot, entry)))
    throw new Error(`iframe: ${join(gameRoot, entry)} does not exist`);

  const mute = args.get('mute') ?? 'off';
  if (mute !== 'on' && mute !== 'off') throw new Error(`mute: expected on or off, got "${mute}"`);

  return {
    gameRoot,
    entry,
    width: Number(args.get('width') ?? 480),
    height: Number(args.get('height') ?? 300),
    mute: mute === 'on',
  };
}

/**
 * Serves a built game in an iframe next to the panel, and lets the panel evaluate code in it instead of in
 * the inspected tab. Null when the command line has no `iframe` argument.
 */
export function gameIframePlugin(): Plugin | null {
  const options = getGameIframeOptions();
  if (!options) return null;
  const { gameRoot, entry, width, height, mute } = options;

  return {
    name: 'vite-plugin-game-iframe',
    apply: 'serve',
    enforce: 'pre',

    config: () => ({
      // The content script has dependencies the panel does not, found late otherwise (which reloads the panel)
      optimizeDeps: { entries: ['index.html', 'src/content-script/content-script.ts'] },
    }),

    async resolveId(source, importer, options) {
      if (!source.endsWith('remote-execute')) return null;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      return resolved?.id.startsWith(remoteExecutePath) ? iframeRemoteExecutePath : null;
    },

    // Both go ahead of the panel's own root and script, so the game frame exists before the panel starts
    transformIndexHtml: () => [
      {
        tag: 'div',
        attrs: { id: 'iframe-root', hidden: true },
        children: JSON.stringify({ url: '/game/', width, height }),
        injectTo: 'body-prepend',
      },
      {
        tag: 'script',
        attrs: { type: 'module', src: '/src/devtools-panel/api-iframe/mount-game-frame.tsx' },
        injectTo: 'body-prepend',
      },
    ],

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();

        let path: string;
        try {
          path = decodeURIComponent((req.url ?? '').split('?')[0]!);
        } catch {
          return next();
        }
        if (isPanelPath(path)) return next();

        const gamePath = path.startsWith('/game/')
          ? path.slice('/game/'.length) || entry
          : path.slice(1);
        const file = resolve(gameRoot, gamePath);
        const relativePath = relative(gameRoot, file);
        if (relativePath.startsWith('..') || isAbsolute(relativePath)) return next();
        if (!existsSync(file) || !statSync(file).isFile()) return next();

        const extension = extname(file).toLowerCase();
        res.setHeader('Content-Type', getMimeType(extension));
        if (extension === '.html' && mute) {
          // latin1 keeps every byte of the page as it is, whatever its encoding
          const html = readFileSync(file, 'latin1');
          const head = /<head[^>]*>/i.exec(html);
          const index = head ? head.index + head[0].length : 0;
          const body = Buffer.from(
            html.slice(0, index) + muteAudioScript + html.slice(index),
            'latin1',
          );
          res.setHeader('Content-Length', body.length);
          return res.end(req.method === 'HEAD' ? undefined : body);
        }

        res.setHeader('Content-Length', statSync(file).size);
        if (req.method === 'HEAD') return res.end();
        createReadStream(file).pipe(res);
      });
    },
  };
}

function getMimeType(extension: string) {
  return (
    {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.mjs': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.txt': 'text/plain',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
    }[extension] ?? 'application/octet-stream'
  );
}
