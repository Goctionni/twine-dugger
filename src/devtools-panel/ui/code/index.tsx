import clsx from 'clsx';
import { createEffect, createSignal, onCleanup, untrack } from 'solid-js';
import { IRawGrammar } from 'vscode-textmate';

import { btnClass } from '@/devtools-panel/ui/util/btnClass';

import { Toggle } from '../util/Toggle';
import harloweLangDef from './grammars/harlowe-grammar.json';
import sugarcubeLangDef from './grammars/sugarcube-grammar.json';
import { createHighlighter, createRegistry, escapeHtml } from './highlighter';

type TEvent<TE extends Event, TEl extends HTMLElement> = TE & { currentTarget: TEl };

interface PassageCodeProps {
  code: string;
  format?: string;
  onSave?: (code: string) => void;
}

export function Code(props: PassageCodeProps) {
  const [autoSave, setAutoSave] = createSignal(false);
  const [localCode, setLocalCode] = createSignal(untrack(() => props.code));
  const [html, setHtml] = createSignal('');
  const [highlighter, setHighlighter] = createSignal<Awaited<
    ReturnType<typeof createHighlighter>
  > | null>(null);

  let textareaRef!: HTMLTextAreaElement;
  let preRef!: HTMLPreElement;

  // Sync state if external code prop changes
  createEffect(() => setLocalCode(props.code));

  // Initialize the highlighter
  createEffect(() => {
    const format = props.format;
    createHighlighter({
      registry: createRegistry([
        harloweLangDef as unknown as IRawGrammar,
        sugarcubeLangDef as unknown as IRawGrammar,
      ]),
      scope: format === 'SugarCube' ? sugarcubeLangDef.scopeName : harloweLangDef.scopeName,
    }).then(setHighlighter);
  });

  // Update the highlighted HTML when code changes
  createEffect(() => {
    const h = highlighter();
    const format = h?.toHtml ?? escapeHtml;
    setHtml(format(localCode()));
  });

  const handleScroll = () => {
    if (preRef && textareaRef) {
      preRef.scrollTop = textareaRef.scrollTop;
      preRef.scrollLeft = textareaRef.scrollLeft;
    }
  };

  const handleInput = (e: TEvent<InputEvent, HTMLTextAreaElement>) =>
    setLocalCode(e.currentTarget.value);

  const handleKeyDown = (e: TEvent<KeyboardEvent, HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const val = el.value;

      const tabString = '  ';
      const newVal = val.substring(0, start) + tabString + val.substring(end);
      setLocalCode(newVal);

      queueMicrotask(() => {
        el.selectionStart = el.selectionEnd = start + tabString.length;
      });
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && props.onSave) {
      props.onSave(localCode());
      e.preventDefault();
    }
  };

  // Identical classes for texarea & code with highlighting
  const sharedClasses =
    'm-0 border-0 text-sm leading-relaxed whitespace-pre break-normal box-border [tab-size:4] font-mono';

  const hasChanges = () => localCode() !== props.code;

  createEffect(() => {
    const onSave = props.onSave;
    if (!autoSave() || !onSave) return;

    const code = localCode();
    const savedCode = untrack(() => props.code);
    if (code === savedCode) return;

    const timeout = setTimeout(() => onSave(code), 2500);
    onCleanup(() => clearTimeout(timeout));
  });

  return (
    <div class="flex h-full w-full flex-col">
      <div class="relative w-full flex-1 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={localCode()}
          onInput={handleInput}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          class={clsx(
            'absolute inset-0 h-full w-full cursor-auto resize-none overflow-auto bg-transparent text-transparent caret-white outline-none',
            sharedClasses,
          )}
          spellcheck={false}
          autocapitalize="off"
          autocomplete="off"
          autocorrect="off"
        />
        <pre
          ref={preRef}
          class={clsx(
            'pointer-events-none absolute inset-0 h-full w-full overflow-hidden',
            sharedClasses,
          )}
        >
          {/* oxlint-disable-next-line solid/no-innerhtml */}
          <code class="passage-code block whitespace-pre" innerHTML={html()} />
        </pre>
      </div>

      <div class="-mx-4 flex justify-end gap-2 border-t border-gray-700 bg-gray-950 p-4">
        <Toggle label="Auto-save" checked={autoSave()} onChange={setAutoSave} />
        {!autoSave() && (
          <button
            class={btnClass('outline')}
            disabled={!hasChanges()}
            onClick={() => setLocalCode(props.code)}
          >
            Revert changes
          </button>
        )}
        <button
          class={btnClass('contained')}
          onClick={() => props.onSave?.(localCode())}
          disabled={!hasChanges()}
        >
          Save
        </button>
      </div>
    </div>
  );
}
