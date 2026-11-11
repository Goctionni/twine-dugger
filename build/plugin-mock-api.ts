import { existsSync } from 'fs';
import { isAbsolute, relative, resolve } from 'path';

import { type Plugin, type Rollup, normalizePath } from 'vite-plus';

const devtoolsPanelPath = resolve(import.meta.dirname, '../src/devtools-panel');
const apiPath = resolve(devtoolsPanelPath, './api');
const apiMockPath = resolve(devtoolsPanelPath, './api-mock');

function isInsidePath(path: string, containerPath: string) {
  if (!isAbsolute(path)) return false;
  const relPath = relative(containerPath, path);
  return !relPath.includes('..');
}

function getMockPath(path: string) {
  const apiRelative = relative(apiPath, path);
  return normalizePath(resolve(apiMockPath, apiRelative));
}

// The mocks stand in for the extension's transport: when another plugin provides one, the real api works
async function isTransportReplaced(context: Rollup.PluginContext) {
  const transport = await context.resolve(resolve(apiPath, 'remote-execute'), undefined, {
    skipSelf: true,
  });
  return transport && !isInsidePath(transport.id, apiPath);
}

export const mockApiPlugin = (): Plugin => {
  return {
    name: 'vite-plugin-mock-api',
    apply: 'serve',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (importer && isInsidePath(importer, apiMockPath)) return null;

      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (!resolved) return null;

      const [filepath = '', ...rest] = resolved.id.split('?');
      if (!isInsidePath(filepath, apiPath)) return null;

      const mockPath = getMockPath(filepath);
      const mockExists = existsSync(mockPath);

      if (!mockExists) return null;

      if (await isTransportReplaced(this)) return null;

      return { id: [mockPath, ...rest].join('?') };
    },
  };
};
