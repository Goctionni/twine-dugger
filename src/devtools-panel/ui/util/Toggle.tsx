interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function Toggle(props: ToggleProps) {
  return (
    <label class="group flex cursor-pointer items-center gap-2.5 select-none">
      {props.label && (
        <span class="text-xs font-semibold text-slate-400 uppercase transition-colors duration-150 group-hover:text-slate-200">
          {props.label}
        </span>
      )}
      <div class="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={props.checked}
          onChange={(e) => props.onChange(e.currentTarget.checked)}
          class="peer sr-only"
        />

        <div
          class="h-5 w-9 rounded-full border border-slate-700 bg-slate-800 transition-all duration-200 
                    group-hover:border-slate-500
                    peer-checked:border-sky-500 peer-checked:bg-sky-600 
                    peer-focus-visible:ring-2 peer-focus-visible:ring-sky-500/50"
        />

        <div
          class="absolute top-1 left-1 h-3 w-3 rounded-full bg-slate-400 transition-transform duration-200 
                    peer-checked:translate-x-4 peer-checked:bg-white"
        />
      </div>
    </label>
  );
}
