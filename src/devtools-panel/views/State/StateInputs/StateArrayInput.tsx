import { ArrayValue, Path } from '@/shared/shared-types';

import { StateContainerInput } from './StateContainerInput';

interface StateArrayInputProps {
  path: Path;
  value: ArrayValue;
}

export function StateArrayInput(props: StateArrayInputProps) {
  const keys = () => [...props.value.keys()].sort();

  return (
    <StateContainerInput path={props.path} keys={keys()} getKeyValue={(key) => props.value[key]} />
  );
}
