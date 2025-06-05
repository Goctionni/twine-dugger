interface TooltipProps {
  text: string;
}

export function Tooltip(props: TooltipProps) {
  return (
    <span class="relative group inline-flex items-center justify-center">
      <span class="w-4 h-4 rounded-full bg-blue-950 text-white text-[10px] font-bold flex items-center justify-center cursor-help">
        ?
      </span>
      <span class="absolute z-10 hidden group-hover:block bg-blue-950 text-white text-xs rounded px-2 py-1 -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap shadow-lg">
        {props.text}
      </span>
    </span>
  );
}