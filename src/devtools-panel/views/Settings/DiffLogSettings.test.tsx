/** @vitest-environment jsdom */

import { cleanup, render } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const {
  createGetSettingMock,
  setSettingMock,
  numberInputMock,
  booleanInputMock,
  onFontSizeChangeMock,
  onPollingIntervalChangeMock,
  onMaxHistorySlicesChangeMock,
} = vi.hoisted(() => ({
  createGetSettingMock: vi.fn(),
  setSettingMock: vi.fn(),
  numberInputMock: vi.fn(),
  booleanInputMock: vi.fn(),
  onFontSizeChangeMock: vi.fn(),
  onPollingIntervalChangeMock: vi.fn(),
  onMaxHistorySlicesChangeMock: vi.fn(),
}));

vi.mock('@/devtools-panel/store', () => ({
  createGetSetting: createGetSettingMock,
  setSetting: setSettingMock,
}));

vi.mock('@/devtools-panel/ui/inputs/NumberInput', () => ({
  NumberInput: (props: any) => {
    numberInputMock(props);
    return <div />;
  },
}));

vi.mock('@/devtools-panel/ui/inputs/BooleanInput', () => ({
  BooleanInput: (props: any) => {
    booleanInputMock(props);
    return <div />;
  },
}));

vi.mock('./diffLogSetters', () => ({
  onFontSizeChange: onFontSizeChangeMock,
  onPollingIntervalChange: onPollingIntervalChangeMock,
  onMaxHistorySlicesChange: onMaxHistorySlicesChangeMock,
}));

vi.mock('./SettingControl', () => ({
  SettingControl: (props: any) => <div>{props.children(`${props.label}-id`)}</div>,
}));

import { DiffLogSettings } from './DiffLogSettings';

afterEach(() => cleanup());

describe('DiffLogSettings', () => {
  beforeEach(() => {
    createGetSettingMock.mockReset();
    setSettingMock.mockReset();
    numberInputMock.mockReset();
    booleanInputMock.mockReset();

    createGetSettingMock.mockImplementation((key: string) => {
      const values: Record<string, unknown> = {
        'diffLog.fontSize': 14,
        'diffLog.pollingInterval': 200,
        'diffLog.maxHistorySlices': 50,
        'diffLog.headingStyle': 'default',
      };
      return () => values[key];
    });
  });

  it('should wire number settings with expected values and handlers', () => {
    render(() => <DiffLogSettings />);

    expect(numberInputMock).toHaveBeenCalledTimes(3);
    expect(numberInputMock.mock.calls[0]?.[0].value).toBe(14);
    expect(numberInputMock.mock.calls[0]?.[0].onChange).toBe(onFontSizeChangeMock);
    expect(numberInputMock.mock.calls[1]?.[0].value).toBe(200);
    expect(numberInputMock.mock.calls[1]?.[0].onChange).toBe(onPollingIntervalChangeMock);
    expect(numberInputMock.mock.calls[2]?.[0].value).toBe(50);
    expect(numberInputMock.mock.calls[2]?.[0].onChange).toBe(onMaxHistorySlicesChangeMock);
  });

  it('should map heading emphasis toggle to setSetting values', () => {
    render(() => <DiffLogSettings />);

    const boolProps = booleanInputMock.mock.calls[0]?.[0];
    boolProps.onChange(true);
    boolProps.onChange(false);

    expect(setSettingMock).toHaveBeenNthCalledWith(1, 'diffLog.headingStyle', 'distinct');
    expect(setSettingMock).toHaveBeenNthCalledWith(2, 'diffLog.headingStyle', 'default');
  });
});
