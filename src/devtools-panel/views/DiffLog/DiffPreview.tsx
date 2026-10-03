import type { JSX } from '@solidjs/web';
import clsx from 'clsx';
import { createMemo, Match, Switch } from 'solid-js';

import { getContainerKeys, getJsonType } from '@/shared/json-safe';
import type { JSONSafeArray, JSONSafeObject, JSONSafeValue } from '@/shared/shared-types';

import { RenderValue } from './RenderValue';

// Public component: reads config via hooks, then renders via an inner, typed Switch
interface Props {
  value: JSONSafeValue;
  class?: string;
}
export function DiffPreview(props: Props) {
  const depth = usePreviewDepth();
  const maxItems = usePreviewLength();
  const layout = usePreviewLayout();

  return (
    <code class={clsx('font-mono leading-4 whitespace-pre-wrap text-gray-200', props.class)}>
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

type InnerProps<T = JSONSafeValue, Rest = unknown> = {
  value: T;
  remainingDepth: number;
  maxItems: number;
  layout: Layout;
  level: number;
} & Rest;

function DiffPreviewInner(props: InnerProps): JSX.Element {
  const type = () => getJsonType(props.value);
  return (
    <Switch>
      <Match when={type() === 'array'}>
        <ArraySetPreview {...props} prefix="[" suffix="]" items={props.value as JSONSafeArray} />
      </Match>
      <Match when={type() === 'set'}>
        <ArraySetPreview
          {...props}
          prefix="new Set("
          suffix=")"
          items={(props.value as JSONSafeArray).slice(1)}
        />
      </Match>
      <Match when={type() === 'map'}>
        <ObjectMapPreview {...props} prefix="new Map([" suffix="])" type="map" />
      </Match>
      <Match when={type() === 'object'}>
        <ObjectMapPreview {...props} prefix="{" suffix="}" type="object" />
      </Match>
      <Match when={true}>
        <RenderValue value={props.value} />
      </Match>
    </Switch>
  );
}

function ArraySetPreview(
  props: InnerProps<JSONSafeValue, { prefix: string; suffix: string; items: JSONSafeArray }>,
): JSX.Element {
  const result = createMemo(() => {
    if (props.remainingDepth <= 0) return <span>{`[Array(${props.items.length})]`}</span>;
    const items = props.items.slice(0, props.maxItems);
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
      if (i + 1 < props.items.length) output.push(',');
      if (props.layout === 'pretty') output.push(<br />);
    }
    if (props.items.length > items.length) {
      if (props.layout === 'pretty') output.push(indent());
      output.push(`${ELLIPSIS} (${props.items.length - items.length} more items)`);
      if (props.layout === 'pretty') output.push(<br />);
    }
    if (props.layout === 'pretty') output.push(indent(0));
    output.push(props.suffix);
    return output;
  });
  return <>{result()}</>;
}

function ObjectMapPreview(
  props: InnerProps<JSONSafeValue, { prefix: string; suffix: string; type: 'map' | 'object' }>,
): JSX.Element {
  const result = createMemo(() => {
    const object = props.value as JSONSafeObject;
    const entries = getContainerKeys(object, props.type).map((key): [string, JSONSafeValue] => [
      `${key}`,
      object[key]!,
    ]);
    if (props.remainingDepth <= 0) {
      return <span>{`[Object(${entries.length} properties)]`}</span>;
    }
    const items = entries.slice(0, props.maxItems);
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
