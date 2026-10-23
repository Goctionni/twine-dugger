import { cleanup, render } from '@solidjs/testing-library';
import { afterEach, expect, it } from 'vite-plus/test';

import { NAN_MARKER, NEGATIVE_INFINITY_MARKER, UNDEFINED_MARKER } from '@/shared/json-safe';

import { RenderValue } from './RenderValue';

afterEach(cleanup);

it('shows NaN and the infinities as a red badge, and undefined plainly', () => {
  const { getByText } = render(() => (
    <>
      <RenderValue value={NAN_MARKER} />
      <RenderValue value={NEGATIVE_INFINITY_MARKER} />
      <RenderValue value={UNDEFINED_MARKER} />
    </>
  ));

  expect(getByText('NaN').className).toContain('bg-red-600');
  expect(getByText('-Infinity').className).toContain('bg-red-600');
  expect(getByText('undefined').className).not.toContain('bg-red-600');
});

it('shows them as plain text when the highlight is disabled', () => {
  const { getByText } = render(() => <RenderValue value={NAN_MARKER} disableInvalidHighlight />);
  expect(getByText('NaN').className).not.toContain('bg-red-600');
});
