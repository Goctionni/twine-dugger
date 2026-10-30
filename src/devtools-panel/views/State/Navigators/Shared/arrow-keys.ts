export type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

export const isArrowKey = (key: string): key is ArrowKey =>
  ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
