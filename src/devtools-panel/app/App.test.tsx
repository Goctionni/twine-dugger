/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

type AnyFn = (...args: any[]) => any;

const { getConnectionStateMock, getNavigationPageMock, startTrackingFramesMock, initMetaMock } =
  vi.hoisted(() => ({
    getConnectionStateMock: vi.fn<AnyFn>(),
    getNavigationPageMock: vi.fn<AnyFn>(),
    startTrackingFramesMock: vi.fn<AnyFn>(),
    initMetaMock: vi.fn<AnyFn>(),
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

  it('should render connection-state messages for non-live states', () => {
    getConnectionStateMock.mockReturnValue('no-game-detected');
    render(() => <App />);
    expect(screen.getByText('No supported game detected')).toBeTruthy();

    cleanup();
    getConnectionStateMock.mockReturnValue('killed');
    render(() => <App />);
    expect(
      screen.getByText('Extension has disconnected. Re-open devtools to reinitialize.'),
    ).toBeTruthy();

    cleanup();
    getConnectionStateMock.mockReturnValue('loading-meta');
    render(() => <App />);
    expect(screen.getByText('Retrieving game metadata')).toBeTruthy();

    cleanup();
    getConnectionStateMock.mockReturnValue('loading-game');
    render(() => <App />);
    expect(screen.getByText('Initializing link to game')).toBeTruthy();

    cleanup();
    getConnectionStateMock.mockReturnValue('error');
    render(() => <App />);
    expect(screen.getByText('An error has occured')).toBeTruthy();
  });

  it('should render live content for active navigation page', () => {
    getConnectionStateMock.mockReturnValue('live');
    getNavigationPageMock.mockReturnValue('search');

    render(() => <App />);

    expect(screen.getByTestId('search-page')).toBeTruthy();
  });

  it('should route live content across all navigation pages', () => {
    getConnectionStateMock.mockReturnValue('live');

    getNavigationPageMock.mockReturnValue('state');
    render(() => <App />);
    expect(screen.getByTestId('state-page')).toBeTruthy();

    cleanup();
    getNavigationPageMock.mockReturnValue('passages');
    render(() => <App />);
    expect(screen.getByTestId('passages-page')).toBeTruthy();

    cleanup();
    getNavigationPageMock.mockReturnValue('settings');
    render(() => <App />);
    expect(screen.getByTestId('settings-page')).toBeTruthy();
  });

  it('should always render shared layout outlets', () => {
    render(() => <App />);

    expect(screen.getByTestId('layout')).toBeTruthy();
    expect(screen.getByTestId('prompt')).toBeTruthy();
    expect(screen.getByTestId('context-menu')).toBeTruthy();
  });
});
