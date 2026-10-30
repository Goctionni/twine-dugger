import { describe, expect, it, vi } from 'vite-plus/test';

import { pathKey } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';

import type { ArrowKey } from '../Shared/arrow-keys';
import type { TreeRow } from './logic/get-tree-rows';
import { onTreeListArrowKey, onTreeOnlyArrowKey } from './tree-arrow-keys';

const row = (path: Path): TreeRow => ({ id: pathKey(path), path, level: path.length });

// a (open) > x, y (closed, with children); b; c (closed, with children)
const rows = [row(['a']), row(['a', 'x']), row(['a', 'y']), row(['b']), row(['c'])];
const canOpen = (path: Path) => ['a', 'c', 'y'].includes(String(path.at(-1)));

function setup() {
  const onSelect = vi.fn();
  const expansion = { expand: vi.fn(), collapse: vi.fn() };
  return { onSelect, expansion, rows, canOpen };
}
const noOtherCalls = ({ onSelect, expansion }: ReturnType<typeof setup>) =>
  expect(
    onSelect.mock.calls.length +
      expansion.expand.mock.calls.length +
      expansion.collapse.mock.calls.length,
  ).toBe(0);

describe('onTreeOnlyArrowKey', () => {
  const press = (key: ArrowKey, selectedPath: Path) => {
    const context = setup();
    onTreeOnlyArrowKey(key, { ...context, selectedPath });
    return context;
  };

  it('goes down and up through the rows as they are shown', () => {
    expect(press('ArrowDown', ['a']).onSelect).toHaveBeenCalledWith(['a', 'x']);
    expect(press('ArrowDown', ['a', 'y']).onSelect).toHaveBeenCalledWith(['b']);
    expect(press('ArrowUp', ['b']).onSelect).toHaveBeenCalledWith(['a', 'y']);
    noOtherCalls(press('ArrowUp', ['a']));
    noOtherCalls(press('ArrowDown', ['c']));
  });

  it('goes to the first row from nothing, and does nothing else there', () => {
    expect(press('ArrowDown', []).onSelect).toHaveBeenCalledWith(['a']);
    noOtherCalls(press('ArrowUp', []));
    noOtherCalls(press('ArrowLeft', []));
    noOtherCalls(press('ArrowRight', []));
  });

  it('closes an open container with left, and goes to what holds it otherwise', () => {
    expect(press('ArrowLeft', ['a']).expansion.collapse).toHaveBeenCalledWith(pathKey(['a']));
    expect(press('ArrowLeft', ['a', 'x']).onSelect).toHaveBeenCalledWith(['a']);
    expect(press('ArrowLeft', ['a', 'y']).onSelect).toHaveBeenCalledWith(['a']);
    // A value at the top: what holds it is the state itself
    expect(press('ArrowLeft', ['b']).onSelect).toHaveBeenCalledWith([]);
  });

  it('opens a closed container with right, and goes into an open one', () => {
    expect(press('ArrowRight', ['c']).expansion.expand).toHaveBeenCalledWith(pathKey(['c']));
    expect(press('ArrowRight', ['a', 'y']).expansion.expand).toHaveBeenCalledWith(
      pathKey(['a', 'y']),
    );
    expect(press('ArrowRight', ['a']).onSelect).toHaveBeenCalledWith(['a', 'x']);
    noOtherCalls(press('ArrowRight', ['b']));
  });
});

describe('onTreeListArrowKey', () => {
  const valueKeys: Record<string, string[]> = { '': ['v'], 'a': ['v', 'w'], 'b': ['v'] };
  const press = (key: ArrowKey, selectedPath: Path, listedPath = selectedPath) => {
    const context = setup();
    onTreeListArrowKey(key, {
      ...context,
      selectedPath,
      listedPath,
      getValueKeys: (containerPath) => valueKeys[containerPath.join('.')] ?? [],
    });
    return context;
  };

  it('goes to the first value with right when there is nothing left to open', () => {
    // A closed container with rows is opened first
    expect(press('ArrowRight', ['c']).expansion.expand).toHaveBeenCalledWith(pathKey(['c']));
    // Open: its values come before its rows
    expect(press('ArrowRight', ['a']).onSelect).toHaveBeenCalledWith(['a', 'v']);
    // Nothing to open: the values
    expect(press('ArrowRight', ['b']).onSelect).toHaveBeenCalledWith(['b', 'v']);
    // The state itself
    expect(press('ArrowRight', []).onSelect).toHaveBeenCalledWith(['v']);
    // No values in the list: as without a list
    expect(press('ArrowRight', ['a', 'y']).expansion.expand).toHaveBeenCalledWith(
      pathKey(['a', 'y']),
    );
  });

  it('goes down and up through the values of the list, and stops at the ends', () => {
    expect(press('ArrowDown', ['a', 'v'], ['a']).onSelect).toHaveBeenCalledWith(['a', 'w']);
    expect(press('ArrowUp', ['a', 'w'], ['a']).onSelect).toHaveBeenCalledWith(['a', 'v']);
    noOtherCalls(press('ArrowDown', ['a', 'w'], ['a']));
    noOtherCalls(press('ArrowUp', ['a', 'v'], ['a']));
  });

  it('goes back to the container with left, and nowhere with right', () => {
    expect(press('ArrowLeft', ['a', 'w'], ['a']).onSelect).toHaveBeenCalledWith(['a']);
    expect(press('ArrowLeft', ['v'], []).onSelect).toHaveBeenCalledWith([]);
    noOtherCalls(press('ArrowRight', ['a', 'w'], ['a']));
  });

  it('uses the keys of the tree while a container is selected', () => {
    expect(press('ArrowDown', ['a']).onSelect).toHaveBeenCalledWith(['a', 'x']);
    expect(press('ArrowLeft', ['a']).expansion.collapse).toHaveBeenCalledWith(pathKey(['a']));
  });
});
