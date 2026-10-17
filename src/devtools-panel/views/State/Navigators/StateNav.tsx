import { Match, Switch } from 'solid-js';

import type { NavProps, Navigator } from '../types';
import { MillerNav } from './MillerNav';
import { TilesNav } from './TilesNav';
import { TreeNav } from './TreeNav';

interface Props extends NavProps {
  navigator: Navigator;
}

export function StateNav(props: Props) {
  return (
    <Switch>
      <Match when={props.navigator === 'miller'}>
        <MillerNav path={props.path} selectionKind={props.selectionKind} />
      </Match>
      <Match when={props.navigator === 'tree'}>
        <TreeNav path={props.path} selectionKind={props.selectionKind} />
      </Match>
      <Match when={props.navigator === 'tiles'}>
        <TilesNav path={props.path} selectionKind={props.selectionKind} />
      </Match>
    </Switch>
  );
}
