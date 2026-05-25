/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { executeCodeMock, getCandidateIframesMock, setConnectionStateMock, initMetaMock } =
  vi.hoisted(() => ({
    executeCodeMock: vi.fn(),
    getCandidateIframesMock: vi.fn(),
    setConnectionStateMock: vi.fn(),
    initMetaMock: vi.fn(),
  }));

vi.mock('../api/remote-execute', () => ({
  executeCode: executeCodeMock,
}));

vi.mock('../store', () => ({
  getCandidateIframes: getCandidateIframesMock,
  setConnectionState: setConnectionStateMock,
}));

vi.mock('./initMeta', () => ({
  initMeta: initMetaMock,
}));

import { Candidates } from './CandidateFrames';

afterEach(() => cleanup());

describe('Candidates', () => {
  beforeEach(() => {
    executeCodeMock.mockReset();
    getCandidateIframesMock.mockReset();
    setConnectionStateMock.mockReset();
    initMetaMock.mockReset();
    executeCodeMock.mockResolvedValue(undefined);
    initMetaMock.mockResolvedValue(true);
  });

  it('should render singular candidate message and open button', () => {
    getCandidateIframesMock.mockReturnValue(['https://game.local/frame']);

    render(() => <Candidates />);

    expect(screen.getByText(/did find an iframe/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open' })).toBeTruthy();
  });

  it('should render fallback message when no candidates are available', () => {
    getCandidateIframesMock.mockReturnValue([]);
    render(() => <Candidates />);

    expect(screen.getByText('And something went wrong?')).toBeTruthy();
  });

  it('should render plural iframe message when multiple candidates exist', () => {
    getCandidateIframesMock.mockReturnValue(['https://game.local/a', 'https://game.local/b']);
    render(() => <Candidates />);

    expect(screen.getByText(/did find some iframes/)).toBeTruthy();
  });

  it('should execute open action for selected iframe url', () => {
    getCandidateIframesMock.mockReturnValue(['https://game.local/frame']);

    render(() => <Candidates />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(setConnectionStateMock).toHaveBeenCalledWith('loading-meta');
    expect(executeCodeMock).toHaveBeenCalled();
    expect(executeCodeMock.mock.calls[0]?.[1]).toEqual({
      args: ['https://game.local/frame'],
    });
  });
});
