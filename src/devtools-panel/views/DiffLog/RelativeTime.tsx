import { createSignal, onCleanup, untrack } from 'solid-js';

interface Props {
  date: Date;
}

export function RelativeTime(props: Props) {
  const [unitValueNext, setUnitValueNext] = createSignal(
    getDiffUnitValueNext(untrack(() => props.date)),
  );
  const dateStr = () => formatRelativeTime(unitValueNext());

  let timeout = setTimeout(
    updateDateStr,
    untrack(() => unitValueNext().next),
  );
  function updateDateStr() {
    setUnitValueNext(getDiffUnitValueNext(props.date));
    timeout = setTimeout(updateDateStr, unitValueNext().next);
  }

  onCleanup(() => {
    clearTimeout(timeout);
  });

  return <strong class="text-gray-500">({dateStr()})</strong>;
}

type UnitValueNext = {
  unit: 'second' | 'minute' | 'hour';
  value: number;
  next: number;
};

function getDiffUnitValueNext(date: Date): UnitValueNext {
  const now = Date.now();
  const ref = date.getTime();
  const diff = now - ref;
  const seconds = diff / 1000;
  if (seconds < 90) {
    return {
      unit: 'second',
      value: -Math.floor(seconds),
      next: (1 - (seconds % 1)) * 1000,
    };
  }
  const minutes = seconds / 60;
  if (minutes < 90) {
    return {
      unit: 'minute',
      value: -Math.floor(minutes),
      next: (1 - (minutes % 1)) * 1000 * 60,
    };
  }

  const hours = minutes / 60;
  return {
    unit: 'hour',
    value: -Math.floor(hours),
    next: (1 - (hours % 1)) * 1000 * 60 * 60,
  };
}

function formatRelativeTime({ unit, value }: UnitValueNext) {
  const rtf = new Intl.RelativeTimeFormat('en', {
    localeMatcher: 'best fit',
    style: 'short',
  });
  return rtf.format(value, unit);
}
