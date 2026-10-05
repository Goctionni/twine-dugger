import javascriptLangDef from '@shikijs/langs/javascript';
import clsx from 'clsx';
import { createEffect, createMemo, createSignal, Show } from 'solid-js';
import type { IRawGrammar } from 'vscode-textmate';

import { createGetSetting } from '@/devtools-panel/store/store';
import { btnClass } from '@/devtools-panel/ui/util/btnClass';

import { highlightRanges, createTextRanges, type CharRange } from '../util/range-highlight';
import { Toggle } from '../util/Toggle';
import chapbookLangDef from './grammars/chapbook-grammar.json' with { type: 'json' };
import harloweLangDef from './grammars/harlowe-grammar.json' with { type: 'json' };
import snowmanLangDef from './grammars/snowman-grammar.json' with { type: 'json' };
import sugarcubeLangDef from './grammars/sugarcube-grammar.json' with { type: 'json' };
import { createHighlighter, createRegistry, escapeHtml } from './highlighter';
import { getHighlightingLength } from './highlighting-limits';

type TEvent<TE extends Event, TEl extends HTMLElement> = TE & { currentTarget: TEl };

const formatDict: Record<string, string> = {
  sugarcube: sugarcubeLangDef.scopeName,
  harlowe: harloweLangDef.scopeName,
  chapbook: chapbookLangDef.scopeName,
  snowman: snowmanLangDef.scopeName,
};

const getDisableHighlighting = createGetSetting('editor.disableHighlighting');

interface PassageCodeProps {
  code: string;
  format?: string;
  onSave?: (code: string) => void;
  /** Parts of `code` to mark as search matches; the first one is scrolled into view */
  matches?: readonly CharRange[];
}

export function Code(props: PassageCodeProps) {
  const [autoSave, setAutoSave] = createSignal(false);
  const [localCode, setLocalCode] = createSignal(() => props.code);
  const [highlighter, setHighlighter] = createSignal<Awaited<
    ReturnType<typeof createHighlighter>
  > | null>(null);

  // Decided by the length it was opened with: it should not switch while someone is typing
  const [forceHighlighting, setForceHighlighting] = createSignal(false);
  const isHeldBack = () => props.code.length >= getHighlightingLength(getDisableHighlighting());
  const highlighting = () => !isHeldBack() || forceHighlighting();

  let textareaRef!: HTMLTextAreaElement;
  let preRef!: HTMLPreElement;

  // Initialize the highlighter
  createEffect(
    () => props.format ?? 'sugarcube',
    (format) => {
      createHighlighter({
        registry: createRegistry([
          harloweLangDef as unknown as IRawGrammar,
          sugarcubeLangDef as unknown as IRawGrammar,
          chapbookLangDef as unknown as IRawGrammar,
          snowmanLangDef as unknown as IRawGrammar,
          ...(javascriptLangDef as unknown as IRawGrammar[]),
        ]),
        scope: formatDict[format.toLowerCase()] ?? sugarcubeLangDef.scopeName,
      }).then(setHighlighter);
    },
  );

  const html = createMemo(() => {
    const escape = (highlighting() ? highlighter()?.toHtml : undefined) ?? escapeHtml;
    return escape(localCode());
  });

  // Marks the matches of what was searched for. Once the text is edited, the positions no longer fit
  createEffect(
    () => ({
      html: html(),
      matches:
        localCode() === props.code
          ? props.matches?.map(([from, to]) => [from, to] as const)
          : undefined,
    }),
    ({ matches }) => (matches ? highlightRanges(preRef, matches) : undefined),
  );

  // When a passage is opened from a search, it opens at the first match
  let hasScrolled = false;
  createEffect(
    () => props.matches?.[0],
    (first) => {
      if (hasScrolled || !first) return;
      const top = createTextRanges(preRef, [first])[0]?.getBoundingClientRect().top;
      if (top === undefined) return;
      hasScrolled = true;
      textareaRef.scrollTop = Math.max(0, top - preRef.getBoundingClientRect().top - 60);
    },
  );

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

  createEffect(
    () => ({ onSave: props.onSave, autoSave: autoSave(), code: localCode() }),
    ({ onSave, autoSave, code }) => {
      if (!autoSave || !onSave) return;
      if (code === props.code) return;

      const timeout = setTimeout(() => onSave(code), 2500);
      return () => clearTimeout(timeout);
    },
  );

  return (
    <div class="flex h-full w-full flex-col">
      <Show when={!highlighting()}>
        <div class="flex items-center gap-3 bg-amber-950 px-3 py-1 text-xs text-amber-200">
          <span>
            Syntax highlighting is off for this passage. Turning it on can make this panel freeze
            for a while if the passage is long.
          </span>
          <button
            type="button"
            class="shrink-0 cursor-pointer rounded-sm bg-amber-700 px-2 py-0.5 text-white hover:bg-amber-600"
            onClick={() => setForceHighlighting(true)}
          >
            Enable syntax highlighting
          </button>
        </div>
      </Show>
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
          spellcheck="false"
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
