import { Show } from 'solid-js';

import { SiblingMenu } from './SiblingMenu';

interface Props {
  name: string;
  /** Without them there is no menu: the root has no siblings */
  siblings?: string[];
}

export function BreadcrumbItem(props: Props) {
  return (
    <span class="inline-flex items-stretch border-r border-gray-700 [anchor-scope:--crumb] hover:bg-gray-700">
      <button
        type="button"
        class={[
          'cursor-pointer py-1.5 pl-2 text-sky-400 [anchor-name:--crumb]',
          props.siblings ? 'pr-1.5' : 'pr-2',
        ]}
      >
        {props.name}
      </button>
      <Show when={props.siblings}>
        {(siblings) => <SiblingMenu current={props.name} siblings={siblings()} />}
      </Show>
    </span>
  );
}
