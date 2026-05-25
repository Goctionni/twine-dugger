/** @vitest-environment jsdom */

import { cleanup, render } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { createGetSettingMock, createSorterMock, stateContainerInputMock } = vi.hoisted(() => ({
  createGetSettingMock: vi.fn(),
  createSorterMock: vi.fn(),
  stateContainerInputMock: vi.fn(),
}));

vi.mock('@/devtools-panel/store', () => ({
  createGetSetting: createGetSettingMock,
}));

vi.mock('../property-sorter', () => ({
  createSorter: createSorterMock,
}));

vi.mock('./StateContainerInput', () => ({
  StateContainerInput: (props: any) => {
    stateContainerInputMock(props);
    return <div />;
  },
}));

import { StateObjectInput } from './StateObjectInput';

afterEach(() => cleanup());

describe('StateObjectInput', () => {
  beforeEach(() => {
    createGetSettingMock.mockReset();
    createSorterMock.mockReset();
    stateContainerInputMock.mockReset();

    createGetSettingMock.mockReturnValue(() => 'type');
    createSorterMock.mockReturnValue((keys: Array<string | number>) =>
      keys.toSorted((a, b) => `${a}`.localeCompare(`${b}`)).toReversed(),
    );
  });

  it('should derive object keys via sorter and resolve key values', () => {
    const value = { a: 1, b: 2 };
    render(() => <StateObjectInput path={['obj']} value={value as any} />);

    const props = stateContainerInputMock.mock.calls[0]?.[0];
    expect(props.keys).toEqual(['b', 'a']);
    expect(props.getKeyValue('a')).toBe(1);
  });
});
