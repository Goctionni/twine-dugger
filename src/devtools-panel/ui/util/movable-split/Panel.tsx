import type { JSX } from '@solidjs/web/jsx-runtime';

interface Props {
  collapsed: boolean;
  flex: string;
  children: JSX.Element;
}

export function Panel(props: Props) {
  return (
    <div
      class={['min-h-0 min-w-0 overflow-hidden bg-gray-900', props.collapsed && 'hidden']}
      style={{ flex: props.flex }}
    >
      {props.children}
    </div>
  );
}
