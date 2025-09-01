import { createMemo } from 'solid-js';

import { createGetSetting } from '@/devtools-panel/store';
import { ObjectValue, Path } from '@/shared/shared-types';

import { createSorter } from '../property-sorter';
import { StateContainerInput } from './StateContainerInput';

interface StateObjectInputProps {
  path: Path;
  value: ObjectValue;
}

export function StateObjectInput(props: StateObjectInputProps) {
  const getPropertyOrder = createGetSetting('state.propertyOrder');

  const getKeys = createMemo(() => {
    const sorter = createSorter(props.value, getPropertyOrder());
    const keys = Object.keys(props.value);
    return sorter(keys);
  });

  return (
    <StateContainerInput
      path={props.path}
      keys={getKeys()}
      getKeyValue={(key) => props.value[key]}
    />
  );
}
