// ui/btnClass.ts
import clsx, { type ClassValue } from 'clsx';

const BASE = [
  'py-1',
  'cursor-pointer',
  'shadow-sm',
  'text-sm',
  'font-medium',
  'rounded-md',
  'focus:outline-none',
  'focus:ring-2',
  'focus:ring-offset-2',
  'focus:ring-offset-gray-800',
  'disabled:bg-gray-500',
  'disabled:text-gray-300',
  'disabled:pointer-events-none',
  'disabled:hover:bg-gray-500',
  'px-4',
  'text-white',
] as const;

const variants = {
  contained: `
    ${BASE.join(' ')}
    border border-transparent
    bg-clr-700 hover:bg-clr-500
    ring-clr-500
  `,
  outline: `
    ${BASE.join(' ')}
    border border-transparent
    outline-2 -outline-offset-2 outline-clr-700 ring-clr-500
    hover:outline-transparent hover:bg-clr-500
  `,
  icon: `
    p-0.5
    cursor-pointer
    shadow-sm
    text-sm
    font-medium
    rounded-md
    focus:outline-none
    focus:ring-2
    focus:ring-offset-2
    focus:ring-offset-gray-800
    disabled:bg-gray-500
    disabled:text-gray-300
    disabled:pointer-events-none
    disabled:hover:bg-gray-500
    text-white

    border border-transparent
    outline-2 -outline-offset-2 outline-clr-700 ring-clr-500
    hover:outline-transparent hover:bg-clr-500

    flex items-center justify-center
    material-symbols-outlined text-center
    aspect-square
  `,
} as const;

type Variant = keyof typeof variants;

function forEachClass(classStr: string, callback: (c: string) => void) {
  return classStr.split(/\s+/).filter(Boolean).forEach(callback);
}

export function btnClass(variant: Variant | null, ...classValues: ClassValue[]): string {
  const classes = new Set<string>();

  // Add variant classes
  forEachClass(variant ? variants[variant] : '', (c) => classes.add(c));

  // Parse class values
  for (const classValue of classValues) {
    const classStr = clsx(classValue);
    if (classStr.startsWith('[REMOVE]: ')) {
      forEachClass(classStr.slice(2), (c) => classes.delete(c));
    } else {
      forEachClass(classStr, (c) => classes.add(c));
    }
  }

  // Add sky color if none has been set
  const classArr = [...classes];
  if (!classArr.some((c) => c.startsWith('clr-'))) {
    classArr.splice(0, 0, 'clr-sky');
  }

  return classArr.join(' ');
}
