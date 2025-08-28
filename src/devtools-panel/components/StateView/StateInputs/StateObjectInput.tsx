import { Index, Show } from 'solid-js';

import { ObjectValue, Path } from '@/shared/shared-types';

import { StateContainerInput } from './StateContainerInput';

interface StateObjectInputProps {
  path: Path;
  value: ObjectValue;
}

export function StateObjectInput(props: StateObjectInputProps) {
  const keys = () => Object.keys(props.value).sort();
  
  return (
    <StateContainerInput
      path={props.path}
      keys={keys()}
      getKeyValue={(key) => props.value[key]}
    />
  );
}
