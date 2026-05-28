import { createEffect, createSignal, Show, untrack } from 'solid-js';
import { IRawGrammar } from 'vscode-textmate';

import { btnClass } from '@/devtools-panel/ui/util/btnClass';

import harloweLangDef from './grammars/harlowe-grammar.json';
import sugarcubeLangDef from './grammars/sugarcube-grammar.json';
import { createHighlighter, createRegistry } from './highlighter';

interface PassageCodeProps {
  code: string;
  format?: string;
  editable?: boolean;
  onSave?: (code: string) => void;
}

export function Code(props: PassageCodeProps) {
  const [localCode, setLocalCode] = createSignal(untrack(() => props.code));
  const [html, setHtml] = createSignal('');
  const [highlighter, setHighlighter] = createSignal<Awaited<
    ReturnType<typeof createHighlighter>
  > | null>(null);

  let textareaRef!: HTMLTextAreaElement;
  let preRef!: HTMLPreElement;

  // Sync state if external code prop changes
  createEffect(() => {
    setLocalCode(props.code);
  });

  // Initialize the highlighter only when the format changes
  createEffect(() => {
    const format = props.format;
    createHighlighter({
      registry: createRegistry([
        harloweLangDef as unknown as IRawGrammar,
        sugarcubeLangDef as unknown as IRawGrammar,
      ]),
      scope: format === 'SugarCube' ? sugarcubeLangDef.scopeName : harloweLangDef.scopeName,
    }).then((h) => {
      setHighlighter(() => h);
    });
  });

  // Synchronously update the highlighted HTML whenever code or highlighter changes
  createEffect(() => {
    const h = highlighter();
    const code = localCode();
    if (h) {
      setHtml(h.toHtml(code));
    } else {
      setHtml(escapeHtml(code));
    }
  });

  const handleScroll = () => {
    if (preRef && textareaRef) {
      preRef.scrollTop = textareaRef.scrollTop;
      preRef.scrollLeft = textareaRef.scrollLeft;
    }
  };

  const handleInput = (e: InputEvent & { currentTarget: HTMLTextAreaElement }) => {
    setLocalCode(e.currentTarget.value);
  };

  const handleKeyDown = (e: KeyboardEvent & { currentTarget: HTMLTextAreaElement }) => {
    if (!props.editable) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const val = el.value;

      const tabString = '  '; // 2 spaces
      const newVal = val.substring(0, start) + tabString + val.substring(end);
      setLocalCode(newVal);

      queueMicrotask(() => {
        el.selectionStart = el.selectionEnd = start + tabString.length;
      });
    }
  };

  // Identical structural classes used on both elements to guarantee pixel-perfect overlays
  const sharedClasses =
    'm-0 border-0 text-sm leading-relaxed whitespace-pre break-normal box-border [tab-size:4] font-mono';

  return (
    <div class="flex h-full w-full flex-col">
      {/* Editor Space */}
      <div class="relative w-full flex-1 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={localCode()}
          onInput={handleInput}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          class={`absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent text-transparent outline-none ${sharedClasses} ${
            props.editable ? 'caret-white' : 'caret-transparent'
          }`}
          readOnly={!props.editable}
          spellcheck={false}
          autocapitalize="off"
          autocomplete="off"
          autocorrect="off"
          style={{ padding: '12px 14px' }}
        />
        <pre
          ref={preRef}
          class={`pointer-events-none absolute inset-0 h-full w-full overflow-hidden ${sharedClasses}`}
        >
          {/* oxlint-disable-next-line solid/no-innerhtml */}
          <code class="passage-code block whitespace-pre" innerHTML={html()} />
        </pre>
      </div>

      {/* Control Bar */}
      <Show when={props.editable}>
        <div class="flex justify-end border-t border-gray-700 bg-gray-900/50 p-2">
          <button class={btnClass('contained')} onClick={() => props.onSave?.(localCode())}>
            Save
          </button>
        </div>
      </Show>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]!,
  );
}

// TODO: The changes in this file were vibe-coded, I need to sanity check if we need this / if I want this / what things I want to change
