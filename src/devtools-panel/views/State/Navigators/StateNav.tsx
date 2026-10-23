import { Match, Switch, omit } from 'solid-js';

import type { NavProps, Navigator } from '../types';
import { MillerNav } from './MillerNav/MillerNav';
import { TilesNav } from './TilesNav';
import { TreeNav } from './TreeNav/TreeNav';

interface Props extends NavProps {
  navigator: Navigator;
}

export function StateNav(props: Props) {
  const navProps = omit(props, 'navigator');

  return (
    <Switch>
      <Match when={props.navigator === 'miller'}>
        <MillerNav {...navProps} />
      </Match>
      <Match when={props.navigator === 'tree'}>
        <TreeNav {...navProps} />
      </Match>
      <Match when={props.navigator === 'tiles'}>
        <TilesNav {...navProps} />
      </Match>
    </Switch>
  );
}
