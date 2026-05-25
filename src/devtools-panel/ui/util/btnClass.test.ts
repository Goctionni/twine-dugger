import { describe, expect, it } from 'vite-plus/test';

import { btnClass } from './btnClass';

describe('btnClass', () => {
  it('defaults to outline variant when first argument is class value', () => {
    const classes = btnClass('my-custom-class');

    expect(classes).toContain('outline-2');
    expect(classes).toContain('my-custom-class');
  });

  it('uses explicit contained variant and omits default clr-sky', () => {
    const classes = btnClass('contained');

    expect(classes).toContain('bg-clr-700');
    expect(classes).toContain('clr-sky');
  });

  it('does not add clr-sky when explicit clr-* class exists', () => {
    const classes = btnClass('outline', 'clr-red');

    expect(classes).toContain('clr-red');
    expect(classes).not.toContain('clr-sky');
  });

  it('removes classes with [REMOVE]: prefix', () => {
    const classes = btnClass('outline', '[REMOVE]: text-white');

    expect(classes).not.toContain('text-white');
  });
});
