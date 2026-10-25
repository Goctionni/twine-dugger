import { cleanup, render } from '@solidjs/testing-library';
import { afterEach, expect, it } from 'vite-plus/test';

import { NumberChart } from './NumberChart';

afterEach(cleanup);

it('has a dot for every number, the newest in amber, and says how far it goes', () => {
  const { container, getByText } = render(() => <NumberChart values={[3, 7, 5]} />);

  const dots = [...container.querySelectorAll('[title]')];
  expect(dots).toHaveLength(3);
  expect(dots.map((dot) => dot.getAttribute('title'))).toEqual(['3', '7', '5']);
  expect(dots.at(-1)!.getAttribute('class')).toContain('bg-amber-400');
  expect(dots[0]!.getAttribute('class')).toContain('bg-sky-400');
  expect(getByText('2 changes back')).toBeTruthy();
  expect(getByText('min 3 · max 7')).toBeTruthy();
});

it('puts the highest number at the top and the lowest at the bottom', () => {
  const { container } = render(() => <NumberChart values={[0, 10]} />);
  const [low, high] = [...container.querySelectorAll<HTMLElement>('[title]')].map((dot) =>
    parseFloat(dot.style.top),
  );
  expect(high).toBeLessThan(low!);
});

it('draws a flat line when every number is the same', () => {
  const { container } = render(() => <NumberChart values={[4, 4, 4]} />);
  const ys = new Set(
    [...container.querySelectorAll<HTMLElement>('[title]')].map((dot) => dot.style.top),
  );
  expect(ys.size).toBe(1);
});
