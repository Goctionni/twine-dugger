import { createMemo } from 'solid-js';
import { MagnifyingGlassMinusIcon } from '../../Icons/ZoomOutIcon';
import { MagnifyingGlassPlusIcon } from '../../Icons/ZoomInIcon';

interface FontSizeControlsProps {
  value: () => number;
  setValue: (v: number) => void;
  min?: number;
  max?: number;
}

export function FontSizeControls(props: FontSizeControlsProps) {
  const { value, setValue, min = -Infinity, max = Infinity } = props;

  const fontSize = createMemo(() => value());

  const increase = () => {
    const newSize = Math.min(fontSize() + 1, max);
    setValue(newSize);
  };

  const decrease = () => {
    const newSize = Math.max(fontSize() - 1, min);
    setValue(newSize);
  };

  return (
    <div class="flex items-center gap-2 ml-2">
      <button onClick={decrease} class="text-gray-400 hover:text-white" title="Zoom Out">
        <MagnifyingGlassMinusIcon class="w-4 h-4" />
      </button>
      <button onClick={increase} class="text-gray-400 hover:text-white" title="Zoom In">
        <MagnifyingGlassPlusIcon class="w-4 h-4" />
      </button>
    </div>
  );
}