/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { createGetViewStateMock, setViewStateMock, stringInputMock } = vi.hoisted(() => ({
  createGetViewStateMock: vi.fn<(...args: any[]) => any>(),
  setViewStateMock: vi.fn<(...args: any[]) => any>(),
  stringInputMock: vi.fn<(...args: any[]) => any>(),
}));

vi.mock('../../store', () => ({
  createGetViewState: createGetViewStateMock,
  setViewState: setViewStateMock,
}));

vi.mock('../../ui/inputs/StringInput', () => ({
  StringInput: (props: any) => {
    stringInputMock(props);
    return <div data-testid="string-input" />;
  },
}));

import { SearchInput } from './SearchInput';

afterEach(() => cleanup());

describe('SearchInput', () => {
  beforeEach(() => {
    createGetViewStateMock.mockReset();
    setViewStateMock.mockReset();
    stringInputMock.mockReset();
    createGetViewStateMock.mockReturnValue(() => 'hp');
  });

  it('should wire query value and input props into StringInput', () => {
    render(() => <SearchInput />);

    expect(screen.getByTestId('string-input')).toBeTruthy();
    const props = stringInputMock.mock.calls[0]?.[0];
    expect(props.value).toBe('hp');
    expect(props.placeholder).toBe('Search...');
    expect(props.autoFocus).toBe(true);
  });

  it('should forward onChange updates to view state', () => {
    render(() => <SearchInput />);
    const props = stringInputMock.mock.calls[0]?.[0];
    props.onChange('mana');

    expect(setViewStateMock).toHaveBeenCalledWith('search', 'query', 'mana');
  });
});
