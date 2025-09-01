import { MapValue, Path } from '@/shared/shared-types';

import { StateContainerInput } from './StateContainerInput';

interface StateMapInputProps {
  path: Path;
  value: MapValue;
}

export function StateMapInput(props: StateMapInputProps) {
  const keys = () => [...props.value.keys()].sort();

  return (
    <StateContainerInput
      path={props.path}
      keys={keys()}
      getKeyValue={(key) => props.value.get(key)}
    />
  );
}
