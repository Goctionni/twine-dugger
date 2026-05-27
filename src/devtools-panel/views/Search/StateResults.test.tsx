/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { setNavigationPageMock, setViewStateMock, getPersistedValueMock, setPersistedValueMock } =
  vi.hoisted(() => ({
    setNavigationPageMock: vi.fn<(page: string) => void>(),
    setViewStateMock: vi.fn<(view: string, key: string, value: Array<string | number>) => void>(),
    getPersistedValueMock: vi.fn<(key: string, fallback: number) => number>(),
    setPersistedValueMock: vi.fn<(key: string, value: number) => void>(),
  }));

vi.mock('@tanstack/solid-virtual', () => ({
  createVirtualizer: vi.fn<
    (options: { count: number }) => {
      getTotalSize: () => number;
      getVirtualItems: () => Array<{ index: number; size: number; start: number }>;
    }
  >((options: { count: number }) => ({
    getTotalSize: () => options.count * 38,
    getVirtualItems: () =>
      Array.from({ length: options.count }, (_, index) => ({
        index,
        size: 38,
        start: index * 38,
      })),
  })),
}));

vi.mock('../../store', () => ({
  setNavigationPage: setNavigationPageMock,
  setViewState: setViewStateMock,
}));

vi.mock('../../ui/display/PrettyPath', () => ({
  PrettyPath: (props: { path: Array<string | number> }) => <span>{props.path.join('.')}</span>,
}));

vi.mock('../../ui/display/TypeIcon', () => ({
  TypeIcon: (props: { type: string }) => (
    <span data-testid={`icon-${props.type}`}>{props.type}</span>
  ),
}));

vi.mock('../../ui/util/persistedValue', () => ({
  getPersistedValue: getPersistedValueMock,
  setPersistedValue: setPersistedValueMock,
}));

vi.mock('../State/StateInputs/StateStringInput', () => ({
  StateStringInput: () => <div data-testid="input-string" />,
}));

vi.mock('../State/StateInputs/StateNumberInput', () => ({
  StateNumberInput: () => <div data-testid="input-number" />,
}));

vi.mock('../State/StateInputs/StateBooleanInput', () => ({
  StateBooleanInput: () => <div data-testid="input-boolean" />,
}));

import { StateResults } from './StateResults';

afterEach(() => cleanup());

describe('StateResults', () => {
  beforeEach(() => {
    setNavigationPageMock.mockReset();
    setViewStateMock.mockReset();
    getPersistedValueMock.mockReset();
    setPersistedValueMock.mockReset();
    getPersistedValueMock.mockReturnValue(256);
  });

  it('should render result rows and navigate to clicked path', () => {
    const results = [
      { path: ['player', 'name'], value: 'Alice' },
      { path: ['player', 'hp'], value: 10 },
      { path: ['player', 'alive'], value: true },
    ] as any;

    render(() => <StateResults results={results} />);

    fireEvent.click(screen.getByRole('button', { name: 'player.name' }));

    expect(setNavigationPageMock).toHaveBeenCalledWith('state');
    expect(setViewStateMock).toHaveBeenCalledWith('state', 'path', ['player', 'name']);
    expect(screen.getByTestId('input-string')).toBeTruthy();
    expect(screen.getByTestId('input-number')).toBeTruthy();
    expect(screen.getByTestId('input-boolean')).toBeTruthy();
  });

  it('should persist resized path column width on drag', () => {
    const results = [{ path: ['player', 'name'], value: 'Alice' }] as any;
    const { container } = render(() => <StateResults results={results} />);

    const wrapper = container.querySelector('.relative.h-full.flex-1.overflow-hidden.py-1');
    const handle = container.querySelector('.cursor-col-resize');
    expect(wrapper).toBeInstanceOf(HTMLDivElement);
    expect(handle).toBeInstanceOf(HTMLDivElement);

    const root = wrapper as HTMLDivElement;
    const divider = handle as HTMLDivElement;

    root.getBoundingClientRect = () =>
      ({
        left: 10,
        top: 0,
        right: 1010,
        bottom: 400,
        width: 1000,
        height: 400,
        x: 10,
        y: 0,
      }) as DOMRect;

    fireEvent.mouseDown(divider, { clientX: 100 });
    fireEvent.mouseMove(document, { clientX: 420 });
    fireEvent.mouseUp(document);

    expect(setPersistedValueMock).toHaveBeenCalledWith('search-state-results-path-width', 366);
  });
});
