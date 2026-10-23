import { createSignal, onSettled, type Accessor } from 'solid-js';

import type { ValueType } from '@/shared/shared-types';

import { TYPE_ORDER } from '../../logic/sort-keys';

const [getSource, setSource] = createSignal<Accessor<ValueType[]>>();

/**
 * The types of the values that the tree shows, for the filter of the toolbar. The tree is not
 * there until it is made: every type then.
 */
export const getTreeTypes = () => getSource()?.() ?? TYPE_ORDER;

/** Called by the tree: the toolbar, which is outside of it, asks for the types through this */
export function provideTreeTypes(getTypes: Accessor<ValueType[]>) {
  onSettled(() => {
    setSource(() => getTypes);
    return () => setSource(undefined);
  });
}
