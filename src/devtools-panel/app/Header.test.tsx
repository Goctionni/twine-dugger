/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { getGameMetaDataMock } = vi.hoisted(() => ({
  getGameMetaDataMock: vi.fn(),
}));

vi.mock('../store', () => ({
  getGameMetaData: getGameMetaDataMock,
}));

vi.mock('../ui/display/MetaInfo', () => ({
  MetaInfo: () => <div data-testid="meta-info" />,
}));

vi.mock('./Navigation', () => ({
  Navigation: () => <div data-testid="navigation" />,
}));

import { Header } from './Header';

afterEach(() => cleanup());

describe('Header', () => {
  beforeEach(() => {
    getGameMetaDataMock.mockReset();
  });

  it('should always render title and navigation', () => {
    getGameMetaDataMock.mockReturnValue(null);
    render(() => <Header />);

    expect(screen.getByText('Twine Dugger')).toBeTruthy();
    expect(screen.getByTestId('navigation')).toBeTruthy();
  });

  it('should render meta info when metadata exists', () => {
    getGameMetaDataMock.mockReturnValue({ format: { name: 'SugarCube' } });
    render(() => <Header />);

    expect(screen.getByTestId('meta-info')).toBeTruthy();
  });
});
