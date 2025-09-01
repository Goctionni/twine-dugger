import clsx from 'clsx';

type Kind = 'add' | 'del' | 'chg' | 'typ' | 'mov';

interface BadgeStyle {
  bg: string;
  text: string;
  border: string;
  label: string;
}

const badgeStyles: Record<Kind, BadgeStyle> = {
  add: {
    bg: 'bg-emerald-900/40',
    text: 'text-emerald-200',
    border: 'border-emerald-700/60',
    label: 'ADD',
  },
  del: { bg: 'bg-red-900/40', text: 'text-red-200', border: 'border-red-700/60', label: 'DEL' },
  chg: {
    bg: 'bg-amber-900/40',
    text: 'text-amber-200',
    border: 'border-amber-700/60',
    label: 'CHG',
  },
  typ: {
    bg: 'bg-violet-900/40',
    text: 'text-violet-200',
    border: 'border-violet-700/60',
    label: 'TYPE',
  },
  mov: {
    bg: 'bg-cyan-900/40',
    text: 'text-cyan-100',
    border: 'border-cyan-700/60',
    label: 'MOVE',
  },
};

interface Props {
  kind: Kind;
}

export function MutationBadge(props: Props) {
  const badgeStyle = () => badgeStyles[props.kind];

  return (
    <span
      class={clsx(
        'inline-block text-[11px] leading-none px-1.5 py-0.5 rounded-md border mr-1.5',
        badgeStyle().bg,
        badgeStyle().text,
        badgeStyle().border,
      )}
    >
      {badgeStyle().label}
    </span>
  );
}
