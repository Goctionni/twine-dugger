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

vi.mock('./ObjectNav', () => ({
  ObjectNav: (props: { path: Array<string | number>; selectedProperty?: string | number }) => (
    <div data-testid="object-nav">
      {props.path.join('.')}|{String(props.selectedProperty ?? '')}
    </div>
  ),
}));

vi.mock('./ValueView', () => ({
  ValueView: () => <div data-testid="value-view" />,
}));

import { StateView } from './StateView';

afterEach(() => cleanup());

describe('StateView', () => {
  beforeEach(() => {
    createGetViewStateMock.mockReset();
    getActiveStateMock.mockReset();
    getObjectPathValueMock.mockReset();

    createGetViewStateMock.mockReturnValue(() => ['player', 'stats']);
    getActiveStateMock.mockReturnValue({ player: { stats: { hp: 10 } } });
    getObjectPathValueMock.mockReturnValue({ hp: 10 });
  });

  it('should render object navigation layers and value view', () => {
    render(() => <StateView />);

    expect(screen.getAllByTestId('object-nav').length).toBe(3);
    expect(screen.getByTestId('value-view')).toBeTruthy();
  });
});
