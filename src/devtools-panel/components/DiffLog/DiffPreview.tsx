import clsx from 'clsx';
import { createMemo, JSX, Match, Switch } from 'solid-js';

import { ArrayValue, MapValue, ObjectValue, SetValue, Value } from '@/shared/shared-types';

import { RenderValue } from './RenderValue';

type ObjectType = ObjectValue | MapValue | ArrayValue | SetValue;

// Public component: reads config via hooks, then renders via an inner, typed Switch
interface Props {
  value: ObjectType;
  class?: string;
}
export function DiffPreview(props: Props) {
  const depth = usePreviewDepth();
  const maxItems = usePreviewLength();
  const layout = usePreviewLayout();

  return (
    <code class={clsx('font-mono text-gray-200 whitespace-pre-wrap leading-4', props.class)}>
      <DiffPreviewInner
        value={props.value}
        remainingDepth={depth()}
        maxItems={maxItems()}
        layout={layout()}
        level={0}
      />
    </code>
  );
}

const ELLIPSIS = '…';

type Layout = 'inline' | 'pretty';

interface InnerProps {
  value: Value;
  remainingDepth: number;
  maxItems: number;
  layout: Layout;
  level: number;
}

function DiffPreviewInner(props: InnerProps): JSX.Element {
  return (
    <Switch>
      <Match when={!props.value || typeof props.value !== 'object'}>
        <RenderValue value={props.value} />
      </Match>
      <Match when={Array.isArray(props.value)}>
        <ArrayPreview {...props} value={props.value as ArrayValue} />
      </Match>
      <Match when={props.value instanceof Map}>
        <MapPreview {...props} value={props.value as MapValue} />
      </Match>
      <Match when={props.value instanceof Set}>
        <SetPreview {...props} value={props.value as SetValue} />
      </Match>
      <Match when={isPlainObject(props.value)}>
        <ObjectPreview {...props} value={props.value as ObjectValue} />
      </Match>
    </Switch>
  );
}

function ArrayPreview(props: InnerProps & { value: ArrayValue }) {
  return <ArraySetPreview {...props} prefix="[" suffix="]" />;
}

function SetPreview(props: InnerProps & { value: SetValue }) {
  return <ArraySetPreview {...props} prefix="new Set(" suffix=")" value={[...props.value]} />;
}

function ArraySetPreview(
  props: InnerProps & { value: ArrayValue; prefix: string; suffix: string },
): JSX.Element {
  const result = createMemo(() => {
    if (props.remainingDepth <= 0) return <span>{`[Array(${props.value.length})]`}</span>;
    const items = props.value.slice(0, props.maxItems);
    const indent = (plus = 1) => '  '.repeat(props.level + plus);
    const output: JSX.Element[] = [props.prefix];
    if (props.layout === 'pretty') output.push(<br />);

    for (let i = 0; i < items.length; i++) {
      if (props.layout === 'pretty') output.push(indent());
      else if (i > 0) output.push(' ');
      output.push(
        <DiffPreviewInner
          value={items[i]}
          remainingDepth={props.remainingDepth - 1}
          layout={props.layout}
          level={props.level + 1}
          maxItems={props.maxItems}
        />,
      );
      if (i + 1 < props.value.length) output.push(',');
      if (props.layout === 'pretty') output.push(<br />);
    }
    if (props.value.length > items.length) {
      if (props.layout === 'pretty') output.push(indent());
      output.push(`${ELLIPSIS} (${props.value.length - items.length} more items)`);
      if (props.layout === 'pretty') output.push(<br />);
    }
    if (props.layout === 'pretty') output.push(indent(0));
    output.push(props.suffix);
    return output;
  });
  return <>{result()}</>;
}

function MapPreview(props: InnerProps & { value: MapValue }) {
  return (
    <ObjectMapPreview {...props} prefix="new Map([" suffix="])" value={mapToObj(props.value)} />
  );
}

function ObjectPreview(props: InnerProps & { value: ObjectValue }) {
  return <ObjectMapPreview {...props} prefix="{" suffix="}" />;
}

function ObjectMapPreview(
  props: InnerProps & { value: ObjectValue; prefix: string; suffix: string },
): JSX.Element {
  const result = createMemo(() => {
    if (props.remainingDepth <= 0) return <span>{`[Array(${props.value.length})]`}</span>;
    const entries = Object.entries(props.value);
    const items = entries.slice(0, props.maxItems) as Array<[string, Value]>;
    const indent = (plus = 1) => '  '.repeat(props.level + plus);
    const output: JSX.Element[] = [props.prefix];
    if (props.layout === 'pretty') output.push(<br />);

    for (let i = 0; i < items.length; i++) {
      if (props.layout === 'pretty') output.push(indent());
      else if (i > 0) output.push(' ');
      const [key, value] = items[i]!;
      output.push(<code class="text-sky-400">{key}</code>);
      output.push(': ');
      output.push(
        <DiffPreviewInner
          value={value}
          remainingDepth={props.remainingDepth - 1}
          layout={props.layout}
          level={props.level + 1}
          maxItems={props.maxItems}
        />,
      );
      if (i + 1 < entries.length) output.push(',');
      if (props.layout === 'pretty') output.push(<br />);
    }
    if (entries.length > items.length) {
      if (props.layout === 'pretty') output.push(indent());
      output.push(`${ELLIPSIS} (${entries.length - items.length} more properties)`);
      if (props.layout === 'pretty') output.push(<br />);
    }
    if (props.layout === 'pretty') output.push(indent(0));
    output.push(props.suffix);
    return output;
  });

  return <>{result()}</>;
}

function mapToObj(map: MapValue) {
  const obj: ObjectValue = {};
  for (const [key, value] of map.entries()) {
    obj[key] = value;
  }
  return obj;
}

function isPlainObject(value: Value) {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  if (value instanceof Map) return false;
  if (value instanceof Set) return false;
  return true;
}

// -----------------------------------------------------------------------------
// Mock hooks for configuration (replace with your settings store later)
function usePreviewDepth() {
  return () => 1;
}
function usePreviewLength() {
  return () => 5;
}
function usePreviewLayout() {
  // 'inline' keeps everything on one line; 'pretty' breaks across lines with indentation.
  return (): Layout => 'pretty';
}
