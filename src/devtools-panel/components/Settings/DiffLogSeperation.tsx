import { Component } from 'solid-js';
import { BooleanInput } from './InputTypes';

export const DiffLogSeparation: Component = () => {
  return (
    <div class="mb-4">
      <label class="text-sm font-medium mb-2 flex items-center gap-2">
        Easier Diff Log Separation
        <span class="relative group inline-flex items-center justify-center">
          <span
            class="w-4 h-4 rounded-full bg-blue-950 text-white text-[10px] font-bold flex items-center justify-center cursor-help"
          >
            ?
          </span>
          <span class="absolute z-10 hidden group-hover:block bg-blue-950 text-white text-xs rounded px-2 py-1 -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap shadow-lg">
            Show more explicit seperation between Diff Log states
          </span>
        </span>
      </label>
      <BooleanInput settingKey="diffLogSeparation" />
    </div>
  );
};