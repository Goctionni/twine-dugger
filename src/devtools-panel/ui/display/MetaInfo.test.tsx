/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const getGameMetaDataMock = vi.hoisted(() => vi.fn());

vi.mock('../../store', () => ({
  getGameMetaData: getGameMetaDataMock,
}));

import { MetaInfo } from './MetaInfo';

afterEach(() => cleanup());

describe('MetaInfo', () => {
  beforeEach(() => {
    getGameMetaDataMock.mockReset();
  });

  it('should render game and format metadata', () => {
    getGameMetaDataMock.mockReturnValue({
      name: 'Mock Story',
      format: { name: 'SugarCube', version: { shortStr: '2.37.3' } },
    });

    render(() => <MetaInfo />);

    expect(screen.getByText('Game:')).toBeTruthy();
    expect(screen.getByText('Mock Story')).toBeTruthy();
    expect(screen.getByText(/StoryFormat:/)).toBeTruthy();
    expect(screen.getByText(/SugarCube 2.37.3/)).toBeTruthy();
  });

  it('should render compiler details when available', () => {
    getGameMetaDataMock.mockReturnValue({
      name: 'Mock Story',
      format: { name: 'Harlowe', version: { shortStr: '3.3.0' } },
      compiler: { name: 'Tweego', version: '2.1.1' },
    });

    render(() => <MetaInfo />);

    expect(screen.getByText(/Compiled with:/)).toBeTruthy();
    expect(screen.getByText(/Tweego 2.1.1/)).toBeTruthy();
  });
});
