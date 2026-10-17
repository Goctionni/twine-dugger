import { For, createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { sameItems } from '@/devtools-panel/utils/same-items';
import type { Path } from '@/shared/shared-types';

import { getPathLabels } from '../logic/path-labels';
import { BreadcrumbItem } from './BreadcrumbItem';
import { getSiblings } from './getSiblings';

interface Props {
  /** Without the root: it is always the first crumb */
  path: Path;
}

export function Breadcrumbs(props: Props) {
  const getLabels = createMemo(() => getPathLabels(getLatestState(), props.path), {
    equals: sameItems,
  });

  return (
    <nav
      aria-label="Path"
      class="flex items-stretch overflow-x-auto border-b border-gray-700 font-mono text-xs whitespace-nowrap"
    >
      <BreadcrumbItem name="State" />
      <For each={getLabels()}>
        {(label, index) => (
          <BreadcrumbItem name={label} siblings={getSiblings(props.path, index())} />
        )}
      </For>
    </nav>
  );
}
