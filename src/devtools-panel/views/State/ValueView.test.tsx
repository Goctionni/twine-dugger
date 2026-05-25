/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { createGetViewStateMock, getActiveStateMock, getObjectPathValueMock } = vi.hoisted(() => ({
  createGetViewStateMock: vi.fn(),
  getActiveStateMock: vi.fn(),
  getObjectPathValueMock: vi.fn(),
}));

vi.mock('@/devtools-panel/store', () => ({
  createGetViewState: createGetViewStateMock,
  getActiveState: getActiveStateMock,
}));

vi.mock('@/shared/get-object-path-value', () => ({
  getObjectPathValue: getObjectPathValueMock,
}));

vi.mock('../../ui/display/PrettyPath', () => ({
  PrettyPath: () => <div data-testid="pretty-path" />,
}));

vi.mock('../../ui/display/TypeIcon', () => ({
  TypeIcon: () => <div data-testid="type-icon" />,
}));

vi.mock('./StateInputs/StateStringInput', () => ({
  StateStringInput: () => <div data-testid="input-string" />,
}));

vi.mock('./StateInputs/StateNumberInput', () => ({
  StateNumberInput: () => <div data-testid="input-number" />,
}));

vi.mock('./StateInputs/StateBooleanInput', () => ({
  StateBooleanInput: () => <div data-testid="input-boolean" />,
}));

vi.mock('./StateInputs/StateObjectInput', () => ({
  StateObjectInput: () => <div data-testid="input-object" />,
}));

vi.mock('./StateInputs/StateMapInput', () => ({
  StateMapInput: () => <div data-testid="input-map" />,
}));

vi.mock('./StateInputs/StateArrayInput', () => ({
  StateArrayInput: () => <div data-testid="input-array" />,
}));

import { ValueView } from './ValueView';

afterEach(() => cleanup());

describe('ValueView', () => {
  let historyId = -1;

  beforeEach(() => {
    createGetViewStateMock.mockReset();
    getActiveStateMock.mockReset();
    getObjectPathValueMock.mockReset();

    historyId = -1;
    createGetViewStateMock.mockImplementation((view: string, property: string) => {
      if (view === 'state' && property === 'path') return () => ['player', 'hp'];
      if (view === 'state' && property === 'historyId') return () => historyId;
      return () => undefined;
    });
    getActiveStateMock.mockReturnValue({ player: { hp: 10 } });
  });

  it('should render number input for numeric values', () => {
    getObjectPathValueMock.mockReturnValue(10);
    render(() => <ValueView />);

    expect(screen.getByTestId('input-number')).toBeTruthy();
  });

  it('should render non-editable message for function values', () => {
    getObjectPathValueMock.mockReturnValue(() => 1);
    render(() => <ValueView />);

    expect(screen.getByText('Values of this type cannot be edited')).toBeTruthy();
  });

  it('should render object input for object values', () => {
    getObjectPathValueMock.mockReturnValue({ hp: 10 });
    render(() => <ValueView />);

    expect(screen.getByTestId('input-object')).toBeTruthy();
  });

  it('should render string and boolean inputs for primitive values', () => {
    getObjectPathValueMock.mockReturnValue('hero');
    render(() => <ValueView />);
    expect(screen.getByTestId('input-string')).toBeTruthy();

    cleanup();
    getObjectPathValueMock.mockReturnValue(true);
    render(() => <ValueView />);
    expect(screen.getByTestId('input-boolean')).toBeTruthy();
  });

  it('should render map and array inputs for container values', () => {
    getObjectPathValueMock.mockReturnValue(new Map([['hp', 10]]));
    render(() => <ValueView />);
    expect(screen.getByTestId('input-map')).toBeTruthy();

    cleanup();
    getObjectPathValueMock.mockReturnValue([1, 2, 3]);
    render(() => <ValueView />);
    expect(screen.getByTestId('input-array')).toBeTruthy();
  });

  it('should show readonly marker when viewing historical slice', () => {
    historyId = 5;
    getObjectPathValueMock.mockReturnValue(10);

    render(() => <ValueView />);
    expect(screen.getByText('(readonly)')).toBeTruthy();
  });
});
