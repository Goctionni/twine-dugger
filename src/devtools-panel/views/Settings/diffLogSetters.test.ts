import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { setSettingMock } = vi.hoisted(() => ({
  setSettingMock: vi.fn<(...args: any[]) => any>(),
}));

vi.mock('@/devtools-panel/store', () => ({
  setSetting: setSettingMock,
}));

import {
  onFontSizeChange,
  onMaxHistorySlicesChange,
  onPollingIntervalChange,
} from './diffLogSetters';

describe('diffLogSetters', () => {
  beforeEach(() => {
    setSettingMock.mockReset();
  });

  it('should apply font size only for allowed range', () => {
    onFontSizeChange(11);
    onFontSizeChange(40);

    expect(setSettingMock).toHaveBeenCalledTimes(1);
    expect(setSettingMock).toHaveBeenCalledWith('diffLog.fontSize', 11);
  });

  it('should apply polling interval only for allowed range', () => {
    onPollingIntervalChange(500);
    onPollingIntervalChange(100);
    onPollingIntervalChange(5000);

    expect(setSettingMock).toHaveBeenCalledTimes(1);
    expect(setSettingMock).toHaveBeenCalledWith('diffLog.pollingInterval', 500);
  });

  it('should apply max history slices only for valid integer range', () => {
    onMaxHistorySlicesChange(1);
    onMaxHistorySlicesChange(500);
    onMaxHistorySlicesChange(0);
    onMaxHistorySlicesChange(501);
    onMaxHistorySlicesChange(2.5);

    expect(setSettingMock).toHaveBeenCalledTimes(2);
    expect(setSettingMock).toHaveBeenNthCalledWith(1, 'diffLog.maxHistorySlices', 1);
    expect(setSettingMock).toHaveBeenNthCalledWith(2, 'diffLog.maxHistorySlices', 500);
  });
});
