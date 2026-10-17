import type { ParentProps } from 'solid-js';

interface Props {
  name: string;
  onClick: () => void;
}

export function BreadcrumbItem(props: ParentProps<Props>) {
  return (
    <span class="inline-flex items-stretch border-r border-gray-700 [anchor-scope:--crumb] hover:bg-gray-700">
      <button
        type="button"
        class="cursor-pointer py-1.5 pl-2 text-sky-400 [anchor-name:--crumb] not-last:pr-1.5 last:pr-2"
        onClick={() => props.onClick()}
      >
        {props.name}
      </button>
      {props.children}
    </span>
  );
}
