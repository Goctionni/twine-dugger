import { dynamic } from '@solidjs/web';
import { omit } from 'solid-js';

import type { NavProps, Navigator } from '../types';
import { navigators } from './navigators';

interface Props extends NavProps {
  navigator: Navigator;
}

export function StateNav(props: Props) {
  const navProps = omit(props, 'navigator');
  // oxlint-disable-next-line solid/reactivity -- dynamic() tracks its source
  const ActiveNavigator = dynamic(() => navigators[props.navigator].Component);

  return <ActiveNavigator {...navProps} />;
}
