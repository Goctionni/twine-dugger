import { For } from 'solid-js';

interface Props {
  /** Oldest first, the newest last. At least two */
  values: readonly number[];
}

const WIDTH = 300;
const HEIGHT = 80;
const PADDING = 8;

/** A line through the numbers, with a dot for each, and the newest one in amber */
export function NumberChart(props: Props) {
  const getMin = () => Math.min(...props.values);
  const getMax = () => Math.max(...props.values);
  const getPoints = () => {
    const span = getMax() - getMin() || 1;
    const lastIndex = props.values.length - 1;
    return props.values.map((value, index) => ({
      value,
      x: PADDING + (index * (WIDTH - 2 * PADDING)) / lastIndex,
      y: HEIGHT - PADDING - ((value - getMin()) / span) * (HEIGHT - 2 * PADDING),
    }));
  };

  return (
    <div class="rounded-lg border border-gray-800 px-1.5 pt-1.5 pb-0.5">
      {/* The line is stretched to the width; the dots are not, or they would be ovals */}
      <div class="relative h-20">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          class="block h-full w-full overflow-visible"
          role="img"
          aria-label="Timeline"
        >
          <polyline
            points={getPoints()
              .map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`)
              .join(' ')}
            fill="none"
            stroke-width="1.6"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
            class="stroke-sky-400"
          />
        </svg>
        <For each={getPoints()} keyed={false}>
          {(point, index) => (
            <span
              title={String(point().value)}
              class={[
                'absolute -translate-1/2 rounded-full',
                index === props.values.length - 1 ? 'size-2 bg-amber-400' : 'size-1.75 bg-sky-400',
              ]}
              style={{
                left: `${(point().x / WIDTH) * 100}%`,
                top: `${(point().y / HEIGHT) * 100}%`,
              }}
            />
          )}
        </For>
      </div>
      <div class="mt-0.5 flex justify-between font-mono text-[10px] text-gray-400">
        <span>{props.values.length - 1} changes back</span>
        <span>
          min {getMin()} · max {getMax()}
        </span>
        <span>now</span>
      </div>
    </div>
  );
}
