import type { Navigator } from '../types';
import { NavigatorSwitch } from './NavigatorSwitch';

interface Props {
  navigator: Navigator;
  onNavigatorChange: (navigator: Navigator) => void;
}

export function Toolbar(props: Props) {
  return (
    <div class="flex flex-wrap items-center gap-2 border-b border-gray-700 p-2">
      <NavigatorSwitch navigator={props.navigator} onChange={props.onNavigatorChange} />
    </div>
  );
}
