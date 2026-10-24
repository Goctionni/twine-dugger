// The disc is drawn in a box of 24: the star keeps its size of 4.93px at 14px, wherever the disc is
const SIZE = 14;
const UNIT = 24 / SIZE;
const OUTER_RADIUS = 4.93 * UNIT;
const INNER_RADIUS = OUTER_RADIUS * 0.432;
const CENTER_Y = 12 + 0.4 * UNIT;

const STAR_PATH =
  'M' +
  Array.from({ length: 10 }, (_, point) => {
    const angle = -Math.PI / 2 + (point * Math.PI) / 5;
    const radius = point % 2 ? INNER_RADIUS : OUTER_RADIUS;
    return `${(12 + radius * Math.cos(angle)).toFixed(2)} ${(CENTER_Y + radius * Math.sin(angle)).toFixed(2)}`;
  }).join('L') +
  'Z';

/**
 * An amber disc with a star, on the bottom-right corner of the icon of a tile. The star and the
 * ring around the disc are the color of the panel, so nothing of the icon shows through the star.
 */
export function PinMark() {
  return (
    <span
      role="img"
      aria-label="Pinned"
      title="Pinned"
      class="absolute -right-[5px] -bottom-[5px] z-10 size-3.5 rounded-full shadow-[0_0_0_2px_var(--color-gray-900)]"
    >
      <svg viewBox="0 0 24 24" class="block size-full" aria-hidden="true">
        <circle cx="12" cy="12" r="12" class="fill-amber-400" />
        <path d={STAR_PATH} class="fill-gray-900" />
      </svg>
    </span>
  );
}
