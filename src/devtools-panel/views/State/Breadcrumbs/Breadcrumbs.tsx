import { For } from 'solid-js';

import { BreadcrumbItem } from './BreadcrumbItem';
import { getSiblings } from './getSiblings';

interface Props {
  /** Without the root: it is always the first crumb */
  path: string[];
}

export function Breadcrumbs(props: Props) {
  return (
    <nav
      aria-label="Path"
      class="flex items-stretch overflow-x-auto border-b border-gray-700 font-mono text-xs whitespace-nowrap"
    >
      <BreadcrumbItem name="State" />
      <For each={props.path}>
        {(segment, index) => (
          <BreadcrumbItem name={segment} siblings={getSiblings(props.path, index())} />
        )}
      </For>
    </nav>
  );
}
