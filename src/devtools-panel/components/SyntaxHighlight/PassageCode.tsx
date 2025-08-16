import { createEffect, createSignal } from 'solid-js';
import { IRawGrammar } from 'vscode-textmate';

import { createHighlighter, createRegistry } from './highlighter';
import harloweLangDef from './language-defs/harlowe-grammar.json';
import sugarcubeLangDef from './language-defs/sugarcube-grammar.json';

interface PassageCodeProps {
  code: string;
  format?: 'SugarCube' | 'Harlowe';
}

export function PassageCode(props: PassageCodeProps) {
  const [html, setHtml] = createSignal('');
  createEffect(() => {
    const code = props.code;
    const format = props.format;
    createHighlighter({
      registry: createRegistry([
        harloweLangDef as unknown as IRawGrammar,
        sugarcubeLangDef as unknown as IRawGrammar,
      ]),
      scope: format === 'SugarCube' ? sugarcubeLangDef.scopeName : harloweLangDef.scopeName,
    }).then((highlighter) => {
      setHtml(highlighter.toHtml(code));
    });
  });

  // eslint-disable-next-line solid/no-innerhtml
  return <code class="whitespace-pre flex-1 overflow-auto passage-code" innerHTML={html()} />;
}
