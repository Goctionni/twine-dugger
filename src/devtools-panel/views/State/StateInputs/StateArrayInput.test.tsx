/** @vitest-environment jsdom */

import { cleanup, render } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const stateContainerInputMock = vi.hoisted(() => vi.fn<(...args: any[]) => any>());

vi.mock('./StateContainerInput', () => ({
  StateContainerInput: (props: any) => {
    stateContainerInputMock(props);
    return <div data-testid="container-input" />;
  },
}));

import { StateArrayInput } from './StateArrayInput';

afterEach(() => cleanup());

describe('StateArrayInput', () => {
  it('should pass sorted array keys and resolver into StateContainerInput', () => {
    render(() => <StateArrayInput path={['arr']} value={['a', 'b'] as any} />);

    const props = stateContainerInputMock.mock.calls[0]?.[0];
    expect(props.path).toStrictEqual(['arr']);
    expect(props.keys).toStrictEqual([0, 1]);
    expect(props.getKeyValue(1)).toBe('b');
  });
});
