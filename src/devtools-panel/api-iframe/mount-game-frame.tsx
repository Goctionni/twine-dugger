import { render } from '@solidjs/web';

import { GameFrame } from './GameFrame';

// build/plugin-game-iframe.ts puts the settings in the element as JSON, ahead of the panel's own root
const root = document.getElementById('iframe-root')!;
const { url, width, height } = JSON.parse(root.textContent!) as {
  url: string;
  width: number;
  height: number;
};

root.textContent = '';
root.hidden = false;
render(() => <GameFrame url={url} width={width} height={height} />, root);
