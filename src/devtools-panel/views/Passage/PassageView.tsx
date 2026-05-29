import { Match, Switch, untrack } from 'solid-js';

import { setPassage } from '@/devtools-panel/api/api';
import { setPassageData, setViewState } from '@/devtools-panel/store';
import { Code } from '@/devtools-panel/ui/code';
import { ParsedPassageData } from '@/shared/shared-types';

import { PassageHeader } from './PassageHeader';

interface Props {
  passage: ParsedPassageData | null;
  language: string;
}

export function PassageView(props: Props) {
  const onSave = (code: string) => {
    const passage = untrack(() => props.passage);
    if (!passage) return;
    setPassage({ name: passage.name, source: code });

    const newPassage: ParsedPassageData = { ...passage, content: code };
    setViewState('passage', 'selected', newPassage);
    setPassageData((current) => {
      return current.map((oldpassage) => {
        if (oldpassage.id !== passage.id) return oldpassage;
        return newPassage;
      });
    });
  };

  return (
    <Switch fallback={<div class="py-2">No passage selected.</div>}>
      <Match when={props.passage}>
        <div class="flex h-full w-full flex-col overflow-auto px-4 py-2">
          <PassageHeader passage={props.passage!} />
          <Code code={props.passage!.content ?? ''} format={props.language} onSave={onSave} />
        </div>
      </Match>
    </Switch>
  );
}
