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
    border border-transparent
    bg-clr-700 hover:bg-clr-500
    ring-clr-500
  `,
  outline: `
    border border-transparent
    outline-2 -outline-offset-2 outline-clr-700 ring-clr-500
    hover:outline-transparent hover:bg-clr-500
  `,
} as const;

type Variant = keyof typeof variants;
const variantKeys = Object.keys(variants) as Variant[];

type ParsedInput = {
  variant: Variant;
  classes: ClassValue[];
};
function parseInput(variantOrClass?: Variant | ClassValue, ...rest: ClassValue[]): ParsedInput {
  if (typeof variantOrClass === 'string' && variantKeys.includes(variantOrClass as Variant)) {
    return { variant: variantOrClass as Variant, classes: rest };
  }
  return { variant: 'outline', classes: [variantOrClass, ...rest] };
}

function forEachClass(classStr: string, callback: (c: string) => void) {
  return classStr.split(/\s+/).filter(Boolean).forEach(callback);
}

export function btnClass(variantOrClass?: Variant | ClassValue, ...rest: ClassValue[]): string {
  const { variant, classes: classValues } = parseInput(variantOrClass, ...rest);

  // Base classes
  const classes = new Set<string>(BASE);

  // Add variant classes
  forEachClass(variants[variant], (c) => classes.add(c));

  // Parse class values
  for (const classValue of classValues) {
    const classStr = clsx(classValue);
    if (classStr.startsWith('- ')) {
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
