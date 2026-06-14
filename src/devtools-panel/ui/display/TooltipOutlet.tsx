import type { JSX } from 'solid-js';
import { createMemo, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';

interface TooltipStore {
  tooltip: JSX.Element;
  outletStack: string[];
}

const [tooltipStore, setTooltipStore] = createStore<TooltipStore>({
  tooltip: null,
  outletStack: [],
});

export const useTooltipOutlet = () => {
  const id = crypto.randomUUID();
  setTooltipStore('outletStack', tooltipStore.outletStack.length, id);
  onCleanup(() => {
    setTooltipStore('outletStack', (stack) => stack.filter((item) => item !== id));
  });

  const tooltip = createMemo(() => {
    const lastId = tooltipStore.outletStack.at(-1);
    if (id !== lastId) return null;
    return tooltipStore.tooltip;
  });

  return tooltip;
};

export const useSetTooltip = () => (tooltip: JSX.Element) => setTooltipStore('tooltip', tooltip);

interface OutletProps {
  children?: JSX.Element;
}

export function TooltipOutlet(props: OutletProps) {
  const tooltip = useTooltipOutlet();

  return (
    <>
      {tooltip()}
      {props.children}
    </>
  );
}
