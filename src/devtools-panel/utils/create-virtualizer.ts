import type { PartialKeys, VirtualItem, VirtualizerOptions } from '@tanstack/virtual-core';
import {
  elementScroll,
  observeElementOffset,
  observeElementRect,
  Virtualizer,
} from '@tanstack/virtual-core';
import {
  createEffect,
  createSignal,
  createProjection,
  merge,
  onSettled,
  runWithOwner,
  untrack,
} from 'solid-js';

type Options<TScrollElement extends Element, TItemElement extends Element> = PartialKeys<
  VirtualizerOptions<TScrollElement, TItemElement>,
  'observeElementRect' | 'observeElementOffset' | 'scrollToFn'
> & {
  /**
   * What makes a virtual item the same item after an update. 'index' (default): the position, so
   * the item at a position stays. 'key': `getItemKey`, so the item with a key stays wherever it
   * moved. The latter needs a `getItemKey` that changes when the keys do (the virtualizer only
   * looks again when its options change), e.g. a getter that reads the list.
   */
  reconcileBy?: 'index' | 'key';
};

/**
 * Solid 2.0 adapter for the framework-agnostic virtualizer of TanStack.
 *
 * The virtual items live in a projection keyed by `index` (or `key`, see `reconcileBy`): an item that
 * stays in view is the same object (so its row stays), and scrolling only updates the properties that changed (`start`).
 * Options can be getters (`get count() {...}`): when what they read changes, the virtualizer is
 * updated.
 */
export function createVirtualizer<TScrollElement extends Element, TItemElement extends Element>(
  options: Options<TScrollElement, TItemElement>,
): Virtualizer<TScrollElement, TItemElement> {
  const resolved = merge(
    { observeElementRect, observeElementOffset, scrollToFn: elementScroll },
    options,
  ) as VirtualizerOptions<TScrollElement, TItemElement>;

  const reconcileBy = untrack(() => options.reconcileBy) ?? 'index';

  const onChange = (instance: Virtualizer<TScrollElement, TItemElement>, sync: boolean) => {
    instance._willUpdate();
    update();
    options.onChange?.(instance, sync);
  };

  const instance = new Virtualizer<TScrollElement, TItemElement>(
    untrack(() => ({ ...resolved, onChange })),
  );

  // A projection gives an item that is still there the same object, also when it has moved
  const [virtualSource, setVirtualSource] = createSignal(instance.getVirtualItems(), {
    ownedWrite: true,
    equals: false,
  });
  const virtualItems = createProjection<VirtualItem[]>(() => virtualSource(), [], {
    key: reconcileBy,
  });
  const [totalSize, setTotalSize] = createSignal(instance.getTotalSize(), { ownedWrite: true });

  // The virtualizer is an outside source of truth: its changes are pushed into state, which
  // Solid only allows from outside an owner (an effect is one)
  function update() {
    runWithOwner(null, () => {
      setVirtualSource(instance.getVirtualItems());
      setTotalSize(instance.getTotalSize());
    });
  }

  const virtualizer = new Proxy(instance, {
    get(target, prop) {
      if (prop === 'getVirtualItems') return () => virtualItems;
      if (prop === 'getTotalSize') return () => totalSize();
      return Reflect.get(target, prop) as unknown;
    },
  });

  onSettled(() => {
    const cleanup = instance._didMount();
    instance._willUpdate();
    update();
    return cleanup;
  });

  createEffect(
    () => ({ ...resolved }),
    (current) => {
      instance.setOptions({ ...current, onChange });
      instance._willUpdate();
      update();
    },
  );

  return virtualizer;
}
