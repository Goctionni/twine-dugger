import { Match, Switch } from 'solid-js';

import type { NavProps, Navigator } from '../types';
import { MillerNav } from './MillerNav/MillerNav';
import { TilesNav } from './TilesNav/TilesNav';
import { TreeNav } from './TreeNav/TreeNav';

interface Props extends NavProps {
  navigator: Navigator;
}

export function StateNav(props: Props) {
  return (
    <Switch>
      <Match when={props.navigator === 'miller'}>
        <MillerNav path={props.path} onSelect={props.onSelect} />
      </Match>
      <Match when={props.navigator === 'tree'}>
        <TreeNav path={props.path} onSelect={props.onSelect} />
      </Match>
      <Match when={props.navigator === 'tiles'}>
        <TilesNav path={props.path} onSelect={props.onSelect} />
      </Match>
    </Switch>
  );
}
