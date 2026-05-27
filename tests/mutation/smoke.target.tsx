/** @jsxImportSource solid-js */

// Section 1: simple deterministic logic for fast mutation feedback.
export function classifySign(value: number): 'negative' | 'zero' | 'positive' {
  if (value < 0) {
    return 'negative';
  }
  if (value === 0) {
    return 'zero';
  }
  return 'positive';
}

// Section 2: Solid component path matching repo jsdom + component workflows.
type SmokePanelProps = {
  title: string;
};

export function SmokePanel(props: SmokePanelProps) {
  return (
    <section data-kind="smoke-panel">
      <h2>{props.title.trim()}</h2>
      <p>smoke body</p>
    </section>
  );
}
