import { fromCache, toCache } from './cache';

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const cssBaseUrl = 'https://fonts.googleapis.com/css2';
const family = 'Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,-25';

async function load(
  url: string,
  parser: (response: Response) => string | Promise<string>,
): Promise<string> {
  const cached = await fromCache(url);
  if (cached) return cached;

  const result = await fetch(url, { headers: { 'User-Agent': BROWSER_USER_AGENT } }).then((res) =>
    parser(res),
  );
  await toCache(url, result);
  return result;
}

export async function getFontHtml(names: string[]) {
  const iconNames = names.toSorted().join(',');
  const cssUrl = `${cssBaseUrl}?family=${family}&icon_names=${iconNames}`;

  const css = `@layer components { ${await load(cssUrl, (res) => res.text())} }`;
  const matches = [...new Set(css.match(/url\([^)]+\)/g) || [])];
  const updatedCss = await matches.reduce(async (prevPromise, fontUrlCss): Promise<string> => {
    const fontUrl = fontUrlCss.slice(4, -1);
    const prev = await prevPromise;
    const font = await load(fontUrl, async (res) => {
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return `data:font/woff2;base64,${base64}`;
    });
    return prev.split(fontUrlCss).join(`url('${font}')`);
  }, Promise.resolve(css));

  return `<style type="text/css">${updatedCss.replace(/(\r|\n|\s){2,}/g, ' ')}</style>`;
}
