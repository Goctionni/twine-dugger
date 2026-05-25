/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { getConnectionStateMock, getNavigationPageMock, startTrackingFramesMock, initMetaMock } =
  vi.hoisted(() => ({
    getConnectionStateMock: vi.fn(),
    getNavigationPageMock: vi.fn(),
    startTrackingFramesMock: vi.fn(),
    initMetaMock: vi.fn(),
  }));

vi.mock('../store', () => ({
  getConnectionState: getConnectionStateMock,
  getNavigationPage: getNavigationPageMock,
  startTrackingFrames: startTrackingFramesMock,
}));

vi.mock('./initMeta', () => ({
  initMeta: initMetaMock,
}));

vi.mock('./Layout', () => ({
  Layout: (props: { children: unknown }) => <div data-testid="layout">{props.children as any}</div>,
}));

vi.mock('../ui/util/Prompt', () => ({
  PromptDialogOutlet: () => <div data-testid="prompt" />,
}));

vi.mock('../ui/util/ContextMenu', () => ({
  ContextMenuUI: () => <div data-testid="context-menu" />,
}));

vi.mock('./CandidateFrames', () => ({
  Candidates: () => <div data-testid="candidates" />,
}));

vi.mock('../pages/StatePage', () => ({
  StatePage: () => <div data-testid="state-page" />,
}));

vi.mock('../pages/SearchPage', () => ({
  SearchPage: () => <div data-testid="search-page" />,
}));

vi.mock('../pages/PassagesPage', () => ({
  PassagesPage: () => <div data-testid="passages-page" />,
}));

vi.mock('../pages/SettingsPage', () => ({
  SettingsPage: () => <div data-testid="settings-page" />,
}));

import { App } from './App';

afterEach(() => cleanup());

describe('App', () => {
  beforeEach(() => {
    getConnectionStateMock.mockReset();
    getNavigationPageMock.mockReset();
    startTrackingFramesMock.mockReset();
    initMetaMock.mockReset();
    getConnectionStateMock.mockReturnValue('live');
    getNavigationPageMock.mockReturnValue('state');
  });

  it('should render not-enabled prompt and start tracking action', () => {
    getConnectionStateMock.mockReturnValue('not-enabled');

    render(() => <App />);
    fireEvent.click(screen.getByRole('button', { name: 'Start tracking' }));

    expect(startTrackingFramesMock).toHaveBeenCalledTimes(1);
  });

  it('should render candidate iframe view when connection state matches', () => {
    getConnectionStateMock.mockReturnValue('candidate-iframes');

    render(() => <App />);

    expect(screen.getByTestId('candidates')).toBeTruthy();
  });

  it('should render live content for active navigation page', () => {
    getConnectionStateMock.mockReturnValue('live');
    getNavigationPageMock.mockReturnValue('search');

    render(() => <App />);

    expect(screen.getByTestId('search-page')).toBeTruthy();
  });
});
