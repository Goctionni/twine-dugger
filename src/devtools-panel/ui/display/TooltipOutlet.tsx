import type { JSX } from '@solidjs/web';
import { createMemo, createSignal, onCleanup } from 'solid-js';

const [tooltipContent, setTooltipContent] = createSignal<JSX.Element>(null);
const [outletStack, setOutletStack] = createSignal<string[]>([], { ownedWrite: true });

const useTooltipOutlet = () => {
  const id = crypto.randomUUID();
  setOutletStack((stack) => [...stack, id]);
  onCleanup(() => {
    setOutletStack((stack) => stack.filter((item) => item !== id));
  });

  const tooltip = createMemo(() => {
    const lastId = outletStack().at(-1);
    if (id !== lastId) return null;
    return tooltipContent();
  });

  return tooltip;
};

// The content is an element, which would be mistaken for an updater if passed as-is
export const useSetTooltip = () => (tooltip: JSX.Element) => setTooltipContent(() => tooltip);

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
