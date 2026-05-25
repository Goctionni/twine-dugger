/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { setViewStateMock, getGameMetaDataMock, getPassageDataMock, getSelectedPassageMock } =
  vi.hoisted(() => ({
    setViewStateMock: vi.fn(),
    getGameMetaDataMock: vi.fn(),
    getPassageDataMock: vi.fn(),
    getSelectedPassageMock: vi.fn(),
  }));

vi.mock('../store', () => ({
  setViewState: setViewStateMock,
  getGameMetaData: getGameMetaDataMock,
  getPassageData: getPassageDataMock,
  createGetViewState: vi.fn(() => getSelectedPassageMock),
}));

vi.mock('../ui/util/MovableSplit', () => ({
  MovableSplit: (props: { leftContent: unknown; rightContent: unknown }) => (
    <div>
      <div data-testid="left">{props.leftContent as any}</div>
      <div data-testid="right">{props.rightContent as any}</div>
    </div>
  ),
}));

vi.mock('../views/Passage/PassageList', () => ({
  PassageList: (props: {
    onPassageClick: (p: any) => void;
    passages: any[];
    selectedPassage: any;
  }) => (
    <div>
      <button
        type="button"
        data-testid="pick"
        onClick={() => props.onPassageClick(props.passages[0])}
      >
        pick
      </button>
      <span data-testid="selected-id">{props.selectedPassage?.id ?? 'none'}</span>
    </div>
  ),
}));

vi.mock('../views/Passage/PassageView', () => ({
  PassageView: (props: { language: string; passage: any }) => (
    <div data-testid="view">
      {props.language}:{props.passage?.name ?? 'none'}
    </div>
  ),
}));

import { PassagesPage } from './PassagesPage';

afterEach(() => cleanup());

describe('PassagesPage', () => {
  beforeEach(() => {
    setViewStateMock.mockReset();
    getGameMetaDataMock.mockReset();
    getPassageDataMock.mockReset();
    getSelectedPassageMock.mockReset();

    getGameMetaDataMock.mockReturnValue({ format: { name: 'SugarCube' } });
    getPassageDataMock.mockReturnValue([
      { id: 1, name: 'Start', tags: [], content: 'body', size: null, position: null },
    ]);
    getSelectedPassageMock.mockReturnValue({
      id: 1,
      name: 'Start',
      tags: [],
      content: 'body',
      size: null,
      position: null,
    });
  });

  it('should wire selected passage and format into passage view', () => {
    render(() => <PassagesPage />);

    expect(screen.getByTestId('view').textContent).toBe('SugarCube:Start');
    expect(screen.getByTestId('selected-id').textContent).toBe('1');
  });

  it('should persist selected passage via view-state setter when list callback fires', () => {
    render(() => <PassagesPage />);
    fireEvent.click(screen.getByTestId('pick'));

    expect(setViewStateMock).toHaveBeenCalledWith('passage', 'selected', {
      id: 1,
      name: 'Start',
      tags: [],
      content: 'body',
      size: null,
      position: null,
    });
  });
});
