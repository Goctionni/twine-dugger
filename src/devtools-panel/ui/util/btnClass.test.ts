import { describe, expect, it } from 'vite-plus/test';

import { btnClass } from './btnClass';

describe('btnClass', () => {
  it('defaults to outline variant when first argument is class value', () => {
    const classes = btnClass('my-custom-class');

    expect(classes.includes('outline-2')).toBe(true);
    expect(classes.includes('my-custom-class')).toBe(true);
  });

  it('uses explicit contained variant and omits default clr-sky', () => {
    const classes = btnClass('contained');

    expect(classes.includes('bg-clr-700')).toBe(true);
    expect(classes.includes('clr-sky')).toBe(true);
  });

  it('does not add clr-sky when explicit clr-* class exists', () => {
    const classes = btnClass('outline', 'clr-red');

    expect(classes.includes('clr-red')).toBe(true);
    expect(classes.includes('clr-sky')).toBe(false);
  });

  it('removes classes with [REMOVE]: prefix', () => {
    const classes = btnClass('outline', '[REMOVE]: text-white');

    expect(classes.includes('text-white')).toBe(false);
  });
});
