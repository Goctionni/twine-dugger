import { cleanup, render } from '@solidjs/testing-library';
import { createSignal, flush } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { BooleanInput } from './BooleanInput';

afterEach(cleanup);

function setup(props: { readOnly?: boolean; disabled?: boolean; follow?: boolean } = {}) {
  const [getValue, setValue] = createSignal(true);
  const onChange = vi.fn((value: boolean) => {
    if (props.follow) setValue(value);
  });
  const view = render(() => (
    <BooleanInput
      label="Flag"
      value={getValue()}
      onChange={onChange}
      readOnly={props.readOnly}
      disabled={props.disabled}
    />
  ));
  const radios = () => view.getAllByRole<HTMLInputElement>('radio');
  const checked = () => radios().map((radio) => radio.checked);
  return { ...view, onChange, radios, checked, setValue };
}

describe('BooleanInput', () => {
  it('is a named group of two radios that shows the value', () => {
    const { getByRole, checked } = setup();
    expect(getByRole('radiogroup').getAttribute('aria-label')).toBe('Flag');
    expect(checked()).toEqual([true, false]);
  });

  it('reports the other choice when it is chosen, and nothing for the one that is chosen', () => {
    const { radios, onChange } = setup();
    radios()[1]!.click();
    expect(onChange).toHaveBeenCalledWith(false);

    onChange.mockClear();
    radios()[0]!.click();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('only changes when the value does: a choice that does not arrive is undone', () => {
    const { radios, checked, setValue } = setup();
    radios()[1]!.click();
    flush();
    expect(checked()).toEqual([true, false]);

    setValue(false);
    flush();
    expect(checked()).toEqual([false, true]);
  });

  it('changes with the value that it is given', () => {
    const { radios, checked } = setup({ follow: true });
    radios()[1]!.click();
    flush();
    expect(checked()).toEqual([false, true]);
  });

  it('does not change when it is read only, and can still be focused', () => {
    const { radios, onChange, checked } = setup({ readOnly: true, follow: true });
    radios()[1]!.click();
    flush();
    expect(onChange).not.toHaveBeenCalled();
    expect(checked()).toEqual([true, false]);
    radios()[0]!.focus();
    expect(document.activeElement).toBe(radios()[0]);
  });

  it('cannot be focused when it is disabled', () => {
    const { radios } = setup({ disabled: true });
    expect(radios().every((radio) => radio.matches(':disabled'))).toBe(true);
  });
});

describe('BooleanInput cursor', () => {
  const labelClasses = (container: HTMLElement) =>
    [...container.querySelectorAll('label')].map((label) => ({
      pointer: label.classList.contains('cursor-pointer'),
      hover: label.className.includes('hover:bg-white/10'),
    }));

  it('only shows the half that a click would change as clickable', () => {
    const { container } = setup();
    expect(labelClasses(container)).toEqual([
      { pointer: false, hover: false },
      { pointer: true, hover: true },
    ]);
  });

  it('shows neither half as clickable when it is read only', () => {
    const { container } = setup({ readOnly: true });
    expect(labelClasses(container)).toEqual([
      { pointer: false, hover: false },
      { pointer: false, hover: false },
    ]);
  });

  it('follows the value', () => {
    const { container, setValue } = setup();
    setValue(false);
    flush();
    expect(labelClasses(container)).toEqual([
      { pointer: true, hover: true },
      { pointer: false, hover: false },
    ]);
  });
});
