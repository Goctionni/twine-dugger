import { setSetting } from '@/devtools-panel/store';

function createValidatingSetter<T>(setter: (v: T) => void, validator: (v: T) => boolean) {
  return (value: T) => (validator(value) ? setter(value) : undefined);
}

export const onFontSizeChange = createValidatingSetter<number>(
  (size) => setSetting('diffLog.fontSize', size),
  (size) => size > 10 && size < 40,
);

export const onPollingIntervalChange = createValidatingSetter<number>(
  (size) => setSetting('diffLog.pollingInterval', size),
  (interval) => interval > 100 && interval < 5000,
);

export const onMaxHistorySlicesChange = createValidatingSetter<number>(
  (maxSlices) => setSetting('diffLog.maxHistorySlices', maxSlices),
  (maxSlices) => Number.isInteger(maxSlices) && maxSlices >= 1 && maxSlices <= 500,
);
