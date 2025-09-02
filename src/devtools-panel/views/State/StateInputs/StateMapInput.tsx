import { createMemo } from 'solid-js';

import { createGetSetting } from '@/devtools-panel/store';
import { MapValue, Path } from '@/shared/shared-types';

import { createSorter } from '../property-sorter';
import { StateContainerInput } from './StateContainerInput';

interface StateMapInputProps {
  path: Path;
  value: MapValue;
}

export function StateMapInput(props: StateMapInputProps) {
  const getPropertyOrder = createGetSetting('state.propertyOrder');

  const getKeys = createMemo(() => {
    const sorter = createSorter(props.value, getPropertyOrder());
    const keys = [...props.value.keys()];
    return sorter(keys);
  });

  return (
    <StateContainerInput
      path={props.path}
      keys={getKeys()}
      getKeyValue={(key) => props.value.get(key)}
    />
  );
}
