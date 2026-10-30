interface Props {
  class?: string;
}

/** The mark of a value, or something inside it, that changed in one of the last few updates */
export function ChangedDot(props: Props) {
  return (
    <span
      role="img"
      aria-label="Changed recently"
      title="Changed recently"
      class={['h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300', props.class]}
    />
  );
}
