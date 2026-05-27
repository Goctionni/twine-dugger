/** @vitest-environment jsdom */

import { cleanup, render } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { createGetSettingMock, createSorterMock, stateContainerInputMock } = vi.hoisted(() => ({
  createGetSettingMock: vi.fn<(...args: any[]) => any>(),
  createSorterMock: vi.fn<(...args: any[]) => any>(),
  stateContainerInputMock: vi.fn<(...args: any[]) => any>(),
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

import { StateMapInput } from './StateMapInput';

afterEach(() => cleanup());

describe('StateMapInput', () => {
  beforeEach(() => {
    createGetSettingMock.mockReset();
    createSorterMock.mockReset();
    stateContainerInputMock.mockReset();

    createGetSettingMock.mockReturnValue(() => 'type');
    createSorterMock.mockReturnValue((keys: Array<string | number>) => keys.toReversed());
  });

  it('should derive sorted keys and resolve values for map entries', () => {
    const value = new Map<string, unknown>([
      ['a', 1],
      ['b', 2],
    ]);

    render(() => <StateMapInput path={['map']} value={value as any} />);

    const props = stateContainerInputMock.mock.calls[0]?.[0];
    expect(props.keys).toStrictEqual(['b', 'a']);
    expect(props.getKeyValue('a')).toBe(1);
  });
});
