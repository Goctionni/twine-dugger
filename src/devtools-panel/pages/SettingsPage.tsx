import { For, Match, Show, Switch, createSignal } from 'solid-js';

import { DiffLogSettings } from '../views/Settings/DiffLogSettings';
import { EditorSettings } from '../views/Settings/EditorSettings';
import { PassagesSettings } from '../views/Settings/PassagesSettings';
import { PathsSettings } from '../views/Settings/PathsSettings';
import { SearchSettings } from '../views/Settings/SearchSettings';
import { StateSettings } from '../views/Settings/StateSettings';

type SectionId = 'state' | 'diff-log' | 'passages' | 'search' | 'editor' | 'paths';

const sections: Array<{ id: SectionId; title: string; intro: string }> = [
  { id: 'state', title: 'State page', intro: 'How the State page navigates and what it marks.' },
  { id: 'diff-log', title: 'Diff log', intro: 'The log of changes next to the state.' },
  { id: 'passages', title: 'Passages page', intro: 'The passage list and the editor.' },
  { id: 'search', title: 'Search', intro: '' },
  { id: 'editor', title: 'Editor', intro: 'The passage editor.' },
  {
    id: 'paths',
    title: 'Filtered paths and locks',
    intro: 'Per game: What values to lock and which to ignore.',
  },
];

// Not inside the page: the section stays when the page is left and visited again
const [getSectionId, setSectionId] = createSignal<SectionId>('state');

export function SettingsPage() {
  const getSection = () => sections.find((section) => section.id === getSectionId())!;

  // The arrow keys move between the tabs, as the keys of a list of tabs do
  const onKeyDown = (event: KeyboardEvent) => {
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    const index = sections.findIndex((section) => section.id === getSectionId());
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? sections.length - 1
          : step === undefined
            ? undefined
            : (index + step + sections.length) % sections.length;
    if (next === undefined) return;
    event.preventDefault();
    setSectionId(sections[next]!.id);
    document.getElementById(`settings-tab-${sections[next]!.id}`)?.focus();
  };

  return (
    <div class="flex flex-1 bg-gray-700">
      <div class="mx-auto w-full max-w-6xl flex-1 bg-slate-900 px-6 py-3">
        <h2 class="pb-2 text-xl leading-6 font-bold">Settings</h2>
        <div class="grid grid-cols-[200px_minmax(0,1fr)] gap-6">
          <div
            role="tablist"
            aria-orientation="vertical"
            aria-label="Settings"
            class="sticky top-3 flex flex-col gap-0.5 self-start"
            onKeyDown={onKeyDown}
          >
            <For each={sections}>
              {(section) => (
                <>
                  <Show when={section.id === 'paths'}>
                    <div class="mx-2 my-1.5 h-px bg-slate-700" />
                  </Show>
                  <button
                    type="button"
                    role="tab"
                    id={`settings-tab-${section.id}`}
                    aria-selected={getSectionId() === section.id ? 'true' : 'false'}
                    aria-controls="settings-panel"
                    tabindex={getSectionId() === section.id ? 0 : -1}
                    class="flex cursor-pointer justify-between gap-2 rounded-md px-2.5 py-1.75 text-left text-gray-300 hover:bg-slate-800 aria-selected:bg-sky-950 aria-selected:text-sky-300"
                    onClick={() => setSectionId(section.id)}
                  >
                    {section.title}
                  </button>
                </>
              )}
            </For>
          </div>
          <div
            role="tabpanel"
            id="settings-panel"
            aria-labelledby={`settings-tab-${getSectionId()}`}
            class="min-w-0"
          >
            <h3 class="text-lg font-bold">{getSection().title}</h3>
            <Show when={getSection().intro} fallback={<div class="h-2" />}>
              <p class="mt-0.5 mb-3.5 text-gray-400">{getSection().intro}</p>
            </Show>
            <div class="rounded-lg border border-slate-700 bg-slate-800/40 px-4">
              <Switch>
                <Match when={getSectionId() === 'state'}>
                  <StateSettings />
                </Match>
                <Match when={getSectionId() === 'diff-log'}>
                  <DiffLogSettings />
                </Match>
                <Match when={getSectionId() === 'passages'}>
                  <PassagesSettings />
                </Match>
                <Match when={getSectionId() === 'search'}>
                  <SearchSettings />
                </Match>
                <Match when={getSectionId() === 'editor'}>
                  <EditorSettings />
                </Match>
                <Match when={getSectionId() === 'paths'}>
                  <PathsSettings />
                </Match>
              </Switch>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
