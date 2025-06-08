import { JSX } from 'solid-js';

export function CrossIcon(props: JSX.SvgSVGAttributes<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="3.5"
      stroke="currentColor"
      {...props} // Spread any additional props like class, width, height
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M4 4 L 20 20" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M20 4 L 4 20" />
    </svg>
  );
}
