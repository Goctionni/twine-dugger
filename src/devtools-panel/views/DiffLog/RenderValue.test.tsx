import { cleanup, render } from '@solidjs/testing-library';
import type { JSX } from '@solidjs/web';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { SET_MARKER, TYPE_KEY } from '@/shared/json-safe';
import type { JSONSafeValue } from '@/shared/shared-types';

import { DiffPreview } from './DiffPreview';
import { RenderValue } from './RenderValue';

type AnchorProps = { 'class': string; 'data-anchor': string; 'tabIndex'?: number };

vi.mock('@/devtools-panel/ui/display/Tooltip', () => ({
  Tooltip: (props: { element: (p: AnchorProps) => JSX.Element; tooltip: JSX.Element }) => (
    <>
      {props.element({ 'class': 'tp-anchor', 'data-anchor': 'test', 'tabIndex': 0 })}
      <div class="tp-tooltip">{props.tooltip}</div>
    </>
  ),
}));
afterEach(cleanup);

describe('RenderValue', () => {
  it.each([
    ['string', 'event_dataservice_intro_10_2', '"event_dataservice_intro_10_2"'],
    ['number', 180, '180'],
    ['boolean', true, 'true'],
    ['empty string', '', '""'],
    ['null', null, 'null'],
  ])('renders %s inline with no tooltip', (_label, value: JSONSafeValue, text) => {
    const { container } = render(() => <RenderValue value={value} />);
    expect(container.textContent).toContain(text);
    expect(container.querySelector('.tp-tooltip')).toBeNull();
  });

  it('renders undefined as flat text with no tooltip', () => {
    const { container } = render(() => <RenderValue value={undefined} />);
    expect(container.textContent).toContain('undefined');
    expect(container.querySelector('.tp-tooltip')).toBeNull();
  });

  it.each([
    ['object', { a: 1 }, 'object'],
    ['array', [1, 2], 'array'],
    ['map', { [TYPE_KEY]: 'Map', home: 4 }, 'map'],
    ['set', [SET_MARKER, 'cave', 'castle'], 'set'],
  ])('renders %s as a badge with a preview tooltip', (_label, value: JSONSafeValue, text) => {
    const { container } = render(() => <RenderValue value={value} />);
    expect(container.textContent).toContain(text);
    expect(container.querySelector('.tp-tooltip')).not.toBeNull();
  });

  it('renders a date inline with no tooltip', () => {
    const date = { [TYPE_KEY]: 'Date', Y: 2026, M: 10, D: 20, h: 1, m: 43, s: 8 };
    const { container } = render(() => <RenderValue value={date} />);
    expect(container.textContent).toContain('2026-10-20 01:43:08');
    expect(container.querySelector('.tp-tooltip')).toBeNull();
  });

  it('renders a function as a flat label with no tooltip', () => {
    const fn = { [TYPE_KEY]: 'function', str: 'function onTick() {}' };
    const { container } = render(() => <RenderValue value={fn} />);
    expect(container.textContent).toContain('function');
    expect(container.querySelector('.tp-tooltip')).toBeNull();
  });
});

describe('DiffPreview', () => {
  it('renders a date as text instead of handing off to RenderValue', () => {
    const date = { [TYPE_KEY]: 'Date', Y: 2026, M: 10, D: 20, h: 1, m: 43, s: 8 };
    const { container } = render(() => <DiffPreview value={date} />);
    expect(container.textContent).toContain('2026-10-20 01:43:08');
    expect(container.querySelector('.tp-tooltip')).toBeNull();
  });

  it('renders an object holding a date and terminates', () => {
    const value = {
      next: { [TYPE_KEY]: 'Date', Y: 2026, M: 10, D: 20, h: 6, m: 0, s: 0 },
      count: 3,
    };
    const { container } = render(() => <DiffPreview value={value} />);
    expect(container.textContent).toContain('2026-10-20 06:00:00');
    expect(container.textContent).toContain('count');
  });
});
